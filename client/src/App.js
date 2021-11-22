import "./App.css";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
const socketurl = "http://localhost:3670/";
const Chance = require("chance");
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

  // timeout para el trivial
  var timeoutTrivial = useRef(null);

  // timeout para los mensajes temporales
  const timeoutTemporalMsg = useRef(null);

  // Variable que controla si se pueden enviar mensajes temporales
  const canSendTemporal = useRef(true);

  // Variable que controla si se pueden cancelar ciertos mensajes
  const CanCancel = useRef(false);

  const direction = useRef("");
  const oldx = useRef(0);

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
      messageObject = {
        msg: privateMsg.msg,
        user: privateMsg.user,
        receiver: privateMsg.sockID,
      };
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
      setMainView("trivial");
      timeoutTrivial.current = setTimeout(() => {
        setMainView("disconnectPage");
        socket.disconnect();
      }, 60000);
    });

    // Movimiento móvil
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;

    let shaking = false;
    let timer = null;

    const options = {
      threshold: 15,
    };

    if ("Accelerometer" in window) {

      try {
        const acc = new window.Accelerometer({ frequency: 60 });
        acc.onreading = () => {
          const deltaX = Math.abs(lastX - acc.x);
          const deltaY = Math.abs(lastY - acc.y);
          const deltaZ = Math.abs(lastZ - acc.z);

          if (
            (deltaX > options.threshold && deltaY > options.threshold) ||
            (deltaX > options.threshold && deltaZ > options.threshold) ||
            (deltaY > options.threshold && deltaZ > options.threshold)
          ) {
            if (!shaking) {
              shaking = true;
              cancelMsg();
              if (timer) {
                clearTimeout(timer);
                timer = null;
              }
            }
          } else {
            if (shaking) {
              shaking = false;

              timer = setTimeout(() => {
                console.log("stop");
                document.body.style.backgroundColor = "white";
              }, 500);
            }
          }

          lastX = acc.x;
          lastY = acc.y;
          lastZ = acc.z;
        };

        acc.start();
      } catch (err) {
        console.log(err);
      }
    } else {
      alert("no accel");
    }

    document.addEventListener("mousemove", mousemovemethod);
  }, []);

  //Funcion que mezcla el contenido de un array
  function shuffle(array) {
    let currentIndex = array.length,
      randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
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
        messageObject = {
          msg: messageInput.value,
          user: rng_name,
          idReceiver: userPrivateChat.sockID,
        };
        console.log("ENVIADO --- " + userPrivateChat.name);
        setPrivateMsgList((messageArray) => {
          const Msg = Array.from(messageArray);
          Msg.push(messageObject);
          return Msg;
        });

        socket.emit("privateMsg", messageObject);
      }
    }
  }

  // Cancelar un mensaje
  function cancelMsg() {
    if (CanCancel.current) {
      clearTimeout(timeoutTemporalMsg.current);
      setMessageList((messageArray) => {
        const Msg = Array.from(messageArray);
        Msg.pop();
        return Msg;
      });
      CanCancel.current = false;
      canSendTemporal.current = true;
    }
  }

  // Movimiento del raton
  var counterMoves = 0;
  function mousemovemethod(e) {
    console.log(CanCancel.current);
    if (CanCancel.current === true) {
      if (e.pageX < oldx.current) {
        counterMoves++;
        console.log(counterMoves);
      }
      oldx.current = e.pageX;
      if (counterMoves >= 75) {
        counterMoves = 0;
        cancelMsg();
        CanCancel.current = false;
        
      }
    }

  }



  // Envio de mensajes temporales
  function sendTemporalMessage(chat) {
    CanCancel.current = true;
    var messageInput = document.getElementById("messageText");
    if (canSendTemporal.current) {
      canSendTemporal.current = false;
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
          canSendTemporal.current = true;
        }, 5000);
      } else {
        if (messageInput.value !== "") {
          var messageInput = document.getElementById("messageText");
          messageObject = {
            msg: messageInput.value,
            user: rng_name,
            idReceiver: userPrivateChat.sockID,
          };

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
          }, 5000);
        }
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
      {mainView === "globalChat" && (
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>

            <div id="iconChat" onClick={() => setMainView("globalChat")}>
              <img
                src="https://arcane.com/static/arcane-logo-a-2-b34b0493a79fb09b5ca3cff805292c7a.png"
                alt="Icono"
                width="45"
                height="45"
              />
            </div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>
              Usuarios{" "}
            </div>

          </div>
          <div id="mainContainer">
            {messageList.map((payload) => {
              if (payload.user === rng_name) {
                return (
                  <div className="msgContainerOwn">
                    <div className="globalChatMessages">{payload.msg}</div>
                  </div>
                );
              } else {
                return (
                  <div>
                    <div className="senderName">{payload.user}</div>
                    <div className="msgContainerExternal">
                      <div className="globalChatMessages">{payload.msg}</div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
          <div id="messageInput">
            <input
              type="text"
              id="messageText"
              placeholder="Escriba aqui para enviar un mensaje"
              name="Texto"
            />
            <img
              className="iconSend"
              src="https://icons-for-free.com/iconfiles/png/512/media+message+send+telegram+icon-1320192980424419632.png"
              alt="Icono"
              width="30"
              height="30"

              onClick={() => sendMessage("global")}
            />
            <img
              className="iconSend"
              src="https://icons-for-free.com/iconfiles/png/512/clock+sand+time+icon-1320168051171757895.png"
              alt="Icono"
              width="30"
              height="30"

              onClick={() => sendTemporalMessage("global")}
            />
          </div>
        </div>
      )}
      {mainView === "usersConnected" && (
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>

            <div id="iconChat" onClick={() => setMainView("globalChat")}>
              <img
                src="https://arcane.com/static/arcane-logo-a-2-b34b0493a79fb09b5ca3cff805292c7a.png"
                alt="Icono"
                width="45"
                height="45"
              />
            </div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>
              Usuarios Conectados{" "}
            </div>

          </div>
          <div id="mainContainer">
            {usersConnectList.map((payload) => {
              return (
                <div
                  className="userConnected"
                  onClick={() => openPrivateChat({ payload })}
                >
                  {" "}
                  {payload.name}{" "}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mainView === "privateChat" && (
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>

            <div id="iconChat" onClick={() => setMainView("globalChat")}>
              <img
                src="https://arcane.com/static/arcane-logo-a-2-b34b0493a79fb09b5ca3cff805292c7a.png"
                alt="Icono"
                width="45"
                height="45"
              />
            </div>
            <div id="headUsers" onClick={() => setMainView("usersConnected")}>
              Usuarios Conectados{" "}
            </div>

          </div>
          <div id="mainContainer">
            <div id="privateChatUser">{userPrivateChat.name}</div>
            {privateChatMsgList.map((payload) => {
              if (
                payload.user === rng_name &&
                payload.idReceiver === userPrivateChat.sockID
              ) {
                return (
                  <div className="msgContainerOwn">
                    <div className="globalChatMessages">{payload.msg}</div>
                  </div>
                );
              } else {
                if (payload.user === userPrivateChat.name) {
                  return (
                    <div>
                      <div className="msgContainerExternal">
                        <div className="globalChatMessages">{payload.msg}</div>
                      </div>
                    </div>
                  );
                }
              }
            })}
          </div>
          <div id="messageInput">
            <input
              type="text"
              id="messageText"
              placeholder="Escriba aqui para enviar un mensaje"
              name="Texto"
            />
            <img
              className="iconSend"
              src="https://icons-for-free.com/iconfiles/png/512/media+message+send+telegram+icon-1320192980424419632.png"
              alt="Icono"
              width="30"
              height="30"

              onClick={() => sendMessage("global")}
            />
            <img
              className="iconSend"
              src="https://icons-for-free.com/iconfiles/png/512/clock+sand+time+icon-1320168051171757895.png"
              alt="Icono"
              width="30"
              height="30"

              onClick={() => sendTemporalMessage("global")}
            />
          </div>
        </div>
      )}
      {mainView === "trivial" && (
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle">Chat</div>
            <div id="headUsers">Usuarios Conectados </div>
            <div id="iconChat">
              <img
                src="https://arcane.com/static/arcane-logo-a-2-b34b0493a79fb09b5ca3cff805292c7a.png"
                alt="Icono"
                width="50"
                height="50"
              />
            </div>
          </div>
          <div id="mainContainer">
            <div className="userConnected"> {trivialObject.question}</div>
            {possibleAnswers.map((payload) => {
              return (
                <div
                  className="userConnected"
                  onClick={() => answeredQuestion({ payload })}
                >
                  {" "}
                  {payload}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mainView === "disconnectPage" && (
        <div>
          <div id="headReact">
            <div id="user_name">{rng_name}</div>
            <div id="headTitle">Chat</div>
            <div id="headUsers">Usuarios Conectados </div>
            <div id="iconChat">
              <img
                src="https://arcane.com/static/arcane-logo-a-2-b34b0493a79fb09b5ca3cff805292c7a.png"
                alt="Icono"
                width="50"
                height="50"
              />
            </div>
          </div>
          <div id="mainContainer">
            <div className="userConnected">
              {" "}
              Has sido desconectado del chat.{" "}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
