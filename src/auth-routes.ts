import * as express from "express";
import axios, { AxiosRequestConfig } from 'axios';
import { notiServer, authServer } from './config';

export const router = express.Router()

export function axiosConfig(URL,data): AxiosRequestConfig {
   return {
        method: 'POST',
        url: URL,
        data: data,
        headers: {
            'Content-Type': 'application/json'
        }
    };
}

router.post('/register', (req, res)=>{
    const data= JSON.stringify({
        email: req.body.email,
        password: req.body.password
    })
    const authOptions = axiosConfig(authServer+'/signup',data);
      axios(authOptions).then((response)=>{
          if(!response.data.signup){
            return res.send(response.data);
          }
        const data2 = JSON.stringify({
            _id: response.data._id,
            email: req.body.email,
            username: req.body.username,
            language: req.body.language
        })
        const authOptions2: AxiosRequestConfig = axiosConfig(notiServer+'/init',data2)
          axios(authOptions2).then((response)=>{
              return res.send(response.data);
          }).catch((error)=>{
            return res.json({signup: false,message:'An Error has ocurred', error: error.code});
          });
      }).catch((error)=>{
        return res.json({signup: false,message:'An Error has ocurred', error: error.code});
      });
})

router.post('/login', (req, res)=>{
    const authOptions: AxiosRequestConfig = axiosConfig(authServer+'/login',req.body);
      axios(authOptions).then((response)=>{
        return res.send(response.data);
      }).catch((error)=>{
        return res.json({login: false,message:'An Error has ocurred', error: error.code});
      });
})
