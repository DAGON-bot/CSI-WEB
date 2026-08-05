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
    sendDiscordMessage
} = require("./discordService");

async function runTest() {

    console.log(
        "Discord mesaj testi başlatılıyor..."
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

    const result =
        await sendDiscordMessage(
            channelId,
            "✅ CSI Discord bot bağlantı testi başarılı."
        );

    console.log(
        "Test mesajı gönderildi:"
    );

    console.log({
        messageId: result.id,
        channelId: result.channelId,
        messageUrl: result.url
    });

    process.exit(0);
}

runTest().catch(error => {

    console.error(
        "Discord mesaj testi başarısız:",
        error
    );

    process.exit(1);
});