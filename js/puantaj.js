// ========================================
// CSI YENİ PUANTAJ SİSTEMİ
// ========================================

"use strict";

// ========================================
// SABİT KURALLAR
// ========================================

const MAX_NORMAL_SCORE = 75;
const ES_COIN_REWARD = 1;

// ========================================
// GEÇİCİ PERSONEL VERİLERİ
// ========================================
//
// Backend bağlantısına kadar bu liste frontend
// üzerinde kullanılacaktır.
//

const puantajPersonnelData = [
    {
        username: "oheling",
        xp: 833
    },
    {
        username: "mirindaa",
        xp: 342
    },
    {
        username: "slaysu",
        xp: 40
    },
    {
        username: "nyara",
        xp: 614
    },
    {
        username: "harikaresul34",
        xp: 449
    },
    {
        username: "Angela",
        xp: 920
    },
    {
        username: "bln2323",
        xp: 196
    },
    {
        username: "cbenescb",
        xp: 903
    },
    {
        username: "cute",
        xp: -1
    },
    {
        username: "çağrı1903",
        xp: 482
    },
    {
        username: "çomar",
        xp: 215
    },
    {
        username: "gorken",
        xp: 72
    },
    {
        username: "drakmir",
        xp: 205
    },
    {
        username: "blub",
        xp: 33
    },
    {
        username: "nur58",
        xp: 8
    },
    {
        username: "sadenok",
        xp: -40
    },
    {
        username: "google-amca",
        xp: -18
    },
    {
        username: "rockstar1881",
        xp: -129
    },
    {
        username: "teddiciq19",
        xp: 271
    },
    {
        username: "infillame",
        xp: -19
    }
];

// ========================================
// HTML ELEMENTLERİ
// ========================================

const puantajElements = {
    panel:
        document.getElementById(
            "puantaj"
        ),

    personnelInput:
        document.getElementById(
            "puantajPersonel"
        ),

    currentXPInput:
        document.getElementById(
            "puantajMevcutXP"
        ),

    normalScoreInput:
        document.getElementById(
            "puantajNormalPuan"
        ),

    extraScoreInput:
        document.getElementById(
            "puantajEkstraPuan"
        ),

    officerInput:
        document.getElementById(
            "puantajYetkili"
        ),

    currentXPSummary:
        document.getElementById(
            "puantajMevcutXPOzet"
        ),

    normalScoreSummary:
        document.getElementById(
            "puantajNormalPuanOzet"
        ),

    extraScoreSummary:
        document.getElementById(
            "puantajEkstraPuanOzet"
        ),

    newXPSummary:
        document.getElementById(
            "puantajYeniXP"
        ),

    coinCard:
        document.getElementById(
            "puantajCoinCard"
        ),

    coinStatus:
        document.getElementById(
            "puantajCoinDurumu"
        ),

    coinDescription:
        document.getElementById(
            "puantajCoinAciklama"
        ),

    calculateButton:
        document.getElementById(
            "puantajBtn"
        ),

    clearButton:
        document.getElementById(
            "puantajTemizleBtn"
        ),

    personnelSearch:
        document.getElementById(
            "puantajPersonelAra"
        ),

    personnelCount:
        document.getElementById(
            "puantajPersonelSayisi"
        ),

    personnelList:
        document.getElementById(
            "puantajPersonelListesi"
        )
};

// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================

function showPuantajMessage(
    message,
    type = "info"
) {

    if (
        typeof showToast ===
        "function"
    ) {

        showToast(
            message,
            type
        );

        return;
    }

    console.log(
        `[Puantaj Sistemi] ${message}`
    );
}

