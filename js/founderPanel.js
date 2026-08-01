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

const founderResultDepartment =
    document.getElementById("founderResultDepartment");

const founderDepartmentSelect =
    document.getElementById("founderDepartmentSelect");

const founderSaveDepartmentBtn =
    document.getElementById("founderSaveDepartmentBtn");

const founderBadgeSelect =
    document.getElementById("founderBadgeSelect");

const founderRankSelect =
    document.getElementById("founderRankSelect");

const founderSaveBadgeRankBtn =
    document.getElementById("founderSaveBadgeRankBtn");

const founderRoleSelect =
    document.getElementById("founderRoleSelect");

const founderSaveRoleBtn =
    document.getElementById("founderSaveRoleBtn");

const founderRefreshLogsBtn =
    document.getElementById("founderRefreshLogsBtn");

const founderLogsLoading =
    document.getElementById("founderLogsLoading");

const founderLogsEmpty =
    document.getElementById("founderLogsEmpty");

const founderLogsList =
    document.getElementById("founderLogsList");

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

let selectedFounderUsername = "";

function fillFounderBadgeOptions() {

    if (!founderBadgeSelect || typeof rankData !== "object") {
        return;
    }

    founderBadgeSelect.innerHTML =
        `<option value="">Rozet Seçin</option>`;

    Object.keys(rankData).forEach((badge) => {

        const option =
            document.createElement("option");

        option.value = badge;
        option.textContent = badge;

        founderBadgeSelect.appendChild(option);

    });

}

function fillFounderRankOptions(
    badge,
    selected = ""
) {

    founderRankSelect.innerHTML = "";

    if (
        !badge ||
        !rankData[badge]
    ) {

        founderRankSelect.disabled = true;

        founderRankSelect.innerHTML =
            `<option value="">Önce Rozet Seçin</option>`;

        return;

    }

    founderRankSelect.disabled = false;

    founderRankSelect.innerHTML =
        `<option value="">Rütbe Seçin</option>`;

    rankData[badge].forEach((rank) => {

        const option =
            document.createElement("option");

        option.value = rank;
        option.textContent = rank;

        founderRankSelect.appendChild(option);

    });

    founderRankSelect.value = selected;

}


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

function getAdminLogActionText(actionType) {

    const actions = {
        department_update: "Departman Değişikliği",
        badge_update: "Rozet Değişikliği",
        rank_update: "Rütbe Değişikliği",
        role_update: "Site Rolü Değişikliği",
        single_promotion: "Tekli Terfi",
        bulk_promotion: "Toplu Terfi"
    };

    return actions[actionType] ||
        actionType ||
        "Yönetim İşlemi";

}


function formatAdminLogValue(
    actionType,
    value
) {

    if (!value) {
        return "Boş";
    }

    if (actionType === "role_update") {
        return getFounderRoleText(value);
    }

    return value;

}

function escapeFounderHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function renderFounderLogs(logs) {

    if (!founderLogsList) {
        return;
    }

    founderLogsList.innerHTML = "";

    if (
        !Array.isArray(logs) ||
        logs.length === 0
    ) {

        founderLogsEmpty.style.display =
            "block";

        return;

    }

    founderLogsEmpty.style.display =
        "none";

    logs.forEach((log) => {

        const item =
            document.createElement("article");

        item.className =
            "founder-log-item";

        const actionText =
            getAdminLogActionText(
                log.actionType
            );

        const oldValue =
            formatAdminLogValue(
                log.actionType,
                log.oldValue
            );

        const newValue =
            formatAdminLogValue(
                log.actionType,
                log.newValue
            );

        const createdAt =
            formatFounderDate(
                log.createdAt
            );

        item.innerHTML = `
            <div class="founder-log-item-top">

                <div>
                    <strong class="founder-log-action">
                        ${escapeFounderHtml(actionText)}
                    </strong>

                    <span class="founder-log-date">
                        ${escapeFounderHtml(createdAt)}
                    </span>
                </div>

                <span class="founder-log-target">
                    ${escapeFounderHtml(
                        log.targetUsername || "-"
                    )}
                </span>

            </div>

            <div class="founder-log-values">

                <div class="founder-log-value old">

                    <span>Eski Değer</span>

                    <strong>
                        ${escapeFounderHtml(oldValue)}
                    </strong>

                </div>

                <div class="founder-log-arrow">
                    →
                </div>

                <div class="founder-log-value new">

                    <span>Yeni Değer</span>

                    <strong>
                        ${escapeFounderHtml(newValue)}
                    </strong>

                </div>

            </div>

            <div class="founder-log-footer">

                İşlemi yapan:

                <strong>
                    ${escapeFounderHtml(
                        log.performedBy || "-"
                    )}
                </strong>

            </div>
        `;

        founderLogsList.appendChild(item);

    });

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

    selectedFounderUsername =
    user.username || "";

founderResultDepartment.textContent =
    user.department?.trim() || "Atanmadı";

founderDepartmentSelect.value =
    user.department || "";

    const userBadge =
    user.badge?.trim() || "";

const userRank =
    user.rank?.trim() || "";

const userRole =
    user.role || "member";

founderResultBadge.textContent =
    userBadge || "-";

founderResultRank.textContent =
    userRank || "-";

founderResultRole.textContent =
    getFounderRoleText(userRole);

founderBadgeSelect.value =
    userBadge;

fillFounderRankOptions(
    userBadge,
    userRank
);

founderRoleSelect.value =
    userRole;

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
    loadFounderLogs();

    founderSearchResult.style.display = "none";
    founderSearchUsername.value = "";
    selectedFounderUsername = "";
    founderDepartmentSelect.value = "";

    founderBadgeSelect.value = "";
founderRoleSelect.value = "";

fillFounderRankOptions("");

    setTimeout(() => {
        founderSearchUsername?.focus();
    }, 100);

}


