// Importa il modulo mysql
import {createRequire} from "module";
import bcrypt from 'bcrypt';
import {socketFunction} from "./server/socket.js";
import {
    acceptFriendship,
    addChatParticipants,
    addFriendship,
    addGitUsernameToUser,
    addParticipantsToChat,
    addTokenToUser,
    convertImagesToBase64,
    createChat,
    createMessage,
    deleteChat,
    deleteChatParticipant,
    deleteChatParticipants,
    deleteMessage,
    downloadFile,
    formatMessages,
    getChatFileMessages,
    getChatParticipants,
    getChats,
    getChatUsers,
    getCodespaceFromDb,
    getFriendsFromDatabase,
    getGithubUsername,
    getMessages,
    getOwnedChats,
    getRepoByChatId,
    getUnacceptedFriendships, getUser,
    getUserDetails,
    getUserToken,
    insertCodespace,
    insertRepo,
    loginUser,
    loginUserGithub,
    registerUser,
    registerUserGithub,
    rejectFriendship,
    removeCodespace,
    updateMessage
} from "./server/database.js";
import {
    acceptInviteToRepo, createCodespace, createRepo, getCodespace, getFiles, getRepoParticipants, sendInvite
} from "./server/github.js";
import fetch from "node-fetch";
import multer from 'multer';
import {get} from "https";

const require = createRequire(import.meta.url);

const mysql = require("mysql2");
const dbConfig = require("./asset/conf.json");
const gitConfig = require("./asset/githubConf.json");
// Crea una connessione al database
const db = mysql.createConnection(dbConfig);
const http = require("http");
require("path");

