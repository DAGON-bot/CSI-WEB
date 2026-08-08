const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const {
    createSalaryHistory,
    getPendingDiscordSalaries,
    markSalaryAsDiscordSent,
    getSalaryHistoryByPersonnelName,
    getSalaryHistoryById,
    getSalaryHistoryByDate
} = require(
    "./models/salaryHistoryModel"
);

const {
    createAttendanceHistory,
    getPendingDiscordAttendances,
    getAttendanceHistoryById,
    markAttendanceAsDiscordSent
} = require(
    "./models/attendanceHistoryModel"
);

const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const {
    generateToken,
    verifyToken
} = require("./services/jwtService");
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
    completePasswordReset,
    getPendingApprovals,
    approveUserAccount,
    rejectUserAccount,
    queueRegistrationDiscordNotification,
    getPendingRegistrationDiscordNotifications,
    markRegistrationDiscordNotificationAsSent
} = require("./models/userModel");

const {
    createNewsArticle,
    getPublishedNewsArticles,
    getNewsArticleById,
    getNewsArticlesForPanel,
    updateNewsArticle,
    deleteNewsArticle,
    setNewsArticleFeatured
} = require("./models/newsModel");

const {
    getNewsInteractionSummary,
    toggleNewsLike,
    setNewsReaction,
    getNewsComments,
    createNewsComment,
    getNewsCommentById,
    deleteNewsComment
} = require("./models/newsInteractionModel");

const {
    createAnnouncement,
    getPublishedAnnouncements,
    getAnnouncementById,
    getAnnouncementsForPanel,
    updateAnnouncement,
    deleteAnnouncement
} = require("./models/announcementModel");

const {
    createPromotionHistory,
    getPendingDiscordPromotions,
    markPromotionAsDiscordSent,
    getPromotionHistoryById,
    getPromotionHistoryByUsername,
    getPromotionHistoryCountByUsername
} = require(
    "./models/promotionHistoryModel"
);

const {
    createBulkPromotionHistory,
    getPendingBulkPromotions,
    getBulkPromotionById,
    markBulkPromotionAsDiscordSent
} = require(
    "./models/bulkPromotionHistoryModel"
);

const {
    createTtAnnouncement,
    getPendingTtAnnouncements,
    markTtAnnouncementAsSent
} = require(
    "./models/ttAnnouncementModel"
);

const {
    pool,
    initDatabase
} = require("./database/db");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");
const {
    getRadioSettings,
    setYoutubeDjRadio,
    startYoutubeDjPlaybackClock,
    updateYoutubeDjPosition,
    stopDjRadio
} = require("./models/radioModel");

const ADMIN_USERNAME = "canart0";
const PANEL_PERMISSIONS = {

    promotion: [
        "admin",
        "founder",
        "moderator",
        "promotion_controller",
    
    ],

    bulkPromotion: [
        "admin",
        "founder",
        "moderator",
        "promotion_controller",
    
    ],

    salary: [
    "admin",
    "founder",
    "moderator",
    "salary_officer"
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
    "attendance_controller"
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

function canManageAccountApprovals(user) {

    return hasAnyRole(
        user,
        [
            "admin",
            "founder",
            "moderator"
        ]
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

function canAccessNewsPanel(user) {
    return hasPanelPermission(
        user,
        "news"
    );
}

function canManageAllNews(user) {
    return hasAnyRole(
        user,
        [
            "admin",
            "founder",
            "moderator"
        ]
    );
}

function canManageNewsArticle(
    user,
    article
) {

    if (!user || !article) {
        return false;
    }

    if (canManageAllNews(user)) {
        return true;
    }

    return (
        hasRole(user, "reporter") &&
        Number(article.authorUserId) ===
        Number(user.id)
    );
}

const app = express();

// ========================================
// TERFİ GEÇMİŞİ - PERSONELE GÖRE GETİR
// ========================================

app.get(
    "/api/promotion-history/:username",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "promotion"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Terfi geçmişini görüntüleme yetkiniz bulunmuyor."
                });
            }

            const username =
                String(
                    req.params.username || ""
                ).trim();

            if (!username) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Personel adı gereklidir."
                });
            }

            if (username.length > 80) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Personel adı çok uzun."
                });
            }

            const perPage = 5;

            const requestedPage =
                Math.max(
                    Number(req.query.page) || 1,
                    1
                );

            const totalCount =
                await getPromotionHistoryCountByUsername(
                    username
                );

            const totalPages =
                Math.max(
                    Math.ceil(
                        totalCount / perPage
                    ),
                    1
                );

            const page =
                Math.min(
                    requestedPage,
                    totalPages
                );

            const offset =
                (page - 1) * perPage;

            const history =
                await getPromotionHistoryByUsername(
                    username,
                    perPage,
                    offset
                );

            return res.json({
                success: true,
                username,
                count: totalCount,
                page,
                perPage,
                totalPages,
                history
            });

        } catch (err) {

            console.error(
                "Terfi geçmişi yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Terfi geçmişi yüklenemedi."
            });
        }
    }
);

// ========================================
// MAAŞ GEÇMİŞİ - PERSONELE GÖRE GETİR
// ========================================

app.get(
    "/api/salary-history/:personnelName",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "salary"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Maaş geçmişini görüntüleme yetkiniz bulunmuyor."
                });
            }

            const personnelName =
                String(
                    req.params.personnelName || ""
                ).trim();

            if (!personnelName) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Personel adı gereklidir."
                });
            }

            if (personnelName.length > 80) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Personel adı çok uzun."
                });
            }

            const requestedLimit =
                Number(
                    req.query.limit || 20
                );

            const history =
                await getSalaryHistoryByPersonnelName(
                    personnelName,
                    requestedLimit
                );

            return res.json({
                success: true,
                personnelName,
                count:
                    history.length,
                history
            });

        } catch (err) {

            console.error(
                "Maaş geçmişi yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Maaş geçmişi yüklenemedi."
            });
        }
    }
);

// ===============================
// HABER GÖRSELİ YÜKLEME AYARLARI
// ===============================

const newsUploadDirectory =
    path.join(
        __dirname,
        "..",
        "uploads",
        "news"
    );

fs.mkdirSync(
    newsUploadDirectory,
    {
        recursive: true
    }
);

const allowedNewsImageMimeTypes =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]);

const newsImageExtensionByMimeType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

const newsImageStorage =
    multer.diskStorage({

        destination: (
            req,
            file,
            callback
        ) => {

            callback(
                null,
                newsUploadDirectory
            );
        },

        filename: (
            req,
            file,
            callback
        ) => {

            const extension =
                newsImageExtensionByMimeType[
                    file.mimetype
                ];

            const uniqueName =
                [
                    Date.now(),
                    crypto
                        .randomBytes(12)
                        .toString("hex")
                ].join("-");

            callback(
                null,
                `${uniqueName}${extension}`
            );
        }
    });

const newsImageUpload =
    multer({

        storage:
            newsImageStorage,

        limits: {
            fileSize:
                5 * 1024 * 1024,

            files:
                1,

            fields:
                0,

            parts:
                1
        },

        fileFilter: (
            req,
            file,
            callback
        ) => {

            if (
                !allowedNewsImageMimeTypes.has(
                    file.mimetype
                )
            ) {

                return callback(
                    new Error(
                        "Yalnızca JPG, PNG veya WebP görseller yüklenebilir."
                    )
                );
            }

            return callback(
                null,
                true
            );
        }
    });

const httpServer =
    http.createServer(app);

const io =
    new Server(httpServer, {
        cors: {
            origin: true,
            methods: [
                "GET",
                "POST"
            ]
        }
    });

    app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "..",
            "uploads"
        )
    )
);

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..")));

const chatLastMessageTimes =
    new Map();

function getSocketToken(socket) {

    const authToken =
        socket.handshake.auth?.token;

    if (authToken) {
        return String(authToken).trim();
    }

    const authorization =
        socket.handshake.headers
            ?.authorization;

    if (
        authorization &&
        authorization.startsWith("Bearer ")
    ) {
        return authorization
            .replace("Bearer ", "")
            .trim();
    }

    return "";
}

function canManageAnnouncement(
    user,
    announcement
) {

    if (!user || !announcement) {
        return false;
    }

    if (canManageAllNews(user)) {
        return true;
    }

    return (
        hasRole(user, "reporter") &&
        Number(announcement.authorUserId) ===
        Number(user.id)
    );
}

async function getSocketUser(socket) {

    const token =
        getSocketToken(socket);

    if (!token) {
        return null;
    }

    try {

        const tokenUser =
            verifyToken(token);

        const username =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        if (!username) {
            return null;
        }

        const user =
            await getUser(username);

        if (
            !user ||
            !user.verified ||
            !user.password
        ) {
            return null;
        }

        return user;

    } catch (err) {

        return null;

    }
}

async function getOptionalRequestUser(req) {

    const authorization =
        String(
            req.headers.authorization || ""
        ).trim();

    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {
        return null;
    }

    const token =
        authorization
            .replace("Bearer ", "")
            .trim();

    if (!token) {
        return null;
    }

    try {

        const tokenUser =
            verifyToken(token);

        const username =
            tokenUser.username ||
            tokenUser.name ||
            tokenUser.user ||
            tokenUser.sub;

        if (!username) {
            return null;
        }

        const user =
            await getUser(username);

        if (
            !user ||
            !user.verified ||
            !user.password ||
            user.approvalStatus !==
                "approved"
        ) {
            return null;
        }

        return user;

    } catch (err) {

        return null;
    }
}

async function requireRequestUser(
    req,
    res
) {

    const user =
        await getOptionalRequestUser(
            req
        );

    if (!user) {

        res.status(401).json({
            success: false,
            message:
                "Bu işlem için giriş yapmalısınız."
        });

        return null;
    }

    return user;
}

function requireDiscordWorkerKey(
    req,
    res
) {

    const configuredKey =
        String(
            process.env.DISCORD_WORKER_API_KEY ||
            ""
        ).trim();

    const requestKey =
        String(
            req.headers[
                "x-discord-worker-key"
            ] || ""
        ).trim();

    if (!configuredKey) {

        res.status(503).json({
            success: false,
            message:
                "Discord worker anahtarı sunucuda tanımlı değil."
        });

        return false;
    }

    if (
        !requestKey ||
        requestKey !== configuredKey
    ) {

        res.status(401).json({
            success: false,
            message:
                "Geçersiz Discord worker anahtarı."
        });

        return false;
    }

    return true;
}