function escapePuantajHtml(
    value
) {

    return String(
        value ?? ""
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

function normalizeIntegerInput(
    input,
    {
        minimum = null,
        maximum = null
    } = {}
) {

    if (!input) {
        return 0;
    }

    let value =
        Number.parseInt(
            input.value,
            10
        );

    if (
        !Number.isInteger(value)
    ) {

        value = 0;
    }

    if (
        Number.isInteger(minimum) &&
        value < minimum
    ) {

        value = minimum;
    }

    if (
        Number.isInteger(maximum) &&
        value > maximum
    ) {

        value = maximum;
    }

    input.value =
        String(value);

    return value;
}

function getCurrentXP() {

    return normalizeIntegerInput(
        puantajElements.currentXPInput
    );
}

function getNormalScore() {

    return normalizeIntegerInput(
        puantajElements.normalScoreInput,
        {
            minimum: 0,
            maximum:
                MAX_NORMAL_SCORE
        }
    );
}

function getExtraScore() {

    return normalizeIntegerInput(
        puantajElements.extraScoreInput,
        {
            minimum: -100000,
            maximum: 100000
        }
    );
}

function calculateNewXP() {

    return (
        getCurrentXP() +
        getNormalScore() +
        getExtraScore()
    );
}

function calculateCoinReward() {

    return (
        getNormalScore() ===
        MAX_NORMAL_SCORE
    )
        ? ES_COIN_REWARD
        : 0;
}

// ========================================
// ÖZET EKRANI
// ========================================

function updatePuantajSummary() {

    const currentXP =
        getCurrentXP();

    const normalScore =
        getNormalScore();

    const extraScore =
        getExtraScore();

    const newXP =
        currentXP +
        normalScore +
        extraScore;

    const earnedCoin =
        normalScore ===
        MAX_NORMAL_SCORE;

    if (
        puantajElements
            .currentXPSummary
    ) {

        puantajElements
            .currentXPSummary
            .textContent =
            `${currentXP} XP`;
    }

    if (
        puantajElements
            .normalScoreSummary
    ) {

        puantajElements
            .normalScoreSummary
            .textContent =
            `${normalScore} / ${MAX_NORMAL_SCORE}`;
    }

    if (
        puantajElements
            .extraScoreSummary
    ) {

        puantajElements
            .extraScoreSummary
            .textContent =
            extraScore >= 0
                ? `+${extraScore} XP`
                : `${extraScore} XP`;
    }

    if (
        puantajElements
            .newXPSummary
    ) {

        puantajElements
            .newXPSummary
            .textContent =
            `${newXP} XP`;
    }

    if (
        puantajElements
            .coinStatus
    ) {

        puantajElements
            .coinStatus
            .textContent =
            earnedCoin
                ? "1 Eş Coin Kazandı"
                : "Henüz kazanılmadı";
    }

    if (
        puantajElements
            .coinDescription
    ) {

        puantajElements
            .coinDescription
            .textContent =
            earnedCoin
                ? "Normal puan 75 olduğu için 1 Eş Coin hakkı kazanıldı."
                : `${MAX_NORMAL_SCORE - normalScore} normal puan daha gerekli.`;
    }

    if (
        puantajElements.coinCard
    ) {

        puantajElements
            .coinCard
            .classList
            .toggle(
                "earned",
                earnedCoin
            );
    }
}

// ========================================
// PERSONEL LİSTESİ
// ========================================

function sortPuantajPersonnel(
    personnel
) {

    return [
        ...personnel
    ].sort(
        (
            first,
            second
        ) =>
            second.xp -
            first.xp
    );
}

function renderPuantajPersonnelList(
    personnel
) {

    const list =
        puantajElements.personnelList;

    if (!list) {
        return;
    }

    const safePersonnel =
        Array.isArray(personnel)
            ? personnel
            : [];

    if (
        puantajElements
            .personnelCount
    ) {

        puantajElements
            .personnelCount
            .textContent =
            `${safePersonnel.length} personel`;
    }

    if (
        safePersonnel.length ===
        0
    ) {

        list.innerHTML = `
            <div class="puantaj-personnel-empty">
                Personel bulunamadı.
            </div>
        `;

        return;
    }

    list.innerHTML =
        sortPuantajPersonnel(
            safePersonnel
        )
            .map(
                personnel => {

                    const safeUsername =
                        escapePuantajHtml(
                            personnel.username
                        );

                    const safeXP =
                        Number(
                            personnel.xp || 0
                        );

                    return `
                        <button
                            type="button"
                            class="puantaj-personnel-row"
                            data-puantaj-username="${safeUsername}"
                            data-puantaj-xp="${safeXP}">

                            <span class="puantaj-personnel-name">
                                ${safeUsername}
                            </span>

                            <strong class="puantaj-personnel-xp">
                                ${safeXP} XP
                            </strong>

                        </button>
                    `;
                }
            )
            .join("");

    list
        .querySelectorAll(
            ".puantaj-personnel-row"
        )
        .forEach(
            row => {

                row.addEventListener(
                    "click",
                    () => {

                        selectPuantajPersonnel({
                            username:
                                row.dataset
                                    .puantajUsername,

                            xp:
                                Number(
                                    row.dataset
                                        .puantajXp
                                )
                        });
                    }
                );
            }
        );
}

function selectPuantajPersonnel({
    username,
    xp
}) {

    if (
        puantajElements
            .personnelInput
    ) {

        puantajElements
            .personnelInput
            .value =
            username || "";
    }

    if (
        puantajElements
            .currentXPInput
    ) {

        puantajElements
            .currentXPInput
            .value =
            Number(xp || 0);
    }

    if (
        puantajElements
            .normalScoreInput
    ) {

        puantajElements
            .normalScoreInput
            .value =
            "0";
    }

    if (
        puantajElements
            .extraScoreInput
    ) {

        puantajElements
            .extraScoreInput
            .value =
            "0";
    }

    updatePuantajSummary();

    puantajElements
        .normalScoreInput
        ?.focus();

    showPuantajMessage(
        `${username} puantaj formuna aktarıldı.`,
        "success"
    );
}

function filterPuantajPersonnel() {

    const searchValue =
        String(
            puantajElements
                .personnelSearch
                ?.value || ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (!searchValue) {

        renderPuantajPersonnelList(
            puantajPersonnelData
        );

        return;
    }

    const filteredPersonnel =
        puantajPersonnelData.filter(
            personnel =>
                String(
                    personnel.username
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    )
                    .includes(
                        searchValue
                    )
        );

    renderPuantajPersonnelList(
        filteredPersonnel
    );
}

function findPersonnelByUsername(
    username
) {

    const normalizedUsername =
        String(
            username || ""
        )
            .trim()
            .toLocaleLowerCase(
                "tr-TR"
            );

    if (!normalizedUsername) {
        return null;
    }

    return (
        puantajPersonnelData.find(
            personnel =>
                String(
                    personnel.username
                )
                    .toLocaleLowerCase(
                        "tr-TR"
                    ) ===
                normalizedUsername
        ) || null
    );
}

function syncPersonnelXPFromName() {

    const username =
        String(
            puantajElements
                .personnelInput
                ?.value || ""
        ).trim();

    const personnel =
        findPersonnelByUsername(
            username
        );

    if (!personnel) {
        return;
    }

    if (
        puantajElements
            .currentXPInput
    ) {

        puantajElements
            .currentXPInput
            .value =
            personnel.xp;
    }

    updatePuantajSummary();
}

// ========================================
// FORM VERİSİ
// ========================================

function getPuantajFormData() {

    return {
        personnelName:
            String(
                puantajElements
                    .personnelInput
                    ?.value || ""
            ).trim(),

        currentXP:
            getCurrentXP(),

        normalScore:
            getNormalScore(),

        extraScore:
            getExtraScore(),

        newXP:
            calculateNewXP(),

        earnedEsCoin:
            calculateCoinReward(),

        officerName:
            String(
                puantajElements
                    .officerInput
                    ?.value || ""
            ).trim()
    };
}

function validatePuantajForm(
    formData
) {

    if (!formData.personnelName) {

        showPuantajMessage(
            "Personel adını yazın veya listeden seçin.",
            "warning"
        );

        puantajElements
            .personnelInput
            ?.focus();

        return false;
    }

    if (
        formData
            .personnelName
            .length >
        80
    ) {

        showPuantajMessage(
            "Personel adı çok uzun.",
            "warning"
        );

        return false;
    }

    if (!formData.officerName) {

        showPuantajMessage(
            "Puantajı işleyen yetkilinin adını yazın.",
            "warning"
        );

        puantajElements
            .officerInput
            ?.focus();

        return false;
    }

    if (
        formData
            .officerName
            .length >
        80
    ) {

        showPuantajMessage(
            "Yetkili adı çok uzun.",
            "warning"
        );

        return false;
    }

    if (
        formData.normalScore < 0 ||
        formData.normalScore >
        MAX_NORMAL_SCORE
    ) {

        showPuantajMessage(
            "Normal puan 0 ile 75 arasında olmalıdır.",
            "warning"
        );

        return false;
    }

    return true;
}

// ========================================
// PUANTAJ SONUÇ POPUP'I
// ========================================

function buildPuantajDiscordMessage(
    result
) {

    const extraScoreText =
        result.extraScore >= 0
            ? `+${result.extraScore}`
            : String(
                result.extraScore
            );

    return [
        "📊 Personel Puantaj Bildirimi",
        "",
        `Personel: ${result.personnelName}`,
        `Eski XP: ${result.currentXP}`,
        `Normal Puan: ${result.normalScore} / ${MAX_NORMAL_SCORE}`,
        `Ekstra Puan: ${extraScoreText}`,
        `Yeni XP: ${result.newXP}`,
        `Eş Coin: ${
            result.earnedEsCoin > 0
                ? `${result.earnedEsCoin} adet kazandı`
                : "Kazanamadı"
        }`,
        `Puantajı İşleyen: ${result.officerName}`
    ].join("\n");
}

function showPuantajResult(
    result
) {

    const safePersonnelName =
        escapePuantajHtml(
            result.personnelName
        );

    const safeOfficerName =
        escapePuantajHtml(
            result.officerName
        );

    const coinText =
        result.earnedEsCoin > 0
            ? "1 Eş Coin kazandı"
            : "Eş Coin kazanamadı";

    const coinColor =
        result.earnedEsCoin > 0
            ? "#36d17c"
            : "#ffb347";

    const extraScoreText =
        result.extraScore >= 0
            ? `+${result.extraScore} XP`
            : `${result.extraScore} XP`;

    const popupContent = `
        <table class="popup-table">

            <tr>
                <td>👤 Personel</td>
                <td>${safePersonnelName}</td>
            </tr>

            <tr>
                <td>📌 Eski XP</td>
                <td>${result.currentXP} XP</td>
            </tr>

            <tr>
                <td>⭐ Normal Puan</td>
                <td>
                    ${result.normalScore} / ${MAX_NORMAL_SCORE}
                </td>
            </tr>

            <tr>
                <td>➕ Ekstra Puan</td>
                <td>${extraScoreText}</td>
            </tr>

            <tr>
                <td>🏁 Yeni XP</td>
                <td>${result.newXP} XP</td>
            </tr>

            <tr>
                <td>🪙 Eş Coin</td>
                <td
                    style="
                        color:${coinColor};
                        font-size:18px;
                        font-weight:900;
                    ">

                    ${coinText}

                </td>
            </tr>

            <tr>
                <td>👮 Puantajı İşleyen</td>
                <td>${safeOfficerName}</td>
            </tr>

        </table>
    `;

    window.discordMesaji =
        buildPuantajDiscordMessage(
            result
        );

    window.puantajCheckData = {
        ...result
    };

    if (
        typeof showPopup ===
        "function"
    ) {

        showPopup(
            "Puantaj Hesaplandı",
            popupContent,
            "success",
            "oyun"
        );

        return;
    }

    showPuantajMessage(
        "Puantaj hesaplandı.",
        "success"
    );
}

// ========================================
// PUANTAJ HESAPLA
// ========================================

function handlePuantajCalculate() {

    const formData =
        getPuantajFormData();

    if (
        !validatePuantajForm(
            formData
        )
    ) {

        return;
    }

    showPuantajResult(
        formData
    );
}

// ========================================
// FORM TEMİZLE
// ========================================

function clearPuantajForm() {

    if (
        puantajElements
            .personnelInput
    ) {

        puantajElements
            .personnelInput
            .value =
            "";
    }

    if (
        puantajElements
            .currentXPInput
    ) {

        puantajElements
            .currentXPInput
            .value =
            "0";
    }

    if (
        puantajElements
            .normalScoreInput
    ) {

        puantajElements
            .normalScoreInput
            .value =
            "0";
    }

    if (
        puantajElements
            .extraScoreInput
    ) {

        puantajElements
            .extraScoreInput
            .value =
            "0";
    }

    if (
        puantajElements
            .officerInput
    ) {

        puantajElements
            .officerInput
            .value =
            "";
    }

    if (
        puantajElements
            .personnelSearch
    ) {

        puantajElements
            .personnelSearch
            .value =
            "";
    }

    window.puantajCheckData =
        null;

    updatePuantajSummary();

    renderPuantajPersonnelList(
        puantajPersonnelData
    );

    showPuantajMessage(
        "Puantaj formu temizlendi.",
        "success"
    );
}

// ========================================
// EVENTLER
// ========================================

function addPuantajEvents() {

    [
        puantajElements.currentXPInput,
        puantajElements.normalScoreInput,
        puantajElements.extraScoreInput
    ].forEach(
        input => {

            input?.addEventListener(
                "input",
                updatePuantajSummary
            );

            input?.addEventListener(
                "change",
                updatePuantajSummary
            );
        }
    );

    puantajElements
        .personnelInput
        ?.addEventListener(
            "change",
            syncPersonnelXPFromName
        );

    puantajElements
        .personnelInput
        ?.addEventListener(
            "blur",
            syncPersonnelXPFromName
        );

    puantajElements
        .personnelSearch
        ?.addEventListener(
            "input",
            filterPuantajPersonnel
        );

    puantajElements
        .calculateButton
        ?.addEventListener(
            "click",
            handlePuantajCalculate
        );

    puantajElements
        .clearButton
        ?.addEventListener(
            "click",
            clearPuantajForm
        );
}

// ========================================
// BAŞLAT
// ========================================

function initializePuantajSystem() {

    if (!puantajElements.panel) {

        console.warn(
            "Puantaj paneli bulunamadı."
        );

        return;
    }

    renderPuantajPersonnelList(
        puantajPersonnelData
    );

    addPuantajEvents();

    updatePuantajSummary();

    window.puantajCheckData =
        null;
}

initializePuantajSystem();