// Express
const express = require("express");
const app = express();
const server = http.createServer(app);
const port = 3000;
const bodyParser = require("body-parser");
const {Server} = require("socket.io");
const io = new Server(server);
let temporaryMessages = {};
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images');
    }, filename: function (req, file, cb) {
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.originalname}`;
        cb(null, filename);
    }
});

const upload = multer({storage: storage});
// Configura Express per utilizzare body-parser come middleware.
app.use(bodyParser.json()); // supporta i corpi delle richieste json
app.use(bodyParser.urlencoded({extended: true})); // supporta i corpi delle richieste urlencoded
app.use(express.static("public"));

server.listen(port, () => {
    console.log("listening on *:3000");
});

// Connettiti al database
db.connect(err => {
    if (err) {
        throw err;
    }
    console.log("Connesso al database!");
});

io.on("connection", async socket => {
    console.log("a user connected");
    socket.on("join room", await socketFunction.onJoinRoom(socket, temporaryMessages));
    socket.on("chat message", await socketFunction.onChatMessage(socket, io, temporaryMessages));
    socket.on("file", socketFunction.onFile(socket, io, temporaryMessages));
    socket.on("leaveRoom", socketFunction.onLeaveRoom(socket, temporaryMessages));
    socket.on("disconnect", socketFunction.onDisconnect());
    socket.on("message", socketFunction.onMessage());
});
//SERVIZI

/**
 * Endpoint per ottenere i messaggi di una chat.
 *
 * @param {string} req.params.id - L'ID della chat da cui ottenere i messaggi.
 *
 * @returns {Object} Un oggetto JSON che contiene i messaggi della chat o un messaggio di errore.
 */
app.get("/chat/:id/messages", async (req, res) => {
    try {
        const chatId = req.params.id;
        const messages = await getMessages(db, chatId);
        const formattedMessages = formatMessages(messages);
        res.json(formattedMessages);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per ottenere le chat di un utente.
 *
 * @param {string} req.params.username - Il nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene le chat dell'utente o un messaggio di errore.
 */
app.get("/user/:username/chats", async (req, res) => {
    try {
        const username = req.params.username;
        let chats = await getChats(username);

        if (chats.length === 0) {
            return res.json([]);
        }
        let completedQueries = 0;
        for (const chat of chats) {
            const index = chats.indexOf(chat);
            chats[index].users = await getChatUsers(chat.Id);
            completedQueries++;
            if (completedQueries === chats.length) {
                res.json(chats);
            }
        }
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per ottenere gli amici di un utente.
 *
 * @param {string} req.params.username - Il nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene gli amici dell'utente o un messaggio di errore.
 */
app.get("/user/:username/friends", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getFriendsFromDatabase(db, username);
        const finalResult = convertImagesToBase64(result);
        res.json(finalResult);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per ottenere i partecipanti di una chat.
 *
 * @param {string} req.params.id - L'ID della chat da cui ottenere i partecipanti.
 *
 * @returns {Object} Un oggetto JSON che contiene i partecipanti della chat o un messaggio di errore.
 */
app.get("/chat/:id/participants", async (req, res) => {
    try {
        const chatId = req.params.id;
        let participants = await getChatParticipants(chatId);
        res.json(participants);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per aggiungere utenti a una chat esistente.
 *
 * @param {string} req.params.id - L'ID della chat a cui aggiungere gli utenti.
 * @param {Array<string>} req.body.users - Un array di nomi utente da aggiungere alla chat.
 *
 * @returns {Object} Un oggetto JSON che contiene il risultato dell'operazione o un messaggio di errore.
 */
app.post("/chat", async (req, res) => {
    try {
        const {users, nomeChat, proprietario} = req.body;
        const {chatId} = await createChat(nomeChat, proprietario);
        users.push(proprietario);
        const result = await addParticipantsToChat(chatId, users);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
// Aggiunta di persone a una chat esistente
app.post("/chat/:id/users", async (req, res) => {
    try {
        const chatId = req.params.id;
        const {users} = req.body;
        await deleteChatParticipants(chatId);
        const result = await addChatParticipants(chatId, users);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per aggiungere un utente a una chat.
 *
 * @param {string} req.params.id - L'ID della chat a cui aggiungere l'utente.
 * @param {string} req.body.username - Il nome dell'utente da aggiungere alla chat.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.post("/chat/:id/user", (req, res) => {
    const chatId = req.params.id;
    const {username} = req.body;

    const sqlInsert = `INSERT INTO partecipazione (IdChat, IdAccount)
                       VALUES (?, ?)`;
    db.query(sqlInsert, [chatId, username], err => {
        if (err) throw err;
        res.json({message: "Utente aggiunto alla chat con successo"});
    });
});

/**
 * Endpoint per eliminare un utente da una chat.
 *
 * @param {string} req.params.id - L'ID della chat da cui eliminare l'utente.
 * @param {string} req.body.username - Il nome dell'utente da eliminare dalla chat.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.delete("/deleteChat/:id/user", async (req, res) => {
    try {
        const chatId = req.params.id;
        const {username} = req.body;
        const result = await deleteChatParticipant(chatId, username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per creare un nuovo messaggio.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.Path - Il percorso del file del messaggio (se presente).
 * @param {string} req.body.Testo - Il testo del messaggio.
 * @param {string} req.body.Data_invio - La data di invio del messaggio.
 * @param {string} req.body.Ora_invio - L'ora di invio del messaggio.
 * @param {string} req.body.IdAutore - L'ID dell'autore del messaggio.
 * @param {string} req.body.IdChat - L'ID della chat in cui viene inviato il messaggio.
 *
 * @returns {Object} Un oggetto JSON che contiene il risultato dell'operazione o un messaggio di errore.
 */
app.post("/message", async (req, res) => {
    try {
        const {Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat} = req.body;
        const result = await createMessage(Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per aggiungere un'amicizia.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.username1 - Il nome dell'utente che invia la richiesta di amicizia.
 * @param {string} req.body.username2 - Il nome dell'utente che riceve la richiesta di amicizia.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.post("/friendship", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await addFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});
/**
 * Endpoint per aggiornare il testo di un messaggio.
 *
 * @param {string} req.params.id - L'ID del messaggio da aggiornare.
 * @param {string} req.body.newText - Il nuovo testo del messaggio.
 *
 * @returns {Object} Un oggetto JSON che contiene il risultato dell'operazione o un messaggio di errore.
 */
app.put("/message/:id", async (req, res) => {
    try {
        const messageId = req.params.id;
        const {newText} = req.body;
        const result = await updateMessage(messageId, newText);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per eliminare un messaggio.
 *
 * @param {string} req.params.id - L'ID del messaggio da eliminare.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */app.delete("/message/:id", async (req, res) => {
    try {
        const messageId = req.params.id;
        const result = await deleteMessage(messageId);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per effettuare il login di un utente.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.username - Il nome dell'utente.
 * @param {string} req.body.password - La password dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene i dati dell'utente se il login è riuscito, o un messaggio di errore.
 */
app.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body;
        const user = await getUser(username); // Funzione per ottenere l'utente dal database
        console.log("FATTO");
        if (!user) {
            return res.status(400).json({message: "Utente non trovato"});
        }

        const validPassword = await bcrypt.compare(password, user.Password);
        if (!validPassword) {
            console.log(false);
            return res.status(400).json({message: "Password non valida"});
        }
        console.log(true);
        res.json({login: true});
    } catch (err) {
        res.json({message: "Errore"});
    }
});
/**
 * Endpoint per registrare un nuovo utente.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.mail - L'email dell'utente.
 * @param {string} req.body.username - Il nome dell'utente.
 * @param {string} req.body.password - La password dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.post("/register", async (req, res) => {
    try {
        const {mail, username, password} = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await registerUser(mail, username, hashedPassword); // Funzione per registrare l'utente nel database

        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});
/**
 * Endpoint per ottenere le richieste di amicizia non accettate di un utente.
 *
 * @param {string} username - Il nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene le richieste di amicizia non accettate dell'utente o un messaggio di errore.
 */
app.get("/user/:username/unaccepted-friendships", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getUnacceptedFriendships(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per accettare una richiesta di amicizia.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.username1 - Il nome dell'utente che ha inviato la richiesta di amicizia.
 * @param {string} req.body.username2 - Il nome dell'utente che ha ricevuto la richiesta di amicizia.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.put("/friendship/accept", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await acceptFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

/**
 * Endpoint per rifiutare una richiesta di amicizia.
 *
 * @param {Object} req.body - Il corpo della richiesta.
 * @param {string} req.body.username1 - Il nome dell'utente che ha inviato la richiesta di amicizia.
 * @param {string} req.body.username2 - Il nome dell'utente che ha ricevuto la richiesta di amicizia.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.delete("/friendship/reject", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await rejectFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

/**
 * Endpoint per ottenere le chat di cui un utente è proprietario.
 *
 * @param {string} username - Il nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene le chat di cui l'utente è proprietario o un messaggio di errore.
 */
app.get("/user/:username/owned-chats", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getOwnedChats(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per scaricare un file.
 *
 * @param {Object} req.body.room - La stanza da cui scaricare il file.
 * @param {string} req.body.filename - Il nome del file da scaricare.
 *
 * @returns {Object} Un oggetto JSON che contiene i dati del file scaricato o un messaggio di errore.
 */
app.post("/download", async (req, res) => {
    try {
        const room = req.body.room;
        const filename = req.body.filename;
        const result = await downloadFile(room, filename);
        res.setHeader("Content-disposition", "attachment; filename=" + result.newFilename);
        res.setHeader("Content-type", "application/octet-stream");
        res.send(result.data);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: "Could not download the file. " + err
        });
    }
});

/**
 * Endpoint per ottenere i dettagli di un utente.
 *
 * @param {string} username - Il nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene i dettagli dell'utente o un messaggio di errore.
 */
app.get("/user/:username/details", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getUserDetails(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Endpoint per ottenere i messaggi di file di una chat.
 *
 * @param {string} id - L'ID della chat.
 *
 * @returns {Object} Un oggetto JSON che contiene i messaggi di file della chat o un messaggio di errore.
 */
app.get("/chat/:id/file-messages", async (req, res) => {
    try {
        const chatId = req.params.id;
        const dbMessages = await getChatFileMessages(chatId);

        // Check temporaryMessages for messages that contain files
        let tempMessages = temporaryMessages[chatId] || [];
        tempMessages = tempMessages.filter(message => message.FileName !== null);

        // Map the temporaryMessages to the new format
        tempMessages = tempMessages.map(message => ({
            autore: message.username,
            path: message.FileName,
            dataInvio: message.timestamp.split(", ")[0],
            oraInvio: message.timestamp.split(", ")[1]
        }));

        // Merge the database messages and temporaryMessages
        const allMessages = [...dbMessages, ...tempMessages];

        res.json(allMessages);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: "Could not get the file messages. " + err
        });
    }
});

/**
 * Endpoint per eliminare una chat.
 *
 * @param {string} id - L'ID della chat da eliminare.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.delete("/chat/:id", async (req, res) => {
    try {
        const chatId = req.params.id;
        const result = await deleteChat(chatId);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

/**
 * Servizio che manda il link a cui autenticarsi su Github
 */
app.get("/github/login", (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = "http://localhost:3000/github/callback";
    const scope = "repo%20codespace";
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=login`;
    res.json({url: url});
});