// ========================================
// DISCORD - TERFİ KAYDI OLUŞTUR
// ========================================

app.post(
    "/api/discord/promotion",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "promotion"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Discord terfi işlemi için yetkiniz bulunmuyor."
                });
            }

            const username =
                String(
                    req.body?.username || ""
                ).trim();

            const oldBadge =
                String(
                    req.body?.oldBadge || ""
                ).trim();

            const oldRank =
                String(
                    req.body?.oldRank || ""
                ).trim();

            const newBadge =
                String(
                    req.body?.newBadge || ""
                ).trim();

            const newRank =
                String(
                    req.body?.newRank || ""
                ).trim();

                

                const workedHours =
    Number(
        req.body?.workedHours
    );

const workedMinutes =
    Number(
        req.body?.workedMinutes
    );

            if (
                !username ||
                !oldBadge ||
                !oldRank ||
                !newBadge ||
                !newRank
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Terfi bilgilerinin tamamı gereklidir."
                });
            }

            if (
    !Number.isInteger(workedHours) ||
    workedHours < 0 ||
    workedHours > 100000
) {

    return res.status(400).json({
        success: false,
        message:
            "Toplam çalışma saati geçersiz."
    });
}

if (
    !Number.isInteger(workedMinutes) ||
    workedMinutes < 0 ||
    workedMinutes > 59
) {

    return res.status(400).json({
        success: false,
        message:
            "Toplam çalışma dakikası 0 ile 59 arasında olmalı."
    });
}

            const values = [
                username,
                oldBadge,
                oldRank,
                newBadge,
                newRank
            ];

            if (
                values.some(
                    value => value.length > 80
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Terfi bilgilerinden biri çok uzun."
                });
            }

            const promotion =
    await createPromotionHistory({
        username,
        oldBadge,
        oldRank,
        newBadge,
        newRank,

        promotedBy:
            user.username,

        workedHours:
            Number.isInteger(workedHours)
                ? workedHours
                : 0,

        workedMinutes:
            Number.isInteger(workedMinutes)
                ? workedMinutes
                : 0
    });

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    username,

                actionType:
                    "discord_promotion_queued",

                oldValue:
                    `${oldBadge} / ${oldRank}`,

                newValue:
                    `${newBadge} / ${newRank}`
            });

            return res.status(201).json({
                success: true,
                message:
                    "Terfi Discord kuyruğuna eklendi.",
                promotion
            });

        } catch (err) {

            console.error(
                "Discord terfi kayıt hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Terfi Discord kuyruğuna eklenemedi."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN YENİ KAYIT BİLDİRİMLERİ
// ========================================

app.get(
    "/api/discord/pending-registrations",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const requestedLimit =
                Number(
                    req.query.limit || 10
                );

            const registrations =
                await getPendingRegistrationDiscordNotifications(
                    requestedLimit
                );

            return res.json({
                success: true,
                count:
                    registrations.length,
                registrations
            });

        } catch (err) {

            console.error(
                "Bekleyen yeni kayıt Discord bildirimleri alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen yeni kayıt bildirimleri alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - YENİ KAYIT BİLDİRİMİNİ TAMAMLA
// ========================================

app.patch(
    "/api/discord/registrations/:notificationId/sent",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const notificationId =
                Number(
                    req.params.notificationId
                );

            const discordMessageId =
                String(
                    req.body?.discordMessageId ||
                    ""
                ).trim();

            if (
                !Number.isInteger(notificationId) ||
                notificationId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz kayıt bildirim numarası."
                });
            }

            if (!discordMessageId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Discord mesaj numarası gereklidir."
                });
            }

            const notification =
                await markRegistrationDiscordNotificationAsSent(
                    notificationId,
                    discordMessageId
                );

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Kayıt bildirimi bulunamadı."
                });
            }

            return res.json({
                success: true,
                notification
            });

        } catch (err) {

            console.error(
                "Yeni kayıt Discord bildirimi tamamlanamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Yeni kayıt bildirimi tamamlanamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN TERFİLERİ GETİR
// ========================================

app.get(
    "/api/discord/pending-promotions",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const requestedLimit =
                Number(
                    req.query.limit || 10
                );

            const promotions =
                await getPendingDiscordPromotions(
                    requestedLimit
                );

            return res.json({
                success: true,
                count:
                    promotions.length,
                promotions
            });

        } catch (err) {

            console.error(
                "Bekleyen Discord terfileri alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen Discord terfileri alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - TERFİYİ TAMAMLANDI İŞARETLE
// ========================================

app.patch(
    "/api/discord/promotions/:promotionId/sent",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const promotionId =
                Number(
                    req.params.promotionId
                );

            const discordMessageId =
                String(
                    req.body?.discordMessageId ||
                    ""
                ).trim();

            if (
                !Number.isInteger(promotionId) ||
                promotionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz terfi kayıt numarası."
                });
            }

            if (
                !discordMessageId ||
                discordMessageId.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçerli Discord mesaj numarası gereklidir."
                });
            }

            const existingPromotion =
                await getPromotionHistoryById(
                    promotionId
                );

            if (!existingPromotion) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Terfi kaydı bulunamadı."
                });
            }

            if (
                existingPromotion.discordSent
            ) {

                return res.json({
                    success: true,
                    message:
                        "Terfi daha önce Discord'a gönderilmiş.",
                    promotion:
                        existingPromotion
                });
            }

            const promotion =
                await markPromotionAsDiscordSent({
                    promotionId,
                    discordMessageId
                });

            if (!promotion) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Terfi kaydı tamamlanamadı."
                });
            }

            return res.json({
                success: true,
                message:
                    "Terfi Discord'a gönderildi olarak işaretlendi.",
                promotion
            });

        } catch (err) {

            console.error(
                "Discord terfi tamamlama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Discord terfi kaydı tamamlanamadı."
            });
        }
    }
);

// ========================================
// DISCORD - MAAŞ KAYDI OLUŞTUR
// ========================================

app.post(
    "/api/discord/salary",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "salary"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Discord maaş işlemi için yetkiniz bulunmuyor."
                });
            }

            const personnelName =
                String(
                    req.body?.personnelName || ""
                ).trim();

            const salaryOfficerName =
                String(
                    req.body?.salaryOfficerName || ""
                ).trim();

            const badge =
                String(
                    req.body?.badge || ""
                ).trim();

            const credit =
                Number(
                    req.body?.credit
                );

            const requiredMinutes =
                Number(
                    req.body?.requiredMinutes
                );

            const previousHours =
                Number(
                    req.body?.previousHours
                );

            const previousMinutes =
                Number(
                    req.body?.previousMinutes
                );

            const currentHours =
                Number(
                    req.body?.currentHours
                );

            const currentMinutes =
                Number(
                    req.body?.currentMinutes
                );

            const workedMinutes =
                Number(
                    req.body?.workedMinutes
                );

            if (
                !personnelName ||
                !salaryOfficerName ||
                !badge
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Maaş bilgilerinin tamamı gereklidir."
                });
            }

            if (
                personnelName.length > 80 ||
                salaryOfficerName.length > 80 ||
                badge.length > 80
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Maaş bilgilerinden biri çok uzun."
                });
            }

            const integerValues = [
                credit,
                requiredMinutes,
                previousHours,
                previousMinutes,
                currentHours,
                currentMinutes,
                workedMinutes
            ];

            if (
                integerValues.some(
                    value =>
                        !Number.isInteger(value) ||
                        value < 0
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Maaş süre veya kredi bilgileri geçersiz."
                });
            }

            if (
                previousMinutes > 59 ||
                currentMinutes > 59
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Dakika bilgileri 0 ile 59 arasında olmalıdır."
                });
            }

            const previousTotalMinutes =
                (
                    previousHours * 60
                ) +
                previousMinutes;

            const currentTotalMinutes =
                (
                    currentHours * 60
                ) +
                currentMinutes;

            if (
                currentTotalMinutes <
                previousTotalMinutes
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Şu anki toplam çalışma süresi eski süreden düşük olamaz."
                });
            }

            const calculatedWorkedMinutes =
                currentTotalMinutes -
                previousTotalMinutes;

            if (
                calculatedWorkedMinutes !==
                workedMinutes
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Çalışılan süre bilgisi hesaplamayla uyuşmuyor."
                });
            }

            if (
                workedMinutes <
                requiredMinutes
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Personel bu maaş rozeti için gerekli süreyi doldurmamış."
                });
            }

            const salary =
                await createSalaryHistory({
                    personnelName,

                    salaryOfficerName,

                    badge,

                    credit,

                    requiredMinutes,

                    previousHours,

                    previousMinutes,

                    currentHours,

                    currentMinutes,

                    workedMinutes
                });

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    personnelName,

                actionType:
                    "discord_salary_queued",

                oldValue:
                    `${previousHours} saat ${previousMinutes} dakika`,

                newValue:
                    `${badge} / ${credit} kredi / ${currentHours} saat ${currentMinutes} dakika`
            });

            return res.status(201).json({
                success: true,
                message:
                    "Maaş Discord kuyruğuna eklendi.",
                salary
            });

        } catch (err) {

            console.error(
                "Discord maaş kayıt hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Maaş Discord kuyruğuna eklenemedi."
            });
        }
    }
);

// ========================================
// DISCORD BOT - GÜNLÜK MAAŞ RAPOR VERİSİ
// ========================================

