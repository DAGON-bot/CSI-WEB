const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const loginPassword = document.getElementById("loginPassword");
const passwordArea = document.getElementById("passwordArea");
const registerPassword = document.getElementById("registerPassword");
const registerPassword2 = document.getElementById("registerPassword2");
const savePasswordBtn = document.getElementById("savePasswordBtn");

const profileBtn = document.getElementById("profileBtn");
const profileMenuWrapper = document.getElementById("profileMenuWrapper");
const profileDropdown = document.getElementById("profileDropdown");
const visitProfileBtn = document.getElementById("visitProfileBtn");
const profileSettingsBtn = document.getElementById("profileSettingsBtn");
const logoutBtn = document.getElementById("logoutBtn");
const managementPanelNav = document.getElementById("managementPanelNav");
const managementPanel = document.getElementById("panel");
const API_URL = window.location.origin;

const forgotPasswordBtn =
    document.getElementById("forgotPasswordBtn");

const resetStartArea =
    document.getElementById("resetStartArea");

const resetCreateCodeBtn =
    document.getElementById("resetCreateCodeBtn");

const resetVerifyArea =
    document.getElementById("resetVerifyArea");

const resetVerifyCode =
    document.getElementById("resetVerifyCode");

const resetVerifyBtn =
    document.getElementById("resetVerifyBtn");

const resetPasswordArea =
    document.getElementById("resetPasswordArea");

const resetPassword =
    document.getElementById("resetPassword");

const resetPassword2 =
    document.getElementById("resetPassword2");

const resetSavePasswordBtn =
    document.getElementById("resetSavePasswordBtn");

const goLoginArea =
    document.getElementById("goLoginArea");

const goLoginBtn =
    document.getElementById("goLoginBtn");

let passwordResetToken = "";

let isAuthenticated = false;

let authMode = "login";
console.log(document.getElementById("authOverlay"));

// ===============================
// CSI AUTH SYSTEM
// ===============================

const authOverlay = document.getElementById("authOverlay");

const loginBtn = document.querySelector(".login-btn");
const registerBtn = document.querySelector(".register-btn");

const authClose = document.getElementById("authClose");

const createCodeBtn = document.getElementById("createCodeBtn");
const verifyBtn = document.getElementById("verifyBtn");
console.log("verifyBtn =", verifyBtn);

const verifyArea = document.getElementById("verifyArea");


// ===============================
// OTURUM / NAVBAR KONTROLÜ
// ===============================

function showGuestNavbar() {

    isAuthenticated = false;

    loginBtn?.style.setProperty("display", "");
    registerBtn?.style.setProperty("display", "");

    if (profileMenuWrapper) {
        profileMenuWrapper.style.display = "none";
    }

    if (profileDropdown) {
        profileDropdown.classList.remove("active");
    }

    if (profileBtn) {
        profileBtn.dataset.username = "";
        profileBtn.textContent = "Profil";
    }

    if (managementPanel) {
        managementPanel.style.display = "none";
    }

}

function showUserNavbar(username) {

    isAuthenticated = true;

    loginBtn?.style.setProperty("display", "none");
    registerBtn?.style.setProperty("display", "none");

    if (profileMenuWrapper) {
        profileMenuWrapper.style.display = "block";
    }

    if (profileBtn) {
        profileBtn.dataset.username = username || "";
        profileBtn.textContent = username
            ? `Profil • ${username}`
            : "Profil";
    }

    if (managementPanel) {
        managementPanel.style.display = "block";
    }

}

async function checkCurrentSession() {

    const token = localStorage.getItem("token");

    if (!token) {
        showGuestNavbar();
        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            localStorage.removeItem("token");
            showGuestNavbar();
            return;
        }

        const currentUser = data.user || {};

        const username =
            currentUser.username ||
            currentUser.name ||
            currentUser.user ||
            currentUser.sub ||
            "";

        showUserNavbar(username);

    } catch (err) {

        console.error("Oturum kontrol hatası:", err);

        // Sunucu geçici olarak kapalıysa tokenı silmeyelim.
        showGuestNavbar();

    }

}

