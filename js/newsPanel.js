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

const newsImageFileInput =
    document.getElementById(
        "newsImageFileInput"
    );

const newsImageSelectBtn =
    document.getElementById(
        "newsImageSelectBtn"
    );

const newsImageChangeBtn =
    document.getElementById(
        "newsImageChangeBtn"
    );

const newsImageRemoveBtn =
    document.getElementById(
        "newsImageRemoveBtn"
    );

const newsImageFileName =
    document.getElementById(
        "newsImageFileName"
    );

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

    const contentDeleteConfirmOverlay =
    document.getElementById(
        "contentDeleteConfirmOverlay"
    );

const contentDeleteConfirmTitle =
    document.getElementById(
        "contentDeleteConfirmTitle"
    );

const contentDeleteConfirmMessage =
    document.getElementById(
        "contentDeleteConfirmMessage"
    );

const contentDeleteConfirmCancel =
    document.getElementById(
        "contentDeleteConfirmCancel"
    );

const contentDeleteConfirmApprove =
    document.getElementById(
        "contentDeleteConfirmApprove"
    );

const newsContentTabBtn =
    document.getElementById(
        "newsContentTabBtn"
    );

const announcementContentTabBtn =
    document.getElementById(
        "announcementContentTabBtn"
    );

const newsManagementSection =
    document.getElementById(
        "newsManagementSection"
    );

const announcementManagementSection =
    document.getElementById(
        "announcementManagementSection"
    );

const announcementCreateNewBtn =
    document.getElementById(
        "announcementCreateNewBtn"
    );

const announcementStatusFilter =
    document.getElementById(
        "announcementStatusFilter"
    );

const announcementPanelLoading =
    document.getElementById(
        "announcementPanelLoading"
    );

const announcementPanelEmpty =
    document.getElementById(
        "announcementPanelEmpty"
    );

const announcementPanelList =
    document.getElementById(
        "announcementPanelList"
    );

const announcementId =
    document.getElementById(
        "announcementId"
    );

const announcementTitleInput =
    document.getElementById(
        "announcementTitleInput"
    );

const announcementIconInput =
    document.getElementById(
        "announcementIconInput"
    );

const announcementStatusSelect =
    document.getElementById(
        "announcementStatusSelect"
    );

const announcementSortOrderInput =
    document.getElementById(
        "announcementSortOrderInput"
    );

const announcementContentInput =
    document.getElementById(
        "announcementContentInput"
    );

const announcementTitleCounter =
    document.getElementById(
        "announcementTitleCounter"
    );

const announcementContentCounter =
    document.getElementById(
        "announcementContentCounter"
    );

const announcementEditorModeLabel =
    document.getElementById(
        "announcementEditorModeLabel"
    );

const announcementEditorTitle =
    document.getElementById(
        "announcementEditorTitle"
    );

const announcementEditorStatusBadge =
    document.getElementById(
        "announcementEditorStatusBadge"
    );

const announcementPreviewIcon =
    document.getElementById(
        "announcementPreviewIcon"
    );

const announcementPreviewTitle =
    document.getElementById(
        "announcementPreviewTitle"
    );

const announcementPreviewContent =
    document.getElementById(
        "announcementPreviewContent"
    );

const announcementPanelFeedback =
    document.getElementById(
        "announcementPanelFeedback"
    );

const announcementResetBtn =
    document.getElementById(
        "announcementResetBtn"
    );

const announcementDeleteBtn =
    document.getElementById(
        "announcementDeleteBtn"
    );

const announcementSaveBtn =
    document.getElementById(
        "announcementSaveBtn"
    );

let announcementPanelItems = [];

let newsPanelArticles = [];
let newsPanelPermissions = {
    canManageAll: false,
    canFeature: false
};

let newsSelectedImageFile = null;
let newsTemporaryUploadedImageUrl = "";
let newsOriginalImageUrl = "";
let newsImageIsUploading = false;

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

function isLocalNewsUploadUrl(imageUrl) {

    return String(
        imageUrl || ""
    ).startsWith(
        "/uploads/news/"
    );
}

