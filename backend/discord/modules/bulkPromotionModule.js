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

function cleanMultiplier(value) {

    const multiplier =
        Number(value);

    if (
        !Number.isInteger(multiplier) ||
        multiplier < 1 ||
        multiplier > 100
    ) {

        throw new Error(
            "Dağıtım çarpanı geçersiz."
        );
    }

    return multiplier;
}

function cleanPromotions(promotions) {

    if (
        !Array.isArray(promotions) ||
        promotions.length === 0
    ) {

        throw new Error(
            "Toplu terfi listesi boş."
        );
    }

    if (promotions.length > 50) {

        throw new Error(
            "Tek mesajda en fazla 50 personel olabilir."
        );
    }

    return promotions.map(
        (
            promotion,
            index
        ) => {

            return {
                username:
                    cleanText(
                        promotion?.username,
                        `${index + 1}. personel adı`,
                        80
                    ),

                oldRank:
                    cleanText(
                        promotion?.oldRank,
                        `${index + 1}. eski rütbe`,
                        80
                    ),

                newRank:
                    cleanText(
                        promotion?.newRank,
                        `${index + 1}. yeni rütbe`,
                        80
                    )
            };
        }
    );
}

function createBulkPromotionEmbed(data) {

    const distributorName =
        cleanText(
            data?.distributorName,
            "Dağıtan kişi",
            80
        );

    const distributorCode =
        cleanText(
            data?.distributorCode,
            "Dağıtan kişinin kodu",
            80
        );

    const startTime =
        cleanText(
            data?.startTime,
            "Dağıtım başlangıç saati",
            20
        );

    const endTime =
        cleanText(
            data?.endTime,
            "Dağıtım bitiş saati",
            20
        );

    const multiplier =
        cleanMultiplier(
            data?.multiplier
        );

    const promotions =
        cleanPromotions(
            data?.promotions
        );

    const promotionLines =
        promotions
            .map(
                promotion =>
                    `${promotion.username} : ${promotion.oldRank} → ${promotion.newRank}`
            )
            .join("\n");

    const title =
        `${startTime} Toplu Terfi Dağıtımı`;

    const description =
        [
            `**Dağıtan Kişi:** ${distributorName}`,
            `**Dağıtan Kişinin Kodu:** ${distributorCode}`,
            `**Dağıtım Başlangıç Saati:** ${startTime}`,
            `**Dağıtım Bitiş Saati:** ${endTime}`,
            `**Dağıtım Çarpanı:** ${multiplier}x`,
            "",
            `\`\`\`\n${promotionLines}\n\`\`\``
        ].join("\n");

    if (description.length > 4096) {

        throw new Error(
            "Toplu terfi mesajı Discord sınırını aşıyor."
        );
    }

    return new EmbedBuilder()
        .setColor(0xf0c419)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text:
                "CSI Yönetim Sistemi"
        })
        .setTimestamp();
}

module.exports = {
    createBulkPromotionEmbed
};