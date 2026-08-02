const chatMessages =
    document.getElementById("chatMessages");

const chatLoading =
    document.getElementById("chatLoading");

const chatComposer =
    document.getElementById("chatComposer");

const chatLoginRequired =
    document.getElementById("chatLoginRequired");

const chatLoginBtn =
    document.getElementById("chatLoginBtn");

const chatMessageInput =
    document.getElementById("chatMessageInput");

const chatSendBtn =
    document.getElementById("chatSendBtn");

const chatEmojiBtn =
    document.getElementById("chatEmojiBtn");

const chatEmojiPanel =
    document.getElementById("chatEmojiPanel");

const chatFeedback =
    document.getElementById("chatFeedback");

const chatOnlineText =
    document.getElementById("chatOnlineText");

let chatSocket = null;
let chatIsAuthenticated = false;
let chatSending = false;

function getChatToken() {

    return localStorage.getItem("token") || "";

}

function getChatAvatarUrl(figureString) {

    if (!figureString) {
        return "assets/logo.png";
    }

    return (
        "https://www.habbo.com.tr/habbo-imaging/avatarimage" +
        `?figure=${encodeURIComponent(figureString)}` +
        "&size=s&direction=2&head_direction=2&gesture=sml&headonly=0"
    );

}

function getChatRoleInfo(roles, fallbackRole) {

    const userRoles =
        Array.isArray(roles) && roles.length > 0
            ? roles
            : [fallbackRole || "member"];

    if (userRoles.includes("admin")) {
        return {
            className: "chat-role-admin",
            icon: "👑",
            text: "Admin"
        };
    }

    if (userRoles.includes("founder")) {
        return {
            className: "chat-role-founder",
            icon: "⭐",
            text: "Kurucu"
        };
    }

    if (userRoles.includes("moderator")) {
        return {
            className: "chat-role-moderator",
            icon: "🛡",
            text: "Moderatör"
        };
    }

    if (userRoles.includes("reporter")) {
        return {
            className: "chat-role-reporter",
            icon: "📢",
            text: "Haberci"
        };
    }

    if (userRoles.includes("salary_officer")) {
        return {
            className: "chat-role-salary",
            icon: "💰",
            text: "Maaş Görevlisi"
        };
    }

    if (userRoles.includes("promotion_controller")) {
        return {
            className: "chat-role-promotion",
            icon: "📈",
            text: "Terfi Kontrolcüsü"
        };
    }

    return {
        className: "chat-role-member",
        icon: "",
        text: ""
    };

}

function formatChatTime(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        "tr-TR",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}

function showChatFeedback(
    message,
    type = "error"
) {

    if (!chatFeedback) {
        return;
    }

    chatFeedback.textContent =
        message || "";

    chatFeedback.className =
        `chat-feedback ${type}`;

    if (!message) {
        return;
    }

    window.clearTimeout(
        showChatFeedback.timeout
    );

    showChatFeedback.timeout =
        window.setTimeout(() => {

            chatFeedback.textContent = "";
            chatFeedback.className =
                "chat-feedback";

        }, 3500);

}

function scrollChatToBottom() {

    if (!chatMessages) {
        return;
    }

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}

function createChatMessageElement(message) {

    const roleInfo =
        getChatRoleInfo(
            message.roles,
            message.role
        );

    const item =
        document.createElement("div");

    item.className =
        `chat-message ${roleInfo.className}`;

    const avatarBox =
        document.createElement("div");

    avatarBox.className =
        "chat-message-avatar";

    const avatar =
        document.createElement("img");

    avatar.src =
        getChatAvatarUrl(
            message.figureString
        );

    avatar.alt =
        message.username || "Kullanıcı";

    avatar.loading =
        "lazy";

    avatar.addEventListener(
        "error",
        () => {

            avatar.src =
                "assets/logo.png";

        },
        {
            once: true
        }
    );

    avatarBox.appendChild(avatar);

    const body =
        document.createElement("div");

    body.className =
        "chat-message-body";

    const header =
        document.createElement("div");

    header.className =
        "chat-message-header";

    const username =
        document.createElement("span");

    username.className =
        "chat-message-username";

    username.textContent =
        message.username || "Kullanıcı";

    header.appendChild(username);

    if (roleInfo.icon) {

        const role =
            document.createElement("span");

        role.className =
            "chat-message-role";

        role.title =
            roleInfo.text;

        role.textContent =
            roleInfo.icon;

        header.appendChild(role);

    }

    const text =
        document.createElement("div");

    text.className =
        "chat-message-text";

    /*
     * textContent kullanıyoruz.
     * Böylece mesajın içindeki HTML çalışmaz.
     */
    text.textContent =
        message.message || "";

    const time =
        document.createElement("span");

    time.className =
        "chat-message-time";

    time.textContent =
        formatChatTime(
            message.createdAt
        );

    body.appendChild(header);
    body.appendChild(text);
    body.appendChild(time);

    item.appendChild(avatarBox);
    item.appendChild(body);

    return item;

}

function appendChatMessage(message) {

    if (!chatMessages || !message) {
        return;
    }

    const existingMessage =
        chatMessages.querySelector(
            `[data-message-id="${message.id}"]`
        );

    if (existingMessage) {
        return;
    }

    const element =
        createChatMessageElement(message);

    element.dataset.messageId =
        String(message.id || "");

    chatMessages.appendChild(element);

    scrollChatToBottom();

}

