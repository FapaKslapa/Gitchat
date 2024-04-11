import {
    acceptFriendship,
    addFriendship,
    addUsersToChat,
    createChat,
    getChatMessages,
    getChatParticipants,
    getUnacceptedFriendships,
    getUserChats,
    getUserFriends,
    rejectFriendship,
    downloadFile,
    getUserOwnedChats,
    getUserDetails,
    getChatFileMessages,
    deleteChatRoom,
    updateUsername,
    updateUserEmail,
    updateUserProfileImage
} from "./servizi/servizi.js"; // Importa i servizi

const socket = io();
const page = document.getElementById("page");
const spinner = document.getElementById("spinner");
const fileInput = document.getElementById("file-input");
const form = document.getElementById("form");
const input = document.getElementById("messaggio");
const messages = document.getElementById("messages");
const listChat = document.getElementById("listChat");
const newChat = document.getElementById("newChat");
const nomeChat = document.getElementById("nomeChat");
const newFriend = document.getElementById("newFriend");
const usernameFriend = document.getElementById("usernameFriend");
const boxAmicizia = document.getElementById("checkBoxAmicizia");
const boxGestisciChat = document.getElementById("checkBoxGestisci")
const inviaAmicizia = document.getElementById("inviaAmici");
const imgProfilo = document.getElementById("imgProfilo");
const gestisciRichieste = document.getElementById("gestisciRichieste");
const checkBoxRichieste = document.getElementById("checkBoxRichieste");
const invita = document.getElementById("invitaInChat");
const checkBoxChat = document.getElementById("checkBoxChat");
const avatar = document.getElementById("avatar");
const newChatButton = document.getElementById("newChatButton");
const divSelectFile = document.getElementById("divSelectFile");
const fileNameSelect = document.getElementById("fileNameSelect");
const deleteSelectFile = document.getElementById("deleteSelectFile");
const buttonProfilo = document.getElementById("buttonProfilo");
const nomeUtenteProfilo = document.getElementById("nomeUtenteProfilo");
const mailUtenteProfilo = document.getElementById("mailUtenteProfilo");
const numeroAmiciProfilo = document.getElementById("numeroAmiciProfilo");
const imgUtenteProfilo = document.getElementById("imgUtenteProfilo");
const buttonFile = document.getElementById("buttonFile");
const buttonGitHub = document.getElementById("buttonGitHub");
const githubSection = document.getElementById("githubSection");
const buttonChat = document.getElementById("buttonChat");
const fileSection = document.getElementById("fileSection");
const cardFileSection = document.getElementById("cardFileSection");
const buttonConnect = document.getElementById("connectToGH");
const deleteChat = document.getElementById("deleteChat");
const buttonModal = document.getElementById("buttonRepository");
const buttonRepository = document.getElementById("newRepository");
const buttonOpenCodespace = document.getElementById("buttonGHCodespace");
const modalRepository = new bootstrap.Modal('#modalRepository');
const eventHandlers = {};
const params = new URLSearchParams(new URL(document.location).search);
let chatSelezionata = "";
let chats = [];
let mieChat = [];
let messageData = []; // Array per salvare i dati dei messaggi
let userColors = {};
let user = {};
let room = "";
let username = "";
let password = "";
const pastelColors = ["#258EA6", "#549F93", "#EDB458", "#E8871E", "#F63E02", "#46237A", "#256EFF", "#FF495C", "#FEE440", "#00BBF9", "#00F5D4", "#72B01D", "#3F7D20", "#348AA7", "#440D0F"];
const templateFile = `<div class="card card-file">
    <div class="card-body">
        <div class="row justify-content-end align-middle">
            <div class="col align-middle name-file-display">
                %NOMEFILE
            </div>
            <div class="col-auto align-middle">
                <button type="button" class="btn btn-info align-middle btn-sm button-file" id="%IDFILE" value="%VALUEFILE"><span
                    class="material-symbols-rounded align-middle">
download
</span></button>
            </div>
        </div>
    </div>
</div>`
const templateFileSection = `<div class="col"><div class="card card-file">
<div class="card-header d-flex justify-content-between align-items-center">
    <p class="fw-bold mb-0 me-3">%USERNAME</p>
    <p class="small mb-0"><i class="far fa-clock"></i>%TEMPO</p>
</div>
  <div class="card-body">
  
    <div class="row justify-content-end align-middle">
            <div class="col align-middle">
                %NOMEFILE
            </div>
            <div class="col-auto align-middle">
                <button type="button" class="btn btn-info align-middle btn-sm button-file-section" id="%IDFILE" value="%VALUEFILE"><span
                    class="material-symbols-rounded align-middle">
download
</span></button>
            </div>
        </div>
  </div>
</div></div>`;
const templateMessageMio = `
<li class="d-flex justify-content-start mb-4">
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="60" height="60" style="margin-right: 10px;">
    <div class="card mask-custom" style="width: fit-content; max-width: 50%;">
        <div class="card-header d-flex justify-content-between align-items-center">
            <p class="fw-bold mb-0 me-3">%USERNAME</p>
            <div>
                <p class="small mb-0"><i class="far fa-clock"></i>%TEMPO  
                <button class="btn btn-trasparent btn-sm text-dark align-middle" style="padding: 0; border: none;" data-bs-toggle="popover" title="Titolo del Popover" data-bs-content="Contenuto del Popover">
                    <span class="material-symbols-rounded align-middle">
                        more_vert
                    </span>
                </button></p>
                
            </div>
        </div>
        <div class="card-body">
            %FILE
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
        %FILE
            <p class="mb-0">
                %TESTO
            </p>
        </div>
    </div>
    <img src="%SRC" alt="avatar"
         class="rounded-circle d-flex align-self-start me-3 shadow-1-strong" width="60" height="60" style="margin-left: 10px;">
</li>`;


