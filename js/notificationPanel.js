"use strict";

const notificationPanelNav =
    document.getElementById(
        "notificationPanelNav"
    );

const notificationPanel =
    document.getElementById(
        "notificationPanel"
    );

const closeNotificationPanel =
    document.getElementById(
        "closeNotificationPanel"
    );

const notificationPanelBody =
    document.getElementById(
        "notificationPanelBody"
    );

const notificationCount =
    document.getElementById(
        "notificationCount"
    );

const NOTIFICATION_API_URL =
    window.location.origin;

const notificationAllowedRoles = [
    "admin",
    "founder",
    "moderator"
];

let notificationCurrentUser = null;

function getNotificationToken() {

    return localStorage.getItem(
        "token"
    ) || "";
}

function syncNotificationBellVisibility() {

    if (!notificationPanelNav) {
        return;
    }

    notificationPanelNav.style.display =
        getNotificationToken()
            ? "inline-flex"
            : "none";
}

syncNotificationBellVisibility();

function getNotificationUserRoles(user) {

    if (!user) {
        return [];
    }

    if (
        Array.isArray(user.roles) &&
        user.roles.length > 0
    ) {
        return user.roles;
    }

    if (user.role) {
        return [user.role];
    }

    return [];
}

function canManageNotifications(user) {

    const roles =
        getNotificationUserRoles(
            user
        );

    return notificationAllowedRoles.some(
        role => roles.includes(role)
    );
}

function canManageFeedbackNotifications(
    user
) {

    const roles =
        getNotificationUserRoles(
            user
        );

    return (
        roles.includes("admin") ||
        roles.includes("moderator")
    );
}

function openNotificationPanel() {

    if (!notificationPanel) {
        return;
    }

    notificationPanel.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";
}

function closeNotificationPanelPopup() {

    if (!notificationPanel) {
        return;
    }

    notificationPanel.style.display =
        "none";

    document.body.style.overflow =
        "";
}

