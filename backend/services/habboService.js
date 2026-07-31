const axios = require("axios");

async function getHabbo(username){

    const response = await axios.get(
        `https://www.habbo.com.tr/api/public/users?name=${username}`
    );

    return response.data;

}

module.exports = {
    getHabbo
};