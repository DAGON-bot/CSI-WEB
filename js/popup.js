const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const popupTitle = document.getElementById("popupTitle");
const popupContent = document.getElementById("popupContent");
const popupIcon = document.getElementById("popupIcon");
const sendDiscordBtn =
    document.getElementById("sendDiscordBtn");
const popupButtons =
    document.querySelector(".popup-buttons");

const copyBtn =
    document.getElementById("copyDiscordBtn");
const updateSiteRankBtn =
    document.getElementById("updateSiteRankBtn");

const newBtn =
    document.getElementById("newControlBtn");
    const newBtnExists = newBtn !== null;
   let popupHistory = null;

const updateSiteRanksBtn =
    document.getElementById("updateSiteRanksBtn");

function showPopup(
    title,
    content,
    type = "success",
    mode = "terfi"
) {


    if(mode === "oyun"){

        popupHistory = {
            title: popupTitle.textContent,
            content: popupContent.innerHTML
        };

    }


    popupTitle.textContent = title;
    popupContent.innerHTML = content;


    if (mode === "terfi") {

    popupButtons.style.display = "flex";
    popupButtons.style.flexDirection = "column";

    copyBtn.style.display = "inline-block";

    if (sendDiscordBtn) {

    const canSend =
        title === "Terfi Onaylandı" &&
        window.terfiBilgisi;

    sendDiscordBtn.style.display =
        canSend ? "inline-block" : "none";

    sendDiscordBtn.disabled = false;
    sendDiscordBtn.textContent = "Discord'a İşle";
    }

    if (updateSiteRankBtn) {

        const canUpdateRank =
            title === "Terfi Onaylandı" &&
            window.terfiBilgisi &&
            window.terfiBilgisi.newRank !== "SON RÜTBE";

        updateSiteRankBtn.style.display =
            canUpdateRank ? "inline-block" : "none";

        updateSiteRankBtn.disabled = false;
        updateSiteRankBtn.textContent =
            "Sitede Güncelle";

    }

    if (updateSiteRanksBtn) {
    updateSiteRanksBtn.style.display = "none";
}

}

else if(mode==="toplu"){

    popupButtons.style.display="flex";

    copyBtn.style.display="inline-block";

    if (sendDiscordBtn) {

    const canSendBulk =
        window.topluTerfiBilgisi &&
        Array.isArray(
            window.topluTerfiBilgisi.promotions
        ) &&
        window.topluTerfiBilgisi
            .promotions.length > 0;

    sendDiscordBtn.style.display =
        canSendBulk
            ? "inline-block"
            : "none";

    sendDiscordBtn.disabled =
        false;

    sendDiscordBtn.textContent =
        "Discord'a İşle";
}
    if (updateSiteRankBtn) {
    updateSiteRankBtn.style.display = "none";
}

    if(newBtn){
    newBtn.style.display="none";
}

if (updateSiteRankBtn) {
    updateSiteRankBtn.style.display = "none";
}

if (updateSiteRanksBtn) {

    const hasPromotions =
    window.topluTerfiBilgisi &&
    Array.isArray(
        window.topluTerfiBilgisi.promotions
    ) &&
    window.topluTerfiBilgisi
        .promotions.length > 0;

    updateSiteRanksBtn.style.display =
        hasPromotions ? "inline-block" : "none";

    updateSiteRanksBtn.disabled = false;

    updateSiteRanksBtn.textContent =
        "Toplu Olarak Sitede Güncelle";

}

}

else if(mode=="oyun"){

    popupButtons.style.display="flex";

    copyBtn.style.display="none";
    if (updateSiteRankBtn) {
    updateSiteRankBtn.style.display = "none";
}


    if(newBtn){

        newBtn.style.display="inline-block";
        newBtn.textContent="Kapat";

    }

    if (updateSiteRankBtn) {
    updateSiteRankBtn.style.display = "none";
}

if (updateSiteRanksBtn) {
    updateSiteRanksBtn.style.display = "none";
}

}

    switch(type){

        case "success":
            popupIcon.innerHTML = "✔";
            popupIcon.style.background = "#28a745";
            break;

        case "error":
            popupIcon.innerHTML = "✖";
            popupIcon.style.background = "#dc3545";
            break;

        case "warning":
            popupIcon.innerHTML = "!";
            popupIcon.style.background = "#d4a000";
            break;

        default:
            popupIcon.innerHTML = "ℹ";
            popupIcon.style.background = "#3498db";
            break;

    }

    popupOverlay.classList.add("active");
}

