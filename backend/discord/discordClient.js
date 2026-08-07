const {
    Client,
    GatewayIntentBits,
    Events
} = require("discord.js");

const discordClient =
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent
        ]
    });

let discordReady = false;
let discordStartPromise = null;

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

discordClient.on(
    Events.ShardDisconnect,
    () => {

        discordReady = false;

        console.warn(
            "Discord botunun bağlantısı kesildi."
        );
    }
);

function waitForDiscordReady(
    timeoutMs = 15000
) {

    if (
        discordReady &&
        discordClient.isReady()
    ) {
        return Promise.resolve(true);
    }

    return new Promise(
        (resolve, reject) => {

            const timeout =
                setTimeout(
                    () => {

                        cleanup();

                        reject(
                            new Error(
                                "Discord botunun hazır olması zaman aşımına uğradı."
                            )
                        );
                    },
                    timeoutMs
                );

            const handleReady =
                () => {

                    cleanup();
                    resolve(true);
                };

            const handleError =
                error => {

                    cleanup();
                    reject(error);
                };

            function cleanup() {

                clearTimeout(timeout);

                discordClient.off(
                    Events.ClientReady,
                    handleReady
                );

                discordClient.off(
                    Events.Error,
                    handleError
                );
            }

            discordClient.once(
                Events.ClientReady,
                handleReady
            );

            discordClient.once(
                Events.Error,
                handleError
            );
        }
    );
}

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

    if (
        discordReady &&
        discordClient.isReady()
    ) {
        return true;
    }

    if (discordStartPromise) {
        return discordStartPromise;
    }

    discordStartPromise =
        (async () => {

            try {

                if (!discordClient.token) {

                    await discordClient.login(
                        token
                    );
                }

                await waitForDiscordReady();

                return true;

            } catch (error) {

                console.error(
                    "Discord botu başlatılamadı:",
                    error
                );

                return false;

            } finally {

                discordStartPromise =
                    null;
            }
        })();

    return discordStartPromise;
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

async function stopDiscordClient() {

    if (
        discordClient &&
        discordClient.isReady()
    ) {

        discordClient.destroy();
    }

    discordReady = false;
    discordStartPromise = null;
}

module.exports = {
    startDiscordClient,
    stopDiscordClient,
    isDiscordClientReady,
    getDiscordClient
};