import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
const socketurl = "http://localhost:3670/";
function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(io(socketurl));
  const [rng_name, setRngName] = useState("");
  const [messageList, setMessageList] = useState([]);
  var [usersConnectList, setUsersConnected] = useState([]);

  const submitButton = document.getElementById("submit");

  const messagesRecieved = document.getElementsByClassName("ownMessages");


  var messageObject = null;
  var showUsers = false;


  const Chance = require('chance');
  const chance = new Chance();

  useEffect(() => {

    const username = chance.name();
    socket.emit("connected", username);
    setRngName(username);

    socket.on("message_server", (message) => {
      console.log(message);
      setMessage(message.msg);
      messageObject = { msg: message.msg, user: message.user };
      messageList.push(messageObject);
      setMessageList(messageList);
      insertMessage(username);

    });

    socket.on("usersConnected", (usersOn) => {
      usersConnectList = usersOn;
      setUsersConnected(usersConnectList);
      console.log(usersConnectList);
      usersConnected();

    });

  }, []);







  function insertMessage(username) {
    showUsers = false;
    var chat = document.getElementById("mainContainer");

    chat.innerHTML = "";
    for (var i = 0; i < messageList.length; i++) {
      if (messageList[i].user === username) {

        chat.innerHTML += '<div class = "msgContainerOwn"><div class="globalChatMessages">' + messageList[i].msg + '</div></div>';

      } else {
        chat.innerHTML += '<div class="senderName">' + messageList[i].user + '</div> <div class = "msgContainerExternal"><div class="globalChatMessages">' + messageList[i].msg + '</div></div>';
      }

    }

  }



  function handleOnClick() {
    var messageInput = document.getElementById("messageText");
    messageObject = { msg: messageInput.value, user: rng_name };
    messageList.push(messageObject);
    setMessageList(messageList);
    insertMessage(rng_name);
    socket.emit("message_evt", messageObject);
  }

  function updateUsers() {
    socket.emit("usersConnected");
    return true;

  }

  function handleOnChange(e) {
    setMessage(e.target.value);
  }


  function usersConnected() {
    var usersDiv = document.getElementById("mainContainer");
    console.log(showUsers);
    usersDiv.innerHTML = "";
    console.log(usersConnectList);
    for (var i = 0; i < usersConnectList.length; i++) {
      usersDiv.innerHTML += '<div class = "userConnected" id = "userConnected' + i + '"  >' + usersConnectList[i] + '</div>';
    }


  }

  var input = document.getElementById("mainContainer");
  if (input != null) {
    input.addEventListener("dblclick", function (e) {

      if (e.target.className === "userConnected") {
        var idPrivateChat = document.getElementById(e.target.id).textContent;
        console.log(idPrivateChat);
      }

    });
  }






  return (
    <div>
      <div id="headReact">
        <div id="user_name">{rng_name}</div>
        <div id="headTitle" onClick={() => insertMessage(rng_name)}>Chat</div>
        <div id="headUsers" onClick={updateUsers}>Usuarios Conectado </div>
        <div id="iconChat">
          <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
        </div>
      </div>

      <div id="mainContainer">


      </div>


      <div id="messageInput">
        <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
        <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick} />


      </div>
    </div>
  );
}

export default App;



