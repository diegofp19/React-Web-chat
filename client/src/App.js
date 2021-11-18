import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
const socketurl = "http://localhost:3670/";
const Chance = require('chance');
const chance = new Chance();

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(io(socketurl));
  const [rng_name, setRngName] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [usersConnectList, setUsersConnected] = useState([]);

  const submitButton = document.getElementById("submit");

  const messagesRecieved = document.getElementsByClassName("ownMessages");


  var messageObject = null;




  useEffect(() => {

    const username = chance.name();
    socket.emit("connected", username);
    setRngName(username);
  }, []);

  useEffect(() => {

    socket.on("message_server", (message) => {
      console.log(message);
      setMessage(message.msg);
      messageObject = { msg: message.msg, user: message.user };
      messageList.push(messageObject);
      setMessageList(messageList);

    });
  }, [messageList]);

  useEffect(() => {
    socket.on("usersConnected", (usersOn) => {
      setUsersConnected(usersOn);
      usersConnected();
    });
  });






  function handleOnClick() {
    var messageInput = document.getElementById("messageText");
    messageObject = { msg: messageInput.value, user: rng_name };
    messageList.push(messageObject);
    setMessageList(messageList);
    socket.emit("message_evt", messageObject);
  }

  function updateUsers() {
    socket.emit("usersConnected");

  }

  function handleOnChange(e) {
    setMessage(e.target.value);
  }


  function usersConnected() {
    var usersDiv = document.getElementById("mainContainer");
    usersDiv.innerHTML = "";
    for (var i = 0; i < usersConnectList.length; i++) {

      if (usersConnectList[i] !== rng_name) {
        usersDiv.innerHTML += '<div class = "userConnected" id = "userConnected' + i + '"  >' + usersConnectList[i] + '</div>';
      }

    }


  }

  function insertPrivateChat(user) {
    var privateChat = document.getElementById("mainContainer");

    privateChat.innerHTML = '';
    // for (var i = 0; i < messageList.length; i++) {
    //   if (messageList[i].user === rng_name) {

    //     chat.innerHTML += '<div class = "msgContainerOwn"><div class="globalChatMessages">' + messageList[i].msg + '</div></div>';

    //   } else {
    //     chat.innerHTML += '<div class="senderName">' + messageList[i].user + '</div> <div class = "msgContainerExternal"><div class="globalChatMessages">' + messageList[i].msg + '</div></div>';
    //   }



  }

  var input = document.getElementById("mainContainer");
  if (input !== null) {
    var clickFunction = function (e) {
      if (e.target.className === "userConnected") {
        console.log(e.target.className + " --- " + e.target.id);
        var userPrivateChat = document.getElementById(e.target.id).textContent;
        console.log(userPrivateChat);
        insertPrivateChat(userPrivateChat);


      }

    };
    input.addEventListener("dblclick", clickFunction, false)
  }










  return (
    <div>
      <div id="headReact">
        <div id="user_name">{rng_name}</div>
        <div id="headTitle" onClick={handleOnClick}>Chat</div>
        <div id="headUsers" onClick={updateUsers}>Usuarios Conectado </div>
        <div id="iconChat">
          <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
        </div>
      </div>

      <div id="mainContainer">
        {messageList.map((payload) => {
          console.log(payload.user);
          console.log(rng_name);

          if (payload.user === rng_name) {
            return (
              <div class="msgContainerOwn"><div class="globalChatMessages"> {payload.msg} </div></div>
            )
          } else {
            return(
          <><div class="senderName"> {payload.user} </div><div class="msgContainerExternal"><div class="globalChatMessages">  {payload.msg}  </div></div></>
            )
          }

        })}

      </div>


      <div id="messageInput">
        <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
        <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick} />


      </div>
    </div>
  );
}

export default App;



