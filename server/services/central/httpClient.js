/**
 * Lightweight Zero-Dependency HTTP Client using native fetch.
 * Works seamlessly across modern Node.js, cPanel, and VPS without requiring axios.
 */

async function post(url, data, { headers = {}, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: typeof data === 'string' ? data : JSON.stringify(data),
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const error = new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      error.response = { status: res.status, data: json };
      throw error;
    }

    return { status: res.status, data: json };
  } finally {
    clearTimeout(timer);
  }
}

async function get(url, { headers = {}, timeout = 10000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const error = new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      error.response = { status: res.status, data: json };
      throw error;
    }

    return { status: res.status, data: json };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  post,
  get,
};
