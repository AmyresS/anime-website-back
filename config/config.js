require('dotenv').config();
const path = require('path');

module.exports = {
  networkPath: path.resolve(process.env.NETWORK_PATH || 'F:/Media/Anime/'),
  maxConcurrentProcesses: parseInt(process.env.MAX_CONCURRENT_PROCESSES, 10) || 2,
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: 'postgres',
  },
};
