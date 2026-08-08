const { pool } = require("../database/db");

async function ensureRadioSettingsTable() {

    await pool.query(
        `CREATE TABLE IF NOT EXISTS radio_settings (
            id INTEGER PRIMARY KEY DEFAULT 1,
            mode TEXT NOT NULL DEFAULT 'station',
            "stationId" TEXT,
            "stationName" TEXT,
            "streamUrl" TEXT,
            "djName" TEXT,
            "updatedBy" TEXT,
            "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT radio_settings_single_row CHECK (id = 1),
            CONSTRAINT radio_settings_mode_check CHECK (mode IN ('station', 'dj'))
        )`
    );

    // Daha önceki radyo tablosu varsa YouTube alanlarını güvenli şekilde ekle.
    await pool.query(
        `ALTER TABLE radio_settings
         ADD COLUMN IF NOT EXISTS "youtubeVideoId" TEXT`
    );

    await pool.query(
        `ALTER TABLE radio_settings
         ADD COLUMN IF NOT EXISTS "youtubeUrl" TEXT`
    );

    await pool.query(
        `ALTER TABLE radio_settings
         ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMPTZ`
    );

    await pool.query(
        `INSERT INTO radio_settings (
            id,
            mode
        )
        VALUES (1, 'station')
        ON CONFLICT (id)
        DO NOTHING`
    );
}

async function getRadioSettings() {

    await ensureRadioSettingsTable();

    const result =
        await pool.query(
            `SELECT
                id,
                mode,
                "stationId",
                "stationName",
                "streamUrl",
                "youtubeVideoId",
                "youtubeUrl",
                "startedAt",
                "djName",
                "updatedBy",
                "updatedAt"
             FROM radio_settings
             WHERE id = 1
             LIMIT 1`
        );

    return result.rows[0] || null;
}

async function setYoutubeDjRadio({
    youtubeVideoId,
    youtubeUrl,
    djName,
    updatedBy
}) {

    await ensureRadioSettingsTable();

    const result =
        await pool.query(
            `UPDATE radio_settings
             SET mode = 'dj',
                 "stationId" = NULL,
                 "stationName" = 'CSI DJ',
                 "streamUrl" = NULL,
                 "youtubeVideoId" = $1,
                 "youtubeUrl" = $2,
                 "startedAt" = CURRENT_TIMESTAMP,
                 "djName" = $3,
                 "updatedBy" = $4,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = 1
             RETURNING
                id,
                mode,
                "stationId",
                "stationName",
                "streamUrl",
                "youtubeVideoId",
                "youtubeUrl",
                "startedAt",
                "djName",
                "updatedBy",
                "updatedAt"`,
            [
                youtubeVideoId,
                youtubeUrl,
                djName || null,
                updatedBy || null
            ]
        );

    return result.rows[0] || null;
}

async function stopDjRadio({
    updatedBy
}) {

    await ensureRadioSettingsTable();

    const result =
        await pool.query(
            `UPDATE radio_settings
             SET mode = 'station',
                 "streamUrl" = NULL,
                 "youtubeVideoId" = NULL,
                 "youtubeUrl" = NULL,
                 "startedAt" = NULL,
                 "djName" = NULL,
                 "updatedBy" = $1,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = 1
             RETURNING
                id,
                mode,
                "stationId",
                "stationName",
                "streamUrl",
                "youtubeVideoId",
                "youtubeUrl",
                "startedAt",
                "djName",
                "updatedBy",
                "updatedAt"`,
            [
                updatedBy || null
            ]
        );

    return result.rows[0] || null;
}

module.exports = {
    ensureRadioSettingsTable,
    getRadioSettings,
    setYoutubeDjRadio,
    stopDjRadio
};
