// ========================================
// CSI MAAŞ KONTROL SİSTEMİ
// ========================================

"use strict";

// ========================================
// MAAŞ ROZETLERİ VE KURALLARI
// ========================================
//
// requiredMinutes:
// Maaş rozeti için gereken çalışma süresi.
//
// credit:
// İleride kullanılmak üzere veri olarak tutulacak
// kredi karşılığıdır. Şimdilik herhangi bir ödeme
// veya para hesabı yapılmamaktadır.
//

const salaryBadgeData = {

    "Bronz Maaş": {
        requiredMinutes: 60,
        credit: 1
    },

    "Demir Maaş": {
        requiredMinutes: 120,
        credit: 2
    },

    "Gümüş Maaş": {
        requiredMinutes: 240,
        credit: 3
    },

    "Altın Maaş": {
        requiredMinutes: 360,
        credit: 5
    },

    "Plat Maaş": {
        requiredMinutes: 480,
        credit: 6
    },

    "Elmas Maaş": {
        requiredMinutes: 600,
        credit: 7
    },

    "Zümrüt Maaş": {
        requiredMinutes: 660,
        credit: 10
    },

    "Ek-Maaş 1": {
        requiredMinutes: 60,
        credit: 1
    },

    "Ek-Maaş 2": {
        requiredMinutes: 120,
        credit: 2
    },

    "Ek-Maaş 3": {
        requiredMinutes: 180,
        credit: 3
    }
};

// ========================================
// HTML ELEMENTLERİ
// ========================================

const salaryElements = {

    panel:
        document.getElementById(
            "maas"
        ),

    personnelName:
        document.getElementById(
            "maasPersonelAdi"
        ),

    salaryOfficerName:
        document.getElementById(
            "maasYetkiliAdi"
        ),

    badge:
        document.getElementById(
            "maasRozet"
        ),

    previousHours:
        document.getElementById(
            "maasEskiSaat"
        ),

    previousMinutes:
        document.getElementById(
            "maasEskiDakika"
        ),

    currentHours:
        document.getElementById(
            "maasYeniSaat"
        ),

    currentMinutes:
        document.getElementById(
            "maasYeniDakika"
        ),

    checkButton:
        document.getElementById(
            "maasKontrolBtn"
        ),

    historyButton:
        document.getElementById(
            "maasGecmisiBtn"
        ),

    historyArea:
        document.getElementById(
            "maasGecmisiAlani"
        ),

    historyCount:
        document.getElementById(
            "maasGecmisiSayisi"
        ),

    historyList:
        document.getElementById(
            "maasGecmisiListesi"
        )
};

// ========================================
// YARDIMCI FONKSİYONLAR
// ========================================

function showSalaryToast(
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
        `[Maaş Sistemi] ${message}`
    );
}

