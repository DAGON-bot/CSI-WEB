const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});
const { generateToken } = require("./services/jwtService");
const { getHabbo } = require("./services/habboService");
const {
    getUser,
    searchUsersByUsername,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo,
    setPassword,
    updateLastLogin,
    completeRegistration,
    updateDepartment,
    updateRank,
    updateBadge,
    updateRole,
    setUserRoles,
    updateRanksBulk,
    createAdminLog,
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
const ADMIN_USERNAME = "canart0";
const PANEL_PERMISSIONS = {

    promotion: [
        "admin",
        "founder",
        "moderator",
        "promotion_controller"
    ],

    bulkPromotion: [
        "admin",
        "founder",
        "moderator",
        "promotion_controller"
    ],

    payban: [
        "admin",
        "founder",
        "moderator",
        "salary_officer"
    ],

    puantaj: [
        "admin",
        "founder",
        "moderator",
        "salary_officer"
    ],

    news: [
        "admin",
        "founder",
        "moderator",
        "reporter"
    ]

};
function getUserRoleList(user) {

    if (!user) {
        return [];
    }

    if (
        Array.isArray(user.roles) &&
        user.roles.length > 0
    ) {
        return user.roles;
    }

    if (user.role) {
        return [user.role];
    }

    return ["member"];
}

function hasRole(user, role) {

    const roles = getUserRoleList(user);

    return roles.includes(role);
}

function hasAnyRole(user, allowedRoles) {

    if (!Array.isArray(allowedRoles)) {
        return false;
    }

    const roles = getUserRoleList(user);

    return allowedRoles.some(
        role => roles.includes(role)
    );
}

function hasPanelPermission(user, panelName) {

    const allowedRoles =
        PANEL_PERMISSIONS[panelName];

    if (!allowedRoles) {
        return false;
    }

    return hasAnyRole(user, allowedRoles);
}
const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

async function getAuthorizedFounder(req) {

    const auth =
        req.headers.authorization;

    if (
        !auth ||
        !auth.startsWith("Bearer ")
    ) {

        return {
            error: {
                status: 401,
                message:
                    "Oturum açmanız gerekiyor."
            }
        };

    }

    const token =
        auth.replace("Bearer ", "").trim();

    const tokenUser =
        require("./services/jwtService")
            .verifyToken(token);

    const username =
        tokenUser.username ||
        tokenUser.name ||
        tokenUser.user ||
        tokenUser.sub;

    if (!username) {

        return {
            error: {
                status: 401,
                message:
                    "Geçersiz oturum bilgisi."
            }
        };

    }

    const user =
        await getUser(username);

    if (!user) {

        return {
            error: {
                status: 404,
                message:
                    "Oturum sahibi bulunamadı."
            }
        };

    }

    const allowedRoles = [
        "admin",
        "founder"
    ];


if (!hasAnyRole(user, allowedRoles)) {

    return {
        error: {
            status: 403,
            message:
                "Bu işlem için yetkiniz bulunmuyor."
        }
    };

}

    return {
        user
    };

}

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
    rank,
    registerType
} = req.body;

        const isGuest = registerType === "guest";

if (!username || !password) {

    return res.status(400).json({
        success: false,
        message: "Kullanıcı adı ve şifre gerekli."
    });

}

if (!isGuest && (!badge || !rank)) {

    return res.status(400).json({
        success: false,
        message: "Rozet ve rütbe seçmelisiniz."
    });

}

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Şifre en az 6 karakter olmalı."
            });

        }

        const cleanBadge = isGuest
    ? "Misafir"
    : String(badge || "").trim();

const cleanRank = isGuest
    ? "Misafir"
    : String(rank || "").trim();

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

        roles: Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles
            : [user.role || "member"],

        badge: user.badge || "",
        rank: user.rank || "",
        department: user.department || "",
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

        roles: Array.isArray(updatedUser.roles) && updatedUser.roles.length > 0
            ? updatedUser.roles
            : [updatedUser.role || "member"],

        badge: updatedUser.badge || "",
        rank: updatedUser.rank || "",
        department: updatedUser.department || "",
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

