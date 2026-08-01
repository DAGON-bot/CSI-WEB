const founderPanelNav =
    document.getElementById("founderPanelNav");

const founderPanelOverlay =
    document.getElementById("founderPanelOverlay");

const founderPanelClose =
    document.getElementById("founderPanelClose");

const founderSearchUsername =
    document.getElementById("founderSearchUsername");

const founderSearchBtn =
    document.getElementById("founderSearchBtn");

const founderSearchResult =
    document.getElementById("founderSearchResult");

const founderResultAvatar =
    document.getElementById("founderResultAvatar");

const founderResultUsername =
    document.getElementById("founderResultUsername");

const founderResultMotto =
    document.getElementById("founderResultMotto");

const founderResultHabboId =
    document.getElementById("founderResultHabboId");

const founderResultBadge =
    document.getElementById("founderResultBadge");

const founderResultRank =
    document.getElementById("founderResultRank");

const founderResultRole =
    document.getElementById("founderResultRole");

const founderResultCreatedAt =
    document.getElementById("founderResultCreatedAt");

const founderResultLastLogin =
    document.getElementById("founderResultLastLogin");

const founderResultVerified =
    document.getElementById("founderResultVerified");


function formatFounderDate(value) {

    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

}


function getFounderRoleText(role) {

    const roles = {
        admin: "Admin",
        founder: "Kurucu",
        moderator: "Moderatör",
        reporter: "Haberci",
        salary_officer: "Maaş Görevlisi",
        promotion_controller: "Terfi Kontrolcüsü",
        member: "Üye"
    };

    return roles[role] || "Üye";

}


function getFounderAvatarUrl(figureString) {

    if (!figureString) {
        return "";
    }

    return (
        "https://www.habbo.com.tr/habbo-imaging/avatarimage" +
        `?figure=${encodeURIComponent(figureString)}` +
        "&size=l&direction=2&head_direction=2&gesture=sml"
    );

}


function fillFounderUser(user) {

    founderResultUsername.textContent =
        user.username || "Kullanıcı";

    founderResultMotto.textContent =
        user.motto?.trim() || "Motto bulunamadı.";

    founderResultHabboId.textContent =
        user.habboId || "-";

    founderResultBadge.textContent =
        user.badge?.trim() || "-";

    founderResultRank.textContent =
        user.rank?.trim() || "-";

    founderResultRole.textContent =
        getFounderRoleText(user.role);

    founderResultCreatedAt.textContent =
        formatFounderDate(user.createdAt);

    founderResultLastLogin.textContent =
        formatFounderDate(user.lastLogin);

    founderResultVerified.textContent =
        user.verified ? "Doğrulanmış" : "Doğrulanmamış";

    const avatarUrl =
        getFounderAvatarUrl(user.figureString);

    if (avatarUrl) {

        founderResultAvatar.src = avatarUrl;
        founderResultAvatar.style.display = "block";

    } else {

        founderResultAvatar.removeAttribute("src");
        founderResultAvatar.style.display = "none";

    }

    founderSearchResult.style.display = "block";

}


async function checkFounderAccess() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        founderPanelNav.style.display = "none";
        return;
    }

    try {

        const response = await fetch(
            `${window.location.origin}/api/me`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        const allowedRoles = [
    "admin",
    "founder"
];

if (
    response.ok &&
    data.success &&
    allowedRoles.includes(data.user?.role)
) {
    founderPanelNav.style.display = "";
} else {
    founderPanelNav.style.display = "none";
}

    } catch (err) {

        console.error(
            "Kurucu yetki kontrolü hatası:",
            err
        );

        founderPanelNav.style.display = "none";

    }

}


function openFounderPanel() {

    founderPanelOverlay?.classList.add("active");

    founderSearchResult.style.display = "none";
    founderSearchUsername.value = "";

    setTimeout(() => {
        founderSearchUsername?.focus();
    }, 100);

}


function closeFounderPanel() {

    founderPanelOverlay?.classList.remove("active");

    founderSearchResult.style.display = "none";
    founderSearchUsername.value = "";

}


async function searchFounderUser() {

    const username =
        founderSearchUsername.value.trim();

    const token =
        localStorage.getItem("token");

    if (!username) {

        showDialog(
            "Eksik Bilgi",
            "Aramak istediğiniz nickname'i yazın.",
            "warning"
        );

        return;
    }

    if (!token) {

        showDialog(
            "Oturum Gerekli",
            "Kurucu panelini kullanmak için giriş yapmalısınız.",
            "warning"
        );

        return;
    }

    founderSearchBtn.disabled = true;
    founderSearchBtn.textContent = "Aranıyor...";

    founderSearchResult.style.display = "none";

    try {

        const response = await fetch(
            `${window.location.origin}/api/founder/user/${encodeURIComponent(username)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {

            showDialog(
                "Kullanıcı Bulunamadı",
                data.message || "Kullanıcı bilgileri alınamadı.",
                "error"
            );

            return;
        }

        fillFounderUser(data.user || {});

    } catch (err) {

        console.error(
            "Kurucu paneli kullanıcı arama hatası:",
            err
        );

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );

    } finally {

        founderSearchBtn.disabled = false;
        founderSearchBtn.textContent = "Kullanıcıyı Ara";

    }

}


founderPanelNav?.addEventListener(
    "click",
    (e) => {

        e.preventDefault();
        openFounderPanel();

    }
);


founderPanelClose?.addEventListener(
    "click",
    closeFounderPanel
);


founderPanelOverlay?.addEventListener(
    "click",
    (e) => {

        if (e.target === founderPanelOverlay) {
            closeFounderPanel();
        }

    }
);


founderSearchBtn?.addEventListener(
    "click",
    searchFounderUser
);


founderSearchUsername?.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Enter") {
            searchFounderUser();
        }

    }
);


document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {
            closeFounderPanel();
        }

    }
);


document.addEventListener(
    "DOMContentLoaded",
    checkFounderAccess
);