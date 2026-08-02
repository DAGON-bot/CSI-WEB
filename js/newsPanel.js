const newsPanelNav =
    document.getElementById("newsPanelNav");

const newsPanelOverlay =
    document.getElementById("newsPanelOverlay");

const newsPanelClose =
    document.getElementById("newsPanelClose");

const newsCreateNewBtn =
    document.getElementById("newsCreateNewBtn");

const newsPanelStatusFilter =
    document.getElementById("newsPanelStatusFilter");

const newsPanelLoading =
    document.getElementById("newsPanelLoading");

const newsPanelEmpty =
    document.getElementById("newsPanelEmpty");

const newsPanelArticleList =
    document.getElementById("newsPanelArticleList");

const newsArticleId =
    document.getElementById("newsArticleId");

const newsTitleInput =
    document.getElementById("newsTitleInput");

const newsSummaryInput =
    document.getElementById("newsSummaryInput");

const newsContentInput =
    document.getElementById("newsContentInput");

const newsCategorySelect =
    document.getElementById("newsCategorySelect");

const newsStatusSelect =
    document.getElementById("newsStatusSelect");

const newsImageUrlInput =
    document.getElementById("newsImageUrlInput");

const newsImagePreviewWrapper =
    document.getElementById(
        "newsImagePreviewWrapper"
    );

const newsImagePreview =
    document.getElementById("newsImagePreview");

const newsTitleCounter =
    document.getElementById("newsTitleCounter");

const newsSummaryCounter =
    document.getElementById(
        "newsSummaryCounter"
    );

const newsContentCounter =
    document.getElementById(
        "newsContentCounter"
    );

const newsEditorModeLabel =
    document.getElementById(
        "newsEditorModeLabel"
    );

const newsEditorTitle =
    document.getElementById("newsEditorTitle");

const newsEditorStatusBadge =
    document.getElementById(
        "newsEditorStatusBadge"
    );

const newsFeatureArea =
    document.getElementById("newsFeatureArea");

const newsFeaturedCheckbox =
    document.getElementById(
        "newsFeaturedCheckbox"
    );

const newsPanelFeedback =
    document.getElementById(
        "newsPanelFeedback"
    );

const newsResetBtn =
    document.getElementById("newsResetBtn");

const newsDeleteBtn =
    document.getElementById("newsDeleteBtn");

const newsPreviewBtn =
    document.getElementById("newsPreviewBtn");

const newsSaveBtn =
    document.getElementById("newsSaveBtn");

const newsPreviewOverlay =
    document.getElementById(
        "newsPreviewOverlay"
    );

const newsPreviewClose =
    document.getElementById(
        "newsPreviewClose"
    );

const newsPreviewImage =
    document.getElementById(
        "newsPreviewImage"
    );

const newsPreviewCategory =
    document.getElementById(
        "newsPreviewCategory"
    );

const newsPreviewHeading =
    document.getElementById(
        "newsPreviewHeading"
    );

const newsPreviewSummary =
    document.getElementById(
        "newsPreviewSummary"
    );

const newsPreviewContent =
    document.getElementById(
        "newsPreviewContent"
    );

let newsPanelArticles = [];
let newsPanelPermissions = {
    canManageAll: false,
    canFeature: false
};

let newsPanelCurrentRoles = [];

function getNewsPanelToken() {
    return localStorage.getItem("token") || "";
}

function getNewsStatusText(status) {

    const labels = {
        draft: "Taslak",
        published: "Yayınlandı",
        archived: "Arşivlendi"
    };

    return labels[status] || "Bilinmiyor";
}

function getNewsCategoryText(category) {

    const labels = {
        general: "Genel",
        announcement: "Duyuru",
        event: "Etkinlik",
        interview: "Röportaj",
        update: "Güncelleme"
    };

    return labels[category] || "Genel";
}

function formatNewsPanelDate(value) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "tr-TR",
        {
            dateStyle: "short",
            timeStyle: "short"
        }
    );
}