// ===============================
// KURUCU PANELİ - KULLANICI ARA
// ===============================

app.get("/api/founder/user/:username", async (req, res) => {

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

        const requesterUsername =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        if (!requesterUsername) {
            return res.status(401).json({
                success: false,
                message: "Geçersiz oturum bilgisi."
            });
        }

        const requester = await getUser(requesterUsername);

        if (!requester) {
            return res.status(404).json({
                success: false,
                message: "Oturum sahibi bulunamadı."
            });
        }

        const founderPanelRoles = [
    "admin",
    "founder"
];

if (!hasAnyRole(requester, founderPanelRoles)) {
    return res.status(403).json({
        success: false,
        message: "Kurucu paneline erişim yetkiniz yok."
    });
}

        const searchedUsername =
            String(req.params.username || "").trim();

        if (!searchedUsername) {
            return res.status(400).json({
                success: false,
                message: "Aranacak nickname gerekli."
            });
        }

        if (searchedUsername.length > 80) {
            return res.status(400).json({
                success: false,
                message: "Nickname çok uzun."
            });
        }

        const searchedUser =
            await getUser(searchedUsername);

        if (!searchedUser) {
            return res.status(404).json({
                success: false,
                message: "Bu nickname ile kayıtlı kullanıcı bulunamadı."
            });
        }


        return res.json({
            success: true,
            user: {
                username: searchedUser.username,
                habboId: searchedUser.habboId,
                figureString: searchedUser.figureString,
                motto: searchedUser.motto || "",
                badge: searchedUser.badge || "",
                rank: searchedUser.rank || "",
                department: searchedUser.department || "",
                role: searchedUser.role || "member",

roles:
    Array.isArray(searchedUser.roles) &&
    searchedUser.roles.length > 0
        ? searchedUser.roles
        : [searchedUser.role || "member"],

verified: !!searchedUser.verified,
                createdAt: searchedUser.createdAt,
                lastLogin: searchedUser.lastLogin
            }
        });

    } catch (err) {

        console.error(
            "Kurucu paneli kullanıcı arama hatası:",
            err
        );

        return res.status(401).json({
            success: false,
            message: "Oturum geçersiz veya süresi dolmuş."
        });

    }

});

// ===============================
// KURUCU PANELİ - DEPARTMAN ATA
// ===============================

app.patch(
    "/api/founder/user/:username/department",
    async (req, res) => {

        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Oturum açmanız gerekiyor."
            });

        }

        const token =
            auth.replace("Bearer ", "").trim();

        try {

            const tokenUser =
                require("./services/jwtService")
                    .verifyToken(token);

            const requesterUsername =
                tokenUser.username ||
                tokenUser.name ||
                tokenUser.user ||
                tokenUser.sub;

            if (!requesterUsername) {

                return res.status(401).json({
                    success: false,
                    message: "Geçersiz oturum bilgisi."
                });

            }

            const requester =
                await getUser(requesterUsername);

            if (!requester) {

                return res.status(404).json({
                    success: false,
                    message: "Oturum sahibi bulunamadı."
                });

            }

            const allowedRoles = [
                "admin",
                "founder"
            ];

            if (!allowedRoles.includes(requester.role)) {

                return res.status(403).json({
                    success: false,
                    message: "Departman atama yetkiniz yok."
                });

            }

            const targetUsername =
                String(req.params.username || "").trim();

            const department =
                String(req.body.department || "").trim();

            const allowedDepartments = [
                "Adalet Departmanı",
                "Finans Departmanı",
                "Etkinlik Departmanı",
                "Asayiş Departmanı",
                "Terfi Kontrol Departmanı",
                "Genel Eğitim Departmanı"
            ];

            if (!targetUsername) {

                return res.status(400).json({
                    success: false,
                    message: "Kullanıcı adı gerekli."
                });

            }

            if (!allowedDepartments.includes(department)) {

                return res.status(400).json({
                    success: false,
                    message: "Geçersiz departman seçildi."
                });

            }

            const targetUser =
                await getUser(targetUsername);

            if (!targetUser) {

                return res.status(404).json({
                    success: false,
                    message: "Kullanıcı bulunamadı."
                });

            }

            if (
        targetUser.username.toLowerCase() ===
        ADMIN_USERNAME.toLowerCase()
) {

        return res.status(403).json({
        success: false,
        message:
            "Admin hesabının profil bilgileri değiştirilemez."
    });

}

if (
    hasRole(requester, "founder") &&
    !hasRole(requester, "admin") &&
    hasRole(targetUser, "founder")
) {

    return res.status(403).json({
        success: false,
        message:
            "Kurucular, başka bir kurucunun profil bilgilerini değiştiremez."
    });

}


            const updatedUser =
                await updateDepartment(
                    targetUser.username,
                    department
                );

            if (!updatedUser) {

                return res.status(500).json({
                    success: false,
                    message: "Departman güncellenemedi."
                });

            }

            return res.json({
                success: true,
                message:
                    `${targetUser.username} kullanıcısının departmanı güncellendi.`,
                department: updatedUser.department
            });

        } catch (err) {

            console.error(
                "Departman güncelleme hatası:",
                err
            );

            return res.status(401).json({
                success: false,
                message:
                    "Oturum geçersiz veya işlem gerçekleştirilemedi."
            });

        }

    }
);