async function loadChatMessages() {

    if (!chatMessages) {
        return;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/chat/messages`
            );

        const data =
            await response.json();

        chatMessages.innerHTML = "";

        if (
            !response.ok ||
            !data.success
        ) {

            const error =
                document.createElement("div");

            error.className =
                "chat-system-message";

            error.textContent =
                data.message ||
                "Mesajlar yüklenemedi.";

            chatMessages.appendChild(error);
            return;
        }

        const messages =
            Array.isArray(data.messages)
                ? data.messages
                : [];

        if (messages.length === 0) {

            const empty =
                document.createElement("div");

            empty.className =
                "chat-system-message";

            empty.textContent =
                "Henüz mesaj gönderilmemiş. İlk mesajı sen gönder!";

            chatMessages.appendChild(empty);
            return;
        }

        messages.forEach(
            appendChatMessage
        );

        scrollChatToBottom();

    } catch (err) {

        console.error(
            "Chat mesajları yüklenemedi:",
            err
        );

        chatMessages.innerHTML = "";

        const error =
            document.createElement("div");

        error.className =
            "chat-system-message";

        error.textContent =
            "Sohbete bağlanılamadı.";

        chatMessages.appendChild(error);

    }

}

function updateChatComposer(
    authenticated
) {

    chatIsAuthenticated =
        authenticated;

    if (chatComposer) {

        chatComposer.style.display =
            authenticated
                ? "flex"
                : "none";

    }

    if (chatLoginRequired) {

        chatLoginRequired.style.display =
            authenticated
                ? "none"
                : "flex";

    }

    if (
        !authenticated &&
        chatEmojiPanel
    ) {

        chatEmojiPanel.style.display =
            "none";

    }

}

function connectChatSocket() {

    if (typeof io !== "function") {

        console.error(
            "Socket.IO istemcisi yüklenemedi."
        );

        return;
    }

    if (chatSocket) {

        chatSocket.disconnect();

    }

    chatSocket =
        io({
            auth: {
                token:
                    getChatToken()
            }
        });

    chatSocket.on(
        "connect",
        () => {

            if (chatOnlineText) {

                chatOnlineText.textContent =
                    "Canlı";

            }

        }
    );

    chatSocket.on(
        "disconnect",
        () => {

            if (chatOnlineText) {

                chatOnlineText.textContent =
                    "Bağlantı Kesildi";

            }

        }
    );

    chatSocket.on(
        "chat:auth",
        (data) => {

            updateChatComposer(
                !!data?.authenticated
            );

        }
    );

    chatSocket.on(
        "chat:message",
        (message) => {

            const systemMessage =
                chatMessages?.querySelector(
                    ".chat-system-message"
                );

            if (systemMessage) {
                systemMessage.remove();
            }

            appendChatMessage(message);

        }
    );

}

function sendChatMessage() {

    if (
        !chatSocket ||
        !chatSocket.connected
    ) {

        showChatFeedback(
            "Sohbet bağlantısı hazır değil."
        );

        return;
    }

    if (!chatIsAuthenticated) {

        showChatFeedback(
            "Mesaj göndermek için giriş yapmalısınız."
        );

        return;
    }

    if (chatSending) {
        return;
    }

    const message =
        String(
            chatMessageInput?.value || ""
        ).trim();

    if (!message) {

        showChatFeedback(
            "Boş mesaj gönderemezsiniz."
        );

        return;
    }

    if (message.length > 300) {

        showChatFeedback(
            "Mesaj en fazla 300 karakter olabilir."
        );

        return;
    }

    chatSending = true;

    if (chatSendBtn) {
        chatSendBtn.disabled = true;
    }

    chatSocket.emit(
        "chat:send",
        {
            message
        },
        (response) => {

            chatSending = false;

            if (chatSendBtn) {
                chatSendBtn.disabled = false;
            }

            if (
                !response ||
                !response.success
            ) {

                showChatFeedback(
                    response?.message ||
                    "Mesaj gönderilemedi."
                );

                return;
            }

            if (chatMessageInput) {

                chatMessageInput.value = "";
                chatMessageInput.focus();

            }

            if (chatEmojiPanel) {

                chatEmojiPanel.style.display =
                    "none";

            }

            showChatFeedback(
                "",
                "success"
            );

        }
    );

}

chatSendBtn?.addEventListener(
    "click",
    sendChatMessage
);

chatMessageInput?.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();
            sendChatMessage();

        }

    }
);

chatEmojiBtn?.addEventListener(
    "click",
    () => {

        if (!chatEmojiPanel) {
            return;
        }

        const visible =
            window.getComputedStyle(
                chatEmojiPanel
            ).display !== "none";

        chatEmojiPanel.style.display =
            visible
                ? "none"
                : "grid";

    }
);

chatEmojiPanel
    ?.querySelectorAll("button")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                if (!chatMessageInput) {
                    return;
                }

                chatMessageInput.value +=
                    button.textContent || "";

                chatMessageInput.focus();

            }
        );

    });

chatLoginBtn?.addEventListener(
    "click",
    () => {

        const loginButton =
            document.querySelector(
                ".login-btn"
            );

        if (loginButton) {

            loginButton.click();

        }

    }
);

/*
 * Kullanıcı giriş veya çıkış yaptığında
 * auth.js localStorage token'ını değiştirir.
 * Pencere yeniden odaklandığında socket'i yenileriz.
 */
window.addEventListener(
    "focus",
    () => {

        const currentToken =
            getChatToken();

        const socketToken =
            String(
                chatSocket?.auth?.token || ""
            );

        if (
            currentToken !== socketToken
        ) {

            connectChatSocket();

        }

    }
);

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadChatMessages();
        connectChatSocket();

    }
);