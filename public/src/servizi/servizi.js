/**
 * Funzione per recuperare tutti i messaggi di una chat.
 * @param {string} chatId - L'ID della chat.
 */
export async function getChatMessages(chatId) {
    const response = await fetch(`/chat/${chatId}/messages`);
    const data = await response.json();
    console.log(`Messaggi della chat ${chatId}:`);
    console.log(data);
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
    return await response.json();
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
    return data;
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

/**
 * Funzione per aggiungere utenti a una chat.
 * @param {string} chatId - L'ID della chat.
 * @param {Array} users - L'array degli ID degli utenti.
 */
export async function addUsersToChat(chatId, users) {
    console.log(chatId);
    const response = await fetch(`/chat/${chatId}/users`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({users}),
    });
    const data = await response.json();
    console.log(data.message);
}


