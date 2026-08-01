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

async function searchUsersByUsername(
    searchText,
    limit = 8
) {

    const result = await pool.query(
        `SELECT
            username,
            badge,
            rank,
            department
         FROM users
         WHERE username ILIKE $1
         ORDER BY
            CASE
                WHEN LOWER(username) = LOWER($2)
                    THEN 0
                WHEN LOWER(username) LIKE LOWER($3)
                    THEN 1
                ELSE 2
            END,
            username ASC
         LIMIT $4`,
        [
            `%${searchText}%`,
            searchText,
            `${searchText}%`,
            limit
        ]
    );

    return result.rows;

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

async function completeRegistration(
    username,
    password,
    badge,
    rank
) {
    const result = await pool.query(
        `UPDATE users
         SET password = $1,
             badge = $2,
             rank = $3
         WHERE LOWER(username) = LOWER($4)
         RETURNING id`,
        [
            password,
            badge,
            rank,
            username
        ]
    );

    return result.rows[0];
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

async function updateDepartment(username, department) {

    const result = await pool.query(
        `UPDATE users
         SET department = $1
         WHERE LOWER(username) = LOWER($2)
         RETURNING
             username,
             department`,
        [
            department,
            username
        ]
    );

    return result.rows[0];

}

async function updateRank(username, rank) {

    const result = await pool.query(
        `UPDATE users
         SET rank = $1
         WHERE LOWER(username) = LOWER($2)
         RETURNING
             username,
             rank`,
        [
            rank,
            username
        ]
    );

    return result.rows[0];

}

async function updateBadge(username, badge) {

    const result = await pool.query(
        `UPDATE users
         SET badge = $1
         WHERE LOWER(username) = LOWER($2)
         RETURNING
             username,
             badge`,
        [
            badge,
            username
        ]
    );

    return result.rows[0];

}

async function updateRole(username, role) {

    const result = await pool.query(
        `UPDATE users
         SET role = $1
         WHERE LOWER(username) = LOWER($2)
         RETURNING
             username,
             role`,
        [
            role,
            username
        ]
    );

    return result.rows[0];

}

async function createAdminLog({
    performedBy,
    targetUsername,
    actionType,
    oldValue,
    newValue
}) {

    const result = await pool.query(
        `INSERT INTO admin_logs (
            "performedBy",
            "targetUsername",
            "actionType",
            "oldValue",
            "newValue"
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING
            id,
            "performedBy",
            "targetUsername",
            "actionType",
            "oldValue",
            "newValue",
            "createdAt"`,
        [
            performedBy,
            targetUsername,
            actionType,
            oldValue || "",
            newValue || ""
        ]
    );

    return result.rows[0];

}

async function updateRanksBulk(promotions) {

    const client =
        await pool.connect();

    try {

        await client.query("BEGIN");

        const updated = [];
        const notFound = [];
        const unchanged = [];

        for (const promotion of promotions) {

            const username =
                String(promotion.username || "").trim();

            const newRank =
                String(promotion.newRank || "").trim();

            const currentResult =
                await client.query(
                    `SELECT username, rank
                     FROM users
                     WHERE LOWER(username) = LOWER($1)
                     LIMIT 1`,
                    [username]
                );

            const currentUser =
                currentResult.rows[0];

            if (!currentUser) {

                notFound.push({
                    username,
                    newRank
                });

                continue;

            }

            if (currentUser.rank === newRank) {

                unchanged.push({
                    username: currentUser.username,
                    rank: currentUser.rank
                });

                continue;

            }

            const updateResult =
                await client.query(
                    `UPDATE users
                     SET rank = $1
                     WHERE LOWER(username) = LOWER($2)
                     RETURNING username, rank`,
                    [
                        newRank,
                        currentUser.username
                    ]
                );

            updated.push({
                username:
                    updateResult.rows[0].username,

                oldRank:
                    currentUser.rank || "",

                newRank:
                    updateResult.rows[0].rank
            });

        }

        await client.query("COMMIT");

        return {
            updated,
            notFound,
            unchanged
        };

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }

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
    searchUsersByUsername,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo,
    setPassword,
    updateLastLogin,
    completeRegistration,
    updateDepartment,
    updateRank,
    updateBadge,
    updateRole,
    updateRanksBulk,
    createAdminLog,
    createPasswordReset,
    getPasswordReset,
    verifyPasswordReset,
    completePasswordReset
};