function showNewsPanelFeedback(
    message,
    type = "error"
) {

    if (!newsPanelFeedback) {
        return;
    }

    newsPanelFeedback.textContent =
        message || "";

    newsPanelFeedback.className =
        `news-panel-feedback ${type}`;

    if (!message) {
        return;
    }

    window.clearTimeout(
        showNewsPanelFeedback.timeout
    );

    showNewsPanelFeedback.timeout =
        window.setTimeout(() => {

            newsPanelFeedback.textContent = "";
            newsPanelFeedback.className =
                "news-panel-feedback";

        }, 3500);
}

function updateNewsCounters() {

    if (newsTitleCounter) {
        newsTitleCounter.textContent =
            `${newsTitleInput?.value.length || 0} / 150`;
    }

    if (newsSummaryCounter) {
        newsSummaryCounter.textContent =
            `${newsSummaryInput?.value.length || 0} / 300`;
    }

    if (newsContentCounter) {
        newsContentCounter.textContent =
            `${newsContentInput?.value.length || 0} / 20000`;
    }
}

function updateNewsImagePreview() {

    if (
        !newsImagePreviewWrapper ||
        !newsImagePreview
    ) {
        return;
    }

    const imageUrl =
        String(
            newsImageUrlInput?.value || ""
        ).trim();

    if (!imageUrl) {

        newsImagePreviewWrapper.style.display =
            "none";

        newsImagePreview.src = "";
        return;
    }

    newsImagePreview.src = imageUrl;

    newsImagePreviewWrapper.style.display =
        "block";
}

function updateNewsEditorStatus(status) {

    if (!newsEditorStatusBadge) {
        return;
    }

    const cleanStatus =
        status || "draft";

    newsEditorStatusBadge.className =
        `news-editor-status ${cleanStatus}`;

    newsEditorStatusBadge.textContent =
        getNewsStatusText(cleanStatus);
}

function resetNewsEditor() {

    if (newsArticleId) {
        newsArticleId.value = "";
    }

    if (newsTitleInput) {
        newsTitleInput.value = "";
    }

    if (newsSummaryInput) {
        newsSummaryInput.value = "";
    }

    if (newsContentInput) {
        newsContentInput.value = "";
    }

    if (newsCategorySelect) {
        newsCategorySelect.value = "general";
    }

    if (newsStatusSelect) {
        newsStatusSelect.value = "draft";
    }

    if (newsImageUrlInput) {
        newsImageUrlInput.value = "";
    }

    if (newsFeaturedCheckbox) {
        newsFeaturedCheckbox.checked = false;
    }

    if (newsEditorModeLabel) {
        newsEditorModeLabel.textContent =
            "YENİ HABER";
    }

    if (newsEditorTitle) {
        newsEditorTitle.textContent =
            "Haber Oluştur";
    }

    if (newsDeleteBtn) {
        newsDeleteBtn.style.display =
            "none";
    }

    if (newsFeatureArea) {
        newsFeatureArea.style.display =
            newsPanelPermissions.canFeature
                ? "block"
                : "none";
    }

    if (newsSaveBtn) {
    newsSaveBtn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Oluştur';
}

    updateNewsEditorStatus("draft");
    updateNewsCounters();
    updateNewsImagePreview();
    showNewsPanelFeedback("");
}