function validateSelectedNewsImage(file) {

    if (!file) {

        return {
            valid: false,
            message:
                "Görsel dosyası bulunamadı."
        };
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        return {
            valid: false,
            message:
                "Yalnızca JPG, PNG veya WebP görsel seçebilirsiniz."
        };
    }

    const maximumSize =
        5 * 1024 * 1024;

    if (
        file.size >
        maximumSize
    ) {

        return {
            valid: false,
            message:
                "Kapak görseli en fazla 5 MB olabilir."
        };
    }

    return {
        valid: true
    };
}

function setNewsImageFileName(
    value
) {

    if (!newsImageFileName) {
        return;
    }

    newsImageFileName.textContent =
        value ||
        "Görsel seçilmedi";
}

function revokeNewsLocalPreview() {

    const currentSource =
        String(
            newsImagePreview?.src || ""
        );

    if (
        currentSource.startsWith(
            "blob:"
        )
    ) {

        URL.revokeObjectURL(
            currentSource
        );
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

    if (
        newsSelectedImageFile
    ) {

        revokeNewsLocalPreview();

        newsImagePreview.src =
            URL.createObjectURL(
                newsSelectedImageFile
            );

        newsImagePreviewWrapper.style.display =
            "block";

        setNewsImageFileName(
            newsSelectedImageFile.name
        );

        return;
    }

    if (!imageUrl) {

        revokeNewsLocalPreview();

        newsImagePreviewWrapper.style.display =
            "none";

        newsImagePreview.src = "";

        setNewsImageFileName(
            "Görsel seçilmedi"
        );

        return;
    }

    newsImagePreview.src =
        imageUrl;

    newsImagePreviewWrapper.style.display =
        "block";

    const fileName =
        imageUrl.split("/").pop();

    setNewsImageFileName(
        fileName ||
        "Yüklü kapak görseli"
    );
}

function handleNewsImageSelection(
    event
) {

    const file =
        event.target.files?.[0];

    if (!file) {
        return;
    }

    const validation =
        validateSelectedNewsImage(
            file
        );

    if (!validation.valid) {

        showNewsPanelFeedback(
            validation.message
        );

        event.target.value = "";

        return;
    }

    newsSelectedImageFile =
        file;

    updateNewsImagePreview();

    showNewsPanelFeedback(
        "Görsel seçildi. Haber kaydedilirken yüklenecek.",
        "success"
    );
}

async function uploadSelectedNewsImage() {

    if (!newsSelectedImageFile) {

        return String(
            newsImageUrlInput?.value || ""
        ).trim();
    }

    const token =
        getNewsPanelToken();

    if (!token) {

        throw new Error(
            "Oturum bilgisi bulunamadı."
        );
    }

    const formData =
        new FormData();

    formData.append(
        "image",
        newsSelectedImageFile
    );

    newsImageIsUploading =
        true;

    if (newsImageSelectBtn) {

        newsImageSelectBtn.disabled =
            true;

        newsImageSelectBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Yükleniyor';
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news-panel/upload-image`,
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    body:
                        formData
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
                "Görsel yüklenemedi."
            );
        }

        newsTemporaryUploadedImageUrl =
            data.imageUrl;

        if (newsImageUrlInput) {

            newsImageUrlInput.value =
                data.imageUrl;
        }

        newsSelectedImageFile =
            null;

        if (newsImageFileInput) {

            newsImageFileInput.value =
                "";
        }

        updateNewsImagePreview();

        return data.imageUrl;

    } finally {

        newsImageIsUploading =
            false;

        if (newsImageSelectBtn) {

            newsImageSelectBtn.disabled =
                false;

            newsImageSelectBtn.innerHTML =
                '<i class="fa-solid fa-cloud-arrow-up"></i> Görsel Seç';
        }
    }
}

async function deleteUploadedNewsImage(
    imageUrl
) {

    const cleanImageUrl =
        String(
            imageUrl || ""
        ).trim();

    if (
        !isLocalNewsUploadUrl(
            cleanImageUrl
        )
    ) {
        return false;
    }

    const token =
        getNewsPanelToken();

    if (!token) {
        return false;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news-panel/upload-image`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            imageUrl:
                                cleanImageUrl
                        })
                }
            );

        return response.ok;

    } catch (err) {

        console.error(
            "Yüklenen görseli silme hatası:",
            err
        );

        return false;
    }
}

