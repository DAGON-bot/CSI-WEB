const { pool } = require("../database/db");

async function ensureFeedbackTable() {

    await pool.query(
        `CREATE TABLE IF NOT EXISTS feedbacks (
            id BIGSERIAL PRIMARY KEY,
            "userId" BIGINT,
            username TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'new',
            "handledBy" TEXT,
            "resolutionNote" TEXT,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT feedback_status_check
                CHECK (status IN ('new','reviewing','resolved'))
        )`
    );

    await pool.query(
        `ALTER TABLE feedbacks
         ADD COLUMN IF NOT EXISTS "resolutionNote" TEXT`
    );

    await pool.query(
        `CREATE INDEX IF NOT EXISTS feedback_status_created_idx
         ON feedbacks (status, "createdAt" DESC)`
    );
}

function formatFeedbackRow(row) {

    if (!row) {
        return null;
    }

    return {
        id:
            Number(row.id),

        userId:
            row.userId
                ? Number(row.userId)
                : null,

        username:
            row.username,

        category:
            row.category,

        title:
            row.title,

        message:
            row.message,

        status:
            row.status,

        handledBy:
            row.handledBy || null,

        resolutionNote:
            row.resolutionNote || null,

        createdAt:
            row.createdAt,

        updatedAt:
            row.updatedAt
    };
}

async function createFeedback({
    userId,
    username,
    category,
    title,
    message
}) {

    await ensureFeedbackTable();

    const result =
        await pool.query(
            `INSERT INTO feedbacks (
                "userId",
                username,
                category,
                title,
                message
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                userId || null,
                username,
                category,
                title,
                message
            ]
        );

    return formatFeedbackRow(
        result.rows[0]
    );
}

async function getOpenFeedbacks() {

    await ensureFeedbackTable();

    const result =
        await pool.query(
            `SELECT *
             FROM feedbacks
             WHERE status IN ('new','reviewing')
             ORDER BY
                CASE
                    WHEN status = 'new'
                        THEN 0
                    ELSE 1
                END,
                "createdAt" DESC`
        );

    return result.rows.map(
        formatFeedbackRow
    );
}

async function updateFeedbackStatus({
    feedbackId,
    status,
    handledBy,
    resolutionNote = null
}) {

    await ensureFeedbackTable();

    const result =
        await pool.query(
            `UPDATE feedbacks
             SET status = $1,
                 "handledBy" = $2,
                 "resolutionNote" = CASE
                    WHEN $1 = 'resolved'
                        THEN $3
                    ELSE "resolutionNote"
                 END,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [
                status,
                handledBy || null,
                resolutionNote || null,
                feedbackId
            ]
        );

    return formatFeedbackRow(
        result.rows[0]
    );
}

module.exports = {
    createFeedback,
    getOpenFeedbacks,
    updateFeedbackStatus
};
