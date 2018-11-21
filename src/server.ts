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
let users = []
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Headers","*");
    next();
  });

app.use('/api',router);

app.post('/api/users',async (req,res)=>{
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/getUserList', req.body);
        axios(config).then((response=>{
            res.send(response.data);
        })).catch((error)=>{
            res.send(error.response.data);
        });
})

app.post('/api/userInfo',async (req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getUser', req.body);
    axios(config).then((response=>{
        res.send(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.post('/api/contacts',(req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getContacts',req.body);
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.post('/api/Conversations',(req,res)=>{
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getConversations',req.body);
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
})

app.get('/api/conversation/:tagId', function(req, res) {
    const config: AxiosRequestConfig = axiosConfig(notiServer+'/getConversation',{token: req.get('Authorization'), _id: req.params.tagId});
    axios(config).then((response=>{
        res.json(response.data);
    })).catch((error)=>{
        res.send(error.response.data);
    });
});

app.post('/api/auth',(req,res)=>{
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
        axios(config).then(()=>{
            const message = {
                room: data._id,
                sender: data.user,
                message: data.message,
                type: data.type,
                date: data.date
            }
            io.sockets.in(data._id).emit('messageRecieved',message);
        }).catch((error)=>{
            console.log(error.response);
        });
    });

    socket.on('linkUser', function(data) {
        if(users.length > 0){
            users.forEach((element) => {
                socket.emit('online', element.user);
            });
        }
        const user = {
            socket: socket.id,
            user: data
        }
        socket.broadcast.emit('online',data);
        users.push(user);
    })

    socket.on('addUser', data => {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/addUser',data);
        axios(config).then((response=>{
            if(response.data.participants){
            response.data.participants.forEach(user => {
                for(let i = 0;i<users.length;i++) {
                    if(user._id === users[i].user){
                        io.to(`${users[i].socket}`).emit('addedUser', response.data);
                        
                    }
                }
            })
            let contact = response.data.participants.filter( user => user._id !== data.user)[0];
            let user = response.data.participants.filter( user => user._id === data.user)[0];
            users.forEach(element => {
                if(element.user === user._id) { user = element; }
                if(element.user === contact._id){ contact = element; }
            });
            if(contact.socket){
                io.to(`${contact.socket}`).emit('online', user.user);
                socket.emit('online', contact.user);
            }
            return false;
        }
        socket.emit('addedUser',response.data);
        })).catch((error)=>{
            console.log(error.response);
        });
    })

    socket.on('addConversation', data => {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/newConversation',data);
        axios(config).then((response=>{
            response.data.conversation.participants.forEach(user => {
                for(let i = 0;i<users.length;i++) {
                    if(user._id === users[i].user){
                        io.to(`${users[i].socket}`).emit('newConversation', response.data);
                    }
                }
            })
        })).catch((error)=>{
            console.log(error.response);
        });
    })

    socket.on('join', function(data) {
        socket.join(data);
        socket.broadcast.to(data).emit('joined', {sender: null, message:`hello fron ${data}`});
    });

    socket.on('leave', function(data) {
        socket.leaveAll()
        socket.broadcast.to(data).emit('joined', {sender: null, message:`hello fron ${data}`});
    });

    socket.on('remove', function(data) {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/remove',data);
        axios(config).then(()=>{
            const other = users.filter(e => e.user == data.contact)[0];
            if(other){
                io.to(`${other.socket}`).emit('removedContact', { user: data.user, conversation: data.conversation});
            }
            socket.emit('removedContact', { user: data.contact, conversation: data.conversation})
        }).catch((error)=>{
            console.log(error.response);
        });
    });
    
    socket.on('changePassword', function(data) {
        const config: AxiosRequestConfig = axiosConfig(authServer+'/changePassword',data);
        axios(config).then((response)=>{
            socket.emit('PasswordChanged',response.data);
        }).catch((error)=>{
            console.log(error.response);
        });
    });
    socket.on('changeUsername', function(data) {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/changeUsername',data);
        axios(config).then((response)=>{
            socket.broadcast.emit('UsernameChanged',response.data);
            socket.emit('UsernameChanged',response.data);
        }).catch((error)=>{
            console.log(error.response);
        });
    });
    socket.on('changeLanguage', function(data) {
        const config: AxiosRequestConfig = axiosConfig(notiServer+'/changeLanguage',data);
        axios(config).then((response)=>{
            socket.emit('LanguageChanged',response.data);
        }).catch((error)=>{
            console.log(error.response);
        });
    });

    socket.on('disconnect', () => {
        const user = users.filter(e => e.socket === socket.id)[0];
        users = users.filter(e => e.socket !== socket.id);
        if(user){
        socket.broadcast.emit('offline',user.user)
        }
      });
});

server.listen(port, () => {
    console.log(`Proxy Server is up on port ${port}`);
});