function closeFounderPanel() {

    founderPanelOverlay?.classList.remove("active");

    founderSearchResult.style.display = "none";
    founderSearchUsername.value = "";
    selectedFounderUsername = "";
    founderDepartmentSelect.value = "";

    founderBadgeSelect.value = "";
founderRoleSelect.value = "";

fillFounderRankOptions("");

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
    () => {

        fillFounderBadgeOptions();

        fillFounderRankOptions("");

        checkFounderAccess();

    }
);

founderSaveDepartmentBtn?.addEventListener(
    "click",
    async () => {

        const token =
            localStorage.getItem("token");

        const department =
            founderDepartmentSelect.value;

        if (!selectedFounderUsername) {

            showDialog(
                "Kullanıcı Seçilmedi",
                "Önce bir kullanıcı aratın.",
                "warning"
            );

            return;
        }

        if (!department) {

            showDialog(
                "Departman Seçilmedi",
                "Atamak istediğiniz departmanı seçin.",
                "warning"
            );

            return;
        }

        if (!token) {

            showDialog(
                "Oturum Gerekli",
                "Bu işlem için giriş yapmanız gerekiyor.",
                "warning"
            );

            return;
        }

        founderSaveDepartmentBtn.disabled = true;
        founderSaveDepartmentBtn.textContent =
            "Kaydediliyor...";

        try {

            const response = await fetch(
                `${window.location.origin}/api/founder/user/${encodeURIComponent(selectedFounderUsername)}/department`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        department
                    })
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                showDialog(
                    "Departman Güncellenemedi",
                    data.message || "İşlem başarısız oldu.",
                    "error"
                );

                return;
            }

            founderResultDepartment.textContent =
                data.department || department;

                await loadFounderLogs();

            showDialog(
                "Departman Güncellendi",
                data.message ||
                "Kullanıcının departmanı kaydedildi.",
                "success"
            );

        } catch (err) {

            console.error(
                "Departman kaydetme hatası:",
                err
            );

            showDialog(
                "Bağlantı Hatası",
                "Sunucuya bağlanılamadı.",
                "error"
            );

        } finally {

            founderSaveDepartmentBtn.disabled = false;
            founderSaveDepartmentBtn.textContent =
                "Departmanı Kaydet";

        }

    }
);

founderBadgeSelect?.addEventListener(
    "change",
    () => {

        fillFounderRankOptions(
            founderBadgeSelect.value
        );

    }
);

async function loadFounderLogs() {

    const token =
        localStorage.getItem("token");

    if (!token) {
        return;
    }

    founderLogsLoading.style.display =
        "block";

    founderLogsEmpty.style.display =
        "none";

    founderLogsList.innerHTML = "";

    if (founderRefreshLogsBtn) {

        founderRefreshLogsBtn.disabled =
            true;

        founderRefreshLogsBtn.textContent =
            "Yükleniyor...";

    }

    try {

        const response = await fetch(
            `${window.location.origin}/api/founder/admin-logs`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showDialog(
                "Loglar Yüklenemedi",
                data.message ||
                "İşlem geçmişi alınamadı.",
                "error"
            );

            return;

        }

        renderFounderLogs(
            data.logs || []
        );

    } catch (err) {

        console.error(
            "Admin logları yükleme hatası:",
            err
        );

        showDialog(
            "Bağlantı Hatası",
            "İşlem geçmişi alınamadı.",
            "error"
        );

    } finally {

        founderLogsLoading.style.display =
            "none";

        if (founderRefreshLogsBtn) {

            founderRefreshLogsBtn.disabled =
                false;

            founderRefreshLogsBtn.textContent =
                "Yenile";

        }

    }

}

