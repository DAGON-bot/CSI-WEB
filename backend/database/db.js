const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT,
            "habboId" TEXT,
            "figureString" TEXT,
            motto TEXT,
            "verifyCode" TEXT,
            verified BOOLEAN NOT NULL DEFAULT FALSE,
            role TEXT NOT NULL DEFAULT 'member',
            "lastLogin" TIMESTAMPTZ,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log("PostgreSQL bağlandı.");
}

module.exports = {
    pool,
    initDatabase
};