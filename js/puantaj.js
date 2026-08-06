/*=========================================
            CSI PUANTAJ SİSTEMİ
            Bölüm 1
=========================================*/

const puantajXPMap = {

    mr:1,
    terfi:3,
    egitim:5,
    tt:10,
    lisans:10,
    aktif:1,
    calisma:3

};

const puantajCezaMap={

    sure:10,
    tt:20,
    lisans:20

};

/*=========================================
            ELEMENTLER
=========================================*/

const personelInput=document.getElementById("puantajPersonel");

const mevcutXPInput=document.getElementById("puantajXP");

const rutbeSelect=document.getElementById("puantajRutbe");

const mrInput=document.getElementById("mrSayi");

const terfiInput=document.getElementById("terfiSayi");

const egitimInput=document.getElementById("egitimSayi");

const ttInput=document.getElementById("ttSayi");

const lisansInput=document.getElementById("lisansSayi");

const aktifInput=document.getElementById("aktifSaat");

const calismaInput=document.getElementById("calismaSaat");

const sureCeza=document.getElementById("cezaSure");

const ttCeza=document.getElementById("cezaTT");

const lisansCeza=document.getElementById("cezaLisans");

const toplamSpan=document.getElementById("toplamXP");

const cezaSpan=document.getElementById("cezaXP");

const netSpan=document.getElementById("netXP");


/*=========================================
        SAYI ALMA
=========================================*/

function sayiAl(input){

    const deger=parseInt(input.value);

    if(isNaN(deger))
        return 0;

    return deger;

}

/*=========================================
        KAZANILAN XP
=========================================*/

function hesaplaKazanilanXP(){

    let xp=0;

    xp+=sayiAl(mrInput)*puantajXPMap.mr;

    xp+=sayiAl(terfiInput)*puantajXPMap.terfi;

    xp+=sayiAl(egitimInput)*puantajXPMap.egitim;

    xp+=sayiAl(ttInput)*puantajXPMap.tt;

    xp+=sayiAl(lisansInput)*puantajXPMap.lisans;

    xp+=sayiAl(aktifInput)*puantajXPMap.aktif;

    xp+=sayiAl(calismaInput)*puantajXPMap.calisma;

    return xp;

}

/*=========================================
            CEZA
=========================================*/

function hesaplaCeza(){

    let ceza=0;

    if(sureCeza.checked)
        ceza+=puantajCezaMap.sure;

    if(ttCeza.checked)
        ceza+=puantajCezaMap.tt;

    if(lisansCeza.checked)
        ceza+=puantajCezaMap.lisans;

    return ceza;

}

/*=========================================
            TOPLAM
=========================================*/

function guncelleOzet(){

    let kazanilan=hesaplaKazanilanXP();

    const ceza=hesaplaCeza();

    if(kazanilan>75)
        kazanilan=75;

    const net=kazanilan-ceza;

    toplamSpan.textContent=kazanilan+" XP";

    cezaSpan.textContent="-"+ceza+" XP";

    netSpan.textContent=net+" XP";

}

/*=========================================
        EVENTLER
=========================================*/