function closePopup(){
    popupOverlay.classList.remove("active");
}

popupClose.addEventListener("click", closePopup);

popupOverlay.addEventListener("click", function(e){
    if(e.target === popupOverlay){
        closePopup();
    }
});

const newControlBtn = document.getElementById("newControlBtn");

if(newControlBtn){

    newControlBtn.addEventListener("click", function(){

        if (popupTitle.textContent === "Oyun Çıktısı" && popupHistory) {

            showPopup(
                popupHistory.title,
                popupHistory.content,
                "success",
                "toplu"
            );

            popupHistory = null;
            return;
        }

        closePopup();

    });

}

// =========================================
// GÜVENLİ DISCORD ÇIKTISI KOPYALAMA
// =========================================

async function copyTextToClipboard(text) {

    const cleanText =
        String(text || "").trim();

    if (!cleanText) {

        throw new Error(
            "Kopyalanacak Discord çıktısı bulunamadı."
        );

    }

    // HTTPS veya localhost üzerinde modern yöntem
    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        await navigator.clipboard.writeText(
            cleanText
        );

        return;

    }

    // HTTP IP adresleri için eski ama çalışan yöntem
    const textarea =
        document.createElement("textarea");

    textarea.value = cleanText;

    textarea.setAttribute(
        "readonly",
        ""
    );

    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    textarea.style.opacity = "0";

    document.body.appendChild(
        textarea
    );

    textarea.focus();
    textarea.select();

    textarea.setSelectionRange(
        0,
        textarea.value.length
    );

    const copied =
        document.execCommand("copy");

    document.body.removeChild(
        textarea
    );

    if (!copied) {

        throw new Error(
            "Tarayıcı kopyalama işlemini reddetti."
        );

    }

}


document.addEventListener(
    "click",
    async (event) => {

        const button =
            event.target.closest(
                "#copyDiscordBtn"
            );

        if (!button) {
            return;
        }

        event.preventDefault();

        const text =
            window.discordMesaji;

        if (
            !text ||
            !String(text).trim()
        ) {

            showToast(
                "Kopyalanacak Discord çıktısı bulunamadı.",
                "warning"
            );

            return;

        }

        const originalText =
            button.textContent;

        button.disabled = true;
        button.textContent =
            "Kopyalanıyor...";

        try {

            await copyTextToClipboard(
                text
            );

            showToast(
                "Discord çıktısı panoya kopyalandı.",
                "success"
            );

            button.textContent =
                "✓ Panoya Kopyalandı";

            setTimeout(() => {

                button.textContent =
                    originalText;

            }, 1400);

        } catch (err) {

            console.error(
                "Discord çıktısı kopyalama hatası:",
                err
            );

            showToast(
                err.message ||
                "Kopyalama başarısız.",
                "error"
            );

            button.textContent =
                originalText;

        } finally {

            setTimeout(() => {

                button.disabled = false;

            }, 300);

        }

    }
);

updateSiteRankBtn?.addEventListener(
    "click",
    async () => {

        const promotion =
            window.terfiBilgisi;

        const token =
            localStorage.getItem("token");

        if (!promotion) {

            showToast(
                "Güncellenecek terfi bilgisi bulunamadı.",
                "warning"
            );

            return;

        }

        if (!token) {

            showToast(
                "Bu işlem için giriş yapmanız gerekiyor.",
                "warning"
            );

            return;

        }

        updateSiteRankBtn.disabled = true;
        updateSiteRankBtn.textContent =
            "Güncelleniyor...";

        try {

            const response = await fetch(
                `${window.location.origin}/api/promotion/update-rank`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: promotion.username,
                        newRank: promotion.newRank
                    })
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {

                showToast(
                    data.message ||
                    "Rütbe güncellenemedi.",
                    "error"
                );

                return;

            }

            showToast(
                data.message ||
                "Kullanıcının rütbesi güncellendi.",
                "success"
            );

            updateSiteRankBtn.textContent =
                "Sitede Güncellendi";

            window.terfiBilgisi.oldRank =
                data.user?.oldRank ||
                window.terfiBilgisi.oldRank;

            window.terfiBilgisi.newRank =
                data.user?.newRank ||
                window.terfiBilgisi.newRank;

        } catch (err) {

            console.error(
                "Site rütbe güncelleme hatası:",
                err
            );

            showToast(
                "Sunucuya bağlanılamadı.",
                "error"
            );

        } finally {

            if (
                updateSiteRankBtn.textContent !==
                "Sitede Güncellendi"
            ) {

                updateSiteRankBtn.disabled = false;
                updateSiteRankBtn.textContent =
                    "Sitede Güncelle";

            }

        }

    }
);