// ===============================
// NAVBAR BUTONLARI
// ===============================

loginBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAuthPopup("login");
});

registerBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openAuthPopup("register");
});

managementPanelNav?.addEventListener("click", (e) => {

    if (isAuthenticated && localStorage.getItem("token")) {
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    showDialog(
        "Yetkilendirme Gerekli",
        "Bu panel yalnızca çalışanlara özeldir. Devam etmek için hesabınızla giriş yapmanız gerekiyor.",
        "warning",
        () => {
            openAuthPopup("login");
        }
    );
});

profileBtn?.addEventListener("click", (e) => {

    e.preventDefault();
    e.stopPropagation();

    profileDropdown?.classList.toggle("active");

});

profileDropdown?.addEventListener("click", (e) => {
    e.stopPropagation();
});

document.addEventListener("click", () => {
    profileDropdown?.classList.remove("active");
});

visitProfileBtn?.addEventListener("click", () => {

    profileDropdown?.classList.remove("active");

    if (typeof window.openProfilePopup === "function") {
        window.openProfilePopup();
        return;
    }

    showDialog(
        "Profil Hatası",
        "Profil sistemi yüklenemedi.",
        "error"
    );

});

profileSettingsBtn?.addEventListener("click", () => {

    profileDropdown?.classList.remove("active");

    showDialog(
        "Ayarlar",
        "Ayarlar bölümü yakında eklenecek.",
        "warning"
    );

});

logoutBtn?.addEventListener("click", () => {

    localStorage.removeItem("token");
    profileDropdown?.classList.remove("active");
    showGuestNavbar();

    showDialog(
        "Çıkış Yapıldı",
        "Hesabınızdan başarıyla çıkış yaptınız.",
        "success",
        () => {
            location.reload();
        }
    );

});

document.addEventListener("DOMContentLoaded", checkCurrentSession);

// Popup Aç
function openAuthPopup(mode){

    if (!authOverlay) {
        console.error("authOverlay bulunamadı.");
        return;
    }

    authMode = mode;

    // Her açılışta eski ekranları gizle
    verifyArea.style.display = "none";
    passwordArea.style.display = "none";
    goLoginArea.style.display = "none";

    resetStartArea.style.display = "none";
    resetVerifyArea.style.display = "none";
    resetPasswordArea.style.display = "none";
    forgotPasswordBtn.style.display = "none";

passwordResetToken = "";

    authOverlay.classList.add("active");

    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");

    if(authMode === "register"){

        registerPassword.value = "";
        registerPassword2.value = "";

        title.textContent = "CSI Kayıt Sistemi";
        subtitle.textContent =
        "Habbo kullanıcı adınızı girerek hesabınızı doğrulayın.";

        createCodeBtn.style.display = "block";
        loginSubmitBtn.style.display = "none";
        goLoginArea.style.display = "flex";

        loginPassword.style.display = "none";
        verifyArea.style.display = "none";

    }
    else{

        registerPassword.value = "";
        registerPassword2.value = "";  

        title.textContent = "CSI Giriş Sistemi";
        subtitle.textContent =
        "Habbo kullanıcı adınız ve şifreniz ile giriş yapın.";

        createCodeBtn.style.display = "none";
        loginSubmitBtn.style.display = "block";
        forgotPasswordBtn.style.display = "block";

        loginPassword.style.display = "block";
        verifyArea.style.display = "none";

    }

}

// Popup Kapat
function closeAuthPopup(){

    authOverlay.classList.remove("active");

    verifyArea.style.display = "none";
    passwordArea.style.display = "none";
    goLoginArea.style.display = "none";

    resetStartArea.style.display = "none";
    resetVerifyArea.style.display = "none";
    resetPasswordArea.style.display = "none";
    forgotPasswordBtn.style.display = "none";

    resetPassword.value = "";
    resetPassword2.value = "";
    passwordResetToken = "";

    loginPassword.value = "";
    registerPassword.value = "";
    registerPassword2.value = "";

    document.getElementById("habboUsername").value = "";

}

// X
authClose?.addEventListener("click", closeAuthPopup);

// ESC
document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeAuthPopup();

    }

});

