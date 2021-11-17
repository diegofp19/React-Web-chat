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

  socket.on("connected", (username) => {
    usersList.push(username);

  });


  socket.on("message_evt", (message) => {
    socket.broadcast.emit("message_server", message);
  });

  
  socket.on("usersConnected",() =>{
    socket.emit("usersConnected", usersList);
  });
  



});

server.listen(3670, () => console.log("Servidor iniciado"));