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