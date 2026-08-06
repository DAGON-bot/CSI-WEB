/* =========================================
   CSI PUANTAJ SİSTEMİ
========================================= */

"use strict";

/* =========================================
   PUAN DEĞERLERİ
========================================= */

const PUANTAJ_MAX_NORMAL_PUAN = 75;

const puantajXPMap = {
    mr: 1,
    terfi: 3,
    egitim: 5,
    tt: 10,
    lisans: 10,
    aktif: 1,
    calisma: 3
};

const puantajCezaMap = {
    sure: 10,
    tt: 20,
    lisans: 20
};

const puantajPersonelVerileri = [
    {
        kullaniciAdi: "oheling",
        xp: 833
    },
    {
        kullaniciAdi: "mirindaa",
        xp: 342
    },
    {
        kullaniciAdi: "slaysu",
        xp: 40
    },
    {
        kullaniciAdi: "nyara",
        xp: 614
    },
    {
        kullaniciAdi: "harikaresul34",
        xp: 449
    },
    {
        kullaniciAdi: "Angela",
        xp: 920
    },
    {
        kullaniciAdi: "bln2323",
        xp: 196
    },
    {
        kullaniciAdi: "cbenescb",
        xp: 903
    },
    {
        kullaniciAdi: "cute",
        xp: -1
    },
    {
        kullaniciAdi: "çağrı1903",
        xp: 482
    },
    {
        kullaniciAdi: "çomar",
        xp: 215
    },
    {
        kullaniciAdi: "gorken",
        xp: 72
    },
    {
        kullaniciAdi: "drakmir",
        xp: 205
    },
    {
        kullaniciAdi: "blub",
        xp: 33
    },
    {
        kullaniciAdi: "nur58",
        xp: 8
    },
    {
        kullaniciAdi: "sadenok",
        xp: -40
    },
    {
        kullaniciAdi: "google-amca",
        xp: -18
    },
    {
        kullaniciAdi: "rockstar1881",
        xp: -129
    },
    {
        kullaniciAdi: "teddiciq19",
        xp: 271
    },
    {
        kullaniciAdi: "infillame",
        xp: -19
    }
];

/* =========================================
   HTML ELEMENTLERİ
========================================= */

const personelInput =
    document.getElementById("puantajPersonel");

const mevcutXPInput =
    document.getElementById("puantajXP");

const ekstraXPInput =
    document.getElementById("ekstraXP");

const mrInput =
    document.getElementById("mrSayi");

const terfiInput =
    document.getElementById("terfiSayi");

const egitimInput =
    document.getElementById("egitimSayi");

const ttInput =
    document.getElementById("ttSayi");

const lisansInput =
    document.getElementById("lisansSayi");

const aktifInput =
    document.getElementById("aktifSaat");

const calismaInput =
    document.getElementById("calismaSaat");

const sureCeza =
    document.getElementById("cezaSure");

const ttCeza =
    document.getElementById("cezaTT");

const lisansCeza =
    document.getElementById("cezaLisans");

const toplamSpan =
    document.getElementById("toplamXP");

const cezaSpan =
    document.getElementById("cezaXP");

const netSpan =
    document.getElementById("netXP");

const mevcutXPText =
    document.getElementById("mevcutXPText");

const yeniXPText =
    document.getElementById("yeniXPText");

const esCoinText =
    document.getElementById("esCoinText");

const puantajBtn =
    document.getElementById("puantajBtn");

const puantajTemizleBtn =
    document.getElementById("puantajTemizleBtn");

    const puantajPersonelAraInput =
    document.getElementById(
        "puantajPersonelAra"
    );

const puantajPersonelSayisi =
    document.getElementById(
        "puantajPersonelSayisi"
    );

const puantajPersonelListesi =
    document.getElementById(
        "puantajPersonelListesi"
    );

/* =========================================
   YARDIMCI FONKSİYONLAR
========================================= */

function puantajMesajGoster(
    mesaj,
    tip = "info"
) {
    if (
        typeof showToast ===
        "function"
    ) {
        showToast(
            mesaj,
            tip
        );

        return;
    }

    console.log(
        `[Puantaj] ${mesaj}`
    );
}

