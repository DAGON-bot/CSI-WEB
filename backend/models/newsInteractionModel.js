const {
    pool
} = require("../database/db");

async function getNewsInteractionSummary(
    articleId,
    userId = null
) {

    const likesResult =
        await pool.query(
            `SELECT COUNT(*)::INTEGER AS count
             FROM news_likes
             WHERE "articleId" = $1`,
            [articleId]
        );

    const reactionsResult =
        await pool.query(
            `SELECT
                emoji,
                COUNT(*)::INTEGER AS count
             FROM news_reactions
             WHERE "articleId" = $1
             GROUP BY emoji
             ORDER BY count DESC`,
            [articleId]
        );

    const commentsResult =
        await pool.query(
            `SELECT COUNT(*)::INTEGER AS count
             FROM news_comments
             WHERE "articleId" = $1`,
            [articleId]
        );

    let userLiked = false;
    let userReaction = null;

    if (userId) {

        const userLikeResult =
            await pool.query(
                `SELECT id
                 FROM news_likes
                 WHERE "articleId" = $1
                   AND "userId" = $2
                 LIMIT 1`,
                [
                    articleId,
                    userId
                ]
            );

        userLiked =
            userLikeResult.rows.length > 0;

        const userReactionResult =
            await pool.query(
                `SELECT emoji
                 FROM news_reactions
                 WHERE "articleId" = $1
                   AND "userId" = $2
                 LIMIT 1`,
                [
                    articleId,
                    userId
                ]
            );

        userReaction =
            userReactionResult.rows[0]?.emoji ||
            null;
    }

    return {
        likeCount:
            likesResult.rows[0]?.count || 0,

        commentCount:
            commentsResult.rows[0]?.count || 0,

        reactions:
            reactionsResult.rows,

        userLiked,

        userReaction
    };
}

async function toggleNewsLike(
    articleId,
    userId
) {

    const existing =
        await pool.query(
            `SELECT id
             FROM news_likes
             WHERE "articleId" = $1
               AND "userId" = $2
             LIMIT 1`,
            [
                articleId,
                userId
            ]
        );

    let liked;

    if (existing.rows.length > 0) {

        await pool.query(
            `DELETE FROM news_likes
             WHERE "articleId" = $1
               AND "userId" = $2`,
            [
                articleId,
                userId
            ]
        );

        liked = false;

    } else {

        await pool.query(
            `INSERT INTO news_likes (
                "articleId",
                "userId"
             )
             VALUES ($1, $2)
             ON CONFLICT (
                "articleId",
                "userId"
             )
             DO NOTHING`,
            [
                articleId,
                userId
            ]
        );

        liked = true;
    }

    const countResult =
        await pool.query(
            `SELECT COUNT(*)::INTEGER AS count
             FROM news_likes
             WHERE "articleId" = $1`,
            [articleId]
        );

    return {
        liked,
        likeCount:
            countResult.rows[0]?.count || 0
    };
}

async function setNewsReaction(
    articleId,
    userId,
    emoji
) {

    if (!emoji) {

        await pool.query(
            `DELETE FROM news_reactions
             WHERE "articleId" = $1
               AND "userId" = $2`,
            [
                articleId,
                userId
            ]
        );

    } else {

        await pool.query(
            `INSERT INTO news_reactions (
                "articleId",
                "userId",
                emoji
             )
             VALUES ($1, $2, $3)

             ON CONFLICT (
                "articleId",
                "userId"
             )

             DO UPDATE SET
                emoji = EXCLUDED.emoji,
                "updatedAt" =
                    CURRENT_TIMESTAMP`,
            [
                articleId,
                userId,
                emoji
            ]
        );
    }

    const result =
        await pool.query(
            `SELECT
                emoji,
                COUNT(*)::INTEGER AS count
             FROM news_reactions
             WHERE "articleId" = $1
             GROUP BY emoji
             ORDER BY count DESC`,
            [articleId]
        );

    return {
        userReaction:
            emoji || null,

        reactions:
            result.rows
    };
}

async function getNewsComments(
    articleId,
    limit = 100
) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 100,
                1
            ),
            200
        );

    const result =
        await pool.query(
            `SELECT
                nc.id,
                nc."articleId",
                nc."userId",
                nc.comment,
                nc."createdAt",
                nc."updatedAt",

                u.username,
                u."figureString",
                u.role,

                COALESCE(
                    ARRAY_AGG(
                        DISTINCT ur.role
                    ) FILTER (
                        WHERE ur.role IS NOT NULL
                    ),
                    ARRAY[]::TEXT[]
                ) AS roles

             FROM news_comments nc

             INNER JOIN users u
                ON u.id = nc."userId"

             LEFT JOIN user_roles ur
                ON ur."userId" = u.id

             WHERE nc."articleId" = $1

             GROUP BY
                nc.id,
                u.id

             ORDER BY
                nc."createdAt" ASC

             LIMIT $2`,
            [
                articleId,
                safeLimit
            ]
        );

    return result.rows;
}

async function createNewsComment({
    articleId,
    userId,
    comment
}) {

    const result =
        await pool.query(
            `INSERT INTO news_comments (
                "articleId",
                "userId",
                comment
             )
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
                articleId,
                userId,
                comment
            ]
        );

    return result.rows[0] || null;
}

async function getNewsCommentById(
    commentId
) {

    const result =
        await pool.query(
            `SELECT *
             FROM news_comments
             WHERE id = $1
             LIMIT 1`,
            [commentId]
        );

    return result.rows[0] || null;
}

async function deleteNewsComment(
    commentId
) {

    const result =
        await pool.query(
            `DELETE FROM news_comments
             WHERE id = $1
             RETURNING *`,
            [commentId]
        );

    return result.rows[0] || null;
}

module.exports = {
    getNewsInteractionSummary,
    toggleNewsLike,
    setNewsReaction,
    getNewsComments,
    createNewsComment,
    getNewsCommentById,
    deleteNewsComment
};