// Root entrypoint for Hostinger, cPanel, and cloud deployments
const path = require('path');
const serverDir = path.join(__dirname, 'server');
const serverNodeModules = path.join(serverDir, 'node_modules');

if (module.paths && !module.paths.includes(serverNodeModules)) {
  module.paths.unshift(serverNodeModules);
}

try {
  process.chdir(serverDir);
} catch (err) {
  console.error('[Startup] Failed to change directory to server:', err);
}

require(path.join(serverDir, 'server.js'));