// ===============================
// TERFİ SİSTEMİ - RÜTBE GÜNCELLE
// ===============================

app.patch(
    "/api/promotion/update-rank",
    async (req, res) => {

        const auth = req.headers.authorization;

        if (!auth || !auth.startsWith("Bearer ")) {

            return res.status(401).json({
                success: false,
                message: "Oturum açmanız gerekiyor."
            });

        }

        const token =
            auth.replace("Bearer ", "").trim();

        try {

            const tokenUser =
                require("./services/jwtService")
                    .verifyToken(token);

            const requesterUsername =
                tokenUser.username ||
                tokenUser.name ||
                tokenUser.user ||
                tokenUser.sub;

            if (!requesterUsername) {

                return res.status(401).json({
                    success: false,
                    message: "Geçersiz oturum bilgisi."
                });

            }

            const requester =
                await getUser(requesterUsername);

            if (!requester) {

                return res.status(404).json({
                    success: false,
                    message: "Oturum sahibi bulunamadı."
                });

            }

            const username =
                String(req.body.username || "").trim();

            const newRank =
                String(req.body.newRank || "").trim();

            if (!username || !newRank) {

                return res.status(400).json({
                    success: false,
                    message: "Kullanıcı adı ve yeni rütbe gerekli."
                });

            }

            if (
                username.length > 80 ||
                newRank.length < 2 ||
                newRank.length > 80
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Gönderilen bilgiler geçersiz."
                });

            }

            if (newRank === "SON RÜTBE") {

                return res.status(400).json({
                    success: false,
                    message: "Son rütbedeki kullanıcı güncellenemez."
                });

            }

            const targetUser =
                await getUser(username);

            if (!targetUser) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Bu nickname ile kayıtlı kullanıcı bulunamadı."
                });

            }

            if (
    targetUser.username.toLowerCase() ===
    ADMIN_USERNAME.toLowerCase()
) {

    return res.status(403).json({
        success: false,
        message:
            "Admin hesabının rütbesi değiştirilemez."
    });

}

if (
    hasRole(requester, "founder") &&
    !hasRole(requester, "admin") &&
    hasRole(targetUser, "founder")
) {

    return res.status(403).json({
        success: false,
        message:
            "Kurucular, başka bir kurucunun rütbesini değiştiremez."
    });

}


            const oldRank =
                targetUser.rank || "";

            if (oldRank === newRank) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Kullanıcının rütbesi zaten bu rütbede."
                });

            }

            const updatedUser =
                await updateRank(
                    targetUser.username,
                    newRank
                );

            if (!updatedUser) {

                return res.status(500).json({
                    success: false,
                    message: "Rütbe güncellenemedi."
                });

            }

            return res.json({
                success: true,
                message:
                    `${updatedUser.username} kullanıcısının rütbesi güncellendi.`,
                user: {
                    username: updatedUser.username,
                    oldRank,
                    newRank: updatedUser.rank
                }
            });

        } catch (err) {

            console.error(
                "Terfi rütbe güncelleme hatası:",
                err
            );

            return res.status(401).json({
                success: false,
                message:
                    "Oturum geçersiz veya işlem gerçekleştirilemedi."
            });

        }

    }
);

