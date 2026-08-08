const {
    EmbedBuilder,
    Events
} = require("discord.js");

const {
    getDiscordClient
} = require("../discordClient");

// ========================================
// CSI GÜN SONU PUANTAJ FAALİYET RAPORU
// ========================================

const REPORT_CHANNEL_ID =
    String(
        process.env
            .DISCORD_DAILY_ATTENDANCE_REPORT_CHANNEL_ID ||
        "1535662845776236724"
    ).trim();

const CHANNELS = {
    promotion:
        "1510418999605985350",

    education:
        "1510417048419962961",

    bulkPromotion:
        "1510420979908612126",

    licenses: [
        "1533099371439329370",
        "1533099441450520768",
        "1533099482227675321"
    ],

    mr: [
        "1522162291859132427",
        "1522162393906548736",
        "1522162432532025415",
        "1522162465507508344",
        "1522162486906978424",
        "1522162519643258880",
        "1525832841680650251",
        "1522162579768868904",
        "1522162603206512721",
        "1522162623745884250"
    ]
};

const XP = {
    mr: 1,
    promotion: 3,
    education: 5,
    license: 10,
    bulkPromotion: 10
};

// ========================================
// PUANTAJ PANELİNDEKİ PERSONEL LİSTESİ
// Rapor sırası da bu listedir.
// ========================================

const PUANTAJ_PERSONNEL = [
    "oheling",
    "mirindaa",
    "slaysu",
    "nyara",
    "harikaresul34",
    "Angela",
    "bln2323",
    "cbenescb",
    "cute",
    "çağrı1903",
    "çomar",
    "gorken",
    "drakmir",
    "blub",
    "nur58",
    "sadenok",
    "google-amca",
    "rockstar1881",
    "teddiciq19",
    "infillame"
];

// Discord'daki bilinen isim farkları.
// Anahtar = puantaj listesindeki isim.
// Değerler = Discord'da aynı kişiyi ifade eden ek isimler.
const PERSONNEL_ALIASES = {
    oheling: [
        "ohelino56"
    ],

    Angela: [
        "!-Angela!",
        "-Angela-",
        "Angela"
    ],

    cbenescb: [
        "CB.enes.CB",
        "CB.enes.cb",
        "cbenescb"
    ],

    "çağrı1903": [
        "Çağrı1903",
        "çağrı1903",
        "cagri1903"
    ]
};

let commandRegistered = false;
let commandRunning = false;

// ========================================
// TARİH / İSİM YARDIMCILARI
// ========================================

function getTurkeyDateString(
    dateValue = new Date()
) {

    const date =
        dateValue instanceof Date
            ? dateValue
            : new Date(dateValue);

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "Europe/Istanbul",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit"
        }
    ).format(date);
}

function formatDate(
    dateString
) {

    const parts =
        String(dateString || "")
            .split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return (
        `${parts[2]}.` +
        `${parts[1]}.` +
        `${parts[0]}`
    );
}

function cleanDisplayName(
    value
) {

    return String(value || "")
        .replace(/```/g, "")
        .replace(/\*\*/g, "")
        .replace(/__/g, "")
        .replace(/~~/g, "")
        .replace(/`/g, "")
        .replace(/[✅✔️☑️]/g, "")
        .trim();
}

function normalizeForCompare(
    value
) {

    return cleanDisplayName(value)
        .toLocaleLowerCase(
            "tr-TR"
        )
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .normalize("NFKD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]/g,
            ""
        );
}

function buildPersonnelLookup() {

    const lookup =
        new Map();

    for (
        const personnelName of
        PUANTAJ_PERSONNEL
    ) {

        const variants = [
            personnelName,
            ...(
                PERSONNEL_ALIASES[
                    personnelName
                ] || []
            )
        ];

        for (
            const variant of
            variants
        ) {

            const key =
                normalizeForCompare(
                    variant
                );

            if (key) {
                lookup.set(
                    key,
                    personnelName
                );
            }
        }
    }

    return lookup;
}

const PERSONNEL_LOOKUP =
    buildPersonnelLookup();

function resolvePersonnelName(
    rawName
) {

    const key =
        normalizeForCompare(
            rawName
        );

    return (
        PERSONNEL_LOOKUP.get(
            key
        ) ||
        null
    );
}