function sayiAl(
    input,
    varsayilan = 0
) {
    if (!input) {
        return varsayilan;
    }

    const deger =
        Number.parseInt(
            input.value,
            10
        );

    if (
        !Number.isInteger(deger)
    ) {
        return varsayilan;
    }

    return deger;
}

function negatifOlmayanSayiAl(
    input
) {
    const deger =
        sayiAl(
            input,
            0
        );

    return Math.max(
        deger,
        0
    );
}

function mevcutXP() {
    return sayiAl(
        mevcutXPInput,
        0
    );
}

function ekstraXP() {
    return sayiAl(
        ekstraXPInput,
        0
    );
}

/* =========================================
   FAALİYET PUANI
========================================= */

function hesaplaHamFaaliyetPuani() {
    let puan = 0;

    puan +=
        negatifOlmayanSayiAl(
            mrInput
        ) *
        puantajXPMap.mr;

    puan +=
        negatifOlmayanSayiAl(
            terfiInput
        ) *
        puantajXPMap.terfi;

    puan +=
        negatifOlmayanSayiAl(
            egitimInput
        ) *
        puantajXPMap.egitim;

    puan +=
        negatifOlmayanSayiAl(
            ttInput
        ) *
        puantajXPMap.tt;

    puan +=
        negatifOlmayanSayiAl(
            lisansInput
        ) *
        puantajXPMap.lisans;

    puan +=
        negatifOlmayanSayiAl(
            aktifInput
        ) *
        puantajXPMap.aktif;

    puan +=
        negatifOlmayanSayiAl(
            calismaInput
        ) *
        puantajXPMap.calisma;

    return puan;
}

function hesaplaNormalPuan() {
    return Math.min(
        hesaplaHamFaaliyetPuani(),
        PUANTAJ_MAX_NORMAL_PUAN
    );
}

/* =========================================
   CEZA
========================================= */

function hesaplaCeza() {
    let ceza = 0;

    if (
        sureCeza?.checked
    ) {
        ceza +=
            puantajCezaMap.sure;
    }

    if (
        ttCeza?.checked
    ) {
        ceza +=
            puantajCezaMap.tt;
    }

    if (
        lisansCeza?.checked
    ) {
        ceza +=
            puantajCezaMap.lisans;
    }

    return ceza;
}

/* =========================================
   NET PUAN, YENİ XP VE EŞ COİN
========================================= */

function hesaplaNetNormalPuan() {
    return (
        hesaplaNormalPuan() -
        hesaplaCeza()
    );
}

function hesaplaYeniXP() {
    return (
        mevcutXP() +
        hesaplaNetNormalPuan() +
        ekstraXP()
    );
}

function hesaplaEsCoin() {
    return (
        hesaplaNetNormalPuan() ===
        PUANTAJ_MAX_NORMAL_PUAN
    )
        ? 1
        : 0;
}

/* =========================================
   ÖZET EKRANI
========================================= */

function ozetYazdir() {
    const normalPuan =
        hesaplaNormalPuan();

    const ceza =
        hesaplaCeza();

    const netNormalPuan =
        hesaplaNetNormalPuan();

    const yeniXP =
        hesaplaYeniXP();

    const kazanilanEsCoin =
        hesaplaEsCoin();

    if (toplamSpan) {
        toplamSpan.textContent =
            `${normalPuan} XP`;
    }

    if (cezaSpan) {
        cezaSpan.textContent =
            ceza > 0
                ? `-${ceza} XP`
                : "0 XP";
    }

    if (netSpan) {
        netSpan.textContent =
            `${netNormalPuan} XP`;
    }

    if (mevcutXPText) {
        mevcutXPText.textContent =
            `${mevcutXP()} XP`;
    }

    if (yeniXPText) {
        yeniXPText.textContent =
            `${yeniXP} XP`;
    }

    if (esCoinText) {
        esCoinText.textContent =
            kazanilanEsCoin === 1
                ? "1 Eş Coin"
                : "0 Eş Coin";

        esCoinText.classList.toggle(
            "earned",
            kazanilanEsCoin === 1
        );
    }
}

/* =========================================
   RAPOR SATIRLARI
========================================= */

