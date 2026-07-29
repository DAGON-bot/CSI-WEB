const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

function generateToken(username){

    return jwt.sign(
        { username },
        SECRET,
        {
            expiresIn: "7d"
        }
    );

}

function verifyToken(token){

    return jwt.verify(token, SECRET);

}

module.exports = {

    generateToken,
    verifyToken

};