// ===============================
// TOPLU TERFİ - RÜTBELERİ GÜNCELLE
// ===============================

app.patch(
    "/api/promotion/update-ranks-bulk",
    async (req, res) => {

        const auth =
            req.headers.authorization;

        if (
            !auth ||
            !auth.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Oturum açmanız gerekiyor."
            });

        }

        const token =
            auth.replace("Bearer ", "").trim();

        try {

            const tokenUser =
                require("./services/jwtService")
                    .verifyToken(token);

            const requesterUsername =
                tokenUser.username ||
                tokenUser.name ||
                tokenUser.user ||
                tokenUser.sub;

            if (!requesterUsername) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Geçersiz oturum bilgisi."
                });

            }

            const requester =
                await getUser(requesterUsername);

            if (!requester) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Oturum sahibi bulunamadı."
                });

            }

            const promotions =
                Array.isArray(req.body.promotions)
                    ? req.body.promotions
                    : [];

            if (promotions.length === 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Güncellenecek personel bulunamadı."
                });

            }

            if (promotions.length > 200) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Tek seferde en fazla 200 personel güncellenebilir."
                });

            }

            const cleanedPromotions = [];

            for (const promotion of promotions) {

                const username =
                    String(
                        promotion.username || ""
                    ).trim();

                const newRank =
                    String(
                        promotion.newRank || ""
                    ).trim();

                if (
                    !username ||
                    !newRank ||
                    username.length > 80 ||
                    newRank.length > 80 ||
                    newRank === "SON RÜTBE"
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Toplu terfi listesinde geçersiz bilgi bulunuyor."
                    });

                }

                if (
    username.toLowerCase() ===
    ADMIN_USERNAME.toLowerCase()
) {

    return res.status(403).json({
        success: false,
        message:
            "Toplu terfi listesinde admin hesabı bulunamaz."
    });

}

const promotionTargetUser =
    await getUser(username);

if (
    requester.role === "founder" &&
    promotionTargetUser?.role === "founder"
) {

    return res.status(403).json({
        success: false,
        message:
            `${promotionTargetUser.username} kurucu rolüne sahip olduğu için değiştirilemez.`
    });

}

                cleanedPromotions.push({
                    username,
                    newRank
                });

            }

            const result =
                await updateRanksBulk(
                    cleanedPromotions
                );

            return res.json({
                success: true,

                message:
                    `${result.updated.length} kişinin rütbesi güncellendi.`,

                result
            });

        } catch (err) {

            console.error(
                "Toplu rütbe güncelleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Toplu rütbe güncelleme işlemi gerçekleştirilemedi."
            });

        }

    }
);

// ===============================================
// KURUCU PANELİ - ROZET / RÜTBE / ROL GÜNCELLE
// ===============================================

app.patch(
    "/api/founder/user/:username/profile-data",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedFounder(req);

            if (authorization.error) {

                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });

            }

            const requester =
                authorization.user;

            const targetUsername =
                String(
                    req.params.username || ""
                ).trim();

            const field =
                String(
                    req.body.field || ""
                ).trim();

            const value =
                String(
                    req.body.value || ""
                ).trim();

            if (
                !targetUsername ||
                !field ||
                !value
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Kullanıcı, alan ve yeni değer zorunludur."
                });

            }

            if (
                targetUsername.length > 80 ||
                value.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Gönderilen bilgiler çok uzun."
                });

            }

            const allowedFields = [
                "badge",
                "rank",
                "role"
            ];

            if (!allowedFields.includes(field)) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Değiştirilemeyen bir alan gönderildi."
                });

            }

            const targetUser =
                await getUser(targetUsername);

            if (!targetUser) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Bu nickname ile kayıtlı kullanıcı bulunamadı."
                });

            }
            if (
    targetUser.username.toLowerCase() ===
    ADMIN_USERNAME.toLowerCase()
) {

    return res.status(403).json({
        success: false,
        message:
            "Admin hesabının profil bilgileri değiştirilemez."
    });

}