async function removeNewsImage() {

    if (
        newsImageIsUploading
    ) {
        return;
    }

    const currentImageUrl =
        String(
            newsImageUrlInput?.value || ""
        ).trim();

    if (
        newsSelectedImageFile
    ) {

        newsSelectedImageFile =
            null;

        if (newsImageFileInput) {

            newsImageFileInput.value =
                "";
        }

        updateNewsImagePreview();

        showNewsPanelFeedback(
            "Seçilen görsel kaldırıldı.",
            "success"
        );

        return;
    }

    if (
        newsTemporaryUploadedImageUrl &&
        currentImageUrl ===
        newsTemporaryUploadedImageUrl
    ) {

        await deleteUploadedNewsImage(
            currentImageUrl
        );

        newsTemporaryUploadedImageUrl =
            "";
    }

    if (newsImageUrlInput) {

        newsImageUrlInput.value =
            "";
    }

    updateNewsImagePreview();

    showNewsPanelFeedback(
        "Kapak görseli kaldırıldı.",
        "success"
    );
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

    newsSelectedImageFile =
    null;

newsTemporaryUploadedImageUrl =
    "";

newsOriginalImageUrl =
    "";

if (newsImageFileInput) {

    newsImageFileInput.value =
        "";
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

    newsSelectedImageFile =
    null;

newsTemporaryUploadedImageUrl =
    "";

newsOriginalImageUrl =
    article.imageUrl || "";

if (newsImageFileInput) {

    newsImageFileInput.value =
        "";
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

    newsContentTabBtn
    ?.classList
    .add("active");

announcementContentTabBtn
    ?.classList
    .remove("active");

newsManagementSection
    ?.classList
    .add("active");

announcementManagementSection
    ?.classList
    .remove("active");

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

    let payload =
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

    if (newsSelectedImageFile) {

        const uploadedImageUrl =
            await uploadSelectedNewsImage();

        payload = {
            ...payload,
            imageUrl:
                uploadedImageUrl
        };
    }

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

newsTemporaryUploadedImageUrl =
    "";

newsOriginalImageUrl =
    data.article?.imageUrl ||
    payload.imageUrl ||
    "";

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

    if (
        newsTemporaryUploadedImageUrl
    ) {

        await deleteUploadedNewsImage(
            newsTemporaryUploadedImageUrl
        );

        newsTemporaryUploadedImageUrl =
            "";

        if (newsImageUrlInput) {

            newsImageUrlInput.value =
                newsOriginalImageUrl || "";
        }

        updateNewsImagePreview();
    }

    showNewsPanelFeedback(
        err.message ||
        "Sunucuya bağlanılamadı."
    );

    } finally {

        if (newsSaveBtn) {
            newsSaveBtn.disabled = false;
        }
    }
}

let contentDeleteConfirmResolver = null;

function openContentDeleteConfirm({
    title,
    message
}) {

    return new Promise(resolve => {

        contentDeleteConfirmResolver =
            resolve;

        if (contentDeleteConfirmTitle) {
            contentDeleteConfirmTitle.textContent =
                title;
        }

        if (contentDeleteConfirmMessage) {
            contentDeleteConfirmMessage.textContent =
                message;
        }

        contentDeleteConfirmOverlay
            ?.classList
            .add("active");

    });
}

function closeContentDeleteConfirm(
    result = false
) {

    contentDeleteConfirmOverlay
        ?.classList
        .remove("active");

    if (contentDeleteConfirmResolver) {

        contentDeleteConfirmResolver(
            result
        );

        contentDeleteConfirmResolver =
            null;
    }
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
    await openContentDeleteConfirm({
        title:
            "Haberi Sil",

        message:
            "Bu haberi kalıcı olarak silmek istediğinize emin misiniz?"
    });

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

/* =========================================
   DUYURU YÖNETİMİ
========================================= */



function getAnnouncementStatusText(status) {

    const labels = {
        draft: "Taslak",
        published: "Yayında"
    };

    return labels[status] || "Bilinmiyor";
}

function showAnnouncementFeedback(
    message,
    type = "error"
) {

    if (!announcementPanelFeedback) {
        return;
    }

    announcementPanelFeedback.textContent =
        message || "";

    announcementPanelFeedback.className =
        `news-panel-feedback ${type}`;

    window.clearTimeout(
        showAnnouncementFeedback.timeout
    );

    if (!message) {
        return;
    }

    showAnnouncementFeedback.timeout =
        window.setTimeout(() => {

            announcementPanelFeedback.textContent =
                "";

            announcementPanelFeedback.className =
                "news-panel-feedback";

        }, 3500);
}

function updateAnnouncementCounters() {

    if (announcementTitleCounter) {

        announcementTitleCounter.textContent =
            `${
                announcementTitleInput
                    ?.value
                    .length || 0
            } / 120`;
    }

    if (announcementContentCounter) {

        announcementContentCounter.textContent =
            `${
                announcementContentInput
                    ?.value
                    .length || 0
            } / 1000`;
    }
}

function updateAnnouncementPreview() {

    const icon =
        String(
            announcementIconInput?.value ||
            "📢"
        ).trim() || "📢";

    const title =
        String(
            announcementTitleInput?.value ||
            ""
        ).trim();

    const content =
        String(
            announcementContentInput?.value ||
            ""
        ).trim();

    if (announcementPreviewIcon) {

        announcementPreviewIcon.textContent =
            icon;
    }

    if (announcementPreviewTitle) {

        announcementPreviewTitle.textContent =
            title || "Duyuru Başlığı";
    }

    if (announcementPreviewContent) {

        announcementPreviewContent.textContent =
            content ||
            "Duyuru içeriği burada görünecek.";
    }

    updateAnnouncementCounters();
}

function updateAnnouncementStatusBadge(
    status
) {

    if (!announcementEditorStatusBadge) {
        return;
    }

    const cleanStatus =
        status || "draft";

    announcementEditorStatusBadge.className =
        `news-editor-status ${cleanStatus}`;

    announcementEditorStatusBadge.textContent =
        getAnnouncementStatusText(
            cleanStatus
        );
}

function resetAnnouncementEditor() {

    if (announcementId) {
        announcementId.value = "";
    }

    if (announcementTitleInput) {
        announcementTitleInput.value = "";
    }

    if (announcementIconInput) {
        announcementIconInput.value = "📢";
    }

    if (announcementStatusSelect) {
        announcementStatusSelect.value =
            "draft";
    }

    if (announcementSortOrderInput) {
        announcementSortOrderInput.value =
            "0";
    }

    if (announcementContentInput) {
        announcementContentInput.value = "";
    }

    if (announcementEditorModeLabel) {

        announcementEditorModeLabel.textContent =
            "YENİ DUYURU";
    }

    if (announcementEditorTitle) {

        announcementEditorTitle.textContent =
            "Duyuru Oluştur";
    }

    if (announcementDeleteBtn) {

        announcementDeleteBtn.style.display =
            "none";
    }

    if (announcementSaveBtn) {

        announcementSaveBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Oluştur';
    }

    document
        .querySelectorAll(
            "#announcementPanelList .news-admin-article-item.active"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );
        });

    updateAnnouncementStatusBadge(
        "draft"
    );

    updateAnnouncementPreview();

    showAnnouncementFeedback("");
}

