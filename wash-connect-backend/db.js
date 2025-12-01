const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '123456';
const DB_NAME = process.env.DB_NAME || 'wash_connect';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;

if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('Missing required database configuration. Please set DB_HOST, DB_USER, and DB_NAME.');
}

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;