app.get(
    "/api/discord/salary-daily-report",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const reportDate =
                String(
                    req.query.date || ""
                ).trim() || null;

            const salaries =
                await getSalaryHistoryByDate(
                    reportDate
                );

            // Sadece Discord'a gerçekten
            // gönderilmiş maaş işlemleri.
            const sentSalaries =
                salaries.filter(
                    salary =>
                        salary.discordSent === true
                );

            return res.json({
                success: true,

                reportDate,

                count:
                    sentSalaries.length,

                salaries:
                    sentSalaries
            });

        } catch (err) {

            console.error(
                "Günlük maaş raporu alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Günlük maaş raporu alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN MAAŞLARI GETİR
// ========================================

app.get(
    "/api/discord/pending-salaries",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const requestedLimit =
                Number(
                    req.query.limit || 10
                );

            const salaries =
                await getPendingDiscordSalaries(
                    requestedLimit
                );

            return res.json({
                success: true,
                count:
                    salaries.length,
                salaries
            });

        } catch (err) {

            console.error(
                "Bekleyen Discord maaşları alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen Discord maaşları alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - MAAŞI TAMAMLANDI İŞARETLE
// ========================================

app.patch(
    "/api/discord/salaries/:salaryId/sent",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const salaryId =
                Number(
                    req.params.salaryId
                );

            const discordMessageId =
                String(
                    req.body?.discordMessageId ||
                    ""
                ).trim();

            if (
                !Number.isInteger(salaryId) ||
                salaryId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz maaş kayıt numarası."
                });
            }

            if (
                !discordMessageId ||
                discordMessageId.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçerli Discord mesaj numarası gereklidir."
                });
            }

            const existingSalary =
                await getSalaryHistoryById(
                    salaryId
                );

            if (!existingSalary) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Maaş kaydı bulunamadı."
                });
            }

            if (
                existingSalary.discordSent
            ) {

                return res.json({
                    success: true,
                    message:
                        "Maaş daha önce Discord'a gönderilmiş.",
                    salary:
                        existingSalary
                });
            }

            const salary =
                await markSalaryAsDiscordSent({
                    salaryId,
                    discordMessageId
                });

            if (!salary) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Maaş kaydı tamamlanamadı."
                });
            }

            return res.json({
                success: true,
                message:
                    "Maaş Discord'a gönderildi olarak işaretlendi.",
                salary
            });

        } catch (err) {

            console.error(
                "Discord maaş tamamlama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Discord maaş kaydı tamamlanamadı."
            });
        }
    }
);

// ========================================
// DISCORD - PUANTAJ KAYDI OLUŞTUR
// ========================================

app.post(
    "/api/discord/attendance",
    async (req, res) => {

        try {

            const user = await requireRequestUser(req, res);

            if (!user) {
                return;
            }

            if (!hasPanelPermission(user, "puantaj")) {
                return res.status(403).json({
                    success: false,
                    message: "Discord puantaj işlemi için yetkiniz bulunmuyor."
                });
            }

            const personnelName = String(
                req.body?.personnelName || ""
            ).trim();

            const fields = {
                currentXP: Number(req.body?.currentXP),
                mrCount: Number(req.body?.mrCount),
                promotionCount: Number(req.body?.promotionCount),
                educationCount: Number(req.body?.educationCount),
                bulkPromotionCount: Number(req.body?.bulkPromotionCount),
                licenseCount: Number(req.body?.licenseCount),
                activeHours: Number(req.body?.activeHours),
                workingHours: Number(req.body?.workingHours),
                normalScore: Number(req.body?.normalScore),
                penalty: Number(req.body?.penalty),
                netNormalScore: Number(req.body?.netNormalScore),
                extraScore: Number(req.body?.extraScore),
                newXP: Number(req.body?.newXP),
                earnedEsCoin: Number(req.body?.earnedEsCoin)
            };

            if (!personnelName) {
                return res.status(400).json({
                    success: false,
                    message: "Personel adı gereklidir."
                });
            }

            if (personnelName.length > 80) {
                return res.status(400).json({
                    success: false,
                    message: "Personel adı çok uzun."
                });
            }

            const nonNegativeFields = [
                fields.mrCount,
                fields.promotionCount,
                fields.educationCount,
                fields.bulkPromotionCount,
                fields.licenseCount,
                fields.activeHours,
                fields.workingHours,
                fields.normalScore,
                fields.penalty,
                fields.earnedEsCoin
            ];

            if (nonNegativeFields.some(
                value => !Number.isInteger(value) || value < 0
            )) {
                return res.status(400).json({
                    success: false,
                    message: "Puantaj sayısal bilgileri geçersiz."
                });
            }

            const signedFields = [
                fields.currentXP,
                fields.netNormalScore,
                fields.extraScore,
                fields.newXP
            ];

            if (signedFields.some(
                value => !Number.isInteger(value)
            )) {
                return res.status(400).json({
                    success: false,
                    message: "Puantaj XP bilgileri geçersiz."
                });
            }

            const calculatedNormal =
    (
        fields.mrCount * 1
    ) +
    (
        fields.promotionCount * 3
    ) +
    (
        fields.educationCount * 5
    ) +
    (
        fields.bulkPromotionCount * 10
    ) +
    (
        fields.licenseCount * 10
    ) +
    (
        fields.activeHours * 1
    ) +
    (
        fields.workingHours * 3
    );

const calculatedNet =
    Math.min(
        Math.max(
            calculatedNormal -
            fields.penalty,
            0
        ),
        75
    );

            const calculatedNewXP = fields.currentXP + calculatedNet + fields.extraScore;
            const calculatedCoin = calculatedNet === 75 ? 1 : 0;

            if (
                calculatedNormal !== fields.normalScore ||
                calculatedNet !== fields.netNormalScore ||
                calculatedNewXP !== fields.newXP ||
                calculatedCoin !== fields.earnedEsCoin
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Puantaj hesaplaması sunucu hesabıyla uyuşmuyor."
                });
            }

            const attendance = await createAttendanceHistory({
                personnelName,
                performedBy: user.username,
                ...fields
            });

            await createAdminLog({
                performedBy: user.username,
                targetUsername: personnelName,
                actionType: "discord_attendance_queued",
                oldValue: `${fields.currentXP} XP`,
                newValue: `${fields.newXP} XP / ${fields.earnedEsCoin} Eş Coin`
            });

            return res.status(201).json({
                success: true,
                message: "Puantaj Discord kuyruğuna eklendi.",
                attendance
            });

        } catch (err) {

            console.error("Discord puantaj kayıt hatası:", err);

            return res.status(500).json({
                success: false,
                message: "Puantaj Discord kuyruğuna eklenemedi."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN PUANTAJLAR
// ========================================

app.get(
    "/api/discord/pending-attendances",
    async (req, res) => {

        try {

            const authorized = requireDiscordWorkerKey(req, res);

            if (!authorized) {
                return;
            }

            const attendances = await getPendingDiscordAttendances(
                req.query.limit
            );

            return res.json({
                success: true,
                count: attendances.length,
                attendances
            });

        } catch (err) {

            console.error("Bekleyen puantaj kayıtları alınamadı:", err);

            return res.status(500).json({
                success: false,
                message: "Bekleyen puantaj kayıtları alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - PUANTAJ GÖNDERİLDİ
// ========================================

app.patch(
    "/api/discord/attendances/:attendanceId/sent",
    async (req, res) => {

        try {

            const authorized = requireDiscordWorkerKey(req, res);

            if (!authorized) {
                return;
            }

            const attendanceId = Number(req.params.attendanceId);
            const discordMessageId = String(
                req.body?.discordMessageId || ""
            ).trim();

            if (!Number.isInteger(attendanceId) || attendanceId <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Geçersiz puantaj kayıt numarası."
                });
            }

            if (!discordMessageId || discordMessageId.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Geçerli Discord mesaj numarası gereklidir."
                });
            }

            const existing = await getAttendanceHistoryById(attendanceId);

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Puantaj kaydı bulunamadı."
                });
            }

            if (existing.discordSent) {
                return res.json({
                    success: true,
                    message: "Puantaj daha önce Discord'a gönderilmiş.",
                    attendance: existing
                });
            }

            const attendance = await markAttendanceAsDiscordSent({
                attendanceId,
                discordMessageId
            });

            if (!attendance) {
                return res.status(409).json({
                    success: false,
                    message: "Puantaj kaydı tamamlanamadı."
                });
            }

            return res.json({
                success: true,
                message: "Puantaj Discord'a gönderildi olarak işaretlendi.",
                attendance
            });

        } catch (err) {

            console.error("Puantaj gönderildi işaretleme hatası:", err);

            return res.status(500).json({
                success: false,
                message: "Puantaj kaydı tamamlanamadı."
            });
        }
    }
);

// ========================================
// DISCORD - TOPLU TERFİ DUYURUSU OLUŞTUR
// ========================================

app.post(
    "/api/discord/tt-announcements",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "bulkPromotion"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Toplu terfi duyurusu için yetkiniz bulunmuyor."
                });
            }

            const time =
                String(
                    req.body?.time ||
                    ""
                ).trim();

            const allowedTimes =
                [
                    "13:00",
                    "15:00",
                    "18:00",
                    "20:00",
                    "22:00"
                ];

            if (
                !allowedTimes.includes(
                    time
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçerli bir toplu terfi saati seçin."
                });
            }

            const message =
                `${time} TOPLU TERFİ İÇİN SIRAYAAA @everyone`;

            const announcement =
                await createTtAnnouncement({
                    announcementTime:
                        time,
                    message,
                    createdBy:
                        user.username
                });

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    "Toplu Terfi Duyurusu",

                actionType:
                    "tt_announcement_queued",

                oldValue:
                    null,

                newValue:
                    message
            });

            return res.status(201).json({
                success: true,
                message:
                    "Toplu terfi duyurusu Discord kuyruğuna eklendi.",
                announcement
            });

        } catch (err) {

            console.error(
                "Toplu terfi duyuru kayıt hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Toplu terfi duyurusu kuyruğa eklenemedi."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN TT DUYURULARI
// ========================================

app.get(
    "/api/discord/pending-tt-announcements",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const announcements =
                await getPendingTtAnnouncements(
                    Number(
                        req.query.limit ||
                        10
                    )
                );

            return res.json({
                success: true,
                count:
                    announcements.length,
                announcements
            });

        } catch (err) {

            console.error(
                "Bekleyen TT duyuruları alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen TT duyuruları alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - TT DUYURUSUNU TAMAMLA
// ========================================

app.patch(
    "/api/discord/tt-announcements/:announcementId/sent",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const announcementId =
                Number(
                    req.params
                        .announcementId
                );

            const discordMessageId =
                String(
                    req.body
                        ?.discordMessageId ||
                    ""
                ).trim();

            if (
                !Number.isInteger(
                    announcementId
                ) ||
                announcementId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz duyuru kayıt numarası."
                });
            }

            if (!discordMessageId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Discord mesaj numarası gereklidir."
                });
            }

            const announcement =
                await markTtAnnouncementAsSent({
                    announcementId,
                    discordMessageId
                });

            if (!announcement) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Duyuru daha önce gönderilmiş veya bulunamadı."
                });
            }

            return res.json({
                success: true,
                announcement
            });

        } catch (err) {

            console.error(
                "TT duyuru tamamlama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "TT duyurusu tamamlanamadı."
            });
        }
    }
);