app.get("/github/register", (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = "http://localhost:3000/github/callback";
    const scope = "repo%20codespace";
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=register`;
    res.json({url: url});
});

/**
 * Servizio che manda il link a cui autenticarsi su Github per connettere l'account
 * @param {string} username - Lo username dell'utente da connettere
 */
app.get("/github/connect/:username", (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = "http://localhost:3000/github/callback";
    const scope = "repo%20codespace";
    const state = req.params.username;
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
    res.json({url: url});
});

/**
 * Il servizio che gestisce il ritorno dall'autenticazione su Github salvando il token dell'utente autenticato
 */
app.get("/github/callback", async (req, res) => {
    const code = req.query.code;
    const client_id = gitConfig.client_id;
    const client_secret = gitConfig.client_secret;
    const redirect_uri = "http://localhost:3000/github/callback";
    const state = req.query.state;

    // Scambia il codice di autorizzazione con un token di accesso
    const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST", headers: {
            "Content-Type": "application/json"
        }, body: JSON.stringify({
            client_id, client_secret, code, redirect_uri
        })
    });

    const data = await response.text();
    const params = new URLSearchParams(data);
    const access_token = params.get("access_token");

    // Utilizza il token di accesso per fare richieste autenticate all'API di GitHub
    const userResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `token ${access_token}`
        }
    });

    const userData = await userResponse.json();
    // Adesso hai accesso ai dati dell'utente e puoi salvarli nel database
    if (state === "login") {
        try {
            let username = await loginUserGithub(userData.login);
            username = username[0].Username;
            console.log(username);
            addTokenToUser(userData.login, access_token)
                .then(() => {
                    res.redirect(`http://localhost:3000/index.html?login=${username}`);
                })
                .catch(err => {
                    res.redirect(`http://localhost:3000/index.html?login=${username}&token=false`);
                });
        } catch (err) {
            console.log("Errore");
            console.log(err);
            res.redirect(`http://localhost:3000/accedi.html?login=failed`);
        }
    } else if (state === "register") {
        await registerUserGithub(userData.login, access_token);
        res.redirect(`http://localhost:3000/register.html?action=register&username=${userData.login}`);
    } else {
        addGitUsernameToUser(state, userData.login)
            .then(msg => {
                console.log(msg);
                addTokenToUser(state, access_token)
                    .then(msg => {
                        console.log(msg);
                        res.redirect("http://localhost:3000/index.html");
                    })
                    .catch(err => {
                        console.log(err);
                        res.redirect("http://localhost:3000/index.html?username=failed");
                    });
            })
            .catch(err => {
                console.log(err);
                res.redirect("http://localhost:3000/index.html?token=failed");
            });
    }
    // Reindirizza l'utente alla tua applicazione
    //res.json({url: 'http://localhost:3000/index.html'});
});

