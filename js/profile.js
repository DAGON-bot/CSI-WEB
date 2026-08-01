const profileOverlay =
    document.getElementById("profileOverlay");

const profileClose =
    document.getElementById("profileClose");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileUsername =
    document.getElementById("profileUsername");

const profileMotto =
    document.getElementById("profileMotto");

const profileHabboId =
    document.getElementById("profileHabboId");

const profileRole =
    document.getElementById("profileRole");

const profileCreatedAt =
    document.getElementById("profileCreatedAt");

const profileLastLogin =
    document.getElementById("profileLastLogin");

const profileBadge =
    document.getElementById("profileBadge");

const refreshProfileBtn =
    document.getElementById("refreshProfileBtn");

const currentProfilePassword =
    document.getElementById("currentProfilePassword");

const newProfilePassword =
    document.getElementById("newProfilePassword");

const newProfilePasswordAgain =
    document.getElementById("newProfilePasswordAgain");

const changeProfilePasswordBtn =
    document.getElementById("changeProfilePasswordBtn");


function formatProfileDate(value) {

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


function getRoleText(role) {

    const roles = {
        member: "Üye",
        moderator: "Moderatör",
        admin: "Yönetici",
        owner: "Kurucu"
    };

    return roles[role] || role || "Üye";

}


function getHabboAvatarUrl(figureString) {

    if (!figureString) {
        return "";
    }

    return (
        "https://www.habbo.com.tr/habbo-imaging/avatarimage" +
        `?figure=${encodeURIComponent(figureString)}` +
        "&size=l&direction=2&head_direction=2&gesture=sml"
    );

}


function fillProfile(user) {

    profileUsername.textContent =
        user.username || "Kullanıcı";

    profileMotto.textContent =
        user.motto?.trim() || "Motto bulunamadı.";

    profileHabboId.textContent =
        user.habboId || "-";

    profileRole.textContent =
        getRoleText(user.role);

    profileCreatedAt.textContent =
        formatProfileDate(user.createdAt);

    profileLastLogin.textContent =
        formatProfileDate(user.lastLogin);

    profileBadge.textContent =
        user.badgeName || "Henüz alınmadı";

    const avatarUrl =
        getHabboAvatarUrl(user.figureString);

    if (avatarUrl) {

        profileAvatar.src = avatarUrl;
        profileAvatar.style.display = "block";

    } else {

        profileAvatar.removeAttribute("src");
        profileAvatar.style.display = "none";

    }

}


async function loadProfile() {

    const token =
        localStorage.getItem("token");

    if (!token) {

        showDialog(
            "Oturum Gerekli",
            "Profilinizi görüntülemek için giriş yapmalısınız.",
            "warning"
        );

        return false;
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

        if (!response.ok || !data.success) {

            showDialog(
                "Profil Yüklenemedi",
                data.message || "Kullanıcı bilgileri alınamadı.",
                "error"
            );

            return false;
        }

        fillProfile(data.user || {});

        return true;

    } catch (err) {

        console.error("Profil yükleme hatası:", err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );

        return false;
    }

}


async function openProfilePopup() {

    const loaded =
        await loadProfile();

    if (!loaded) {
        return;
    }

    profileOverlay?.classList.add("active");

}


function closeProfilePopup() {

    profileOverlay?.classList.remove("active");

    currentProfilePassword.value = "";
    newProfilePassword.value = "";
    newProfilePasswordAgain.value = "";

}


profileClose?.addEventListener(
    "click",
    closeProfilePopup
);


profileOverlay?.addEventListener(
    "click",
    (e) => {

        if (e.target === profileOverlay) {
            closeProfilePopup();
        }

    }
);


document.addEventListener(
    "keydown",
    (e) => {

        if (e.key === "Escape") {
            closeProfilePopup();
        }

    }
);


refreshProfileBtn?.addEventListener(
    "click",
    async () => {

        const token =
            localStorage.getItem("token");

        if (!token) {
            return;
        }

        refreshProfileBtn.disabled = true;
        refreshProfileBtn.textContent = "Güncelleniyor...";

        try {

            const response = await fetch(
                `${window.location.origin}/api/profile/refresh`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                showDialog(
                    "Güncelleme Başarısız",
                    data.message || "Profil güncellenemedi.",
                    "error"
                );

                return;
            }

            fillProfile(data.user || {});

            showDialog(
                "Profil Güncellendi",
                data.message || "Habbo bilgileriniz yenilendi.",
                "success"
            );

        } catch (err) {

            console.error(
                "Profil yenileme hatası:",
                err
            );

            showDialog(
                "Bağlantı Hatası",
                "Sunucuya bağlanılamadı.",
                "error"
            );

        } finally {

            refreshProfileBtn.disabled = false;
            refreshProfileBtn.textContent =
                "Habbo Bilgilerini Yenile";

        }

    }
);


changeProfilePasswordBtn?.addEventListener(
    "click",
    async () => {

        const token =
            localStorage.getItem("token");

        const currentPassword =
            currentProfilePassword.value;

        const newPassword =
            newProfilePassword.value;

        const newPasswordAgain =
            newProfilePasswordAgain.value;

        if (
            !currentPassword ||
            !newPassword ||
            !newPasswordAgain
        ) {

            showDialog(
                "Eksik Bilgi",
                "Bütün şifre alanlarını doldurun.",
                "warning"
            );

            return;
        }

        if (newPassword.length < 6) {

            showDialog(
                "Geçersiz Şifre",
                "Yeni şifre en az 6 karakter olmalı.",
                "warning"
            );

            return;
        }

        if (newPassword !== newPasswordAgain) {

            showDialog(
                "Şifre Hatası",
                "Yeni şifreler eşleşmiyor.",
                "warning"
            );

            return;
        }

        changeProfilePasswordBtn.disabled = true;
        changeProfilePasswordBtn.textContent =
            "Değiştiriliyor...";

        try {

            const response = await fetch(
                `${window.location.origin}/api/profile/change-password`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword,
                        newPasswordAgain
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                showDialog(
                    "Şifre Değiştirilemedi",
                    data.message || "Bir hata oluştu.",
                    "error"
                );

                return;
            }

            currentProfilePassword.value = "";
            newProfilePassword.value = "";
            newProfilePasswordAgain.value = "";

            showDialog(
                "Şifre Değiştirildi",
                data.message ||
                "Şifreniz başarıyla değiştirildi.",
                "success"
            );

        } catch (err) {

            console.error(
                "Şifre değiştirme hatası:",
                err
            );

            showDialog(
                "Bağlantı Hatası",
                "Sunucuya bağlanılamadı.",
                "error"
            );

        } finally {

            changeProfilePasswordBtn.disabled = false;
            changeProfilePasswordBtn.textContent =
                "Şifreyi Değiştir";

        }

    }
);


window.openProfilePopup = openProfilePopup;