if (
    requester.role === "founder" &&
    targetUser.role === "founder"
) {

    return res.status(403).json({
        success: false,
        message:
            "Kurucular, başka bir kurucunun profil bilgilerini değiştiremez."
    });

}


            let oldValue = "";
            let updatedUser = null;
            let actionType = "";

            if (field === "badge") {

                oldValue =
                    targetUser.badge || "";

                if (oldValue === value) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Kullanıcının rozeti zaten bu rozette."
                    });

                }

                updatedUser =
                    await updateBadge(
                        targetUser.username,
                        value
                    );

                actionType =
                    "badge_update";

            }

            if (field === "rank") {

                oldValue =
                    targetUser.rank || "";

                if (oldValue === value) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Kullanıcının rütbesi zaten bu rütbede."
                    });

                }

                updatedUser =
                    await updateRank(
                        targetUser.username,
                        value
                    );

                actionType =
                    "rank_update";

            }

            if (field === "role") {

                const allowedRoles = [
                    "admin",
                    "founder",
                    "moderator",
                    "reporter",
                    "salary_officer",
                    "promotion_controller",
                    "member"
                ];

                if (!allowedRoles.includes(value)) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Geçersiz site rolü seçildi."
                    });

                }

// Admin rolü yalnızca canart0 hesabına aittir.
// Panel üzerinden başka hiçbir kullanıcıya verilemez.
if (value === "admin") {

    return res.status(403).json({
        success: false,
        message:
            "Admin rolü yalnızca canart0 hesabına aittir."
    });

}


// Kurucu rolünü yalnızca admin verebilir
if (
    value === "founder" &&
    !hasRole(requester, "admin")
) {

    return res.status(403).json({
        success: false,
        message:
            "Kurucu rolünü yalnızca admin verebilir."
    });

}

                oldValue =
                    targetUser.role || "member";

                if (oldValue === value) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Kullanıcının site rolü zaten bu rolde."
                    });

                }

                updatedUser =
                    await updateRole(
                        targetUser.username,
                        value
                    );

                actionType =
                    "role_update";

            }

            if (!updatedUser) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Kullanıcı bilgisi güncellenemedi."
                });

            }

            await createAdminLog({
                performedBy:
                    requester.username,

                targetUsername:
                    targetUser.username,

                actionType,

                oldValue,

                newValue: value
            });

            return res.json({
                success: true,

                message:
                    `${targetUser.username} kullanıcısının bilgisi güncellendi.`,

                update: {
                    field,
                    oldValue,
                    newValue: value
                }
            });

        } catch (err) {

            console.error(
                "Kurucu paneli profil güncelleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Kullanıcı bilgisi güncellenemedi."
            });

        }

    }
);

// ===============================================
// KURUCU PANELİ - ÇOKLU ROL GÜNCELLE
// ===============================================

