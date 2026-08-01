const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});
const { generateToken } = require("./services/jwtService");
const { getHabbo } = require("./services/habboService");
const {
    getUser,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo,
    setPassword,
    updateLastLogin,
    completeRegistration,
    createPasswordReset,
    getPasswordReset,
    verifyPasswordReset,
    completePasswordReset
} = require("./models/userModel");

const { initDatabase } = require("./database/db");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

app.get("/api/test", (req, res) => {
    res.json({
        status: "OK",
        message: "CSI Backend çalışıyor 🚀"
    });
});

app.get("/api/habbo/:username", async (req, res) => {

    try {

        const username = req.params.username;

        const response = await axios.get(
            `https://www.habbo.com.tr/api/public/users?name=${username}`
        );

        res.json(response.data);

    } catch (err) {

        res.status(404).json({
            success: false,
            message: "Kullanıcı bulunamadı."
        });

    }

});

app.post("/api/verify/create", async (req, res) => {

    try {

        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı gerekli."
            });
        }

        let user = await getUser(username);

// Daha önce şifre oluşturulmuşsa tekrar kayıt olamasın
if (user && user.password) {

    return res.status(409).json({
        success: false,
        message: "Bu Habbo hesabıyla daha önce kayıt olunmuştur."
    });

}

// Kullanıcı var ama henüz şifre oluşturmamışsa
// eski doğrulama kodunu kullanmaya devam et
if (user) {

    return res.json({
        success: true,
        code: user.verifyCode,
        verified: !!user.verified
    });

}

        const habbo = await getHabbo(username);

        if (!habbo || !habbo.name) {
            return res.status(404).json({
                success: false,
                message: "Habbo kullanıcısı bulunamadı."
            });
        }

        const code =
            "CSI-" +
            Math.random().toString(36).substring(2, 8).toUpperCase();

        await createUser(username, code);

        res.json({
            success: true,
            code: code,
            verified: false
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });

    }

});

app.post("/api/verify/check", async (req, res) => {

    try {

        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı gerekli."
            });
        }

        const habbo = await getHabbo(username);

        const motto = habbo.motto || "";

        const user = await getVerifyCode(username);

        if (!user) {
            return res.json({
                success: false,
                message: "Kullanıcı bulunamadı."
            });
        }

        if (!motto.includes(user.verifyCode)) {
            return res.json({
                success: false,
                message: "Kod mottoda bulunamadı."
            });
        }

        await verifyUser(username);
        await updateHabboInfo(username, habbo);

        const token = generateToken(username);

        res.json({
            success: true,
            message: "Hesap doğrulandı ✔",
            token
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });

    }

});

app.post("/api/register/password", async (req, res) => {

    try {

        const {
    username,
    password,
    badge,
    rank
} = req.body;

        if (!username || !password || !badge || !rank) {

            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı, rozet, rütbe ve şifre bilgileri gerekli."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Şifre en az 6 karakter olmalı."
            });

        }

        const cleanBadge =
    String(badge || "").trim();

const cleanRank =
    String(rank || "").trim();

if (cleanBadge.length > 80) {
    return res.status(400).json({
        success: false,
        message: "Rozet adı çok uzun."
    });
}

if (cleanRank.length < 2 || cleanRank.length > 80) {
    return res.status(400).json({
        success: false,
        message: "Rütbe adı 2 ile 80 karakter arasında olmalı."
    });
}

        const user = await getUser(username);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "Kullanıcı bulunamadı."
            });

        }

        if (!user.verified) {

            return res.status(403).json({
                success: false,
                message: "Hesap doğrulanmamış."
            });

        }

        if (user.password) {

    return res.status(409).json({
        success: false,
        message: "Bu hesap için daha önce şifre oluşturulmuş."
    });

}

        const passwordHash = await bcrypt.hash(password, 12);

        await completeRegistration(
    username,
    passwordHash,
    cleanBadge,
    cleanRank
);

        const token = generateToken(username);

        res.json({
            success: true,
            message: "Hesap başarıyla oluşturuldu.",
            token
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });

    }

});

app.post("/api/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı ve şifre zorunludur."
            });

        }

        const user = await getUser(username);

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Kullanıcı adı veya şifre yanlış."
            });

        }

        if (!user.verified) {

            return res.status(403).json({
                success: false,
                message: "Hesap doğrulanmamış."
            });

        }

        if (!user.password) {

            return res.status(401).json({
                success: false,
                message: "Bu hesap için henüz şifre oluşturulmamış."
            });

        }

        let passwordCorrect = false;

