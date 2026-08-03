const publicNewsContainer =
    document.getElementById("haberContainer");

const publicFeaturedNews =
    document.getElementById("featuredNews");

const publicAllNewsLink =
    document.querySelector(".all-news");

let publicNewsArticles = [];

function getPublicNewsCategoryText(category) {

    const categories = {
        general: "Genel",
        announcement: "Duyuru",
        event: "Etkinlik",
        interview: "Röportaj",
        update: "Güncelleme"
    };

    return categories[category] || "Genel";
}

function formatPublicNewsDate(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "tr-TR",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}

function getPublicNewsImage(article) {

    const imageUrl =
        String(
            article?.imageUrl || ""
        ).trim();

    return imageUrl ||
        "assets/logo.png";
}

function clearPublicNewsAreas() {

    if (publicNewsContainer) {
        publicNewsContainer.innerHTML = "";
    }

    if (publicFeaturedNews) {
        publicFeaturedNews.innerHTML = "";
    }
}

function createPublicNewsCard(article) {

    const card =
        document.createElement("article");

    card.className =
        "news-card public-news-card";

    card.dataset.articleId =
        String(article.id);

    const imageArea =
        document.createElement("div");

    imageArea.className =
        "news-card-image public-news-card-image";

    const image =
        document.createElement("img");

    image.src =
        getPublicNewsImage(article);

    image.alt =
        article.title || "Haber";

    image.loading =
        "lazy";

    image.addEventListener(
        "error",
        () => {

            image.src =
                "assets/logo.png";

        },
        {
            once: true
        }
    );

    imageArea.appendChild(image);

    const body =
        document.createElement("div");

    body.className =
        "news-card-content public-news-card-content";

    const meta =
        document.createElement("div");

    meta.className =
        "public-news-meta";

    const category =
        document.createElement("span");

    category.className =
        "public-news-category";

    category.textContent =
        getPublicNewsCategoryText(
            article.category
        );

    const date =
        document.createElement("span");

    date.className =
        "public-news-date";

    date.textContent =
        formatPublicNewsDate(
            article.publishedAt ||
            article.createdAt
        );

    meta.appendChild(category);
    meta.appendChild(date);

    const title =
        document.createElement("h3");

    title.textContent =
        article.title ||
        "Başlıksız Haber";

    const summary =
        document.createElement("p");

    summary.textContent =
        article.summary || "";

    const footer =
        document.createElement("div");

    footer.className =
        "public-news-footer";

    const author =
        document.createElement("span");

    author.className =
        "public-news-author";

    author.textContent =
        article.authorUsername
            ? `✍ ${article.authorUsername}`
            : "✍ CSI Haber Merkezi";

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "public-news-read-btn";

    button.innerHTML =
        'Haberi Oku <i class="fa-solid fa-arrow-right"></i>';

    button.addEventListener(
        "click",
        () => {

            openPublicNewsDetail(
                article
            );

        }
    );

    footer.appendChild(author);
    footer.appendChild(button);

    body.appendChild(meta);
    body.appendChild(title);
    body.appendChild(summary);
    body.appendChild(footer);

    card.appendChild(imageArea);
    card.appendChild(body);

    return card;
}

function createFeaturedNewsCard(article) {

    const card =
        document.createElement("article");

    card.className =
        "public-featured-news";

    const imageArea =
        document.createElement("div");

    imageArea.className =
        "public-featured-news-image";

    const image =
        document.createElement("img");

    image.src =
        getPublicNewsImage(article);

    image.alt =
        article.title || "Öne çıkan haber";

    image.addEventListener(
        "error",
        () => {

            image.src =
                "assets/logo.png";

        },
        {
            once: true
        }
    );

    imageArea.appendChild(image);

    const content =
        document.createElement("div");

    content.className =
        "public-featured-news-content";

    const badge =
        document.createElement("span");

    badge.className =
        "public-featured-news-badge";

    badge.textContent =
        "★ Öne Çıkan Haber";

    const title =
        document.createElement("h3");

    title.textContent =
        article.title;

    const summary =
        document.createElement("p");

    summary.textContent =
        article.summary;

    const info =
        document.createElement("div");

    info.className =
        "public-featured-news-info";

    info.textContent =
        `${article.authorUsername || "CSI Haber Merkezi"} • ${
            formatPublicNewsDate(
                article.publishedAt ||
                article.createdAt
            )
        }`;

    const button =
        document.createElement("button");

    button.type =
        "button";

    button.className =
        "public-news-read-btn";

    button.innerHTML =
        'Haberi Oku <i class="fa-solid fa-arrow-right"></i>';

    button.addEventListener(
        "click",
        () => {

            openPublicNewsDetail(
                article
            );

        }
    );

    content.appendChild(badge);
    content.appendChild(title);
    content.appendChild(summary);
    content.appendChild(info);
    content.appendChild(button);

    card.appendChild(imageArea);
    card.appendChild(content);

    return card;
}

