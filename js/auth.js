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
const API_URL = "https://csi-web-letg.onrender.com";

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

    const username = profileBtn?.dataset.username || "Kullanıcı";

    showDialog(
        "Profil",
        `${username} profil sayfası yakında burada açılacak.`,
        "success"
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

        loginPassword.style.display = "block";
        verifyArea.style.display = "none";

    }

}

// Popup Kapat
function closeAuthPopup(){

    authOverlay.classList.remove("active");

    verifyArea.style.display = "none";
    passwordArea.style.display = "none";

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