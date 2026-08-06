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
    createBulkPromotionEmbed
} = require(
    "./modules/bulkPromotionModule"
);

const {
    sendDiscordEmbed
} = require("./discordService");

const {
    createPromotionEmbed
} = require("./modules/promotionModule");

const {
    createSalaryEmbed
} = require("./modules/salaryModule");

const {
    createAttendanceEmbed
} = require(
    "./modules/attendanceModule"
);

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

    const salaryChannelId =
        String(
            process.env
                .DISCORD_SALARY_CHANNEL_ID ||
            promotionChannelId
        ).trim();

    const attendanceChannelId =
        String(
            process.env
                .DISCORD_ATTENDANCE_CHANNEL_ID ||
            promotionChannelId
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

    if (!salaryChannelId) {
        throw new Error(
            "DISCORD_SALARY_CHANNEL_ID tanımlı değil."
        );
    }

    if (!attendanceChannelId) {
        throw new Error(
            "DISCORD_ATTENDANCE_CHANNEL_ID tanımlı değil."
        );
    }

    return {
        apiBaseUrl,
        workerApiKey,
        promotionChannelId,
        salaryChannelId,
        attendanceChannelId
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

async function fetchPendingBulkPromotions(
    config
) {

    const response =
        await axios.get(
            `${config.apiBaseUrl}/api/discord/pending-bulk-promotions`,
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
            "Bekleyen toplu terfiler alınamadı."
        );
    }

    return Array.isArray(
        response.data.bulkPromotions
    )
        ? response.data.bulkPromotions
        : [];
}

async function fetchPendingSalaries(
    config
) {

    const response =
        await axios.get(
            `${config.apiBaseUrl}/api/discord/pending-salaries`,
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
            "Bekleyen maaş kayıtları alınamadı."
        );
    }

    return Array.isArray(
        response.data.salaries
    )
        ? response.data.salaries
        : [];
}

async function fetchPendingAttendances(config) {

    const response = await axios.get(
        `${config.apiBaseUrl}/api/discord/pending-attendances`,
        {
            params: {
                limit: 10
            },
            headers: {
                "X-Discord-Worker-Key": config.workerApiKey
            },
            timeout: 15000
        }
    );

    if (!response.data || response.data.success !== true) {
        throw new Error(
            response.data?.message ||
            "Bekleyen puantajlar alınamadı."
        );
    }

    return Array.isArray(response.data.attendances)
        ? response.data.attendances
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

async function markBulkPromotionAsSent(
    config,
    bulkPromotionId,
    discordMessageId
) {

    const response =
        await axios.patch(
            `${config.apiBaseUrl}/api/discord/bulk-promotions/${bulkPromotionId}/sent`,
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
            "Toplu terfi tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.bulkPromotion;
}

async function markSalaryAsSent(
    config,
    salaryId,
    discordMessageId
) {

    const response =
        await axios.patch(
            `${config.apiBaseUrl}/api/discord/salaries/${salaryId}/sent`,
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
            "Maaş kaydı tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.salary;
}

async function markAttendanceAsSent(
    config,
    attendanceId,
    discordMessageId
) {

    const response = await axios.patch(
        `${config.apiBaseUrl}/api/discord/attendances/${attendanceId}/sent`,
        {
            discordMessageId
        },
        {
            headers: {
                "X-Discord-Worker-Key": config.workerApiKey
            },
            timeout: 15000
        }
    );

    if (!response.data || response.data.success !== true) {
        throw new Error(
            response.data?.message ||
            "Puantaj tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.attendance;
}

async function processAttendance(config, attendance) {

    const attendanceId = Number(attendance?.id);

    if (!Number.isInteger(attendanceId) || attendanceId <= 0) {
        throw new Error("Geçersiz puantaj kaydı alındı.");
    }

    const embed = createAttendanceEmbed(attendance);

    const message = await sendDiscordEmbed(
        config.attendanceChannelId,
        embed
    );

    await markAttendanceAsSent(
        config,
        attendanceId,
        message.id
    );

    console.log(
        `Puantaj Discord'a işlendi: #${attendanceId} - ${attendance.personnelName}`
    );
}

async function processBulkPromotion(
    config,
    bulkPromotion
) {

    const bulkPromotionId =
        Number(
            bulkPromotion?.id
        );

    if (
        !Number.isInteger(
            bulkPromotionId
        ) ||
        bulkPromotionId <= 0
    ) {

        throw new Error(
            "Geçersiz toplu terfi kaydı alındı."
        );
    }

    const embed =
        createBulkPromotionEmbed({
            distributorName:
                bulkPromotion.distributorName,

            distributorCode:
                bulkPromotion.distributorCode,

            startTime:
                bulkPromotion.startTime,

            endTime:
                bulkPromotion.endTime,

            multiplier:
                bulkPromotion.multiplier,

            promotions:
                bulkPromotion.promotions
        });

    const message =
        await sendDiscordEmbed(
            config.promotionChannelId,
            embed
        );

    await markBulkPromotionAsSent(
        config,
        bulkPromotionId,
        message.id
    );

    console.log(
        `Toplu terfi Discord'a işlendi: #${bulkPromotionId} - ${bulkPromotion.promotions.length} personel`
    );
}

async function processSalary(
    config,
    salary
) {

    const salaryId =
        Number(salary?.id);

    if (
        !Number.isInteger(salaryId) ||
        salaryId <= 0
    ) {

        throw new Error(
            "Geçersiz maaş kaydı alındı."
        );
    }

    const embed =
        createSalaryEmbed({
            personnelName:
                salary.personnelName,

            salaryOfficerName:
                salary.salaryOfficerName,

            badge:
                salary.badge,

            credit:
                salary.credit,

            requiredMinutes:
                salary.requiredMinutes,

            previousHours:
                salary.previousHours,

            previousMinutes:
                salary.previousMinutes,

            currentHours:
                salary.currentHours,

            currentMinutes:
                salary.currentMinutes,

            workedMinutes:
                salary.workedMinutes
        });

    const message =
        await sendDiscordEmbed(
            config.salaryChannelId,
            embed
        );

    await markSalaryAsSent(
        config,
        salaryId,
        message.id
    );

    console.log(
        `Maaş Discord'a işlendi: #${salaryId} - ${salary.personnelName}`
    );
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
            promotion.promotedBy,

        workedHours:
            promotion.workedHours,

        workedMinutes:
            promotion.workedMinutes
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

    const bulkPromotions =
    await fetchPendingBulkPromotions(
        config
    );

for (
    const bulkPromotion of bulkPromotions
) {

    try {

        await processBulkPromotion(
            config,
            bulkPromotion
        );

    } catch (error) {

        console.error(
            `Toplu terfi işlenemedi (#${bulkPromotion?.id || "?"}):`,
            error.response?.data ||
            error.message ||
            error
        );
    }
}

        const salaries =
            await fetchPendingSalaries(
                config
            );

        for (
            const salary of salaries
        ) {

            try {

                await processSalary(
                    config,
                    salary
                );

            } catch (error) {

                console.error(
                    `Maaş işlenemedi (#${salary?.id || "?"}):`,
                    error.response?.data ||
                    error.message ||
                    error
                );
            }
        }

        const attendances =
            await fetchPendingAttendances(
                config
            );

        for (const attendance of attendances) {

            try {

                await processAttendance(
                    config,
                    attendance
                );

            } catch (error) {

                console.error(
                    `Puantaj işlenemedi (#${attendance?.id || "?"}):`,
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