function createPublicNewsEmptyCard() {

    const empty =
        document.createElement("div");

    empty.className =
        "public-news-empty";

    empty.innerHTML = `
        <i class="fa-regular fa-newspaper"></i>
        <h3>Henüz yayınlanmış haber bulunmuyor</h3>
        <p>Yeni haberler yayınlandığında burada görünecek.</p>
    `;

    return empty;
}

function renderPublicNews() {

    clearPublicNewsAreas();

    const featuredArticle =
        publicNewsArticles.find(
            article =>
                article.isFeatured
        );

    if (
        featuredArticle &&
        publicFeaturedNews
    ) {

        publicFeaturedNews.appendChild(
            createFeaturedNewsCard(
                featuredArticle
            )
        );

    }

    const normalArticles =
        publicNewsArticles.filter(
            article =>
                !featuredArticle ||
                Number(article.id) !==
                Number(featuredArticle.id)
        );

    if (
        normalArticles.length === 0 &&
        !featuredArticle
    ) {

        publicNewsContainer?.appendChild(
            createPublicNewsEmptyCard()
        );

        return;
    }

    normalArticles
        .slice(0, 6)
        .forEach(article => {

            publicNewsContainer?.appendChild(
                createPublicNewsCard(article)
            );

        });
}

async function loadPublicNews() {

    if (!publicNewsContainer) {
        return;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news?limit=20`,
                {
                    cache: "no-store"
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
                "Haberler yüklenemedi."
            );

        }

        publicNewsArticles =
            Array.isArray(data.articles)
                ? data.articles
                : [];

        renderPublicNews();

    } catch (err) {

        console.error(
            "Ana sayfa haber yükleme hatası:",
            err
        );

        clearPublicNewsAreas();

        const error =
            document.createElement("div");

        error.className =
            "public-news-empty";

        error.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
            <h3>Haberler yüklenemedi</h3>
            <p>Daha sonra tekrar deneyin.</p>
        `;

        publicNewsContainer.appendChild(
            error
        );
    }
}

function getPublicNewsToken() {

    return localStorage.getItem(
        "token"
    ) || "";
}

function escapePublicNewsHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatPublicNewsCommentDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleString(
        "tr-TR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function getPublicNewsUserRoles(user) {

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

function canDeletePublicNewsComment(
    comment,
    currentUser
) {

    if (
        !comment ||
        !currentUser
    ) {
        return false;
    }

    const isOwner =
        Number(comment.userId) ===
        Number(currentUser.id);

    const roles =
        getPublicNewsUserRoles(
            currentUser
        );

    const isModerator =
        roles.some(
            role =>
                [
                    "admin",
                    "founder",
                    "moderator"
                ].includes(role)
        );

    return isOwner || isModerator;
}

function renderPublicNewsComments(
    comments,
    currentUser,
    commentsList,
    articleId
) {

    commentsList.innerHTML =
        "";

    const safeComments =
        Array.isArray(comments)
            ? comments
            : [];

    if (safeComments.length === 0) {

        commentsList.innerHTML = `
            <div class="public-news-comments-empty">
                Henüz yorum yapılmamış.
            </div>
        `;

        return;
    }

    safeComments.forEach(comment => {

        const commentCard =
            document.createElement("div");

        commentCard.className =
            "public-news-comment";

        const canDelete =
            canDeletePublicNewsComment(
                comment,
                currentUser
            );

        commentCard.innerHTML = `
            <div class="public-news-comment-header">

                <strong>
                    ${escapePublicNewsHtml(
                        comment.username ||
                        "Kullanıcı"
                    )}
                </strong>

                <span>
                    ${escapePublicNewsHtml(
                        formatPublicNewsCommentDate(
                            comment.createdAt
                        )
                    )}
                </span>

            </div>

            <div class="public-news-comment-text">
                ${escapePublicNewsHtml(
                    comment.comment || ""
                )}
            </div>

            ${
                canDelete
                    ? `
                        <button
                            type="button"
                            class="public-news-comment-delete">

                            Yorumu Sil

                        </button>
                    `
                    : ""
            }
        `;

        const deleteButton =
            commentCard.querySelector(
                ".public-news-comment-delete"
            );

        deleteButton?.addEventListener(
            "click",
            async () => {

                const confirmed =
                    window.confirm(
                        "Bu yorumu silmek istediğinize emin misiniz?"
                    );

                if (!confirmed) {
                    return;
                }

                const token =
                    getPublicNewsToken();

                if (!token) {
                    return;
                }

                deleteButton.disabled =
                    true;

                deleteButton.textContent =
                    "Siliniyor...";

                try {

                    const response =
                        await fetch(
                            `${window.location.origin}/api/news/comments/${comment.id}`,
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

                        throw new Error(
                            data.message ||
                            "Yorum silinemedi."
                        );
                    }

                    commentCard.remove();

                    if (
                        !commentsList.children.length
                    ) {

                        commentsList.innerHTML = `
                            <div class="public-news-comments-empty">
                                Henüz yorum yapılmamış.
                            </div>
                        `;
                    }

                } catch (err) {

                    console.error(
                        "Yorum silme hatası:",
                        err
                    );

                    deleteButton.disabled =
                        false;

                    deleteButton.textContent =
                        "Yorumu Sil";
                }
            }
        );

        commentsList.appendChild(
            commentCard
        );
    });
}

async function loadPublicNewsInteractions(
    article,
    socialSection
) {

    if (
        !article?.id ||
        !socialSection
    ) {
        return;
    }

    const articleId =
        Number(article.id);

    const token =
        getPublicNewsToken();

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/news/${articleId}/interactions`,
                {
                    method: "GET",

                    headers: token
                        ? {
                            Authorization:
                                `Bearer ${token}`
                        }
                        : {},

                    cache: "no-store"
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
                "Haber etkileşimleri yüklenemedi."
            );
        }

        const interaction =
            data.interaction || {};

        const currentUser =
            data.currentUser || null;

        const reactions =
            Array.isArray(
                interaction.reactions
            )
                ? interaction.reactions
                : [];

        const comments =
            Array.isArray(data.comments)
                ? data.comments
                : [];

        const allowedEmojis = [
            "😀",
            "😍",
            "😂",
            "😮",
            "😢",
            "😡",
            "❤️",
            "🔥",
            "👏"
        ];

        const reactionCountMap =
            new Map();

        reactions.forEach(reaction => {

            reactionCountMap.set(
                reaction.emoji,
                Number(reaction.count) || 0
            );
        });

        socialSection.innerHTML = `
            <div class="public-news-social-top">

                <button
                    type="button"
                    class="
                        public-news-like-btn
                        ${
                            interaction.userLiked
                                ? "active"
                                : ""
                        }
                    ">

                    <i class="fa-solid fa-thumbs-up"></i>

                    <span>
                        Beğen
                    </span>

                    <strong
                        class="public-news-like-count">

                        ${
                            Number(
                                interaction.likeCount
                            ) || 0
                        }

                    </strong>

                </button>

                <div class="public-news-comment-total">

                    <i class="fa-regular fa-comment"></i>

                    <span>
                        ${
                            Number(
                                interaction.commentCount
                            ) || 0
                        } yorum
                    </span>

                </div>

            </div>

            <div class="public-news-reaction-area">

                <span class="public-news-reaction-title">
                    Tepkini seç
                </span>

                <div class="public-news-reaction-buttons">

                    ${allowedEmojis
                        .map(emoji => {

                            const count =
                                reactionCountMap.get(
                                    emoji
                                ) || 0;

                            const active =
                                interaction.userReaction ===
                                emoji;

                            return `
                                <button
                                    type="button"
                                    class="
                                        public-news-reaction-btn
                                        ${
                                            active
                                                ? "active"
                                                : ""
                                        }
                                    "
                                    data-emoji="${emoji}">

                                    <span>
                                        ${emoji}
                                    </span>

                                    <strong>
                                        ${count}
                                    </strong>

                                </button>
                            `;
                        })
                        .join("")}

                </div>

            </div>

            <div class="public-news-comments-section">

                <div class="public-news-comments-header">

                    <div>

                        <span>
                            YORUMLAR
                        </span>

                        <h3>
                            Topluluk görüşleri
                        </h3>

                    </div>

                    <strong
                        class="public-news-comment-count">

                        ${
                            Number(
                                interaction.commentCount
                            ) || 0
                        }

                    </strong>

                </div>

                <div
                    class="public-news-comments-list">

                </div>

                ${
                    currentUser
                        ? `
                            <div class="public-news-comment-form">

                                <textarea
                                    class="public-news-comment-input"
                                    maxlength="500"
                                    rows="3"
                                    placeholder="Yorumunuzu yazın..."></textarea>

                                <div class="public-news-comment-form-footer">

                                    <span
                                        class="public-news-comment-counter">

                                        0 / 500

                                    </span>

                                    <button
                                        type="button"
                                        class="public-news-comment-send">

                                        <i class="fa-solid fa-paper-plane"></i>

                                        Yorumu Gönder

                                    </button>

                                </div>

                            </div>
                        `
                        : `
                            <div class="public-news-login-warning">

                                <i class="fa-solid fa-lock"></i>

                                <span>
                                    Beğeni, emoji ve yorum için giriş yapmalısınız.
                                </span>

                            </div>
                        `
                }

            </div>
        `;

        const commentsList =
            socialSection.querySelector(
                ".public-news-comments-list"
            );

        renderPublicNewsComments(
            comments,
            currentUser,
            commentsList,
            articleId
        );

        const likeButton =
            socialSection.querySelector(
                ".public-news-like-btn"
            );

        const likeCount =
            socialSection.querySelector(
                ".public-news-like-count"
            );

        likeButton?.addEventListener(
            "click",
            async () => {

                if (!currentUser) {

                    showToast?.(
                        "Beğenmek için giriş yapmalısınız.",
                        "warning"
                    );

                    return;
                }

                likeButton.disabled =
                    true;

                try {

                    const likeResponse =
                        await fetch(
                            `${window.location.origin}/api/news/${articleId}/like`,
                            {
                                method: "POST",

                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const likeData =
                        await likeResponse.json();

                    if (
                        !likeResponse.ok ||
                        !likeData.success
                    ) {

                        throw new Error(
                            likeData.message ||
                            "Beğeni işlemi başarısız."
                        );
                    }

                    likeButton.classList.toggle(
                        "active",
                        Boolean(likeData.liked)
                    );

                    if (likeCount) {

                        likeCount.textContent =
                            String(
                                Number(
                                    likeData.likeCount
                                ) || 0
                            );
                    }

                } catch (err) {

                    console.error(
                        "Haber beğeni hatası:",
                        err
                    );

                    showToast?.(
                        err.message ||
                        "Beğeni işlemi yapılamadı.",
                        "error"
                    );

                } finally {

                    likeButton.disabled =
                        false;
                }
            }
        );

        const reactionButtons =
            socialSection.querySelectorAll(
                ".public-news-reaction-btn"
            );

        reactionButtons.forEach(
            reactionButton => {

                reactionButton.addEventListener(
                    "click",
                    async () => {

                        if (!currentUser) {

                            showToast?.(
                                "Emoji bırakmak için giriş yapmalısınız.",
                                "warning"
                            );

                            return;
                        }

                        const selectedEmoji =
                            reactionButton.dataset
                                .emoji || "";

                        const currentActive =
                            reactionButton.classList
                                .contains("active");

                        const emojiToSend =
                            currentActive
                                ? ""
                                : selectedEmoji;

                        reactionButtons.forEach(
                            button => {

                                button.disabled =
                                    true;
                            }
                        );

                        try {

                            const reactionResponse =
                                await fetch(
                                    `${window.location.origin}/api/news/${articleId}/reaction`,
                                    {
                                        method: "PUT",

                                        headers: {
                                            "Content-Type":
                                                "application/json",

                                            Authorization:
                                                `Bearer ${token}`
                                        },

                                        body:
                                            JSON.stringify({
                                                emoji:
                                                    emojiToSend
                                            })
                                    }
                                );

                            const reactionData =
                                await reactionResponse
                                    .json();

                            if (
                                !reactionResponse.ok ||
                                !reactionData.success
                            ) {

                                throw new Error(
                                    reactionData.message ||
                                    "Emoji işlemi başarısız."
                                );
                            }

                            const updatedCountMap =
                                new Map();

                            (
                                reactionData.reactions ||
                                []
                            ).forEach(item => {

                                updatedCountMap.set(
                                    item.emoji,
                                    Number(item.count) ||
                                    0
                                );
                            });

                            reactionButtons.forEach(
                                button => {

                                    const buttonEmoji =
                                        button.dataset
                                            .emoji;

                                    button.classList.toggle(
                                        "active",
                                        reactionData
                                            .userReaction ===
                                            buttonEmoji
                                    );

                                    const countElement =
                                        button.querySelector(
                                            "strong"
                                        );

                                    if (countElement) {

                                        countElement
                                            .textContent =
                                            String(
                                                updatedCountMap
                                                    .get(
                                                        buttonEmoji
                                                    ) || 0
                                            );
                                    }
                                }
                            );

                        } catch (err) {

                            console.error(
                                "Haber emoji hatası:",
                                err
                            );

                            showToast?.(
                                err.message ||
                                "Emoji işlemi yapılamadı.",
                                "error"
                            );

                        } finally {

                            reactionButtons.forEach(
                                button => {

                                    button.disabled =
                                        false;
                                }
                            );
                        }
                    }
                );
            }
        );

        const commentInput =
            socialSection.querySelector(
                ".public-news-comment-input"
            );

        const commentCounter =
            socialSection.querySelector(
                ".public-news-comment-counter"
            );

        const commentSendButton =
            socialSection.querySelector(
                ".public-news-comment-send"
            );

        commentInput?.addEventListener(
            "input",
            () => {

                if (commentCounter) {

                    commentCounter.textContent =
                        `${commentInput.value.length} / 500`;
                }
            }
        );

        commentSendButton?.addEventListener(
            "click",
            async () => {

                const comment =
                    commentInput?.value
                        .trim() || "";

                if (!comment) {

                    showToast?.(
                        "Yorum alanı boş bırakılamaz.",
                        "warning"
                    );

                    return;
                }

                if (comment.length > 500) {

                    showToast?.(
                        "Yorum en fazla 500 karakter olabilir.",
                        "warning"
                    );

                    return;
                }

                commentSendButton.disabled =
                    true;

                commentInput.disabled =
                    true;

                commentSendButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Gönderiliyor...
                `;

                try {

                    const commentResponse =
                        await fetch(
                            `${window.location.origin}/api/news/${articleId}/comments`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${token}`
                                },

                                body:
                                    JSON.stringify({
                                        comment
                                    })
                            }
                        );

                    const commentData =
                        await commentResponse
                            .json();

                    if (
                        !commentResponse.ok ||
                        !commentData.success
                    ) {

                        throw new Error(
                            commentData.message ||
                            "Yorum gönderilemedi."
                        );
                    }

                    commentInput.value =
                        "";

                    if (commentCounter) {

                        commentCounter.textContent =
                            "0 / 500";
                    }

                    const updatedComments =
                        Array.isArray(
                            commentData.comments
                        )
                            ? commentData.comments
                            : [];

                    renderPublicNewsComments(
                        updatedComments,
                        currentUser,
                        commentsList,
                        articleId
                    );

                    const commentTotal =
                        updatedComments.length;

                    const commentTotalText =
                        socialSection.querySelector(
                            ".public-news-comment-total span"
                        );

                    const commentCountBadge =
                        socialSection.querySelector(
                            ".public-news-comment-count"
                        );

                    if (commentTotalText) {

                        commentTotalText.textContent =
                            `${commentTotal} yorum`;
                    }

                    if (commentCountBadge) {

                        commentCountBadge.textContent =
                            String(commentTotal);
                    }

                    showToast?.(
                        "Yorumunuz yayınlandı.",
                        "success"
                    );

                } catch (err) {

                    console.error(
                        "Haber yorumu gönderme hatası:",
                        err
                    );

                    showToast?.(
                        err.message ||
                        "Yorum gönderilemedi.",
                        "error"
                    );

                } finally {

                    commentSendButton.disabled =
                        false;

                    commentInput.disabled =
                        false;

                    commentSendButton.innerHTML = `
                        <i class="fa-solid fa-paper-plane"></i>
                        Yorumu Gönder
                    `;
                }
            }
        );

    } catch (err) {

        console.error(
            "Haber sosyal alan yükleme hatası:",
            err
        );

        socialSection.innerHTML = `
            <div class="public-news-interaction-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <span>
                    ${
                        escapePublicNewsHtml(
                            err.message ||
                            "Etkileşimler yüklenemedi."
                        )
                    }
                </span>

                <button
                    type="button"
                    class="public-news-interaction-retry">

                    Tekrar Dene

                </button>

            </div>
        `;

        const retryButton =
            socialSection.querySelector(
                ".public-news-interaction-retry"
            );

        retryButton?.addEventListener(
            "click",
            () => {

                socialSection.innerHTML = `
                    <div class="public-news-interaction-loading">
                        Haber etkileşimleri yükleniyor...
                    </div>
                `;

                loadPublicNewsInteractions(
                    article,
                    socialSection
                );
            }
        );
    }
}

function openPublicNewsDetail(article) {

    if (!article) {
        return;
    }

    const existingOverlay =
        document.getElementById(
            "publicNewsDetailOverlay"
        );

    if (existingOverlay) {
        existingOverlay.remove();
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "publicNewsDetailOverlay";

    overlay.className =
        "public-news-detail-overlay";

    const popup =
        document.createElement("article");

    popup.className =
        "public-news-detail-popup";

    const closeButton =
        document.createElement("button");

    closeButton.type =
        "button";

    closeButton.className =
        "public-news-detail-close";

    closeButton.innerHTML =
        '<i class="fa-solid fa-xmark"></i>';

    const cover =
        document.createElement("div");

    cover.className =
        "public-news-detail-cover";

    const image =
        document.createElement("img");

    image.src =
        getPublicNewsImage(article);

    image.alt =
        article.title || "Haber";

    image.addEventListener(
        "error",
        () => {

            image.src =
                "assets/logo.png";

        },
        {
            once: true
        }
    );

    cover.appendChild(image);

    const body =
        document.createElement("div");

    body.className =
        "public-news-detail-body";

    const category =
        document.createElement("span");

    category.className =
        "public-news-detail-category";

    category.textContent =
        getPublicNewsCategoryText(
            article.category
        );

    const title =
        document.createElement("h2");

    title.textContent =
        article.title || "";

    const info =
        document.createElement("div");

    info.className =
        "public-news-detail-info";

    info.textContent =
        `${article.authorUsername || "CSI Haber Merkezi"} • ${
            formatPublicNewsDate(
                article.publishedAt ||
                article.createdAt
            )
        }`;

    const summary =
        document.createElement("p");

    summary.className =
        "public-news-detail-summary";

    summary.textContent =
        article.summary || "";

    const content =
        document.createElement("div");

    content.className =
        "public-news-detail-content";

    content.textContent =
        article.content || "";

    body.appendChild(category);
    body.appendChild(title);
    body.appendChild(info);
    body.appendChild(summary);
    body.appendChild(content);

    const socialSection =
    document.createElement("section");

socialSection.className =
    "public-news-social-section";

socialSection.innerHTML = `
    <div class="public-news-interaction-loading">
        Haber etkileşimleri yükleniyor...
    </div>
`;

body.appendChild(socialSection);

    popup.appendChild(closeButton);
    popup.appendChild(cover);
    popup.appendChild(body);

    overlay.appendChild(popup);

    function closeDetail() {

        document.body.style.overflow = "";
        overlay.remove();

    }

    closeButton.addEventListener(
        "click",
        closeDetail
    );

    overlay.addEventListener(
        "click",
        event => {

            if (event.target === overlay) {
                closeDetail();
            }

        }
    );

    document.body.appendChild(
        overlay
    );

    document.body.style.overflow =
        "hidden";

        loadPublicNewsInteractions(
    article,
    socialSection
);
}

publicAllNewsLink?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        document
            .getElementById("duyurular")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);

document.addEventListener(
    "DOMContentLoaded",
    loadPublicNews
);

window.addEventListener(
    "news:updated",
    loadPublicNews
);