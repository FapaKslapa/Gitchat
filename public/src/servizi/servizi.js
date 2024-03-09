/**
 * Funzione per recuperare tutti i messaggi di una chat.
 * @param {string} chatId - L'ID della chat.
 */
export async function getChatMessages(chatId) {
    const response = await fetch(`/chat/${chatId}/messages`);
    const data = await response.json();
    console.log(`Messaggi della chat ${chatId}:`);
    return data;
}

/**
 * Funzione per recuperare tutte le chat di un utente.
 * @param {string} username - Il nome dell'utente.
 */
export async function getUserChats(username) {
    const response = await fetch(`/user/${username}/chats`);
    const data = await response.json();
    console.log(`Chat dell'utente ${username}:`);
    return data;
}

/**
 * Funzione per creare un utente.
 * @param {Object} user - L'oggetto utente.
 */
export async function getUserFriends(username) {
    const response = await fetch(`/user/${username}/friends`);
    const data = await response.json();
    console.log(`Amici dell'account ${username}:`);
    console.log(data);
}

/**
 * Funzione per creare un utente.
 * @param {Object} user - L'oggetto utente.
 */
export async function createUser(user) {
    const response = await fetch("/user", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(user),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per creare una chat.
 * @param {Object} chat - L'oggetto chat.
 */
export async function createChat(nomeChat, users) {
    const chat = {
        nomeChat: nomeChat,
        users: users
    }
    const response = await fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(chat),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per creare un messaggio.
 * @param {Object} message - L'oggetto messaggio.
 */
export async function createMessage(message) {
    const response = await fetch("/message", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(message),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per aggiungere un'amicizia.
 * @param {string} username1 - Il primo nome utente.
 * @param {string} username2 - Il secondo nome utente.
 */
export async function addFriendship(username1, username2) {
    const response = await fetch("/friendship", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username1, username2}),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per modificare un messaggio.
 * @param {string} id - L'ID del messaggio.
 * @param {string} newText - Il nuovo testo del messaggio.
 */
export async function editMessage(id, newText) {
    const response = await fetch(`/message/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({newText}),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per eliminare un messaggio.
 * @param {string} id - L'ID del messaggio.
 */
export async function deleteMessage(id) {
    const response = await fetch(`/message/${id}`, {
        method: "DELETE",
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per effettuare il login.
 * @param {string} username - Il nome utente.
 * @param {string} password - La password.
 */
export async function login(username, password) {
    const response = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username, password}),
    });
    const data = await response.json();
    console.log(
        data.login ? "Accesso effettuato con successo" : "Accesso non riuscito"
    );
}

// Dati di esempio per creare un utente, una chat e un messaggio
const user = {
    Username: "test",
    Mail: "test@mail.com",
    Password: "test",
    ImmagineProfilo: "default_path",
    Token: "test",
};

const chat = {Id: "2", DataCreazione: "2022-01-01", users: ["test"]};
const message = {
    Id: "1",
    Path: "",
    Testo: "Ciao",
    Data_invio: "2022-01-01",
    Ora_invio: "12:00:00",
    IdAutore: "test",
    IdChat: "2",
};

//createUser(user);
//createChat(chat);
//createMessage(message);
// Richiama i servizi
//getChatMessages(2);
//getUserChats('test');
//getUserFriends('test');