function fillNewsEditor(article) {

    if (newsSaveBtn) {
    newsSaveBtn.innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Değişiklikleri Kaydet';
}

    if (!article) {
        resetNewsEditor();
        return;
    }

    if (newsArticleId) {
        newsArticleId.value =
            String(article.id || "");
    }

    if (newsTitleInput) {
        newsTitleInput.value =
            article.title || "";
    }

    if (newsSummaryInput) {
        newsSummaryInput.value =
            article.summary || "";
    }

    if (newsContentInput) {
        newsContentInput.value =
            article.content || "";
    }

    if (newsCategorySelect) {
        newsCategorySelect.value =
            article.category || "general";
    }

    if (newsStatusSelect) {
        newsStatusSelect.value =
            article.status || "draft";
    }

    if (newsImageUrlInput) {
        newsImageUrlInput.value =
            article.imageUrl || "";
    }

    if (newsFeaturedCheckbox) {
        newsFeaturedCheckbox.checked =
            !!article.isFeatured;
    }

    if (newsEditorModeLabel) {
        newsEditorModeLabel.textContent =
            "HABER DÜZENLE";
    }

    if (newsEditorTitle) {
        newsEditorTitle.textContent =
            article.title || "Haber Düzenle";
    }

    if (newsDeleteBtn) {

    const canDelete =
        newsPanelPermissions.canManageAll ||
        newsPanelCurrentRoles.includes(
            "reporter"
        );

    newsDeleteBtn.style.display =
        canDelete
            ? "inline-flex"
            : "none";
}

    if (newsFeatureArea) {
        newsFeatureArea.style.display =
            newsPanelPermissions.canFeature
                ? "block"
                : "none";
    }

    updateNewsEditorStatus(
        article.status || "draft"
    );

    updateNewsCounters();
    updateNewsImagePreview();
    showNewsPanelFeedback("");
}

function createNewsPanelArticleItem(article) {

    const item =
        document.createElement("button");

    item.type = "button";
    item.className =
        "news-admin-article-item";

    item.dataset.articleId =
        String(article.id);

    const top =
        document.createElement("div");

    top.className =
        "news-admin-article-item-top";

    const title =
        document.createElement("strong");

    title.textContent =
        article.title || "Başlıksız Haber";

    const status =
        document.createElement("span");

    status.className =
        `news-admin-list-status ${article.status}`;

    status.textContent =
        getNewsStatusText(article.status);

    top.appendChild(title);
    top.appendChild(status);

    const summary =
        document.createElement("p");

    summary.textContent =
        article.summary || "Özet bulunmuyor.";

    const footer =
        document.createElement("div");

    footer.className =
        "news-admin-article-item-footer";

    const author =
        document.createElement("span");

    author.textContent =
        article.authorUsername
            ? `✍ ${article.authorUsername}`
            : "✍ Bilinmiyor";

    const date =
        document.createElement("span");

    date.textContent =
        formatNewsPanelDate(
            article.updatedAt ||
            article.createdAt
        );

    footer.appendChild(author);
    footer.appendChild(date);

    item.appendChild(top);
    item.appendChild(summary);
    item.appendChild(footer);

    if (article.isFeatured) {

        const featured =
            document.createElement("span");

        featured.className =
            "news-admin-featured-label";

        featured.textContent =
            "★ Öne Çıkan";

        item.appendChild(featured);
    }

    item.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".news-admin-article-item.active"
                )
                .forEach(activeItem => {
                    activeItem.classList.remove(
                        "active"
                    );
                });

            item.classList.add("active");

            fillNewsEditor(article);
        }
    );

    return item;
}

function renderNewsPanelArticles() {

    if (!newsPanelArticleList) {
        return;
    }

    newsPanelArticleList.innerHTML = "";

    const selectedStatus =
        newsPanelStatusFilter?.value ||
        "all";

    const filteredArticles =
        newsPanelArticles.filter(article => {

            if (selectedStatus === "all") {
                return true;
            }

            return (
                article.status ===
                selectedStatus
            );
        });

    if (newsPanelEmpty) {
        newsPanelEmpty.style.display =
            filteredArticles.length === 0
                ? "block"
                : "none";
    }

    filteredArticles.forEach(article => {

        newsPanelArticleList.appendChild(
            createNewsPanelArticleItem(article)
        );
    });
}

