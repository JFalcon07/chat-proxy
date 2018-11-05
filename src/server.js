"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const axios_1 = require("axios");
const config_1 = require("./config");
const auth_routes_1 = require("./auth-routes");
require("./auth-routes");
const port = 3000;
const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Headers", "*");
    next();
});
app.use('/', auth_routes_1.router);
app.post('/users', (req, res) => __awaiter(this, void 0, void 0, function* () {
    const config = auth_routes_1.axiosConfig(config_1.notiServer + '/getUserList', req.body);
    axios_1.default(config).then((response => {
        res.send(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
}));
app.post('/add', (req, res) => {
    const config = auth_routes_1.axiosConfig(config_1.notiServer + '/addUser', req.body);
    axios_1.default(config).then((response => {
        res.send(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
});
app.post('/contacts', (req, res) => {
    const config = auth_routes_1.axiosConfig(config_1.notiServer + '/getContacts', req.body);
    axios_1.default(config).then((response => {
        res.json(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
});
app.post('/Conversations', (req, res) => {
    const config = auth_routes_1.axiosConfig(config_1.notiServer + '/getConversations', req.body);
    axios_1.default(config).then((response => {
        res.json(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
});
app.get('/conversation/:tagId', function (req, res) {
    const config = auth_routes_1.axiosConfig(config_1.notiServer + '/getConversation', { token: req.get('Authorization'), _id: req.params.tagId });
    axios_1.default(config).then((response => {
        console.log(response.data);
        // res.json(response.data);
    })).catch((error) => {
        // res.send(error.response.data);
    });
    res.json("tagId is set to " + req.params.tagId);
});
app.listen(port, () => {
    console.log(`Proxy Server is up on port ${port}`);
});
