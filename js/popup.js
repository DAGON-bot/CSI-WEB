const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const popupTitle = document.getElementById("popupTitle");
const popupContent = document.getElementById("popupContent");
const popupIcon = document.getElementById("popupIcon");
const popupButtons =
    document.querySelector(".popup-buttons");

const copyBtn =
    document.getElementById("copyDiscordBtn");

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


    if(mode==="terfi"){

}

else if(mode==="toplu"){

    popupButtons.style.display="flex";

    copyBtn.style.display="inline-block";

    if(newBtn){
    newBtn.style.display="none";
}

}

else if(mode=="oyun"){

    popupButtons.style.display="flex";

    copyBtn.style.display="none";


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