async function loadNewsPanelArticles() {

    const token =
        getNewsPanelToken();

    if (!token) {
        return false;
    }

    if (newsPanelLoading) {
        newsPanelLoading.style.display =
            "block";
    }

    if (newsPanelEmpty) {
        newsPanelEmpty.style.display =
            "none";
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news-panel/articles`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showNewsPanelFeedback(
                data.message ||
                "Haberler yüklenemedi."
            );

            return false;
        }

        newsPanelArticles =
            Array.isArray(data.articles)
                ? data.articles
                : [];

        newsPanelPermissions = {
            canManageAll:
                !!data.permissions?.canManageAll,

            canFeature:
                !!data.permissions?.canFeature
        };

        if (newsFeatureArea) {
            newsFeatureArea.style.display =
                newsPanelPermissions.canFeature
                    ? "block"
                    : "none";
        }

        renderNewsPanelArticles();

        return true;

    } catch (err) {

        console.error(
            "Haber paneli listeleme hatası:",
            err
        );

        showNewsPanelFeedback(
            "Sunucuya bağlanılamadı."
        );

        return false;

    } finally {

        if (newsPanelLoading) {
            newsPanelLoading.style.display =
                "none";
        }
    }
}

async function checkNewsPanelAccess() {

    const token =
        getNewsPanelToken();

    if (!token) {

        newsPanelCurrentRoles = [];

        if (newsPanelNav) {
            newsPanelNav.style.display =
                "none";
        }

        return;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/me`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        const roles =
            Array.isArray(data.user?.roles) &&
            data.user.roles.length > 0
                ? data.user.roles
                : [data.user?.role || "member"];

        const allowedRoles = [
            "reporter",
            "moderator",
            "founder",
            "admin"
        ];

        const hasAccess =
            response.ok &&
            data.success &&
            allowedRoles.some(
                role => roles.includes(role)
            );

        newsPanelCurrentRoles =
            hasAccess
                ? roles
                : [];

        if (newsPanelNav) {
            newsPanelNav.style.display =
                hasAccess
                    ? ""
                    : "none";
        }

    } catch (err) {

        console.error(
            "Haber paneli erişim kontrolü:",
            err
        );

        if (newsPanelNav) {
            newsPanelNav.style.display =
                "none";
        }
    }
}

async function openNewsPanel() {

    if (!newsPanelOverlay) {
        return;
    }

    newsPanelOverlay.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";

    resetNewsEditor();

    await loadNewsPanelArticles();
}

function closeNewsPanel() {

    if (!newsPanelOverlay) {
        return;
    }

    newsPanelOverlay.classList.remove(
        "active"
    );

    document.body.style.overflow = "";

    resetNewsEditor();
}

function getNewsEditorPayload() {

    return {
        title:
            String(
                newsTitleInput?.value || ""
            ).trim(),

        summary:
            String(
                newsSummaryInput?.value || ""
            ).trim(),

        content:
            String(
                newsContentInput?.value || ""
            ).trim(),

        category:
            newsCategorySelect?.value ||
            "general",

        imageUrl:
            String(
                newsImageUrlInput?.value || ""
            ).trim(),

        status:
            newsStatusSelect?.value ||
            "draft"
    };
}

