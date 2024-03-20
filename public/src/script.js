import {
    getChatMessages,
    getUserChats,
    getUserFriends,
    createChat,
    addFriendship,
    addUsersToChat,
    getChatParticipants,
    acceptFriendship,
    rejectFriendship,
    getUnacceptedFriendships
} from "./servizi/servizi.js"; // Importa i servizi

const socket = io();
const form = document.getElementById("form");
const input = document.getElementById("messaggio");
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
const imgProfilo = document.getElementById("imgProfilo");
const gestisciRichieste = document.getElementById("gestisciRichieste");
const checkBoxRichieste = document.getElementById("checkBoxRichieste");
const invita = document.getElementById("invitaInChat");
const checkBoxChat = document.getElementById("checkBoxChat");
const newChatButton = document.getElementById("newChatButton");
let chats = [];
let mieChat = [];
const eventHandlers = {};
let username = "";
let password = "";
const pastelColors = ["#258EA6", "#549F93", "#EDB458", "#E8871E", "#F63E02", "#46237A", "#256EFF", "#FF495C", "#FEE440", "#00BBF9", "#00F5D4", "#72B01D", "#3F7D20", "#348AA7", "#440D0F"];

const templateMessageMio = `
<li class="d-flex justify-content-start mb-4">
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="60" style="margin-right: 10px;">
    <div class="card mask-custom" style="width: fit-content; max-width: 50%;">
        <div class="card-header d-flex justify-content-between p-3 align-items-center"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0" style="margin-right: 10px;">%USERNAME</p>
            <p class=" small mb-0"><i class="far fa-clock"></i>%TEMPO</p>
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
    <div class="card mask-custom" style="width: fit-content; max-width: 50%;">
        <div class="card-header d-flex justify-content-between p-3 align-items-center"
             style="border-bottom: 1px solid rgba(255,255,255,.3);">
            <p class="fw-bold mb-0" style="margin-right: 10px;">%USERNAME</p>
            <p class="small mb-0"><i class="far fa-clock"></i> %TEMPO</p>
        </div>
        <div class="card-body">
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60" style="margin-left: 10px;">
</li>`;
const handleClick = (i, array) => {
    socket.emit("leaveRoom", room, username);
    messageData = [];
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
    if (array[i].proprietario !== username)
        invita.removeAttribute("disabled");
    getChatMessages(room).then((array2) => {
        messageData = array2;
        displayMessages(messageData);
        renderChat(array);
    });
};
const renderChat = (array) => {
    for (let i = 0; i < array.length; i++) {
        const buttonTmp = document.getElementById(`chat_${array[i].IdChat}`);

        // Se esistono vecchi gestori di eventi, rimuovili
        if (eventHandlers[`chat_${array[i].IdChat}`]) {
            buttonTmp.removeEventListener("click", eventHandlers[`chat_${array[i].IdChat}`]);
        }
        // Crea nuovi gestori di eventi
        const newClickHandler = () => handleClick(i, array);
        // Memorizza i nuovi gestori di eventi
        eventHandlers[`chat_${array[i].IdChat}`] = newClickHandler;
        // Aggiungi i nuovi gestori di eventi
        buttonTmp.addEventListener("click", newClickHandler, false);
    }
};

if (sessionStorage.getItem("username") === null || sessionStorage.getItem("password") === null) {
    window.location.href = "/accedi.html";
} else {
    username = sessionStorage.getItem("username");
    password = sessionStorage.getItem("password");
    chats = await getUserChats(username);
    mieChat = chats.filter(chat => chat.proprietario === username);
    listChat.innerHTML = chats
        .map((chat) => {
            const usernames = chat.users.map(user => user.username).join(", ");
            return `<li id="chat_${chat.IdChat}"><a>${chat.NomeChat}
                    <p>${usernames}</p></a>
                    </li>`;
        })
        .join("");
    renderChat(chats);
}

newFriend.onclick = async () => {
    console.log(username, usernameFriend.value);
    await addFriendship(username, usernameFriend.value)
}
newChat.onclick = async () => {
    const data = getSelectedFriends();
    await createChat(nomeChat.value, data, username);
}
newChatButton.onclick = async () => {
    const data = await getUserFriends(username);
    renderInvitoChat(data);
}
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
        console.log(timestamp);
        socket.emit("chat message", room, {
            username, message: input.value, timestamp,
        }); // Invia l'username e il messaggio
        input.value = "";
    }
});

let messageData = []; // Array per salvare i dati dei messaggi

let userColors = {};
let colorIndex = 0;