// ========================================
// DISCORD - TOPLU TERFİ KAYDI OLUŞTUR
// ========================================

app.post(
    "/api/discord/bulk-promotions",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            if (
                !hasPanelPermission(
                    user,
                    "bulkPromotion"
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Toplu terfi Discord işlemi için yetkiniz bulunmuyor."
                });
            }

            const distributorName =
                String(
                    req.body?.distributorName || ""
                ).trim();

            const distributorCode =
                String(
                    req.body?.distributorCode || ""
                ).trim();

            const startTime =
                String(
                    req.body?.startTime || ""
                ).trim();

            const endTime =
                String(
                    req.body?.endTime || ""
                ).trim();

            const multiplier =
                Number(
                    req.body?.multiplier
                );

            const promotions =
                Array.isArray(
                    req.body?.promotions
                )
                    ? req.body.promotions
                    : [];

            if (
                !distributorName ||
                !distributorCode ||
                !startTime ||
                !endTime
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Toplu terfi bilgileri eksik."
                });
            }

            if (
                !Number.isInteger(multiplier) ||
                multiplier < 1 ||
                multiplier > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Dağıtım çarpanı geçersiz."
                });
            }

            if (
                promotions.length === 0 ||
                promotions.length > 50
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Toplu terfi listesi 1 ile 50 kişi arasında olmalı."
                });
            }

            const cleanedPromotions =
                promotions.map(
                    (
                        promotion,
                        index
                    ) => {

                        const username =
                            String(
                                promotion?.username || ""
                            ).trim();

                        const oldRank =
                            String(
                                promotion?.oldRank || ""
                            ).trim();

                        const newRank =
                            String(
                                promotion?.newRank || ""
                            ).trim();

                        if (
                            !username ||
                            !oldRank ||
                            !newRank
                        ) {

                            throw new Error(
                                `${index + 1}. personelin bilgileri eksik.`
                            );
                        }

                        if (
                            username.length > 80 ||
                            oldRank.length > 80 ||
                            newRank.length > 80
                        ) {

                            throw new Error(
                                `${index + 1}. personelin bilgileri çok uzun.`
                            );
                        }

                        return {
                            username,
                            oldRank,
                            newRank
                        };
                    }
                );

            const bulkPromotion =
                await createBulkPromotionHistory({
                    distributorName,
                    distributorCode,
                    startTime,
                    endTime,
                    multiplier,
                    promotions:
                        cleanedPromotions,
                    createdBy:
                        user.username
                });

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    distributorName,

                actionType:
                    "discord_bulk_promotion_queued",

                oldValue:
                    null,

                newValue:
                    `${cleanedPromotions.length} personel`
            });

            return res.status(201).json({
                success: true,
                message:
                    "Toplu terfi Discord kuyruğuna eklendi.",
                bulkPromotion
            });

        } catch (err) {

            console.error(
                "Toplu terfi Discord kayıt hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    err.message ||
                    "Toplu terfi Discord kuyruğuna eklenemedi."
            });
        }
    }
);

// ========================================
// DISCORD BOT - BEKLEYEN TOPLU TERFİLER
// ========================================

app.get(
    "/api/discord/pending-bulk-promotions",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const requestedLimit =
                Number(
                    req.query.limit || 10
                );

            const bulkPromotions =
                await getPendingBulkPromotions(
                    requestedLimit
                );

            return res.json({
                success: true,
                count:
                    bulkPromotions.length,
                bulkPromotions
            });

        } catch (err) {

            console.error(
                "Bekleyen toplu terfiler alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen toplu terfiler alınamadı."
            });
        }
    }
);

// ========================================
// DISCORD BOT - TOPLU TERFİYİ TAMAMLANDI İŞARETLE
// ========================================

app.patch(
    "/api/discord/bulk-promotions/:bulkPromotionId/sent",
    async (req, res) => {

        try {

            const authorized =
                requireDiscordWorkerKey(
                    req,
                    res
                );

            if (!authorized) {
                return;
            }

            const bulkPromotionId =
                Number(
                    req.params.bulkPromotionId
                );

            const discordMessageId =
                String(
                    req.body?.discordMessageId ||
                    ""
                ).trim();

            if (
                !Number.isInteger(
                    bulkPromotionId
                ) ||
                bulkPromotionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz toplu terfi kayıt numarası."
                });
            }

            if (
                !discordMessageId ||
                discordMessageId.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçerli Discord mesaj numarası gereklidir."
                });
            }

            const existingBulkPromotion =
                await getBulkPromotionById(
                    bulkPromotionId
                );

            if (!existingBulkPromotion) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Toplu terfi kaydı bulunamadı."
                });
            }

            if (
                existingBulkPromotion
                    .discordSent
            ) {

                return res.json({
                    success: true,
                    message:
                        "Toplu terfi daha önce Discord'a gönderilmiş.",
                    bulkPromotion:
                        existingBulkPromotion
                });
            }

            const bulkPromotion =
                await markBulkPromotionAsDiscordSent({
                    bulkPromotionId,
                    discordMessageId
                });

            if (!bulkPromotion) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Toplu terfi kaydı tamamlanamadı."
                });
            }

            return res.json({
                success: true,
                message:
                    "Toplu terfi Discord'a gönderildi olarak işaretlendi.",
                bulkPromotion
            });

        } catch (err) {

            console.error(
                "Toplu terfi Discord tamamlama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Toplu terfi Discord kaydı tamamlanamadı."
            });
        }
    }
);

app.get(
    "/api/news/:articleId/interactions",
    async (req, res) => {

        try {

            const articleId =
                Number(
                    req.params.articleId
                );

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber numarası."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (
                !article ||
                article.status !==
                    "published"
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Yayınlanmış haber bulunamadı."
                });
            }

            const user =
                await getOptionalRequestUser(
                    req
                );

            const interaction =
                await getNewsInteractionSummary(
                    articleId,
                    user?.id || null
                );

            const comments =
                await getNewsComments(
                    articleId
                );

            return res.json({
                success: true,
                interaction,
                comments,
                currentUser: user
                    ? {
                        id: user.id,
                        username:
                            user.username,
                        role:
                            user.role ||
                            "member",
                        roles:
                            getUserRoleList(
                                user
                            )
                    }
                    : null
            });

        } catch (err) {

            console.error(
                "Haber etkileşimleri alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber etkileşimleri alınamadı."
            });
        }
    }
);

app.post(
    "/api/news/:articleId/like",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            const articleId =
                Number(
                    req.params.articleId
                );

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber numarası."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (
                !article ||
                article.status !==
                    "published"
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Yayınlanmış haber bulunamadı."
                });
            }

            const result =
                await toggleNewsLike(
                    articleId,
                    user.id
                );

            return res.json({
                success: true,
                ...result
            });

        } catch (err) {

            console.error(
                "Haber beğeni işlemi hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Beğeni işlemi gerçekleştirilemedi."
            });
        }
    }
);

app.put(
    "/api/news/:articleId/reaction",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            const articleId =
                Number(
                    req.params.articleId
                );

            const emoji =
                String(
                    req.body?.emoji || ""
                ).trim();

            const allowedEmojis = [
                "😀",
                "😍",
                "😂",
                "😮",
                "😢",
                "😡",
                "❤️",
                "🔥",
                "👏"
            ];

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber numarası."
                });
            }

            if (
                emoji &&
                !allowedEmojis.includes(
                    emoji
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz emoji."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (
                !article ||
                article.status !==
                    "published"
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Yayınlanmış haber bulunamadı."
                });
            }

            const result =
                await setNewsReaction(
                    articleId,
                    user.id,
                    emoji
                );

            return res.json({
                success: true,
                ...result
            });

        } catch (err) {

            console.error(
                "Haber emoji işlemi hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Emoji işlemi gerçekleştirilemedi."
            });
        }
    }
);

app.post(
    "/api/news/:articleId/comments",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            const articleId =
                Number(
                    req.params.articleId
                );

            const comment =
                String(
                    req.body?.comment || ""
                ).trim();

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber numarası."
                });
            }

            if (
                comment.length < 1 ||
                comment.length > 500
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Yorum 1 ile 500 karakter arasında olmalı."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (
                !article ||
                article.status !==
                    "published"
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Yayınlanmış haber bulunamadı."
                });
            }

            await createNewsComment({
                articleId,
                userId: user.id,
                comment
            });

            const comments =
                await getNewsComments(
                    articleId
                );

            return res.status(201).json({
                success: true,
                comments
            });

        } catch (err) {

            console.error(
                "Haber yorumu eklenemedi:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Yorum eklenemedi."
            });
        }
    }
);

app.delete(
    "/api/news/comments/:commentId",
    async (req, res) => {

        try {

            const user =
                await requireRequestUser(
                    req,
                    res
                );

            if (!user) {
                return;
            }

            const commentId =
                Number(
                    req.params.commentId
                );

            if (
                !Number.isInteger(commentId) ||
                commentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz yorum numarası."
                });
            }

            const comment =
                await getNewsCommentById(
                    commentId
                );

            if (!comment) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Yorum bulunamadı."
                });
            }

            const canDelete =
                Number(comment.userId) ===
                    Number(user.id) ||
                hasAnyRole(
                    user,
                    [
                        "admin",
                        "founder",
                        "moderator"
                    ]
                );

            if (!canDelete) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Bu yorumu silme yetkiniz yok."
                });
            }

            await deleteNewsComment(
                commentId
            );

            return res.json({
                success: true,
                message:
                    "Yorum silindi."
            });

        } catch (err) {

            console.error(
                "Haber yorumu silinemedi:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Yorum silinemedi."
            });
        }
    }
);

function getLocalNewsImagePath(
    imageUrl
) {

    const cleanImageUrl =
        String(
            imageUrl || ""
        ).trim();

    if (
        !cleanImageUrl.startsWith(
            "/uploads/news/"
        )
    ) {

        return null;
    }

    const filename =
        path.basename(
            cleanImageUrl
        );

    if (!filename) {
        return null;
    }

    return path.join(
        newsUploadDirectory,
        filename
    );
}

