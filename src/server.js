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
const socketIo = require("socket.io");
const http = require("http");
require("./auth-routes");
const port = 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
let users = [];
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
        res.json(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
});
app.post('/auth', (req, res) => {
    const config = {
        method: 'POST',
        url: config_1.authServer + '/auth',
        data: null,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'jwt ' + req.body.token
        }
    };
    axios_1.default(config).then((response => {
        res.json(response.data);
    })).catch((error) => {
        res.send(error.response.data);
    });
});
io.on('connection', (socket) => {
    socket.on('message', function (data) {
        const config = auth_routes_1.axiosConfig(config_1.notiServer + '/newMessage', data);
        axios_1.default(config).then(() => {
            const message = {
                room: data._id,
                sender: data.user,
                message: data.message,
                type: data.type,
                date: data.date
            };
            io.sockets.in(data._id).emit('message', message);
        }).catch((error) => {
            console.log(error.response);
        });
    });
    socket.on('linkUser', function (data) {
        const user = {
            socket: socket.id,
            user: data
        };
        users.push(user);
    });
    socket.on('addUser', data => {
        const config = auth_routes_1.axiosConfig(config_1.notiServer + '/addUser', data);
        axios_1.default(config).then((response => {
            if (response.data.participants) {
                response.data.participants.forEach(user => {
                    for (let i = 0; i < users.length; i++) {
                        if (user._id === users[i].user) {
                            io.to(`${users[i].socket}`).emit('addedUser', response.data);
                        }
                    }
                });
                return false;
            }
            socket.emit('addedUser', response.data);
        })).catch((error) => {
            console.log(error.response);
        });
    });
    socket.on('addConversation', data => {
        const config = auth_routes_1.axiosConfig(config_1.notiServer + '/newConversation', data);
        axios_1.default(config).then((response => {
            response.data.conversation.participants.forEach(user => {
                for (let i = 0; i < users.length; i++) {
                    if (user._id === users[i].user) {
                        io.to(`${users[i].socket}`).emit('newConversation', response.data);
                    }
                }
            });
        })).catch((error) => {
            console.log(error.response);
        });
    });
    socket.on('join', function (data) {
        socket.join(data);
        socket.broadcast.to(data).emit('joined', { sender: null, message: `hello fron ${data}` });
    });
    socket.on('leave', function (data) {
        socket.leaveAll();
        socket.broadcast.to(data).emit('joined', { sender: null, message: `hello fron ${data}` });
    });
    socket.on('disconnect', () => {
        users = users.filter(e => e.socket !== socket.id);
    });
});
server.listen(port, () => {
    console.log(`Proxy Server is up on port ${port}`);
});
