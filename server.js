// Root entrypoint for Hostinger, cPanel, and cloud deployments
const path = require('path');
const serverDir = path.join(__dirname, 'server');

try {
  process.chdir(serverDir);
} catch (err) {
  console.error('[Startup] Failed to change directory to server:', err);
}

require(path.join(serverDir, 'server.js'));
