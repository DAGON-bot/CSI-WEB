(() => {

    "use strict";

    function toast(
        message,
        type = "success"
    ) {

        if (
            typeof window.showToast ===
            "function"
        ) {
            window.showToast(
                message,
                type
            );

            return;
        }

        console.log(
            `[${type}]`,
            message
        );
    }

    function resetSelect(
        id,
        index = 0
    ) {

        const select =
            document.getElementById(
                id
            );

        if (select) {
            select.selectedIndex =
                index;
        }
    }

    function clearPromotionPanel() {

        [
            "personelAdi",
            "yetkiliAdi"
        ].forEach(
            id => {

                const input =
                    document.getElementById(
                        id
                    );

                if (input) {
                    input.value = "";
                }
            }
        );

        [
            "eskiSaat",
            "eskiDakika",
            "yeniSaat",
            "yeniDakika"
        ].forEach(
            id => {

                const input =
                    document.getElementById(
                        id
                    );

                if (input) {
                    input.value = "0";
                }
            }
        );

        resetSelect(
            "terfiRozet",
            0
        );

        resetSelect(
            "terfiRutbe",
            0
        );

        const historyArea =
            document.getElementById(
                "terfiGecmisiAlani"
            );

        if (historyArea) {
            historyArea.style.display =
                "none";
        }

        const historyList =
            document.getElementById(
                "terfiGecmisiListesi"
            );

        if (historyList) {
            historyList.innerHTML = "";
        }

        const historyCount =
            document.getElementById(
                "terfiGecmisiSayisi"
            );

        if (historyCount) {
            historyCount.textContent =
                "0 kayıt";
        }

        window.discordMesaji = "";
        window.promotionCheckData = null;
        window.terfiCheckData = null;

        toast(
            "Terfi kontrol ekranı temizlendi."
        );
    }

    function clearSalaryPanel() {

        [
            "maasPersonelAdi",
            "maasYetkiliAdi"
        ].forEach(
            id => {

                const input =
                    document.getElementById(
                        id
                    );

                if (input) {
                    input.value = "";
                }
            }
        );

        [
            "maasEskiSaat",
            "maasEskiDakika",
            "maasYeniSaat",
            "maasYeniDakika"
        ].forEach(
            id => {

                const input =
                    document.getElementById(
                        id
                    );

                if (input) {
                    input.value = "0";
                }
            }
        );

        resetSelect(
            "maasRozet",
            0
        );

        const historyArea =
            document.getElementById(
                "maasGecmisiAlani"
            );

        if (historyArea) {
            historyArea.style.display =
                "none";
        }

        const historyList =
            document.getElementById(
                "maasGecmisiListesi"
            );

        if (historyList) {
            historyList.innerHTML = "";
        }

        const historyCount =
            document.getElementById(
                "maasGecmisiSayisi"
            );

        if (historyCount) {
            historyCount.textContent =
                "0 kayıt";
        }

        window.discordMesaji = "";
        window.salaryCheckData = null;

        toast(
            "Maaş kontrol ekranı temizlendi."
        );
    }

    async function sendTtAnnouncement() {

        const button =
            document.getElementById(
                "ttDuyuruBtn"
            );

        const status =
            document.getElementById(
                "ttDuyuruDurum"
            );

        const time =
            String(
                document
                    .getElementById(
                        "terfiSaati"
                    )
                    ?.value || ""
            ).trim();

        if (!time) {

            toast(
                "Önce Toplu Terfi Saatini seçin.",
                "warning"
            );

            return;
        }

        const token =
            String(
                localStorage.getItem(
                    "token"
                ) || ""
            ).trim();

        if (!token) {

            toast(
                "Duyuru göndermek için giriş yapmalısınız.",
                "warning"
            );

            return;
        }

        if (button) {
            button.disabled = true;
        }

        if (status) {
            status.textContent =
                "Discord duyurusu sıraya ekleniyor...";
        }

        try {

            const response =
                await fetch(
                    "/api/discord/tt-announcements",
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
                                time
                            })
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch (_) {}

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Toplu terfi duyurusu gönderilemedi."
                );
            }

            if (status) {
                status.textContent =
                    `${time} duyurusu Discord kuyruğuna eklendi.`;
            }

            toast(
                `${time} toplu terfi duyurusu Discord'a gönderilmek üzere sıraya alındı.`,
                "success"
            );

        } catch (error) {

            if (status) {
                status.textContent =
                    error.message ||
                    "Duyuru gönderilemedi.";
            }

            toast(
                error.message ||
                "Duyuru gönderilemedi.",
                "error"
            );

        } finally {

            if (button) {
                button.disabled = false;
            }
        }
    }

    document
        .getElementById(
            "terfiTemizleBtn"
        )
        ?.addEventListener(
            "click",
            clearPromotionPanel
        );

    document
        .getElementById(
            "maasTemizleBtn"
        )
        ?.addEventListener(
            "click",
            clearSalaryPanel
        );

    document
        .getElementById(
            "ttDuyuruBtn"
        )
        ?.addEventListener(
            "click",
            sendTtAnnouncement
        );

})();