async function deleteLocalNewsImage(
    imageUrl
) {

    const imagePath =
        getLocalNewsImagePath(
            imageUrl
        );

    if (!imagePath) {
        return false;
    }

    try {

        await fs.promises.unlink(
            imagePath
        );

        return true;

    } catch (err) {

        if (
            err.code === "ENOENT"
        ) {

            return false;
        }

        console.error(
            "Haber görseli silme hatası:",
            err
        );

        return false;
    }
}

function formatChatMessage(row) {

    return {
        id: row.id,
        username: row.username,
        figureString:
            row.figureString || "",
        message:
            row.message || "",
        createdAt:
            row.createdAt,
        role:
            row.role || "member",
        roles:
            Array.isArray(row.roles)
                ? row.roles
                : []
    };
}

function canDeleteChatMessage(user) {

    if (!user) {
        return false;
    }

    return hasAnyRole(
        user,
        [
            "admin",
            "founder",
            "moderator"
        ]
    );
}

io.on("connection", async (socket) => {

    const socketUser =
        await getSocketUser(socket);

    socket.data.user =
        socketUser;

    socket.emit("chat:auth", {
        authenticated:
            !!socketUser,

        user: socketUser
            ? {
                username:
                    socketUser.username,

                figureString:
                    socketUser.figureString || "",

                role:
                    socketUser.role || "member",

                roles:
                    getUserRoleList(socketUser)
            }
            : null
    });

    socket.on(
        "chat:send",
        async (payload, callback) => {

            const respond =
                typeof callback === "function"
                    ? callback
                    : () => {};

            try {

                const user =
                    socket.data.user;

                if (!user) {

                    respond({
                        success: false,
                        message:
                            "Mesaj göndermek için giriş yapmalısınız."
                    });

                    return;
                }

                const message =
                    String(
                        payload?.message || ""
                    ).trim();

                if (!message) {

                    respond({
                        success: false,
                        message:
                            "Boş mesaj gönderemezsiniz."
                    });

                    return;
                }

                if (message.length > 300) {

                    respond({
                        success: false,
                        message:
                            "Mesaj en fazla 300 karakter olabilir."
                    });

                    return;
                }

                const userKey =
                    String(user.id);

                const currentTime =
                    Date.now();

                const lastMessageTime =
                    chatLastMessageTimes
                        .get(userKey) || 0;

                const remainingTime =
                    2000 -
                    (
                        currentTime -
                        lastMessageTime
                    );

                if (remainingTime > 0) {

                    respond({
                        success: false,
                        message:
                            "Yeni mesaj göndermek için biraz bekleyin."
                    });

                    return;
                }

                chatLastMessageTimes.set(
                    userKey,
                    currentTime
                );

                const inserted =
                    await pool.query(
                        `INSERT INTO chat_messages
                            ("userId", message)
                         VALUES ($1, $2)
                         RETURNING
                            id,
                            message,
                            "createdAt"`,
                        [
                            user.id,
                            message
                        ]
                    );

                const savedMessage =
                    inserted.rows[0];

                const chatMessage =
                    formatChatMessage({
                        id:
                            savedMessage.id,

                        username:
                            user.username,

                        figureString:
                            user.figureString || "",

                        message:
                            savedMessage.message,

                        createdAt:
                            savedMessage.createdAt,

                        role:
                            user.role || "member",

                        roles:
                            getUserRoleList(user)
                    });

                io.emit(
                    "chat:message",
                    chatMessage
                );

                respond({
                    success: true,
                    message:
                        chatMessage
                });

            } catch (err) {

                console.error(
                    "Chat mesaj gönderme hatası:",
                    err
                );

                respond({
                    success: false,
                    message:
                        "Mesaj gönderilemedi."
                });

            }

        }
    );

    socket.on(
    "chat:delete",
    async (payload, callback) => {

        const respond =
            typeof callback === "function"
                ? callback
                : () => {};

        try {

            const user =
                socket.data.user;

            if (!user) {

                respond({
                    success: false,
                    message:
                        "Bu işlem için giriş yapmalısınız."
                });

                return;
            }

            if (!canDeleteChatMessage(user)) {

                respond({
                    success: false,
                    message:
                        "Mesaj silme yetkiniz bulunmuyor."
                });

                return;
            }

            const messageId =
                Number(payload?.messageId);

            if (
                !Number.isInteger(messageId) ||
                messageId <= 0
            ) {

                respond({
                    success: false,
                    message:
                        "Geçersiz mesaj bilgisi."
                });

                return;
            }

            const deletedResult =
                await pool.query(
                    `DELETE FROM chat_messages
                     WHERE id = $1
                     RETURNING id`,
                    [messageId]
                );

            const deletedMessage =
                deletedResult.rows[0];

            if (!deletedMessage) {

                respond({
                    success: false,
                    message:
                        "Mesaj bulunamadı veya daha önce silindi."
                });

                return;
            }

            io.emit(
                "chat:deleted",
                {
                    messageId:
                        deletedMessage.id
                }
            );

            respond({
                success: true,
                message:
                    "Mesaj silindi."
            });

        } catch (err) {

            console.error(
                "Chat mesaj silme hatası:",
                err
            );

            respond({
                success: false,
                message:
                    "Mesaj silinemedi."
            });

        }

    }
);



    socket.on("disconnect", () => {

        if (socket.data.user?.id) {

            chatLastMessageTimes.delete(
                String(
                    socket.data.user.id
                )
            );

        }

    });

});

// ===============================
// CANLI SOHBET - SON MESAJLAR
// ===============================

app.get(
    "/api/chat/messages",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `SELECT
                        cm.id,
                        cm.message,
                        cm."createdAt",
                        u.username,
                        u."figureString",
                        u.role,

                        COALESCE(
                            ARRAY_AGG(
                                DISTINCT ur.role
                            ) FILTER (
                                WHERE ur.role IS NOT NULL
                            ),
                            ARRAY[]::TEXT[]
                        ) AS roles

                     FROM chat_messages cm

                     INNER JOIN users u
                        ON u.id = cm."userId"

                     LEFT JOIN user_roles ur
                        ON ur."userId" = u.id

                     GROUP BY
                        cm.id,
                        cm.message,
                        cm."createdAt",
                        u.id,
                        u.username,
                        u."figureString",
                        u.role

                     ORDER BY
                        cm."createdAt" DESC

                     LIMIT 50`
                );

            const messages =
                result.rows
                    .reverse()
                    .map(formatChatMessage);

            return res.json({
                success: true,
                messages
            });

        } catch (err) {

            console.error(
                "Chat mesajları yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Sohbet mesajları yüklenemedi."
            });

        }

    }
);

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

async function getAuthorizedNewsUser(req) {

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
        auth.replace(
            "Bearer ",
            ""
        ).trim();

    try {

        const tokenUser =
            verifyToken(token);

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
                        "Kullanıcı bulunamadı."
                }
            };
        }

        if (!canAccessNewsPanel(user)) {

            return {
                error: {
                    status: 403,
                    message:
                        "Haber paneline erişim yetkiniz yok."
                }
            };
        }

        return {
            user
        };

    } catch (err) {

        return {
            error: {
                status: 401,
                message:
                    "Oturum geçersiz veya süresi dolmuş."
            }
        };
    }
}

async function getAuthorizedApprovalUser(req) {

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
        auth.replace(
            "Bearer ",
            ""
        ).trim();

    try {

        const tokenUser =
            verifyToken(token);

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
                        "Kullanıcı bulunamadı."
                }
            };
        }

        if (
            !canManageAccountApprovals(
                user
            )
        ) {

            return {
                error: {
                    status: 403,
                    message:
                        "Hesap onaylarını yönetme yetkiniz yok."
                }
            };
        }

        return {
            user
        };

    } catch (err) {

        return {
            error: {
                status: 401,
                message:
                    "Oturum geçersiz veya süresi dolmuş."
            }
        };
    }
}

// ===============================
// HESAP ONAYLARI - BEKLEYENLER
// ===============================

app.get(
    "/api/account-approvals",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedApprovalUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const approvals =
                await getPendingApprovals();

            return res.json({
                success: true,
                count: approvals.length,
                approvals
            });

        } catch (err) {

            console.error(
                "Bekleyen hesapları yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Bekleyen hesaplar yüklenemedi."
            });
        }
    }
);

// ===============================
// HESAP ONAYLARI - ONAYLA
// ===============================

app.patch(
    "/api/account-approvals/:userId/approve",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedApprovalUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const userId =
                Number(req.params.userId);

            const badge =
                String(
                    req.body.badge || ""
                ).trim();

            const rank =
                String(
                    req.body.rank || ""
                ).trim();

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz kullanıcı bilgisi."
                });
            }

            if (!badge || !rank) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Rozet ve rütbe seçmelisiniz."
                });
            }

            if (
                badge.length > 80 ||
                rank.length > 80
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Rozet veya rütbe adı çok uzun."
                });
            }

            const approvedUser =
                await approveUserAccount({
                    userId,
                    badge,
                    rank,
                    approvedByUserId:
                        authorization.user.id
                });

            if (!approvedUser) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Bu hesap daha önce işleme alınmış veya bulunamadı."
                });
            }

            await createAdminLog({
                performedBy:
                    authorization.user.username,

                targetUsername:
                    approvedUser.username,

                actionType:
                    "account_approved",

                oldValue:
                    "pending",

                newValue:
                    `${badge} / ${rank}`
            });

            return res.json({
                success: true,
                message:
                    "Hesap başarıyla onaylandı.",
                user:
                    approvedUser
            });

        } catch (err) {

            console.error(
                "Hesap onaylama hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Hesap onaylanamadı."
            });
        }
    }
);


// ===============================
// HESAP ONAYLARI - REDDET
// ===============================

