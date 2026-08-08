const { pool } = require("../database/db");

async function ensureUserNotificationsTable() {

    await pool.query(
        `CREATE TABLE IF NOT EXISTS user_notifications (
            id BIGSERIAL PRIMARY KEY,
            "recipientUserId" BIGINT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            "sourceType" TEXT,
            "sourceId" TEXT,
            "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "readAt" TIMESTAMPTZ
        )`
    );

    await pool.query(
        `CREATE INDEX IF NOT EXISTS
            user_notifications_recipient_idx
         ON user_notifications (
            "recipientUserId",
            "isRead",
            "createdAt" DESC
         )`
    );

    await pool.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS
            user_notifications_source_unique_idx
         ON user_notifications (
            "recipientUserId",
            type,
            "sourceType",
            "sourceId"
         )
         WHERE "sourceId" IS NOT NULL`
    );
}

function formatNotificationRow(
    row
) {

    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        recipientUserId:
            Number(
                row.recipientUserId
            ),

        type:
            row.type,

        title:
            row.title,

        message:
            row.message,

        sourceType:
            row.sourceType || null,

        sourceId:
            row.sourceId || null,

        isRead:
            Boolean(
                row.isRead
            ),

        createdAt:
            row.createdAt,

        readAt:
            row.readAt || null
    };
}

async function createUserNotification({
    recipientUserId,
    type,
    title,
    message,
    sourceType = null,
    sourceId = null
}) {

    await ensureUserNotificationsTable();

    const result =
        await pool.query(
            `INSERT INTO user_notifications (
                "recipientUserId",
                type,
                title,
                message,
                "sourceType",
                "sourceId"
             )
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [
                recipientUserId,
                type,
                title,
                message,
                sourceType,
                sourceId
            ]
        );

    return formatNotificationRow(
        result.rows[0]
    );
}

async function getUserNotifications(
    recipientUserId,
    limit = 50
) {

    await ensureUserNotificationsTable();

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 50,
                1
            ),
            100
        );

    const result =
        await pool.query(
            `SELECT *
             FROM user_notifications
             WHERE "recipientUserId" = $1
             ORDER BY
                "isRead" ASC,
                "createdAt" DESC
             LIMIT $2`,
            [
                recipientUserId,
                safeLimit
            ]
        );

    return result.rows.map(
        formatNotificationRow
    );
}

async function markUserNotificationRead({
    notificationId,
    recipientUserId
}) {

    await ensureUserNotificationsTable();

    const result =
        await pool.query(
            `UPDATE user_notifications
             SET "isRead" = TRUE,
                 "readAt" = COALESCE(
                    "readAt",
                    CURRENT_TIMESTAMP
                 )
             WHERE id = $1
               AND "recipientUserId" = $2
             RETURNING *`,
            [
                notificationId,
                recipientUserId
            ]
        );

    return formatNotificationRow(
        result.rows[0]
    );
}

module.exports = {
    createUserNotification,
    getUserNotifications,
    markUserNotificationRead
};
