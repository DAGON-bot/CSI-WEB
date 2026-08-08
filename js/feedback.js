"use strict";

const feedbackOverlay =
    document.getElementById(
        "feedbackOverlay"
    );

const feedbackOpenBtn =
    document.getElementById(
        "feedbackOpenBtn"
    );

const feedbackClose =
    document.getElementById(
        "feedbackClose"
    );

const feedbackTitle =
    document.getElementById(
        "feedbackTitle"
    );

const feedbackMessage =
    document.getElementById(
        "feedbackMessage"
    );

const feedbackSubmit =
    document.getElementById(
        "feedbackSubmit"
    );

const feedbackStatus =
    document.getElementById(
        "feedbackStatus"
    );

const feedbackCategoryButtons =
    Array.from(
        document.querySelectorAll(
            "[data-feedback-category]"
        )
    );

let selectedFeedbackCategory =
    "";

function openFeedbackPopup() {

    if (!feedbackOverlay) {
        return;
    }

    feedbackOverlay.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";
}

function closeFeedbackPopup() {

    feedbackOverlay?.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";
}

function resetFeedbackForm() {

    selectedFeedbackCategory =
        "";

    feedbackCategoryButtons.forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );

    if (feedbackTitle) {
        feedbackTitle.value = "";
    }

    if (feedbackMessage) {
        feedbackMessage.value = "";
    }

    if (feedbackStatus) {
        feedbackStatus.textContent = "";
    }
}

feedbackCategoryButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                selectedFeedbackCategory =
                    String(
                        button.dataset
                            .feedbackCategory ||
                        ""
                    );

                feedbackCategoryButtons.forEach(
                    item =>
                        item.classList.toggle(
                            "active",
                            item === button
                        )
                );
            }
        );
    }
);

feedbackOpenBtn?.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "profileDropdown"
            )
            ?.classList.remove(
                "active"
            );

        openFeedbackPopup();
    }
);

feedbackClose?.addEventListener(
    "click",
    closeFeedbackPopup
);

feedbackOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            feedbackOverlay
        ) {
            closeFeedbackPopup();
        }
    }
);

feedbackSubmit?.addEventListener(
    "click",
    async () => {

        const token =
            String(
                localStorage.getItem(
                    "token"
                ) || ""
            ).trim();

        if (!token) {

            showDialog(
                "Oturum Gerekli",
                "Geri bildirim göndermek için giriş yapmalısınız.",
                "warning"
            );

            return;
        }

        const title =
            String(
                feedbackTitle?.value ||
                ""
            ).trim();

        const message =
            String(
                feedbackMessage?.value ||
                ""
            ).trim();

        if (!selectedFeedbackCategory) {

            showDialog(
                "Kategori Seçin",
                "Lütfen bir geri bildirim kategorisi seçin.",
                "warning"
            );

            return;
        }

        if (title.length < 3) {

            showDialog(
                "Başlık Eksik",
                "Lütfen kısa bir başlık yazın.",
                "warning"
            );

            return;
        }

        if (message.length < 10) {

            showDialog(
                "Açıklama Eksik",
                "Lütfen geri bildiriminizi biraz daha detaylı açıklayın.",
                "warning"
            );

            return;
        }

        feedbackSubmit.disabled =
            true;

        if (feedbackStatus) {
            feedbackStatus.textContent =
                "Gönderiliyor...";
        }

        try {

            const response =
                await fetch(
                    `${window.location.origin}/api/feedback`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body:
                            JSON.stringify({
                                category:
                                    selectedFeedbackCategory,
                                title,
                                message
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
                    "Geri bildirim gönderilemedi."
                );
            }

            if (feedbackStatus) {
                feedbackStatus.textContent =
                    `Geri bildiriminiz #${data.feedback?.id || ""} olarak gönderildi.`;
            }

            showDialog(
                "Geri Bildirim Gönderildi",
                "Geri bildiriminiz Admin ve Moderatör ekibine iletildi.",
                "success"
            );

            setTimeout(
                () => {
                    closeFeedbackPopup();
                    resetFeedbackForm();
                },
                700
            );

        } catch (err) {

            if (feedbackStatus) {
                feedbackStatus.textContent =
                    err.message ||
                    "Geri bildirim gönderilemedi.";
            }

            showDialog(
                "Gönderim Hatası",
                err.message ||
                "Geri bildirim gönderilemedi.",
                "error"
            );

        } finally {

            feedbackSubmit.disabled =
                false;
        }
    }
);

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            feedbackOverlay
                ?.classList.contains(
                    "active"
                )
        ) {
            closeFeedbackPopup();
        }
    }
);