app.patch(
    "/api/account-approvals/:userId/reject",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedApprovalUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const userId =
                Number(
                    req.params.userId
                );

            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz kullanıcı bilgisi."
                });
            }

            const rejectedUser =
                await rejectUserAccount({
                    userId,
                    approvedByUserId:
                        authorization.user.id
                });

            if (!rejectedUser) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Bu hesap daha önce işleme alınmış veya bulunamadı."
                });
            }

            await createAdminLog({
                performedBy:
                    authorization.user.username,

                targetUsername:
                    rejectedUser.username,

                actionType:
                    "account_rejected",

                oldValue:
                    "pending",

                newValue:
                    "rejected"
            });

            return res.json({
                success: true,
                message:
                    "Hesap başvurusu reddedildi.",
                user:
                    rejectedUser
            });

        } catch (err) {

            console.error(
                "Hesap reddetme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Hesap başvurusu reddedilemedi."
            });
        }
    }
);

function validateNewsPayload(body) {

    const title =
        String(
            body?.title || ""
        ).trim();

    const summary =
        String(
            body?.summary || ""
        ).trim();

    const content =
        String(
            body?.content || ""
        ).trim();

    const category =
        String(
            body?.category || "general"
        ).trim();

    const imageUrl =
        String(
            body?.imageUrl || ""
        ).trim();

    const status =
        String(
            body?.status || "draft"
        ).trim();

    const allowedCategories = [
        "general",
        "announcement",
        "event",
        "interview",
        "update"
    ];

    const allowedStatuses = [
        "draft",
        "published",
        "archived"
    ];

    if (
        title.length < 3 ||
        title.length > 150
    ) {

        return {
            error:
                "Başlık 3 ile 150 karakter arasında olmalı."
        };
    }

    if (
        summary.length < 10 ||
        summary.length > 300
    ) {

        return {
            error:
                "Özet 10 ile 300 karakter arasında olmalı."
        };
    }

    if (
        content.length < 20 ||
        content.length > 20000
    ) {

        return {
            error:
                "Haber içeriği 20 ile 20000 karakter arasında olmalı."
        };
    }

    if (
        !allowedCategories.includes(
            category
        )
    ) {

        return {
            error:
                "Geçersiz haber kategorisi."
        };
    }

    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        return {
            error:
                "Geçersiz haber durumu."
        };
    }

    if (
    imageUrl &&
    !(
        /^https?:\/\/.+/i.test(imageUrl) ||
        imageUrl.startsWith("/uploads/news/")
    )
) {

    return {
        error:
            "Geçersiz kapak görseli adresi."
    };
}

    return {
        data: {
            title,
            summary,
            content,
            category,
            imageUrl,
            status
        }
    };
}

// ===============================
// HABER PANELİ - KAPAK GÖRSELİ YÜKLE
// ===============================

app.post(
    "/api/news-panel/upload-image",
    async (req, res) => {

        const authorization =
            await getAuthorizedNewsUser(
                req
            );

        if (authorization.error) {

            return res
                .status(
                    authorization
                        .error
                        .status
                )
                .json({
                    success: false,
                    message:
                        authorization
                            .error
                            .message
                });
        }

        newsImageUpload.single(
            "image"
        )(
            req,
            res,
            err => {

                if (err) {

                    if (
                        err instanceof
                        multer.MulterError
                    ) {

                        if (
                            err.code ===
                            "LIMIT_FILE_SIZE"
                        ) {

                            return res
                                .status(400)
                                .json({
                                    success:
                                        false,

                                    message:
                                        "Kapak görseli en fazla 5 MB olabilir."
                                });
                        }

                        if (
                            err.code ===
                            "LIMIT_UNEXPECTED_FILE"
                        ) {

                            return res
                                .status(400)
                                .json({
                                    success:
                                        false,

                                    message:
                                        "Yalnızca tek bir kapak görseli yükleyebilirsiniz."
                                });
                        }

                        return res
                            .status(400)
                            .json({
                                success:
                                    false,

                                message:
                                    "Görsel yüklenemedi."
                            });
                    }

                    return res
                        .status(400)
                        .json({
                            success:
                                false,

                            message:
                                err.message ||
                                "Görsel yüklenemedi."
                        });
                }

                if (!req.file) {

                    return res
                        .status(400)
                        .json({
                            success: false,
                            message:
                                "Yüklenecek görsel bulunamadı."
                        });
                }

                const imageUrl =
                    `/uploads/news/${req.file.filename}`;

                return res.status(201).json({
                    success: true,
                    message:
                        "Kapak görseli yüklendi.",
                    imageUrl
                });
            }
        );
    }
);

// ===============================
// HABER PANELİ - YÜKLENEN GÖRSELİ SİL
// ===============================

app.delete(
    "/api/news-panel/upload-image",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const imageUrl =
                String(
                    req.body?.imageUrl || ""
                ).trim();

            if (
                !imageUrl.startsWith(
                    "/uploads/news/"
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz görsel adresi."
                });
            }

            await deleteLocalNewsImage(
                imageUrl
            );

            return res.json({
                success: true,
                message:
                    "Görsel kaldırıldı."
            });

        } catch (err) {

            console.error(
                "Yüklenen görseli silme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Görsel kaldırılamadı."
            });
        }
    }
);

function validateAnnouncementPayload(body) {

    const title =
        String(
            body?.title || ""
        ).trim();

    const content =
        String(
            body?.content || ""
        ).trim();

    const icon =
        String(
            body?.icon || "📢"
        ).trim();

    const status =
        String(
            body?.status || "draft"
        ).trim();

    const sortOrder =
        Number(
            body?.sortOrder ?? 0
        );

    const allowedStatuses = [
        "draft",
        "published"
    ];

    if (
        title.length < 3 ||
        title.length > 120
    ) {

        return {
            error:
                "Duyuru başlığı 3 ile 120 karakter arasında olmalı."
        };
    }

    if (
        content.length < 5 ||
        content.length > 1000
    ) {

        return {
            error:
                "Duyuru içeriği 5 ile 1000 karakter arasında olmalı."
        };
    }

    if (
        icon.length < 1 ||
        icon.length > 10
    ) {

        return {
            error:
                "Duyuru ikonu en fazla 10 karakter olabilir."
        };
    }

    if (
        !allowedStatuses.includes(
            status
        )
    ) {

        return {
            error:
                "Geçersiz duyuru durumu."
        };
    }

    if (
        !Number.isInteger(sortOrder) ||
        sortOrder < 0 ||
        sortOrder > 999
    ) {

        return {
            error:
                "Duyuru sırası 0 ile 999 arasında tam sayı olmalı."
        };
    }

    return {
        data: {
            title,
            content,
            icon,
            status,
            sortOrder
        }
    };
}

app.get("/api/test", (req, res) => {
    res.json({
        status: "OK",
        message: "CSI Backend çalışıyor 🚀"
    });
});

// ===============================
// HABERLER - YAYINLANMIŞ LİSTE
// ===============================

app.get(
    "/api/news",
    async (req, res) => {

        try {

            const limit =
                Number(
                    req.query.limit || 20
                );

            const articles =
                await getPublishedNewsArticles(
                    limit
                );

            return res.json({
                success: true,
                articles
            });

        } catch (err) {

            console.error(
                "Yayınlanmış haberleri yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haberler yüklenemedi."
            });
        }
    }
);

// ===============================
// DUYURULAR - YAYINLANMIŞ LİSTE
// ===============================

app.get(
    "/api/announcements",
    async (req, res) => {

        try {

            const announcements =
                await getPublishedAnnouncements();

            return res.json({
                success: true,
                announcements
            });

        } catch (err) {

            console.error(
                "Yayınlanmış duyuruları yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Duyurular yüklenemedi."
            });
        }
    }
);

// ===============================
// DUYURU PANELİ - DUYURULARI LİSTELE
// ===============================

app.get(
    "/api/announcement-panel/items",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const includeAll =
                canManageAllNews(user);

            const announcements =
                await getAnnouncementsForPanel({
                    authorUserId:
                        user.id,

                    includeAll
                });

            return res.json({
                success: true,
                announcements,
                permissions: {
                    canManageAll:
                        includeAll
                }
            });

        } catch (err) {

            console.error(
                "Duyuru paneli listeleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Duyurular yüklenemedi."
            });
        }
    }
);

// ===============================
// DUYURU PANELİ - DUYURU OLUŞTUR
// ===============================

app.post(
    "/api/announcement-panel/items",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const validation =
                validateAnnouncementPayload(
                    req.body
                );

            if (validation.error) {

                return res.status(400).json({
                    success: false,
                    message:
                        validation.error
                });
            }

            const announcement =
                await createAnnouncement({
                    authorUserId:
                        user.id,

                    ...validation.data
                });

            if (!announcement) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Duyuru oluşturulamadı."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    user.username,

                actionType:
                    "announcement_created",

                oldValue:
                    null,

                newValue:
                    announcement.title
            });

            return res.status(201).json({
                success: true,

                message:
                    announcement.status ===
                    "published"
                        ? "Duyuru yayınlandı."
                        : "Duyuru taslak olarak kaydedildi.",

                announcement
            });

        } catch (err) {

            console.error(
                "Duyuru oluşturma hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Duyuru oluşturulamadı."
            });
        }
    }
);

// ===============================
// DUYURU PANELİ - DUYURU GÜNCELLE
// ===============================

app.patch(
    "/api/announcement-panel/items/:id",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const announcementId =
                Number(req.params.id);

            if (
                !Number.isInteger(
                    announcementId
                ) ||
                announcementId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz duyuru bilgisi."
                });
            }

            const announcement =
                await getAnnouncementById(
                    announcementId
                );

            if (!announcement) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Duyuru bulunamadı."
                });
            }

            if (
                !canManageAnnouncement(
                    user,
                    announcement
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Bu duyuruyu düzenleme yetkiniz yok."
                });
            }

            const validation =
                validateAnnouncementPayload(
                    req.body
                );

            if (validation.error) {

                return res.status(400).json({
                    success: false,
                    message:
                        validation.error
                });
            }

            const updatedAnnouncement =
                await updateAnnouncement(
                    announcementId,
                    validation.data
                );

            if (!updatedAnnouncement) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Duyuru güncellenemedi."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    announcement.authorUsername ||
                    user.username,

                actionType:
                    "announcement_updated",

                oldValue:
                    announcement.title,

                newValue:
                    updatedAnnouncement.title
            });

            return res.json({
                success: true,
                message:
                    "Duyuru başarıyla güncellendi.",
                announcement:
                    updatedAnnouncement
            });

        } catch (err) {

            console.error(
                "Duyuru güncelleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Duyuru güncellenemedi."
            });
        }
    }
);

