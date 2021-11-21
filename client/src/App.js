import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
const socketurl = "http://localhost:3670/";
const Chance = require('chance');
const chance = new Chance();
const socket = io(socketurl);



function App() {

  const [rng_name, setRngName] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [usersConnectList, setUsersConnected] = useState([]);
  const [mainView, setMainView] = useState("globalChat");
  const [userPrivateChat, setUserPrivateChat] = useState("");
  const [privateChatMsgList, setPrivateMsgList] = useState([]);
  const [trivialObject, setTrivialObject] = useState(null);
  const [possibleAnswers, setPossibleAnswers] = useState([]);


  var messageObject = null;

  var timeoutTrivial = useRef(null);

 const timeoutTemporalMsg = useRef(null);


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
    });

    //Mensaje privado
    socket.on("privateMsgClient", (privateMsg) => {
      messageObject = { msg: privateMsg.msg, user: privateMsg.user };
      setPrivateMsgList((messageArray) => {
        const Msg = Array.from(messageArray);
        Msg.push(messageObject);
        return Msg;
      });
    });

    //Trivial
    socket.on("trivialQuestion", (jsonTrivial) => {
      setTrivialObject(jsonTrivial.results[0]);
      //Meto en el array de posibles respuestas tanto la correcta como las incorrectas
      possibleAnswers.push(jsonTrivial.results[0].correct_answer);
      for (var i = 0; i < jsonTrivial.results[0].incorrect_answers.length; i++) {
        possibleAnswers.push(jsonTrivial.results[0].incorrect_answers[i]);
      }
      //Mezclamos el array para que la respuesta correcta no se encuentre siempre en la misma posición en html
      shuffle(possibleAnswers);
      setPossibleAnswers(possibleAnswers);
      console.log(mainView);
      setMainView("trivial");
      timeoutTrivial.current = setTimeout(() => {
        setMainView("disconnectPage");
        socket.disconnect();

      }, 60000);
    })

  }, []);


  //Funcion que mezcla el contenido de un array
  function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {

      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
  }




  // Envio de mensajes 
  function sendMessage(chat) {
    var messageInput = document.getElementById("messageText");
    if (chat === "global") {
      if (messageInput.value !== "") {
        messageObject = { msg: messageInput.value, user: rng_name };

        setMessageList((messageArray) => {
          const Msg = Array.from(messageArray);
          Msg.push(messageObject);
          return Msg;
        });
      }
        socket.emit("message_evt", messageObject);
      } else {
        if (messageInput.value !== "") {
        var messageInput = document.getElementById("messageText");
        messageObject = { msg: messageInput.value, user: rng_name, idReceiver: userPrivateChat.sockID };

        setPrivateMsgList((messageArray) => {
          const Msg = Array.from(messageArray);
          Msg.push(messageObject);
          return Msg;
        });

        socket.emit("privateMsg", messageObject);
      }
    }


  }



  var msgOwn = document.getElementsByClassName("msgContainerOwn");
  for (let i = 0; i < msgOwn.length; i++) {
    msgOwn[i].addEventListener("click", function () {
      console.log("Clicked index: " + i);
    });
  }

  // Cancelar un mensaje 
  function cancelMsg(){
    console.log(timeoutTemporalMsg);
    clearTimeout(timeoutTemporalMsg.current);
    setMessageList((messageArray) => {
      messageArray.splice(messageArray.length - 1, 1);
      return messageArray;
    });
  }

  // Envio de mensajes temporales
  function sendTemporalMessage(chat) {
      var messageInput = document.getElementById("messageText");
    if (chat === "global") {
      if (messageInput.value !== "") {
        messageObject = { msg: messageInput.value, user: rng_name };

        setMessageList((messageArray) => {
          const Msg = Array.from(messageArray);
          Msg.push(messageObject);
          return Msg;
        });
      }
      timeoutTemporalMsg.current = setTimeout(() => {
          socket.emit("message_evt", messageObject);
      }, 10000);
      } else {
        if (messageInput.value !== "") {
        var messageInput = document.getElementById("messageText");
        messageObject = { msg: messageInput.value, user: rng_name, idReceiver: userPrivateChat.sockID };

        setPrivateMsgList((messageArray) => {
          const Msg = Array.from(messageArray);
          Msg.push(messageObject);
          return Msg;
        });
        setTimeout(() => {
          
          socket.emit("privateMsg", messageObject);
          setPrivateMsgList((messageArray) => {
            messageArray.splice(0, messageArray.length);
            return messageArray;
          });

      }, 10000);
        
      }
    }
  }

 



  //Cambia la página al chat privado 
  function openPrivateChat(user) {
    setUserPrivateChat(user.payload);
    setMainView("privateChat");
  }

  function answeredQuestion(answer) {
    clearTimeout(timeoutTrivial.current);
    if (answer.payload === trivialObject.correct_answer) {
      setMainView("globalChat");
      setPossibleAnswers((answerArray) => {
        answerArray.splice(0, answerArray.length);
        return answerArray;
      });
    } else {
      setMainView("disconnectPage");
      socket.disconnect();
    }
  }



  return (
    <div>
      {mainView === "globalChat" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle" onClick={() => setMainView("globalChat")}>Chat Global </div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>Usuarios Conectados </div>
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
            <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={() => sendMessage("global")} />
            <input type="submit" id="messageSubmit" placeholder="Envio temporal" onClick={() => sendTemporalMessage("global")} />
            <input type="submit" id="messageSubmit" placeholder="Cancelar" onClick={cancelMsg} />

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
              return (
                <div className="userConnected" onClick={() => openPrivateChat({ payload })}>  {payload.name} </div>
              )
            })}
          </div>
        </div>


      }
      {mainView === "privateChat" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle" onClick={() => setMainView("globalChat")}>{userPrivateChat.name}</div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>Usuarios Conectados </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">
            {privateChatMsgList.map((payload) => {

              if (payload.user === rng_name) {

                return (

                  <div className="msgContainerOwn">
                    <div className="globalChatMessages">
                      {payload.msg}
                    </div>
                  </div>

                )
              } else {
                if (payload.user === userPrivateChat.name) {
                  return (
                    <div>
                      <div className="msgContainerExternal">
                        <div className="globalChatMessages">
                          {payload.msg}
                        </div>
                      </div>
                    </div>
                  )
                }

              }
            })}

          </div>
          <div id="messageInput">
            <input type="text" id="messageText" placeholder="Escriba aqui para enviar un mensaje" name="Texto" />
            <input type="submit" id="messageSubmit" placeholder="Enviar" onClick={() => sendMessage("private")} />

          </div>

        </div>
      }
      {mainView === "trivial" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle">Chat</div>
            <div id="headUsers">Usuarios Conectados </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">
            <div className="userConnected"> {trivialObject.question}</div>
            {possibleAnswers.map((payload) => {
              return (
                <div className="userConnected" onClick={() => answeredQuestion({ payload })}> {payload}</div>
              )
            })}



          </div>
        </div>
      }
      {mainView === "disconnectPage" &&
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle">Chat</div>
            <div id="headUsers">Usuarios Conectados </div>
            <div id="iconChat">
              <img src="https://img.icons8.com/nolan/512/shrek.png" alt="Icono" width="50" height="50" />
            </div>
          </div>
          <div id="mainContainer">

            <div className="userConnected" > Has sido desconectado del chat. </div>


          </div>
        </div>
      }
    </div>



  );
}

export default App;