// Test amaçlı
createCodeBtn?.addEventListener("click", async () => {

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    if (!username) {

        showDialog(
    "Eksik Bilgi",
    "Habbo kullanıcı adını gir.",
    "warning"
);
        return;

    }

    try {

        const response = await fetch(`${API_URL}/api/verify/create`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username
            })

        });

        const data = await response.json();

        if (!data.success) {

            showDialog(
    "Giriş Başarısız",
    data.message,
    "error"
);

return;

        }

        verifyArea.style.display = "block";

        document.getElementById("verifyCode").textContent = data.code;

    }
    catch (err) {

        console.error(err);

        showDialog(
    "Bağlantı Hatası",
    "Sunucuya bağlanılamadı.",
    "error"
);

    }

});

verifyBtn?.addEventListener("click", async (e) => {

    e.preventDefault();
    e.stopPropagation();

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    if (!username) {
        showDialog(
    "Eksik Bilgi",
    "Habbo kullanıcı adını gir.",
    "warning"
);
        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/verify/check`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!data.success) {
            showDialog(
    "İşlem Başarısız",
    data.message,
    "error"
);
            return;
        }

        createCodeBtn.style.display = "none";
        verifyArea.style.display = "none";
        passwordArea.style.display = "block";
        goLoginArea.style.display = "flex";

        document.getElementById("authTitle").textContent =
            "Şifre Oluştur";

        document.getElementById("authSubtitle").textContent =
            "Sonraki girişlerinizde kullanacağınız şifreyi belirleyin.";

    } catch (err) {

        console.error(err);
        showDialog(
    "Bağlantı Hatası",
    "Sunucuya bağlanılamadı.",
    "error"
);

    }

});

loginSubmitBtn?.addEventListener("click", async () => {

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    const password = document
        .getElementById("loginPassword")
        .value
        .trim();

    if (!username || !password) {

        showDialog(
            "Eksik Bilgi",
            "Kullanıcı adı ve şifre zorunludur.",
            "warning"
        );

        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/login`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (!response.ok) {

            showDialog(
                "Giriş Başarısız",
                data.message || "Kullanıcı adı veya şifre yanlış.",
                "error"
            );

            return;
        }

        localStorage.setItem("token", data.token);

        closeAuthPopup();

        location.reload();

    } catch (err) {

        console.error(err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );

    }

});

savePasswordBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    const password = registerPassword.value.trim();
    const passwordAgain = registerPassword2.value.trim();

    if (!password || !passwordAgain) {

        showDialog(
            "Eksik Bilgi",
            "Şifre alanlarını doldur.",
            "warning"
        );

        return;
    }

    if (password.length < 6) {

        showDialog(
            "Geçersiz Şifre",
            "Şifre en az 6 karakter olmalı.",
            "warning"
        );

        return;
    }

    if (password !== passwordAgain) {

        showDialog(
            "Şifre Hatası",
            "Şifreler eşleşmiyor.",
            "warning"
        );

        return;
    }

    try {

        const response = await fetch(`${API_URL}/api/register/password`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                password
            })

        });

        const data = await response.json();

        if (!data.success) {

            showDialog(
                "Hesap Oluşturulamadı",
                data.message || "Bir hata oluştu.",
                "error"
            );

            return;
        }

        localStorage.setItem("token", data.token);

        showDialog(
            "Kayıt Başarılı",
            "Hesabınız başarıyla oluşturuldu.",
            "success",
            () => {
                closeAuthPopup();
                location.reload();
            }
        );

    } catch (err) {

        console.error(err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );

    }

});

// ===============================
// ŞİFREMİ UNUTTUM EKRANINI AÇ
// ===============================

