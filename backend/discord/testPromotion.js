const path = require("path");

require("dotenv").config({
    path: path.join(
        __dirname,
        "..",
        ".env"
    )
});

const {
    startDiscordClient
} = require("./discordClient");

const {
    sendDiscordEmbed
} = require("./discordService");

const {
    createPromotionEmbed
} = require("./modules/promotionModule");

async function runPromotionTest() {

    console.log(
        "Terfi embed testi başlatılıyor..."
    );

    const started =
        await startDiscordClient();

    if (!started) {
        throw new Error(
            "Discord botu başlatılamadı."
        );
    }

    const channelId =
        String(
            process.env.DISCORD_TEST_CHANNEL_ID ||
            ""
        ).trim();

    if (!channelId) {
        throw new Error(
            "DISCORD_TEST_CHANNEL_ID tanımlı değil."
        );
    }

    const embed =
        createPromotionEmbed({
            personnelName:
                "Mirindaa",

            oldBadge:
                "Leadership",

            oldRank:
                "Büyükelçi",

            newBadge:
                "Soruşturma Bürosu",

            newRank:
                "Kıdemli Dedektif",

            promotedBy:
                "canart0"
        });

    const result =
        await sendDiscordEmbed(
            channelId,
            embed
        );

    console.log(
        "Terfi embed mesajı gönderildi:"
    );

    console.log({
        messageId:
            result.id,

        channelId:
            result.channelId,

        messageUrl:
            result.url
    });

    process.exit(0);
}

runPromotionTest().catch(error => {

    console.error(
        "Terfi embed testi başarısız:",
        error
    );

    process.exit(1);
});