function createEmptyPersonnelMap() {

    const map =
        new Map();

    for (
        const name of
        PUANTAJ_PERSONNEL
    ) {

        map.set(
            name,
            {
                name,
                mr: 0,
                promotion: 0,
                education: 0,
                license: 0,
                bulkPromotion: 0,
                activityXP: 0
            }
        );
    }

    return map;
}

function addCount(
    map,
    rawName,
    key
) {

    const personnelName =
        resolvePersonnelName(
            rawName
        );

    if (!personnelName) {
        return false;
    }

    const item =
        map.get(
            personnelName
        );

    if (!item) {
        return false;
    }

    item[key] += 1;

    return true;
}

function fieldValue(
    embed,
    labelPart
) {

    const fields =
        Array.isArray(
            embed?.fields
        )
            ? embed.fields
            : [];

    const wanted =
        String(
            labelPart || ""
        )
            .toLocaleLowerCase(
                "tr-TR"
            );

    const field =
        fields.find(
            item =>
                String(
                    item?.name || ""
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    )
                    .includes(
                        wanted
                    )
        );

    return field
        ? cleanDisplayName(
            field.value
        )
        : "";
}

// ========================================
// KANAL MESAJLARINI BUGÜNE GÖRE OKU
// ========================================

async function fetchTodayMessages(
    channelId,
    dateString
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

    const channel =
        await client.channels.fetch(
            String(channelId)
        );

    if (
        !channel ||
        !channel.isTextBased()
    ) {

        throw new Error(
            `Discord metin kanalı bulunamadı: ${channelId}`
        );
    }

    const result = [];

    let before = null;
    let reachedOlderDay =
        false;

    while (
        !reachedOlderDay
    ) {

        const options = {
            limit: 100
        };

        if (before) {
            options.before =
                before;
        }

        const collection =
            await channel.messages.fetch(
                options
            );

        if (
            !collection ||
            collection.size === 0
        ) {
            break;
        }

        const messages =
            Array.from(
                collection.values()
            );

        for (
            const message of
            messages
        ) {

            const messageDate =
                getTurkeyDateString(
                    message.createdAt
                );

            if (
                messageDate ===
                dateString
            ) {

                result.push(
                    message
                );

                continue;
            }

            if (
                messageDate <
                dateString
            ) {

                reachedOlderDay =
                    true;

                break;
            }
        }

        const oldest =
            messages[
                messages.length - 1
            ];

        if (
            !oldest ||
            collection.size < 100
        ) {
            break;
        }

        before =
            oldest.id;
    }

    return result;
}

// ========================================
// MESAJ FORMATLARINI OKU
// ========================================

function getMessageAuthorName(
    message
) {

    return cleanDisplayName(
        message?.member?.displayName ||
        message?.author?.globalName ||
        message?.author?.username ||
        ""
    );
}

function parsePromotionGiver(
    message
) {

    for (
        const embed of
        message.embeds || []
    ) {

        const value =
            fieldValue(
                embed,
                "terfiyi veren"
            );

        if (value) {
            return value;
        }
    }

    return "";
}

function parseSalaryOfficer(
    message
) {

    for (
        const embed of
        message.embeds || []
    ) {

        const value =
            fieldValue(
                embed,
                "maaşı veren yetkili"
            );

        if (value) {
            return value;
        }
    }

    return "";
}

function parseEducationGiver(
    message
) {

    const sources = [
        String(
            message.content ||
            ""
        ),

        ...(
            message.embeds || []
        ).map(
            embed =>
                String(
                    embed.description ||
                    ""
                )
        )
    ];

    for (
        const source of
        sources
    ) {

        const match =
            source.match(
                /eğitim\s*veren\s*:\s*([^\r\n]+)/i
            );

        if (
            match?.[1]
        ) {

            return cleanDisplayName(
                match[1]
            );
        }
    }

    return "";
}

function parseBulkPromotionGiver(
    message
) {

    const sources = [
        String(
            message.content ||
            ""
        )
    ];

    for (
        const embed of
        message.embeds || []
    ) {

        sources.push(
            String(
                embed.title ||
                ""
            )
        );

        sources.push(
            String(
                embed.description ||
                ""
            )
        );

        for (
            const field of
            embed.fields || []
        ) {

            sources.push(
                `${field.name || ""}: ${field.value || ""}`
            );
        }
    }

    for (
        const source of
        sources
    ) {

        const match =
            source.match(
                /dağıtan\s*kişi\s*:?\s*\*{0,2}\s*([^\r\n*]+)/i
            );

        if (
            match?.[1]
        ) {

            return cleanDisplayName(
                match[1]
            );
        }
    }

    return "";
}

