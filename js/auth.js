console.log(document.getElementById("authOverlay"));

// ===============================
// CSI AUTH SYSTEM
// ===============================

const authOverlay = document.getElementById("authOverlay");

const loginBtn = document.querySelector(".login-btn");
const registerBtn = document.querySelector(".register-btn");

const authClose = document.getElementById("authClose");

const createCodeBtn = document.getElementById("createCodeBtn");
const verifyBtn = document.getElementById("verifyBtn");

const verifyArea = document.getElementById("verifyArea");

// Popup Aç
function openAuthPopup(e){

    if(e) e.preventDefault();

    authOverlay.classList.add("active");

}

// Popup Kapat
function closeAuthPopup(){

    authOverlay.classList.remove("active");

    verifyArea.style.display = "none";

}

// Butonlar
loginBtn?.addEventListener("click", openAuthPopup);
registerBtn?.addEventListener("click", openAuthPopup);

// X
authClose?.addEventListener("click", closeAuthPopup);

// Dışarı tıklayınca
authOverlay?.addEventListener("click",(e)=>{

    if(e.target===authOverlay){

        closeAuthPopup();

    }

});

// ESC
document.addEventListener("keydown",(e)=>{

    if(e.key==="Escape"){

        closeAuthPopup();

    }

});

// Test amaçlı
createCodeBtn?.addEventListener("click",()=>{

    verifyArea.style.display="block";

    document.getElementById("verifyCode").textContent="CSI-123456";

});

verifyBtn?.addEventListener("click",()=>{

    alert("Doğrulama sistemi bir sonraki adımda backend'e bağlanacak.");

});