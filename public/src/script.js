import {
    getChatMessages, getUserChats, getUserFriends, createChat, addFriendship, editMessage, deleteMessage,
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
//const users = document.getElementById("users");
newChat.onclick = () => {
    createChat(nomeChat.value, [username]).then((data) => {
        console.log(data);
    });

}
buttonChat.onclick = () => {
    getUserChats(username).then((data) => {
        console.log(data);
        listChat.innerHTML = data
            .map((chat) => {
                return `<li>${chat.NomeChat} <button type="button" class="btn btn-primary" id="chat_${chat.IdChat}">Connetti</button></li>`;
            })
            .join("");
        let buttonTmp = "";
        for (let i = 0; i < data.length; i++) {
            buttonTmp = document.getElementById(`chat_${data[i].IdChat}`);
            buttonTmp.onclick = () => {
                room = data[i].IdChat;
                socket.emit('join room', room);
                getChatMessages(room).then((data) => {
                    console.log(data);
                });
            };
        }
    });
}
let username = "";
let password = "";
if (sessionStorage.getItem("username") === null || sessionStorage.getItem("password") === null) {
    window.location.href = "/accedi.html";
} else {
    username = sessionStorage.getItem("username");
    password = sessionStorage.getItem("password");
    getUserChats(username).then((data) => {
        console.log(data);
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

socket.on("chat message", (message) => {
    messageData.push(message); // Aggiungi il messaggio all'array
    displayMessages(); // Visualizza i messaggi
});

function displayMessages() {
    messages.innerHTML = messageData
        .map(({username1, message, timestamp}) => {
            const align = username1 === username ? "me" : "others";
            return `<li class="${align}">[${timestamp}] ${username1}: ${message}</li>`;
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
