import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const[rng_name, setRngName] = useState("");
  
  const submitButton = document.getElementById("submit");

  const messagesRecieved = document.getElementsByClassName("ownMessages");




  
  useEffect(() => {
    
    var Chance = require('chance');
    var chance = new Chance();
    var username = chance.name();
      setRngName(username);
      const socket = io("http://localhost:3670/");
      socket.emit("connected",  username);
      
      socket.on("message_server", (message) =>{
        setMessage(message.msg);
      });

      setSocket(socket);

  }, []);

 

  function handleOnClick() {
    var messageInput = document.getElementById("messageText");
    socket.emit("message_evt", { msg: messageInput.value });
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

      <div class="ownMessages">
      {message}
      </div>

      <div id="messageInput">
        <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
        <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick}/>


      </div>
    </div>
  );
}

export default App;



