const db = require("../database/database");

function getUser(username) {
    return new Promise((resolve, reject) => {

        db.get(
            "SELECT * FROM users WHERE username = ?",
            [username],
            (err, row) => {

                if (err) reject(err);
                else resolve(row);

            }
        );

    });
}

function createUser(username, verifyCode) {
    return new Promise((resolve, reject) => {

        db.run(
            "INSERT INTO users(username, verifyCode) VALUES(?,?)",
            [username, verifyCode],
            function(err){

                if(err) reject(err);
                else resolve(this.lastID);

            }

        );

    });
}

function verifyUser(username){
    return new Promise((resolve,reject)=>{

        db.run(
            "UPDATE users SET verified = 1 WHERE username = ?",
            [username],
            function(err){

                if(err) reject(err);
                else resolve();

            }
        );

    });
}

function getVerifyCode(username) {
    return new Promise((resolve, reject) => {

        db.get(
            "SELECT verifyCode FROM users WHERE username = ?",
            [username],
            (err, row) => {

                if (err) reject(err);
                else resolve(row);

            }
        );

    });
}

module.exports = {
    getUser,
    createUser,
    verifyUser,
    getVerifyCode,
    updateHabboInfo
};

function updateHabboInfo(username, habbo) {
    return new Promise((resolve, reject) => {

        db.run(
            `UPDATE users
             SET habboId = ?,
                 figureString = ?,
                 motto = ?,
                 lastLogin = CURRENT_TIMESTAMP
             WHERE username = ?`,
            [
                habbo.uniqueId,
                habbo.figureString,
                habbo.motto,
                username
            ],
            function (err) {
                if (err) reject(err);
                else resolve();
            }
        );

    });
}