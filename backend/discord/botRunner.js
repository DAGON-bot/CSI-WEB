const path = require("path");
const axios = require("axios");

const {
    EmbedBuilder
} = require("discord.js");

require("dotenv").config({
    path: path.join(
        __dirname,
        "..",
        ".env"
    )
});

const {
    startDiscordClient,
    stopDiscordClient,
    getDiscordClient
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

const {
    registerSalaryReportInteractionHandler,
    registerSalaryReportCommandHandler
} = require(
    "./modules/salaryReportModule"
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
            "1510418999605985350"
        ).trim();

    const bulkPromotionChannelId =
        String(
            process.env
                .DISCORD_BULK_PROMOTION_CHANNEL_ID ||
            "1510420979908612126"
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

    const registrationChannelId =
        String(
            process.env
                .DISCORD_REGISTRATION_CHANNEL_ID ||
            "1535341433375166644"
        ).trim();

    const ttAnnouncementChannelId =
        String(
            process.env
                .DISCORD_TT_ANNOUNCEMENT_CHANNEL_ID ||
            "1509559681377632336"
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

    if (!bulkPromotionChannelId) {
        throw new Error(
            "DISCORD_BULK_PROMOTION_CHANNEL_ID tanımlı değil."
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

    if (!registrationChannelId) {
        throw new Error(
            "DISCORD_REGISTRATION_CHANNEL_ID tanımlı değil."
        );
    }

    return {
        apiBaseUrl,
        workerApiKey,
        promotionChannelId,
        bulkPromotionChannelId,
        salaryChannelId,
        attendanceChannelId,
        registrationChannelId,
        ttAnnouncementChannelId
    };
}

async function fetchPendingRegistrations(
    config
) {

    const response =
        await axios.get(
            `${config.apiBaseUrl}/api/discord/pending-registrations`,
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
            "Bekleyen yeni kayıt bildirimleri alınamadı."
        );
    }

    return Array.isArray(
        response.data.registrations
    )
        ? response.data.registrations
        : [];
}

async function markRegistrationAsSent(
    config,
    notificationId,
    discordMessageId
) {

    const response =
        await axios.patch(
            `${config.apiBaseUrl}/api/discord/registrations/${notificationId}/sent`,
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
            "Yeni kayıt bildirimi tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.notification;
}

function normalizeRoleName(value) {

    return String(value || "")
        .trim()
        .toLocaleLowerCase("tr-TR");
}

async function processRegistrationNotification(
    config,
    registration
) {

    const notificationId =
        Number(
            registration?.notificationId
        );

    if (
        !Number.isInteger(notificationId) ||
        notificationId <= 0
    ) {
        throw new Error(
            "Geçersiz yeni kayıt bildirimi alındı."
        );
    }

    const client =
        getDiscordClient();

    const channel =
        await client.channels.fetch(
            config.registrationChannelId
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        typeof channel.send !== "function"
    ) {
        throw new Error(
            "Yeni kayıt bildirim kanalı bulunamadı veya mesaj gönderilemiyor."
        );
    }

    let foundersRole = null;

    if (channel.guild) {

        try {
            await channel.guild.roles.fetch();
        } catch (_) {
            // Cache mevcutsa onunla devam et.
        }

        foundersRole =
            channel.guild.roles.cache.find(
                role =>
                    normalizeRoleName(role.name) ===
                    "kurucular"
            ) || null;
    }

    if (!foundersRole) {
        console.warn(
            "Kurucular rolü bulunamadı. Bildirim etiketsiz gönderilecek."
        );
    }

    const username =
        String(
            registration.username ||
            "Bilinmeyen kullanıcı"
        ).trim();

    const createdAt =
        registration.notificationCreatedAt
            ? new Date(
                registration.notificationCreatedAt
            )
            : new Date();

    const embed =
        new EmbedBuilder()
            .setTitle(
                "🆕 Yeni Site Kaydı"
            )
            .setDescription(
                `**${username}** siteye kayıt oldu ve yönetim onayı bekliyor.`
            )
            .addFields(
                {
                    name: "👤 Kullanıcı",
                    value: username,
                    inline: true
                },
                {
                    name: "📌 Durum",
                    value: "Onay Bekliyor",
                    inline: true
                }
            )
            .setTimestamp(createdAt);

    const content =
        foundersRole
            ? `<@&${foundersRole.id}>`
            : "@kurucular";

    const message =
        await channel.send({
            content,
            embeds: [embed],
            allowedMentions:
                foundersRole
                    ? {
                        parse: [],
                        roles: [
                            foundersRole.id
                        ]
                    }
                    : {
                        parse: []
                    }
        });

    await markRegistrationAsSent(
        config,
        notificationId,
        message.id
    );

    console.log(
        `Yeni kayıt Discord bildirimi gönderildi: #${notificationId} - ${username}`
    );
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

async function fetchPendingTtAnnouncements(
    config
) {

    const response =
        await axios.get(
            `${config.apiBaseUrl}/api/discord/pending-tt-announcements`,
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
            "Bekleyen TT duyuruları alınamadı."
        );
    }

    return Array.isArray(
        response.data.announcements
    )
        ? response.data.announcements
        : [];
}

async function markTtAnnouncementAsSent(
    config,
    announcementId,
    discordMessageId
) {

    const response =
        await axios.patch(
            `${config.apiBaseUrl}/api/discord/tt-announcements/${announcementId}/sent`,
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
            "TT duyurusu tamamlandı olarak işaretlenemedi."
        );
    }

    return response.data.announcement;
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

function normalizeAttendanceChannelName(
    value
) {

    return String(value || "")
        .trim()
        .toLocaleLowerCase("tr-TR")
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

async function findAttendancePersonnelChannel(
    config,
    personnelName
) {

    const client =
        getDiscordClient();

    if (
        !client ||
        !client.isReady()
    ) {
        throw new Error(
            "Discord botu hazır değil."
        );
    }

    const anchorChannel =
        await client.channels.fetch(
            config.attendanceChannelId
        );

    if (
        !anchorChannel ||
        !anchorChannel.guild
    ) {
        throw new Error(
            "Puantaj Discord sunucusu bulunamadı."
        );
    }

    const targetName =
        normalizeAttendanceChannelName(
            personnelName
        );

    if (!targetName) {
        throw new Error(
            "Personel adı Discord kanal eşleştirmesi için geçersiz."
        );
    }

    const guildChannels =
        await anchorChannel.guild.channels.fetch();

    const allMatches =
        Array.from(
            guildChannels.values()
        ).filter(
            channel => {

                if (
                    !channel ||
                    !channel.isTextBased() ||
                    typeof channel.send !==
                        "function"
                ) {
                    return false;
                }

                return (
                    normalizeAttendanceChannelName(
                        channel.name
                    ) === targetName
                );
            }
        );

    // Aynı isim başka kategorilerde de varsa,
    // önce "puantaj" kategorisindeki kanalı tercih et.
    const puantajMatches =
        allMatches.filter(
            channel => {

                const parentName =
                    normalizeAttendanceChannelName(
                        channel.parent?.name || ""
                    );

                return parentName.includes(
                    "puantaj"
                );
            }
        );

    if (puantajMatches.length === 1) {
        return puantajMatches[0];
    }

    if (puantajMatches.length > 1) {
        throw new Error(
            `"${personnelName}" için birden fazla Puantaj Discord kanalı bulundu.`
        );
    }

    if (allMatches.length === 1) {
        return allMatches[0];
    }

    if (allMatches.length > 1) {
        throw new Error(
            `"${personnelName}" için birden fazla Discord kanalı bulundu.`
        );
    }

    throw new Error(
        `"${personnelName}" isimli personelin Discord puantaj kanalı bulunamadı.`
    );
}

async function processAttendance(config, attendance) {

    const attendanceId = Number(attendance?.id);

    if (!Number.isInteger(attendanceId) || attendanceId <= 0) {
        throw new Error("Geçersiz puantaj kaydı alındı.");
    }

    const embed =
        createAttendanceEmbed(
            attendance
        );

    const personnelChannel =
        await findAttendancePersonnelChannel(
            config,
            attendance.personnelName
        );

    const message =
        await sendDiscordEmbed(
            personnelChannel.id,
            embed
        );

    await markAttendanceAsSent(
        config,
        attendanceId,
        message.id
    );

    console.log(
        `Puantaj Discord'a işlendi: #${attendanceId} - ${attendance.personnelName} -> #${personnelChannel.name}`
    );
}

async function processTtAnnouncement(
    config,
    announcement
) {

    const announcementId =
        Number(
            announcement?.id
        );

    if (
        !Number.isInteger(
            announcementId
        ) ||
        announcementId <= 0
    ) {

        throw new Error(
            "Geçersiz TT duyuru kaydı alındı."
        );
    }

    if (
        !config.ttAnnouncementChannelId
    ) {

        throw new Error(
            "DISCORD_TT_ANNOUNCEMENT_CHANNEL_ID tanımlı değil."
        );
    }

    const client =
        getDiscordClient();

    const channel =
        await client.channels.fetch(
            config.ttAnnouncementChannelId
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        typeof channel.send !==
            "function"
    ) {

        throw new Error(
            "TT duyuru kanalı bulunamadı veya mesaj gönderilemiyor."
        );
    }

    const message =
        await channel.send({
            content:
                String(
                    announcement.message ||
                    ""
                ),

            allowedMentions: {
                parse: [
                    "everyone"
                ]
            }
        });

    await markTtAnnouncementAsSent(
        config,
        announcementId,
        message.id
    );

    console.log(
        `TT duyurusu Discord'a gönderildi: #${announcementId} - ${announcement.announcementTime}`
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
            config.bulkPromotionChannelId,
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

function getSalaryBadgeChannelCandidates(
    badge
) {

    const normalized =
        String(badge || "")
            .trim()
            .toLocaleLowerCase("tr-TR")
            .replace(/ı/g, "i")
            .replace(/ğ/g, "g")
            .replace(/ü/g, "u")
            .replace(/ş/g, "s")
            .replace(/ö/g, "o")
            .replace(/ç/g, "c")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");

    const map = {
        bronzmaas: [
            "bronzmaaslistesi"
        ],
        demirmaas: [
            "demirmaaslistesi"
        ],
        gumusmaas: [
            "gumusmaaslistesi"
        ],
        altinmaas: [
            "altinmaaslistesi"
        ],
        platmaas: [
            "platmaaslistesi"
        ],
        elmasmaas: [
            "elmasmaaslistesi"
        ],
        zumrutmaas: [
            "zumrutmaaslistesi"
        ],
        ekmaas1: [
            "ekmaas1"
        ],
        ekmaas2: [
            "ekmaas2"
        ],
        ekmaas3: [
            "ekmaas3"
        ]
    };

    return map[normalized] || [];
}

async function findSalaryBadgeChannel(
    config,
    badge
) {

    const client =
        getDiscordClient();

    if (
        !client ||
        !client.isReady()
    ) {
        throw new Error(
            "Discord botu hazır değil."
        );
    }

    const anchorChannel =
        await client.channels.fetch(
            config.salaryChannelId
        );

    if (
        !anchorChannel ||
        !anchorChannel.guild
    ) {
        throw new Error(
            "Maaş Discord sunucusu bulunamadı."
        );
    }

    const candidates =
        getSalaryBadgeChannelCandidates(
            badge
        );

    if (candidates.length === 0) {
        throw new Error(
            `"${badge}" maaş rozeti için Discord kanal eşleştirmesi tanımlı değil.`
        );
    }

    const guildChannels =
        await anchorChannel.guild.channels.fetch();

    const matches =
        Array.from(
            guildChannels.values()
        ).filter(
            channel => {

                if (
                    !channel ||
                    !channel.isTextBased() ||
                    typeof channel.send !==
                        "function"
                ) {
                    return false;
                }

                const channelName =
                    normalizeAttendanceChannelName(
                        channel.name
                    );

                return candidates.includes(
                    channelName
                );
            }
        );

    const salaryCategoryMatches =
        matches.filter(
            channel => {

                const parentName =
                    normalizeAttendanceChannelName(
                        channel.parent?.name || ""
                    );

                return (
                    parentName.includes("maas") &&
                    parentName.includes("rozet")
                );
            }
        );

    if (
        salaryCategoryMatches.length === 1
    ) {
        return salaryCategoryMatches[0];
    }

    if (
        salaryCategoryMatches.length > 1
    ) {
        throw new Error(
            `"${badge}" için Maaş Rozetleri kategorisinde birden fazla Discord kanalı bulundu.`
        );
    }

    if (matches.length === 1) {
        return matches[0];
    }

    if (matches.length > 1) {
        throw new Error(
            `"${badge}" için birden fazla Discord kanalı bulundu.`
        );
    }

    throw new Error(
        `"${badge}" maaş rozeti için Discord kanalı bulunamadı.`
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

    const salaryChannel =
        await findSalaryBadgeChannel(
            config,
            salary.badge
        );

    const message =
        await sendDiscordEmbed(
            salaryChannel.id,
            embed
        );

    await markSalaryAsSent(
        config,
        salaryId,
        message.id
    );

    console.log(
        `Maaş Discord'a işlendi: #${salaryId} - ${salary.personnelName} - ${salary.badge} -> #${salaryChannel.name}`
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

        const registrations =
            await fetchPendingRegistrations(
                config
            );

        for (
            const registration of registrations
        ) {

            try {

                await processRegistrationNotification(
                    config,
                    registration
                );

            } catch (error) {

                console.error(
                    `Yeni kayıt bildirimi işlenemedi (#${registration?.notificationId || "?"}):`,
                    error.response?.data ||
                    error.message ||
                    error
                );
            }
        }

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

        const ttAnnouncements =
            await fetchPendingTtAnnouncements(
                config
            );

        for (
            const announcement of ttAnnouncements
        ) {

            try {

                await processTtAnnouncement(
                    config,
                    announcement
                );

            } catch (error) {

                console.error(
                    `TT duyurusu işlenemedi (#${announcement?.id || "?"}):`,
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

    registerSalaryReportInteractionHandler();
    registerSalaryReportCommandHandler();

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