if (user.password.startsWith("$2")) {

    // Yeni bcrypt şifre
    passwordCorrect = await bcrypt.compare(
        password,
        user.password
    );

} else {

    // Eski düz metin şifre
    passwordCorrect = user.password === password;

    // Doğruysa otomatik bcrypt'e çevir
    if (passwordCorrect) {

        const passwordHash = await bcrypt.hash(password, 12);

        await setPassword(username, passwordHash);

    }

}

if (!passwordCorrect) {

    return res.status(401).json({
        success: false,
        message: "Kullanıcı adı veya şifre yanlış."
    });

}

        await updateLastLogin(username);

        const token = generateToken(username);

        res.json({
            success: true,
            message: "Giriş başarılı.",
            token
        });

    } catch (err) {

        console.error("Login hatası:", err);

        res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });

    }

});

// ===============================
// OTURUMDAKİ KULLANICI BİLGİLERİ
// ===============================

app.get("/api/me", async (req, res) => {

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Token bulunamadı."
        });
    }

    const token = auth.replace("Bearer ", "").trim();

    try {

        const tokenUser =
            require("./services/jwtService").verifyToken(token);

        const username =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        if (!username) {
            return res.status(401).json({
                success: false,
                message: "Token içinde kullanıcı bilgisi bulunamadı."
            });
        }

        const user = await getUser(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Kullanıcı bulunamadı."
            });
        }

        return res.json({
            success: true,
            user: {
                username: user.username,
                habboId: user.habboId,
                figureString: user.figureString,
                motto: user.motto || "",
                role: user.role || "member",
                badge: user.badge || "",
                rank: user.rank || "",
                verified: !!user.verified,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

    } catch (err) {

        console.error("Oturum bilgisi hatası:", err);

        return res.status(401).json({
            success: false,
            message: "Geçersiz token."
        });

    }

});

// ===============================
// PROFİL - HABBO BİLGİLERİNİ YENİLE
// ===============================

app.post("/api/profile/refresh", async (req, res) => {

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Oturum açmanız gerekiyor."
        });
    }

    const token = auth.replace("Bearer ", "").trim();

    try {

        const tokenUser =
            require("./services/jwtService").verifyToken(token);

        const username =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        if (!username) {
            return res.status(401).json({
                success: false,
                message: "Kullanıcı bilgisi bulunamadı."
            });
        }

        const user = await getUser(username);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Kullanıcı bulunamadı."
            });
        }

        const habbo = await getHabbo(user.username);

        if (!habbo || !habbo.name) {
            return res.status(404).json({
                success: false,
                message: "Habbo profili bulunamadı."
            });
        }

        await updateHabboInfo(user.username, habbo);

        const updatedUser = await getUser(user.username);

        return res.json({
            success: true,
            message: "Habbo bilgileri güncellendi.",
            user: {
                username: updatedUser.username,
                habboId: updatedUser.habboId,
                figureString: updatedUser.figureString,
                motto: updatedUser.motto || "",
                role: updatedUser.role || "member",
                badge: updatedUser.badge || "",
                rank: updatedUser.rank || "",
                verified: !!updatedUser.verified,
                createdAt: updatedUser.createdAt,
                lastLogin: updatedUser.lastLogin
            }
        });

    } catch (err) {

        console.error("Profil yenileme hatası:", err);

        return res.status(500).json({
            success: false,
            message: "Profil bilgileri yenilenemedi."
        });

    }

});

// ===============================
// PROFİL - ŞİFRE DEĞİŞTİR
// ===============================

