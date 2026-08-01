const { pool } = require("../database/db");

async function getUser(username) {
    const result = await pool.query(
        `SELECT *
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
    );

    return result.rows[0];
}

async function createUser(username, verifyCode) {
    const result = await pool.query(
        `INSERT INTO users (username, "verifyCode")
         VALUES ($1, $2)
         RETURNING id`,
        [username, verifyCode]
    );

    return result.rows[0].id;
}

async function verifyUser(username) {
    await pool.query(
        `UPDATE users
         SET verified = TRUE
         WHERE LOWER(username) = LOWER($1)`,
        [username]
    );
}

async function getVerifyCode(username) {
    const result = await pool.query(
        `SELECT "verifyCode"
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
    );

    return result.rows[0];
}

async function updateHabboInfo(username, habbo) {
    await pool.query(
        `UPDATE users
         SET "habboId" = $1,
             "figureString" = $2,
             motto = $3,
             "lastLogin" = CURRENT_TIMESTAMP
         WHERE LOWER(username) = LOWER($4)`,
        [
            habbo.uniqueId,
            habbo.figureString,
            habbo.motto,
            username
        ]
    );
}

async function setPassword(username, password) {
    await pool.query(
        `UPDATE users
         SET password = $1
         WHERE LOWER(username) = LOWER($2)`,
        [password, username]
    );
}

async function updateLastLogin(username) {
    await pool.query(
        `UPDATE users
         SET "lastLogin" = CURRENT_TIMESTAMP
         WHERE LOWER(username) = LOWER($1)`,
        [username]
    );
}

async function createPasswordReset(username, resetCode) {
    const result = await pool.query(
        `UPDATE users
         SET "resetCode" = $1,
             "resetExpiresAt" = CURRENT_TIMESTAMP + INTERVAL '10 minutes',
             "resetToken" = NULL,
             "resetVerifiedAt" = NULL
         WHERE LOWER(username) = LOWER($2)
         RETURNING id`,
        [resetCode, username]
    );

    return result.rows[0];
}

async function getPasswordReset(username) {
    const result = await pool.query(
        `SELECT
            username,
            "resetCode",
            "resetExpiresAt",
            "resetToken",
            "resetVerifiedAt"
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
    );

    return result.rows[0];
}

async function verifyPasswordReset(username, resetToken) {
    const result = await pool.query(
        `UPDATE users
         SET "resetToken" = $1,
             "resetVerifiedAt" = CURRENT_TIMESTAMP
         WHERE LOWER(username) = LOWER($2)
           AND "resetExpiresAt" > CURRENT_TIMESTAMP
         RETURNING id`,
        [resetToken, username]
    );

    return result.rows[0];
}

async function completePasswordReset(username, resetToken, passwordHash) {
    const result = await pool.query(
        `UPDATE users
         SET password = $1,
             "resetCode" = NULL,
             "resetExpiresAt" = NULL,
             "resetToken" = NULL,
             "resetVerifiedAt" = NULL
         WHERE LOWER(username) = LOWER($2)
           AND "resetToken" = $3
           AND "resetVerifiedAt" > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
         RETURNING id`,
        [passwordHash, username, resetToken]
    );

    return result.rows[0];
}

module.exports = {
    getUser,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo,
    setPassword,
    updateLastLogin,
    createPasswordReset,
    getPasswordReset,
    verifyPasswordReset,
    completePasswordReset
};