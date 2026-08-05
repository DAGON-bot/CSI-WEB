const {
    pool
} = require("../database/db");

function formatBulkPromotionRow(row) {

    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        distributorName:
            row.distributorName,

        distributorCode:
            row.distributorCode,

        startTime:
            row.startTime,

        endTime:
            row.endTime,

        multiplier:
            Number(row.multiplier),

        promotions:
            Array.isArray(row.promotions)
                ? row.promotions
                : [],

        createdBy:
            row.createdBy,

        discordSent:
            Boolean(row.discordSent),

        discordMessageId:
            row.discordMessageId || null,

        createdAt:
            row.createdAt
    };
}

async function createBulkPromotionHistory({
    distributorName,
    distributorCode,
    startTime,
    endTime,
    multiplier,
    promotions,
    createdBy
}) {

    const result =
        await pool.query(
            `INSERT INTO bulk_promotion_history (
                "distributorName",
                "distributorCode",
                "startTime",
                "endTime",
                multiplier,
                promotions,
                "createdBy",
                "discordSent"
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6::jsonb,
                $7,
                FALSE
            )
            RETURNING
                id,
                "distributorName",
                "distributorCode",
                "startTime",
                "endTime",
                multiplier,
                promotions,
                "createdBy",
                "discordSent",
                "discordMessageId",
                "createdAt"`,
            [
                distributorName,
                distributorCode,
                startTime,
                endTime,
                multiplier,
                JSON.stringify(promotions),
                createdBy
            ]
        );

    return formatBulkPromotionRow(
        result.rows[0]
    );
}

async function getPendingBulkPromotions(
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
                "distributorName",
                "distributorCode",
                "startTime",
                "endTime",
                multiplier,
                promotions,
                "createdBy",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM bulk_promotion_history

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
        formatBulkPromotionRow
    );
}

async function getBulkPromotionById(
    bulkPromotionId
) {

    const result =
        await pool.query(
            `SELECT
                id,
                "distributorName",
                "distributorCode",
                "startTime",
                "endTime",
                multiplier,
                promotions,
                "createdBy",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM bulk_promotion_history

            WHERE id = $1

            LIMIT 1`,
            [
                bulkPromotionId
            ]
        );

    return formatBulkPromotionRow(
        result.rows[0]
    );
}

async function markBulkPromotionAsDiscordSent({
    bulkPromotionId,
    discordMessageId
}) {

    const result =
        await pool.query(
            `UPDATE bulk_promotion_history

            SET
                "discordSent" = TRUE,
                "discordMessageId" = $2

            WHERE
                id = $1
                AND "discordSent" = FALSE

            RETURNING
                id,
                "distributorName",
                "distributorCode",
                "startTime",
                "endTime",
                multiplier,
                promotions,
                "createdBy",
                "discordSent",
                "discordMessageId",
                "createdAt"`,
            [
                bulkPromotionId,
                discordMessageId
            ]
        );

    return formatBulkPromotionRow(
        result.rows[0]
    );
}

module.exports = {
    createBulkPromotionHistory,
    getPendingBulkPromotions,
    getBulkPromotionById,
    markBulkPromotionAsDiscordSent
};