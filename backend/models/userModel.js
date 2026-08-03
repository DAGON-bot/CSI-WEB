const { pool } = require("../database/db");

async function getUser(username) {

    const result = await pool.query(
        `SELECT *
         FROM users
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
    );

    const user = result.rows[0];

    if (!user) {
        return undefined;
    }

    const roles = await getUserRoles(user.username);

    return {
        ...user,
        roles
    };
}

async function getUserRoles(username) {

    const result = await pool.query(
        `SELECT ur.role
         FROM user_roles ur
         INNER JOIN users u
             ON u.id = ur."userId"
         WHERE LOWER(u.username) = LOWER($1)
         ORDER BY ur.role ASC`,
        [username]
    );

    return result.rows.map(row => row.role);
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
    department,
    "figureString"
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
    registerType
) {

    const isGuest =
        registerType === "guest";

    const approvalStatus =
        isGuest
            ? "approved"
            : "pending";

    const approvedAt =
        isGuest
            ? new Date()
            : null;

    const result = await pool.query(
        `UPDATE users
         SET password = $1,
             badge = NULL,
             rank = NULL,
             "approvalStatus" = $2,
             "approvedAt" = $3,
             "approvedByUserId" = NULL,
             "rejectedAt" = NULL
         WHERE LOWER(username) = LOWER($4)
         RETURNING
             id,
             username,
             "approvalStatus"`,
        [
            password,
            approvalStatus,
            approvedAt,
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

async function addUserRole(username, role) {

    const result = await pool.query(
        `INSERT INTO user_roles ("userId", role)
         SELECT id, $2
         FROM users
         WHERE LOWER(username) = LOWER($1)
         ON CONFLICT ("userId", role) DO NOTHING
         RETURNING role`,
        [username, role]
    );

    return result.rows[0] || null;
}

async function removeUserRole(username, role) {

    const result = await pool.query(
        `DELETE FROM user_roles
         WHERE "userId" = (
             SELECT id
             FROM users
             WHERE LOWER(username) = LOWER($1)
             LIMIT 1
         )
         AND role = $2
         RETURNING role`,
        [username, role]
    );

    return result.rows[0] || null;
}

async function setUserRoles(username, roles) {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");

        const userResult = await client.query(
            `SELECT id
             FROM users
             WHERE LOWER(username) = LOWER($1)
             LIMIT 1`,
            [username]
        );

        const user = userResult.rows[0];

        if (!user) {
            await client.query("ROLLBACK");
            return null;
        }

        const cleanRoles = [
            ...new Set(
                roles
                    .map(role => String(role || "").trim())
                    .filter(Boolean)
            )
        ];

        await client.query(
            `DELETE FROM user_roles
             WHERE "userId" = $1`,
            [user.id]
        );

        for (const role of cleanRoles) {

            await client.query(
                `INSERT INTO user_roles ("userId", role)
                 VALUES ($1, $2)
                 ON CONFLICT ("userId", role) DO NOTHING`,
                [user.id, role]
            );

        }

        await client.query("COMMIT");

        return cleanRoles;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }
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

async function getPendingApprovals() {

    const result = await pool.query(
        `SELECT
            id,
            username,
            "figureString",
            motto,
            "createdAt",
            "approvalStatus"
         FROM users
         WHERE "approvalStatus" = 'pending'
         ORDER BY "createdAt" ASC`
    );

    return result.rows;
}

async function approveUserAccount({
    userId,
    badge,
    rank,
    approvedByUserId
}) {

    const result = await pool.query(
        `UPDATE users
         SET badge = $1,
             rank = $2,
             "approvalStatus" = 'approved',
             "approvedByUserId" = $3,
             "approvedAt" = CURRENT_TIMESTAMP,
             "rejectedAt" = NULL
         WHERE id = $4
           AND "approvalStatus" = 'pending'
         RETURNING
             id,
             username,
             badge,
             rank,
             "approvalStatus",
             "approvedAt"`,
        [
            badge,
            rank,
            approvedByUserId,
            userId
        ]
    );

    return result.rows[0] || null;
}

async function rejectUserAccount({
    userId,
    approvedByUserId
}) {

    const result = await pool.query(
        `UPDATE users
         SET "approvalStatus" = 'rejected',
             "approvedByUserId" = $1,
             "approvedAt" = NULL,
             "rejectedAt" = CURRENT_TIMESTAMP
         WHERE id = $2
           AND "approvalStatus" = 'pending'
         RETURNING
             id,
             username,
             "approvalStatus",
             "rejectedAt"`,
        [
            approvedByUserId,
            userId
        ]
    );

    return result.rows[0] || null;
}

module.exports = {
    getUser,
    getUserRoles,
    addUserRole,
    removeUserRole,
    setUserRoles,
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
    completePasswordReset,
    getPendingApprovals,
    approveUserAccount,
    rejectUserAccount
};