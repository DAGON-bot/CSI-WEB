const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const popupTitle = document.getElementById("popupTitle");
const popupContent = document.getElementById("popupContent");
const popupIcon = document.getElementById("popupIcon");
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

}

else if(mode==="toplu"){

    popupButtons.style.display="flex";

    copyBtn.style.display="inline-block";
    if (updateSiteRankBtn) {
    updateSiteRankBtn.style.display = "none";
}

    if(newBtn){
    newBtn.style.display="none";
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

// Discord çıktısını kopyala
console.log("Copy eventi yüklendi");
document.addEventListener("click", function(e){

    if(e.target && e.target.id === "copyDiscordBtn"){

        const text = window.discordMesaji;

        console.log("Kopyalanacak:", text);

        navigator.clipboard.writeText(text)
        .then(()=>{
            showToast("Discord çıktısı panoya kopyalandı.","success");
        })
        .catch(()=>{
            showToast("Kopyalama başarısız.","error");
        });

    }

});

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