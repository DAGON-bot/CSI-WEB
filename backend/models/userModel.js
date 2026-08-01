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

module.exports = {
    getUser,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo,
    setPassword,
    updateLastLogin
};