async function loadNotificationCurrentUser() {

    const token =
        getNotificationToken();

    if (!token) {

        if (notificationPanelNav) {
            notificationPanelNav.style.display =
                "none";
        }

        return;
    }

    try {

        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/api/me`,
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

        if (
            !response.ok ||
            !data.success
        ) {

            if (notificationPanelNav) {
                notificationPanelNav.style.display =
                    "none";
            }

            return;
        }

        notificationCurrentUser =
            data.user || null;

        if (notificationPanelNav) {
            notificationPanelNav.style.display =
                "inline-flex";
        }

        await loadPendingApprovals(
            false
        );

    } catch (err) {

        console.error(
            "Bildirim kullanıcı kontrol hatası:",
            err
        );

        if (notificationPanelNav) {
            notificationPanelNav.style.display =
                "none";
        }
    }
}

function updateNotificationCount(count) {

    const safeCount =
        Number(count) || 0;

    if (!notificationCount) {
        return;
    }

    if (safeCount <= 0) {

        notificationCount.style.display =
            "none";

        notificationCount.textContent =
            "0";

        return;
    }

    notificationCount.style.display =
        "inline-flex";

    notificationCount.textContent =
        safeCount > 99
            ? "99+"
            : String(safeCount);
}

function showNotificationLoading() {

    if (!notificationPanelBody) {
        return;
    }

    notificationPanelBody.innerHTML = `
        <div class="notification-loading">
            Bildirimler yükleniyor...
        </div>
    `;
}

function showNotificationEmpty() {

    if (!notificationPanelBody) {
        return;
    }

    notificationPanelBody.innerHTML = `
        <div class="notification-empty">
            Bekleyen hesap onayı bulunmuyor.
        </div>
    `;
}

function formatNotificationDate(dateValue) {

    if (!dateValue) {
        return "Tarih bilinmiyor";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Tarih bilinmiyor";
    }

    return date.toLocaleString(
        "tr-TR",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}

function createApprovalCard(approval) {

    const card =
        document.createElement("div");

    card.className =
        "notification-approval-card";

    card.dataset.userId =
        String(approval.id);

    const badgeOptions =
        Object.keys(rankData)
            .map(
                badge => `
                    <option value="${badge}">
                        ${badge}
                    </option>
                `
            )
            .join("");

    card.innerHTML = `
        <div class="notification-approval-top">

            <div class="notification-user-info">

                <strong>
                    ${approval.username || "Bilinmeyen Kullanıcı"}
                </strong>

                <span>
                    ${formatNotificationDate(
                        approval.createdAt
                    )}
                </span>

            </div>

            <div class="notification-status">
                Onay Bekliyor
            </div>

        </div>

        <div class="notification-approval-fields">

            <select class="notification-badge-select">

                <option value="">
                    Rozet seçiniz
                </option>

                ${badgeOptions}

            </select>

            <select
                class="notification-rank-select"
                disabled>

                <option value="">
                    Önce rozet seçiniz
                </option>

            </select>

        </div>

        <div class="notification-approval-actions">

            <button
                type="button"
                class="notification-reject-btn">

                Reddet

            </button>

            <button
                type="button"
                class="notification-approve-btn">

                Hesabı Onayla

            </button>

        </div>
    `;

    const badgeSelect =
        card.querySelector(
            ".notification-badge-select"
        );

    const rankSelect =
        card.querySelector(
            ".notification-rank-select"
        );

    const approveButton =
    card.querySelector(
        ".notification-approve-btn"
    );

    const rejectButton =
    card.querySelector(
        ".notification-reject-btn"
    );

    badgeSelect?.addEventListener(
        "change",
        () => {

            const selectedBadge =
                badgeSelect.value;

            rankSelect.innerHTML = `
                <option value="">
                    Rütbe seçiniz
                </option>
            `;

            if (
                !selectedBadge ||
                !Array.isArray(
                    rankData[selectedBadge]
                )
            ) {

                rankSelect.disabled =
                    true;

                return;
            }

            rankData[selectedBadge]
                .forEach(rank => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        rank;

                    option.textContent =
                        rank;

                    rankSelect.appendChild(
                        option
                    );
                });

            rankSelect.disabled =
                false;
        }
    );

    approveButton?.addEventListener(
    "click",
    async () => {

        const badge =
            badgeSelect?.value || "";

        const rank =
            rankSelect?.value || "";

        if (!badge || !rank) {

            showDialog(
                "Eksik Bilgi",
                "Hesabı onaylamak için rozet ve rütbe seçmelisiniz.",
                "warning"
            );

            return;
        }

        const token =
            getNotificationToken();

        if (!token) {

            showDialog(
                "Oturum Hatası",
                "Bu işlem için tekrar giriş yapmalısınız.",
                "error"
            );

            return;
        }

        approveButton.disabled =
            true;

        rejectButton.disabled =
            true;

        approveButton.textContent =
            "Onaylanıyor...";

        try {

            const response =
                await fetch(
                    `${NOTIFICATION_API_URL}/api/account-approvals/${approval.id}/approve`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                badge,
                                rank
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Hesap onaylanamadı."
                );
            }

            showDialog(
                "Hesap Onaylandı",
                `${approval.username} adlı kullanıcının hesabı başarıyla onaylandı.`,
                "success"
            );

            card.remove();

            await loadPendingApprovals(
                false
            );

        } catch (err) {

            console.error(
                "Hesap onaylama hatası:",
                err
            );

            showDialog(
                "Onaylama Hatası",
                err.message ||
                "Hesap onaylanamadı.",
                "error"
            );

            approveButton.disabled =
                false;

            rejectButton.disabled =
                false;

            approveButton.textContent =
                "Hesabı Onayla";
        }
    }
);

rejectButton?.addEventListener(
    "click",
    async () => {

        const token =
            getNotificationToken();

        if (!token) {

            showDialog(
                "Oturum Hatası",
                "Bu işlem için tekrar giriş yapmalısınız.",
                "error"
            );

            return;
        }

        const confirmed =
            window.confirm(
                `${approval.username} adlı kullanıcının başvurusunu reddetmek istediğinize emin misiniz?`
            );

        if (!confirmed) {
            return;
        }

        approveButton.disabled =
            true;

        rejectButton.disabled =
            true;

        rejectButton.textContent =
            "Reddediliyor...";

        try {

            const response =
                await fetch(
                    `${NOTIFICATION_API_URL}/api/account-approvals/${approval.id}/reject`,
                    {
                        method: "PATCH",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Hesap başvurusu reddedilemedi."
                );
            }

            showDialog(
                "Başvuru Reddedildi",
                `${approval.username} adlı kullanıcının başvurusu reddedildi.`,
                "success"
            );

            card.remove();

            await loadPendingApprovals(
                false
            );

        } catch (err) {

            console.error(
                "Hesap reddetme hatası:",
                err
            );

            showDialog(
                "Reddetme Hatası",
                err.message ||
                "Hesap başvurusu reddedilemedi.",
                "error"
            );

            approveButton.disabled =
                false;

            rejectButton.disabled =
                false;

            rejectButton.textContent =
                "Reddet";
        }
    }
);

    return card;
}

function getFeedbackStatusText(
    status
) {

    if (status === "reviewing") {
        return "İnceleniyor";
    }

    return "Yeni";
}

function createFeedbackNotificationCard(
    feedback
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "notification-feedback-card";

    card.innerHTML = `
        <div class="notification-feedback-summary">

            <div>
                <strong>
                    #${feedback.id} • ${feedback.title}
                </strong>

                <span>
                    ${feedback.username} •
                    ${feedback.category} •
                    ${formatNotificationDate(feedback.createdAt)}
                </span>
            </div>

            <div class="notification-status">
                ${getFeedbackStatusText(feedback.status)}
            </div>

        </div>

        <div class="notification-feedback-detail">

            <p>
                ${String(feedback.message || "")
                    .replaceAll("&","&amp;")
                    .replaceAll("<","&lt;")
                    .replaceAll(">","&gt;")}
            </p>

            <label class="notification-resolution-label">
                Çözüm Notu
            </label>

            <textarea
                class="notification-resolution-note"
                maxlength="500"
                placeholder="Kullanıcıya gidecek çözüm notunu yazın..."></textarea>

            <div class="notification-feedback-actions">

                <button
                    type="button"
                    class="notification-feedback-review">
                    İnceleniyor
                </button>

                <button
                    type="button"
                    class="notification-feedback-resolve">
                    Çözüldü
                </button>

            </div>

        </div>
    `;

    card.addEventListener(
    "click",
    event => {

        if (
            event.target.closest(
                "button, textarea, input, select, label"
            )
        ) {
            return;
        }

        card.classList.toggle(
            "open"
        );
    }
);

    async function updateStatus(
        status
    ) {

        const resolutionNote =
            String(
                card
                    .querySelector(
                        ".notification-resolution-note"
                    )
                    ?.value ||
                ""
            ).trim();

        if (
            status === "resolved" &&
            resolutionNote.length < 3
        ) {

            showDialog(
                "Çözüm Notu Gerekli",
                "Çözüldü demeden önce kullanıcıya gidecek kısa bir çözüm notu yazın.",
                "warning"
            );

            return;
        }

        const token =
            getNotificationToken();

        try {

            const response =
                await fetch(
                    `${NOTIFICATION_API_URL}/api/feedback/${feedback.id}/status`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                status,
                                resolutionNote:
                                    status === "resolved"
                                        ? resolutionNote
                                        : ""
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Geri bildirim durumu güncellenemedi."
                );
            }

            await loadPendingApprovals(
                false
            );

        } catch (err) {

            showDialog(
                "İşlem Hatası",
                err.message ||
                "Geri bildirim durumu güncellenemedi.",
                "error"
            );
        }
    }

    card
        .querySelector(
            ".notification-feedback-review"
        )
        ?.addEventListener(
            "click",
            () =>
                updateStatus(
                    "reviewing"
                )
        );

    card
        .querySelector(
            ".notification-feedback-resolve"
        )
        ?.addEventListener(
            "click",
            () =>
                updateStatus(
                    "resolved"
                )
        );

    return card;
}

function escapeNotificationHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function createPersonalNotificationCard(
    notification
) {

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "notification-personal-card" +
        (
            notification.isRead
                ? " is-read"
                : " is-unread"
        );

    card.innerHTML = `
        <div class="notification-personal-icon">
            <i class="fa-solid fa-circle-check"></i>
        </div>

        <div class="notification-personal-content">

            <strong>
                ${escapeNotificationHtml(
                    notification.title
                )}
            </strong>

            <p>
                ${escapeNotificationHtml(
                    notification.message
                )}
            </p>

            <div class="notification-personal-bottom">

                <span>
                    ${formatNotificationDate(
                        notification.createdAt
                    )}
                    ${
                        notification.isRead
                            ? " • Okundu"
                            : " • Yeni"
                    }
                </span>

                <button
                    type="button"
                    class="notification-personal-delete"
                    title="Bildirimi sil">
                    <i class="fa-solid fa-trash"></i>
                    Sil
                </button>

            </div>

        </div>
    `;

    card.addEventListener(
        "click",
        async event => {

            if (
                event.target.closest(
                    ".notification-personal-delete"
                )
            ) {
                return;
            }

            card.classList.toggle(
                "open"
            );

            if (
                notification.isRead
            ) {
                return;
            }

            const token =
                getNotificationToken();

            try {

                const response =
                    await fetch(
                        `${NOTIFICATION_API_URL}/api/notifications/${notification.id}/read`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                const data =
                    await response.json();

                if (
                    response.ok &&
                    data.success
                ) {

                    notification.isRead =
                        true;

                    card.classList.remove(
                        "is-unread"
                    );

                    card.classList.add(
                        "is-read"
                    );

                    await loadPendingApprovals(
                        false
                    );
                }

            } catch (err) {

                console.error(
                    "Bildirim okundu işaretlenemedi:",
                    err
                );
            }
        }
    );

    card
        .querySelector(
            ".notification-personal-delete"
        )
        ?.addEventListener(
            "click",
            async event => {

                event.stopPropagation();

                const token =
                    getNotificationToken();

                try {

                    const response =
                        await fetch(
                            `${NOTIFICATION_API_URL}/api/notifications/${notification.id}`,
                            {
                                method:
                                    "DELETE",

                                headers: {
                                    "Authorization":
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Bildirim silinemedi."
                        );
                    }

                    await loadPendingApprovals(
                        false
                    );

                } catch (err) {

                    showDialog(
                        "Silme Hatası",
                        err.message ||
                        "Bildirim silinemedi.",
                        "error"
                    );
                }
            }
        );

    return card;
}

async function loadPendingApprovals(
    showLoading = false
) {

    const token =
        getNotificationToken();

    if (
        !token ||
        !notificationCurrentUser
    ) {

        updateNotificationCount(
            0
        );

        return;
    }

    if (showLoading) {
        showNotificationLoading();
    }

    try {

        const personalRequest =
            fetch(
                `${NOTIFICATION_API_URL}/api/notifications`,
                {
                    method:
                        "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            )
                .then(
                    async response => ({
                        response,
                        data:
                            await response.json()
                    })
                );

        const approvalRequest =
            canManageNotifications(
                notificationCurrentUser
            )
                ? fetch(
                    `${NOTIFICATION_API_URL}/api/account-approvals`,
                    {
                        method:
                            "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                ).then(
                    async response => ({
                        response,
                        data:
                            await response.json()
                    })
                )
                : Promise.resolve({
                    response: {
                        ok: true
                    },

                    data: {
                        success: true,
                        approvals: []
                    }
                });

        const feedbackRequest =
            canManageFeedbackNotifications(
                notificationCurrentUser
            )
                ? fetch(
                    `${NOTIFICATION_API_URL}/api/feedback/manage`,
                    {
                        method:
                            "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                ).then(
                    async response => ({
                        response,
                        data:
                            await response.json()
                    })
                )
                : Promise.resolve({
                    response: {
                        ok: true
                    },

                    data: {
                        success: true,
                        feedbacks: []
                    }
                });

        const [
            personalResult,
            approvalResult,
            feedbackResult
        ] =
            await Promise.all([
                personalRequest,
                approvalRequest,
                feedbackRequest
            ]);

        if (
            !personalResult.response.ok ||
            !personalResult.data.success
        ) {

            throw new Error(
                personalResult.data.message ||
                "Kişisel bildirimler yüklenemedi."
            );
        }

        if (
            !approvalResult.response.ok ||
            !approvalResult.data.success
        ) {

            throw new Error(
                approvalResult.data.message ||
                "Hesap bildirimleri yüklenemedi."
            );
        }

        if (
            !feedbackResult.response.ok ||
            !feedbackResult.data.success
        ) {

            throw new Error(
                feedbackResult.data.message ||
                "Hata bildirimleri yüklenemedi."
            );
        }

        const personalNotifications =
            Array.isArray(
                personalResult.data.notifications
            )
                ? personalResult.data.notifications
                : [];

        const approvals =
            Array.isArray(
                approvalResult.data.approvals
            )
                ? approvalResult.data.approvals
                : [];

        const feedbacks =
            Array.isArray(
                feedbackResult.data.feedbacks
            )
                ? feedbackResult.data.feedbacks
                : [];

        const unreadPersonal =
            personalNotifications.filter(
                item =>
                    !item.isRead
            ).length;

        updateNotificationCount(
            unreadPersonal +
            approvals.length +
            feedbacks.length
        );

        if (
            personalNotifications.length === 0 &&
            approvals.length === 0 &&
            feedbacks.length === 0
        ) {

            notificationPanelBody.innerHTML = `
                <div class="notification-empty">
                    Bildirim bulunmuyor.
                </div>
            `;

            return;
        }

        notificationPanelBody.innerHTML =
            "";

        if (
            personalNotifications.length >
            0
        ) {

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "notification-section-title";

            title.textContent =
                "Bildirimler";

            notificationPanelBody.appendChild(
                title
            );

            personalNotifications.forEach(
                notification => {

                    notificationPanelBody.appendChild(
                        createPersonalNotificationCard(
                            notification
                        )
                    );
                }
            );
        }

        if (feedbacks.length > 0) {

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "notification-section-title";

            title.textContent =
                "Hata Bildirimleri";

            notificationPanelBody.appendChild(
                title
            );

            feedbacks.forEach(
                feedback => {

                    notificationPanelBody.appendChild(
                        createFeedbackNotificationCard(
                            feedback
                        )
                    );
                }
            );
        }

        if (approvals.length > 0) {

            const title =
                document.createElement(
                    "div"
                );

            title.className =
                "notification-section-title";

            title.textContent =
                "Hesap Onayları";

            notificationPanelBody.appendChild(
                title
            );

            approvals.forEach(
                approval => {

                    notificationPanelBody.appendChild(
                        createApprovalCard(
                            approval
                        )
                    );
                }
            );
        }

    } catch (err) {

        console.error(
            "Bildirimleri yükleme hatası:",
            err
        );

        if (
            showLoading &&
            notificationPanelBody
        ) {

            notificationPanelBody.innerHTML = `
                <div class="notification-empty">
                    ${
                        err.message ||
                        "Bildirimler yüklenemedi."
                    }
                </div>
            `;
        }
    }
}

notificationPanelNav?.addEventListener(
    "click",
    async () => {

        openNotificationPanel();

        await loadPendingApprovals(true);

    }
);

closeNotificationPanel?.addEventListener(
    "click",
    () => {

        closeNotificationPanelPopup();

    }
);

notificationPanel?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            notificationPanel
        ) {

            closeNotificationPanelPopup();

        }
    }
);

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            notificationPanel?.style.display ===
                "flex"
        ) {

            closeNotificationPanelPopup();

        }
    }
);

async function initializeNotificationSystem() {

    await loadNotificationCurrentUser();

    startNotificationAutoRefresh();
}

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeNotificationSystem,
        {
            once: true
        }
    );

} else {

    initializeNotificationSystem();
}

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.hidden ||
            !notificationCurrentUser
        ) {
            return;
        }

        await loadPendingApprovals(
            false
        );
    }
);

let notificationRefreshTimer = null;

function startNotificationAutoRefresh() {

    if (notificationRefreshTimer) {
        clearInterval(
            notificationRefreshTimer
        );
    }

    notificationRefreshTimer =
        setInterval(
            async () => {

                if (
                    document.hidden ||
                    !notificationCurrentUser
                ) {
                    return;
                }

                await loadPendingApprovals(
                    false
                );

            },
            30000
        );
}