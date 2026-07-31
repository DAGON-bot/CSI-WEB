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
    setPassword
} = require("./models/userModel");
const db = require("./database/db");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcrypt");

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

        const { username, password } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: "Kullanıcı adı ve şifre gerekli."
            });

        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Şifre en az 6 karakter olmalı."
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

        await setPassword(username, passwordHash);

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

        await new Promise((resolve, reject) => {

            db.run(
                "UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE username = ?",
                [username],
                function (err) {

                    if (err) reject(err);
                    else resolve();

                }
            );

        });

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

app.get("/api/me", (req, res) => {

    const auth = req.headers.authorization;

    if (!auth) {
        return res.status(401).json({
            success: false,
            message: "Token bulunamadı."
        });
    }

    const token = auth.replace("Bearer ", "");

    try {

        const user = require("./services/jwtService").verifyToken(token);

        res.json({
            success: true,
            user
        });

    } catch {

        res.status(401).json({
            success: false,
            message: "Geçersiz token."
        });

    }

});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
});