function fillAnnouncementEditor(
    announcement
) {

    if (!announcement) {
        resetAnnouncementEditor();
        return;
    }

    if (announcementId) {

        announcementId.value =
            String(
                announcement.id || ""
            );
    }

    if (announcementTitleInput) {

        announcementTitleInput.value =
            announcement.title || "";
    }

    if (announcementIconInput) {

        announcementIconInput.value =
            announcement.icon || "📢";
    }

    if (announcementStatusSelect) {

        announcementStatusSelect.value =
            announcement.status ||
            "draft";
    }

    if (announcementSortOrderInput) {

        announcementSortOrderInput.value =
            String(
                announcement.sortOrder ?? 0
            );
    }

    if (announcementContentInput) {

        announcementContentInput.value =
            announcement.content || "";
    }

    if (announcementEditorModeLabel) {

        announcementEditorModeLabel.textContent =
            "DUYURU DÜZENLE";
    }

    if (announcementEditorTitle) {

        announcementEditorTitle.textContent =
            announcement.title ||
            "Duyuru Düzenle";
    }

    if (announcementDeleteBtn) {

        announcementDeleteBtn.style.display =
            "inline-flex";
    }

    if (announcementSaveBtn) {

        announcementSaveBtn.innerHTML =
            '<i class="fa-solid fa-floppy-disk"></i> Değişiklikleri Kaydet';
    }

    updateAnnouncementStatusBadge(
        announcement.status
    );

    updateAnnouncementPreview();

    showAnnouncementFeedback("");
}

