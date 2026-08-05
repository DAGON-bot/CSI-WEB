const {
    pool
} = require("../database/db");

function formatPromotionHistoryRow(row) {

    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        username:
            row.username,

        oldBadge:
            row.oldBadge,

        oldRank:
            row.oldRank,

        newBadge:
            row.newBadge,

        newRank:
            row.newRank,

        promotedBy:
            row.promotedBy,

        note:
            row.note || null,

        discordSent:
            Boolean(row.discordSent),

        discordMessageId:
            row.discordMessageId || null,

        createdAt:
            row.createdAt
    };
}

async function createPromotionHistory({
    username,
    oldBadge,
    oldRank,
    newBadge,
    newRank,
    promotedBy,
    note = null
}) {

    const result =
        await pool.query(
            `INSERT INTO promotion_history (
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent"
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                FALSE
            )
            RETURNING
                id,
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent",
                "discordMessageId",
                "createdAt"`,
            [
                username,
                oldBadge,
                oldRank,
                newBadge,
                newRank,
                promotedBy,
                note
            ]
        );

    return formatPromotionHistoryRow(
        result.rows[0]
    );
}

async function getPendingDiscordPromotions(
    limit = 10
) {

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
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM promotion_history

            WHERE "discordSent" = FALSE

            ORDER BY
                "createdAt" ASC,
                id ASC

            LIMIT $1`,
            [
                safeLimit
            ]
        );

    return result.rows.map(
        formatPromotionHistoryRow
    );
}

async function markPromotionAsDiscordSent({
    promotionId,
    discordMessageId
}) {

    const result =
        await pool.query(
            `UPDATE promotion_history

            SET
                "discordSent" = TRUE,
                "discordMessageId" = $2

            WHERE
                id = $1
                AND "discordSent" = FALSE

            RETURNING
                id,
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent",
                "discordMessageId",
                "createdAt"`,
            [
                promotionId,
                discordMessageId
            ]
        );

    return formatPromotionHistoryRow(
        result.rows[0]
    );
}

async function getPromotionHistoryByUsername(
    username,
    limit = 20
) {

    const cleanUsername =
        String(username || "").trim();

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );

    if (!cleanUsername) {
        return [];
    }

    const result =
        await pool.query(
            `SELECT
                id,
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM promotion_history

            WHERE
                LOWER(username) =
                LOWER($1)

            ORDER BY
                "createdAt" DESC,
                id DESC

            LIMIT $2`,
            [
                cleanUsername,
                safeLimit
            ]
        );

    return result.rows.map(
        formatPromotionHistoryRow
    );
}

async function getPromotionHistoryById(
    promotionId
) {

    const result =
        await pool.query(
            `SELECT
                id,
                username,
                "oldBadge",
                "oldRank",
                "newBadge",
                "newRank",
                "promotedBy",
                note,
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM promotion_history

            WHERE id = $1

            LIMIT 1`,
            [
                promotionId
            ]
        );

    return formatPromotionHistoryRow(
        result.rows[0]
    );
}

module.exports = {
    createPromotionHistory,
    getPendingDiscordPromotions,
    markPromotionAsDiscordSent,
    getPromotionHistoryByUsername,
    getPromotionHistoryById
};