// ========================================
// RAPORU HESAPLA
// ========================================

async function buildDailyAttendanceActivityReport(
    targetDate = new Date()
) {

    const dateString =
        typeof targetDate ===
        "string"
            ? targetDate
            : getTurkeyDateString(
                targetDate
            );

    // En baştan bütün puantaj personellerini
    // sıfır değerlerle ekliyoruz.
    const people =
        createEmptyPersonnelMap();

    // ------------------------------------
    // TERFİ
    // ------------------------------------

    const promotionMessages =
        await fetchTodayMessages(
            CHANNELS.promotion,
            dateString
        );

    for (
        const message of
        promotionMessages
    ) {

        addCount(
            people,
            parsePromotionGiver(
                message
            ),
            "promotion"
        );
    }

    // ------------------------------------
    // EĞİTİM
    // ------------------------------------

    const educationMessages =
        await fetchTodayMessages(
            CHANNELS.education,
            dateString
        );

    for (
        const message of
        educationMessages
    ) {

        addCount(
            people,
            parseEducationGiver(
                message
            ),
            "education"
        );
    }

    // ------------------------------------
    // TOPLU TERFİ
    // Bir toplu terfi mesajı = +1
    // ------------------------------------

    const bulkMessages =
        await fetchTodayMessages(
            CHANNELS.bulkPromotion,
            dateString
        );

    for (
        const message of
        bulkMessages
    ) {

        addCount(
            people,
            parseBulkPromotionGiver(
                message
            ),
            "bulkPromotion"
        );
    }

    // ------------------------------------
    // LİSANS
    // Her lisans kanalındaki HER MESAJ
    // mesajı yazan kişi için yalnızca +1.
    // Mesajın altındaki isim sayısı önemli değil.
    // ------------------------------------

    for (
        const channelId of
        CHANNELS.licenses
    ) {

        const messages =
            await fetchTodayMessages(
                channelId,
                dateString
            );

        for (
            const message of
            messages
        ) {

            if (
                message.author?.bot
            ) {
                continue;
            }

            addCount(
                people,
                getMessageAuthorName(
                    message
                ),
                "license"
            );
        }
    }

    // ------------------------------------
    // MR
    // 10 maaş kanalının tamamı tek sayaç.
    // ------------------------------------

    for (
        const channelId of
        CHANNELS.mr
    ) {

        const messages =
            await fetchTodayMessages(
                channelId,
                dateString
            );

        for (
            const message of
            messages
        ) {

            addCount(
                people,
                parseSalaryOfficer(
                    message
                ),
                "mr"
            );
        }
    }

    const rows =
        PUANTAJ_PERSONNEL.map(
            personnelName => {

                const person =
                    people.get(
                        personnelName
                    );

                const activityXP =
                    (person.mr *
                        XP.mr) +
                    (person.promotion *
                        XP.promotion) +
                    (person.education *
                        XP.education) +
                    (person.license *
                        XP.license) +
                    (person.bulkPromotion *
                        XP.bulkPromotion);

                return {
                    ...person,
                    activityXP
                };
            }
        );

    return {
        date:
            dateString,

        count:
            rows.length,

        rows
    };
}

// ========================================
// DISCORD RAPOR GÖRÜNÜMÜ
// ========================================

