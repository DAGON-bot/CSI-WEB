const {
    EmbedBuilder
} = require("discord.js");

// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================

function cleanSalaryText(
    value,
    fieldName,
    maxLength = 100
) {

    const text =
        String(
            value || ""
        ).trim();

    if (!text) {

        throw new Error(
            `${fieldName} bilgisi eksik.`
        );
    }

    if (
        text.length >
        maxLength
    ) {

        throw new Error(
            `${fieldName} en fazla ${maxLength} karakter olabilir.`
        );
    }

    return text;
}

function normalizeSalaryInteger(
    value,
    fieldName,
    maximum = 1000000
) {

    const numberValue =
        Number(value);

    if (
        !Number.isInteger(
            numberValue
        ) ||
        numberValue < 0 ||
        numberValue > maximum
    ) {

        throw new Error(
            `${fieldName} bilgisi geçersiz.`
        );
    }

    return numberValue;
}

function formatSalaryMinutes(
    totalMinutes
) {

    const safeTotalMinutes =
        Math.max(
            Number(totalMinutes) || 0,
            0
        );

    const hours =
        Math.floor(
            safeTotalMinutes / 60
        );

    const minutes =
        safeTotalMinutes % 60;

    if (
        hours === 0 &&
        minutes === 0
    ) {

        return "0 Dakika";
    }

    if (hours === 0) {

        return `${minutes} Dakika`;
    }

    if (minutes === 0) {

        return `${hours} Saat`;
    }

    return (
        `${hours} Saat ` +
        `${minutes} Dakika`
    );
}

// ========================================
// MAAŞ BİLDİRİM EMBEDİ
// ========================================

function createSalaryEmbed(
    data
) {

    const personnelName =
        cleanSalaryText(
            data?.personnelName,
            "Personel adı",
            80
        );

    const salaryOfficerName =
        cleanSalaryText(
            data?.salaryOfficerName,
            "Maaşı veren yetkili",
            80
        );

    const badge =
        cleanSalaryText(
            data?.badge,
            "Maaş rozeti",
            80
        );

    const credit =
        normalizeSalaryInteger(
            data?.credit,
            "Kredi değeri",
            1000
        );

    const requiredMinutes =
        normalizeSalaryInteger(
            data?.requiredMinutes,
            "Gerekli süre"
        );

    const previousHours =
        normalizeSalaryInteger(
            data?.previousHours,
            "Önceki saat"
        );

    const previousMinutes =
        normalizeSalaryInteger(
            data?.previousMinutes,
            "Önceki dakika",
            59
        );

    const currentHours =
        normalizeSalaryInteger(
            data?.currentHours,
            "Güncel saat"
        );

    const currentMinutes =
        normalizeSalaryInteger(
            data?.currentMinutes,
            "Güncel dakika",
            59
        );

    const workedMinutes =
        normalizeSalaryInteger(
            data?.workedMinutes,
            "Çalışılan süre"
        );

    const previousTotalMinutes =
        (
            previousHours * 60
        ) +
        previousMinutes;

    const currentTotalMinutes =
        (
            currentHours * 60
        ) +
        currentMinutes;

    return new EmbedBuilder()
        .setColor(
            0xf0c419
        )
        .setTitle(
            "💰 Personel Maaş Bildirimi"
        )
        .setDescription(
            `**${personnelName}** adlı personelin maaş uygunluğu onaylandı.`
        )
        .addFields(
    {
        name: "👤 Maaşı Alan Personel",
        value: `\`\`\`\n${personnelName}\n\`\`\``,
        inline: false
    },
    {
        name: "🏷️ Maaş Rozeti",
        value: `\`\`\`\n${badge}\n\`\`\``,
        inline: false
    },
    {
        name: "⏱️ Şu Anki Süre",
        value: `\`\`\`\n${formatSalaryMinutes(currentTotalMinutes)}\n\`\`\``,
        inline: false
    },
    {
        name: "👮 Maaşı Veren Yetkili",
        value: `\`\`\`\n${salaryOfficerName}\n\`\`\``,
        inline: false
    }
)
        .setFooter({
            text:
                "CSI Maaş Kontrol Sistemi"
        })
        .setTimestamp();
}

module.exports = {
    createSalaryEmbed
};