updateSiteRanksBtn?.addEventListener(
    "click",
    async () => {

        const promotions =
            window.topluTerfiBilgisi;

        const token =
            localStorage.getItem("token");

        if (
            !Array.isArray(promotions) ||
            promotions.length === 0
        ) {

            showToast(
                "Güncellenecek toplu terfi bilgisi bulunamadı.",
                "warning"
            );

            return;

        }

        if (!token) {

            showToast(
                "Bu işlem için giriş yapmanız gerekiyor.",
                "warning"
            );

            return;

        }

        updateSiteRanksBtn.disabled = true;

        updateSiteRanksBtn.textContent =
            "Toplu Güncelleniyor...";

        try {

            const response = await fetch(
                `${window.location.origin}/api/promotion/update-ranks-bulk`,
                {
                    method: "PATCH",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        promotions
                    })
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                showToast(
                    data.message ||
                    "Toplu rütbe güncelleme başarısız.",
                    "error"
                );

                return;

            }

            const updated =
                data.result?.updated || [];

            const notFound =
                data.result?.notFound || [];

            const unchanged =
                data.result?.unchanged || [];

            const resultMessage = [
                `${updated.length} kişi güncellendi.`,
                `${notFound.length} kişi sistemde bulunamadı.`,
                `${unchanged.length} kişi zaten güncel rütbedeydi.`
            ].join(" ");

            showToast(
                resultMessage,
                updated.length > 0
                    ? "success"
                    : "warning"
            );

            updateSiteRanksBtn.textContent =
                "Toplu Güncelleme Tamamlandı";

            window.topluTerfiBilgisi = [];

        } catch (err) {

            console.error(
                "Toplu site rütbe güncelleme hatası:",
                err
            );

            showToast(
                "Sunucuya bağlanılamadı.",
                "error"
            );

        } finally {

            if (
                updateSiteRanksBtn.textContent !==
                "Toplu Güncelleme Tamamlandı"
            ) {

                updateSiteRanksBtn.disabled = false;

                updateSiteRanksBtn.textContent =
                    "Toplu Olarak Sitede Güncelle";

            }

        }

    }
);

sendDiscordBtn?.addEventListener(
    "click",
    async () => {

        const token =
            localStorage.getItem("token");

        if (!token) {

            showToast(
                "Giriş yapmanız gerekiyor.",
                "warning"
            );

            return;
        }

        const isBulkPromotion =
            window.topluTerfiBilgisi &&
            Array.isArray(
                window.topluTerfiBilgisi.promotions
            ) &&
            window.topluTerfiBilgisi
                .promotions.length > 0;

        const payload =
            isBulkPromotion
                ? window.topluTerfiBilgisi
                : window.terfiBilgisi;

        const endpoint =
            isBulkPromotion
                ? "/api/discord/bulk-promotions"
                : "/api/discord/promotion";

        if (!payload) {

            showToast(
                "Gönderilecek terfi bilgisi bulunamadı.",
                "warning"
            );

            return;
        }

        sendDiscordBtn.disabled = true;

        sendDiscordBtn.textContent =
            "Discord'a Gönderiliyor...";

        try {

            const response =
                await fetch(
                    endpoint,
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
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

                throw new Error(
                    data.message ||
                    "Discord işlemi başarısız."
                );
            }

            showToast(
                isBulkPromotion
                    ? "Toplu terfi Discord kuyruğuna eklendi."
                    : "Terfi Discord kuyruğuna eklendi.",
                "success"
            );

            sendDiscordBtn.textContent =
                "✓ Discord'a Gönderildi";

        } catch (err) {

            showToast(
                err.message ||
                "Discord'a gönderilemedi.",
                "error"
            );

            sendDiscordBtn.disabled =
                false;

            sendDiscordBtn.textContent =
                "Discord'a İşle";
        }
    }
);