const {
    pool
} = require("../database/db");

// ========================================
// MAAŞ KAYDI FORMATLAMA
// ========================================

function formatSalaryHistoryRow(
    row
) {

    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        personnelName:
            row.personnelName,

        salaryOfficerName:
            row.salaryOfficerName,

        badge:
            row.badge,

        credit:
            Number(row.credit || 0),

        requiredMinutes:
            Number(
                row.requiredMinutes || 0
            ),

        previousHours:
            Number(
                row.previousHours || 0
            ),

        previousMinutes:
            Number(
                row.previousMinutes || 0
            ),

        currentHours:
            Number(
                row.currentHours || 0
            ),

        currentMinutes:
            Number(
                row.currentMinutes || 0
            ),

        workedMinutes:
            Number(
                row.workedMinutes || 0
            ),

        discordSent:
            Boolean(row.discordSent),

        discordMessageId:
            row.discordMessageId || null,

        createdAt:
            row.createdAt
    };
}

// ========================================
// YENİ MAAŞ KAYDI
// ========================================

async function createSalaryHistory({

    personnelName,

    salaryOfficerName,

    badge,

    credit,

    requiredMinutes,

    previousHours,

    previousMinutes,

    currentHours,

    currentMinutes,

    workedMinutes
}) {

    const result =
        await pool.query(
            `
            INSERT INTO salary_history (
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
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
                $8,
                $9,
                $10,
                FALSE
            )
            RETURNING
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"
            `,
            [
                personnelName,
                salaryOfficerName,
                badge,
                credit,
                requiredMinutes,
                previousHours,
                previousMinutes,
                currentHours,
                currentMinutes,
                workedMinutes
            ]
        );

    return formatSalaryHistoryRow(
        result.rows[0]
    );
}

// ========================================
// BEKLEYEN DISCORD MAAŞ KAYITLARI
// ========================================

async function getPendingDiscordSalaries(
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
            `
            SELECT
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM salary_history

            WHERE "discordSent" = FALSE

            ORDER BY
                "createdAt" ASC,
                id ASC

            LIMIT $1
            `,
            [
                safeLimit
            ]
        );

    return result.rows.map(
        formatSalaryHistoryRow
    );
}

// ========================================
// DISCORD'A GÖNDERİLDİ İŞARETLE
// ========================================

async function markSalaryAsDiscordSent({

    salaryId,

    discordMessageId
}) {

    const result =
        await pool.query(
            `
            UPDATE salary_history

            SET
                "discordSent" = TRUE,
                "discordMessageId" = $2

            WHERE
                id = $1
                AND "discordSent" = FALSE

            RETURNING
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"
            `,
            [
                salaryId,
                discordMessageId
            ]
        );

    return formatSalaryHistoryRow(
        result.rows[0]
    );
}

// ========================================
// PERSONELE GÖRE GÜNLÜK MAAŞ GEÇMİŞİ
// ========================================

async function getSalaryHistoryByPersonnelName(
    personnelName,
    limit = 20,
    reportDate = null,
    timezone = "Europe/Istanbul"
) {

    const cleanPersonnelName =
        String(
            personnelName || ""
        ).trim();

    if (!cleanPersonnelName) {
        return [];
    }

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );

    const cleanReportDate =
        reportDate
            ? String(reportDate).trim()
            : null;

    const cleanTimezone =
        String(
            timezone ||
            "Europe/Istanbul"
        ).trim();

    const result =
        await pool.query(
            `
            SELECT
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM salary_history

            WHERE
                LOWER("personnelName") =
                LOWER($1)

                AND
                (
                    "createdAt"
                    AT TIME ZONE $3
                )::date
                =
                COALESCE(
                    $4::date,
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE $3
                    )::date
                )

            ORDER BY
                "createdAt" DESC,
                id DESC

            LIMIT $2
            `,
            [
                cleanPersonnelName,
                safeLimit,
                cleanTimezone,
                cleanReportDate
            ]
        );

    return result.rows.map(
        formatSalaryHistoryRow
    );
}

// ========================================
// ID İLE MAAŞ KAYDI
// ========================================

async function getSalaryHistoryById(
    salaryId
) {

    const result =
        await pool.query(
            `
            SELECT
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM salary_history

            WHERE id = $1

            LIMIT 1
            `,
            [
                salaryId
            ]
        );

    return formatSalaryHistoryRow(
        result.rows[0]
    );
}

// ========================================
// TARİHE GÖRE MAAŞ KAYITLARI
// ========================================

async function getSalaryHistoryByDate(
    reportDate = null,
    timezone = "Europe/Istanbul"
) {

    const cleanReportDate =
        reportDate
            ? String(reportDate).trim()
            : null;

    const cleanTimezone =
        String(
            timezone ||
            "Europe/Istanbul"
        ).trim();

    const result =
        await pool.query(
            `
            SELECT
                id,
                "personnelName",
                "salaryOfficerName",
                badge,
                credit,
                "requiredMinutes",
                "previousHours",
                "previousMinutes",
                "currentHours",
                "currentMinutes",
                "workedMinutes",
                "discordSent",
                "discordMessageId",
                "createdAt"

            FROM salary_history

            WHERE
                (
                    "createdAt"
                    AT TIME ZONE $1
                )::date
                =
                COALESCE(
                    $2::date,
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE $1
                    )::date
                )

            ORDER BY
                "createdAt" ASC,
                id ASC
            `,
            [
                cleanTimezone,
                cleanReportDate
            ]
        );

    return result.rows.map(
        formatSalaryHistoryRow
    );
}

module.exports = {
    createSalaryHistory,
    getPendingDiscordSalaries,
    markSalaryAsDiscordSent,
    getSalaryHistoryByPersonnelName,
    getSalaryHistoryById,
    getSalaryHistoryByDate
};