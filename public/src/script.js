import {
    getChatMessages, getUserChats, getUserFriends, createChat, addFriendship, addUsersToChat,
} from "./servizi/servizi.js"; // Importa i servizi

const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("input");
const roomInput = document.getElementById("room");
const usernameInput = document.getElementById("username"); // Aggiungi un campo di input per l'username
const messages = document.getElementById("messages");
const invia = document.getElementById("invia");
const buttonChat = document.getElementById("chats");
const listChat = document.getElementById("listChat");
const newChat = document.getElementById("newChat");
const nomeChat = document.getElementById("nomeChat");
const newFriend = document.getElementById("newFriend");
const usernameFriend = document.getElementById("usernameFriend");
const boxAmicizia = document.getElementById("checkBoxAmicizia");
const inviaAmicizia = document.getElementById("inviaAmici");
let chatSelezionata = "";
newFriend.onclick = () => {
    console.log(username, usernameFriend.value);
    addFriendship(username, usernameFriend.value).then((data) => {
        console.log(data);
    });
}
newChat.onclick = () => {
    createChat(nomeChat.value, [username]).then((data) => {
        console.log(data);
    });
}
buttonChat.onclick = () => {
    getUserChats(username).then((data) => {
        listChat.innerHTML = data
            .map((chat) => {
                return `<li>${chat.NomeChat} <button type="button" class="btn btn-primary" id="chat_${chat.IdChat}">Connetti</button><button class="btn btn-warning" type="button" data-bs-toggle="modal"
                           id="invita_${chat.IdChat}" data-bs-target="#modalChatAmicizia">
                        Amicizia
                    </button></li>`;
            })
            .join("");
        let buttonTmp = "";
        let buttonTmpInvito = "";
        for (let i = 0; i < data.length; i++) {
            room = data[i].IdChat;
            console.log(room);
            buttonTmp = document.getElementById(`chat_${data[i].IdChat}`);
            buttonTmpInvito = document.getElementById(`invita_${data[i].IdChat}`);
            console.log(buttonTmpInvito.id);
            buttonTmp.onclick = () => {
                socket.emit('join room', room);
                getChatMessages(room).then((data) => {
                    messageData = data;
                    displayMessages(messageData);
                });
            };
            buttonTmpInvito.onclick = () => {
                getUserFriends(username).then((data) => {
                    console.log("Room: " + room);
                    renderInvito(data);
                    inviaAmicizia.onclick = () => {
                        const arrayAggiunta = [];
                        const checkboxes = document.querySelectorAll("#checkBoxAmicizia .form-check-input");
                        checkboxes.forEach((checkbox, index) => {
                            if (checkbox.checked) {
                                arrayAggiunta.push(checkbox.value);
                            }
                        });
                        addUsersToChat(room, arrayAggiunta).then((data) => {
                            console.log(data);
                        });
                    }
                });
            }
        }
    });
}
socket.on("chat message", (message) => {
    console.log(message)
    messageData.push(message); // Aggiungi il messaggio all'array
    displayMessages(messageData); // Visualizza i messaggi
});
let username = "";
let password = "";
if (sessionStorage.getItem("username") === null || sessionStorage.getItem("password") === null) {
    window.location.href = "/accedi.html";
} else {
    username = sessionStorage.getItem("username");
    password = sessionStorage.getItem("password");
    getUserChats(username).then((data) => {
        console.log(data);
        //displayMessages(data);
    });
}

let room = "";
form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value) {
        const timestamp = new Date().toLocaleString("it-IT", {
            year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
        });
        socket.emit("chat message", room, {
            username, message: input.value, timestamp,
        }); // Invia l'username e il messaggio
        input.value = "";
    }
});

let messageData = []; // Array per salvare i dati dei messaggi


function displayMessages(array) {
    messages.innerHTML = array
        .map(({IdAutore, Testo, Data_invio, Ora_invio}) => {
            console.log(IdAutore, username);
            const align = IdAutore === username ? "me" : "others";
            return `<li class="${align}">[${Ora_invio}] ${IdAutore}: ${Testo}</li>`;
        })
        .join("");

    // Scorri fino all'ultimo messaggio
    window.scrollTo(0, document.body.scrollHeight);
}

/*
  socket.emit("leaveRoom", room, username);
  messageData = [];
  roomInput.value = "";
  room = "";
  messages.innerHTML = "";
*/
const renderInvito = (array) => {
    console.log(array);
    boxAmicizia.innerHTML = array
        .map((user) => {
            return `<div class="form-check">
        <input class="form-check-input" type="checkbox" value="${user.friend}" id="flexCheckDefault"/>
        <label class="form-check-label" for="flexCheckDefault">
            ${user.friend}
        </label>
    </div>`;
        })
        .join("");

}