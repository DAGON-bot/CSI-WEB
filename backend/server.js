const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

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
    rejectUserAccount
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
    createAnnouncement,
    getPublishedAnnouncements,
    getAnnouncementById,
    getAnnouncementsForPanel,
    updateAnnouncement,
    deleteAnnouncement
} = require("./models/announcementModel");



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
    }
);
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