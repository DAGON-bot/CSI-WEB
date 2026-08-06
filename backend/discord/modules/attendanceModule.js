const {
    EmbedBuilder
} = require("discord.js");

function cleanText(value, fieldName, maxLength = 80) {

    const text = String(value || "").trim();

    if (!text) {
        throw new Error(`${fieldName} bilgisi eksik.`);
    }

    if (text.length > maxLength) {
        throw new Error(`${fieldName} bilgisi çok uzun.`);
    }

    return text;
}

function integerValue(
    value,
    fieldName,
    minimum = 0,
    maximum = 1000000
) {

    const number = Number(value);

    if (
        !Number.isInteger(number) ||
        number < minimum ||
        number > maximum
    ) {
        throw new Error(`${fieldName} bilgisi geçersiz.`);
    }

    return number;
}

function createAttendanceEmbed(data) {

    const personnelName = cleanText(
        data?.personnelName,
        "Personel adı"
    );

    const performedBy = cleanText(
        data?.performedBy,
        "Puantajı yapan kişi"
    );

    const activeHours = integerValue(data?.activeHours, "Aktif saat");
    const workingHours = integerValue(data?.workingHours, "Çalışma saati");
    const mrCount = integerValue(data?.mrCount, "MR sayısı");
    const promotionCount = integerValue(data?.promotionCount, "Terfi sayısı");
    const educationCount = integerValue(data?.educationCount, "Eğitim sayısı");
    const bulkPromotionCount = integerValue(data?.bulkPromotionCount, "Toplu terfi sayısı");
    const licenseCount = integerValue(data?.licenseCount, "Lisans sayısı");
    const normalScore = integerValue(data?.normalScore, "Normal puan");
    const penalty = integerValue(data?.penalty, "Ceza");
    const netNormalScore = integerValue(data?.netNormalScore, "Net puan", -1000000);
    const extraScore = integerValue(data?.extraScore, "Ekstra puan", -1000000);
    const newXP = integerValue(data?.newXP, "Yeni XP", -1000000);
    const earnedEsCoin = integerValue(data?.earnedEsCoin, "Eş Coin");

    const lines = [];

    if (activeHours > 0) {
        lines.push(`${activeHours} saat süre +${activeHours}XP`);
    }

    if (workingHours > 0) {
        lines.push(`${workingHours} saat çalışma süresi +${workingHours * 3}XP`);
    }

    if (mrCount > 0) {
        lines.push(`${mrCount}X MR +${mrCount}XP`);
    }

    if (promotionCount > 0) {
        lines.push(`${promotionCount}X Terfi +${promotionCount * 3}XP`);
    }

    if (educationCount > 0) {
        lines.push(`${educationCount}X Eğitim +${educationCount * 5}XP`);
    }

    if (bulkPromotionCount > 0) {
        lines.push(`${bulkPromotionCount}X Toplu Terfi +${bulkPromotionCount * 10}XP`);
    }

    if (licenseCount > 0) {
        lines.push(`${licenseCount}X Lisans +${licenseCount * 10}XP`);
    }

    if (penalty > 0) {
        lines.push(`Ceza -${penalty}XP`);
    }

    const totalWithExtra = netNormalScore + extraScore;
    const extraText = extraScore >= 0
        ? `+${extraScore}`
        : String(extraScore);

    const reportDate = new Date().toLocaleDateString(
        "tr-TR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Europe/Istanbul"
        }
    );

    const description = [
        `**${personnelName}**`,
        `**${reportDate}**`,
        "",
        ...lines,
        "",
        normalScore >= 75
            ? "Toplam: Max Puan 75XP"
            : `Toplam: ${normalScore}XP`,
        `(Ekstra Puan ${extraText}XP) **${totalWithExtra}XP**`,
        "",
        `Yeni XP: **${newXP}XP**`,
        "",
        `Eş Coin: **${earnedEsCoin}**`,
        "",
        `Puantajı Yapan: **${performedBy}**`
    ].join("\n");

    return new EmbedBuilder()
        .setColor(0xf0c419)
        .setTitle("📋 Puantaj Raporu")
        .setDescription(description)
        .setFooter({
            text: "CSI Puantaj Kontrol Sistemi"
        })
        .setTimestamp();
}

module.exports = {
    createAttendanceEmbed
};
