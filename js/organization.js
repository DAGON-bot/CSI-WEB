const previewMembers = [
    {
        name: "Oyuncu943",
        role: "Ortak Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "FoundersTR",
        role: "Ortak Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "canart0",
        role: "Owner",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "CoiledTrash",
        role: "Ast Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "1Rarefs",
        role: "Üst Kurucu",
        avatar: "assets/avatars/default.png"
    },

    // Kurucular

    {
        name: "Boş",
        role: "1. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "Boş",
        role: "2. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "NerdesInpango",
        role: "3. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "_-Yuşa-_",
        role: "4. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "yasar144",
        role: "5. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "-Emir100",
        role: "6. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "Ceyhun1034",
        role: "7. Kurucu",
        avatar: "assets/avatars/default.png"
    },
    {
        name: "Boş",
        role: "8. Kurucu",
        avatar: "assets/avatars/default.png"
    }
];
const organization = {

    founders: [
        {
            name:"Oyuncu943",
            role:"Ortak Kurucu"
        },
        {
            name:"FoundersTR",
            role:"Ortak Kurucu"
        }
    ],

    owner:{
        name:"canart0",
        role:"Owner"
    },

    deputy:{
        name:"CoiledTrash",
        role:"Ast Kurucu"
    },

    senior:{
        name:"1Rarefs",
        role:"Üst Kurucu"
    },

    foundersList:[
        "Boş",
        "Boş",
        "NerdesInpango",
        "_-Yuşa-_",
        "yasar144",
        "-Emir100",
        "Ceyhun1034",
        "Boş"
    ]

};

let current = 0;

const container = document.getElementById("organizationContainer");

function renderSlider(){

    container.innerHTML="";

    for(let i=0;i<3;i++){

        const member =
        previewMembers[
        (current+i)%previewMembers.length];

        container.innerHTML+=`

        <div class="preview-card">

            <div class="preview-avatar">

                <img src="${member.avatar}" alt="">

            </div>

            <h3>${member.name}</h3>

            <span>${member.role}</span>

        </div>

        `;

    }

}

renderSlider();

document.getElementById("nextOrg").onclick=()=>{

    current++;

    if(current>=previewMembers.length)
        current=0;

    renderSlider();

};

document.getElementById("prevOrg").onclick=()=>{

    current--;

    if(current<0)
        current=previewMembers.length-1;

    renderSlider();

};

const popup=document.getElementById("organizationPopup");

document.getElementById("openOrganization").onclick=()=>{

    popup.classList.add("active");

    renderOrganizationTree();

};

document.getElementById("closeOrganization").onclick=()=>{

    popup.classList.remove("active");

};

popup.onclick=(e)=>{

    if(e.target===popup){

        popup.classList.remove("active");

    }

};

function renderOrganizationTree(){

const box=document.getElementById("organizationPopupContent");

box.innerHTML=`

<h2 class="tree-title">

Kurucu Organizasyon Şeması

</h2>

<p class="tree-subtitle">

CSI Community yönetim yapısı

</p>

<div class="tree-level tree-two">

${memberCard(organization.founders[0])}

${memberCard(organization.founders[1])}

</div>

<div class="tree-line"></div>

<div class="tree-level">

${memberCard(organization.owner)}

</div>

<div class="tree-line"></div>

<div class="tree-level">

${memberCard(organization.deputy)}

</div>

<div class="tree-line"></div>

<div class="tree-level">

${memberCard(organization.senior)}

</div>

<div class="tree-line"></div>

<div class="tree-grid">

${organization.foundersList.map((name,index)=>`

<div class="tree-small">

<div class="preview-avatar small"></div>

<h4>${name}</h4>

<span>${index+1}. Kurucu</span>

</div>

`).join("")}

</div>

`;

}

function memberCard(member){

return`

<div class="tree-card">

<div class="preview-avatar"></div>

<h3>${member.name}</h3>

<span>${member.role}</span>

</div>

`;

}