function raporSatirlari() {
    const satirlar = [];

    const aktif =
        negatifOlmayanSayiAl(
            aktifInput
        );

    const calisma =
        negatifOlmayanSayiAl(
            calismaInput
        );

    const terfi =
        negatifOlmayanSayiAl(
            terfiInput
        );

    const egitim =
        negatifOlmayanSayiAl(
            egitimInput
        );

    const tt =
        negatifOlmayanSayiAl(
            ttInput
        );

    const lisans =
        negatifOlmayanSayiAl(
            lisansInput
        );

    const mr =
        negatifOlmayanSayiAl(
            mrInput
        );

    if (aktif > 0) {
        satirlar.push(
            `${aktif} saat süre +${aktif} XP`
        );
    }

    if (calisma > 0) {
        satirlar.push(
            `${calisma} saat çalışma süresi +${
                calisma *
                puantajXPMap.calisma
            } XP`
        );
    }

    if (terfi > 0) {
        satirlar.push(
            `${terfi}x Terfi +${
                terfi *
                puantajXPMap.terfi
            } XP`
        );
    }

    if (egitim > 0) {
        satirlar.push(
            `${egitim}x Eğitim +${
                egitim *
                puantajXPMap.egitim
            } XP`
        );
    }

    if (tt > 0) {
        satirlar.push(
            `${tt}x Toplu Terfi +${
                tt *
                puantajXPMap.tt
            } XP`
        );
    }

    if (lisans > 0) {
        satirlar.push(
            `${lisans}x Lisans +${
                lisans *
                puantajXPMap.lisans
            } XP`
        );
    }

    if (mr > 0) {
        satirlar.push(
            `${mr}x MR +${
                mr *
                puantajXPMap.mr
            } XP`
        );
    }

    return satirlar;
}

function cezaSatirlari() {
    const satirlar = [];

    if (
        sureCeza?.checked
    ) {
        satirlar.push(
            "Süre Atmadı -10 XP"
        );
    }

    if (
        ttCeza?.checked
    ) {
        satirlar.push(
            "Toplu Terfi Dağıtmadı -20 XP"
        );
    }

    if (
        lisansCeza?.checked
    ) {
        satirlar.push(
            "Lisans Dağıtmadı -20 XP"
        );
    }

    return satirlar;
}

/* =========================================
   DISCORD METNİ
========================================= */

function discordRaporuOlustur() {
    const personel =
        String(
            personelInput?.value ||
            ""
        ).trim();

    const faaliyetler =
        raporSatirlari();

    const cezalar =
        cezaSatirlari();

    const normalPuan =
        hesaplaNormalPuan();

    const netNormalPuan =
        hesaplaNetNormalPuan();

    const ekstraPuan =
        ekstraXP();

    const yeniXP =
        hesaplaYeniXP();

    const esCoin =
        hesaplaEsCoin();

    const satirlar = [
        "📊 Personel Puantaj Bildirimi",
        "",
        `Personel: ${
            personel ||
            "Personel"
        }`,
        ""
    ];

    faaliyetler.forEach(
        faaliyet => {
            satirlar.push(
                faaliyet
            );
        }
    );

    satirlar.push("");
    satirlar.push(
        `Normal Puan: ${normalPuan} / 75`
    );

    if (
        cezalar.length > 0
    ) {
        satirlar.push("");
        satirlar.push("Cezalar:");

        cezalar.forEach(
            ceza => {
                satirlar.push(
                    ceza
                );
            }
        );
    }

    satirlar.push("");
    satirlar.push(
        `Net Normal Puan: ${netNormalPuan} XP`
    );

    satirlar.push(
        `Ekstra Puan: ${
            ekstraPuan >= 0
                ? "+"
                : ""
        }${ekstraPuan} XP`
    );

    satirlar.push(
        `Mevcut XP: ${mevcutXP()} XP`
    );

    satirlar.push(
        `Yeni XP: ${yeniXP} XP`
    );

    satirlar.push(
        `Eş Coin: ${
            esCoin === 1
                ? "1 adet kazandı"
                : "Kazanamadı"
        }`
    );

    window.discordMesaji =
        satirlar.join("\n");

    return window.discordMesaji;
}

/* =========================================
   PERSONEL LİSTESİ
========================================= */