app.patch(
    "/api/founder/user/:username/roles",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedFounder(req);

            if (authorization.error) {

                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });

            }

            const requester =
                authorization.user;

            const targetUsername =
                String(
                    req.params.username || ""
                ).trim();

            const receivedRoles =
                Array.isArray(req.body.roles)
                    ? req.body.roles
                    : [];

            if (!targetUsername) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Kullanıcı adı gerekli."
                });

            }

            const allowedRoles = [
                "member",
                "promotion_controller",
                "salary_officer",
                "reporter",
                "moderator",
                "founder",
                "admin"
            ];

            let cleanRoles = [
                ...new Set(
                    receivedRoles
                        .map(role =>
                            String(role || "").trim()
                        )
                        .filter(Boolean)
                )
            ];

            if (
                cleanRoles.some(
                    role => !allowedRoles.includes(role)
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz bir site rolü gönderildi."
                });

            }

            const targetUser =
                await getUser(targetUsername);

            if (!targetUser) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Kullanıcı bulunamadı."
                });

            }

            if (
                targetUser.username.toLowerCase() ===
                ADMIN_USERNAME.toLowerCase()
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Admin hesabının rolleri değiştirilemez."
                });

            }

            if (
                hasRole(requester, "founder") &&
                !hasRole(requester, "admin") &&
                hasRole(targetUser, "founder")
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Kurucular, başka bir kurucunun rollerini değiştiremez."
                });

            }

            if (
                cleanRoles.includes("admin")
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Admin rolü başka bir kullanıcıya verilemez."
                });

            }

            if (
                cleanRoles.includes("founder") &&
                !hasRole(requester, "admin")
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Kurucu rolünü yalnızca admin verebilir."
                });

            }

            /*
             * Üye rolü başka yetkili rollerle birlikte tutulmaz.
             */
            const hasAuthorityRole =
                cleanRoles.some(
                    role => role !== "member"
                );

            if (hasAuthorityRole) {

                cleanRoles =
                    cleanRoles.filter(
                        role => role !== "member"
                    );

            }

            /*
             * Hiç rol seçilmediyse otomatik üye yap.
             */
            if (cleanRoles.length === 0) {

                cleanRoles = ["member"];

            }

            const oldRoles =
                getUserRoleList(targetUser);

            const sortedOldRoles =
                [...oldRoles].sort();

            const sortedNewRoles =
                [...cleanRoles].sort();

            const rolesUnchanged =
                JSON.stringify(sortedOldRoles) ===
                JSON.stringify(sortedNewRoles);

            if (rolesUnchanged) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Kullanıcının rollerinde değişiklik yapılmadı."
                });

            }

            const updatedRoles =
                await setUserRoles(
                    targetUser.username,
                    cleanRoles
                );

            if (!updatedRoles) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Kullanıcının rolleri güncellenemedi."
                });

            }

            await createAdminLog({
                performedBy:
                    requester.username,

                targetUsername:
                    targetUser.username,

                actionType:
                    "roles_update",

                oldValue:
                    sortedOldRoles.join(", "),

                newValue:
                    [...updatedRoles]
                        .sort()
                        .join(", ")
            });

            return res.json({
                success: true,
                message:
                    `${targetUser.username} kullanıcısının rolleri güncellendi.`,
                roles: updatedRoles
            });

        } catch (err) {

            console.error(
                "Çoklu rol güncelleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Kullanıcı rolleri güncellenemedi."
            });

        }

    }
);

// ===============================================
// KURUCU PANELİ - ADMIN İŞLEM LOGLARI
// ===============================================

app.get(
    "/api/founder/admin-logs",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedFounder(req);

            if (authorization.error) {

                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });

            }

            const { pool } =
                require("./database/db");

            const result =
                await pool.query(
                    `SELECT
                        id,
                        "performedBy",
                        "targetUsername",
                        "actionType",
                        "oldValue",
                        "newValue",
                        "createdAt"
                     FROM admin_logs
                     ORDER BY "createdAt" DESC
                     LIMIT 200`
                );

            return res.json({
                success: true,
                logs: result.rows
            });

        } catch (err) {

            console.error(
                "Admin logları alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "İşlem geçmişi alınamadı."
            });

        }

    }
);

app.get(
    "/api/founder/users/search",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedFounder(req);

            if (authorization.error) {

                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });

            }

            const query =
                String(req.query.q || "").trim();

            if (query.length < 2) {

                return res.json({
                    success: true,
                    users: []
                });

            }

            if (query.length > 80) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Arama metni çok uzun."
                });

            }

            const users =
                await searchUsersByUsername(
                    query,
                    8
                );

            return res.json({
                success: true,
                users
            });

        } catch (err) {

            console.error(
                "Kullanıcı öneri arama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Kullanıcı önerileri alınamadı."
            });

        }

    }
);

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