function createAnnouncementListItem(
    announcement
) {

    const item =
        document.createElement(
            "button"
        );

    item.type = "button";

    item.className =
        "news-admin-article-item";

    item.dataset.announcementId =
        String(announcement.id);

    const top =
        document.createElement("div");

    top.className =
        "news-admin-article-item-top";

    const title =
        document.createElement("strong");

    title.textContent =
        `${
            announcement.icon || "📢"
        } ${
            announcement.title ||
            "Başlıksız Duyuru"
        }`;

    const status =
        document.createElement("span");

    status.className =
        `news-admin-list-status ${
            announcement.status
        }`;

    status.textContent =
        getAnnouncementStatusText(
            announcement.status
        );

    top.appendChild(title);
    top.appendChild(status);

    const content =
        document.createElement("p");

    content.textContent =
        announcement.content ||
        "İçerik bulunmuyor.";

    const footer =
        document.createElement("div");

    footer.className =
        "news-admin-article-item-footer";

    const author =
        document.createElement("span");

    author.textContent =
        announcement.authorUsername
            ? `✍ ${announcement.authorUsername}`
            : "✍ Bilinmiyor";

    const sortOrder =
        document.createElement("span");

    sortOrder.textContent =
        `Sıra: ${
            announcement.sortOrder ?? 0
        }`;

    footer.appendChild(author);
    footer.appendChild(sortOrder);

    item.appendChild(top);
    item.appendChild(content);
    item.appendChild(footer);

    item.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    "#announcementPanelList .news-admin-article-item.active"
                )
                .forEach(activeItem => {

                    activeItem.classList.remove(
                        "active"
                    );
                });

            item.classList.add(
                "active"
            );

            fillAnnouncementEditor(
                announcement
            );
        }
    );

    return item;
}

function renderAnnouncementPanelItems() {

    if (!announcementPanelList) {
        return;
    }

    announcementPanelList.innerHTML = "";

    const selectedStatus =
        announcementStatusFilter?.value ||
        "all";

    const filteredItems =
        announcementPanelItems.filter(
            announcement => {

                if (
                    selectedStatus ===
                    "all"
                ) {
                    return true;
                }

                return (
                    announcement.status ===
                    selectedStatus
                );
            }
        );

    if (announcementPanelEmpty) {

        announcementPanelEmpty.style.display =
            filteredItems.length === 0
                ? "block"
                : "none";
    }

    filteredItems.forEach(
        announcement => {

            announcementPanelList.appendChild(
                createAnnouncementListItem(
                    announcement
                )
            );
        }
    );
}

