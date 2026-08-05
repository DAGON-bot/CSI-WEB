const {
    getDiscordClient,
    isDiscordClientReady
} = require("./discordClient");

async function getDiscordChannel(channelId) {

    const cleanChannelId =
        String(channelId || "").trim();

    if (!cleanChannelId) {
        throw new Error(
            "Discord kanal ID bilgisi eksik."
        );
    }

    if (!isDiscordClientReady()) {
        throw new Error(
            "Discord botu henüz hazır değil."
        );
    }

    const client =
        getDiscordClient();

    const channel =
        await client.channels.fetch(
            cleanChannelId
        );

    if (!channel) {
        throw new Error(
            "Discord kanalı bulunamadı."
        );
    }

    if (!channel.isTextBased()) {
        throw new Error(
            "Seçilen Discord kanalı metin tabanlı değil."
        );
    }

    if (typeof channel.send !== "function") {
        throw new Error(
            "Seçilen Discord kanalına mesaj gönderilemiyor."
        );
    }

    return channel;
}

function formatDiscordMessageResult(message) {

    return {
        id: message.id,
        channelId: message.channelId,
        guildId: message.guildId,
        content: message.content,
        url: message.url,
        createdAt: message.createdAt
    };
}

async function sendDiscordMessage(
    channelId,
    content
) {

    const cleanContent =
        String(content || "").trim();

    if (!cleanContent) {
        throw new Error(
            "Gönderilecek Discord mesajı boş olamaz."
        );
    }

    if (cleanContent.length > 2000) {
        throw new Error(
            "Discord mesajı 2000 karakterden uzun olamaz."
        );
    }

    const channel =
        await getDiscordChannel(
            channelId
        );

    const message =
        await channel.send({
            content: cleanContent,

            allowedMentions: {
                parse: []
            }
        });

    return formatDiscordMessageResult(
        message
    );
}

async function sendDiscordEmbed(
    channelId,
    embed
) {

    if (!embed) {
        throw new Error(
            "Gönderilecek Discord embed bilgisi eksik."
        );
    }

    const channel =
        await getDiscordChannel(
            channelId
        );

    const message =
        await channel.send({
            embeds: [
                embed
            ],

            allowedMentions: {
                parse: []
            }
        });

    return formatDiscordMessageResult(
        message
    );
}

module.exports = {
    getDiscordChannel,
    sendDiscordMessage,
    sendDiscordEmbed
};