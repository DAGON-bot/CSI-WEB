const path = require("path");

require("dotenv").config({
    path: path.join(
        __dirname,
        "..",
        ".env"
    )
});

const {
    startDiscordClient,
    stopDiscordClient
} = require("./discordClient");

const {
    getSgkNames,
    getAllLicenseNames,
    buildDailySalaryReportData
} = require(
    "./modules/salaryReportModule"
);

async function run() {

    try {

        // ========================================
        // DISCORD BOT
        // ========================================

        console.log(
            "Discord botu başlatılıyor..."
        );

        const started =
            await startDiscordClient();

        if (!started) {
            throw new Error(
                "Discord botu başlatılamadı."
            );
        }

        // ========================================
        // SGK TEST
        // ========================================

        console.log("");
        console.log(
            "SGK kanalı okunuyor..."
        );

        const sgkNames =
            await getSgkNames();

        console.log("");
        console.log(
            "=============================="
        );

        console.log(
            `SGK kişi sayısı: ${sgkNames.length}`
        );

        console.log(
            "=============================="
        );

        sgkNames.forEach(
            (name, index) => {

                console.log(
                    `${index + 1}. ${name}`
                );
            }
        );

        console.log(
            "=============================="
        );

        // ========================================
        // LİSANS TEST
        // ========================================

        console.log("");
        console.log(
            "Lisans kanalları okunuyor..."
        );

        const licenses =
            await getAllLicenseNames();

        console.log("");
        console.log(
            "=============================="
        );

        console.log(
            `Lisans-1 kişi sayısı: ${licenses.license1.length}`
        );

        licenses.license1.forEach(
            (name, index) => {

                console.log(
                    `L1-${index + 1}. ${name}`
                );
            }
        );

        console.log(
            "=============================="
        );

        console.log(
            `Lisans-2 kişi sayısı: ${licenses.license2.length}`
        );

        licenses.license2.forEach(
            (name, index) => {

                console.log(
                    `L2-${index + 1}. ${name}`
                );
            }
        );

        console.log(
            "=============================="
        );

        console.log(
            `Lisans-3 kişi sayısı: ${licenses.license3.length}`
        );

        licenses.license3.forEach(
            (name, index) => {

                console.log(
                    `L3-${index + 1}. ${name}`
                );
            }
        );

        console.log(
            "=============================="
        );

        // ========================================
        // GÜNLÜK MAAŞ RAPOR TEST
        // ========================================

        console.log("");
        console.log(
            "Günlük maaş raporu hesaplanıyor..."
        );

        const report =
            await buildDailySalaryReportData();

        console.log("");
        console.log(
            "========================================"
        );

        console.log(
            "💰 MAAŞ GÜN SONU RAPOR TESTİ"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Toplam Maaş İşlemi: ${report.totalSalaryCount}`
        );

        console.log(
            `Normal Toplam Maaş: ${report.normalTotalCredit}c`
        );

        console.log(
            `SGK Dahil Toplam Maaş: ${report.finalTotalCredit}c`
        );

        console.log(
            `SGK'lı Personel: ${report.sgkPersonnelCount}`
        );

        // ========================================
        // YETKİLİLER
        // ========================================

        console.log("");
        console.log(
            "👮 MAAŞA YAZAN YETKİLİLER"
        );

        console.log(
            "----------------------------------------"
        );

        if (report.officers.length === 0) {

            console.log(
                "Bugün maaş işlemi yapan yetkili yok."
            );

        } else {

            report.officers.forEach(
                officer => {

                    console.log(
                        `${officer.salaryOfficerName}: ${officer.total} maaş`
                    );

                    Object.entries(
                        officer.badges
                    ).forEach(
                        ([badge, count]) => {

                            console.log(
                                `   - ${badge}: ${count}`
                            );
                        }
                    );
                }
            );
        }

        // ========================================
        // MAAŞ ALACAK PERSONELLER
        // ========================================

        console.log("");
        console.log(
            "👥 MAAŞ ALACAK PERSONELLER"
        );

        console.log(
            "----------------------------------------"
        );

        if (
            report.personnelSalaries.length === 0
        ) {

            console.log(
                "Bugün maaş alacak personel bulunamadı."
            );

        } else {

            report.personnelSalaries.forEach(
                (person, index) => {

                    const sgkText =
                        person.hasSgk
                            ? "✅ SGK"
                            : "❌ SGK YOK";

                    console.log(
                        `${index + 1}. ` +
                        `${person.personnelName} | ` +
                        `${person.badge} | ` +
                        `${person.normalCredit}c | ` +
                        `${sgkText} | ` +
                        `Ödenecek: ${person.finalCredit}c`
                    );
                }
            );
        }

        console.log(
            "========================================"
        );

    } catch (error) {

        console.error(
            "MAAŞ RAPOR TEST HATASI:",
            error
        );

    } finally {

        await stopDiscordClient();

        process.exit(0);
    }
}

run();