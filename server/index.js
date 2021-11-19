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
  var userRegistered = "";
  var userObject = null;
  socket.on("connected", (username) => {
    userObject = {name: username, sockID: socket.id};
    usersList.push(userObject);
    userRegistered = username;
    console.log("Usuario conectado " + userObject.name);
    socket.broadcast.emit("connectClient", userObject);
    console.log("Lista de usuarios: " + usersList);

  });

  socket.on("disconnect", function() {
    for(var i = 0; i<usersList.length;i++){
      if(userRegistered === usersList[i].name){
        usersList.splice(i,1);
        console.log(userRegistered + " se ha desconectado");
      }
    }
    console.log("prueba");
    socket.broadcast.emit("disconnectClient", userObject);
  });


  socket.on("message_evt", (message) => {
    socket.broadcast.emit("message_server", message);
  });

  
    socket.emit("usersConnected", usersList);
  



});

server.listen(3670, () => console.log("Servidor iniciado"));