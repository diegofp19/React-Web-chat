import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

function App() {
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    setSocket(() => {
      return io("http://localhost:3670/");
    });
  }, []);

  function handleOnClick() {
    socket.emit("message_evt", { msg: message });
  }

  function handleOnChange(e) {
    setMessage(e.target.value);
  }

  return (
    <div>
      <input type="text" onChange={handleOnChange}></input>
      <button onClick={handleOnClick}>send</button>
    </div>
  );
}

export default App;
/*
const socket = io();
const button = document.querySelector("button");
const input = document.querySelector("input");
const msg = document.querySelector("#msg");

button.addEventListener("click", function(e) {
  const text = input.value;
  //enviarselo al servidor
  socket.emit("message_evt", {msg: text});
});

socket.on("message_evt", function(message){
  msg.innerHTML = message.msg;
});
*/