function escapeSalaryHtml(
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

function convertSalaryTimeToMinutes(
    hours,
    minutes
) {

    return (
        Number(hours) * 60
    ) + Number(minutes);
}

function formatSalaryMinutes(
    totalMinutes
) {

    const safeTotalMinutes =
        Math.max(
            Number(totalMinutes) || 0,
            0
        );

    const hours =
        Math.floor(
            safeTotalMinutes / 60
        );

    const minutes =
        safeTotalMinutes % 60;

    if (
        hours === 0 &&
        minutes === 0
    ) {

        return "0 Dakika";
    }

    if (hours === 0) {

        return `${minutes} Dakika`;
    }

    if (minutes === 0) {

        return `${hours} Saat`;
    }

    return (
        `${hours} Saat ` +
        `${minutes} Dakika`
    );
}

function normalizeSalaryNumberInput(
    input,
    maximum = null
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
        !Number.isInteger(value) ||
        value < 0
    ) {

        value = 0;
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

// ========================================
// MAAŞ ROZET DROPDOWN
// ========================================

function populateSalaryBadges() {

    const badgeSelect =
        salaryElements.badge;

    if (!badgeSelect) {
        return;
    }

    badgeSelect.innerHTML = `
        <option value="">
            Maaş rozeti seçiniz
        </option>
    `;

    Object.keys(
        salaryBadgeData
    ).forEach(
        badgeName => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                badgeName;

            option.textContent =
                badgeName;

            badgeSelect.appendChild(
                option
            );
        }
    );
}

// ========================================
// FORM KONTROLÜ
// ========================================

function getSalaryFormData() {

    const personnelName =
        String(
            salaryElements
                .personnelName
                ?.value || ""
        ).trim();

    const salaryOfficerName =
        String(
            salaryElements
                .salaryOfficerName
                ?.value || ""
        ).trim();

    const badge =
        String(
            salaryElements
                .badge
                ?.value || ""
        ).trim();

    const previousHours =
        normalizeSalaryNumberInput(
            salaryElements.previousHours
        );

    const previousMinutes =
        normalizeSalaryNumberInput(
            salaryElements.previousMinutes,
            59
        );

    const currentHours =
        normalizeSalaryNumberInput(
            salaryElements.currentHours
        );

    const currentMinutes =
        normalizeSalaryNumberInput(
            salaryElements.currentMinutes,
            59
        );

    return {
        personnelName,
        salaryOfficerName,
        badge,
        previousHours,
        previousMinutes,
        currentHours,
        currentMinutes
    };
}

function validateSalaryForm(
    formData
) {

    if (!formData.personnelName) {

        showSalaryToast(
            "Maaşı alacak personelin adını yazın.",
            "warning"
        );

        salaryElements
            .personnelName
            ?.focus();

        return false;
    }

    if (!formData.salaryOfficerName) {

        showSalaryToast(
            "Maaşı veren yetkilinin adını yazın.",
            "warning"
        );

        salaryElements
            .salaryOfficerName
            ?.focus();

        return false;
    }

    if (!formData.badge) {

        showSalaryToast(
            "Maaş rozeti seçin.",
            "warning"
        );

        salaryElements
            .badge
            ?.focus();

        return false;
    }

    if (
        !salaryBadgeData[
            formData.badge
        ]
    ) {

        showSalaryToast(
            "Geçersiz maaş rozeti seçildi.",
            "error"
        );

        return false;
    }

    if (
        formData.personnelName.length >
        80
    ) {

        showSalaryToast(
            "Personel adı çok uzun.",
            "warning"
        );

        return false;
    }

    if (
        formData.salaryOfficerName.length >
        80
    ) {

        showSalaryToast(
            "Maaşı veren kişinin adı çok uzun.",
            "warning"
        );

        return false;
    }

    return true;
}

// ========================================
// MAAŞ UYGUNLUK HESAPLAMA
// ========================================

function calculateSalaryEligibility(
    formData
) {

    const salaryBadge =
        salaryBadgeData[
            formData.badge
        ];

    const previousTotalMinutes =
        convertSalaryTimeToMinutes(
            formData.previousHours,
            formData.previousMinutes
        );

    const currentTotalMinutes =
        convertSalaryTimeToMinutes(
            formData.currentHours,
            formData.currentMinutes
        );

    if (
        currentTotalMinutes <
        previousTotalMinutes
    ) {

        return {
            success: false,
            message:
                "Şu anki toplam çalışma süresi, son maaş anındaki süreden düşük olamaz."
        };
    }

    const workedMinutes =
        currentTotalMinutes -
        previousTotalMinutes;

    const requiredMinutes =
        salaryBadge.requiredMinutes;

    const remainingMinutes =
        Math.max(
            requiredMinutes -
            workedMinutes,
            0
        );

    const eligible =
        workedMinutes >=
        requiredMinutes;

    return {
        success: true,

        personnelName:
            formData.personnelName,

        salaryOfficerName:
            formData.salaryOfficerName,

        badge:
            formData.badge,

        credit:
            salaryBadge.credit,

        previousHours:
            formData.previousHours,

        previousMinutes:
            formData.previousMinutes,

        currentHours:
            formData.currentHours,

        currentMinutes:
            formData.currentMinutes,

        previousTotalMinutes,

        currentTotalMinutes,

        workedMinutes,

        requiredMinutes,

        remainingMinutes,

        eligible
    };
}

// ========================================
// SONUÇ POPUP'I
// ========================================

function showSalaryEligibilityResult(
    result
) {

    const safePersonnelName =
        escapeSalaryHtml(
            result.personnelName
        );

    const safeOfficerName =
        escapeSalaryHtml(
            result.salaryOfficerName
        );

    const safeBadge =
        escapeSalaryHtml(
            result.badge
        );

    const resultText =
        result.eligible
            ? "Maaş almaya uygun"
            : "Maaş almaya uygun değil";

    const resultColor =
        result.eligible
            ? "#36d17c"
            : "#ff5f6d";

const extraResultRow =
    result.eligible
        ? `
            <tr class="salary-result-row">

                <td class="salary-result-label">
                    ✅ Durum
                </td>

                <td
                    class="salary-result-value"
                    style="
                        color:${resultColor};
                    ">

                    Maaş almaya uygundur

                </td>

            </tr>
        `
        : `
            <tr>
                <td>
                    ⏳ Kalan Süre
                </td>

                <td>
                    ${formatSalaryMinutes(
                        result.remainingMinutes
                    )}
                </td>
            </tr>

            <tr class="salary-result-row">

                <td class="salary-result-label">
                    ❌ Durum
                </td>

                <td
                    class="salary-result-value"
                    style="
                        color:${resultColor};
                    ">

                    Maaş almaya uygun değildir

                </td>

            </tr>
        `;

    const popupMessage = `
        <table class="popup-table">

            <tr>
                <td>
                    👤 Personel
                </td>

                <td>
                    ${safePersonnelName}
                </td>
            </tr>

            <tr>
                <td>
                    👮 Maaşı Veren
                </td>

                <td>
                    ${safeOfficerName}
                </td>
            </tr>

            <tr>
                <td>
                    🏷 Maaş Rozeti
                </td>

                <td>
                    ${safeBadge}
                </td>
            </tr>

            <tr>
                <td>
                    🕒 Son Maaş Süresi
                </td>

                <td>
                    ${formatSalaryMinutes(
                        result.previousTotalMinutes
                    )}
                </td>
            </tr>

            <tr>
                <td>
                    ⏱ Şu Anki Toplam Süre
                </td>

                <td>
                    ${formatSalaryMinutes(
                        result.currentTotalMinutes
                    )}
                </td>
            </tr>


            ${extraResultRow}

        </table>
    `;

    window.discordMesaji = [
        "💰 Personel Maaş Bildirimi",
        "",
        `Maaşı Alan Personel: ${result.personnelName}`,
        `Maaş Rozeti: ${result.badge}`,
        `Şu Anki Toplam Süre: ${formatSalaryMinutes(
            result.currentTotalMinutes
        )}`,
        `Maaşı Veren Yetkili: ${result.salaryOfficerName}`
    ].join("\n");

    if (
        typeof showPopup ===
        "function"
    ) {

        showPopup(
            result.eligible
                ? "Maaş Onaylandı"
                : "Maaş Reddedildi",

            popupMessage,

            result.eligible
                ? "success"
                : "warning",

            "maas"
        );

        return;
    }

    showSalaryToast(
        resultText,
        result.eligible
            ? "success"
            : "warning"
    );
}
// ========================================
// KONTROL BUTONU
// ========================================

function handleSalaryCheck() {

    const formData =
        getSalaryFormData();

    if (
        !validateSalaryForm(
            formData
        )
    ) {

        return;
    }

    const result =
        calculateSalaryEligibility(
            formData
        );

    if (!result.success) {

        window.salaryCheckData =
            null;

        showSalaryToast(
            result.message,
            "error"
        );

        return;
    }

    /*
        Backend ve Discord aşamasında bu obje
        doğrudan kullanılacaktır.

        Uygun olmayan sonuçlar ileride veritabanına
        gönderilmeyecektir.
    */

    window.salaryCheckData =
        result.eligible
            ? {
                personnelName:
                    result.personnelName,

                salaryOfficerName:
                    result.salaryOfficerName,

                badge:
                    result.badge,

                credit:
                    result.credit,

                requiredMinutes:
                    result.requiredMinutes,

                previousHours:
                    result.previousHours,

                previousMinutes:
                    result.previousMinutes,

                currentHours:
                    result.currentHours,

                currentMinutes:
                    result.currentMinutes,

                workedMinutes:
                    result.workedMinutes
            }
            : null;

    showSalaryEligibilityResult(
        result
    );
}

// ========================================
// MAAŞ GEÇMİŞİ
// ========================================

// ========================================
// MAAŞ GEÇMİŞİ
// ========================================

function formatSalaryHistoryDate(
    dateValue
) {

    const date =
        new Date(
            dateValue
        );

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

function renderSalaryHistory(
    history
) {

    const historyArea =
        salaryElements.historyArea;

    const historyCount =
        salaryElements.historyCount;

    const historyList =
        salaryElements.historyList;

    if (
        !historyArea ||
        !historyCount ||
        !historyList
    ) {

        return;
    }

    historyArea.style.display =
        "block";

    historyCount.textContent =
        `${history.length} kayıt`;

    if (
        history.length === 0
    ) {

        historyList.innerHTML = `
            <div class="promotion-history-empty">

                Bu personele ait maaş kaydı bulunamadı.

            </div>
        `;

        return;
    }

    historyList.innerHTML =
        history
            .map(
                record => {

                    const personnelName =
                        escapeSalaryHtml(
                            record.personnelName
                        );

                    const salaryOfficerName =
                        escapeSalaryHtml(
                            record.salaryOfficerName
                        );

                    const badge =
                        escapeSalaryHtml(
                            record.badge
                        );

                    const credit =
                        Number(
                            record.credit || 0
                        );

                    const previousTotalMinutes =
                        (
                            Number(
                                record.previousHours || 0
                            ) * 60
                        ) +
                        Number(
                            record.previousMinutes || 0
                        );

                    const currentTotalMinutes =
                        (
                            Number(
                                record.currentHours || 0
                            ) * 60
                        ) +
                        Number(
                            record.currentMinutes || 0
                        );

                    const workedMinutes =
                        Number(
                            record.workedMinutes || 0
                        );

                    const requiredMinutes =
                        Number(
                            record.requiredMinutes || 0
                        );

                    const createdAt =
                        formatSalaryHistoryDate(
                            record.createdAt
                        );

                    const discordStatus =
                        record.discordSent
                            ? "Discord'a gönderildi"
                            : "Discord kuyruğunda";

                    return `
                        <div class="promotion-history-card">

                            <div class="promotion-history-date">

                                ${createdAt}

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Personel
                                </span>

                                <span class="promotion-history-value">
                                    ${personnelName}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Maaş Rozeti
                                </span>

                                <span class="promotion-history-value">
                                    ${badge}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Son Maaş Süresi
                                </span>

                                <span class="promotion-history-value">
                                    ${formatSalaryMinutes(
                                        previousTotalMinutes
                                    )}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Şu Anki Toplam Süre
                                </span>

                                <span class="promotion-history-value">
                                    ${formatSalaryMinutes(
                                        currentTotalMinutes
                                    )}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Maaştan Sonra Çalışılan
                                </span>

                                <span class="promotion-history-value">
                                    ${formatSalaryMinutes(
                                        workedMinutes
                                    )}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Gerekli Süre
                                </span>

                                <span class="promotion-history-value">
                                    ${formatSalaryMinutes(
                                        requiredMinutes
                                    )}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Kredi Değeri
                                </span>

                                <span class="promotion-history-value">
                                    ${credit} Kredi
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Maaşı Veren
                                </span>

                                <span class="promotion-history-value">
                                    ${salaryOfficerName}
                                </span>

                            </div>

                            <div class="promotion-history-row">

                                <span class="promotion-history-label">
                                    Discord Durumu
                                </span>

                                <span class="promotion-history-value">
                                    ${discordStatus}
                                </span>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

async function handleSalaryHistory() {

    const personnelName =
        String(
            salaryElements
                .personnelName
                ?.value || ""
        ).trim();

    if (!personnelName) {

        showSalaryToast(
            "Geçmişini görmek istediğiniz personelin adını yazın.",
            "warning"
        );

        salaryElements
            .personnelName
            ?.focus();

        return;
    }

    if (
        personnelName.length > 80
    ) {

        showSalaryToast(
            "Personel adı çok uzun.",
            "warning"
        );

        return;
    }

    const token =
        localStorage.getItem(
            "token"
        );

    if (!token) {

        showSalaryToast(
            "Maaş geçmişini görüntülemek için giriş yapmalısınız.",
            "warning"
        );

        return;
    }

    salaryElements
        .historyButton
        .disabled =
        true;

    salaryElements
        .historyButton
        .textContent =
        "Maaş Geçmişi Yükleniyor...";

    try {

        const response =
            await fetch(
                `/api/salary-history/${encodeURIComponent(
                    personnelName
                )}?limit=50`,
                {
                    method:
                        "GET",

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
                "Maaş geçmişi yüklenemedi."
            );
        }

        const history =
            Array.isArray(
                data.history
            )
                ? data.history
                : [];

        renderSalaryHistory(
            history
        );

        showSalaryToast(
            history.length > 0
                ? `${history.length} maaş kaydı getirildi.`
                : "Bu personele ait maaş kaydı bulunamadı.",

            history.length > 0
                ? "success"
                : "info"
        );

    } catch (error) {

        console.error(
            "Maaş geçmişi yükleme hatası:",
            error
        );

        showSalaryToast(
            error.message ||
            "Maaş geçmişi yüklenemedi.",
            "error"
        );

    } finally {

        salaryElements
            .historyButton
            .disabled =
            false;

        salaryElements
            .historyButton
            .textContent =
            "Maaş Geçmişini Göster";
    }
}

// ========================================
// SAYISAL ALAN KONTROLLERİ
// ========================================

function addSalaryTimeInputEvents() {

    const hourInputs = [
        salaryElements.previousHours,
        salaryElements.currentHours
    ];

    const minuteInputs = [
        salaryElements.previousMinutes,
        salaryElements.currentMinutes
    ];

    hourInputs.forEach(
        input => {

            input?.addEventListener(
                "input",
                () => {

                    normalizeSalaryNumberInput(
                        input
                    );
                }
            );
        }
    );

    minuteInputs.forEach(
        input => {

            input?.addEventListener(
                "input",
                () => {

                    normalizeSalaryNumberInput(
                        input,
                        59
                    );
                }
            );
        }
    );
}

// ========================================
// SİSTEMİ BAŞLAT
// ========================================

function initializeSalarySystem() {

    if (!salaryElements.panel) {

        console.warn(
            "Maaş paneli bulunamadı."
        );

        return;
    }

    populateSalaryBadges();

    addSalaryTimeInputEvents();

    salaryElements
        .checkButton
        ?.addEventListener(
            "click",
            handleSalaryCheck
        );

    salaryElements
        .historyButton
        ?.addEventListener(
            "click",
            handleSalaryHistory
        );

    window.salaryCheckData =
        null;
}

initializeSalarySystem();