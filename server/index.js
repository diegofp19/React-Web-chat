const nodeFetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);


var usersList = [];
var questionReady = true;



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
    userObject = { name: username, sockID: socket.id };
    usersList.push(userObject);
    userRegistered = username;
    console.log("Usuario conectado " + userObject.name);
    socket.broadcast.emit("connectClient", userObject);
    console.log("Lista de usuarios: " + usersList);

  });

  socket.on("disconnect", function () {
    for (var i = 0; i < usersList.length; i++) {
      if (userRegistered === usersList[i].name) {
        usersList.splice(i, 1);
        console.log(userRegistered + " se ha desconectado");
      }
    }

    socket.broadcast.emit("disconnectClient", userObject);
  });


  socket.on("message_evt", (message) => {
    socket.broadcast.emit("message_server", message);
  });

  socket.on("privateMsg", (message) => {
    console.log(message);
    io.to(message.idReceiver).emit("privateMsgClient", message);
  });

  socket.on("questionInProcess", () => {
    questionReady = true;
  });

  socket.emit("usersConnected", usersList);
setInterval(function (){
  setTimeout(function () {
    console.log(questionReady);
    if (usersList.length > 0 && questionReady === true) {
      questionReady = false;
      var userRandom = Math.floor(Math.random() * (usersList.length));
      console.log(userRandom);
      let fetchTrivial = nodeFetch("https://opentdb.com/api.php?amount=1&difficulty=easy&type=multiple");

      fetchTrivial.then(res =>
        res.json()).then(d => {

          io.to(usersList[userRandom].sockID).emit("trivialQuestion", d);
        })
    }
  }, 10000);
},10000);



});

server.listen(3670, () => console.log("Servidor iniciado"));