forgotPasswordBtn?.addEventListener("click", (e) => {
    e.preventDefault();

    authMode = "reset";

    document.getElementById("authTitle").textContent =
        "Şifremi Unuttum";

    document.getElementById("authSubtitle").textContent =
        "Kayıtlı Habbo kullanıcı adınızı girerek hesabınızı doğrulayın.";

    loginPassword.style.display = "none";
    loginSubmitBtn.style.display = "none";
    forgotPasswordBtn.style.display = "none";

    createCodeBtn.style.display = "none";
    verifyArea.style.display = "none";
    passwordArea.style.display = "none";
    goLoginArea.style.display = "none";

    resetVerifyArea.style.display = "none";
    resetPasswordArea.style.display = "none";
    resetStartArea.style.display = "block";

    passwordResetToken = "";
});


// ===============================
// ŞİFRE SIFIRLAMA KODU OLUŞTUR
// ===============================

resetCreateCodeBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    if (!username) {
        showDialog(
            "Eksik Bilgi",
            "Habbo kullanıcı adını gir.",
            "warning"
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/password-reset/create`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showDialog(
                "İşlem Başarısız",
                data.message || "Kod oluşturulamadı.",
                "error"
            );
            return;
        }

        resetStartArea.style.display = "none";
        resetVerifyArea.style.display = "block";
        resetVerifyCode.textContent = data.code;

        document.getElementById("authSubtitle").textContent =
            "Kodu Habbo mottonuza yazın ve ardından doğrulayın.";

    } catch (err) {
        console.error(err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );
    }
});


// ===============================
// ŞİFRE SIFIRLAMA KODUNU DOĞRULA
// ===============================

resetVerifyBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    try {
        const response = await fetch(
            `${API_URL}/api/password-reset/check`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showDialog(
                "Doğrulama Başarısız",
                data.message || "Kod doğrulanamadı.",
                "error"
            );
            return;
        }

        passwordResetToken = data.resetToken;

        resetVerifyArea.style.display = "none";
        resetPasswordArea.style.display = "block";

        document.getElementById("authTitle").textContent =
            "Yeni Şifre Oluştur";

        document.getElementById("authSubtitle").textContent =
            "Hesabınız doğrulandı. Yeni şifrenizi belirleyin.";

    } catch (err) {
        console.error(err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );
    }
});


// ===============================
// YENİ ŞİFREYİ KAYDET
// ===============================

resetSavePasswordBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document
        .getElementById("habboUsername")
        .value
        .trim();

    const password = resetPassword.value.trim();
    const passwordAgain = resetPassword2.value.trim();

    if (!password || !passwordAgain) {
        showDialog(
            "Eksik Bilgi",
            "Yeni şifre alanlarını doldur.",
            "warning"
        );
        return;
    }

    if (password.length < 6) {
        showDialog(
            "Geçersiz Şifre",
            "Şifre en az 6 karakter olmalı.",
            "warning"
        );
        return;
    }

    if (password !== passwordAgain) {
        showDialog(
            "Şifre Hatası",
            "Şifreler eşleşmiyor.",
            "warning"
        );
        return;
    }

    if (!passwordResetToken) {
        showDialog(
            "Doğrulama Gerekli",
            "Önce Habbo hesabınızı doğrulayın.",
            "error"
        );
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/password-reset/complete`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password,
                    resetToken: passwordResetToken
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showDialog(
                "Şifre Yenilenemedi",
                data.message || "Bir hata oluştu.",
                "error"
            );
            return;
        }

        localStorage.removeItem("token");

        showDialog(
            "Şifre Yenilendi",
            "Şifreniz başarıyla yenilendi. Yeni şifrenizle giriş yapabilirsiniz.",
            "success",
            () => {
                resetPassword.value = "";
                resetPassword2.value = "";
                passwordResetToken = "";

                openAuthPopup("login");
            }
        );

    } catch (err) {
        console.error(err);

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );
    }
});

goLoginBtn?.addEventListener("click", () => {

    openAuthPopup("login");

});