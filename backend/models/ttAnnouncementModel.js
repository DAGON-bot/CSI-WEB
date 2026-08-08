const { pool } = require("../database/db");

async function ensureTtAnnouncementTable() {

    await pool.query(
        `CREATE TABLE IF NOT EXISTS discord_tt_announcements (
            id SERIAL PRIMARY KEY,
            "announcementTime" TEXT NOT NULL,
            message TEXT NOT NULL,
            "createdBy" TEXT NOT NULL,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "discordSent" BOOLEAN NOT NULL DEFAULT FALSE,
            "discordMessageId" TEXT,
            "sentAt" TIMESTAMPTZ
        )`
    );
}

async function createTtAnnouncement({
    announcementTime,
    message,
    createdBy
}) {

    await ensureTtAnnouncementTable();

    const result =
        await pool.query(
            `INSERT INTO discord_tt_announcements (
                "announcementTime",
                message,
                "createdBy"
             )
             VALUES ($1, $2, $3)
             RETURNING
                id,
                "announcementTime",
                message,
                "createdBy",
                "createdAt",
                "discordSent",
                "discordMessageId",
                "sentAt"`,
            [
                announcementTime,
                message,
                createdBy
            ]
        );

    return result.rows[0] || null;
}

async function getPendingTtAnnouncements(
    limit = 10
) {

    await ensureTtAnnouncementTable();

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 10,
                1
            ),
            50
        );

    const result =
        await pool.query(
            `SELECT
                id,
                "announcementTime",
                message,
                "createdBy",
                "createdAt",
                "discordSent",
                "discordMessageId",
                "sentAt"
             FROM discord_tt_announcements
             WHERE "discordSent" = FALSE
             ORDER BY "createdAt" ASC
             LIMIT $1`,
            [
                safeLimit
            ]
        );

    return result.rows;
}

async function markTtAnnouncementAsSent({
    announcementId,
    discordMessageId
}) {

    await ensureTtAnnouncementTable();

    const result =
        await pool.query(
            `UPDATE discord_tt_announcements
             SET "discordSent" = TRUE,
                 "discordMessageId" = $1,
                 "sentAt" = CURRENT_TIMESTAMP
             WHERE id = $2
               AND "discordSent" = FALSE
             RETURNING
                id,
                "announcementTime",
                message,
                "createdBy",
                "createdAt",
                "discordSent",
                "discordMessageId",
                "sentAt"`,
            [
                discordMessageId,
                announcementId
            ]
        );

    return result.rows[0] || null;
}

module.exports = {
    createTtAnnouncement,
    getPendingTtAnnouncements,
    markTtAnnouncementAsSent
};
