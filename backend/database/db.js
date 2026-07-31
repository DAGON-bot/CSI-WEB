const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
    path.join(__dirname, "csi.db"),
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("SQLite bağlandı.");
        }
    }
);

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            habboId TEXT,
            figureString TEXT,
            motto TEXT,
            verifyCode TEXT,
            verified INTEGER DEFAULT 0,
            role TEXT DEFAULT 'member',
            lastLogin DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

});

module.exports = db;