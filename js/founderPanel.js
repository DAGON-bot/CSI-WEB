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

const founderBadgeSelect =
    document.getElementById("founderBadgeSelect");

const founderRankSelect =
    document.getElementById("founderRankSelect");

const founderRoleSelect =
    document.getElementById("founderRoleSelect");

const founderSaveAllBtn =
    document.getElementById("founderSaveAllBtn");

const founderLogSection =
    document.querySelector(".founder-log-section");

const founderRefreshLogsBtn =
    document.getElementById("founderRefreshLogsBtn");

const founderLogsLoading =
    document.getElementById("founderLogsLoading");

const founderLogsEmpty =
    document.getElementById("founderLogsEmpty");

const founderLogsList =
    document.getElementById("founderLogsList");

const founderLogsTableWrapper =
    document.getElementById(
        "founderLogsTableWrapper"
    );

const founderLogsPagination =
    document.getElementById(
        "founderLogsPagination"
    );

const founderLogsTotal =
    document.getElementById(
        "founderLogsTotal"
    );

const founderLogsPrevBtn =
    document.getElementById(
        "founderLogsPrevBtn"
    );

const founderLogsNextBtn =
    document.getElementById(
        "founderLogsNextBtn"
    );

const founderLogsPageNumbers =
    document.getElementById(
        "founderLogsPageNumbers"
    );

const founderLogsPageSize =
    document.getElementById(
        "founderLogsPageSize"
    );

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

let founderAdminLogs = [];
let founderLogsCurrentPage = 1;
let founderLogsItemsPerPage = 10;

let selectedFounderOriginalData = {
    department: "",
    badge: "",
    rank: "",
    role: "member"
};

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

function getAdminLogIcon(actionType) {

    const icons = {
        department_update: "🏢",
        badge_update: "🏅",
        rank_update: "🎖",
        role_update: "🛡",
        single_promotion: "⬆",
        bulk_promotion: "⇈"
    };

    return icons[actionType] || "⚙";

}


function renderFounderLogPagination() {

    if (!founderLogsPageNumbers) {
        return;
    }

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                founderAdminLogs.length /
                founderLogsItemsPerPage
            )
        );

    if (founderLogsCurrentPage > totalPages) {
        founderLogsCurrentPage = totalPages;
    }

    founderLogsPageNumbers.innerHTML = "";

    const createPageButton = (page) => {

        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = page;

        if (page === founderLogsCurrentPage) {
            button.classList.add("active");
        }

        button.addEventListener(
            "click",
            () => {

                founderLogsCurrentPage = page;

                renderFounderLogs();

            }
        );

        founderLogsPageNumbers.appendChild(
            button
        );

    };

    const visiblePages = [];

    if (totalPages <= 5) {

        for (
            let page = 1;
            page <= totalPages;
            page++
        ) {

            visiblePages.push(page);

        }

    } else {

        visiblePages.push(1);

        if (founderLogsCurrentPage > 3) {
            visiblePages.push("...");
        }

        const start =
            Math.max(
                2,
                founderLogsCurrentPage - 1
            );

        const end =
            Math.min(
                totalPages - 1,
                founderLogsCurrentPage + 1
            );

        for (
            let page = start;
            page <= end;
            page++
        ) {

            visiblePages.push(page);

        }

        if (
            founderLogsCurrentPage <
            totalPages - 2
        ) {

            visiblePages.push("...");

        }

        visiblePages.push(totalPages);

    }

    visiblePages.forEach((page) => {

        if (page === "...") {

            const dots =
                document.createElement("span");

            dots.className =
                "founder-log-page-dots";

            dots.textContent = "...";

            founderLogsPageNumbers.appendChild(
                dots
            );

            return;

        }

        createPageButton(page);

    });

    founderLogsPrevBtn.disabled =
        founderLogsCurrentPage <= 1;

    founderLogsNextBtn.disabled =
        founderLogsCurrentPage >= totalPages;

    founderLogsTotal.textContent =
        `Toplam ${founderAdminLogs.length} kayıt`;

}


