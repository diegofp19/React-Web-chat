const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

var usersList = [];


const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

io.on('connection', socket => {

  socket.on("connected", (username)=>{
    console.log("Usuario conectado con nombre: " + username);
    usersList.push(username);
      console.log(usersList);
    
  })
  

    socket.on("message_evt", (message) => {
        console.log("Mensaje recibido en servidor: " + message.msg + " de usuario: " + message.user);
        socket.broadcast.emit("message_server", message);
    })
})

server.listen(3670, () => console.log("Servidor iniciado"));