async function loadAnnouncementPanelItems() {

    const token =
        getNewsPanelToken();

    if (!token) {
        return false;
    }

    if (announcementPanelLoading) {

        announcementPanelLoading.style.display =
            "block";
    }

    if (announcementPanelEmpty) {

        announcementPanelEmpty.style.display =
            "none";
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/announcement-panel/items`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    cache: "no-store"
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.success
        ) {

            showAnnouncementFeedback(
                data.message ||
                "Duyurular yüklenemedi."
            );

            return false;
        }

        announcementPanelItems =
            Array.isArray(
                data.announcements
            )
                ? data.announcements
                : [];

        renderAnnouncementPanelItems();

        return true;

    } catch (err) {

        console.error(
            "Duyuru paneli yükleme hatası:",
            err
        );

        showAnnouncementFeedback(
            "Sunucuya bağlanılamadı."
        );

        return false;

    } finally {

        if (announcementPanelLoading) {

            announcementPanelLoading.style.display =
                "none";
        }
    }
}

function getAnnouncementPayload() {

    return {
        title:
            String(
                announcementTitleInput
                    ?.value || ""
            ).trim(),

        content:
            String(
                announcementContentInput
                    ?.value || ""
            ).trim(),

        icon:
            String(
                announcementIconInput
                    ?.value || "📢"
            ).trim() || "📢",

        status:
            announcementStatusSelect?.value ||
            "draft",

        sortOrder:
            Number(
                announcementSortOrderInput
                    ?.value || 0
            )
    };
}

async function saveAnnouncement() {

    const token =
        getNewsPanelToken();

    if (!token) {

        showAnnouncementFeedback(
            "Oturum bilgisi bulunamadı."
        );

        return;
    }

    const payload =
        getAnnouncementPayload();

    const selectedAnnouncementId =
        Number(
            announcementId?.value || 0
        );

    const isEditing =
        Number.isInteger(
            selectedAnnouncementId
        ) &&
        selectedAnnouncementId > 0;

    if (announcementSaveBtn) {

        announcementSaveBtn.disabled =
            true;
    }

    try {

        const url =
            isEditing
                ? `${window.location.origin}/api/announcement-panel/items/${selectedAnnouncementId}`
                : `${window.location.origin}/api/announcement-panel/items`;

        const response =
            await fetch(
                url,
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

        if (
            !response.ok ||
            !data.success
        ) {

            showAnnouncementFeedback(
                data.message ||
                "Duyuru kaydedilemedi."
            );

            return;
        }

        showAnnouncementFeedback(
            data.message ||
            "Duyuru kaydedildi.",
            "success"
        );

        await loadAnnouncementPanelItems();

        const savedId =
            Number(
                data.announcement?.id ||
                selectedAnnouncementId
            );

        const savedAnnouncement =
            announcementPanelItems.find(
                announcement =>
                    Number(
                        announcement.id
                    ) === savedId
            );

        if (savedAnnouncement) {

            fillAnnouncementEditor(
                savedAnnouncement
            );
        }

        window.dispatchEvent(
            new CustomEvent(
                "announcements:updated"
            )
        );

    } catch (err) {

        console.error(
            "Duyuru kaydetme hatası:",
            err
        );

        showAnnouncementFeedback(
            "Sunucuya bağlanılamadı."
        );

    } finally {

        if (announcementSaveBtn) {

            announcementSaveBtn.disabled =
                false;
        }
    }
}

async function deleteSelectedAnnouncement() {

    const selectedAnnouncementId =
        Number(
            announcementId?.value || 0
        );

    if (
        !Number.isInteger(
            selectedAnnouncementId
        ) ||
        selectedAnnouncementId <= 0
    ) {

        showAnnouncementFeedback(
            "Silinecek duyuru seçilmedi."
        );

        return;
    }

    const confirmed =
    await openContentDeleteConfirm({
        title:
            "Duyuruyu Sil",

        message:
            "Bu duyuruyu kalıcı olarak silmek istediğinize emin misiniz?"
    });

if (!confirmed) {
    return;
}

    const token =
        getNewsPanelToken();

    if (!token) {

        showAnnouncementFeedback(
            "Oturum bilgisi bulunamadı."
        );

        return;
    }

    if (announcementDeleteBtn) {

        announcementDeleteBtn.disabled =
            true;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/announcement-panel/items/${selectedAnnouncementId}`,
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

        if (
            !response.ok ||
            !data.success
        ) {

            showAnnouncementFeedback(
                data.message ||
                "Duyuru silinemedi."
            );

            return;
        }

        resetAnnouncementEditor();

        await loadAnnouncementPanelItems();

        window.dispatchEvent(
            new CustomEvent(
                "announcements:updated"
            )
        );

        showAnnouncementFeedback(
            data.message ||
            "Duyuru silindi.",
            "success"
        );

    } catch (err) {

        console.error(
            "Duyuru silme hatası:",
            err
        );

        showAnnouncementFeedback(
            "Sunucuya bağlanılamadı."
        );

    } finally {

        if (announcementDeleteBtn) {

            announcementDeleteBtn.disabled =
                false;
        }
    }
}

