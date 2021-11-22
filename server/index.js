const nodeFetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
    userObject = { name: username, sockID: socket.id };
    usersList.push(userObject);
    userRegistered = username;
    socket.broadcast.emit("connectClient", userObject);

  });

  socket.on("disconnect", function () {
    for (var i = 0; i < usersList.length; i++) {
      if (userRegistered === usersList[i].name) {
        usersList.splice(i, 1);
      }
    }

    socket.broadcast.emit("disconnectClient", userObject);
  });


  socket.on("message_evt", (message) => {
    socket.broadcast.emit("message_server", message);
  });

  socket.on("privateMsg", (message) => {
    io.to(message.idReceiver).emit("privateMsgClient", message);
  });



  socket.emit("usersConnected", usersList);

  




});

// setInterval(function (){
//   if (usersList.length > 0) {
//     var userRandom = Math.floor(Math.random() * (usersList.length));
//     let fetchTrivial = nodeFetch("https://opentdb.com/api.php?amount=1&difficulty=easy&type=multiple");

//     fetchTrivial.then(res =>
//       res.json()).then(d => {

//         io.to(usersList[userRandom].sockID).emit("trivialQuestion", d);
//       })
//   }
// }, 70000);

server.listen(3670, () => console.log("Servidor iniciado"));