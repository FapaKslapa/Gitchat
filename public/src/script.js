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
let chats = [];
let username = "";
let password = "";
const templateMessageMio = `
<li class="d-flex justify-content-start mb-4">
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="60">
    <div class="card mask-custom w-50">
        <div class="card-header d-flex justify-content-between p-3"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0">%USERNAME</p>
            <p class="text-light small mb-0"><i class="far fa-clock"></i>%TEMPO</p>
        </div>
        <div class="card-body">
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
</li>`;

const templateMessageAltro = `
<li class="d-flex justify-content-end mb-4">
    <div class="card mask-custom w-50">
        <div class="card-header d-flex justify-content-between p-3"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0">%USERNAME</p>
            <p class="text-light small mb-0"><i class="far fa-clock"></i> %TEMPO</p>
        </div>
        <div class="card-body">
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60">
</li>`;
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
    chats = data;
    listChat.innerHTML = data
        .map((chat) => {
            const usernames = chat.users.map(user => user.username).join(", ");
            return `<li id="chat_${chat.IdChat}"><a>${chat.NomeChat}<button class="btn btn-warning" type="button" data-bs-toggle="modal"
                           id="invita_${chat.IdChat}" data-bs-target="#modalChatAmicizia">
                        Amicizia
                    </button>
                    <p>${usernames}</p></a>
                    </li>`;
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

function stringToColour(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

function displayMessages(array) {
    const chat = chats.find(chat => chat.NomeChat === chatSelezionata);
    messages.innerHTML = array
        .map(({IdAutore, Testo, Data_invio, Ora_invio}) => {
            const user = chat ? chat.users.find(user => user.username === IdAutore) : null;
            const profileImage = user ? `data:image/jpeg;base64,${user.profileImage}` : "https://mdbootstrap.com/img/Photos/Avatars/img%20(31).jpg";
            const align = IdAutore === username ? "me" : "others";
            const userColor = stringToColour(IdAutore);
            const formattedTime = new Date(`${Data_invio} ${Ora_invio}`).toLocaleString("it-IT", {
                year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
            });
            if (align === "me") {
                return templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${IdAutore}</span>`).replace("%TEMPO", formattedTime)
            } else {
                return templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${IdAutore}</span>`).replace("%TEMPO", formattedTime)
            }
        })
        .join("");
    const lastMessage = messages.lastElementChild;
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }
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
    chatSelezionata = array[i].NomeChat;
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