const inputlar=[

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

inputlar.forEach(eleman=>{

    eleman.addEventListener("input",guncelleOzet);

    eleman.addEventListener("change",guncelleOzet);

});

guncelleOzet();

/*=========================================
        RÜTBE - YENİ XP
=========================================*/

function mevcutXP(){

    const xp=parseInt(mevcutXPInput.value);

    if(isNaN(xp))
        return 0;

    return xp;

}

function hedefXP(){

    const hedef=parseInt(rutbeSelect.value);

    if(isNaN(hedef))
        return 0;

    return hedef;

}

function hesaplaNetXP(){

    let kazanilan=hesaplaKazanilanXP();

    if(kazanilan>75)
        kazanilan=75;

    return kazanilan-hesaplaCeza();

}

function yeniXP(){

    return mevcutXP()+hesaplaNetXP();

}

/*=========================================
            ÖZET KUTUSU
=========================================*/

function ozetYazdir(){

    let kazanilan=hesaplaKazanilanXP();

    if(kazanilan>75)
        kazanilan=75;

    const ceza=hesaplaCeza();

    const net=hesaplaNetXP();

    toplamSpan.textContent=kazanilan+" XP";

    cezaSpan.textContent="-"+ceza+" XP";

    netSpan.textContent=net+" XP";

    if(document.getElementById("mevcutXPText")){

        document.getElementById("mevcutXPText").innerHTML=
            mevcutXP()+" / "+hedefXP()+" XP";

    }

    if(document.getElementById("yeniXPText")){

        document.getElementById("yeniXPText").innerHTML=
            yeniXP()+" / "+hedefXP()+" XP";

    }

}

/*=========================================
            EVENT
=========================================*/

[
    mevcutXPInput,
    rutbeSelect
].forEach(eleman=>{

    eleman.addEventListener("input",ozetYazdir);

    eleman.addEventListener("change",ozetYazdir);

});

inputlar.forEach(eleman=>{

    eleman.addEventListener("input",ozetYazdir);

    eleman.addEventListener("change",ozetYazdir);

});

ozetYazdir();

/*=========================================
        DISCORD RAPORU
=========================================*/

function bugunTarih(){

    const tarih=new Date();

    let gun=tarih.getDate();
    let ay=tarih.getMonth()+1;
    let yil=tarih.getFullYear();

    if(gun<10) gun="0"+gun;
    if(ay<10) ay="0"+ay;

    return `${gun}.${ay}.${yil}`;

}

function raporSatirlari(){

    const satirlar=[];

    if(sayiAl(aktifInput)>0){

        satirlar.push(
            `${sayiAl(aktifInput)} saat süre +${sayiAl(aktifInput)}XP`
        );

    }

    if(sayiAl(calismaInput)>0){

        satirlar.push(
            `${sayiAl(calismaInput)} saat çalışma süresi +${sayiAl(calismaInput)*3}XP`
        );

    }

    if(sayiAl(terfiInput)>0){

        satirlar.push(
            `${sayiAl(terfiInput)}X Terfi +${sayiAl(terfiInput)*3}XP`
        );

    }

    if(sayiAl(egitimInput)>0){

        satirlar.push(
            `${sayiAl(egitimInput)}X Eğitim +${sayiAl(egitimInput)*5}XP`
        );

    }

    if(sayiAl(ttInput)>0){

        satirlar.push(
            `${sayiAl(ttInput)}X TT +${sayiAl(ttInput)*10}XP`
        );

    }

    if(sayiAl(lisansInput)>0){

        satirlar.push(
            `${sayiAl(lisansInput)}X Lisans +${sayiAl(lisansInput)*10}XP`
        );

    }

    if(sayiAl(mrInput)>0){

        satirlar.push(
            `${sayiAl(mrInput)}X MR +${sayiAl(mrInput)}XP`
        );

    }

    return satirlar;

}

function cezaSatirlari(){

    const liste=[];

    if(sureCeza.checked){

        liste.push("Süre Atmadı -10XP");

    }

    if(ttCeza.checked){

        liste.push("Toplu Terfi Dağıtmadı -20XP");

    }

    if(lisansCeza.checked){

        liste.push("Lisans Dağıtmadı -20XP");

    }

    return liste;

}
/*=========================================
        DISCORD RAPORU OLUŞTUR
=========================================*/

function discordRaporuOlustur(){

    const satirlar=[];

    const faaliyetler=raporSatirlari();

    const cezalar=cezaSatirlari();

    satirlar.push(personelInput.value || "Personel");

    satirlar.push("");

    satirlar.push(bugunTarih());

    satirlar.push("");

    faaliyetler.forEach(x=>{

        satirlar.push(x);

    });

    satirlar.push("");

    let kazanilan=hesaplaKazanilanXP();

    if(kazanilan>75){

        satirlar.push("Toplam: Max Puan +75XP");

        kazanilan=75;

    }else{

        satirlar.push(`Toplam: +${kazanilan}XP`);

    }

    if(cezalar.length>0){

        satirlar.push("");

        satirlar.push("Cezalar");

        satirlar.push("");

        cezalar.forEach(c=>{

            satirlar.push(c);

        });

    }

    satirlar.push("");

    const net=hesaplaNetXP();

    if(net>=0){

        satirlar.push(`Net XP: +${net}XP`);

    }else{

        satirlar.push(`Net XP: ${net}XP`);

    }

    satirlar.push("");

    satirlar.push(
        `Mevcut XP: ${mevcutXP()}XP / ${hedefXP()}XP`
    );

    satirlar.push("");

    satirlar.push(
        `Yeni XP: ${yeniXP()}XP / ${hedefXP()}XP`
    );


    window.discordMesaji = satirlar.join("\n");

    return window.discordMesaji;    

}
/*=========================================
        KOPYALAMA
=========================================*/

async function discordKopyala(){

    const rapor=discordRaporuOlustur();

    try{

        await navigator.clipboard.writeText(rapor);

        if(typeof showPopup==="function"){

            showPopup("Discord raporu panoya kopyalandı.");

        }else if(typeof showToast==="function"){

            showToast("Discord raporu panoya kopyalandı.");

        }else{

            alert("Discord raporu panoya kopyalandı.");

        }

    }catch{

        alert(rapor);

    }

}
/*=========================================
            BUTON
=========================================*/

const puantajBtn=document.getElementById("puantajBtn");
if (puantajBtn) {

    puantajBtn.addEventListener("click", () => {

        const rapor = discordRaporuOlustur();

        showPopup(
            "Puantaj Önizleme",
            `<pre class="discord-preview">${rapor}</pre>`,
            "success",
            "toplu"
        );

    });

}

/*=========================================
            FORM TEMİZLE
=========================================*/

function puantajTemizle(){

    personelInput.value="";

    mevcutXPInput.value="";

    rutbeSelect.selectedIndex=0;

    [
        mrInput,
        terfiInput,
        egitimInput,
        ttInput,
        lisansInput,
        aktifInput,
        calismaInput

    ].forEach(input=>{

        input.value=0;

    });

    sureCeza.checked=false;
    ttCeza.checked=false;
    lisansCeza.checked=false;

    ozetYazdir();

}


/*=========================================
        KALAN XP
=========================================*/

function kalanXP(){

    const kalan=hedefXP()-yeniXP();

    if(kalan<0)
        return 0;

    return kalan;

}


/*=========================================
        HEDEF TAMAMLANDI MI
=========================================*/

function hedefTamamlandi(){

    return yeniXP()>=hedefXP() && hedefXP()>0;

}


/*=========================================
        DURUM METNİ
=========================================*/

function durumMesaji(){

    if(hedefXP()==0)
        return "";

    if(hedefTamamlandi()){

        return "🎉 Rütbe XP hedefi tamamlandı.";

    }

    return `Kalan XP : ${kalanXP()} XP`;

}


/*=========================================
        RAPOR ÖNİZLEME
=========================================*/

function raporuGoster(){

    const alan=document.getElementById("discordPreview");

    if(!alan)
        return;

    alan.textContent=discordRaporuOlustur();

}


/*=========================================
        CANLI GÜNCELLE
=========================================*/

function puantajCanliGuncelle(){

    ozetYazdir();

    raporuGoster();

    const durum=document.getElementById("hedefDurum");

    if(durum){

        durum.textContent=durumMesaji();

    }

}

[
    personelInput,
    mevcutXPInput,
    rutbeSelect,
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

].forEach(eleman=>{

    eleman.addEventListener("input",puantajCanliGuncelle);

    eleman.addEventListener("change",puantajCanliGuncelle);

});

puantajCanliGuncelle();

/*=========================================
        TEMİZLE BUTONU
=========================================*/

const puantajTemizleBtn=document.getElementById("puantajTemizleBtn");

if (puantajTemizleBtn) {

    puantajTemizleBtn.addEventListener("click", () => {

        document.getElementById("puantajPersonel").value = "";
        document.getElementById("puantajXP").value = "";
        document.getElementById("puantajRutbe").selectedIndex = 0;

        document.getElementById("mrSayi").value = 0;
        document.getElementById("terfiSayi").value = 0;
        document.getElementById("egitimSayi").value = 0;
        document.getElementById("ttSayi").value = 0;
        document.getElementById("lisansSayi").value = 0;
        document.getElementById("aktifSaat").value = 0;
        document.getElementById("calismaSaat").value = 0;

        document.getElementById("cezaSure").checked = false;
        document.getElementById("cezaTT").checked = false;
        document.getElementById("cezaLisans").checked = false;

        puantajCanliGuncelle();

        showToast("Puantaj temizlendi.","success");

    });

}

if(puantajTemizleBtn){

    puantajTemizleBtn.addEventListener("click",()=>{

        puantajTemizle();

        raporuGoster();

    });

}

/*=========================================
        SAYFA AÇILIŞI
=========================================*/

window.addEventListener("load",()=>{

    puantajCanliGuncelle();

    raporuGoster();

});