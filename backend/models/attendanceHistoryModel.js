const {
    pool
} = require("../database/db");

function formatAttendanceRow(row) {

    if (!row) {
        return null;
    }

    return {
        id: Number(row.id),
        personnelName: row.personnelName,
        performedBy: row.performedBy,
        currentXP: Number(row.currentXP || 0),
        mrCount: Number(row.mrCount || 0),
        promotionCount: Number(row.promotionCount || 0),
        educationCount: Number(row.educationCount || 0),
        bulkPromotionCount: Number(row.bulkPromotionCount || 0),
        licenseCount: Number(row.licenseCount || 0),
        activeHours: Number(row.activeHours || 0),
        workingHours: Number(row.workingHours || 0),
        normalScore: Number(row.normalScore || 0),
        penalty: Number(row.penalty || 0),
        netNormalScore: Number(row.netNormalScore || 0),
        extraScore: Number(row.extraScore || 0),
        newXP: Number(row.newXP || 0),
        earnedEsCoin: Number(row.earnedEsCoin || 0),
        discordSent: Boolean(row.discordSent),
        discordMessageId: row.discordMessageId || null,
        createdAt: row.createdAt
    };
}

async function createAttendanceHistory(data) {

    const result = await pool.query(
        `
        INSERT INTO attendance_history (
            "personnelName", "performedBy", "currentXP",
            "mrCount", "promotionCount", "educationCount",
            "bulkPromotionCount", "licenseCount", "activeHours",
            "workingHours", "normalScore", penalty,
            "netNormalScore", "extraScore", "newXP",
            "earnedEsCoin", "discordSent"
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, $15, $16,
            FALSE
        )
        RETURNING *
        `,
        [
            data.personnelName,
            data.performedBy,
            data.currentXP,
            data.mrCount,
            data.promotionCount,
            data.educationCount,
            data.bulkPromotionCount,
            data.licenseCount,
            data.activeHours,
            data.workingHours,
            data.normalScore,
            data.penalty,
            data.netNormalScore,
            data.extraScore,
            data.newXP,
            data.earnedEsCoin
        ]
    );

    return formatAttendanceRow(result.rows[0]);
}

async function getPendingDiscordAttendances(limit = 10) {

    const safeLimit = Math.min(
        Math.max(Number(limit) || 10, 1),
        50
    );

    const result = await pool.query(
        `
        SELECT *
        FROM attendance_history
        WHERE "discordSent" = FALSE
        ORDER BY "createdAt" ASC, id ASC
        LIMIT $1
        `,
        [safeLimit]
    );

    return result.rows.map(formatAttendanceRow);
}

async function getAttendanceHistoryById(attendanceId) {

    const result = await pool.query(
        `
        SELECT *
        FROM attendance_history
        WHERE id = $1
        LIMIT 1
        `,
        [attendanceId]
    );

    return formatAttendanceRow(result.rows[0]);
}

async function markAttendanceAsDiscordSent({
    attendanceId,
    discordMessageId
}) {

    const result = await pool.query(
        `
        UPDATE attendance_history
        SET
            "discordSent" = TRUE,
            "discordMessageId" = $2
        WHERE id = $1
          AND "discordSent" = FALSE
        RETURNING *
        `,
        [attendanceId, discordMessageId]
    );

    return formatAttendanceRow(result.rows[0]);
}

module.exports = {
    createAttendanceHistory,
    getPendingDiscordAttendances,
    getAttendanceHistoryById,
    markAttendanceAsDiscordSent
};
