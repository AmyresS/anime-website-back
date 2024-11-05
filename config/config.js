require('dotenv').config();
const path = require('path');

module.exports = {
  networkPath: path.resolve(process.env.NETWORK_PATH || 'F:/Media/Anime'),
  maxConcurrentProcesses: parseInt(process.env.MAX_CONCURRENT_PROCESSES, 10) || 2,
};