// ===============================
// DUYURU PANELİ - DUYURU SİL
// ===============================

app.delete(
    "/api/announcement-panel/items/:id",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const announcementId =
                Number(req.params.id);

            if (
                !Number.isInteger(
                    announcementId
                ) ||
                announcementId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz duyuru bilgisi."
                });
            }

            const announcement =
                await getAnnouncementById(
                    announcementId
                );

            if (!announcement) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Duyuru bulunamadı."
                });
            }

            if (
                !canManageAnnouncement(
                    user,
                    announcement
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Bu duyuruyu silme yetkiniz yok."
                });
            }

            const deletedAnnouncement =
                await deleteAnnouncement(
                    announcementId
                );

            if (!deletedAnnouncement) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Duyuru silinemedi."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    announcement.authorUsername ||
                    user.username,

                actionType:
                    "announcement_deleted",

                oldValue:
                    announcement.title,

                newValue:
                    null
            });

            return res.json({
                success: true,
                message:
                    "Duyuru başarıyla silindi."
            });

        } catch (err) {

            console.error(
                "Duyuru silme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Duyuru silinemedi."
            });
        }
    }
);

// ===============================
// HABERLER - TEK HABER DETAYI
// ===============================

app.get(
    "/api/news/:id",
    async (req, res) => {

        try {

            const articleId =
                Number(req.params.id);

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber bilgisi."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (
                !article ||
                article.status !==
                    "published"
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Haber bulunamadı."
                });
            }

            return res.json({
                success: true,
                article
            });

        } catch (err) {

            console.error(
                "Haber detayı yükleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber detayı yüklenemedi."
            });
        }
    }
);

// ===============================
// HABER PANELİ - HABERLERİ LİSTELE
// ===============================

app.get(
    "/api/news-panel/articles",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const includeAll =
                canManageAllNews(user);

            const articles =
                await getNewsArticlesForPanel({
                    authorUserId:
                        user.id,
                    includeAll
                });

            return res.json({
                success: true,
                articles,
                permissions: {
                    canManageAll:
                        includeAll,
                    canFeature:
                        includeAll
                }
            });

        } catch (err) {

            console.error(
                "Haber paneli listeleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haberler yüklenemedi."
            });
        }
    }
);

// ===============================
// HABER PANELİ - HABER OLUŞTUR
// ===============================

app.post(
    "/api/news-panel/articles",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization
                            .error
                            .status
                    )
                    .json({
                        success: false,
                        message:
                            authorization
                                .error
                                .message
                    });
            }

            const user =
                authorization.user;

            const validation =
                validateNewsPayload(
                    req.body
                );

            if (validation.error) {

                return res.status(400).json({
                    success: false,
                    message:
                        validation.error
                });
            }

            const article =
                await createNewsArticle({
                    authorUserId:
                        user.id,

                    ...validation.data
                });

            if (!article) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Haber oluşturulamadı."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    user.username,

                actionType:
                    "news_created",

                oldValue:
                    null,

                newValue:
                    article.title
            });

            return res.status(201).json({
                success: true,
                message:
                    article.status ===
                    "published"
                        ? "Haber yayınlandı."
                        : "Haber taslak olarak kaydedildi.",
                article
            });

        } catch (err) {

            console.error(
                "Haber oluşturma hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber oluşturulamadı."
            });
        }
    }
);

// ===============================
// HABER PANELİ - HABER GÜNCELLE
// ===============================

app.patch(
    "/api/news-panel/articles/:id",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(req);

            if (authorization.error) {
                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const user =
                authorization.user;

            const articleId =
                Number(req.params.id);

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber bilgisi."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Haber bulunamadı."
                });
            }

            if (
                !canManageNewsArticle(
                    user,
                    article
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bu haberi düzenleme yetkiniz yok."
                });
            }

            const validation =
                validateNewsPayload(
                    req.body
                );

            if (validation.error) {
                return res.status(400).json({
                    success: false,
                    message:
                        validation.error
                });
            }

            const updatedArticle =
                await updateNewsArticle(
                    articleId,
                    validation.data
                );

            if (!updatedArticle) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Haber güncellenemedi."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    article.authorUsername ||
                    user.username,

                actionType:
                    "news_updated",

                oldValue:
                    article.title,

                newValue:
                    updatedArticle.title
            });

            return res.json({
                success: true,
                message:
                    "Haber başarıyla güncellendi.",
                article:
                    updatedArticle
            });

        } catch (err) {

            console.error(
                "Haber güncelleme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber güncellenemedi."
            });

        }

    }
);

// ===============================
// HABER PANELİ - HABER SİL
// ===============================

app.delete(
    "/api/news-panel/articles/:id",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(req);

            if (authorization.error) {
                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const user =
                authorization.user;

            const articleId =
                Number(req.params.id);

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber bilgisi."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Haber bulunamadı."
                });
            }

            if (
                !canManageNewsArticle(
                    user,
                    article
                )
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Bu haberi silme yetkiniz yok."
                });
            }

            const deletedArticle =
                await deleteNewsArticle(
                    articleId
                );

            if (!deletedArticle) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Haber silinemedi."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    article.authorUsername ||
                    user.username,

                actionType:
                    "news_deleted",

                oldValue:
                    article.title,

                newValue:
                    null
            });

            return res.json({
                success: true,
                message:
                    "Haber başarıyla silindi."
            });

        } catch (err) {

            console.error(
                "Haber silme hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber silinemedi."
            });

        }

    }
);

// ===============================
// HABER PANELİ - ÖNE ÇIKAR
// ===============================

