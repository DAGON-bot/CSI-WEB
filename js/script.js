const buttons =
    document.querySelectorAll(".tab-btn");

const tabs =
    document.querySelectorAll(".tab-content");

const promotionBadgeGroups =
    Object.keys(rankData).slice(
        0,
        Object.keys(rankData).indexOf(
            "Cumhurbaşkanları"
        ) + 1
    );

buttons.forEach(button => {

    button.addEventListener("click", () => {

        if (
    button.disabled ||
    button.style.display === "none"
) {
    return;
}

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

    promotionBadgeGroups.forEach(rozet => {

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

const terfiGecmisiBtn =
    document.getElementById(
        "terfiGecmisiBtn"
    );

const terfiGecmisiAlani =
    document.getElementById(
        "terfiGecmisiAlani"
    );

const terfiGecmisiListesi =
    document.getElementById(
        "terfiGecmisiListesi"
    );

const terfiGecmisiSayisi =
    document.getElementById(
        "terfiGecmisiSayisi"
    );

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
const sureler = {

    "Standart Rütbeler":30,
    "Güvenlik Ekibi":40,
    "Eğitim Ekibi":60,
    "Yasal İşler Bakanlığı":60,
    "Yüksek Rütbe":90,
    "Diplomatlar":90,
    "Operasyon Yetkilileri":90,
    "Dış İşler Bakanlığı":120,
    "Yönetim Bürosu":120,
    "Müdürler":150,
    "Halk ve İlişkiler Bölümü":190,
    "Üst Düzey Yönetim":220,
    "Leadership":240,
    "Soruşturma Bürosu":270,
    "Kriminal İnceleme Birimi":270,
    "Görevliler":300,
    "Bakanlar":360,
    "İstihbarat Bölümü":420,
    "Cumhurbaşkanları":450

};

function sureBul(rozet){

    return sureler[rozet] ?? null;

}


function getPromotedRank(
    currentBadge,
    currentRank,
    promotionAmount
) {

    let badgeIndex =
        promotionBadgeGroups.indexOf(
            currentBadge
        );

    if (badgeIndex === -1) {
        return null;
    }

    let rankList =
        rankData[currentBadge];

    let rankIndex =
        rankList.indexOf(
            currentRank
        );

    if (rankIndex === -1) {
        return null;
    }

    let remainingPromotion =
        Number(promotionAmount) || 0;

    while (remainingPromotion > 0) {

        if (
            rankIndex <
            rankList.length - 1
        ) {

            rankIndex++;
            remainingPromotion--;

            continue;
        }

        const nextBadgeIndex =
            badgeIndex + 1;

        if (
            nextBadgeIndex >=
            promotionBadgeGroups.length
        ) {

            return {
                badge:
                    promotionBadgeGroups[
                        badgeIndex
                    ],

                rank:
                    rankList[
                        rankList.length - 1
                    ]
            };
        }

        badgeIndex =
    nextBadgeIndex;

const nextBadge =
    promotionBadgeGroups[
        badgeIndex
    ];

rankList =
    rankData[nextBadge];

/*
 Yeni rozete geçildiği anda
 ilk rütbe zaten kazanılmış olur.
*/
rankIndex = 0;

remainingPromotion--;
    }

    return {
        badge:
            promotionBadgeGroups[
                badgeIndex
            ],

        rank:
            rankList[rankIndex]
    };
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

    const promotionResult =
    getPromotedRank(
        rozet,
        rutbe,
        1
    );

if (!promotionResult) {

    showToast(
        "Rütbe bulunamadı.",
        "error"
    );

    return;
}

const sonrakiRozet =
    promotionResult.badge;

const sonrakiRutbe =
    promotionResult.rank;
        if (gecenSure >= gerekenSure) {

        const discordMesaji =
`Çalışan: ${personel}
Eski Rozet: ${rozet}
Yeni Rozet: ${sonrakiRozet}
Eski Rütbe: ${rutbe}
Yeni Rütbe: ${sonrakiRutbe}
Oda Süresi: ${dakikaYazi(yeniToplam)}
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
<td>${rozet} → ${sonrakiRozet}</td>
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
<td>${dakikaYazi(yeniToplam)}</td>
</tr>

</table>
`;

       window.discordMesaji = discordMesaji;
       window.terfiBilgisi = {
    username:
        personel,

    oldBadge:
        rozet,

    oldRank:
        rutbe,

    newBadge:
        sonrakiRozet,

    newRank:
        sonrakiRutbe,

    workedHours:
        Number(
            yeniSaatInput.value
        ) || 0,

    workedMinutes:
        Number(
            yeniDakikaInput.value
        ) || 0
};
const copyDiscordBtn =
    document.getElementById(
        "copyDiscordBtn"
    );

if (copyDiscordBtn) {
    copyDiscordBtn.style.display =
        "inline-flex";
}

showPopup(
    "Terfi Onaylandı",
    popupMesaji,
    "success"
);
    } else {

    window.terfiBilgisi = null;

    const kalan =
        gerekenSure - gecenSure;

    showPopup(
        "Terfi Reddedildi",
        `Terfi için ${dakikaYazi(kalan)} daha çalışması gerekiyor.`,
        "warning"
    );

    const copyDiscordBtn =
        document.getElementById(
            "copyDiscordBtn"
        );

    if (copyDiscordBtn) {
        copyDiscordBtn.style.display =
            "none";
    }

    const sendDiscordBtn =
        document.getElementById(
            "sendDiscordBtn"
        );

    if (sendDiscordBtn) {
        sendDiscordBtn.style.display =
            "none";
    }
}

});

}

// =========================
// TERFİ GEÇMİŞİ SİSTEMİ
// =========================

function escapePromotionHistoryHtml(
    value
) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatPromotionHistoryDate(
    value
) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Tarih bulunamadı";
    }

    return date.toLocaleString(
        "tr-TR",
        {
            day:
                "2-digit",

            month:
                "2-digit",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}

function renderPromotionHistory(
    username,
    history
) {

    if (
        !terfiGecmisiAlani ||
        !terfiGecmisiListesi ||
        !terfiGecmisiSayisi
    ) {

        return;
    }

    terfiGecmisiAlani.style.display =
        "block";

    terfiGecmisiSayisi.textContent =
        `${history.length} kayıt`;

    if (history.length === 0) {

        terfiGecmisiListesi.innerHTML = `
            <div class="promotion-history-empty">
                <strong>
                    ${escapePromotionHistoryHtml(username)}
                </strong>
                adlı personele ait daha önce işlenmiş
                terfi bulunamadı.
            </div>
        `;

        return;
    }

    terfiGecmisiListesi.innerHTML =
        history
            .map(record => {

                const oldBadge =
                    escapePromotionHistoryHtml(
                        record.oldBadge
                    );

                const workedHours =
    Number(
        record.workedHours || 0
    );

const workedMinutes =
    Number(
        record.workedMinutes || 0
    );

const hasWorkedTime =
    record.workedHours !== null &&
    record.workedHours !== undefined &&
    record.workedMinutes !== null &&
    record.workedMinutes !== undefined;

const workedTimeText =
    hasWorkedTime
        ? `${workedHours} Saat ${workedMinutes} Dakika`
        : "Eski kayıtta süre bulunmuyor";

                const newBadge =
                    escapePromotionHistoryHtml(
                        record.newBadge
                    );

                const oldRank =
                    escapePromotionHistoryHtml(
                        record.oldRank
                    );

                const newRank =
                    escapePromotionHistoryHtml(
                        record.newRank
                    );

                const promotedBy =
                    escapePromotionHistoryHtml(
                        record.promotedBy
                    );

                const createdAt =
                    formatPromotionHistoryDate(
                        record.createdAt
                    );

                return `
                    <div class="promotion-history-card">

                        <div class="promotion-history-date">
                            ${createdAt}
                        </div>

                        <div class="promotion-history-row">

                            <span class="promotion-history-label">
                                Rozet
                            </span>

                            <span class="promotion-history-value">
                                ${oldBadge} → ${newBadge}
                            </span>

                        </div>

                        <div class="promotion-history-row">

    <span class="promotion-history-label">
        Rütbe
    </span>

    <span class="promotion-history-value">
        ${oldRank} → ${newRank}
    </span>

</div>

<div class="promotion-history-row">

    <span class="promotion-history-label">
        Toplam Çalışma Süresi
    </span>

    <span class="promotion-history-value">
        ${workedTimeText}
    </span>

</div>

<div class="promotion-history-row">

    <span class="promotion-history-label">
        Terfiyi Veren
    </span>

    <span class="promotion-history-value">
        ${promotedBy}
    </span>

</div>
                    </div>
                `;
            })
            .join("");
}

async function loadPromotionHistory() {

    const username =
        String(
            personelAdiInput?.value ||
            ""
        ).trim();

    const token =
        localStorage.getItem(
            "token"
        );

    if (!username) {

        showToast(
            "Önce personel adını yazın.",
            "warning"
        );

        personelAdiInput?.focus();

        return;
    }

    if (!token) {

        showToast(
            "Terfi geçmişini görmek için giriş yapmalısınız.",
            "warning"
        );

        return;
    }

    terfiGecmisiBtn.disabled =
        true;

    terfiGecmisiBtn.textContent =
        "Terfi Geçmişi Yükleniyor...";

    try {

        const response =
            await fetch(
                `/api/promotion-history/${encodeURIComponent(username)}?limit=50`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
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
                "Terfi geçmişi yüklenemedi."
            );
        }

        renderPromotionHistory(
            username,
            Array.isArray(data.history)
                ? data.history
                : []
        );

    } catch (err) {

        console.error(
            "Terfi geçmişi hatası:",
            err
        );

        showToast(
            err.message ||
            "Terfi geçmişi yüklenemedi.",
            "error"
        );

    } finally {

        terfiGecmisiBtn.disabled =
            false;

        terfiGecmisiBtn.textContent =
            "Terfi Geçmişini Göster";
    }
}

terfiGecmisiBtn?.addEventListener(
    "click",
    loadPromotionHistory
);

personelAdiInput?.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Enter") {
            return;
        }

        event.preventDefault();

        loadPromotionHistory();
    }
);

