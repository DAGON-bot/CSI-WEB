const publicAnnouncementContainer =
    document.getElementById(
        "duyuruContainer"
    );

let publicAnnouncements = [];

function formatAnnouncementDate(value) {

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(
        "tr-TR",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function createPublicAnnouncementItem(
    announcement
) {

    const item =
        document.createElement("article");

    item.className =
        "public-announcement-item";

    const icon =
        document.createElement("div");

    icon.className =
        "public-announcement-icon";

    icon.textContent =
        announcement.icon || "📢";

    const content =
        document.createElement("div");

    content.className =
        "public-announcement-content";

    const title =
        document.createElement("strong");

    title.textContent =
        announcement.title ||
        "Duyuru";

    const text =
        document.createElement("p");

    text.textContent =
        announcement.content || "";

    const footer =
        document.createElement("div");

    footer.className =
        "public-announcement-footer";

    const author =
        document.createElement("span");

    author.textContent =
        announcement.authorUsername
            ? `✍ ${announcement.authorUsername}`
            : "✍ CSI Yönetimi";

    const date =
        document.createElement("span");

    date.textContent =
        formatAnnouncementDate(
            announcement.updatedAt ||
            announcement.createdAt
        );

    footer.appendChild(author);
    footer.appendChild(date);

    content.appendChild(title);
    content.appendChild(text);
    content.appendChild(footer);

    item.appendChild(icon);
    item.appendChild(content);

    return item;
}

function renderPublicAnnouncements() {

    if (!publicAnnouncementContainer) {
        return;
    }

    publicAnnouncementContainer.innerHTML =
        "";

    if (
        !Array.isArray(
            publicAnnouncements
        ) ||
        publicAnnouncements.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.className =
            "public-announcement-empty";

        empty.textContent =
            "Henüz yayınlanmış duyuru bulunmuyor.";

        publicAnnouncementContainer.appendChild(
            empty
        );

        return;
    }

    publicAnnouncements.forEach(
        announcement => {

            publicAnnouncementContainer.appendChild(
                createPublicAnnouncementItem(
                    announcement
                )
            );
        }
    );
}

async function loadPublicAnnouncements() {

    if (!publicAnnouncementContainer) {
        return;
    }

    try {

        const response =
            await fetch(
                `${window.location.origin}/api/announcements`,
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
                "Duyurular yüklenemedi."
            );
        }

        publicAnnouncements =
            Array.isArray(
                data.announcements
            )
                ? data.announcements
                : [];

        renderPublicAnnouncements();

    } catch (err) {

        console.error(
            "Ana sayfa duyuru yükleme hatası:",
            err
        );

        publicAnnouncementContainer.innerHTML =
            "";

        const error =
            document.createElement("div");

        error.className =
            "public-announcement-empty";

        error.textContent =
            "Duyurular yüklenemedi.";

        publicAnnouncementContainer.appendChild(
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    loadPublicAnnouncements
);

window.addEventListener(
    "announcements:updated",
    loadPublicAnnouncements
);