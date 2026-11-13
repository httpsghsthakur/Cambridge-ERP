const NodeCache = require('node-cache');
const { createClient } = require('redis');

// Initialize memory cache fallback
const memoryCache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

// Initialize Redis client if REDIS_URL is provided (Docker/VPS)
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });
  
  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  redisClient.connect().then(() => {
    console.log('Connected to Redis Cache Server');
  }).catch(err => {
    console.log('Failed to connect to Redis. Falling back to memory cache.');
    redisClient = null;
  });
}

/**
 * Hybrid cache middleware
 * @param {number} duration - The cache TTL in seconds.
 */
const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userPart = req.user ? `${req.user.role}-${req.user.id}` : 'public';
    const key = `erp_cache:${req.originalUrl || req.url}:${userPart}`;

    try {
      // 1. Try Redis first
      if (redisClient && redisClient.isOpen) {
        const cachedData = await redisClient.get(key);
        if (cachedData) {
          return res.json(JSON.parse(cachedData));
        }
      } 
      // 2. Fallback to memory cache
      else {
        const cachedData = memoryCache.get(key);
        if (cachedData) {
          return res.json(cachedData);
        }
      }
    } catch (err) {
      console.error('Cache retrieval error:', err);
    }

    // Wrap res.json to capture response
    const originalJson = res.json;
    res.json = (body) => {
      // Don't cache errors
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          if (redisClient && redisClient.isOpen) {
            redisClient.setEx(key, duration, JSON.stringify(body));
          } else {
            memoryCache.set(key, body, duration);
          }
        } catch (err) {
          console.error('Cache set error:', err);
        }
      }
      return originalJson.call(res, body);
    };

    next();
  };
};

/**
 * Utility to clear cache manually if needed
 */
const clearCache = async (keyPrefix) => {
  try {
    if (redisClient && redisClient.isOpen) {
      // Use SCAN or KEYS to find keys matching the prefix, then DEL them
      // For simplicity in a small app, keys() is fine, but in production scan is better.
      const keys = await redisClient.keys(`erp_cache:*${keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      const keys = memoryCache.keys();
      const keysToDelete = keys.filter(k => k.includes(keyPrefix));
      if (keysToDelete.length > 0) {
        memoryCache.del(keysToDelete);
      }
    }
  } catch (err) {
    console.error('Clear cache error:', err);
  }
};

module.exports = { cacheMiddleware, clearCache };