/**
 * Il servizio che crea una repository su GH e ne salva i riferimenti sul DB
 * @param {string} id - L'ID della chat interessata
 * @param {string} username - Lo username del proprietario della repository
 * @param {Object} repoSpecs - I parametri per la creazione della repository
 */
app.post("/github/createRepo/:id", async (req, res) => {
    try {
        const username = req.body.username;
        const repoSpecs = req.body.repoSpecs;
        const idChat = req.params.id;
        const token1 = await getUserToken(username);
        const token = token1[0].Token;
        const ghRes = await createRepo(token, repoSpecs);
        const dbRes = await insertRepo(repoSpecs, ghRes.fullname, idChat);
        res.json({message: "Repo created Succesfully"});
    } catch (error) {
        res.json({message: "Something went wrong"});
    }
});

/**
 *
 */
app.get("/github/content", async (req, res) => {
    try {
        const token1 = await getUserToken("Mael");
        const token = token1[0].Token;
        await getFiles(token, "maelGhezzi", "node");
        res.json({message: "Content loaded succesfully"});
    } catch (error) {
        console.log(error);
        res.json({message: "Something went wrong"});
    }
});

/**
 * Servizio che aggiunge tutti i membri di una chat alla repository (se presente) ad essa associata
 * @param {string} id - L'ID della chat interessata
 * @param {string} username - Lo username del proprietario della repository
 * @param {string} repoName - Il nome della repository
 */
