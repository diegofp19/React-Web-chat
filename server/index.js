const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);


const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

io.on('connection', socket => {
  console.log("Usuario conectado con id: " + socket.id);

    socket.on('message_evt', () => {
        console.log("Mensaje enviado");
    })
})

server.listen(3670, () => console.log("Servidor iniciado"));