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
    console.log(data);
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
export async function createChat(nomeChat, users, proprietario) {
    const chat = {
        nomeChat: nomeChat, users: users, proprietario: proprietario
    }
    const response = await fetch("/chat", {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(chat),
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
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username1, username2}),
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
        method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({newText}),
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
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username, password}),
    });
    const data = await response.json();
    console.log(data.login ? "Accesso effettuato con successo" : "Accesso non riuscito");
}

/**
 * Funzione per aggiungere utenti a una chat.
 * @param {string} chatId - L'ID della chat.
 * @param {Array} users - L'array degli ID degli utenti.
 */
export async function addUsersToChat(chatId, users) {
    console.log(chatId);
    const response = await fetch(`/chat/${chatId}/users`, {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({users}),
    });
    const data = await response.json();
    console.log(data.message);
}

/**
 * Funzione per recuperare tutti i partecipanti di una chat.
 * @param {string} chatId - L'ID della chat.
 */
export async function getChatParticipants(chatId) {
    const response = await fetch(`/chat/${chatId}/participants`);
    const data = await response.json();
    console.log(`Partecipanti della chat ${chatId}:`);
    console.log(data);
    return data;
}

/**
 * Funzione per accettare una richiesta di amicizia.
 * @param {string} username1 - Il primo nome utente.
 * @param {string} username2 - Il secondo nome utente.
 */
export async function acceptFriendship(username1, username2) {
    const response = await fetch("/friendship/accept", {
        method: "PUT", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username1, username2}),
    });
    const data = await response.json();
    console.log(data.message);
    return data;
}

/**
 * Funzione per recuperare tutte le richieste di amicizia non accettate.
 * @param {string} username - Il nome dell'utente.
 */
export async function getUnacceptedFriendships(username) {
    const response = await fetch(`/user/${username}/unaccepted-friendships`);
    const data = await response.json();
    console.log(`Richieste di amicizia non accettate per l'utente ${username}:`);
    console.log(data);
    return data;
}

/**
 * Funzione per rifiutare un'amicizia.
 * @param {string} username1 - Il primo nome utente.
 * @param {string} username2 - Il secondo nome utente.
 */
export async function rejectFriendship(username1, username2) {
    const response = await fetch("/friendship/reject", {
        method: "DELETE", headers: {"Content-Type": "application/json"}, body: JSON.stringify({username1, username2}),
    });
    const data = await response.json();
    console.log(data.message);
    return data;
}

/**
 * Function to get all chats owned by a user.
 * @param {string} username - The username of the user.
 */
export async function getUserOwnedChats(username) {
    const response = await fetch(`/user/${username}/owned-chats`);
    const data = await response.json();
    console.log(`Chats owned by the user ${username}:`);
    console.log(data);
    return data;
}

/**
 * Funzione per scaricare un file.
 * @param {string} room - Il nome della room.
 * @param {string} filename - Il nome del file.
 */
