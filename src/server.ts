import * as express from "express";
import * as bodyParser from "body-parser";
import axios, { AxiosRequestConfig } from 'axios';
import { notiServer, authServer } from './config';
import { axiosConfig, router } from './auth-routes';
import * as socketIo from 'socket.io';
import * as http from 'http';

import './auth-routes';

const port = 3000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Headers","*");
    next();
  });

app.use('/',router);

app.post('/users',async (req,res)=>{
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/getUserList',req.body);
        axios(config).then((response=>{
            res.send(response.data);
        })).catch((error)=>{
            res.send(error.response.data);
        });
})

app.post('/add',(req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/addUser',req.body);
    axios(config).then((response=>{
        res.send(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.post('/contacts',(req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getContacts',req.body);
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.post('/Conversations',(req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getConversations',req.body);
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.get('/conversation/:tagId', function(req, res) {
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getConversation',{token: req.get('Authorization'), _id: req.params.tagId});
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
});

// app.post('/message',(req,res)=>{
//     const config: AxiosRequestConfig = axiosConfig(notiServer+'/newMessage',req.body);
//     axios(config).then((response=>{
//         res.json(response.data);
//     })).catch((error)=>{
//         res.send(error.response.data);
//     });
// })
app.post('/auth',(req,res)=>{
    const config: AxiosRequestConfig = {
        method: 'POST',
        url: authServer+'/auth',
        data: null,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'jwt '+ req.body.token
        }
      };
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

io.on('connection', (socket) => {
    socket.on('message', function(data) {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/newMessage',data);
        axios(config).then((response=>{
            const message = {
                sender: data.user,
                message: data.message,
                type: data.type,
                date: data.date
            }
            io.sockets.in(data._id).emit('message',message);
        })).catch((error)=>{
            console.log(error.response);
        });
    });

    socket.on('join', function(data) {
        socket.join(data);
        socket.broadcast.to(data).emit('joined', {sender: null, message:`hello fron ${data}`});
    });

    socket.on('leave', function(data) {
        socket.leaveAll()
        socket.broadcast.to(data).emit('joined', {sender: null, message:`hello fron ${data}`});
    });
});

server.listen(port, () => {
    console.log(`Proxy Server is up on port ${port}`);
});