function createReportEmbeds(
    report
) {

    const groups = [];

    for (
        let i = 0;
        i < report.rows.length;
        i += 10
    ) {

        groups.push(
            report.rows.slice(
                i,
                i + 10
            )
        );
    }

    return groups.map(
        (
            group,
            pageIndex
        ) => {

            const embed =
                new EmbedBuilder()
                    .setTitle(
                        `📊 CSI GÜN SONU PUANTAJ RAPORU — ${pageIndex + 1}/${groups.length}`
                    )
                    .setDescription(
                        `📅 **Tarih:** ${formatDate(report.date)}\n` +
                        `👥 **Toplam Personel:** ${report.count}\n` +
                        `📄 **Sayfa:** ${pageIndex + 1}/${groups.length}\n\n` +
                        "Faaliyeti olmayan personeller de **0** olarak listelenir."
                    );

            group.forEach(
                (
                    person,
                    localIndex
                ) => {

                    const globalIndex =
                        (pageIndex * 10) +
                        localIndex +
                        1;

                    embed.addFields({
                        name:
                            `${globalIndex}. ${person.name}`,

                        value:
                            `MR: **${person.mr}**  •  ` +
                            `Terfi: **${person.promotion}**  •  ` +
                            `Eğitim: **${person.education}**\n` +
                            `Lisans: **${person.license}**  •  ` +
                            `Toplu Terfi: **${person.bulkPromotion}**\n` +
                            `⭐ Faaliyet XP: **${person.activityXP}**`,

                        inline:
                            false
                    });
                }
            );

            embed.setFooter({
                text:
                    "MR 1XP • Terfi 3XP • Eğitim 5XP • Lisans 10XP • Toplu Terfi 10XP"
            });

            embed.setTimestamp();

            return embed;
        }
    );
}

// ========================================
// RAPORU DISCORD'A GÖNDER
// ========================================

async function sendDailyAttendanceActivityReport(
    targetDate = new Date(),
    channelId = REPORT_CHANNEL_ID
) {

    const cleanChannelId =
        String(
            channelId || ""
        ).trim();

    if (!cleanChannelId) {

        throw new Error(
            "Puantaj gün sonu rapor kanal ID'si tanımlı değil."
        );
    }

    const report =
        await buildDailyAttendanceActivityReport(
            targetDate
        );

    const embeds =
        createReportEmbeds(
            report
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

    const channel =
        await client.channels.fetch(
            cleanChannelId
        );

    if (
        !channel ||
        !channel.isTextBased() ||
        typeof channel.send !==
            "function"
    ) {

        throw new Error(
            "Puantaj rapor kanalı bulunamadı veya mesaj gönderilemiyor."
        );
    }

    const sentMessage =
        await channel.send({
            embeds,
            allowedMentions: {
                parse: []
            }
        });

    return {
        report,
        sentMessage
    };
}

// ========================================
// !PUANTAJRAPOR KOMUTU
// ========================================

async function handleDailyAttendanceReportCommand(
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
        String(
            message.content
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (
        command !==
        "!puantajrapor"
    ) {
        return;
    }

    // Komut yalnızca yeni puantaj rapor kanalında çalışır.
    if (
        String(
            message.channelId
        ) !==
        REPORT_CHANNEL_ID
    ) {
        return;
    }

    if (commandRunning) {

        try {

            await message.reply({
                content:
                    "⏳ Puantaj raporu şu anda hazırlanıyor.",
                allowedMentions: {
                    repliedUser: false,
                    parse: []
                }
            });

        } catch (_) {}

        return;
    }

    commandRunning = true;

    try {

        await sendDailyAttendanceActivityReport(
            new Date(),
            REPORT_CHANNEL_ID
        );

        console.log(
            `!puantajrapor gönderildi: ${message.author?.tag || message.author?.username || "Bilinmeyen"}`
        );

    } catch (error) {

        console.error(
            "!puantajrapor hatası:",
            error.response?.data ||
            error.message ||
            error
        );

        try {

            await message.reply({
                content:
                    "❌ Puantaj gün sonu raporu oluşturulamadı. Bot konsolunu kontrol edin.",
                allowedMentions: {
                    repliedUser: false,
                    parse: []
                }
            });

        } catch (_) {}

    } finally {

        commandRunning =
            false;
    }
}

function registerDailyAttendanceReportCommandHandler() {

    if (commandRegistered) {
        return;
    }

    const client =
        getDiscordClient();

    client.on(
        Events.MessageCreate,
        handleDailyAttendanceReportCommand
    );

    commandRegistered =
        true;
}

module.exports = {
    REPORT_CHANNEL_ID,
    CHANNELS,
    XP,
    PUANTAJ_PERSONNEL,
    getTurkeyDateString,
    normalizeForCompare,
    resolvePersonnelName,
    buildDailyAttendanceActivityReport,
    createReportEmbeds,
    sendDailyAttendanceActivityReport,
    handleDailyAttendanceReportCommand,
    registerDailyAttendanceReportCommandHandler
};