async function switchContentPanel(
    panelName
) {

    const showAnnouncements =
        panelName === "announcements";

    newsContentTabBtn
        ?.classList
        .toggle(
            "active",
            !showAnnouncements
        );

    announcementContentTabBtn
        ?.classList
        .toggle(
            "active",
            showAnnouncements
        );

    newsManagementSection
        ?.classList
        .toggle(
            "active",
            !showAnnouncements
        );

    announcementManagementSection
        ?.classList
        .toggle(
            "active",
            showAnnouncements
        );

    if (showAnnouncements) {

        resetAnnouncementEditor();

        await loadAnnouncementPanelItems();

    } else {

        resetNewsEditor();

        await loadNewsPanelArticles();
    }
}

newsContentTabBtn?.addEventListener(
    "click",
    () => {

        switchContentPanel(
            "news"
        );
    }
);

announcementContentTabBtn
    ?.addEventListener(
        "click",
        () => {

            switchContentPanel(
                "announcements"
            );
        }
    );

announcementCreateNewBtn
    ?.addEventListener(
        "click",
        resetAnnouncementEditor
    );

announcementResetBtn
    ?.addEventListener(
        "click",
        resetAnnouncementEditor
    );

announcementSaveBtn
    ?.addEventListener(
        "click",
        saveAnnouncement
    );

announcementDeleteBtn
    ?.addEventListener(
        "click",
        deleteSelectedAnnouncement
    );

announcementStatusFilter
    ?.addEventListener(
        "change",
        renderAnnouncementPanelItems
    );

announcementStatusSelect
    ?.addEventListener(
        "change",
        () => {

            updateAnnouncementStatusBadge(
                announcementStatusSelect
                    .value
            );
        }
    );

announcementTitleInput
    ?.addEventListener(
        "input",
        updateAnnouncementPreview
    );

announcementIconInput
    ?.addEventListener(
        "input",
        updateAnnouncementPreview
    );

announcementContentInput
    ?.addEventListener(
        "input",
        updateAnnouncementPreview
    );

announcementSortOrderInput
    ?.addEventListener(
        "input",
        () => {

            const value =
                Number(
                    announcementSortOrderInput
                        .value
                );

            if (value < 0) {

                announcementSortOrderInput.value =
                    "0";
            }

            if (value > 999) {

                announcementSortOrderInput.value =
                    "999";
            }
        }
    );

document.addEventListener(
    "DOMContentLoaded",
    () => {

        resetAnnouncementEditor();
    }
);

contentDeleteConfirmCancel
    ?.addEventListener(
        "click",
        () => {

            closeContentDeleteConfirm(
                false
            );
        }
    );

contentDeleteConfirmApprove
    ?.addEventListener(
        "click",
        () => {

            closeContentDeleteConfirm(
                true
            );
        }
    );

contentDeleteConfirmOverlay
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                contentDeleteConfirmOverlay
            ) {

                closeContentDeleteConfirm(
                    false
                );
            }
        }
    );

    newsImageSelectBtn
    ?.addEventListener(
        "click",
        () => {

            newsImageFileInput?.click();
        }
    );

newsImageChangeBtn
    ?.addEventListener(
        "click",
        () => {

            newsImageFileInput?.click();
        }
    );

newsImageFileInput
    ?.addEventListener(
        "change",
        handleNewsImageSelection
    );

newsImageRemoveBtn
    ?.addEventListener(
        "click",
        removeNewsImage
    );