const setProfile = (profile) => {
    const duration = 1.0; // Durata dell'animazione in secondi
    gsap.to(nomeUtenteProfilo, {duration, text: profile.Username, ease: "power1.out"});
    gsap.to(mailUtenteProfilo, {duration, text: profile.Mail, ease: "power1.out"});
    gsap.to(numeroAmiciProfilo, {duration, text: profile.numFriends, ease: "power1.out"});

    // Per l'immagine, non c'è bisogno di un'animazione di testo
    imgUtenteProfilo.src = `data:image/jpeg;base64,${profile.ImmagineProfilo}`;
}
const handleClick = async (i, array) => {
    socket.emit("leaveRoom", room, username);
    messageData = [];
    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
    room = array[i].IdChat;
    socket.emit('join room', array[i].IdChat);
    chatSelezionata = array[i].NomeChat;
    for (let j = 0; j < array.length; j++) {
        if (array[j].IdChat !== array[i].IdChat) {
            document.getElementById(`chat_${array[j].IdChat}`).classList.remove("active");
            document.getElementById(`chat_${array[j].IdChat}`).classList.remove("disabled");
        }
    }
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    document.getElementById(`chat_${array[i].IdChat}`).classList.add("active");
    if (mieChat.some(chat => chat.Id === room)) {
        invita.removeAttribute("disabled");
    }
    messageData = await getChatMessages(room)
    checkRepo(room).then((url) => {
        buttonModal.innerHTML = `Apri Repository
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30"
             viewBox="0 0 30 30">
            <path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"></path>
        </svg>`;
    }).catch((res) => {
        buttonModal.innerHTML = `Associa Repository
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30"
             viewBox="0 0 30 30">
            <path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"></path>
        </svg>`;
    })
    displayMessages(messageData);
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

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(buttonTmp, {
            y: 100, // L'elemento parte da 100px sotto la sua posizione finale
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            y: 0, // L'elemento finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.5, // L'animazione dura 0.5 secondi
            delay: i * 0.5, // Ritarda l'inizio dell'animazione di 0.5 secondi per ogni elemento
        });
    }
};
const renderFile = (array) => {
    // Clear the cardFileSection
    cardFileSection.innerHTML = '';

    array.forEach((file, index) => {
        console.log(file);
        const nomeFile = file.path.split("_")[1];
        let dataInvio = new Date(file.dataInvio);
        let oraInvio = file.oraInvio.split(":");
// Imposta l'ora e i minuti della data con i valori di oraInvio
        dataInvio.setHours(oraInvio[0], oraInvio[1]);

        let formattedDate = dataInvio.toLocaleDateString("it-IT", {
            year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
        });
        // Create a new card
        const card = templateFileSection.replace("%NOMEFILE", nomeFile).replace("%IDFILE", file.path).replace("%VALUEFILE", file.path).replace("%USERNAME", file.autore).replace("%TEMPO", formattedDate);

        // Add the card to the DOM
        cardFileSection.insertAdjacentHTML('beforeend', card);

        // Select the card we just added
        const addedCard = cardFileSection.lastElementChild;

        // Animate the card with GSAP
        gsap.fromTo(addedCard, {
            y: 100, // Start 100px below the final position
            opacity: 0, // Start completely transparent
        }, {
            y: 0, // End at the final position
            opacity: 1, // End completely visible
            ease: 'power1.out', // Use a specific transition type
            duration: 0.3, // The animation lasts 0.5 seconds
            delay: index * 0.2, // Delay the start of the animation by 0.5 seconds for each card
        });
    });
    const buttons = document.querySelectorAll('.button-file-section');
    buttons.forEach(button => {
        button.onclick = async () => {
            await downloadFile(room, button.value);
        }
    });
};
const displayMessages = (array) => {
    const chat = chats.find(chat => chat.NomeChat === chatSelezionata);
    messages.innerHTML = '';
    array.forEach(({IdAutore, Testo, Data_invio, Ora_invio, Path}, index) => {
        let user = chat ? chat.users.find(user => user.username === IdAutore) : null;
        console.log(user);
        if (!user) {
            user = {
                username: 'Utente Eliminato', profileImage: './images/default.jpg'
            };
        }
        const profileImage = user.profileImage.startsWith('./') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`;
        const align = IdAutore === username ? "me" : "others";
        if (!userColors[IdAutore]) {
            const randomIndex = Math.floor(Math.random() * pastelColors.length);
            userColors[IdAutore] = pastelColors[randomIndex];
        }
        const userColor = userColors[IdAutore];
        const dataParts = Data_invio.split("T");
        const datePart = dataParts[0];
        const date = new Date(`${datePart}T${Ora_invio}`);
        const formattedDate = date.toLocaleDateString("it-IT", {
            year: "2-digit", month: "2-digit", day: "2-digit"
        });
        const formattedTime = date.toLocaleTimeString("it-IT", {
            hour: "2-digit", minute: "2-digit"
        });
        const usernameDisplay = user.username === 'Utente Eliminato' ? `<em>${IdAutore}</em>` : IdAutore;
        let messageElement;
        if (align === "me") {
            if (Path !== null) {
                const tmp = templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", templateFile);
                messageElement = tmp.replace("%NOMEFILE", Path.split("_")[1]).replace("%VALUEFILE", Path).replace("%IDFILE", Path);
            } else messageElement = templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", "");
        } else {
            if (Path !== null) {
                const tmp = templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", templateFile);
                messageElement = tmp.replace("%NOMEFILE", Path.split("_")[1]).replace("%VALUEFILE", Path).replace("%IDFILE", Path);
            } else messageElement = templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", "");
        }
        const messageDiv = document.createElement('div');

        // Imposta l'HTML interno del div
        messageDiv.innerHTML = messageElement;

        // Aggiungi il div al DOM
        messages.insertAdjacentHTML('beforeend', messageDiv.outerHTML);

        // Seleziona l'elemento appena aggiunto al DOM
        const addedElement = messages.lastElementChild;

        // Determina la direzione dell'animazione in base all'autore del messaggio
        const direction = IdAutore === username ? -100 : 100;

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(addedElement, {
            x: direction, // Il messaggio parte da 100px a sinistra o a destra
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            x: 0, // Il messaggio finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.3, // L'animazione dura 0.5 secondi
            delay: index * 0.1, onComplete: () => addedElement.scrollIntoView({behavior: 'smooth'}) // Scorri fino al messaggio appena animato quando l'animazione è terminata
        });
    });

    const buttons = document.querySelectorAll('.button-file');
    buttons.forEach(button => {
        button.onclick = async () => {
            await downloadFile(room, button.value);
        }
    });
}
const displayNewMessage = (array) => {
    const chat = chats.find(chat => chat.NomeChat === chatSelezionata);
    messages.innerHTML = '';
    array.forEach(({IdAutore, Testo, Data_invio, Ora_invio, Path}, index) => {
        let user = chat ? chat.users.find(user => user.username === IdAutore) : null;
        console.log(user);
        if (!user) {
            user = {
                username: 'Utente Eliminato', profileImage: './images/default.jpg'
            };
        }
        const profileImage = user.profileImage.startsWith('./') ? user.profileImage : `data:image/jpeg;base64,${user.profileImage}`;
        const align = IdAutore === username ? "me" : "others";
        if (!userColors[IdAutore]) {
            const randomIndex = Math.floor(Math.random() * pastelColors.length);
            userColors[IdAutore] = pastelColors[randomIndex];
        }
        const userColor = userColors[IdAutore];
        const dataParts = Data_invio.split("T");
        const datePart = dataParts[0];
        const date = new Date(`${datePart}T${Ora_invio}`);
        const formattedDate = date.toLocaleDateString("it-IT", {
            year: "2-digit", month: "2-digit", day: "2-digit"
        });
        const formattedTime = date.toLocaleTimeString("it-IT", {
            hour: "2-digit", minute: "2-digit"
        });
        const usernameDisplay = user.username === 'Utente Eliminato' ? `<em>${IdAutore}</em>` : IdAutore;
        let messageElement;
        if (align === "me") {
            if (Path !== null) {
                const tmp = templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", templateFile);
                messageElement = tmp.replace("%NOMEFILE", Path.split("_")[1]).replace("%VALUEFILE", Path).replace("%IDFILE", Path);
            } else messageElement = templateMessageMio.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", "");
        } else {
            if (Path !== null) {
                const tmp = templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", templateFile);
                messageElement = tmp.replace("%NOMEFILE", Path.split("_")[1]).replace("%VALUEFILE", Path).replace("%IDFILE", Path);
            } else messageElement = templateMessageAltro.replace("%SRC", profileImage).replace("%TESTO", Testo).replace("%USERNAME", `<span style="color: ${userColor};">${usernameDisplay}</span>`).replace("%TEMPO", `${formattedDate} ${formattedTime}`).replace("%FILE", "");
        }
        const messageDiv = document.createElement('div');

        // Imposta l'HTML interno del div
        messageDiv.innerHTML = messageElement;

        // Aggiungi il div al DOM
        messages.insertAdjacentHTML('beforeend', messageDiv.outerHTML);

        // Se il messaggio è l'ultimo dell'array, applica l'animazione GSAP
        if (index === array.length - 1) {
            // Seleziona l'elemento appena aggiunto al DOM
            const addedElement = messages.lastElementChild;
            addedElement.scrollIntoView({behavior: 'smooth'});

            // Determina la direzione dell'animazione in base all'autore del messaggio
            const direction = IdAutore === username ? -100 : 100;

            // Aggiungi l'animazione con GSAP
            gsap.fromTo(addedElement, {
                x: direction, // Il messaggio parte da 100px a sinistra o a destra
                opacity: 0, // L'opacità parte da 0 (completamente trasparente)
            }, {
                x: 0, // Il messaggio finisce nella sua posizione finale
                opacity: 1, // L'opacità finisce a 1 (completamente visibile)
                ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
                duration: 0.5, // L'animazione dura 0.5 secondi
            });
        }
    });
    const buttons = document.querySelectorAll('.button-file');
    buttons.forEach(button => {
        button.onclick = async () => {
            await downloadFile(room, button.value);
        }
    });
}
const renderInvitoChat = (friends) => {
    checkBoxChat.innerHTML = '';
    friends.forEach((friend, index) => {
        const friendElement = `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${friend.fotoProfilo}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${friend.username}</h3>
</div>
<div class="col-md-auto align-middle">
<input type="checkbox" class="btn-check" id="invitaNuovaChat_${friend.username}" value="${friend.username}" autocomplete="off">
<label class="btn btn-outline-primary" for="invitaNuovaChat_${friend.username}">Seleziona</label>
</div>
</div>`;

        // Aggiungi l'elemento friend al DOM
        checkBoxChat.insertAdjacentHTML('beforeend', friendElement);

        // Seleziona l'elemento appena aggiunto al DOM
        const addedElement = checkBoxChat.lastElementChild;

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(addedElement, {
            x: -100, // L'elemento parte da 100px a sinistra
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            x: 0, // L'elemento finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.5, // L'animazione dura 0.5 secondi
            delay: index * 0.5, // Ritarda l'inizio dell'animazione di 0.5 secondi per ogni elemento
        });
    });
}
const getSelectedCheckboxes = (personale) => {
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
const renderRichieste = (array) => {
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
        document.getElementById(`accept_${index}`).onclick = async () => {
            await acceptFriendship(username, user.username);
            renderRichieste(await getUnacceptedFriendships(username));
        }
        document.getElementById(`reject_${index}`).onclick = async () => {
            await rejectFriendship(username, user.username);
            renderRichieste(getUnacceptedFriendships(username));
        }

        // Seleziona l'elemento appena aggiunto al DOM
        const addedElement = checkBoxRichieste.children[index];

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(addedElement, {
            x: -100, // L'elemento parte da 100px a sinistra
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            x: 0, // L'elemento finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.5, // L'animazione dura 0.5 secondi
            delay: index * 0.5, // Ritarda l'inizio dell'animazione di 0.5 secondi per ogni elemento
        });
    });
}
const getSelectedFriends = () => {
    // Get all checkboxes
    const checkboxes = document.querySelectorAll('.btn-check');
    let selectedFriends = [];

    // Loop through each checkbox
    for (let i = 0; i < checkboxes.length; i++) {
        // If the checkbox is checked and its id starts with 'invitaChat_', add its value to the array
        if (checkboxes[i].checked && checkboxes[i].id.startsWith('invitaNuovaChat_')) {
            selectedFriends.push(checkboxes[i].value);
        }
    }

    return selectedFriends;
}
const renderInvito = (array, partecipanti) => {
    boxAmicizia.innerHTML = '';
    array.forEach((friend, index) => {
        const isFriendInParticipants = partecipanti.some(partecipante => partecipante.username === friend.username);
        let checkDisabled = isFriendInParticipants ? 'disabled' : '';
        const friendElement = `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${friend.fotoProfilo}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${friend.username}</h3>
</div>
<div class="col-md-auto align-middle">
<input type="checkbox" class="btn-check" id="invitaChat_${friend.username}" value="${friend.username}" autocomplete="off" ${checkDisabled}>
<label class="btn btn-outline-primary" for="invitaChat_${friend.username}">Seleziona</label>
</div>
</div>`;

        // Aggiungi l'elemento friend al DOM
        boxAmicizia.insertAdjacentHTML('beforeend', friendElement);

        // Seleziona l'elemento appena aggiunto al DOM
        const addedElement = boxAmicizia.lastElementChild;

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(addedElement, {
            x: -100, // L'elemento parte da 100px a sinistra
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            x: 0, // L'elemento finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.5, // L'animazione dura 0.5 secondi
            delay: index * 0.5, // Ritarda l'inizio dell'animazione di 0.5 secondi per ogni elemento
        });
    });
}
const renderPartecipanti = (partecipanti) => {

    boxGestisciChat.innerHTML = '';
    console.log(partecipanti);
    partecipanti.forEach((friend, index) => {
        if (friend.username.toUpperCase() === username.toUpperCase()) {
            return;
        }
        const friendElement = `<div class="row mt-3 d-flex align-items-center">
<div class="col-md-auto">
<img src="data:image/jpeg;base64,${friend.profileImage}" alt="avatar"
                             class="rounded-circle d-flex align-self-start ms-3 shadow-1-strong" width="50">
</div>
<div class="col-md-auto align-middle">
<h3 class="align-middle">${friend.username}</h3>
</div>
<div class="col-md-auto align-middle">
<input type="checkbox" class="btn-check" id="invitaChat_${friend.username}" value="${friend.username}" autocomplete="off" checked>
<label class="btn btn-outline-primary" for="invitaChat_${friend.username}">Seleziona</label>
</div>
</div>`;

        // Aggiungi l'elemento friend al DOM
        boxGestisciChat.insertAdjacentHTML('beforeend', friendElement);

        // Seleziona l'elemento appena aggiunto al DOM
        const addedElement = boxGestisciChat.lastElementChild;

        // Aggiungi l'animazione con GSAP
        gsap.fromTo(addedElement, {
            x: -100, // L'elemento parte da 100px a sinistra
            opacity: 0, // L'opacità parte da 0 (completamente trasparente)
        }, {
            x: 0, // L'elemento finisce nella sua posizione finale
            opacity: 1, // L'opacità finisce a 1 (completamente visibile)
            ease: 'power1.out', // Questo è il tipo di transizione che viene utilizzato per l'animazione
            duration: 0.5, // L'animazione dura 0.5 secondi
            delay: index * 0.5, // Ritarda l'inizio dell'animazione di 0.5 secondi per ogni elemento
        });
    });
}

const connectRepository = (name, description, readme, priv) => {
    const repoSpecs = {
        name: name, descr: description, auto_init: readme, private: priv
    };

    fetch("/github/createRepo/" + room, {
        method: "POST", headers: {
            'content-type': "application/json"
        }, body: JSON.stringify({
            username: username, repoSpecs: repoSpecs
        })
    }).then((res) => {
        console.log(res.json());
        fetch("/github/sendInvites/" + room, {
            method: "POST", headers: {
                'content-type': "application/json"
            }, body: JSON.stringify({
                username: username, repo: repoSpecs.name
            })
        }).then((res) => {
            return res.json();
        })
    })
}

const sendInvites = (room, repoName) => {
    console.log("mava")
    fetch("/github/sendInvites/" + room, {
        method: "POST", headers: {
            'content-type': "application/json"
        }, body: JSON.stringify({
            username: username, repo: repoName
        })
    }).then((res) => {
        return res.json();
    })
}

const checkRepo = (IdChat) => {
    return new Promise((resolve, reject) => {
        fetch(`/chat/${IdChat}/hasRepo`, {
            method: "GET", headers: {
                'content-type': "Application/json"
            }
        })
            .then((res) => res.json())
            .then((res) => {
                console.log("res")
                console.log(res.result)
                if (res.result) {
                    resolve(res.url);
                } else {
                    reject(false);
                }
            })
    })
}

if (params.has("login")) {
    if (params.get("login") != "failed") {
        sessionStorage.setItem("username", params.get("login"));
        sessionStorage.setItem("password", "logged w/ github");
    }
    // Rimuovi i parametri di query dall'URL
    let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
}

if (sessionStorage.getItem("username") === null || sessionStorage.getItem("password") === null) {
    window.location.href = "./accedi.html";
} else {
    user = await getUserDetails(sessionStorage.getItem("username"));
    sessionStorage.setItem("username", user.Username);
    username = sessionStorage.getItem("username");
    password = sessionStorage.getItem("password");
    avatar.src = `data:image/jpeg;base64,${user.ImmagineProfilo}`;
    chats = await getUserChats(username);
    mieChat = await getUserOwnedChats(username);
    spinner.classList.add('d-none');
    page.classList.remove('d-none');
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

socket.on("chat message", (message) => {
    messageData.push(message); // Aggiungi il messaggio all'array
    console.log(message);
    displayNewMessage(messageData); // Visualizza i messaggi
});
newFriend.onclick = async () => {
    await addFriendship(username, usernameFriend.value)
}
newChat.onclick = async () => {
    const data = getSelectedFriends();
    await createChat(nomeChat.value, data, username);
    mieChat = await getUserOwnedChats(username);
    chats = await getUserChats(username);
    messageData = [];
    displayMessages(messageData);
    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
    listChat.innerHTML = chats
        .map((chat) => {
            const usernames = chat.users.map(user => user.username).join(", ");
            return `<li id="chat_${chat.IdChat}"><a>${chat.NomeChat}
                    <p>${usernames}</p></a>
                    </li>`;
        })
        .join("");
    renderChat(chats);
    nomeChat.value = "";
}
newChatButton.onclick = async () => {
    const data = await getUserFriends(username);
    renderInvitoChat(data);
}
document.getElementById("closeModalNuovaChat").onclick = () => {
    nomeChat.value = "";
}
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleString("it-IT", {
        year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
    if (input.value) {
        if (fileInput.files.length > 0) {
            console.log(input.value);
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = function (event) {
                const blob = new Blob([event.target.result], {type: file.type});
                socket.emit("file", room, {
                    username, message: input.value, timestamp, file: blob, fileName: file.name
                });
                input.value = "";
                fileInput.value = "";
            };
            reader.onerror = function (error) {
                console.log('Error reading file:', error); // Log any errors
            };
            reader.readAsArrayBuffer(file);
            gsap.fromTo(divSelectFile, {y: 0, autoAlpha: 1}, {
                y: 100, autoAlpha: 0, duration: 0.5, onComplete: () => {
                    fileInput.value = "";
                    divSelectFile.classList.add("d-none");
                }
            });
        } else {
            socket.emit("chat message", room, {
                username, message: input.value, timestamp,
            });
            input.value = "";
            fileInput.value = "";
        }
    }
});
invita.onclick = async () => {
    const friends = await getUserFriends(username);
    const partecicipants = await getChatParticipants(room);
    console.log(partecicipants);
    renderInvito(friends, partecicipants);
    renderPartecipanti(partecicipants);
}
inviaAmicizia.onclick = async () => {
    const arrayAggiunta = getSelectedCheckboxes(username);
    await addUsersToChat(room, arrayAggiunta);
    checkRepo(room).then((url) => {
        sendInvites(room, url.split("/")[1]);
    });
    chats = await getUserChats(username);
    mieChat = await getUserOwnedChats(username);
    messageData = [];

    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
    displayMessages(messageData);
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
gestisciRichieste.onclick = async () => {
    renderRichieste(await getUnacceptedFriendships(username));
}
document.getElementById('messaggio').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.shiftKey) {
        // Se sia Shift che Enter sono premuti, permetti l'azione predefinita (andare a capo)
    } else if (event.key === 'Enter') {
        // Se solo Enter è premuto, previeni l'azione predefinita e simula un click sul bottone "invia"
        event.preventDefault();
        document.getElementById('invia').click();
    }
});
fileInput.addEventListener('change', function () {
    if (this.files && this.files.length > 0) {
        fileNameSelect.innerHTML = this.files[0].name;
        divSelectFile.classList.remove("d-none");
        gsap.fromTo(divSelectFile, {y: 100, autoAlpha: 0}, {y: 0, autoAlpha: 1, duration: 0.5});
    }
});
deleteSelectFile.onclick = () => {
    gsap.fromTo(divSelectFile, {y: 0, autoAlpha: 1}, {
        y: 100, autoAlpha: 0, duration: 0.5, onComplete: () => {
            fileInput.value = "";
            divSelectFile.classList.add("d-none");
        }
    });
};
deleteChat.onclick = async () => {
    await deleteChatRoom(room);
    mieChat = await getUserOwnedChats(username);
    chats = await getUserChats(username);
    messageData = [];
    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
    displayMessages(messageData);
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
buttonProfilo.onclick = () => {
    setProfile(user);
}
buttonFile.onclick = async () => {
    buttonFile.setAttribute('disabled', '');
    buttonChat.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');

    // Imposta l'opacità di 'fileSection' a 0
    gsap.set(fileSection, {autoAlpha: 0});

    // Rimuovi la classe 'd-none' da 'fileSection'
    fileSection.classList.remove('d-none');

    // Animazione con GSAP
    gsap.to(form, {autoAlpha: 0, duration: 0.5});
    gsap.to(input, {autoAlpha: 0, duration: 0.5});
    gsap.to(messages, {autoAlpha: 0, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 1, duration: 0.5});
    messages.classList.add('d-none');
    githubSection.classList.add('d-none');
    const file = await getChatFileMessages(room);
    renderFile(file);
};

buttonGitHub.onclick = () => {
    buttonFile.removeAttribute('disabled');
    buttonGitHub.setAttribute('disabled', '');
    buttonChat.removeAttribute('disabled');

    // Imposta l'opacità di 'githubSection' a 0
    gsap.set(githubSection, {autoAlpha: 0});

    // Rimuovi la classe 'd-none' da 'githubSection'
    githubSection.classList.remove('d-none');

    // Animazione con GSAP
    gsap.to(form, {autoAlpha: 0, duration: 0.5});
    gsap.to(input, {autoAlpha: 0, duration: 0.5});
    gsap.to(messages, {autoAlpha: 0, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    gsap.to(githubSection, {autoAlpha: 1, duration: 0.5}); // Aggiungi questa riga

    fileSection.classList.add('d-none');
}
buttonChat.onclick = () => {
    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
};

buttonConnect.onclick = () => {
    fetch("/github/connect/" + username, {method: 'GET'})
        .then(response => response.json())
        .then(data => {
            console.log(data)
            window.location.href = data.url;
        })
        .catch(error => console.error('Error:', error));
}

buttonModal.onclick = () => {
    checkRepo(room).then((url) => {
        window.open("https://www.github.com/" + url, "_blank").focus();
        console.log(url)
        console.log("arriva1")
    }).catch((result) => {
        console.log(result)
        console.log("arriva2")
        modalRepository.show();
    })
}

buttonRepository.onclick = () => {
    const name = document.getElementById("nomeRepository");
    const descr = document.getElementById("descrizioneRepository");
    const readme = document.getElementById("readMe");
    const priv = document.getElementById("priv");
    console.log("c'è")
    name.classList.add("border-light");
    name.classList.remove("border-danger");
    if (name.value != "") {
        const result = connectRepository(name.value, descr.value, readme.checked, priv.checked)
        console.log(result);
        modalRepository.hide();
        buttonModal.innerHTML = `Apri Repository
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30"
             viewBox="0 0 30 30">
            <path d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"></path>
        </svg>`;
    } else {
        name.classList.add("border-danger");
        name.classList.remove("border-light");
    }
}

buttonOpenCodespace.onclick = () => {
    console.log("vadiocan")
}

document.getElementById("modalRepository").addEventListener("hide.bs.modal", () => {
    document.getElementById("nomeRepository").value = "";
    document.getElementById("descrizioneRepository").value = "";
    document.getElementById("readMe").checked = false;
    document.getElementById("priv").checked = false;
})

let popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
let popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl, {
        sanitize: false
    })
})

popoverTriggerList.forEach(function (popoverTriggerEl) {
    popoverTriggerEl.addEventListener('shown.bs.popover', function () {
        const logout = document.getElementById("logout");

        logout.onclick = () => {
            console.log("logout");
            sessionStorage.clear();
            window.location.href = "./accedi.html";
        }

        // Aggiungi un listener per l'evento click del documento
        document.addEventListener('click', function (e) {
            // Se il click non è sul popover o sui suoi trigger, nascondi il popover
            if (!popoverTriggerEl.contains(e.target)) {
                let popover = bootstrap.Popover.getInstance(popoverTriggerEl);
                popover.hide();
            }
        });
    })
})

// Seleziona gli elementi che desideri rendere modificabili


function handleDblClick(event) {
    let elem = event.target;
    let currentText = elem.textContent;
    let inputElem = document.createElement('input');
    inputElem.type = 'text';
    inputElem.value = currentText;
    inputElem.classList.add('form-control'); // Aggiungi la classe 'form-control'
    inputElem.addEventListener('blur', handleBlur);
    inputElem.addEventListener('keydown', handleKeyDown);
    elem.textContent = '';
    elem.appendChild(inputElem);
    inputElem.focus();
}

// Funzione per gestire la perdita di focus
function handleBlur(event) {
    let inputElem = event.target;
    let newText = inputElem.value;
    let parentElem = inputElem.parentElement;
    parentElem.removeChild(inputElem);
    parentElem.textContent = newText;
}

// Funzione per gestire la pressione del tasto invio
function handleKeyDown(event) {
    if (event.key === 'Enter') {
        event.target.blur();
    }
}

// Aggiungi il gestore di eventi a ciascun elemento
nomeUtenteProfilo.addEventListener('dblclick', handleDblClick);
mailUtenteProfilo.addEventListener('dblclick', handleDblClick);

const modificaAccount = document.getElementById('modificaAccount');
modificaAccount.onclick = async () => {
    spinner.classList.remove('d-none');
    page.classList.add('d-none');
    // Recupera l'elemento di input del file
    let imageInput = document.getElementById('imageProfileInput');
    let imageFile = imageInput.files[0];
    if (user.Username !== nomeUtenteProfilo.textContent) {
        await updateUsername(user.Username, nomeUtenteProfilo.textContent);
    }
    if (user.Email !== mailUtenteProfilo.textContent) {
        await updateUserEmail(user.Username, mailUtenteProfilo.textContent);
    }
    if (imageFile) {
        await updateUserProfileImage(user.Username, imageFile);
    }
    user = await getUserDetails(nomeUtenteProfilo.textContent);
    sessionStorage.setItem("username", user.Username);
    username = sessionStorage.getItem("username");
    setProfile(user);

    avatar.src = `data:image/jpeg;base64,${user.ImmagineProfilo}`;
    chats = await getUserChats(username);
    mieChat = await getUserOwnedChats(username);

    listChat.innerHTML = chats
        .map((chat) => {
            const usernames = chat.users.map(user => user.username).join(", ");
            return `<li id="chat_${chat.IdChat}"><a>${chat.NomeChat}
                    <p>${usernames}</p></a>
                    </li>`;
        })
        .join("");
    renderChat(chats);
    messageData = [];
    buttonChat.setAttribute('disabled', '');
    buttonFile.removeAttribute('disabled');
    buttonGitHub.removeAttribute('disabled');
    messages.classList.remove('d-none');
    displayMessages(messageData);
    gsap.fromTo(form, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(input, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.fromTo(messages, {autoAlpha: 0}, {autoAlpha: 1, duration: 0.5});
    gsap.to(fileSection, {autoAlpha: 0, duration: 0.5});
    fileSection.classList.add('d-none');
    githubSection.classList.add('d-none');
    displayMessages(messageData);
    spinner.classList.add('d-none');
    page.classList.remove('d-none');
}

document.getElementById('imageProfileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('imgUtenteProfilo').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    const tooltip = new bootstrap.Tooltip(tooltipTriggerEl);

    // Aggiungi un gestore di eventi 'dblclick' all'elemento
    tooltipTriggerEl.addEventListener('dblclick', function () {
        tooltip.hide();
    });

    return tooltip;
});