function displayMessages(array) {
    const chat = chats.find(chat => chat.NomeChat === chatSelezionata);
    console.log(array);
    messages.innerHTML = array
        .map(({IdAutore, Testo, Data_invio, Ora_invio}) => {
            let user = chat ? chat.users.find(user => user.username === IdAutore) : null;
            // Se l'utente non viene trovato, utilizza un profilo fittizio
            if (!user) {
                user = {
                    username: 'Utente Eliminato',
                    profileImage: './images/default.jpg'
                };
            }
            const profileImage = user.profileImage.startsWith('./') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`;
            const align = IdAutore === username ? "me" : "others";
            console.log(Testo, Data_invio, Ora_invio);
            // Assign a color to the user if they don't have one yet
            if (!userColors[IdAutore]) {
                const randomIndex = Math.floor(Math.random() * pastelColors.length);
                userColors[IdAutore] = pastelColors[randomIndex];
            }

            const userColor = userColors[IdAutore];

            // Dividi la stringa di data e ora in due parti
            const dataParts = Data_invio.split("T");
            const datePart = dataParts[0];
            const timePart = Ora_invio;

            // Crea un nuovo oggetto Date utilizzando le due parti
            const date = new Date(`${datePart}T${timePart}`);

            const formattedDate = date.toLocaleDateString("it-IT", {
                year: "2-digit", month: "2-digit", day: "2-digit"
            });
            const formattedTime = date.toLocaleTimeString("it-IT", {
                hour: "2-digit", minute: "2-digit"
            });

            // Se l'utente è stato eliminato, il nome viene mostrato in italico
            const usernameDisplay = user.username === 'Utente Eliminato' ? `<em>${IdAutore}</em>` : IdAutore;

            if (align === "me") {
                return templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`)
            } else {
                return templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`)
            }
        })
        .join("");
    const lastMessage = messages.lastElementChild;
    if (lastMessage) {
        lastMessage.scrollIntoView();
    }
}

const renderInvito = (array, partecipanti) => {
    console.log(array);
    console.log(partecipanti);
    boxAmicizia.innerHTML = array
        .map((user) => {
            const isChecked = partecipanti.some(partecipante => partecipante.Username === user.username) ? 'checked' : '';
            return `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${user.fotoProfilo}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${user.username}</h3>
</div>
<div class="col-md-auto align-middle">
<input type="checkbox" class="btn-check" id="${user.username}" value="${user.username}" autocomplete="off" ${isChecked}>
<label class="btn btn-outline-primary" for="${user.username}">Seleziona</label>
</div>
</div>`;
        })
        .join("");
}
const renderInvitoChat = (friends) => {
    checkBoxChat.innerHTML = friends
        .map((friend) => {
            return `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${friend.fotoProfilo}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${friend.username}</h3>
</div>
<div class="col-md-auto align-middle">
<input type="checkbox" class="btn-check" id="invitaChat_${friend.username}" value="${friend.username}" autocomplete="off">
<label class="btn btn-outline-primary" for="invitaChat_${friend.username}">Seleziona</label>
</div>
</div>`;
        })
        .join("");
}

const getSelectedFriends = () => {
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.btn-check');
    let selectedFriends = [];

    // Loop through each checkbox
    for (let i = 0; i < checkboxes.length; i++) {
        // If the checkbox is checked and its id starts with 'invitaChat_', add its value to the array
        if (checkboxes[i].checked && checkboxes[i].id.startsWith('invitaChat_')) {
            selectedFriends.push(checkboxes[i].value);
        }
    }

    return selectedFriends;
}

invita.onclick = () => {
    getUserFriends(username).then((data) => {
        console.log("Room: " + room);
        getChatParticipants(room).then((partecipanti) => {
            console.log("Partecipanti: " + partecipanti);
            renderInvito(data, partecipanti);
        });
    });
}

function getSelectedCheckboxes(personale) {
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.btn-check');
    let selectedValues = [];

    // Loop through each checkbox
    for (let i = 0; i < checkboxes.length; i++) {
        // If the checkbox is checked, add its value to the array
        if (checkboxes[i].checked) {
            selectedValues.push(checkboxes[i].value);
        }
    }
    selectedValues.push(personale);
    return selectedValues;
}

inviaAmicizia.onclick = () => {
    const arrayAggiunta = getSelectedCheckboxes(username);
    addUsersToChat(room, arrayAggiunta).then((data) => {
        console.log(data);
    });
}
// Crea un oggetto per memorizzare le funzioni di gestione degli eventi


const renderRichieste = (array) => {
    console.log(array);
    checkBoxRichieste.innerHTML = array
        .map((user, index) => {
            return `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${user.fotoProfilo}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${user.username}</h3>
</div>
<div class="col-md-auto align-middle">
<div class="row">
<div class="col-md-auto">
<button class="btn btn-primary align-middle btn-circle" id="accept_${index}"><span class="material-symbols-rounded align-middle">
done
</span></button>
</div>
<div class="col-md-auto align-middle">
<button class="btn btn-info align-middle btn-circle" id="reject_${index}"><span class="material-symbols-rounded align-middle">
close
</span></button>
</div>
</div>
</div>
</div>`;
        })
        .join("");

    array.forEach((user, index) => {
        document.getElementById(`accept_${index}`).onclick = () => {
            acceptFriendship(username, user.username).then(() => {
                getUnacceptedFriendships(username).then((data) => {
                    renderRichieste(data);
                });
            });
        }

        document.getElementById(`reject_${index}`).onclick = () => {
            rejectFriendship(username, user.username).then(() => {
                getUnacceptedFriendships(username).then((data) => {
                    renderRichieste(data);
                });
            });
        }
    });
}

gestisciRichieste.onclick = () => {
    getUnacceptedFriendships(username).then((data) => {
        console.log(data);
        renderRichieste(data);
    });
}