app.post("/api/profile/change-password", async (req, res) => {

    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Oturum açmanız gerekiyor."
        });
    }

    const token = auth.replace("Bearer ", "").trim();

    try {

        const tokenUser =
            require("./services/jwtService").verifyToken(token);

        const username =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        const currentPassword =
            String(req.body.currentPassword || "");

        const newPassword =
            String(req.body.newPassword || "");

        const newPasswordAgain =
            String(req.body.newPasswordAgain || "");

        if (
            !username ||
            !currentPassword ||
            !newPassword ||
            !newPasswordAgain
        ) {
            return res.status(400).json({
                success: false,
                message: "Bütün şifre alanlarını doldurun."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Yeni şifre en az 6 karakter olmalı."
            });
        }

        if (newPassword !== newPasswordAgain) {
            return res.status(400).json({
                success: false,
                message: "Yeni şifreler eşleşmiyor."
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "Yeni şifre mevcut şifreyle aynı olamaz."
            });
        }

        const user = await getUser(username);

        if (!user || !user.password) {
            return res.status(404).json({
                success: false,
                message: "Kullanıcı hesabı bulunamadı."
            });
        }

        let passwordCorrect = false;

        if (user.password.startsWith("$2")) {

            passwordCorrect = await bcrypt.compare(
                currentPassword,
                user.password
            );

        } else {

            passwordCorrect =
                user.password === currentPassword;

        }

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Mevcut şifreniz yanlış."
            });
        }

        const passwordHash =
            await bcrypt.hash(newPassword, 12);

        await setPassword(username, passwordHash);

        return res.json({
            success: true,
            message: "Şifreniz başarıyla değiştirildi."
        });

    } catch (err) {

        console.error("Şifre değiştirme hatası:", err);

        return res.status(500).json({
            success: false,
            message: "Şifre değiştirilemedi."
        });

    }

});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server ${PORT} portunda çalışıyor.`);
        });
    } catch (err) {
        console.error("Sunucu başlatılamadı:", err);
        process.exit(1);
    }
}

// ===============================
// ŞİFRE SIFIRLAMA - KOD OLUŞTUR
// ===============================

app.post("/api/password-reset/create", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Habbo kullanıcı adı gerekli."
            });
        }

        const user = await getUser(username);

        if (!user || !user.password || !user.verified) {
            return res.status(404).json({
                success: false,
                message: "Bu kullanıcı adına ait kayıtlı bir hesap bulunamadı."
            });
        }

        const habbo = await getHabbo(username);

        if (!habbo || !habbo.name) {
            return res.status(404).json({
                success: false,
                message: "Habbo kullanıcısı bulunamadı."
            });
        }

        const resetCode =
            "CSI-RESET-" +
            crypto.randomBytes(4).toString("hex").toUpperCase();

        await createPasswordReset(username, resetCode);

        return res.json({
            success: true,
            code: resetCode,
            message: "Şifre sıfırlama kodu oluşturuldu."
        });

    } catch (err) {
        console.error("Şifre sıfırlama kodu hatası:", err);

        return res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });
    }
});


// ===============================
// ŞİFRE SIFIRLAMA - MOTTO KONTROL
// ===============================

app.post("/api/password-reset/check", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Habbo kullanıcı adı gerekli."
            });
        }

        const resetData = await getPasswordReset(username);

        if (
            !resetData ||
            !resetData.resetCode ||
            !resetData.resetExpiresAt
        ) {
            return res.status(400).json({
                success: false,
                message: "Aktif bir şifre sıfırlama isteği bulunamadı."
            });
        }

        if (new Date(resetData.resetExpiresAt).getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Şifre sıfırlama kodunun süresi dolmuş. Yeni kod oluşturun."
            });
        }

        const habbo = await getHabbo(username);
        const motto = habbo?.motto || "";

        if (!motto.includes(resetData.resetCode)) {
            return res.status(400).json({
                success: false,
                message: "Şifre sıfırlama kodu Habbo mottosunda bulunamadı."
            });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

        const verified = await verifyPasswordReset(
            username,
            resetToken
        );

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: "Kod doğrulanamadı veya kodun süresi doldu."
            });
        }

        return res.json({
            success: true,
            resetToken,
            message: "Hesap doğrulandı. Yeni şifrenizi oluşturabilirsiniz."
        });

    } catch (err) {
        console.error("Şifre sıfırlama doğrulama hatası:", err);

        return res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });
    }
});


// ===============================
// ŞİFRE SIFIRLAMA - YENİ ŞİFRE
// ===============================

app.post("/api/password-reset/complete", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim();
        const password = String(req.body.password || "");
        const resetToken = String(req.body.resetToken || "");

        if (!username || !password || !resetToken) {
            return res.status(400).json({
                success: false,
                message: "Eksik bilgi gönderildi."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Şifre en az 6 karakter olmalı."
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const completed = await completePasswordReset(
            username,
            resetToken,
            passwordHash
        );

        if (!completed) {
            return res.status(403).json({
                success: false,
                message: "Şifre sıfırlama yetkisi geçersiz veya süresi dolmuş."
            });
        }

        return res.json({
            success: true,
            message: "Şifreniz başarıyla yenilendi."
        });

    } catch (err) {
        console.error("Yeni şifre kaydetme hatası:", err);

        return res.status(500).json({
            success: false,
            message: "Sunucu hatası."
        });
    }
});



startServer();