app.patch(
    "/api/news-panel/articles/:id/featured",
    async (req, res) => {

        try {

            const authorization =
                await getAuthorizedNewsUser(req);

            if (authorization.error) {
                return res
                    .status(authorization.error.status)
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            const user =
                authorization.user;

            if (!canManageAllNews(user)) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Haberi öne çıkarma yetkiniz yok."
                });
            }

            const articleId =
                Number(req.params.id);

            if (
                !Number.isInteger(articleId) ||
                articleId <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz haber bilgisi."
                });
            }

            const article =
                await getNewsArticleById(
                    articleId
                );

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Haber bulunamadı."
                });
            }

            const isFeatured =
                req.body.isFeatured === true;

            if (
                isFeatured &&
                article.status !== "published"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Yalnızca yayınlanmış haberler öne çıkarılabilir."
                });
            }

            const updatedArticle =
                await setNewsArticleFeatured(
                    articleId,
                    isFeatured
                );

            if (!updatedArticle) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Haber öne çıkarma durumu güncellenemedi."
                });
            }

            await createAdminLog({
                performedBy:
                    user.username,

                targetUsername:
                    article.authorUsername ||
                    user.username,

                actionType:
                    isFeatured
                        ? "news_featured"
                        : "news_unfeatured",

                oldValue:
                    article.title,

                newValue:
                    isFeatured
                        ? "Öne çıkarıldı"
                        : "Öne çıkarma kaldırıldı"
            });

            return res.json({
                success: true,
                message:
                    isFeatured
                        ? "Haber öne çıkarıldı."
                        : "Haberin öne çıkarma durumu kaldırıldı.",
                article:
                    updatedArticle
            });

        } catch (err) {

            console.error(
                "Haber öne çıkarma hatası:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Haber öne çıkarma durumu güncellenemedi."
            });

        }

    }
);

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
            registerType
        } = req.body;

        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message:
                    "Kullanıcı adı ve şifre gerekli."
            });
        }

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Şifre en az 6 karakter olmalı."
            });
        }

        const user =
            await getUser(username);

        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "Kullanıcı bulunamadı."
            });
        }

        if (!user.verified) {

            return res.status(403).json({
                success: false,
                message:
                    "Hesap doğrulanmamış."
            });
        }

        if (user.password) {

            return res.status(409).json({
                success: false,
                message:
                    "Bu hesap için daha önce şifre oluşturulmuş."
            });
        }

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );

        const registeredUser =
            await completeRegistration(
                username,
                passwordHash,
                registerType
            );

        if (!registeredUser) {

            return res.status(500).json({
                success: false,
                message:
                    "Kayıt tamamlanamadı."
            });
        }

        if (
            registeredUser.approvalStatus ===
            "pending"
        ) {

            try {

                await queueRegistrationDiscordNotification(
                    registeredUser.id
                );

            } catch (notificationError) {

                // Discord bildirimi kayıt işlemini bozmasın.
                // Worker daha sonra tekrar denenebilsin diye
                // hata sadece loglanır.
                console.error(
                    "Yeni kayıt Discord bildirim kuyruğu hatası:",
                    notificationError
                );
            }

            return res.json({
                success: true,
                pendingApproval: true,
                message:
                    "Kaydınız oluşturuldu. Hesabınızın yönetim tarafından onaylanması bekleniyor."
            });
        }

        const token =
            generateToken(username);

        return res.json({
            success: true,
            pendingApproval: false,
            message:
                "Hesap başarıyla oluşturuldu.",
            token
        });

    } catch (err) {

        console.error(
            "Kayıt tamamlama hatası:",
            err
        );

        return res.status(500).json({
            success: false,
            message:
                "Sunucu hatası."
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

        if (
    user.approvalStatus ===
    "pending"
) {

    return res.status(403).json({
        success: false,
        pendingApproval: true,
        message:
            "Hesabınız henüz yönetim tarafından onaylanmadı."
    });
}

if (
    user.approvalStatus ===
    "rejected"
) {

    return res.status(403).json({
        success: false,
        rejected: true,
        message:
            "Hesap başvurunuz yönetim tarafından reddedildi."
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
// CSI RADIO - YETKİLİ KULLANICI
// ===============================

async function getRadioAuthorizedUser(
    req
) {

    const auth =
        String(
            req.headers.authorization || ""
        ).trim();

    if (
        !auth ||
        !auth.startsWith("Bearer ")
    ) {
        return {
            user: null,
            error: {
                status: 401,
                message:
                    "Oturum açmanız gerekiyor."
            }
        };
    }

    const token =
        auth.replace(
            "Bearer ",
            ""
        ).trim();

    try {

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
                user: null,
                error: {
                    status: 401,
                    message:
                        "Geçersiz oturum."
                }
            };
        }

        const user =
            await getUser(
                username
            );

        if (!user) {
            return {
                user: null,
                error: {
                    status: 404,
                    message:
                        "Kullanıcı bulunamadı."
                }
            };
        }

        return {
            user,
            error: null
        };

    } catch (_) {

        return {
            user: null,
            error: {
                status: 401,
                message:
                    "Geçersiz oturum."
            }
        };
    }
}

function isRadioAdmin(
    user
) {

    if (!user) {
        return false;
    }

    return (
        hasRole(
            user,
            "admin"
        ) ||
        String(
            user.username || ""
        ).toLocaleLowerCase("tr-TR") ===
            String(
                ADMIN_USERNAME || ""
            ).toLocaleLowerCase("tr-TR")
    );
}


function extractYoutubeVideoId(
    rawUrl
) {

    const value =
        String(
            rawUrl || ""
        ).trim();

    if (!value) {
        return "";
    }

    // Direkt 11 karakter YouTube video ID girilirse.
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) {
        return value;
    }

    let parsed;

    try {
        parsed = new URL(value);
    } catch (_) {
        return "";
    }

    const host =
        parsed.hostname
            .toLocaleLowerCase("tr-TR")
            .replace(/^www\./, "");

    if (host === "youtu.be") {

        const id =
            parsed.pathname
                .split("/")
                .filter(Boolean)[0] ||
            "";

        return /^[A-Za-z0-9_-]{11}$/.test(id)
            ? id
            : "";
    }

    if (
        host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "music.youtube.com"
    ) {

        const watchId =
            parsed.searchParams.get("v");

        if (
            watchId &&
            /^[A-Za-z0-9_-]{11}$/.test(watchId)
        ) {
            return watchId;
        }

        const parts =
            parsed.pathname
                .split("/")
                .filter(Boolean);

        if (
            ["embed", "shorts", "live"]
                .includes(parts[0]) &&
            parts[1] &&
            /^[A-Za-z0-9_-]{11}$/.test(parts[1])
        ) {
            return parts[1];
        }
    }

    return "";
}

// ===============================
// CSI RADIO - AKTİF YAYIN
// ===============================

app.get(
    "/api/radio/state",
    async (req, res) => {

        try {

            const radio =
                await getRadioSettings();

            return res.json({
                success: true,
                radio: {
                    mode:
                        radio?.mode ||
                        "station",

                    stationId:
                        radio?.stationId ||
                        "",

                    stationName:
                        radio?.stationName ||
                        "",

                    streamUrl:
                        radio?.streamUrl ||
                        "",

                    youtubeVideoId:
                        radio?.youtubeVideoId ||
                        "",

                    youtubeUrl:
                        radio?.youtubeUrl ||
                        "",

                    startedAt:
                        radio?.startedAt ||
                        null,

                    youtubePositionSeconds:
                        Number(
                            radio?.youtubePositionSeconds
                        ) || 0,

                    positionUpdatedAt:
                        radio?.positionUpdatedAt ||
                        null,

                    djName:
                        radio?.djName ||
                        "",

                    updatedAt:
                        radio?.updatedAt ||
                        null
                }
            });

        } catch (err) {

            console.error(
                "Radyo durumu alınamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Radyo durumu alınamadı."
            });
        }
    }
);

// ===============================
// CSI RADIO - DJ YAYININI BAŞLAT
// SADECE ADMIN
// ===============================

app.post(
    "/api/radio/dj/start",
    async (req, res) => {

        try {

            const authorization =
                await getRadioAuthorizedUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            if (
                !isRadioAdmin(
                    authorization.user
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "DJ yönetimi yalnızca Admin hesabına açıktır."
                });
            }

            const youtubeUrl =
                String(
                    req.body?.youtubeUrl ||
                    ""
                ).trim();

            const djName =
                String(
                    req.body?.djName ||
                    authorization.user.username ||
                    "Admin"
                ).trim();

            if (!youtubeUrl) {

                return res.status(400).json({
                    success: false,
                    message:
                        "YouTube şarkı linki gereklidir."
                });
            }

            const youtubeVideoId =
                extractYoutubeVideoId(
                    youtubeUrl
                );

            if (!youtubeVideoId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçerli bir YouTube video linki girin."
                });
            }

            const radio =
                await setYoutubeDjRadio({
                    youtubeVideoId,
                    youtubeUrl,
                    djName,
                    updatedBy:
                        authorization.user.username
                });

            io.emit(
                "radioStateChanged",
                {
                    mode:
                        radio?.mode ||
                        "dj",

                    stationId:
                        radio?.stationId ||
                        "",

                    stationName:
                        radio?.stationName ||
                        "CSI DJ",

                    streamUrl:
                        radio?.streamUrl ||
                        "",

                    youtubeVideoId:
                        radio?.youtubeVideoId ||
                        "",

                    youtubeUrl:
                        radio?.youtubeUrl ||
                        "",

                    startedAt:
                        radio?.startedAt ||
                        null,

                    djName:
                        radio?.djName ||
                        djName,

                    updatedAt:
                        radio?.updatedAt ||
                        new Date()
                }
            );

            return res.json({
                success: true,
                message:
                    "DJ yayını aktif edildi.",
                radio
            });

        } catch (err) {

            console.error(
                "DJ yayını başlatılamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "DJ yayını başlatılamadı."
            });
        }
    }
);

// ===============================
// CSI RADIO - YOUTUBE KONUM SENKRONU
// SADECE ADMIN
// ===============================

app.post(
    "/api/radio/dj/sync-position",
    async (req, res) => {

        try {

            const authorization =
                await getRadioAuthorizedUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            if (
                !isRadioAdmin(
                    authorization.user
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "DJ yönetimi yalnızca Admin hesabına açıktır."
                });
            }

            const positionSeconds =
                Number(
                    req.body?.positionSeconds
                );

            if (
                !Number.isFinite(positionSeconds) ||
                positionSeconds < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Geçersiz oynatma konumu."
                });
            }

            const radio =
                await updateYoutubeDjPosition({
                    positionSeconds,
                    updatedBy:
                        authorization.user.username
                });

            if (!radio) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Aktif bir YouTube DJ yayını bulunamadı."
                });
            }

            return res.json({
                success: true,
                positionSeconds:
                    Number(
                        radio.youtubePositionSeconds
                    ) || 0,

                positionUpdatedAt:
                    radio.positionUpdatedAt
            });

        } catch (err) {

            console.error(
                "DJ YouTube konumu senkronlanamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "DJ YouTube konumu senkronlanamadı."
            });
        }
    }
);

// ===============================
// CSI RADIO - YOUTUBE OYNATMAYI BAŞLAT
// SADECE ADMIN
// ===============================

app.post(
    "/api/radio/dj/play-start",
    async (req, res) => {

        try {

            const authorization =
                await getRadioAuthorizedUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            if (
                !isRadioAdmin(
                    authorization.user
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "DJ yönetimi yalnızca Admin hesabına açıktır."
                });
            }

            const radio =
                await startYoutubeDjPlaybackClock({
                    updatedBy:
                        authorization.user.username
                });

            if (!radio) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Aktif bir YouTube DJ yayını bulunamadı."
                });
            }

            io.emit(
                "radioStateChanged",
                {
                    mode:
                        radio.mode,

                    stationId:
                        radio.stationId ||
                        "",

                    stationName:
                        radio.stationName ||
                        "CSI DJ",

                    streamUrl:
                        "",

                    youtubeVideoId:
                        radio.youtubeVideoId ||
                        "",

                    youtubeUrl:
                        radio.youtubeUrl ||
                        "",

                    startedAt:
                        radio.startedAt,

                    youtubePositionSeconds:
                        Number(
                            radio.youtubePositionSeconds
                        ) || 0,

                    positionUpdatedAt:
                        radio.positionUpdatedAt ||
                        null,

                    djName:
                        radio.djName ||
                        "",

                    updatedAt:
                        radio.updatedAt
                }
            );

            return res.json({
                success: true,
                message:
                    "YouTube DJ oynatma başlangıcı kaydedildi.",
                radio
            });

        } catch (err) {

            console.error(
                "DJ oynatma başlangıcı kaydedilemedi:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "DJ oynatma başlangıcı kaydedilemedi."
            });
        }
    }
);

// ===============================
// CSI RADIO - DJ YAYININI KAPAT
// SADECE ADMIN
// ===============================

app.post(
    "/api/radio/dj/stop",
    async (req, res) => {

        try {

            const authorization =
                await getRadioAuthorizedUser(
                    req
                );

            if (authorization.error) {

                return res
                    .status(
                        authorization.error.status
                    )
                    .json({
                        success: false,
                        message:
                            authorization.error.message
                    });
            }

            if (
                !isRadioAdmin(
                    authorization.user
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "DJ yönetimi yalnızca Admin hesabına açıktır."
                });
            }

            const radio =
                await stopDjRadio({
                    updatedBy:
                        authorization.user.username
                });

            io.emit(
                "radioStateChanged",
                {
                    mode:
                        "station",

                    stationId:
                        radio?.stationId ||
                        "",

                    stationName:
                        radio?.stationName ||
                        "",

                    streamUrl:
                        "",

                    youtubeVideoId:
                        "",

                    youtubeUrl:
                        "",

                    startedAt:
                        null,

                    youtubePositionSeconds:
                        0,

                    positionUpdatedAt:
                        null,

                    djName:
                        "",

                    updatedAt:
                        radio?.updatedAt ||
                        new Date()
                }
            );

            return res.json({
                success: true,
                message:
                    "DJ yayını kapatıldı.",
                radio
            });

        } catch (err) {

            console.error(
                "DJ yayını kapatılamadı:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "DJ yayını kapatılamadı."
            });
        }
    }
);

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
                    "member",
                    "attendance_controller"
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

if (
    cleanRoles.includes("moderator") &&
    !hasRole(requester, "admin")
) {

    return res.status(403).json({
        success: false,
        message:
            "Moderatör rolünü yalnızca admin verebilir."
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
                "attendance_controller",
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

        httpServer.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server ${PORT} portunda çalışıyor.`
                );

                // Discord botu VPS üzerinde başlatılmıyor.
                // Bot local bilgisayarda botRunner.js ile çalışıyor.
            }
        );

    } catch (err) {

        console.error(
            "Sunucu başlatılamadı:",
            err
        );

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