export async function downloadFile(room, filename) {
    const response = await fetch(`/download`, {
        method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({room, filename}),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    console.log(blob);
    saveAs(blob, filename.split("_")[1]);
}

/**
 * Funzione per recuperare i dettagli di un utente.
 * @param {string} username - Il nome dell'utente.
 */
export async function getUserDetails(username) {
    const response = await fetch(`/user/${username}/details`);
    const data = await response.json();
    console.log(`Dettagli dell'utente ${username}:`);
    console.log(data);
    return data;
}

/**
 * Funzione per recuperare tutti i messaggi di una chat che contengono dei file.
 * @param {string} chatId - L'ID della chat.
 */
export async function getChatFileMessages(chatId) {
    const response = await fetch(`/chat/${chatId}/file-messages`);
    const data = await response.json();
    console.log(`Messaggi della chat ${chatId} che contengono dei file:`);
    console.log(data);
    return data;
}

/**
 * Funzione per eliminare una chat.
 * @param {string} chatId - L'ID della chat.
 */
export async function deleteChatRoom(chatId) {
    try {
        const response = await fetch(`/chat/${chatId}`, {
            method: "DELETE"
        });
        const data = await response.json();
        console.log(data.message);
        return data;
    } catch (err) {
        console.error("Errore", err);
        return {message: "Errore"};
    }
}

/**
 * Funzione per modificare l'immagine del profilo di un utente.
 * @param {string} username - Il nome dell'utente.
 * @param {File} imageFile - Il nuovo file immagine del profilo.
 */
export async function updateUserProfileImage(username, imageFile) {
    const formData = new FormData();
    formData.append('images', imageFile);

    const response = await fetch(`/user/${username}/profile/image`, {
        method: 'PUT',
        body: formData
    });

    return await response.json();
}

/**
 * Funzione per modificare lo username di un utente.
 * @param {string} username - Il nome dell'utente.
 * @param {string} newUsername - Il nuovo username.
 */
export async function updateUsername(username, newUsername) {
    const response = await fetch(`/user/${username}/profile/username`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({newUsername})
    });

    return await response.json();
}

/**
 * Funzione per modificare la mail di un utente.
 * @param {string} username - Il nome dell'utente.
 * @param {string} newEmail - La nuova email.
 */
export async function updateUserEmail(username, newEmail) {
    const response = await fetch(`/user/${username}/profile/email`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({newEmail})
    });

    return await response.json();
}

/**
 * Funzione che crea una repository su github
 * @param {string} name - Il nome della repository
 * @param {string} description - La descrizione della repository
 * @param {boolean} priv - Determina se la repository sia pubblica o privata
 */
export const connectRepository = (name, description, priv) => {
    const repoSpecs = {
        name: name, descr: description, private: priv
    };

    fetch("/github/createRepo/" + room, {
        method: "POST", headers: {
            'content-type': "application/json"
        }, body: JSON.stringify({
            username: getChatOwner(room, chats), repoSpecs: repoSpecs
        })
    }).then((res) => {
        console.log(res.json());
        fetch("/github/sendInvites/" + room, {
            method: "POST", headers: {
                'content-type': "application/json"
            }, body: JSON.stringify({
                username: getChatOwner(room, chats), repo: repoSpecs.name
            })
        }).then((res) => {
            return res.json();
        })
    })
}

/**
 * Funzione che aggiunge tutti i partecipanti di una chat alla repository ad essa connessa
 * @param {*} room - L'ID della chat
 * @param {*} repoName - Il nome della repository
 */
export const sendInvites = (room, repoName) => {
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

/**
 * Funzione che controlla se una chat ha una repository associata
 * @param {string} IdChat - L'ID della chat
 * @returns - L'indirizzo della repository se è presente, false se non lo è
 */
export const checkRepo = (IdChat) => {
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

/**
 * Funzione che apre un codespace nella repository associata ad una chat
 * @param {string} idChat - L'ID della chat
 * @param {*} username - Lo username del proprietario della repository
 * @returns L'URL del codespace
 */
export const getCodespace = (idChat, username) => {
    return new Promise((resolve, reject) => {
        fetch("/github/codespace/" + idChat, {
            method: "POST", headers: {
                "content-type": "Application/json"
            }, body: JSON.stringify({
                username: username
            })
        }).then((res) => res.json())
            .then((res) => {
                console.log("res");
                console.log(res);
                if (Object.keys(res).includes("url")) {
                    resolve(res);
                } else {
                    reject("Something went wrong")
                }
            }).catch((error) => {
            reject(error);
        })
    })

}

/**
 * Funzione che controlla se un utente ha collegato il suo account a Github
 * @param {string} username - Lo username dell'utente
 * @returns boolean
 */
export const userHasGithub = (username) => {
    return new Promise((resolve, reject) => {
        fetch(`/user/${username}/hasGithub`, {
            method: "GET",
            headers: {
                'content-type': "Applicatio/json"
            }
        }).then((res) => res.json() ).then((res) => resolve(res))
    })
}