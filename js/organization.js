const organizationMembers = [

    // ORTAK KURUCULAR

    {
        name: "Oyuncu943",
        role: "Ortak Kurucu",
        avatar: "assets/founders/oyuncu943.png",
        position: "founder"
    },

    {
        name: "FoundersTR",
        role: "Ortak Kurucu",
        avatar: "assets/founders/founderstr.png",
        position: "founder"
    },

    // OWNER

    {
    name: "canart0",
    role: "Owner",
    avatar: "assets/founders/canart0.png",
    position: "owner"
},

    // AS KURUCU

    {
        name: "CoiledTrash",
        role: "AS Kurucu",
        avatar: "assets/founders/coiledtrash.png",
        position: "deputy"
    },

    // ÜST KURUCU

    {
        name: "1Rarefs",
        role: "Üst Kurucu",
        avatar: "assets/founders/1rarefs.png",
        position: "senior"
    },

    // KURUCULAR

    {
        name: "Boş",
        role: "1. Kurucu",
        avatar: "assets/logo.png",
        position: "manager"
    },

    {
        name: "Boş",
        role: "2. Kurucu",
        avatar: "assets/logo.png",
        position: "manager"
    },

    {
        name: "NerdesInpango",
        role: "3. Kurucu",
        avatar: "assets/founders/nerdesinpango.png",
        position: "manager"
    },

    {
        name: "_-Yuşa-_",
        role: "4. Kurucu",
        avatar: "assets/founders/yusa.png",
        position: "manager"
    },

    {
        name: "yasar144",
        role: "5. Kurucu",
        avatar: "assets/founders/yasar144.png",
        position: "manager"
    },

    {
        name: "-Emir100",
        role: "6. Kurucu",
        avatar: "assets/founders/emir100.png",
        position: "manager"
    },

    {
        name: "Ceyhun1034",
        role: "7. Kurucu",
        avatar: "assets/founders/ceyhun1034.png",
        position: "manager"
    },

    {
        name: "Boş",
        role: "8. Kurucu",
        avatar: "assets/logo.png",
        position: "manager"
    },

    // FOUNDERS

{
    name: "berymiy",
    role: "Founder",
    avatar: "assets/founders/berymiy.png",
    position: "eliteFounder"
},

{
    name: "Hertabe",
    role: "Founder",
    avatar: "assets/founders/hertabe.png",
    position: "eliteFounder"
},

// HAK SAHİPLERİ

{
    name: "NADA",
    role: "Hak Sahibi",
    avatar: "assets/founders/NADA.png",
    position: "rightsOwner"
},

{
    name: "Boş",
    role: "Hak Sahibi",
    avatar: "assets/logo.png",
    position: "rightsOwner"
},

{
    name: "Softie",
    role: "Hak Sahibi",
    avatar: "assets/founders/softie.png",
    position: "rightsOwner"
},

{
    name: "ahmetrucha88",
    role: "Hak Sahibi",
    avatar: "assets/founders/ahmetrucha88.png",
    position: "rightsOwner"
}

];


// ===============================
// ANA SAYFADAKİ KAYDIRMALI KARTLAR
// ===============================

let current = 0;

const container =
    document.getElementById("organizationContainer");


function getSafeAvatar(member) {

    return member.avatar || "assets/logo.png";

}


function createAvatarImage(member) {

    const avatarPath =
        member?.avatar || "assets/logo.png";

    return `
        <img
            src="${avatarPath}"
            alt="${member?.name || "Kullanıcı"}"
            onerror="this.onerror=null; this.src='assets/logo.png';">
    `;

}


function renderSlider() {

    if (!container) {
        return;
    }

    container.innerHTML = "";

    for (let i = 0; i < 3; i++) {

        const member =
            organizationMembers[
                (current + i) % organizationMembers.length
            ];

        container.innerHTML += `
            <div class="preview-card">

                <div class="preview-avatar">
                    ${createAvatarImage(member)}
                </div>

                <h3>${member.name}</h3>

                <span>${member.role}</span>

            </div>
        `;

    }

}


