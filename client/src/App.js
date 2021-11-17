import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [rng_name, setRngName] = useState("");
  const [messageList, setMessageList] = useState([]);

  const submitButton = document.getElementById("submit");

  const messagesRecieved = document.getElementsByClassName("ownMessages");


  var messageObject = null;


  const Chance = require('chance');
  const chance = new Chance();
 
  useEffect(() => {
    const socket = io("http://localhost:3670/");
    const username = chance.name();
    socket.emit("connected", username);
    setRngName(username);

    socket.on("message_server", (message) => {
      setMessage(message.msg);
      messageObject = { msg: message.msg, user: message.user };
      messageList.push(messageObject);
      setMessageList(messageList);
      insertMessage(username);

    });

    setSocket(socket);

  }, []);


  function insertMessage(username) {
    var chat = document.getElementById("chatMsg");
    chat.innerHTML = "";
    console.log(messageList.length);
    for (var i = 0; i < messageList.length; i++) {
      console.log("Lista: " + messageList[i].user + " Usuario: " + username);
      if (messageList[i].user === username) {

        chat.innerHTML += '<div class = "msgContainerOwn">"<div class="globalChatMessages">' + messageList[i].msg + '</div></div>';

      } else {
        chat.innerHTML += '<div class = "msgContainerExternal"><div class="globalChatMessages">' + messageList[i].msg + '</div></div>';
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

  function handleOnChange(e) {
    setMessage(e.target.value);
  }








  return (
    <div>
      <div id="headReact">
        <div id="user_name">{rng_name}</div>
        <div id="headTitle">Chat</div>
        <div id="iconChat">
          <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
        </div>
      </div>

      <div id="chatMsg">


      </div>


      <div id="messageInput">
        <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
        <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick} />


      </div>
    </div>
  );
}

export default App;



