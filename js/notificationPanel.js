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

        if (
    canManageNotifications(
        notificationCurrentUser
    )
) {

    if (notificationPanelNav) {
        notificationPanelNav.style.display =
            "inline-flex";
    }

    await loadPendingApprovals(false);

}

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

async function loadPendingApprovals(
    showLoading = false
) {

    const token =
        getNotificationToken();

    if (
        !token ||
        !canManageNotifications(
            notificationCurrentUser
        )
    ) {

        updateNotificationCount(0);
        return;
    }

    if (showLoading) {
        showNotificationLoading();
    }

    try {

        const response =
            await fetch(
                `${NOTIFICATION_API_URL}/api/account-approvals`,
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

            throw new Error(
                data.message ||
                "Bildirimler yüklenemedi."
            );
        }

        const approvals =
            Array.isArray(data.approvals)
                ? data.approvals
                : [];

        updateNotificationCount(
            approvals.length
        );

        if (approvals.length === 0) {
            showNotificationEmpty();
            return;
        }

        notificationPanelBody.innerHTML =
    "";

approvals.forEach(approval => {

    const card =
        createApprovalCard(
            approval
        );

    notificationPanelBody.appendChild(
        card
    );
});

    } catch (err) {

        console.error(
            "Bekleyen hesapları yükleme hatası:",
            err
        );

        if (showLoading && notificationPanelBody) {

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

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await loadNotificationCurrentUser();

        startNotificationAutoRefresh();

    }
);

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.hidden ||
            !canManageNotifications(
                notificationCurrentUser
            )
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
                    !canManageNotifications(
                        notificationCurrentUser
                    )
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