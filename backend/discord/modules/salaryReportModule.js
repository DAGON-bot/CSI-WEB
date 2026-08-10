const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events
} = require("discord.js");

const {
    getDiscordClient
} = require("../discordClient");

const axios = require("axios");


// ========================================
// İSİM NORMALİZE ET
// ========================================

function normalizeDiscordName(value) {

    return String(value || "")
        .replace(/[✅✔️☑️]/g, "")
        .replace(/^[•*-]+\s*/g, "")
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

// ========================================
// TÜRKİYE TARİHİ
// ========================================

function getTurkeyDateString(dateValue = new Date()) {

    const date =
        dateValue instanceof Date
            ? dateValue
            : new Date(dateValue);

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Europe/Istanbul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(date);
}

// ========================================
// LİSANS SATIRI GEÇERLİ Mİ?
// ========================================

function isValidLicenseNameLine(rawLine) {

    const line =
        String(rawLine || "")
            .trim();

    if (!line) {
        return false;
    }

    // (Yazan: @kullanici)
    // (Yazan: <@123456>)
    // Yazan: ...
    if (
        /^\(?\s*yazan\s*:/i.test(line)
    ) {
        return false;
    }

    // Tek başına Discord mention ise
    // lisans alan kişi olarak alma.
    if (
        /^<@!?\d+>$/.test(line)
    ) {
        return false;
    }

    // Sadece emoji / işaret olan satırı alma.
    const withoutSymbols =
        line
            .replace(/[✅❌✔️☑️]/g, "")
            .trim();

    if (!withoutSymbols) {
        return false;
    }

    return true;
}

async function getLicenseNames(
    channelId,
    reportDate = null
) {

    const messages =
        await fetchAllChannelMessages(
            channelId
        );

    const targetDate =
        reportDate
            ? String(reportDate).trim()
            : getTurkeyDateString();

    const nameMap =
        new Map();

    for (const message of messages) {

        // ====================================
        // SADECE RAPOR GÜNÜ
        // ====================================

        const messageDate =
            getTurkeyDateString(
                message.createdAt
            );

        if (
            messageDate !== targetDate
        ) {
            continue;
        }

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

            if (
                !isValidLicenseNameLine(
                    rawLine
                )
            ) {
                continue;
            }

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

async function getAllLicenseNames(
    reportDate = null
) {

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
            license1ChannelId,
            reportDate
        ),

        getLicenseNames(
            license2ChannelId,
            reportDate
        ),

        getLicenseNames(
            license3ChannelId,
            reportDate
        )
    ]);

    return {
        license1,
        license2,
        license3
    };
}

// ========================================
// VDS'DEN GÜNLÜK MAAŞ KAYITLARINI ÇEK
// ========================================

async function fetchDailySalaryRecords(
    reportDate = null
) {

    const apiBaseUrl =
        String(
            process.env.CSI_API_BASE_URL ||
            ""
        )
            .trim()
            .replace(/\/+$/, "");

    const workerApiKey =
        String(
            process.env
                .DISCORD_WORKER_API_KEY ||
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

    const params = {};

    if (reportDate) {
        params.date =
            String(reportDate).trim();
    }

    const response =
        await axios.get(
            `${apiBaseUrl}/api/discord/salary-daily-report`,
            {
                params,

                headers: {
                    "X-Discord-Worker-Key":
                        workerApiKey
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
            "Günlük maaş kayıtları VDS'den alınamadı."
        );
    }

    return Array.isArray(
        response.data.salaries
    )
        ? response.data.salaries
        : [];
}

// ========================================
// GÜNLÜK MAAŞ RAPOR VERİSİ
// ========================================

async function buildDailySalaryReportData(
    reportDate = null
) {

    const salaryRecords =
        await fetchDailySalaryRecords(
            reportDate
        );

    const sentSalaryRecords =
        salaryRecords.filter(
            record =>
                record.discordSent === true
        );

    const sgkNames =
        await getSgkNames();

    const licenses =
        await getAllLicenseNames(
            reportDate
        );

    const officerMap = new Map();
    const personnelMap = new Map();

    for (const record of sentSalaryRecords) {

        const personnelName =
            String(record.personnelName || "").trim();

        const salaryOfficerName =
            String(record.salaryOfficerName || "").trim();

        const badge =
            String(record.badge || "").trim();

        const credit =
            Math.max(Number(record.credit) || 0, 0);

        const officerKey =
            normalizeDiscordNameForCompare(
                salaryOfficerName
            );

        if (officerKey) {

            if (!officerMap.has(officerKey)) {
                officerMap.set(
                    officerKey,
                    {
                        salaryOfficerName,
                        total: 0,
                        totalCredit: 0,
                        badges: {}
                    }
                );
            }

            const officer = officerMap.get(officerKey);

            officer.total += 1;
            officer.totalCredit += credit;

            if (!officer.badges[badge]) {
                officer.badges[badge] = 0;
            }

            officer.badges[badge] += 1;
        }

        const personnelKey =
            normalizeDiscordNameForCompare(
                personnelName
            );

        if (!personnelKey) {
            continue;
        }

        if (!personnelMap.has(personnelKey)) {
            personnelMap.set(
                personnelKey,
                {
                    personnelName,
                    salaryCount: 0,
                    baseSalaryCredit: 0,
                    extraSalaryCredit: 0,
                    licenseCredit: 0,
                    normalCredit: 0,
                    licenses: {
                        license1: false,
                        license2: false,
                        license3: false
                    },
                    badges: {},
                    salaryOfficers: new Set()
                }
            );
        }

        const personnel = personnelMap.get(personnelKey);

        personnel.salaryCount += 1;

        const isExtraSalary =
            /^Ek-Maaş\s*[123]$/i.test(badge);

        if (isExtraSalary) {
            personnel.extraSalaryCredit += credit;
        } else {
            personnel.baseSalaryCredit += credit;
        }

        if (!personnel.badges[badge]) {
            personnel.badges[badge] = 0;
        }

        personnel.badges[badge] += 1;

        if (salaryOfficerName) {
            personnel.salaryOfficers.add(
                salaryOfficerName
            );
        }
    }

    // Lisanslar sadece maaş kaydı bulunan personele eklenir.
    // Her lisans +1c'dir ve SGK x3 çarpanına dahil değildir.
    for (const personnel of personnelMap.values()) {

        const personnelKey =
            normalizeDiscordNameForCompare(
                personnel.personnelName
            );

        const hasLicense1 =
            licenses.license1.some(
                name =>
                    normalizeDiscordNameForCompare(name) ===
                    personnelKey
            );

        const hasLicense2 =
            licenses.license2.some(
                name =>
                    normalizeDiscordNameForCompare(name) ===
                    personnelKey
            );

        const hasLicense3 =
            licenses.license3.some(
                name =>
                    normalizeDiscordNameForCompare(name) ===
                    personnelKey
            );

        personnel.licenses.license1 = hasLicense1;
        personnel.licenses.license2 = hasLicense2;
        personnel.licenses.license3 = hasLicense3;

        personnel.licenseCredit =
            (hasLicense1 ? 1 : 0) +
            (hasLicense2 ? 1 : 0) +
            (hasLicense3 ? 1 : 0);

        personnel.normalCredit =
            personnel.baseSalaryCredit +
            personnel.extraSalaryCredit +
            personnel.licenseCredit;
    }

    const personnelSalaries = [];

    let normalTotalCredit = 0;
    let finalTotalCredit = 0;
    let totalBaseSalaryCredit = 0;
    let totalExtraSalaryCredit = 0;
    let totalLicenseCredit = 0;

    for (const personnel of personnelMap.values()) {

        const personnelHasSgk =
            hasSgk(
                personnel.personnelName,
                sgkNames
            );

        const multiplier =
            personnelHasSgk ? 3 : 1;

        // SGK sadece ana maaşı 3x yapar.
        // Ek-Maaş ve Lisans kredileri 1x kalır.
        const baseSalaryFinalCredit =
            personnelHasSgk
                ? personnel.baseSalaryCredit * 3
                : personnel.baseSalaryCredit;

        const finalCredit =
            baseSalaryFinalCredit +
            personnel.extraSalaryCredit +
            personnel.licenseCredit;

        normalTotalCredit += personnel.normalCredit;
        finalTotalCredit += finalCredit;
        totalBaseSalaryCredit += personnel.baseSalaryCredit;
        totalExtraSalaryCredit += personnel.extraSalaryCredit;
        totalLicenseCredit += personnel.licenseCredit;

        const badgeSummary =
            Object.entries(personnel.badges)
                .map(
                    ([badge, count]) =>
                        count > 1
                            ? `${badge} x${count}`
                            : badge
                )
                .join(", ");

        const licenseList = [];

        if (personnel.licenses.license1) {
            licenseList.push("Lisans-1");
        }

        if (personnel.licenses.license2) {
            licenseList.push("Lisans-2");
        }

        if (personnel.licenses.license3) {
            licenseList.push("Lisans-3");
        }

        personnelSalaries.push({
            personnelName: personnel.personnelName,
            salaryCount: personnel.salaryCount,
            badges: personnel.badges,
            badgeSummary,
            baseSalaryCredit: personnel.baseSalaryCredit,
            extraSalaryCredit: personnel.extraSalaryCredit,
            licenseCredit: personnel.licenseCredit,
            licenses: personnel.licenses,
            licenseSummary: licenseList.join(", "),
            baseSalaryFinalCredit,
            normalCredit: personnel.normalCredit,
            hasSgk: personnelHasSgk,
            multiplier,
            finalCredit,
            salaryOfficers: Array.from(
                personnel.salaryOfficers
            )
        });
    }

    const officers =
        Array.from(officerMap.values()).sort(
            (a, b) => b.total - a.total
        );

    personnelSalaries.sort(
        (a, b) => b.finalCredit - a.finalCredit
    );

    return {
        reportDate,
        totalSalaryCount: sentSalaryRecords.length,
        uniquePersonnelCount: personnelSalaries.length,
        totalBaseSalaryCredit,
        totalExtraSalaryCredit,
        totalLicenseCredit,
        normalTotalCredit,
        finalTotalCredit,
        sgkPersonnelCount:
            personnelSalaries.filter(
                item => item.hasSgk
            ).length,
        officers,
        personnelSalaries,
        sgkNames,
        licenses
    };
}


// ========================================
// RAPOR TARİHİNİ GÖRÜNTÜLE
// ========================================

function formatReportDate(reportDate = null) {

    const value =
        reportDate ||
        getTurkeyDateString();

    const parts =
        String(value)
            .split("-");

    if (parts.length !== 3) {
        return String(value);
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

// ========================================
// UZUN SATIRLARI EMBED PARÇALARINA BÖL
// ========================================

function chunkLines(
    lines,
    maxLength = 3600
) {

    const chunks = [];
    let current = "";

    for (const rawLine of lines) {

        const line =
            String(rawLine || "").trim();

        if (!line) {
            continue;
        }

        const candidate =
            current
                ? `${current}\n${line}`
                : line;

        if (
            candidate.length > maxLength &&
            current
        ) {
            chunks.push(current);
            current = line;
        } else {
            current = candidate;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

// ========================================
// MAAŞ RAPORU GÖRSEL YARDIMCILARI
// ========================================

const SALARY_DETAIL_PAGE_SIZE = 5;
let salaryReportInteractionRegistered = false;
let salaryReportCommandRegistered = false;
let salaryReportCommandRunning = false;

const SALARY_BADGE_EMOJIS = {
    "Bronz Maaş": "🟤",
    "Demir Maaş": "⚒️",
    "Gümüş Maaş": "🥈",
    "Altın Maaş": "🥇",
    "Plat Maaş": "🔷",
    "Elmas Maaş": "💎",
    "Zümrüt Maaş": "💚",
    "Ek-Maaş 1": "➕",
    "Ek-Maaş 2": "⭐",
    "Ek-Maaş 3": "🌟"
};

function chunkTextLines(
    lines,
    maxLength = 950
) {

    const chunks = [];
    let current = "";

    for (const rawLine of lines) {

        const line =
            String(rawLine || "").trim();

        if (!line) {
            continue;
        }

        const candidate =
            current
                ? `${current}\n${line}`
                : line;

        if (
            candidate.length > maxLength &&
            current
        ) {
            chunks.push(current);
            current = line;
        } else {
            current = candidate;
        }
    }

    if (current) {
        chunks.push(current);
    }

    return chunks;
}

function getCompactBadgeIcons(person) {

    const icons = [];

    for (
        const [badge, count] of
        Object.entries(person.badges || {})
    ) {

        const emoji =
            SALARY_BADGE_EMOJIS[badge] || "🏷️";

        const safeCount =
            Math.max(Number(count) || 0, 0);

        for (
            let index = 0;
            index < safeCount;
            index += 1
        ) {
            icons.push(emoji);
        }
    }

    if (person.licenseCredit > 0) {
        for (
            let index = 0;
            index < person.licenseCredit;
            index += 1
        ) {
            icons.push("📜");
        }
    }

    if (person.hasSgk) {
        icons.push("🏥");
    }

    return icons.length > 0
        ? icons.join(" ")
        : "—";
}

function createCompactPersonnelLine(
    person,
    index
) {

    const sgkText =
        person.hasSgk
            ? "SGK"
            : "SGK Yok";

    return (
        `**${index + 1}. ${person.personnelName}** — ` +
        `Ana: ${person.baseSalaryCredit}c | ` +
        `Ek: ${person.extraSalaryCredit}c | ` +
        `Lisans: ${person.licenseCredit}c | ` +
        `${sgkText} | ` +
        `**${person.finalCredit}c**`
    );
}

function createOfficerCompactLines(report) {

    const lines = [];

    for (
        const officer of
        report.officers || []
    ) {

        const badgeText =
            Object.entries(officer.badges || {})
                .map(
                    ([badge, count]) =>
                        `${badge}: ${count}`
                )
                .join(" • ");

        lines.push(
            `**${officer.salaryOfficerName}** — ` +
            `${officer.total} maaş rozeti` +
            (badgeText
                ? `\n↳ ${badgeText}`
                : "")
        );
    }

    if (lines.length === 0) {
        lines.push(
            "Bugün maaş rozeti veren kullanıcı bulunamadı."
        );
    }

    return lines;
}

// ========================================
// 1. MESAJ: ÖZET + KOMPAKT MAAŞ LİSTESİ
// ========================================

function createDailySalarySummaryEmbeds(report) {

    if (!report) {
        throw new Error(
            "Maaş rapor verisi eksik."
        );
    }

    const reportDateText =
        formatReportDate(
            report.reportDate
        );

    const officerLines =
        createOfficerCompactLines(
            report
        );

    const officerText =
        officerLines.length > 0
            ? officerLines.join("\n\n")
            : "Bugün maaş rozeti veren kullanıcı bulunamadı.";

    const compactPersonnelLines =
        (report.personnelSalaries || [])
            .map(
                (person, index) =>
                    createCompactPersonnelLine(
                        person,
                        index
                    )
            );

    const personnelText =
        compactPersonnelLines.length > 0
            ? compactPersonnelLines.join("\n\n")
            : "Bugün maaş alacak personel bulunamadı.";

    const summaryBlock =
        [
            `Toplam Maaş İşlemi : ${report.totalSalaryCount || 0}`,
            `Maaş Alacak Kişi   : ${report.uniquePersonnelCount || 0}`,
            `SGK'lı Personel    : ${report.sgkPersonnelCount || 0}`,
            "",
            `Ana Maaş Toplamı   : ${Number(report.totalBaseSalaryCredit) || 0}c`,
            `Ek Maaş Toplamı    : ${Number(report.totalExtraSalaryCredit) || 0}c`,
            `Lisans Toplamı     : ${Number(report.totalLicenseCredit) || 0}c`,
            "",
            `TOTAL MAAŞ         : ${Number(report.finalTotalCredit) || 0}c`
        ].join("\n");

    const summaryEmbed =
        new EmbedBuilder()
            .setTitle(
                "💰 CSI MAAŞ GÜN SONU RAPORU"
            )
            .setDescription(
                `📅 **Tarih:** ${reportDateText}`
            )
            .addFields(
                {
                    name: "📊 GÜNLÜK ÖZET",
                    value:
                        "```text\n" +
                        summaryBlock +
                        "\n```",
                    inline: false
                },
                {
                    name: "👮 MAAŞA YAZAN YETKİLİLER",
                    value:
                        "```text\n" +
                        officerText +
                        "\n```",
                    inline: false
                },
                {
                    name: "👥 MAAŞ ALACAKLAR (ÖZET)",
                    value:
                        "```text\n" +
                        personnelText +
                        "\n```",
                    inline: false
                }
            )
            .setTimestamp();

    return [summaryEmbed];
}

// ========================================
// 2. MESAJ: DETAYLI MAAŞ SAYFASI
// ========================================

function createSalaryDetailPageEmbed(
    report,
    page = 0
) {

    const salaries =
        Array.isArray(report?.personnelSalaries)
            ? report.personnelSalaries
            : [];

    const totalPages =
        Math.max(
            Math.ceil(
                salaries.length /
                SALARY_DETAIL_PAGE_SIZE
            ),
            1
        );

    const safePage =
        Math.min(
            Math.max(Number(page) || 0, 0),
            totalPages - 1
        );

    const startIndex =
        safePage * SALARY_DETAIL_PAGE_SIZE;

    const pagePeople =
        salaries.slice(
            startIndex,
            startIndex + SALARY_DETAIL_PAGE_SIZE
        );

    const lines = [];

    pagePeople.forEach(
        (person, localIndex) => {

            const globalIndex =
                startIndex + localIndex;

            const baseSalaryText =
                person.hasSgk
                    ? `${person.baseSalaryCredit}c ×3 → ${person.baseSalaryFinalCredit}c`
                    : `${person.baseSalaryCredit}c`;

            const licenseText =
                person.licenseCredit > 0
                    ? (
                        person.licenseSummary
                            ? `${person.licenseSummary} (+${person.licenseCredit}c)`
                            : `+${person.licenseCredit}c`
                    )
                    : "Yok";

            const sgkText =
                person.hasSgk
                    ? "✅ VAR"
                    : "❌ YOK";

            lines.push(
                [
                    `**${globalIndex + 1}. ${person.personnelName}**`,
                    `💰 Ana Maaş: ${baseSalaryText}`,
                    `➕ Ek Maaş: ${person.extraSalaryCredit}c`,
                    `📜 Lisans: ${licenseText}`,
                    `🛡️ SGK: ${sgkText}`,
                    `💵 **Ödenecek: ${person.finalCredit}c**`
                ].join("\n")
            );
        }
    );

    if (lines.length === 0) {
        lines.push(
            "Bugün maaş alacak personel bulunamadı."
        );
    }

    const embed =
        new EmbedBuilder()
            .setTitle(
                `👥 DETAYLI MAAŞ RAPORU — ${safePage + 1}/${totalPages}`
            )
            .setDescription(
                lines.join("\n\n")
            )
            .setFooter({
                text:
                    `${salaries.length} personel • Sayfa başına ${SALARY_DETAIL_PAGE_SIZE} kişi`
            });

    return {
        embed,
        page: safePage,
        totalPages
    };
}

function createSalaryDetailButtons(
    reportDate,
    page,
    totalPages
) {

    const cleanDate =
        String(
            reportDate ||
            getTurkeyDateString()
        );

    const previousPage =
        Math.max(page - 1, 0);

    const nextPage =
        Math.min(
            page + 1,
            totalPages - 1
        );

    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(
                    `salary_daily_page:${cleanDate}:${previousPage}:prev`
                )
                .setLabel("Önceki")
                .setEmoji("◀️")
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(page <= 0),

            new ButtonBuilder()
                .setCustomId(
                    `salary_daily_info:${cleanDate}:${page}`
                )
                .setLabel(
                    `${page + 1} / ${totalPages}`
                )
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(true),

            new ButtonBuilder()
                .setCustomId(
                    `salary_daily_page:${cleanDate}:${nextPage}:next`
                )
                .setLabel("Sonraki")
                .setEmoji("▶️")
                .setStyle(
                    ButtonStyle.Secondary
                )
                .setDisabled(
                    page >= totalPages - 1
                )
        );
}

// ========================================
// BUTON ETKİLEŞİMİ
// ========================================

async function handleSalaryReportInteraction(
    interaction
) {

    if (
        !interaction ||
        !interaction.isButton() ||
        !String(interaction.customId || "")
            .startsWith("salary_daily_page:")
    ) {
        return;
    }

    const parts =
        String(interaction.customId)
            .split(":");

    const reportDate =
        String(parts[1] || "").trim();

    const requestedPage =
        Math.max(
            Number(parts[2]) || 0,
            0
        );

    try {

        await interaction.deferUpdate();

        const report =
            await buildDailySalaryReportData(
                reportDate || null
            );

        const detailPage =
            createSalaryDetailPageEmbed(
                report,
                requestedPage
            );

        const buttons =
            createSalaryDetailButtons(
                reportDate ||
                    getTurkeyDateString(),
                detailPage.page,
                detailPage.totalPages
            );

        await interaction.editReply({
            embeds: [detailPage.embed],
            components: [buttons],
            allowedMentions: {
                parse: []
            }
        });

    } catch (error) {

        console.error(
            "Maaş raporu sayfası değiştirilemedi:",
            error.response?.data ||
            error.message ||
            error
        );

        try {
            await interaction.followUp({
                content:
                    "Maaş raporu sayfası değiştirilemedi.",
                ephemeral: true
            });
        } catch (_) {
            // Etkileşim cevabı verilemediyse sessiz geç.
        }
    }
}

function registerSalaryReportInteractionHandler() {

    if (salaryReportInteractionRegistered) {
        return;
    }

    const client =
        getDiscordClient();

    client.on(
        Events.InteractionCreate,
        handleSalaryReportInteraction
    );

    salaryReportInteractionRegistered = true;
}

// ========================================
// !RAPOR KOMUTU
// ========================================

async function handleSalaryReportCommand(
    message
) {

    if (
        !message ||
        !message.content ||
        message.author?.bot
    ) {
        return;
    }

    const command =
        String(message.content)
            .trim()
            .toLocaleLowerCase("tr-TR");

    if (command !== "!rapor") {
        return;
    }

    const salaryChannelId =
        String(
            process.env.DISCORD_SALARY_CHANNEL_ID ||
            ""
        ).trim();

    // !rapor sadece Maaş kanalında çalışır.
    if (
        !salaryChannelId ||
        String(message.channelId) !==
            salaryChannelId
    ) {
        return;
    }

    if (salaryReportCommandRunning) {

        try {
            await message.reply({
                content:
                    "⏳ Maaş raporu şu anda hazırlanıyor. Birkaç saniye sonra tekrar deneyin.",
                allowedMentions: {
                    repliedUser: false,
                    parse: []
                }
            });
        } catch (_) {
            // Mesaj gönderilemezse sessiz geç.
        }

        return;
    }

    salaryReportCommandRunning = true;

    try {

        console.log(
            `!rapor komutu alındı: ${message.author?.tag || message.author?.username || "Bilinmeyen kullanıcı"}`
        );

        await sendDailySalaryReport(
            null,
            salaryChannelId
        );

        console.log(
            "!rapor maaş gün sonu raporu gönderildi."
        );

    } catch (error) {

        console.error(
            "!rapor maaş raporu gönderilemedi:",
            error.response?.data ||
            error.message ||
            error
        );

        try {
            await message.reply({
                content:
                    "❌ Maaş raporu oluşturulamadı. Bot konsolunu kontrol edin.",
                allowedMentions: {
                    repliedUser: false,
                    parse: []
                }
            });
        } catch (_) {
            // Mesaj gönderilemezse sessiz geç.
        }

    } finally {

        salaryReportCommandRunning = false;
    }
}

function registerSalaryReportCommandHandler() {

    if (salaryReportCommandRegistered) {
        return;
    }

    const client =
        getDiscordClient();

    client.on(
        Events.MessageCreate,
        handleSalaryReportCommand
    );

    salaryReportCommandRegistered = true;
}

// ========================================
// MAAŞ GÜN SONU RAPORUNU DISCORD'A GÖNDER
// ========================================

async function sendDailySalaryReport(
    reportDate = null,
    channelId = null
) {

    const cleanChannelId =
        String(
            channelId ||
            process.env.DISCORD_SALARY_CHANNEL_ID ||
            ""
        ).trim();

    if (!cleanChannelId) {
        throw new Error(
            "DISCORD_SALARY_CHANNEL_ID tanımlı değil."
        );
    }

    const report =
        await buildDailySalaryReportData(
            reportDate
        );

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

    registerSalaryReportInteractionHandler();

    const channel =
        await client.channels.fetch(
            cleanChannelId
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        typeof channel.send !== "function"
    ) {
        throw new Error(
            "Maaş rapor kanalı bulunamadı veya mesaj gönderilemiyor."
        );
    }

    // 1) Gün özeti + kompakt maaş alacaklar listesi
    const summaryEmbeds =
    createDailySalarySummaryEmbeds(
        report
    );

const summaryMessage =
    await channel.send({
        embeds: summaryEmbeds,
        allowedMentions: {
            parse: []
        }
    });
    // 2) Detaylı maaşlar - 5 kişi / sayfa
    const detailPage =
        createSalaryDetailPageEmbed(
            report,
            0
        );

    const detailButtons =
        createSalaryDetailButtons(
            report.reportDate ||
                reportDate ||
                getTurkeyDateString(),
            detailPage.page,
            detailPage.totalPages
        );

    const detailMessage =
        await channel.send({
            embeds: [detailPage.embed],
            components: [detailButtons],
            allowedMentions: {
                parse: []
            }
        });

    return {
        report,
        sentMessages: [
            {
                id: summaryMessage.id,
                channelId:
                    summaryMessage.channelId
            },
            {
                id: detailMessage.id,
                channelId:
                    detailMessage.channelId
            }
        ]
    };
}

module.exports = {
    normalizeDiscordName,
    normalizeDiscordNameForCompare,
    fetchAllChannelMessages,

    getSgkNames,
    hasSgk,

    getTurkeyDateString,
    isValidLicenseNameLine,

    getLicenseNames,
    getAllLicenseNames,

    fetchDailySalaryRecords,
    buildDailySalaryReportData,
    formatReportDate,
    chunkLines,
    chunkTextLines,
    createDailySalarySummaryEmbeds,
    createSalaryDetailPageEmbed,
    createSalaryDetailButtons,
    handleSalaryReportInteraction,
    registerSalaryReportInteractionHandler,
    handleSalaryReportCommand,
    registerSalaryReportCommandHandler,
    sendDailySalaryReport
};