async function updateFounderProfileField(
    field,
    value
) {

    const token =
        localStorage.getItem("token");

    if (!selectedFounderUsername) {

        showDialog(
            "Kullanıcı Seçilmedi",
            "Önce bir kullanıcı aratın.",
            "warning"
        );

        return null;

    }

    if (!value) {

        showDialog(
            "Seçim Yapılmadı",
            "Kaydetmek istediğiniz değeri seçin.",
            "warning"
        );

        return null;

    }

    if (!token) {

        showDialog(
            "Oturum Gerekli",
            "Bu işlem için giriş yapmanız gerekiyor.",
            "warning"
        );

        return null;

    }

    try {

        const response = await fetch(
            `${window.location.origin}/api/founder/user/${encodeURIComponent(selectedFounderUsername)}/profile-data`,
            {
                method: "PATCH",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    field,
                    value
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showDialog(
                "Güncelleme Başarısız",
                data.message ||
                "Kullanıcı bilgisi güncellenemedi.",
                "error"
            );

            return null;

        }

        return data;

    } catch (err) {

        console.error(
            "Kurucu paneli profil güncelleme hatası:",
            err
        );

        showDialog(
            "Bağlantı Hatası",
            "Sunucuya bağlanılamadı.",
            "error"
        );

        return null;

    }

}

founderSaveBadgeRankBtn?.addEventListener(
    "click",
    async () => {

        const badge =
            founderBadgeSelect.value;

        const rank =
            founderRankSelect.value;

        if (!selectedFounderUsername) {

            showDialog(
                "Kullanıcı Seçilmedi",
                "Önce bir kullanıcı aratın.",
                "warning"
            );

            return;

        }

        if (!badge) {

            showDialog(
                "Rozet Seçilmedi",
                "Kullanıcıya atanacak rozeti seçin.",
                "warning"
            );

            return;

        }

        if (!rank) {

            showDialog(
                "Rütbe Seçilmedi",
                "Kullanıcıya atanacak rütbeyi seçin.",
                "warning"
            );

            return;

        }

        founderSaveBadgeRankBtn.disabled =
            true;

        founderSaveBadgeRankBtn.textContent =
            "Kaydediliyor...";

        try {

            const currentBadge =
                founderResultBadge.textContent.trim();

            const currentRank =
                founderResultRank.textContent.trim();

            let changed = false;

            if (currentBadge !== badge) {

                const badgeResult =
                    await updateFounderProfileField(
                        "badge",
                        badge
                    );

                if (!badgeResult) {
                    return;
                }

                founderResultBadge.textContent =
                    badge;

                changed = true;

            }

            if (currentRank !== rank) {

                const rankResult =
                    await updateFounderProfileField(
                        "rank",
                        rank
                    );

                if (!rankResult) {
                    return;
                }

                founderResultRank.textContent =
                    rank;

                changed = true;

            }

            if (!changed) {

                showDialog(
                    "Değişiklik Yok",
                    "Rozet ve rütbe zaten seçilen değerlerde.",
                    "warning"
                );

                return;

            }

            await loadFounderLogs();

            showDialog(
                "Bilgiler Güncellendi",
                "Kullanıcının rozet ve rütbe bilgileri kaydedildi.",
                "success"
            );

        } finally {

            founderSaveBadgeRankBtn.disabled =
                false;

            founderSaveBadgeRankBtn.textContent =
                "Rozet ve Rütbeyi Kaydet";

        }

    }
);

founderSaveRoleBtn?.addEventListener(
    "click",
    async () => {

        const role =
            founderRoleSelect.value;

        if (!selectedFounderUsername) {

            showDialog(
                "Kullanıcı Seçilmedi",
                "Önce bir kullanıcı aratın.",
                "warning"
            );

            return;

        }

        if (!role) {

            showDialog(
                "Rol Seçilmedi",
                "Kullanıcıya atanacak site rolünü seçin.",
                "warning"
            );

            return;

        }

        founderSaveRoleBtn.disabled =
            true;

        founderSaveRoleBtn.textContent =
            "Kaydediliyor...";

        try {

            const data =
                await updateFounderProfileField(
                    "role",
                    role
                );

            if (!data) {
                return;
            }

            founderResultRole.textContent =
                getFounderRoleText(role);

            await loadFounderLogs();

            showDialog(
                "Site Rolü Güncellendi",
                data.message ||
                "Kullanıcının site rolü kaydedildi.",
                "success"
            );

        } finally {

            founderSaveRoleBtn.disabled =
                false;

            founderSaveRoleBtn.textContent =
                "Site Rolünü Kaydet";

        }

    }
);

founderRefreshLogsBtn?.addEventListener(
    "click",
    loadFounderLogs
);