app.post("/github/sendInvites/:id", async (req, res) => {
    const username = req.body.username;
    const repo = req.body.repo;
    try {
        const users = await getChatParticipants(req.params.id);
        const githubUsername = await getGithubUsername(username);
        const authUsers = [];
        users.forEach(element => {
            if (Object.keys(element).includes("usernameGithub") && element.usernameGithub !== githubUsername) {
                authUsers.push(element.usernameGithub);
            }
        });
        const token1 = await getUserToken(username);
        const token = token1[0].Token;
        const partecicipants = await getRepoParticipants(token, githubUsername, repo);
        const requests = [];
        console.log("parte1");
        for (let i = 0; i < authUsers.length; i++) {
            if (!partecicipants.includes(authUsers[i])) {
                const githubResponse = await sendInvite(token, githubUsername, repo, authUsers[i]);
                requests.push(githubResponse.data.id);
            }
        }
        console.log("arriva1");
        console.log("parte2");
        for (let i = 0; i < authUsers.length; i++) {
            const tokenAccept1 = await getUserToken(authUsers[i]);
            const tokenAccept = tokenAccept1[0].Token;
            const githubResponse = await acceptInviteToRepo(tokenAccept, requests[i]);
            console.log(githubResponse);
        }
        console.log("arrvia2");
        res.json({message: "All invites sent successfully"});
    } catch (error) {
        console.log(error);
        res.json({message: "Something went wrong"});
    }
});

/**
 * Servizio che apre un codespace nella repository di una chat
 * @param {string} id - L'ID della chat interessata
 * @param {string} username - Lo username del proprietario della repository
 */
app.post("/github/codespace/:id", async (req, res) => {
    const username = req.body.username;
    const idChat = req.params.id;
    try {
        const usernameGithub = await getGithubUsername(username);
        const dbResp = await getRepoByChatId(idChat);
        const repoUrl = dbResp.Url;
        const repoName = dbResp.Nome;
        console.log("repourl: " + repoUrl);
        console.log("reponame: " + repoName);
        const token1 = await getUserToken(username);
        const token = token1[0].Token;
        const codespaceUrl = await getCodespaceFromDb(repoUrl, idChat);
        console.log(codespaceUrl);
        console.log("ghresp get");
        const codespaces = await getCodespace(token, usernameGithub, repoName);
        if (codespaces.data.total_count !== 0) {
            if (Object.keys(codespaceUrl).includes("codespace")) {
                res.json({url: codespaceUrl.codespace});
            } else {
                res.json({message: "Something went wrong"});
            }
        } else {
            await removeCodespace(repoUrl, idChat);
            const ghResp = await createCodespace(token, usernameGithub, repoName);
            console.log("ghResp");
            console.log(ghResp.data.web_url);
            if (ghResp.status == 201) {
                console.log("dbres");
                console.log(await insertCodespace(ghResp.data.web_url, repoUrl));
                res.json({message: "Codespace created succesfully", url: ghResp.data.web_url});
            }
        }
    } catch (error) {
        console.log(error);
        res.json({message: "Something went wrong"});
    }
});

/**
 * Servizio che controlla se una chat ha una repository associata
 * @param {string} id - L'ID della chat interessata
 */
