"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const axios_1 = require("axios");
const config_1 = require("./config");
exports.router = express.Router();
function axiosConfig(URL, data) {
    return {
        method: 'POST',
        url: URL,
        data: data,
        headers: {
            'Content-Type': 'application/json'
        }
    };
}
exports.axiosConfig = axiosConfig;
exports.router.post('/register', (req, res) => {
    const data = JSON.stringify({
        email: req.body.email,
        password: req.body.password
    });
    const authOptions = axiosConfig(config_1.authServer + '/signup', data);
    axios_1.default(authOptions).then((response) => {
        if (!response.data.signup) {
            return res.send(response.data);
        }
        const data2 = JSON.stringify({
            _id: response.data._id,
            email: req.body.email,
            username: req.body.username,
            language: req.body.language
        });
        const authOptions2 = axiosConfig(config_1.notiServer + '/init', data2);
        axios_1.default(authOptions2).then((response) => {
            return res.send(response.data);
        }).catch((error) => {
            return res.json({ signup: false, message: 'An Error has ocurred', error: error.code });
        });
    }).catch((error) => {
        return res.json({ signup: false, message: 'An Error has ocurred', error: error.code });
    });
});
exports.router.post('/login', (req, res) => {
    const authOptions = axiosConfig(config_1.authServer + '/login', req.body);
    axios_1.default(authOptions).then((response) => {
        return res.send(response.data);
    }).catch((error) => {
        return res.json({ login: false, message: 'An Error has ocurred', error: error.code });
    });
});
