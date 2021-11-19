import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
const socketurl = "http://localhost:3670/";
const Chance = require('chance');
const chance = new Chance();
const socket = io(socketurl);

function App() {
  const [message, setMessage] = useState("");
  const [rng_name, setRngName] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [usersConnectList, setUsersConnected] = useState([]);
  const [mainView, setMainView] = useState("globalChat");





  var messageObject = null;




  useEffect(() => {

    const username = chance.name();
    socket.emit("connected", username);
    setRngName(username);

    //Conexion en server
    socket.on("connectClient", (user) => {
      setUsersConnected((userCon) => {
        const users = Array.from(userCon);
        users.push(user);
        return users;
      });

    });

    //Desconexion con el servidor
    socket.on("disconnectClient", (user) => {

      setUsersConnected((userCon) => {
        const users = Array.from(userCon);
        for (var i = 0; i < users.length; i++) {
          if (user.name === users[i].name) {
            users.splice(i, 1);
          }
        }
        return users;
      });

    });

    //Mensaje chat global
    socket.on("message_server", (message) => {
      setMessage(message.msg);
      messageObject = { msg: message.msg, user: message.user };
      setMessageList((messageArray) => {
        const Msg = Array.from(messageArray);
        Msg.push(messageObject);
        return Msg;
      });

    });

    //Lista de usuarios
    socket.on("usersConnected", (usersOn) => {
      setUsersConnected((userCon) => {
        const users = Array.from(usersOn);
        return users;
      });
      console.log(usersOn);
    });

  }, []);









  function handleOnClick() {
    var messageInput = document.getElementById("messageText");
    messageObject = { msg: messageInput.value, user: rng_name };

    setMessageList((oldmessages) => {
      const newMsg = Array.from(oldmessages);
      newMsg.push(messageObject);
      return newMsg;
    });
    socket.emit("message_evt", messageObject);
  }


  function handleOnChange(e) {
    setMessage(e.target.value);
  }


  function openPrivateChat(user) {

    setMainView("privateChat");
  }





  return (
    <div>
      {mainView === "globalChat" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle" onClick={() => setMainView("globalChat")}>Chat</div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>Usuarios Conectado </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">
            {messageList.map((payload) => {
              if (payload.user === rng_name) {
                return (

                  <div className="msgContainerOwn">
                    <div className="globalChatMessages">
                      {payload.msg}
                    </div>
                  </div>

                )
              } else {
                return (
                  <div>
                    <div className="senderName">
                      {payload.user}
                    </div>
                    <div className="msgContainerExternal">
                      <div className="globalChatMessages">
                        {payload.msg}
                      </div>
                    </div>
                  </div>
                )
              }

            })}

          </div>
          <div id="messageInput">
            <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
            <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick} />

          </div>

        </div>
      }
      {mainView === "usersConnected" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle" onClick={() => setMainView("globalChat")}>Chat</div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>Usuarios Conectados </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">
            {usersConnectList.map((payload) => {
              console.log(payload.name);
              return (
                <div className="userConnected" onClick={() => openPrivateChat({payload})}>  {payload.name} </div>
              )
            })}
          </div>
        </div>


      }
      {mainView === "privateChat" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle" onClick={() => setMainView("globalChat")}>Chat</div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>Usuarios Conectado </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">
            {messageList.map((payload) => {
              if (payload.user === rng_name) {
                return (

                  <div className="msgContainerOwn">
                    <div className="globalChatMessages">
                      {payload.msg}
                    </div>
                  </div>

                )
              } else {
                return (
                  <div>
                    <div className="senderName">
                      {payload.user}
                    </div>
                    <div className="msgContainerExternal">
                      <div className="globalChatMessages">
                        {payload.msg}
                      </div>
                    </div>
                  </div>
                )
              }

            })}

          </div>
          <div id="messageInput">
            <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
            <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={handleOnClick} />

          </div>

        </div>
      }
    </div>



  );
}

export default App;