app.get("/chat/:id/hasRepo", async (req, res) => {
    const idChat = req.params.id;
    let repoUrl, repoName;
    try {
        const resp = await getRepoByChatId(idChat);
        repoUrl = resp.Url;
        repoName = resp.Nome;
        res.json({result: true, url: repoUrl});
    } catch (error) {
        res.json({result: false})
    }
});

/**
 * Servizio che controlla se un utente ha un account di github associato
 * @param {string} username - Lo username dell'utente interessato
 */
app.get("/user/:username/hasGithub", async (req, res) => {
    const username = req.params.username;
    try {
        const result = await getGithubUsername(username);
        res.json({result: true});
    } catch (error) {
        res.json({result: false});
    }
})

/**
 * Endpoint per aggiornare l'immagine del profilo di un utente.
 *
 * @param {string} username - Il nome dell'utente.
 * @param {Object} images - L'immagine del profilo dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.put('/user/:username/profile/image', upload.single('images'), async (req, res) => {
    try {
        const username = req.params.username;
        const profileImageName = req.file.filename;
        const sql = `UPDATE account
                     SET ImmagineProfilo = ?
                     WHERE Username = ?`;
        await db.promise().query(sql, [profileImageName, username]);
        res.json({message: 'Profile image updated successfully'});
    } catch (err) {
        res.status(500).json({message: 'An error occurred', error: err});
    }
});

/**
 * Endpoint per aggiornare lo username di un utente.
 *
 * @param {string} username - Il nome attuale dell'utente.
 * @param {string} newUsername - Il nuovo nome dell'utente.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.put('/user/:username/profile/username', async (req, res) => {
    try {
        const username = req.params.username;
        const newUsername = req.body.newUsername;
        console.log(newUsername);
        console.log(username);
        const sql = `UPDATE account
                     SET Username = ?
                     WHERE Username = ?`;
        await db.promise().query(sql, [newUsername, username]);
        const updateAmiciziaIdAccount1Sql = `
            UPDATE amicizia
            SET IdAccount1 = ?
            WHERE IdAccount1 = ?;
        `;
        await db.promise().query(updateAmiciziaIdAccount1Sql, [newUsername, username]);
        console.log("Fine Amicizia 1");
        const updateAmiciziaIdAccount2Sql = `
            UPDATE amicizia
            SET IdAccount2 = ?
            WHERE IdAccount2 = ?;
        `;
        await db.promise().query(updateAmiciziaIdAccount2Sql, [newUsername, username]);
        console.log("Fine Amicizia 2");
        const updateChatSql = `
            UPDATE chat
            SET Proprietario = ?
            WHERE Proprietario = ?;
        `;
        await db.promise().query(updateChatSql, [newUsername, username]);
        console.log("Fine Chat");
        const updateMessaggioSql = `
            UPDATE messaggio
            SET IdAutore = ?
            WHERE IdAutore = ?;
        `;
        await db.promise().query(updateMessaggioSql, [newUsername, username]);
        console.log("Fine Messaggio");

        const updatePartecipazioneSql = `
            UPDATE partecipazione
            SET IdAccount = ?
            WHERE IdAccount = ?;
        `;
        await db.promise().query(updatePartecipazioneSql, [newUsername, username]);
        console.log("Fine Partecipazione");
        console.log("fine")
        res.json({message: 'Username updated successfully'});
    } catch (err) {
        res.status(500).json({message: 'An error occurred', error: err});
    }
});

/**
 * Endpoint per aggiornare l'email di un utente.
 *
 * @param {string} username - Il nome dell'utente.
 * @param {string} newEmail - La nuova email.
 *
 * @returns {Object} Un oggetto JSON che contiene un messaggio di successo o di errore.
 */
app.put('/user/:username/profile/email', async (req, res) => {
    try {
        const username = req.params.username;
        const newEmail = req.body.newEmail;
        const sql = `UPDATE account
                     SET Mail = ?
                     WHERE Username = ?`;
        await db.promise().query(sql, [newEmail, username]);
        res.json({message: 'Email updated successfully'});
    } catch (err) {
        res.status(500).json({message: 'An error occurred', error: err});
    }
});