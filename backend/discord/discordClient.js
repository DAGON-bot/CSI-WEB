const {
    Client,
    GatewayIntentBits,
    Events
} = require("discord.js");

const discordClient =
    new Client({
        intents: [
            GatewayIntentBits.Guilds
        ]
    });

let discordReady = false;

discordClient.once(
    Events.ClientReady,
    readyClient => {

        discordReady = true;

        console.log(
            `Discord botu hazır: ${readyClient.user.tag}`
        );
    }
);

discordClient.on(
    Events.Error,
    error => {

        console.error(
            "Discord istemci hatası:",
            error
        );
    }
);

async function startDiscordClient() {

    const token =
        String(
            process.env.DISCORD_BOT_TOKEN || ""
        ).trim();

    if (!token) {

        console.warn(
            "DISCORD_BOT_TOKEN tanımlı değil. Discord botu başlatılmadı."
        );

        return false;
    }

    if (discordReady) {
        return true;
    }

    try {

        await discordClient.login(token);

        return true;

    } catch (error) {

        console.error(
            "Discord botu başlatılamadı:",
            error
        );

        return false;
    }
}

function isDiscordClientReady() {

    return (
        discordReady &&
        discordClient.isReady()
    );
}

function getDiscordClient() {

    return discordClient;
}

module.exports = {
    startDiscordClient,
    isDiscordClientReady,
    getDiscordClient
};