function renderFounderLogs(
    logs = founderAdminLogs
) {

    if (!founderLogsList) {
        return;
    }

    if (Array.isArray(logs)) {
        founderAdminLogs = logs;
    }

    founderLogsList.innerHTML = "";

    if (founderAdminLogs.length === 0) {

        founderLogsEmpty.style.display =
            "block";

        founderLogsTableWrapper.style.display =
            "none";

        founderLogsPagination.style.display =
            "none";

        return;

    }

    founderLogsEmpty.style.display =
        "none";

    founderLogsTableWrapper.style.display =
        "block";

    founderLogsPagination.style.display =
        "flex";

    const startIndex =
        (
            founderLogsCurrentPage - 1
        ) * founderLogsItemsPerPage;

    const endIndex =
        startIndex +
        founderLogsItemsPerPage;

    const visibleLogs =
        founderAdminLogs.slice(
            startIndex,
            endIndex
        );

    visibleLogs.forEach((log) => {

        const row =
            document.createElement("tr");

        const actionText =
            getAdminLogActionText(
                log.actionType
            );

        const actionIcon =
            getAdminLogIcon(
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

        row.innerHTML = `
            <td>
                <span class="
                    founder-log-action
                    action-${escapeFounderHtml(
                        log.actionType || "default"
                    )}
                ">
                    <span class="founder-log-icon">
                        ${escapeFounderHtml(actionIcon)}
                    </span>

                    ${escapeFounderHtml(actionText)}
                </span>
            </td>

            <td class="founder-log-username">
                ${escapeFounderHtml(
                    log.targetUsername || "-"
                )}
            </td>

            <td>
                ${escapeFounderHtml(oldValue)}
            </td>

            <td class="founder-log-arrow">
                →
            </td>

            <td class="founder-log-new-value">
                ${escapeFounderHtml(newValue)}
            </td>

            <td>
                ${escapeFounderHtml(
                    log.performedBy || "-"
                )}
            </td>

            <td class="founder-log-date">
                ${escapeFounderHtml(createdAt)}
            </td>
        `;

        founderLogsList.appendChild(row);

    });

    renderFounderLogPagination();

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

    selectedFounderOriginalData = {
    department:
        user.department?.trim() || "",

    badge:
        userBadge,

    rank:
        userRank,

    role:
        userRole
};

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

    if (founderLogSection) {
    founderLogSection.style.display = "block";
}

    loadFounderLogs();

    founderSearchResult.style.display = "none";
    founderSearchUsername.value = "";
    selectedFounderUsername = "";
    founderDepartmentSelect.value = "";

    founderBadgeSelect.value = "";
    founderRoleSelect.value = "";

    fillFounderRankOptions("");

    selectedFounderOriginalData = {
        department: "",
        badge: "",
        rank: "",
        role: "member"
    };

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

founderBadgeSelect.value = "";
founderRoleSelect.value = "";

fillFounderRankOptions("");

selectedFounderOriginalData = {
    department: "",
    badge: "",
    rank: "",
    role: "member"
};

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

        if (founderLogSection) {
    founderLogSection.style.display = "none";
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

       founderLogsCurrentPage = 1;

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

async function updateFounderDepartment(
    department
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

    if (!department) {

        showDialog(
            "Departman Seçilmedi",
            "Kullanıcının departmanını seçin.",
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
            `${window.location.origin}/api/founder/user/${encodeURIComponent(selectedFounderUsername)}/department`,
            {
                method: "PATCH",

                headers: {
                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    department
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showDialog(
                "Departman Güncellenemedi",
                data.message ||
                "Departman değiştirilemedi.",
                "error"
            );

            return null;

        }

        return data;

    } catch (err) {

        console.error(
            "Departman güncelleme hatası:",
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

founderSaveAllBtn?.addEventListener(
    "click",
    async () => {

        if (!selectedFounderUsername) {

            showDialog(
                "Kullanıcı Seçilmedi",
                "Önce bir kullanıcı aratın.",
                "warning"
            );

            return;

        }

        const department =
            founderDepartmentSelect.value;

        const badge =
            founderBadgeSelect.value;

        const rank =
            founderRankSelect.value;

        const role =
            founderRoleSelect.value;

        if (
            !department ||
            !badge ||
            !rank ||
            !role
        ) {

            showDialog(
                "Eksik Seçim",
                "Departman, rozet, rütbe ve site rolü alanlarını doldurun.",
                "warning"
            );

            return;

        }

        const changes = {
            department:
                department !==
                selectedFounderOriginalData.department,

            badge:
                badge !==
                selectedFounderOriginalData.badge,

            rank:
                rank !==
                selectedFounderOriginalData.rank,

            role:
                role !==
                selectedFounderOriginalData.role
        };

        const hasChanges =
            Object.values(changes).some(Boolean);

        if (!hasChanges) {

            showDialog(
                "Değişiklik Yok",
                "Kullanıcı bilgilerinde herhangi bir değişiklik yapılmadı.",
                "warning"
            );

            return;

        }

        founderSaveAllBtn.disabled = true;

        founderSaveAllBtn.textContent =
            "Değişiklikler Kaydediliyor...";

        const updatedFields = [];
        const failedFields = [];

        try {

            if (changes.department) {

                const result =
                    await updateFounderDepartment(
                        department
                    );

                if (result) {

                    founderResultDepartment.textContent =
                        result.department ||
                        department;

                    selectedFounderOriginalData.department =
                        department;

                    updatedFields.push(
                        "Departman"
                    );

                } else {

                    failedFields.push(
                        "Departman"
                    );

                }

            }

            if (changes.badge) {

                const result =
                    await updateFounderProfileField(
                        "badge",
                        badge
                    );

                if (result) {

                    founderResultBadge.textContent =
                        badge;

                    selectedFounderOriginalData.badge =
                        badge;

                    updatedFields.push(
                        "Rozet"
                    );

                } else {

                    failedFields.push(
                        "Rozet"
                    );

                }

            }

            if (changes.rank) {

                const result =
                    await updateFounderProfileField(
                        "rank",
                        rank
                    );

                if (result) {

                    founderResultRank.textContent =
                        rank;

                    selectedFounderOriginalData.rank =
                        rank;

                    updatedFields.push(
                        "Rütbe"
                    );

                } else {

                    failedFields.push(
                        "Rütbe"
                    );

                }

            }

            if (changes.role) {

                const result =
                    await updateFounderProfileField(
                        "role",
                        role
                    );

                if (result) {

                    founderResultRole.textContent =
                        getFounderRoleText(role);

                    selectedFounderOriginalData.role =
                        role;

                    updatedFields.push(
                        "Site Rolü"
                    );

                } else {

                    failedFields.push(
                        "Site Rolü"
                    );

                }

            }

            await loadFounderLogs();

            if (
                updatedFields.length > 0 &&
                failedFields.length === 0
            ) {

                showDialog(
                    "Değişiklikler Kaydedildi",
                    `${updatedFields.join(", ")} başarıyla güncellendi.`,
                    "success"
                );

                return;

            }

            if (
                updatedFields.length > 0 &&
                failedFields.length > 0
            ) {

                showDialog(
                    "Kısmen Güncellendi",
                    `${updatedFields.join(", ")} güncellendi. ${failedFields.join(", ")} güncellenemedi.`,
                    "warning"
                );

                return;

            }

            showDialog(
                "Güncelleme Başarısız",
                "Seçilen bilgiler güncellenemedi.",
                "error"
            );

        } finally {

            founderSaveAllBtn.disabled =
                false;

            founderSaveAllBtn.textContent =
                "💾 Tüm Değişiklikleri Kaydet";

        }

    }
);

founderLogsPrevBtn?.addEventListener(
    "click",
    () => {

        if (founderLogsCurrentPage <= 1) {
            return;
        }

        founderLogsCurrentPage--;

        renderFounderLogs();

    }
);


founderLogsNextBtn?.addEventListener(
    "click",
    () => {

        const totalPages =
            Math.ceil(
                founderAdminLogs.length /
                founderLogsItemsPerPage
            );

        if (
            founderLogsCurrentPage >=
            totalPages
        ) {
            return;
        }

        founderLogsCurrentPage++;

        renderFounderLogs();

    }
);


founderLogsPageSize?.addEventListener(
    "change",
    () => {

        founderLogsItemsPerPage =
            Number(
                founderLogsPageSize.value
            ) || 10;

        founderLogsCurrentPage = 1;

        renderFounderLogs();

    }
);
