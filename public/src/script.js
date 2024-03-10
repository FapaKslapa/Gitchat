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
getUserChats(username).then((data) => {
    listChat.innerHTML = data
        .map((chat) => {
            return `<li id="chat_${chat.IdChat}"><a>${chat.NomeChat}<button class="btn btn-warning" type="button" data-bs-toggle="modal"
                           id="invita_${chat.IdChat}" data-bs-target="#modalChatAmicizia">
                        Amicizia
                    </button></a></li>`;
        })
        .join("");
    renderChat(data);
});


socket.on("chat message", (message) => {
    console.log(message)
    messageData.push(message); // Aggiungi il messaggio all'array
    displayMessages(messageData); // Visualizza i messaggi
});


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

// Definisci le funzioni di gestione degli eventi fuori dal ciclo for
const handleClick = (i, array) => {
    console.log("Click");
    room = array[i].IdChat;
    socket.emit('join room', array[i].IdChat);
    for (let j = 0; j < array.length; j++) {
        if (array[j].IdChat !== array[i].IdChat) {
            document.getElementById(`chat_${array[j].IdChat}`).classList.remove("active");
            document.getElementById(`chat_${array[j].IdChat}`).classList.remove("disabled");
        }
    }
    document.getElementById(`chat_${array[i].IdChat}`).classList.add("active");
    getChatMessages(room).then((array2) => {
        messageData = array2;
        displayMessages(messageData);
        renderChat(array);
    });
};

const handleInvitoClick = (username) => {
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
};

// Crea un oggetto per memorizzare le funzioni di gestione degli eventi
const eventHandlers = {};

const renderChat = (array) => {
    for (let i = 0; i < array.length; i++) {
        const buttonTmp = document.getElementById(`chat_${array[i].IdChat}`);
        const buttonTmpInvito = document.getElementById(`invita_${array[i].IdChat}`);

        // Se esistono vecchi gestori di eventi, rimuovili
        if (eventHandlers[`chat_${array[i].IdChat}`]) {
            buttonTmp.removeEventListener("click", eventHandlers[`chat_${array[i].IdChat}`]);
        }
        if (eventHandlers[`invita_${array[i].IdChat}`]) {
            buttonTmpInvito.removeEventListener("click", eventHandlers[`invita_${array[i].IdChat}`]);
        }

        // Crea nuovi gestori di eventi
        const newClickHandler = () => handleClick(i, array);
        const newInvitoClickHandler = () => handleInvitoClick(username);

        // Memorizza i nuovi gestori di eventi
        eventHandlers[`chat_${array[i].IdChat}`] = newClickHandler;
        eventHandlers[`invita_${array[i].IdChat}`] = newInvitoClickHandler;

        // Aggiungi i nuovi gestori di eventi
        buttonTmp.addEventListener("click", newClickHandler, false);
        buttonTmpInvito.addEventListener("click", newInvitoClickHandler, false);
    }
};