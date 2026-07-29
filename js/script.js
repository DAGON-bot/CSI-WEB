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
let discordCiktisi = "";
let oyunCiktisi = "";

let personelSayisi = 0;

function personelKartOlustur() {

    personelSayisi++;

    const kart = document.createElement("div");
    kart.className = "info-card";

    let rozetOptions = `<option value="">Rozet Seçiniz</option>`;

    Object.keys(rankData).forEach(rozet => {
        rozetOptions += `<option value="${rozet}">${rozet}</option>`;
    });

    kart.innerHTML = `

<input 
type="text"
class="personelAdi"
placeholder="Personel adı">


<select class="rozetSec">
${rozetOptions}
</select>


<select class="rutbeSec">
<option value="">Önce rozet seçiniz</option>
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
        console.log("TT hesapla başladı");
        discordCiktisi = "";
        oyunCiktisi = "";
        let popupSonuclari = "";

const dagitan =
    document.getElementById("dagitanYetkili").value.trim();

const kod =
    document.getElementById("kodAdi").value.trim();

const saat =
    document.getElementById("terfiSaati").value;

if(!dagitan || !kod || !saat){

    showToast(
        "Dağıtan, Kod ve Terfi Saatini giriniz.",
        "warning"
    );

    return;
}

        if (sonuclarDiv) {
    sonuclarDiv.innerHTML = "";
}

        const deger =
            parseInt(
                document.getElementById("terfiDegeri").value
            );

        const kartlar =
    personelContainer.querySelectorAll(".info-card");

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

if (yeniIndex >= liste.length) {

    yeniIndex =
        liste.length - 1;

}

const yeniRutbe =
    liste[yeniIndex];

discordCiktisi +=
`${ad} >> ${yeniRutbe}\n`;

oyunCiktisi +=
`${ad} --> ${yeniRutbe} rütbesine terfi etti.\n\n`;
            

            popupSonuclari += `

<div class="info-card" style="margin-bottom:18px;">

<h3>${ad || "İsimsiz Personel"}</h3>

<p style="
color:#f0c419;
font-weight:700;
margin-top:10px;
margin-bottom:10px;
">

🏷️ Mevcut Rozeti : ${rozet}

</p>

<p style="font-size:18px;font-weight:600;">

${rutbe}

<span style="color:#f0c419;font-weight:700;">

↓

</span>

<strong>${yeniRutbe}</strong>

</p>

</div>

`;

        });
            discordCiktisi =
`${saat} Toplu Terfisi

${discordCiktisi}
Dağıtan: ${dagitan}
Kod: ${kod}`;

popupSonuclari += `

<div style="margin-top:25px;display:flex;flex-direction:column;gap:12px;">


<button id="oyunGoster" class="popup-btn dark">
Oyun Çıktısını Görüntüle
</button>

</div>

`;
window.discordMesaji = discordCiktisi;
console.log("Discord çıktısı:", discordCiktisi);
showPopup(
    "Toplu Terfi Sonucu",
    popupSonuclari,
    "success",
    "toplu",
    discordCiktisi
);
setTimeout(() => {

    document.addEventListener("click", function(e){

    if(e.target && e.target.id === "oyunGoster"){

        showPopup(
            "Oyun Çıktısı",
            `<div style="white-space:pre-line;">${oyunCiktisi}</div>`,
            "success",
            "oyun"
        );

    }

});

},100);

    });

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

const ttTemizleBtn = document.getElementById("ttTemizleBtn");


if(ttTemizleBtn){

    ttTemizleBtn.addEventListener("click",()=>{


        // Personelleri temizle

        personelContainer.innerHTML="";

        personelKartOlustur();



        // Bilgileri temizle

        document.getElementById("dagitanYetkili").value="";

        document.getElementById("kodAdi").value="";

        document.getElementById("terfiSaati").selectedIndex=0;

        document.getElementById("terfiDegeri").value="1";


        discordCiktisi="";
        oyunCiktisi="";
        window.discordMesaji="";


        showToast(
            "Toplu terfi ekranı temizlendi.",
            "success"
        );


    });

}

// =========================
// PAYBAN SİSTEMİ
// =========================

document.addEventListener("DOMContentLoaded",()=>{


const paybanContainer = document.getElementById("paybanPersonelContainer");
const paybanEkleBtn = document.getElementById("paybanPersonelEkle");


if(!paybanEkleBtn || !paybanContainer){
    console.log("Payban element bulunamadı");
    return;
}



paybanEkleBtn.addEventListener("click",()=>{


    const satir = document.createElement("div");

    satir.className = "payban-row";


    satir.innerHTML = `

    <input 
    type="text"
    class="paybanAd"
    placeholder="Personel adı">


    <input 
    type="checkbox"
    class="paybanCheck">

    `;


    paybanContainer.appendChild(satir);


});


});

// PAYBAN RAPOR OLUŞTUR

const paybanRaporBtn = document.getElementById("paybanRaporBtn");


if(paybanRaporBtn){

    paybanRaporBtn.addEventListener("click",()=>{


        const tarih =
        document.getElementById("paybanTarih").value;


        const kartlar =
        document.querySelectorAll(".payban-row");


        let liste = "";


        kartlar.forEach(kart=>{


            const isim =
            kart.querySelector(".paybanAd").value.trim();


            const check =
            kart.querySelector(".paybanCheck").checked;



            if(isim && check){

                liste += isim + "\n";

            }


        });



        if(liste === ""){

    const rapor = `

${tarih} Payban Listesi


payban alan yoktur.


`;

    window.paybanMesaji = rapor;
    window.discordMesaji = rapor;


    showPopup(

        "🚫 Payban Raporu",

        `
        <div style="white-space:pre-line;">
        ${rapor}
        </div>
        `,

        "warning",
        "terfi"

    );


    return;

}



        const rapor = `

${tarih} Payban Listesi


${liste}


Bu kişiler maaşlarının yarısını alacaktır.

`;



        window.paybanMesaji = rapor;
        window.discordMesaji = rapor;



        showPopup(

            "🚫 Payban Raporu",

            `
            <div style="white-space:pre-line;">
            ${rapor}
            </div>
            `,

            "warning",
            "terfi"

        );


    });

}

// =========================
// PAYBAN TEMİZLE
// =========================

const paybanTemizleBtn = document.getElementById("paybanTemizleBtn");


if(paybanTemizleBtn){

    paybanTemizleBtn.addEventListener("click",()=>{


        const paybanContainer =
        document.getElementById("paybanPersonelContainer");


        // listeyi temizle
        paybanContainer.innerHTML = `

        <div class="payban-row">

            <input 
            type="text"
            class="paybanAd"
            placeholder="Personel adı">


            <input 
            type="checkbox"
            class="paybanCheck">

        </div>

        `;


        // tarihi temizle
        document.getElementById("paybanTarih").value="";


        // kopyalama mesajını temizle
        window.discordMesaji="";


        showToast(
            "Payban ekranı temizlendi.",
            "success"
        );


    });

}

