const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const popupTitle = document.getElementById("popupTitle");
const popupContent = document.getElementById("popupContent");
const popupIcon = document.getElementById("popupIcon");

function showPopup(title, content, type = "success") {

    popupTitle.textContent = title;
    popupContent.innerHTML = content;

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

document.getElementById("newControlBtn").addEventListener("click", function(){
    closePopup();
});

// Discord çıktısını kopyala
document.getElementById("copyDiscordBtn").addEventListener("click", function () {

    const text =
window.discordMesaji ||
popupContent.innerText;

    navigator.clipboard.writeText(text)
        .then(() => {

            showToast("Discord çıktısı panoya kopyalandı.", "success");

        })
        .catch(() => {

            showToast("Kopyalama başarısız.", "error");

        });

});