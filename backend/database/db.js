const { Pool } = require("pg");

const pool = new Pool({
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id BIGSERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT,
            "habboId" TEXT,
            "figureString" TEXT,
            motto TEXT,
            "verifyCode" TEXT,
            verified BOOLEAN NOT NULL DEFAULT FALSE,
            role TEXT NOT NULL DEFAULT 'member',
            "lastLogin" TIMESTAMPTZ,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

     await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "resetCode" TEXT,
        ADD COLUMN IF NOT EXISTS "resetExpiresAt" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "resetToken" TEXT,
        ADD COLUMN IF NOT EXISTS "resetVerifiedAt" TIMESTAMPTZ
    `);
    await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS badge TEXT,
    ADD COLUMN IF NOT EXISTS rank TEXT
    `);

    await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS department TEXT
`);

await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT
        NOT NULL DEFAULT 'approved',

    ADD COLUMN IF NOT EXISTS "approvedByUserId" BIGINT,

    ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMPTZ,

    ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMPTZ
`);

await pool.query(`
    UPDATE users
    SET "approvalStatus" = 'approved',
        "approvedAt" = COALESCE(
            "approvedAt",
            "createdAt"
        )
    WHERE "approvalStatus" IS NULL
       OR "approvalStatus" = ''
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS user_roles (
        id BIGSERIAL PRIMARY KEY,
        "userId" BIGINT NOT NULL,
        role TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT user_roles_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT user_roles_unique
            UNIQUE ("userId", role)
    )
`);

await pool.query(`
    INSERT INTO user_roles ("userId", role)
    SELECT id, role
    FROM users
    WHERE role IS NOT NULL
      AND TRIM(role) <> ''
    ON CONFLICT ("userId", role) DO NOTHING
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGSERIAL PRIMARY KEY,

        "userId" BIGINT NOT NULL,

        message TEXT NOT NULL,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT chat_messages_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        chat_messages_created_at_idx
    ON chat_messages ("createdAt" DESC)
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS news_articles (
        id BIGSERIAL PRIMARY KEY,

        "authorUserId" BIGINT NOT NULL,

        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        content TEXT NOT NULL,

        category TEXT NOT NULL
            DEFAULT 'general',

        "imageUrl" TEXT,

        status TEXT NOT NULL
            DEFAULT 'draft',

        "isFeatured" BOOLEAN NOT NULL
            DEFAULT FALSE,

        "publishedAt" TIMESTAMPTZ,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        "updatedAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT news_articles_author_fk
            FOREIGN KEY ("authorUserId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT news_articles_status_check
            CHECK (
                status IN (
                    'draft',
                    'published',
                    'archived'
                )
            ),

        CONSTRAINT news_articles_category_check
            CHECK (
                category IN (
                    'general',
                    'announcement',
                    'event',
                    'interview',
                    'update'
                )
            )
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        news_articles_status_published_idx
    ON news_articles (
        status,
        "publishedAt" DESC
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        news_articles_author_idx
    ON news_articles (
        "authorUserId"
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS news_likes (
        id BIGSERIAL PRIMARY KEY,

        "articleId" BIGINT NOT NULL,
        "userId" BIGINT NOT NULL,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT news_likes_article_fk
            FOREIGN KEY ("articleId")
            REFERENCES news_articles(id)
            ON DELETE CASCADE,

        CONSTRAINT news_likes_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT news_likes_unique
            UNIQUE ("articleId", "userId")
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS news_reactions (
        id BIGSERIAL PRIMARY KEY,

        "articleId" BIGINT NOT NULL,
        "userId" BIGINT NOT NULL,

        emoji TEXT NOT NULL,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        "updatedAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT news_reactions_article_fk
            FOREIGN KEY ("articleId")
            REFERENCES news_articles(id)
            ON DELETE CASCADE,

        CONSTRAINT news_reactions_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT news_reactions_unique
            UNIQUE ("articleId", "userId")
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS news_comments (
        id BIGSERIAL PRIMARY KEY,

        "articleId" BIGINT NOT NULL,
        "userId" BIGINT NOT NULL,

        comment TEXT NOT NULL,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        "updatedAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT news_comments_article_fk
            FOREIGN KEY ("articleId")
            REFERENCES news_articles(id)
            ON DELETE CASCADE,

        CONSTRAINT news_comments_user_fk
            FOREIGN KEY ("userId")
            REFERENCES users(id)
            ON DELETE CASCADE
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        news_likes_article_id_idx
    ON news_likes ("articleId")
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        news_reactions_article_id_idx
    ON news_reactions ("articleId")
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        news_comments_article_id_created_at_idx
    ON news_comments (
        "articleId",
        "createdAt" DESC
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS site_announcements (
        id BIGSERIAL PRIMARY KEY,

        "authorUserId" BIGINT NOT NULL,

        title TEXT NOT NULL,

        content TEXT NOT NULL,

        icon TEXT NOT NULL
            DEFAULT '📢',

        status TEXT NOT NULL
            DEFAULT 'draft',

        "sortOrder" INTEGER NOT NULL
            DEFAULT 0,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        "updatedAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT site_announcements_author_fk
            FOREIGN KEY ("authorUserId")
            REFERENCES users(id)
            ON DELETE CASCADE,

        CONSTRAINT site_announcements_status_check
            CHECK (
                status IN (
                    'draft',
                    'published'
                )
            )
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        site_announcements_status_sort_idx

    ON site_announcements (
        status,
        "sortOrder" ASC,
        "createdAt" DESC
    )
`);

await pool.query(`
    CREATE INDEX IF NOT EXISTS
        site_announcements_author_idx

    ON site_announcements (
        "authorUserId"
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_logs (
        id BIGSERIAL PRIMARY KEY,

        "performedBy" TEXT NOT NULL,
        "targetUsername" TEXT NOT NULL,

        "actionType" TEXT NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP
    )
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS promotion_history (

        id BIGSERIAL PRIMARY KEY,

        "username" TEXT NOT NULL,

        "oldBadge" TEXT NOT NULL,

        "oldRank" TEXT NOT NULL,

        "newBadge" TEXT NOT NULL,

        "newRank" TEXT NOT NULL,

        "promotedBy" TEXT NOT NULL,

        "discordSent" BOOLEAN NOT NULL
            DEFAULT FALSE,

        "discordMessageId" TEXT,

        "createdAt" TIMESTAMPTZ NOT NULL
            DEFAULT CURRENT_TIMESTAMP

        "note" TEXT
    )
`);

await pool.query(`
    ALTER TABLE promotion_history
    ADD COLUMN IF NOT EXISTS note TEXT
`);

    console.log("PostgreSQL bağlandı.");
}

module.exports = {
    pool,
    initDatabase
};