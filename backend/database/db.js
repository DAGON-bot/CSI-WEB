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

     await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "resetCode" TEXT,
        ADD COLUMN IF NOT EXISTS "resetExpiresAt" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
        ADD COLUMN IF NOT EXISTS "resetVerifiedAt" TIMESTAMPTZ
    `);
    await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS badge TEXT,
    ADD COLUMN IF NOT EXISTS rank TEXT
    `);

    await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS department TEXT
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
        id BIGSERIAL PRIMARY KEY,
        "userId" BIGINT NOT NULL,
        role TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT user_roles_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT user_roles_unique
            UNIQUE ("userId", role)
    )
`);

await pool.query(`
    INSERT INTO user_roles ("userId", role)
    SELECT id, role
    FROM users
    WHERE role IS NOT NULL
      AND TRIM(role) <> ''
    ON CONFLICT ("userId", role) DO NOTHING
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
        id BIGSERIAL PRIMARY KEY,

        "performedBy" TEXT NOT NULL,
        "targetUsername" TEXT NOT NULL,

        "actionType" TEXT NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP
    )
`);

    console.log("PostgreSQL bağlandı.");
}

module.exports = {
    pool,
    initDatabase
};