const {
    pool
} = require("../database/db");

async function createAnnouncement({
    authorUserId,
    title,
    content,
    icon,
    status,
    sortOrder
}) {

    const result =
        await pool.query(
            `INSERT INTO site_announcements (
                "authorUserId",
                title,
                content,
                icon,
                status,
                "sortOrder"
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING *`,
            [
                authorUserId,
                title,
                content,
                icon || "📢",
                status,
                sortOrder
            ]
        );

    return result.rows[0] || null;
}

async function getPublishedAnnouncements() {

    const result =
        await pool.query(
            `SELECT
                sa.id,
                sa.title,
                sa.content,
                sa.icon,
                sa.status,
                sa."sortOrder",
                sa."createdAt",
                sa."updatedAt",

                u.username AS "authorUsername"

            FROM site_announcements sa

            INNER JOIN users u
                ON u.id = sa."authorUserId"

            WHERE sa.status = 'published'

            ORDER BY
                sa."sortOrder" ASC,
                sa."updatedAt" DESC,
                sa."createdAt" DESC`
        );

    return result.rows;
}

async function getAnnouncementById(
    announcementId
) {

    const result =
        await pool.query(
            `SELECT
                sa.*,

                u.username AS "authorUsername"

            FROM site_announcements sa

            INNER JOIN users u
                ON u.id = sa."authorUserId"

            WHERE sa.id = $1

            LIMIT 1`,
            [announcementId]
        );

    return result.rows[0] || null;
}

async function getAnnouncementsForPanel({
    authorUserId = null,
    includeAll = false
}) {

    const result =
        await pool.query(
            `SELECT
                sa.id,
                sa."authorUserId",
                sa.title,
                sa.content,
                sa.icon,
                sa.status,
                sa."sortOrder",
                sa."createdAt",
                sa."updatedAt",

                u.username AS "authorUsername"

            FROM site_announcements sa

            INNER JOIN users u
                ON u.id = sa."authorUserId"

            WHERE (
                $1::BOOLEAN = TRUE
                OR sa."authorUserId" = $2
            )

            ORDER BY
                sa."sortOrder" ASC,
                sa."updatedAt" DESC`,
            [
                includeAll,
                authorUserId
            ]
        );

    return result.rows;
}

async function updateAnnouncement(
    announcementId,
    {
        title,
        content,
        icon,
        status,
        sortOrder
    }
) {

    const result =
        await pool.query(
            `UPDATE site_announcements

             SET
                title = $2,
                content = $3,
                icon = $4,
                status = $5,
                "sortOrder" = $6,
                "updatedAt" =
                    CURRENT_TIMESTAMP

             WHERE id = $1

             RETURNING *`,
            [
                announcementId,
                title,
                content,
                icon || "📢",
                status,
                sortOrder
            ]
        );

    return result.rows[0] || null;
}

async function deleteAnnouncement(
    announcementId
) {

    const result =
        await pool.query(
            `DELETE FROM site_announcements
             WHERE id = $1
             RETURNING id`,
            [announcementId]
        );

    return result.rows[0] || null;
}

module.exports = {
    createAnnouncement,
    getPublishedAnnouncements,
    getAnnouncementById,
    getAnnouncementsForPanel,
    updateAnnouncement,
    deleteAnnouncement
};