const path = require("path");
const axios = require("axios");

require("dotenv").config({
    path: path.join(
        __dirname,
        "..",
        ".env"
    )
});

const {
    startDiscordClient,
    stopDiscordClient
} = require("./discordClient");

const {
    sendDiscordEmbed
} = require("./discordService");

const {
    createPromotionEmbed
} = require("./modules/promotionModule");

const POLL_INTERVAL_MS =
    Math.max(
        Number(
            process.env.DISCORD_WORKER_POLL_MS ||
            5000
        ),
        3000
    );

let workerRunning = false;
let polling = false;
let pollTimer = null;

function getWorkerConfig() {

    const apiBaseUrl =
        String(
            process.env.CSI_API_BASE_URL ||
            ""
        )
            .trim()
            .replace(/\/+$/, "");

    const workerApiKey =
        String(
            process.env.DISCORD_WORKER_API_KEY ||
            ""
        ).trim();

    const promotionChannelId =
        String(
            process.env
                .DISCORD_PROMOTION_CHANNEL_ID ||
            ""
        ).trim();

    if (!apiBaseUrl) {
        throw new Error(
            "CSI_API_BASE_URL tanımlı değil."
        );
    }

    if (!workerApiKey) {
        throw new Error(
            "DISCORD_WORKER_API_KEY tanımlı değil."
        );
    }

    if (!promotionChannelId) {
        throw new Error(
            "DISCORD_PROMOTION_CHANNEL_ID tanımlı değil."
        );
    }

    return {
        apiBaseUrl,
        workerApiKey,
        promotionChannelId
    };
}

async function fetchPendingPromotions(
    config
) {

    const response =
        await axios.get(
            `${config.apiBaseUrl}/api/discord/pending-promotions`,
            {
                params: {
                    limit: 10
                },

                headers: {
                    "X-Discord-Worker-Key":
                        config.workerApiKey
                },

                timeout: 15000
            }
        );

    if (
        !response.data ||
        response.data.success !== true
    ) {

        throw new Error(
            response.data?.message ||
            "Bekleyen terfiler alınamadı."
        );
    }

    return Array.isArray(
        response.data.promotions
    )
        ? response.data.promotions
        : [];
}

async function markPromotionAsSent(
    config,
    promotionId,
    discordMessageId
) {

    const response =
        await axios.patch(
            `${config.apiBaseUrl}/api/discord/promotions/${promotionId}/sent`,
            {
                discordMessageId
            },
            {
                headers: {
                    "X-Discord-Worker-Key":
                        config.workerApiKey
                },

                timeout: 15000
            }
        );

    if (
        !response.data ||
        response.data.success !== true
    ) {

        throw new Error(
            response.data?.message ||
            "Terfi tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.promotion;
}

async function processPromotion(
    config,
    promotion
) {

    const promotionId =
        Number(promotion?.id);

    if (
        !Number.isInteger(promotionId) ||
        promotionId <= 0
    ) {

        throw new Error(
            "Geçersiz terfi kaydı alındı."
        );
    }

    const embed =
        createPromotionEmbed({
            personnelName:
                promotion.username,

            oldBadge:
                promotion.oldBadge,

            oldRank:
                promotion.oldRank,

            newBadge:
                promotion.newBadge,

            newRank:
                promotion.newRank,

            promotedBy:
                promotion.promotedBy
        });

    const message =
        await sendDiscordEmbed(
            config.promotionChannelId,
            embed
        );

    await markPromotionAsSent(
        config,
        promotionId,
        message.id
    );

    console.log(
        `Terfi Discord'a işlendi: #${promotionId} - ${promotion.username}`
    );
}

async function pollPendingPromotions() {

    if (
        !workerRunning ||
        polling
    ) {
        return;
    }

    polling = true;

    try {

        const config =
            getWorkerConfig();

        const promotions =
            await fetchPendingPromotions(
                config
            );

        for (
            const promotion of promotions
        ) {

            try {

                await processPromotion(
                    config,
                    promotion
                );

            } catch (error) {

                console.error(
                    `Terfi işlenemedi (#${promotion?.id || "?"}):`,
                    error.response?.data ||
                    error.message ||
                    error
                );
            }
        }

    } catch (error) {

        console.error(
            "Discord worker kontrol hatası:",
            error.response?.data ||
            error.message ||
            error
        );

    } finally {

        polling = false;
    }
}

function scheduleNextPoll() {

    if (!workerRunning) {
        return;
    }

    pollTimer =
        setTimeout(
            async () => {

                await pollPendingPromotions();
                scheduleNextPoll();

            },
            POLL_INTERVAL_MS
        );
}

async function runDiscordBot() {

    console.log(
        "CSI Discord botu başlatılıyor..."
    );

    getWorkerConfig();

    const started =
        await startDiscordClient();

    if (!started) {
        throw new Error(
            "Discord botu başlatılamadı."
        );
    }

    workerRunning = true;

    console.log(
        `Discord worker aktif. Kontrol süresi: ${POLL_INTERVAL_MS} ms`
    );

    await pollPendingPromotions();
    scheduleNextPoll();
}

async function shutdown(signal) {

    if (!workerRunning) {
        process.exit(0);
    }

    console.log(
        `${signal} alındı. Discord botu kapatılıyor...`
    );

    workerRunning = false;

    if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
    }

    await stopDiscordClient();

    process.exit(0);
}

process.on(
    "SIGINT",
    () => shutdown("SIGINT")
);

process.on(
    "SIGTERM",
    () => shutdown("SIGTERM")
);

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "Yakalanmamış Promise hatası:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    error => {

        console.error(
            "Yakalanmamış uygulama hatası:",
            error
        );

        shutdown(
            "uncaughtException"
        );
    }
);

runDiscordBot().catch(error => {

    console.error(
        "Discord bot çalıştırma hatası:",
        error.response?.data ||
        error.message ||
        error
    );

    process.exit(1);
});