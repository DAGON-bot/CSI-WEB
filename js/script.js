const buttons = document.querySelectorAll(".tab-btn");
const tabs = document.querySelectorAll(".tab-content");

buttons.forEach(button => {

    button.addEventListener("click", () => {

        buttons.forEach(btn =>
            btn.classList.remove("active")
        );

        tabs.forEach(tab =>
            tab.classList.remove("active")
        );

        button.classList.add("active");

        document
            .getElementById(button.dataset.tab)
            .classList.add("active");
    });

});
// =========================
// TERFİ KONTROL DROPDOWN
// =========================

const terfiRozet =
    document.getElementById("terfiRozet");

const terfiRutbe =
    document.getElementById("terfiRutbe");

if(terfiRozet){

    let options =
        `<option value="">
            Rozet seçiniz
        </option>`;

    Object.keys(rankData).forEach(rozet => {

        options += `
            <option value="${rozet}">
                ${rozet}
            </option>
        `;

    });

    terfiRozet.innerHTML = options;

    terfiRozet.addEventListener("change", () => {

        const secilenRozet =
            terfiRozet.value;

        terfiRutbe.innerHTML = "";

        if(!rankData[secilenRozet]) return;

        rankData[secilenRozet].forEach(rutbe => {

            const option =
                document.createElement("option");

            option.value = rutbe;
            option.textContent = rutbe;

            terfiRutbe.appendChild(option);

        });

    });

}

// =========================
// TOPLU TERFİ SİSTEMİ
// =========================

const personelContainer = document.getElementById("personelContainer");
const personelEkleBtn = document.getElementById("personelEkle");
const hesaplaBtn = document.getElementById("hesaplaBtn");
const sonuclarDiv = document.getElementById("sonuclar");

let personelSayisi = 0;

function personelKartOlustur() {

    personelSayisi++;

    const kart = document.createElement("div");

    kart.className = "info-card";
    kart.style.marginBottom = "20px";

    let rozetOptions = `<option value="">Rozet Seçiniz</option>`;

    Object.keys(rankData).forEach(rozet => {

        rozetOptions += `
            <option value="${rozet}">
                ${rozet}
            </option>
        `;

    });

    kart.innerHTML = `

        <h3>Personel ${personelSayisi}</h3>

        <input
            type="text"
            class="personelAdi"
            placeholder="Personel Adı"
            style="margin-bottom:10px;"
        >

        <select
            class="rozetSec"
            style="margin-bottom:10px;"
        >
            ${rozetOptions}
        </select>

        <select class="rutbeSec">
            <option value="">
                Önce Rozet Seçiniz
            </option>
        </select>

    `;

    personelContainer.appendChild(kart);

    const rozetSelect = kart.querySelector(".rozetSec");
    const rutbeSelect = kart.querySelector(".rutbeSec");

    rozetSelect.addEventListener("change", () => {

        const secilenRozet = rozetSelect.value;

        rutbeSelect.innerHTML = "";

        if (!rankData[secilenRozet]) return;

        rankData[secilenRozet].forEach(rutbe => {

            const option = document.createElement("option");

            option.value = rutbe;
            option.textContent = rutbe;

            rutbeSelect.appendChild(option);

        });

    });

}

if(personelContainer){
    personelKartOlustur();
}

if(personelEkleBtn){

    personelEkleBtn.addEventListener("click", () => {

        personelKartOlustur();

    });

}

if(hesaplaBtn){

    hesaplaBtn.addEventListener("click", () => {

        sonuclarDiv.innerHTML = "";

        const deger =
            parseInt(
                document.getElementById("terfiDegeri").value
            );

        const kartlar =
            document.querySelectorAll(".info-card");

        kartlar.forEach(kart => {

            const ad =
                kart.querySelector(".personelAdi")?.value;

            const rozet =
                kart.querySelector(".rozetSec")?.value;

            const rutbe =
                kart.querySelector(".rutbeSec")?.value;

            if(!rozet || !rutbe) return;

            const liste = rankData[rozet];

            const mevcutIndex =
                liste.indexOf(rutbe);

            if(mevcutIndex === -1) return;

            let yeniIndex =
                mevcutIndex + deger;

            if(yeniIndex >= liste.length){

                yeniIndex =
                    liste.length - 1;

            }

            const yeniRutbe =
                liste[yeniIndex];

            const sonucKart =
                document.createElement("div");

            sonucKart.className = "info-card";

            sonucKart.innerHTML = `

    <h3>${ad || "İsimsiz Personel"}</h3>

    <p style="
        color:#f0c419;
        font-weight:700;
        margin-top:10px;
        margin-bottom:10px;
    ">
       🏷️ Mevcut Rozeti : ${rozet}
    </p>

    <p style="
        font-size:18px;
        font-weight:600;
    ">

        ${rutbe}

        <span style="
            color:#f0c419;
            font-weight:700;
        ">
            →
        </span>

        <strong>
            ${yeniRutbe}
        </strong>

    </p>

`;

            sonuclarDiv.appendChild(
                sonucKart
            );

        });

    });

}