personelAdiInput?.addEventListener(
    "input",
    () => {

        if (terfiGecmisiAlani) {
            terfiGecmisiAlani.style.display =
                "none";
        }
    }
);

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

    promotionBadgeGroups.forEach(rozet => {
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

const topluTerfiListesi = [];   

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

            const promotionResult =
    getPromotedRank(
        rozet,
        rutbe,
        deger
    );

if (!promotionResult) {
    return;
}

const yeniRozet =
    promotionResult.badge;

const yeniRutbe =
    promotionResult.rank;

    if (ad && yeniRutbe) {

    topluTerfiListesi.push({
    username:
        ad.trim(),

    oldRank:
        rutbe,

    newRank:
        yeniRutbe
});

}

discordCiktisi +=
`${ad.padEnd(18)} │ ${rozet} / ${rutbe} → ${yeniRozet} / ${yeniRutbe}\n`;

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

🏷️ Rozet : ${rozet} → ${yeniRozet}

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
`# 📢 ${saat} Toplu Terfi Dağıtımı

**Dağıtan Kişi:** ${dagitan}
**Dağıtan Kodu:** ${kod}

\`\`\`
${discordCiktisi}\`\`\``;

popupSonuclari += `

<div style="margin-top:25px;display:flex;flex-direction:column;gap:12px;">


<button id="oyunGoster" class="popup-btn dark">
Oyun Çıktısını Görüntüle
</button>

</div>

`;
window.discordMesaji = discordCiktisi;

window.topluTerfiBilgisi = {
    distributorName:
        dagitan,

    distributorCode:
        kod,

    startTime:
        saat,

    endTime:
        saat,

    multiplier:
        deger,

    promotions:
        topluTerfiListesi
};

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
        window.topluTerfiBilgisi = [];


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

// HABER SİSTEMİ 

const haberler = [



];

const haberContainer = document.getElementById("haberContainer");

if(haberContainer){

haberler.forEach(haber=>{

haberContainer.innerHTML += `

<div class="news-card">

<div class="news-image">

<img src="${haber.resim}">

</div>

<div class="news-content">

<div class="news-category">

${haber.kategori}

</div>

<div class="news-title">

${haber.baslik}

</div>

<div class="news-description">

${haber.aciklama}

</div>

<div class="news-footer">

<span>${haber.tarih}</span>

<span class="news-read">

Devamını Oku →

</span>

`;

});

}

// Boş haber kartları
if (haberContainer) {

    const toplamKart = Math.max(6, haberler.length);

    const eksikKart = toplamKart - haberler.length;

    for(let i = haberler.length; i < toplamKart; i++){

        haberContainer.innerHTML += `

        <div class="news-placeholder">

            <div class="news-placeholder-image">
                📰
            </div>

            <div class="news-placeholder-content">

                <h3>Yeni Haber Yakında</h3>

                <p>
                    CSI Community'deki yeni gelişmeler
                    ve etkinlikler çok yakında burada yayınlanacaktır.
                </p>

                <span class="news-placeholder-tag">
                    Güncelleniyor...
                </span>

            </div>

        </div>

        `;

    }

}

const duyurular = [

{
    baslik: "🌐 CSI Community Resmi Web Sitesi Yayında!",
    aciklama: "CSI Community'nin yeni resmi web sitesi yayınlandı! Artık tüm duyurulara, etkinliklere ve yönetim sistemlerine tek bir platformdan ulaşabilirsiniz.",

},

{
    baslik: "🚀 Yeni Yönetim Paneli Aktif!",
    aciklama: "Terfi Kontrol, Toplu Terfi, Payban ve Puantaj sistemleri kullanıma açıldı.",

},

{
    baslik: "🛠️ Geliştirmeler Devam Ediyor",
    aciklama: "Web sitemiz sürekli geliştirilmektedir. Yakında yeni özellikler eklenecektir.",
    tarih: "29 Temmuz 2026"
}

];

const duyuruContainer = document.getElementById("duyuruContainer");

if (duyuruContainer) {

    duyurular.forEach(duyuru => {

        duyuruContainer.innerHTML += `

        <div class="announcement-item">

            <div class="announcement-title">
                ${duyuru.baslik}
            </div>

            <div class="announcement-text">
                ${duyuru.aciklama}
            </div>

        </div>

        `;

    });

}

const orgBtn=document.getElementById("organizationBtn");
const orgPopup=document.getElementById("organizationPopup");
const orgClose=document.getElementById("organizationClose");

if(orgBtn){

orgBtn.onclick=()=>{

orgPopup.classList.add("active");

}

}

if(orgClose){

orgClose.onclick=()=>{

orgPopup.classList.remove("active");

}

}

if(orgPopup){

orgPopup.onclick=(e)=>{

if(e.target===orgPopup){

orgPopup.classList.remove("active");

}

}

}

// =========================
// MOBİL NAVBAR
// =========================

const menuToggle = document.getElementById("menuToggle");

if(menuToggle){

    menuToggle.addEventListener("click",()=>{

        document
            .querySelector(".nav-center")
            ?.classList.toggle("active");

        document
            .querySelector(".nav-right")
            ?.classList.toggle("active");

    });

}

// =========================
// NAVBAR AKTİF BÖLÜM TAKİBİ
// =========================

const navLinks =
    document.querySelectorAll(".nav-btn");

const navSections = [];

navLinks.forEach((link) => {

    const href =
        link.getAttribute("href");

    if (
        !href ||
        !href.startsWith("#")
    ) {
        return;
    }

    const section =
        document.querySelector(href);

    if (!section) {
        return;
    }

    navSections.push({
        link,
        section
    });

});


function setActiveNavLink(activeLink) {

    navLinks.forEach((link) => {
        link.classList.remove("active");
    });

    activeLink?.classList.add("active");

}


function updateActiveNavOnScroll() {

    if (navSections.length === 0) {
        return;
    }

    const scrollPoint =
        window.scrollY + 180;

    let activeItem =
        navSections[0];

    navSections.forEach((item) => {

        if (
            item.section.offsetTop <=
            scrollPoint
        ) {

            activeItem = item;

        }

    });

    setActiveNavLink(
        activeItem.link
    );

}


navLinks.forEach((link) => {

    link.addEventListener(
        "click",
        () => {

            setActiveNavLink(link);

        }
    );

});


window.addEventListener(
    "scroll",
    updateActiveNavOnScroll,
    {
        passive: true
    }
);

window.addEventListener(
    "load",
    updateActiveNavOnScroll
);

document.addEventListener(
    "DOMContentLoaded",
    updateActiveNavOnScroll
);
