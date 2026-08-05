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
    createBulkPromotionEmbed
} = require(
    "./modules/bulkPromotionModule"
);

async function runBulkPromotionTest() {

    console.log(
        "Toplu terfi embed testi başlatılıyor..."
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
            process.env
                .DISCORD_TEST_CHANNEL_ID ||
            ""
        ).trim();

    if (!channelId) {
        throw new Error(
            "DISCORD_TEST_CHANNEL_ID tanımlı değil."
        );
    }

    const embed =
        createBulkPromotionEmbed({
            distributorName:
                "gorkem!?",

            distributorCode:
                "gork",

            startTime:
                "22.00",

            endTime:
                "22.05",

            multiplier:
                1,

            promotions: [
                {
                    username:
                        "qhabbo-52",

                    oldRank:
                        "Güvenlik Şefi",

                    newRank:
                        "Eğitim I"
                },
                {
                    username:
                        "canart0",

                    oldRank:
                        "Kıdemli Eğitmen",

                    newRank:
                        "Eğitim Şefi"
                }
            ]
        });

    const result =
        await sendDiscordEmbed(
            channelId,
            embed
        );

    console.log(
        "Toplu terfi embed mesajı gönderildi:"
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

runBulkPromotionTest().catch(error => {

    console.error(
        "Toplu terfi embed testi başarısız:",
        error
    );

    process.exit(1);
});