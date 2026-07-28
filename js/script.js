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
// TERFİ KONTROL SİSTEMİ
// =========================

const terfiKontrolBtn = document.getElementById("terfiKontrolBtn");

const personelAdiInput = document.getElementById("personelAdi");
const yetkiliAdiInput = document.getElementById("yetkiliAdi");

const eskiSaatInput = document.getElementById("eskiSaat");
const eskiDakikaInput = document.getElementById("eskiDakika");

const yeniSaatInput = document.getElementById("yeniSaat");
const yeniDakikaInput = document.getElementById("yeniDakika");

const terfiSureleri = {

    "Memur":30,
    "Güvenlik":40,
    "Eğitim":60,
    "Yasal İşler":60,
    "Diplomat":90,
    "Operasyon Görevlisi":90,
    "Dış İşleri":120,
    "Yönetim Bürosu":120,
    "Müdürler":150,
    "Halkla İlişkiler":190,
    "UDY":220,
    "Liderler":240,
    "Soruşturma Bürosu":270,
    "Kriminal İnceleme":270,
    "Görevliler":300,
    "Bakanlar":360,
    "İstihbarat":420,
    "Cumhurbaşkanı":450

};

function dakikaCevir(saat,dakika){

    return (saat*60)+dakika;

}

function dakikaYazi(dakika){

    const saat=Math.floor(dakika/60);

    const dk=dakika%60;

    if(saat===0)
        return `${dk} Dakika`;

    if(dk===0)
        return `${saat} Saat`;

    return `${saat} Saat ${dk} Dakika`;

}
function sureBul(rozet){

    switch(rozet){

        case "Standart Rütbeler":
            return 30;

        case "Güvenlik Ekibi":
            return 40;

        case "Eğitim Ekibi":
            return 60;

        case "Yasal İşler Bakanlığı":
            return 60;

        case "Diplomatlar":
            return 90;

        case "Operasyon Yetkilileri":
            return 90;

        case "Dış İşler Bakanlığı":
            return 120;

        case "Yönetim Bürosu":
            return 120;

        case "Müdürler":
            return 150;

        case "Halk ve İlişkiler Bölümü":
            return 190;

        case "Üst Düzey Yönetim":
            return 220;

        case "Leadership":
            return 240;

        case "Soruşturma Bürosu":
            return 270;

        case "Kriminal İnceleme Birimi":
            return 270;

        case "Görevliler":
            return 300;

        case "Bakanlar":
            return 360;

        case "İstihbarat Bölümü":
            return 420;

        case "Cumhurbaşkanları":
            return 450;

        default:
            return null;
    }

}

if(terfiKontrolBtn){

terfiKontrolBtn.addEventListener("click",()=>{

    const personel=personelAdiInput.value.trim();

    const yetkili=yetkiliAdiInput.value.trim();

    const rozet=terfiRozet.value;

    const rutbe=terfiRutbe.value;

    if(
        personel===""||
        yetkili===""||
        rozet===""||
        rutbe===""){
            showToast("Lütfen tüm alanları doldurun.","warning");
            return;
    }

    const eskiToplam=dakikaCevir(

        Number(eskiSaatInput.value),

        Number(eskiDakikaInput.value)

    );

    const yeniToplam=dakikaCevir(

        Number(yeniSaatInput.value),

        Number(yeniDakikaInput.value)

    );

    if(yeniToplam<eskiToplam){

        showToast("Çalışma süresi hatalı.","error");

        return;

    }

    const gecenSure=yeniToplam-eskiToplam;

    const gerekenSure = sureBul(rozet);

   if (gerekenSure == null) {

    showToast("Bu rütbe için süre bulunamadı.","error");

    return;

}

    const liste=rankData[rozet];

    const index=liste.indexOf(rutbe);

    if(index===-1){

        showToast("Rütbe bulunamadı.","error");

        return;

    }

    const sonrakiRutbe=liste[index+1]||"SON RÜTBE";
        if (gecenSure >= gerekenSure) {

        const discordMesaji =
`Çalışan: ${personel}
Eski Rütbe: ${rutbe}
Yeni Rütbe: ${sonrakiRutbe}
Oda Süresi: ${dakikaYazi(gecenSure)}
Kod: ${yetkili}`;

const popupMesaji = `
<table class="popup-table">

<tr>
<td>👤 Personel</td>
<td>${personel}</td>
</tr>

<tr>
<td>👮 Yetkili</td>
<td>${yetkili}</td>
</tr>

<tr>
<td>🏷 Rozet</td>
<td>${rozet}</td>
</tr>

<tr>
<td>🎖 Eski Rütbe</td>
<td>${rutbe}</td>
</tr>

<tr>
<td>⬆ Yeni Rütbe</td>
<td>${sonrakiRutbe}</td>
</tr>

<tr>
<td>⏱ Oda Süresi</td>
<td>${dakikaYazi(gecenSure)}</td>
</tr>

</table>
`;

       window.discordMesaji = discordMesaji;

showPopup(
    "Terfi Onaylandı",
    popupMesaji,
    "success"
);
    } else {

        const kalan = gerekenSure - gecenSure;

        showPopup(
            "Terfi Reddedildi",
            `Terfi için ${dakikaYazi(kalan)} daha çalışması gerekiyor.`,
            "warning"
        );

    }

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
    showToast("Toast sistemi hazır.");
    showPopup(
    "Popup Sistemi",
    "Popup başarıyla çalışıyor. 🎉",
    "success"
);

}

const dakikaInputlari = document.querySelectorAll("#eskiDakika, #yeniDakika");

dakikaInputlari.forEach(input => {

    input.addEventListener("input", () => {

        let deger = parseInt(input.value);

        if (isNaN(deger)) return;

        if (deger > 59) input.value = 59;

        if (deger < 0) input.value = 0;

    });

});
