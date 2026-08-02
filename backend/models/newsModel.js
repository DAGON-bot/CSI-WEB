const {
    pool
} = require("../database/db");

async function createNewsArticle({
    authorUserId,
    title,
    summary,
    content,
    category,
    imageUrl,
    status
}) {

    const result =
        await pool.query(
            `INSERT INTO news_articles (
                "authorUserId",
                title,
                summary,
                content,
                category,
                "imageUrl",
                status,
                "publishedAt"
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                CASE
                    WHEN $7 = 'published'
                    THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            )
            RETURNING *`,
            [
                authorUserId,
                title,
                summary,
                content,
                category,
                imageUrl || null,
                status
            ]
        );

    return result.rows[0] || null;
}

async function getPublishedNewsArticles(
    limit = 20
) {

    const safeLimit =
        Math.min(
            Math.max(
                Number(limit) || 20,
                1
            ),
            100
        );

    const result =
        await pool.query(
            `SELECT
                na.id,
                na.title,
                na.summary,
                na.content,
                na.category,
                na."imageUrl",
                na.status,
                na."isFeatured",
                na."publishedAt",
                na."createdAt",
                na."updatedAt",

                u.username AS "authorUsername",
                u."figureString" AS "authorFigureString"

            FROM news_articles na

            INNER JOIN users u
                ON u.id = na."authorUserId"

            WHERE na.status = 'published'

            ORDER BY
                na."isFeatured" DESC,
                na."publishedAt" DESC NULLS LAST,
                na."createdAt" DESC

            LIMIT $1`,
            [safeLimit]
        );

    return result.rows;
}

async function getNewsArticleById(
    articleId
) {

    const result =
        await pool.query(
            `SELECT
                na.*,

                u.username AS "authorUsername",
                u."figureString" AS "authorFigureString"

            FROM news_articles na

            INNER JOIN users u
                ON u.id = na."authorUserId"

            WHERE na.id = $1

            LIMIT 1`,
            [articleId]
        );

    return result.rows[0] || null;
}

async function getNewsArticlesForPanel({
    authorUserId = null,
    includeAll = false
}) {

    const result =
        await pool.query(
            `SELECT
                na.id,
                na."authorUserId",
                na.title,
                na.summary,
                na.content,
                na.category,
                na."imageUrl",
                na.status,
                na."isFeatured",
                na."publishedAt",
                na."createdAt",
                na."updatedAt",

                u.username AS "authorUsername"

            FROM news_articles na

            INNER JOIN users u
                ON u.id = na."authorUserId"

            WHERE (
                $1::BOOLEAN = TRUE
                OR na."authorUserId" = $2
            )

            ORDER BY
                na."updatedAt" DESC,
                na."createdAt" DESC`,
            [
                includeAll,
                authorUserId
            ]
        );

    return result.rows;
}

async function updateNewsArticle(
    articleId,
    {
        title,
        summary,
        content,
        category,
        imageUrl,
        status
    }
) {

    const result =
        await pool.query(
            `UPDATE news_articles

             SET
                title = $2,
                summary = $3,
                content = $4,
                category = $5,
                "imageUrl" = $6,
                status = $7,

                "publishedAt" =
                    CASE
                        WHEN $7 = 'published'
                             AND "publishedAt" IS NULL
                        THEN CURRENT_TIMESTAMP

                        WHEN $7 <> 'published'
                        THEN NULL

                        ELSE "publishedAt"
                    END,

                "updatedAt" =
                    CURRENT_TIMESTAMP

             WHERE id = $1

             RETURNING *`,
            [
                articleId,
                title,
                summary,
                content,
                category,
                imageUrl || null,
                status
            ]
        );

    return result.rows[0] || null;
}

async function deleteNewsArticle(
    articleId
) {

    const result =
        await pool.query(
            `DELETE FROM news_articles
             WHERE id = $1
             RETURNING id`,
            [articleId]
        );

    return result.rows[0] || null;
}

async function setNewsArticleFeatured(
    articleId,
    isFeatured
) {

    const client =
        await pool.connect();

    try {

        await client.query("BEGIN");

        if (isFeatured) {

            await client.query(
                `UPDATE news_articles
                 SET
                    "isFeatured" = FALSE,
                    "updatedAt" =
                        CURRENT_TIMESTAMP
                 WHERE "isFeatured" = TRUE`
            );

        }

        const result =
            await client.query(
                `UPDATE news_articles
                 SET
                    "isFeatured" = $2,
                    "updatedAt" =
                        CURRENT_TIMESTAMP
                 WHERE id = $1
                 RETURNING *`,
                [
                    articleId,
                    !!isFeatured
                ]
            );

        await client.query("COMMIT");

        return result.rows[0] || null;

    } catch (err) {

        await client.query("ROLLBACK");
        throw err;

    } finally {

        client.release();

    }
}

module.exports = {
    createNewsArticle,
    getPublishedNewsArticles,
    getNewsArticleById,
    getNewsArticlesForPanel,
    updateNewsArticle,
    deleteNewsArticle,
    setNewsArticleFeatured
};