async function saveNewsArticle() {

    const token =
        getNewsPanelToken();

    if (!token) {

        showNewsPanelFeedback(
            "Oturum bilgisi bulunamadı."
        );

        return;
    }

    const payload =
        getNewsEditorPayload();

    const articleId =
        Number(
            newsArticleId?.value || 0
        );

    const isEditing =
        Number.isInteger(articleId) &&
        articleId > 0;

    if (newsSaveBtn) {
        newsSaveBtn.disabled = true;
    }

    try {

        const response =
            await fetch(
                isEditing
                    ? `${window.location.origin}/api/news-panel/articles/${articleId}`
                    : `${window.location.origin}/api/news-panel/articles`,
                {
                    method:
                        isEditing
                            ? "PATCH"
                            : "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showNewsPanelFeedback(
                data.message ||
                "Haber kaydedilemedi."
            );

            return;
        }

        showNewsPanelFeedback(
            data.message ||
            "Haber kaydedildi.",
            "success"
        );

        await loadNewsPanelArticles();

        const savedArticleId =
            Number(
                data.article?.id ||
                articleId
            );

        const savedArticle =
            newsPanelArticles.find(
                article =>
                    Number(article.id) ===
                    savedArticleId
            );

        if (savedArticle) {
            fillNewsEditor(savedArticle);
        }
        window.dispatchEvent(
    new CustomEvent(
        "news:updated"
    )
);

    } catch (err) {

        console.error(
            "Haber kaydetme hatası:",
            err
        );

        showNewsPanelFeedback(
            "Sunucuya bağlanılamadı."
        );

    } finally {

        if (newsSaveBtn) {
            newsSaveBtn.disabled = false;
        }
    }
}

function confirmNewsDelete() {

    return window.confirm(
        "Bu haberi kalıcı olarak silmek istediğinize emin misiniz?"
    );
}

async function deleteSelectedNewsArticle() {

    const articleId =
        Number(
            newsArticleId?.value || 0
        );

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {

        showNewsPanelFeedback(
            "Silinecek haber seçilmedi."
        );

        return;
    }

    const confirmed =
        confirmNewsDelete();

    if (!confirmed) {
        return;
    }

    const token =
        getNewsPanelToken();

    if (!token) {

        showNewsPanelFeedback(
            "Oturum bilgisi bulunamadı."
        );

        return;
    }

    if (newsDeleteBtn) {
        newsDeleteBtn.disabled = true;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news-panel/articles/${articleId}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            showNewsPanelFeedback(
                data.message ||
                "Haber silinemedi."
            );

            return;
        }

        showNewsPanelFeedback(
            data.message ||
            "Haber silindi.",
            "success"
        );

        resetNewsEditor();
        await loadNewsPanelArticles();

        window.dispatchEvent(
    new CustomEvent(
        "news:updated"
    )
);

    } catch (err) {

        console.error(
            "Haber silme hatası:",
            err
        );

        showNewsPanelFeedback(
            "Sunucuya bağlanılamadı."
        );

    } finally {

        if (newsDeleteBtn) {
            newsDeleteBtn.disabled = false;
        }
    }
}