function puantajHtmlTemizle(
    deger
) {

    return String(
        deger ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

function puantajPersonelSirala(
    personeller
) {

    return [
        ...personeller
    ].sort(
        (
            birinci,
            ikinci
        ) =>
            ikinci.xp -
            birinci.xp
    );
}

function puantajPersonelSec(
    kullaniciAdi,
    xp
) {

    if (personelInput) {

        personelInput.value =
            kullaniciAdi;
    }

    if (mevcutXPInput) {

        mevcutXPInput.value =
            String(xp);
    }

    ozetYazdir();

    mrInput?.focus();

    puantajMesajGoster(
        `${kullaniciAdi} puantaj formuna aktarıldı.`,
        "success"
    );
}

function puantajPersonelListesiniGoster(
    personeller
) {

    if (!puantajPersonelListesi) {
        return;
    }

    const liste =
        Array.isArray(
            personeller
        )
            ? personeller
            : [];

    if (puantajPersonelSayisi) {

        puantajPersonelSayisi.textContent =
            `${liste.length} personel`;
    }

    if (liste.length === 0) {

        puantajPersonelListesi.innerHTML = `
            <div class="puantaj-personel-bos">
                Aranan personel bulunamadı.
            </div>
        `;

        return;
    }

    puantajPersonelListesi.innerHTML =
        puantajPersonelSirala(
            liste
        )
            .map(
                personel => {

                    const guvenliAd =
                        puantajHtmlTemizle(
                            personel.kullaniciAdi
                        );

                    const guvenliXP =
                        Number(
                            personel.xp || 0
                        );

                    return `
                        <button
                            type="button"
                            class="puantaj-personel-satiri"
                            data-kullanici-adi="${guvenliAd}"
                            data-personel-xp="${guvenliXP}">

                            <span class="puantaj-personel-adi">
                                ${guvenliAd}
                            </span>

                            <strong class="puantaj-personel-xp">
                                ${guvenliXP} XP
                            </strong>

                        </button>
                    `;
                }
            )
            .join("");

    puantajPersonelListesi
        .querySelectorAll(
            ".puantaj-personel-satiri"
        )
        .forEach(
            satir => {

                satir.addEventListener(
                    "click",
                    () => {

                        puantajPersonelSec(
                            satir.dataset
                                .kullaniciAdi,

                            Number(
                                satir.dataset
                                    .personelXp
                            )
                        );
                    }
                );
            }
        );
}

function puantajPersonelAra() {

    const aranan =
        String(
            puantajPersonelAraInput
                ?.value || ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (!aranan) {

        puantajPersonelListesiniGoster(
            puantajPersonelVerileri
        );

        return;
    }

    const bulunanlar =
        puantajPersonelVerileri.filter(
            personel =>
                String(
                    personel.kullaniciAdi
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    )
                    .includes(
                        aranan
                    )
        );

    puantajPersonelListesiniGoster(
        bulunanlar
    );
}

function puantajPersonelAdindanXPGetir() {

    const personelAdi =
        String(
            personelInput?.value ||
            ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (!personelAdi) {
        return;
    }

    const personel =
        puantajPersonelVerileri.find(
            kayit =>
                String(
                    kayit.kullaniciAdi
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    ) ===
                personelAdi
        );

    if (!personel) {
        return;
    }

    mevcutXPInput.value =
        String(
            personel.xp
        );

    ozetYazdir();
}

/* =========================================
   FORM KONTROLÜ
========================================= */

function puantajFormunuDogrula() {
    const personel =
        String(
            personelInput?.value ||
            ""
        ).trim();

    if (!personel) {
        puantajMesajGoster(
            "Personel adını yazın.",
            "warning"
        );

        personelInput?.focus();

        return false;
    }

    return true;
}

/* =========================================
   POPUP
========================================= */

function puantajSonucunuGoster() {
    if (
        !puantajFormunuDogrula()
    ) {
        return;
    }

    const personel =
        String(
            personelInput.value
        ).trim();

    const normalPuan =
        hesaplaNormalPuan();

    const ceza =
        hesaplaCeza();

    const netNormalPuan =
        hesaplaNetNormalPuan();

    const ekstraPuan =
        ekstraXP();

    const yeniXP =
        hesaplaYeniXP();

    const esCoin =
        hesaplaEsCoin();

    const esCoinRenk =
        esCoin === 1
            ? "#36d17c"
            : "#ffb347";

    const popupIcerik = `
        <table class="popup-table">

            <tr>
                <td>👤 Personel</td>
                <td>${puantajHtmlTemizle(personel)}</td>
            </tr>

            <tr>
                <td>⭐ Normal Puan</td>
                <td>${normalPuan} / 75 XP</td>
            </tr>

            <tr>
                <td>⚠️ Ceza</td>
                <td>-${ceza} XP</td>
            </tr>

            <tr>
                <td>📊 Net Normal Puan</td>
                <td>${netNormalPuan} XP</td>
            </tr>

            <tr>
                <td>➕ Ekstra Puan</td>
                <td>
                    ${
                        ekstraPuan >= 0
                            ? "+"
                            : ""
                    }${ekstraPuan} XP
                </td>
            </tr>

            <tr>
                <td>📌 Mevcut XP</td>
                <td>${mevcutXP()} XP</td>
            </tr>

            <tr>
                <td>🏁 Yeni XP</td>
                <td>${yeniXP} XP</td>
            </tr>

            <tr>
                <td>🪙 Eş Coin</td>

                <td
                    style="
                        color:${esCoinRenk};
                        font-size:18px;
                        font-weight:900;
                    ">

                    ${
                        esCoin === 1
                            ? "1 Eş Coin kazandı"
                            : "Eş Coin kazanamadı"
                    }

                </td>
            </tr>

        </table>
    `;

    discordRaporuOlustur();

    window.puantajCheckData = {
        personnelName:
            personel,

        currentXP:
            mevcutXP(),

        normalScore:
            normalPuan,

        penalty:
            ceza,

        netNormalScore:
            netNormalPuan,

        extraScore:
            ekstraPuan,

        newXP:
            yeniXP,

        earnedEsCoin:
            esCoin
    };

    if (
        typeof showPopup ===
        "function"
    ) {
        showPopup(
            "Puantaj Hesaplandı",
            popupIcerik,
            "success",
            "oyun"
        );

        return;
    }

    puantajMesajGoster(
        "Puantaj hesaplandı.",
        "success"
    );
}

/* =========================================
   FORM TEMİZLE
========================================= */

function puantajTemizle() {
    if (personelInput) {
        personelInput.value = "";
    }

    if (mevcutXPInput) {
        mevcutXPInput.value = "";
    }

    if (ekstraXPInput) {
        ekstraXPInput.value = "0";
    }

    [
        mrInput,
        terfiInput,
        egitimInput,
        ttInput,
        lisansInput,
        aktifInput,
        calismaInput
    ].forEach(
        input => {
            if (input) {
                input.value = "0";
            }
        }
    );

    if (sureCeza) {
        sureCeza.checked = false;
    }

    if (ttCeza) {
        ttCeza.checked = false;
    }

    if (lisansCeza) {
        lisansCeza.checked = false;
    }

    window.discordMesaji = "";
    window.puantajCheckData = null;

    ozetYazdir();

    puantajMesajGoster(
        "Puantaj temizlendi.",
        "success"
    );
}

/* =========================================
   EVENTLER
========================================= */

const puantajCanliInputlar = [
    mevcutXPInput,
    ekstraXPInput,
    mrInput,
    terfiInput,
    egitimInput,
    ttInput,
    lisansInput,
    aktifInput,
    calismaInput,
    sureCeza,
    ttCeza,
    lisansCeza
];

puantajCanliInputlar.forEach(
    eleman => {
        eleman?.addEventListener(
            "input",
            ozetYazdir
        );

        eleman?.addEventListener(
            "change",
            ozetYazdir
        );
    }
);

puantajBtn?.addEventListener(
    "click",
    puantajSonucunuGoster
);

puantajTemizleBtn?.addEventListener(
    "click",
    puantajTemizle
);

puantajPersonelAraInput
    ?.addEventListener(
        "input",
        puantajPersonelAra
    );

personelInput
    ?.addEventListener(
        "change",
        puantajPersonelAdindanXPGetir
    );

personelInput
    ?.addEventListener(
        "blur",
        puantajPersonelAdindanXPGetir
    );

/* =========================================
   BAŞLAT
========================================= */

window.puantajCheckData = null;

ozetYazdir();

puantajPersonelListesiniGoster(
    puantajPersonelVerileri
);