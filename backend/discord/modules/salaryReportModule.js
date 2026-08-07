const {
    getDiscordClient
} = require("../discordClient");

const {
    getSalaryHistoryByDate
} = require("../../models/salaryHistoryModel");

// ========================================
// İSİM NORMALİZE ET
// ========================================

function normalizeDiscordName(value) {

    return String(value || "")
        .replace(/✅/g, "")
        .replace(/^[•\-*]+\s*/g, "")
        .replace(/:\s*$/g, "")
        .trim();
}

// ========================================
// KARŞILAŞTIRMA İÇİN İSİM NORMALİZE ET
// ========================================

function normalizeDiscordNameForCompare(value) {

    return normalizeDiscordName(value)
        .toLocaleLowerCase("tr-TR")
        .replace(/\s+/g, " ")
        .trim();
}

// ========================================
// KANALDAKİ TÜM MESAJLARI ÇEK
// ========================================

async function fetchAllChannelMessages(
    channelId,
    maxMessages = 5000
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

    const cleanChannelId =
        String(channelId || "").trim();

    if (!cleanChannelId) {
        throw new Error(
            "Discord kanal ID bulunamadı."
        );
    }

    const channel =
        await client.channels.fetch(
            cleanChannelId
        );

    if (!channel) {
        throw new Error(
            `Discord kanalı bulunamadı: ${cleanChannelId}`
        );
    }

    if (!channel.isTextBased()) {
        throw new Error(
            "Belirtilen Discord kanalı metin kanalı değil."
        );
    }

    const allMessages = [];

    let before = null;

    while (
        allMessages.length <
        maxMessages
    ) {

        const fetchOptions = {
            limit: 100
        };

        if (before) {
            fetchOptions.before =
                before;
        }

        const messages =
            await channel.messages.fetch(
                fetchOptions
            );

        if (
            !messages ||
            messages.size === 0
        ) {
            break;
        }

        const messageArray =
            Array.from(
                messages.values()
            );

        allMessages.push(
            ...messageArray
        );

        const oldestMessage =
            messageArray[
                messageArray.length - 1
            ];

        if (!oldestMessage) {
            break;
        }

        before =
            oldestMessage.id;

        if (messages.size < 100) {
            break;
        }
    }

    return allMessages.slice(
        0,
        maxMessages
    );
}

// ========================================
// SGK İSİMLERİNİ ÇEK
// ========================================

async function getSgkNames() {

    const sgkChannelId =
        String(
            process.env
                .DISCORD_SGK_CHANNEL_ID ||
            ""
        ).trim();

    if (!sgkChannelId) {
        throw new Error(
            "DISCORD_SGK_CHANNEL_ID tanımlı değil."
        );
    }

    const messages =
        await fetchAllChannelMessages(
            sgkChannelId
        );

    const nameMap =
        new Map();

    for (
        const message of messages
    ) {

        const content =
            String(
                message.content || ""
            ).trim();

        if (!content) {
            continue;
        }

        const lines =
            content.split(/\r?\n/);

        for (
            const rawLine of lines
        ) {

            const name =
                normalizeDiscordName(
                    rawLine
                );

            if (!name) {
                continue;
            }

            const compareName =
                normalizeDiscordNameForCompare(
                    name
                );

            if (!compareName) {
                continue;
            }

            if (
                !nameMap.has(
                    compareName
                )
            ) {
                nameMap.set(
                    compareName,
                    name
                );
            }
        }
    }

    return Array.from(
        nameMap.values()
    ).sort(
        (a, b) =>
            a.localeCompare(
                b,
                "tr"
            )
    );
}

// ========================================
// PERSONEL SGK KONTROLÜ
// ========================================

function hasSgk(
    personnelName,
    sgkNames
) {

    const target =
        normalizeDiscordNameForCompare(
            personnelName
        );

    if (!target) {
        return false;
    }

    return (
        Array.isArray(sgkNames)
            ? sgkNames
            : []
    ).some(
        name =>
            normalizeDiscordNameForCompare(
                name
            ) === target
    );
}

async function getLicenseNames(channelId) {

    const messages =
        await fetchAllChannelMessages(
            channelId
        );

    const nameMap =
        new Map();

    for (const message of messages) {

        const content =
            String(
                message.content || ""
            ).trim();

        if (!content) {
            continue;
        }

        const lines =
            content.split(/\r?\n/);

        for (const rawLine of lines) {

            const name =
                normalizeDiscordName(
                    rawLine
                );

            if (!name) {
                continue;
            }

            const compareName =
                normalizeDiscordNameForCompare(
                    name
                );

            if (!compareName) {
                continue;
            }

            if (!nameMap.has(compareName)) {
                nameMap.set(
                    compareName,
                    name
                );
            }
        }
    }

    return Array.from(
        nameMap.values()
    ).sort(
        (a, b) =>
            a.localeCompare(
                b,
                "tr"
            )
    );
}