async function updateNewsFeaturedStatus() {

    if (!newsPanelPermissions.canFeature) {
        return;
    }

    const articleId =
        Number(
            newsArticleId?.value || 0
        );

    if (
        !Number.isInteger(articleId) ||
        articleId <= 0
    ) {

        showNewsPanelFeedback(
            "Önce haberi kaydetmelisiniz."
        );

        if (newsFeaturedCheckbox) {
            newsFeaturedCheckbox.checked =
                false;
        }

        return;
    }

    const token =
        getNewsPanelToken();

    if (!token) {
        return;
    }

    const isFeatured =
        !!newsFeaturedCheckbox?.checked;

    if (newsFeaturedCheckbox) {
        newsFeaturedCheckbox.disabled = true;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news-panel/articles/${articleId}/featured`,
                {
                    method: "PATCH",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            isFeatured
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            if (newsFeaturedCheckbox) {
                newsFeaturedCheckbox.checked =
                    !isFeatured;
            }

            showNewsPanelFeedback(
                data.message ||
                "Öne çıkarma durumu değiştirilemedi."
            );

            return;
        }

        showNewsPanelFeedback(
            data.message ||
            "Öne çıkarma durumu güncellendi.",
            "success"
        );

        await loadNewsPanelArticles();

        window.dispatchEvent(
    new CustomEvent(
        "news:updated"
    )
);

        const updatedArticle =
            newsPanelArticles.find(
                article =>
                    Number(article.id) ===
                    articleId
            );

        if (updatedArticle) {
            fillNewsEditor(updatedArticle);
        }

    } catch (err) {

        console.error(
            "Haber öne çıkarma hatası:",
            err
        );

        if (newsFeaturedCheckbox) {
            newsFeaturedCheckbox.checked =
                !isFeatured;
        }

        showNewsPanelFeedback(
            "Sunucuya bağlanılamadı."
        );

    } finally {

        if (newsFeaturedCheckbox) {
            newsFeaturedCheckbox.disabled =
                false;
        }
    }
}

function openNewsPreview() {

    if (!newsPreviewOverlay) {
        return;
    }

    const title =
        String(
            newsTitleInput?.value || ""
        ).trim();

    const summary =
        String(
            newsSummaryInput?.value || ""
        ).trim();

    const content =
        String(
            newsContentInput?.value || ""
        ).trim();

    const category =
        newsCategorySelect?.value ||
        "general";

    const imageUrl =
        String(
            newsImageUrlInput?.value || ""
        ).trim();

    if (newsPreviewHeading) {
        newsPreviewHeading.textContent =
            title || "Haber Başlığı";
    }

    if (newsPreviewSummary) {
        newsPreviewSummary.textContent =
            summary || "Haber özeti";
    }

    if (newsPreviewCategory) {
        newsPreviewCategory.textContent =
            getNewsCategoryText(category);
    }

    if (newsPreviewContent) {

        newsPreviewContent.textContent =
            content || "Haber içeriği";

    }

    if (newsPreviewImage) {

        newsPreviewImage.src =
            imageUrl || "assets/logo.png";

    }

    newsPreviewOverlay.classList.add(
        "active"
    );
}

function closeNewsPreview() {

    newsPreviewOverlay?.classList.remove(
        "active"
    );
}

newsPanelNav?.addEventListener(
    "click",
    openNewsPanel
);

newsPanelClose?.addEventListener(
    "click",
    closeNewsPanel
);

newsPanelOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            newsPanelOverlay
        ) {
            closeNewsPanel();
        }
    }
);

newsCreateNewBtn?.addEventListener(
    "click",
    resetNewsEditor
);

newsResetBtn?.addEventListener(
    "click",
    resetNewsEditor
);

newsPanelStatusFilter?.addEventListener(
    "change",
    renderNewsPanelArticles
);

newsStatusSelect?.addEventListener(
    "change",
    () => {

        updateNewsEditorStatus(
            newsStatusSelect.value
        );
    }
);

newsTitleInput?.addEventListener(
    "input",
    updateNewsCounters
);

newsSummaryInput?.addEventListener(
    "input",
    updateNewsCounters
);

newsContentInput?.addEventListener(
    "input",
    updateNewsCounters
);

newsImageUrlInput?.addEventListener(
    "input",
    updateNewsImagePreview
);

newsImagePreview?.addEventListener(
    "error",
    () => {

        if (newsImagePreviewWrapper) {
            newsImagePreviewWrapper.style.display =
                "none";
        }
    }
);

newsSaveBtn?.addEventListener(
    "click",
    saveNewsArticle
);

newsDeleteBtn?.addEventListener(
    "click",
    deleteSelectedNewsArticle
);

newsFeaturedCheckbox?.addEventListener(
    "change",
    updateNewsFeaturedStatus
);

newsPreviewBtn?.addEventListener(
    "click",
    openNewsPreview
);

newsPreviewClose?.addEventListener(
    "click",
    closeNewsPreview
);

newsPreviewOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            newsPreviewOverlay
        ) {
            closeNewsPreview();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        if (
            newsPreviewOverlay
                ?.classList
                .contains("active")
        ) {
            closeNewsPreview();
            return;
        }

        if (
            newsPanelOverlay
                ?.classList
                .contains("active")
        ) {
            closeNewsPanel();
        }
    }
);

window.addEventListener(
    "focus",
    checkNewsPanelAccess
);

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkNewsPanelAccess();
        resetNewsEditor();
    }
);