renderSlider();


const nextOrg =
    document.getElementById("nextOrg");

const prevOrg =
    document.getElementById("prevOrg");


nextOrg?.addEventListener("click", () => {

    current++;

    if (current >= organizationMembers.length) {
        current = 0;
    }

    renderSlider();

});


prevOrg?.addEventListener("click", () => {

    current--;

    if (current < 0) {
        current = organizationMembers.length - 1;
    }

    renderSlider();

});


// ===============================
// ORGANİZASYON POPUP
// ===============================

const popup =
    document.getElementById("organizationPopup");

const openOrganization =
    document.getElementById("openOrganization");

const closeOrganization =
    document.getElementById("closeOrganization");


openOrganization?.addEventListener("click", () => {

    popup?.classList.add("active");

    renderOrganizationTree();

});


closeOrganization?.addEventListener("click", () => {

    popup?.classList.remove("active");

});


popup?.addEventListener("click", (event) => {

    if (event.target === popup) {
        popup.classList.remove("active");
    }

});


document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {
        popup?.classList.remove("active");
    }

});


// ===============================
// ORGANİZASYON ŞEMASI
// ===============================

function getMembersByPosition(position) {

    return organizationMembers.filter(
        member => member.position === position
    );

}


function getMemberByPosition(position) {

    return organizationMembers.find(
        member => member.position === position
    );

}


function renderOrganizationTree() {

    const box =
        document.getElementById(
            "organizationPopupContent"
        );

    if (!box) {
        return;
    }

    const founders =
        getMembersByPosition("founder");

    const owner =
        getMemberByPosition("owner");

    const deputy =
        getMemberByPosition("deputy");

    const senior =
        getMemberByPosition("senior");

    const managers =
        getMembersByPosition("manager");

    const eliteFounders =
    getMembersByPosition(
        "eliteFounder"
    );

const rightsOwners =
    getMembersByPosition(
        "rightsOwner"
    );

    box.innerHTML = `

        <h2 class="tree-title">
            Kurucu Organizasyon Şeması
        </h2>

        <p class="tree-subtitle">
            CSI Community yönetim yapısı
        </p>

        <div class="tree-level tree-two">

            ${founders
                .map(member => memberCard(member))
                .join("")}

        </div>

        <div class="tree-line"></div>

        <div class="tree-level">

            ${memberCard(owner)}

        </div>

        <div class="tree-line"></div>

        <div class="tree-level">

            ${memberCard(deputy)}

        </div>

        <div class="tree-line"></div>

        <div class="tree-level">

            ${memberCard(senior)}

        </div>

        <div class="tree-line"></div>

        <div class="tree-grid">

            ${managers
                .map(member => smallMemberCard(member))
                .join("")}

        </div>

        <div class="tree-line"></div>

<h3 class="tree-group-title">
    Founders
</h3>

<div class="tree-level tree-two">

    ${eliteFounders
        .map(member => memberCard(member))
        .join("")}

</div>

<div class="tree-line"></div>

<h3 class="tree-group-title">
    Hak Sahipleri
</h3>

<div class="tree-grid">

    ${rightsOwners
        .map(member => smallMemberCard(member))
        .join("")}

</div>

    `;

}


function memberCard(member) {

    if (!member) {
        return "";
    }

    return `
        <div class="tree-card">

            <div class="preview-avatar">

                ${createAvatarImage(member)}

            </div>

            <h3>${member.name}</h3>

            <span>${member.role}</span>

        </div>
    `;

}


function smallMemberCard(member) {

    if (!member) {
        return "";
    }

    return `
        <div class="tree-small">

            <div class="preview-avatar small">

                ${createAvatarImage(member)}

            </div>

            <h4>${member.name}</h4>

            <span>${member.role}</span>

        </div>
    `;

}