async function getAllLicenseNames() {

    const license1ChannelId =
        String(
            process.env
                .DISCORD_LICENSE_1_CHANNEL_ID ||
            ""
        ).trim();

    const license2ChannelId =
        String(
            process.env
                .DISCORD_LICENSE_2_CHANNEL_ID ||
            ""
        ).trim();

    const license3ChannelId =
        String(
            process.env
                .DISCORD_LICENSE_3_CHANNEL_ID ||
            ""
        ).trim();

    const [
        license1,
        license2,
        license3
    ] = await Promise.all([
        getLicenseNames(
            license1ChannelId
        ),
        getLicenseNames(
            license2ChannelId
        ),
        getLicenseNames(
            license3ChannelId
        )
    ]);

    return {
        license1,
        license2,
        license3
    };
}

// ========================================
// GÜNLÜK MAAŞ RAPOR VERİSİ
// ========================================

async function buildDailySalaryReportData(
    reportDate = null
) {

    // ----------------------------------------
    // 1) BUGÜNKÜ MAAŞ KAYITLARI
    // ----------------------------------------

    const salaryRecords =
        await getSalaryHistoryByDate(
            reportDate
        );

    // Sadece gerçekten Discord'a işlenmiş
    // maaşları rapora dahil ediyoruz.
    const sentSalaryRecords =
        salaryRecords.filter(
            record =>
                record.discordSent === true
        );

    // ----------------------------------------
    // 2) SGK LİSTESİ
    // ----------------------------------------

    const sgkNames =
        await getSgkNames();

    // ----------------------------------------
    // 3) YETKİLİ İSTATİSTİKLERİ
    // ----------------------------------------

    const officerMap =
        new Map();

    // ----------------------------------------
    // 4) PERSONEL MAAŞ LİSTESİ
    // ----------------------------------------

    const personnelSalaries = [];

    let normalTotalCredit = 0;
    let sgkTotalCredit = 0;

    for (
        const record of
        sentSalaryRecords
    ) {

        const personnelName =
            String(
                record.personnelName || ""
            ).trim();

        const salaryOfficerName =
            String(
                record.salaryOfficerName || ""
            ).trim();

        const badge =
            String(
                record.badge || ""
            ).trim();

        const credit =
            Math.max(
                Number(record.credit) || 0,
                0
            );

        // ====================================
        // NORMAL TOPLAM
        // ====================================

        normalTotalCredit +=
            credit;

        // ====================================
        // SGK KONTROL
        // ====================================

        const personnelHasSgk =
            hasSgk(
                personnelName,
                sgkNames
            );

        const finalCredit =
            personnelHasSgk
                ? credit * 3
                : credit;

        sgkTotalCredit +=
            finalCredit;

        personnelSalaries.push({
            id:
                record.id,

            personnelName,

            badge,

            normalCredit:
                credit,

            hasSgk:
                personnelHasSgk,

            multiplier:
                personnelHasSgk
                    ? 3
                    : 1,

            finalCredit,

            salaryOfficerName
        });

        // ====================================
        // YETKİLİ SAYACI
        // ====================================

        const officerKey =
            normalizeDiscordNameForCompare(
                salaryOfficerName
            );

        if (!officerKey) {
            continue;
        }

        if (
            !officerMap.has(
                officerKey
            )
        ) {

            officerMap.set(
                officerKey,
                {
                    salaryOfficerName,
                    total: 0,
                    badges: {}
                }
            );
        }

        const officer =
            officerMap.get(
                officerKey
            );

        officer.total += 1;

        if (!officer.badges[badge]) {
            officer.badges[badge] = 0;
        }

        officer.badges[badge] += 1;
    }

    // ========================================
    // YETKİLİLERİ SIRALA
    // ========================================

    const officers =
        Array.from(
            officerMap.values()
        ).sort(
            (a, b) =>
                b.total - a.total
        );

    // ========================================
    // PERSONELLERİ SIRALA
    // ========================================

    personnelSalaries.sort(
        (a, b) =>
            b.finalCredit -
            a.finalCredit
    );

    return {

        reportDate,

        totalSalaryCount:
            sentSalaryRecords.length,

        normalTotalCredit,

        finalTotalCredit:
            sgkTotalCredit,

        sgkPersonnelCount:
            personnelSalaries.filter(
                item =>
                    item.hasSgk
            ).length,

        officers,

        personnelSalaries,

        sgkNames
    };
}

module.exports = {
    normalizeDiscordName,
    normalizeDiscordNameForCompare,
    fetchAllChannelMessages,
    getSgkNames,
    hasSgk,
    getLicenseNames,
    getAllLicenseNames,
    buildDailySalaryReportData
};