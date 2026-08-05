const {
    EmbedBuilder
} = require("discord.js");

function cleanText(
    value,
    fieldName,
    maxLength = 100
) {

    const text =
        String(value || "").trim();

    if (!text) {
        throw new Error(
            `${fieldName} bilgisi eksik.`
        );
    }

    if (text.length > maxLength) {
        throw new Error(
            `${fieldName} en fazla ${maxLength} karakter olabilir.`
        );
    }

    return text;
}

function createPromotionEmbed(data) {

    const personnelName =
        cleanText(
            data?.personnelName,
            "Personel adı",
            80
        );

    const oldBadge =
        cleanText(
            data?.oldBadge,
            "Eski rozet",
            80
        );

    const oldRank =
        cleanText(
            data?.oldRank,
            "Eski rütbe",
            80
        );

    const newBadge =
        cleanText(
            data?.newBadge,
            "Yeni rozet",
            80
        );

    const newRank =
        cleanText(
            data?.newRank,
            "Yeni rütbe",
            80
        );

    const promotedBy =
        cleanText(
            data?.promotedBy,
            "Terfiyi veren",
            80
        );

    return new EmbedBuilder()
        .setColor(0xf0c419)
        .setTitle(
            "📈 Personel Terfi Bildirimi"
        )
        .setDescription(
            `**${personnelName}** adlı personelin terfi işlemi tamamlandı.`
        )
        .addFields(
            {
                name: "👤 Personel",
                value:
                    `\`\`\`\n${personnelName}\n\`\`\``,
                inline: false
            },
            {
                name: "🏷️ Rozet Değişimi",
                value:
                    `\`\`\`\n${oldBadge}  →  ${newBadge}\n\`\`\``,
                inline: false
            },
            {
                name: "🎖️ Rütbe Değişimi",
                value:
                    `\`\`\`\n${oldRank}  →  ${newRank}\n\`\`\``,
                inline: false
            },
            {
                name: "👤 Terfiyi Veren",
                value:
                    `\`\`\`\n${promotedBy}\n\`\`\``,
                inline: false
            }
        )
        .setFooter({
            text:
                "CSI Yönetim Sistemi"
        })
        .setTimestamp();
}

module.exports = {
    createPromotionEmbed
};