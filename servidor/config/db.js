const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

db.on('connect', () => {
    console.log('Nueva conexión establecida con PostgreSQL.');
});

db.on('error', (error) => {
    console.error('Error inesperado en PostgreSQL:', error);
});

module.exports = db;
