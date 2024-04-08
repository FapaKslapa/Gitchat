// Importa il modulo mysql
import {createRequire} from "module";
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
    createMessage, deleteChat,
    deleteChatParticipant,
    deleteChatParticipants, deleteMessage,
    downloadFile,
    formatMessages,
    getChatFileMessages,
    getChatParticipants,
    getChats,
    getChatUsers,
    getFriendsFromDatabase,
    getMessages,
    getOwnedChats,
    getUnacceptedFriendships,
    getUserDetails,
    getUserToken,
    loginUser,
    loginUserGithub,
    registerUser,
    registerUserGithub,
    rejectFriendship,
    updateMessage
} from "./server/database.js";
import {createRepo, getFiles, sendInvite, acceptInviteToRepo} from "./server/github.js";
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);

const mysql = require("mysql2");
const dbConfig = require("./asset/conf.json");
const gitConfig = require("./asset/githubConf.json")
// Crea una connessione al database
const db = mysql.createConnection(dbConfig);
const http = require("http");
require('path');
// Express
const express = require("express");
const app = express();
const server = http.createServer(app);
const port = 3000;
const bodyParser = require("body-parser");
const {Server} = require("socket.io");
const io = new Server(server);
let temporaryMessages = {};

// Configura Express per utilizzare body-parser come middleware.
app.use(bodyParser.json()); // supporta i corpi delle richieste json
app.use(bodyParser.urlencoded({extended: true})); // supporta i corpi delle richieste urlencoded
app.use(express.static("public"));

server.listen(port, () => {
    console.log("listening on *:3000");
});

// Connettiti al database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("Connesso al database!");
});


io.on("connection", async (socket) => {
    console.log("a user connected");
    socket.on("join room", await socketFunction.onJoinRoom(socket, temporaryMessages));
    socket.on("chat message", await socketFunction.onChatMessage(socket, io, temporaryMessages));
    socket.on("file", socketFunction.onFile(socket, io, temporaryMessages));
    socket.on("leaveRoom", socketFunction.onLeaveRoom(socket, temporaryMessages));
    socket.on("disconnect", socketFunction.onDisconnect());
    socket.on("message", socketFunction.onMessage());
});
//SERVIZI

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
app.get("/chat/:id/participants", async (req, res) => {
    try {
        const chatId = req.params.id;
        let participants = await getChatParticipants(chatId);
        res.json(participants);
    } catch (err) {
        res.json({message: "Errore"});
    }
});


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
app.post("/chat/:id/user", (req, res) => {
    const chatId = req.params.id;
    const {username} = req.body;

    const sqlInsert = `INSERT INTO partecipazione (IdChat, IdAccount)
                       VALUES (?, ?)`;
    db.query(sqlInsert, [chatId, username], (err) => {
        if (err) throw err;
        res.json({message: "Utente aggiunto alla chat con successo"});
    });
});


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

app.post("/message", async (req, res) => {
    try {
        const {Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat} = req.body;
        const result = await createMessage(Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
// Aggiungere un'amicizia
app.post("/friendship", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await addFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});
// Modificare un messaggio

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
// Eliminare un messaggio
app.delete("/message/:id", async (req, res) => {
    try {
        const messageId = req.params.id;
        const result = await deleteMessage(messageId);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
// Login
app.post("/login", async (req, res) => {
    try {
        const {username, password} = req.body;
        const result = await loginUser(username, password);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});
app.post("/register", async (req, res) => {
    try {
        const {mail, username, password} = req.body;
        const result = await registerUser(mail, username, password);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

app.get("/user/:username/unaccepted-friendships", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getUnacceptedFriendships(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

app.put("/friendship/accept", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await acceptFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

app.delete("/friendship/reject", async (req, res) => {
    try {
        const {username1, username2} = req.body;
        const result = await rejectFriendship(username1, username2);
        res.json(result);
    } catch (err) {
        res.status(400).json(err);
    }
});

app.get("/user/:username/owned-chats", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getOwnedChats(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});


app.post('/download', async (req, res) => {
    try {
        const room = req.body.room;
        const filename = req.body.filename;
        const result = await downloadFile(room, filename);
        res.setHeader('Content-disposition', 'attachment; filename=' + result.newFilename);
        res.setHeader('Content-type', 'application/octet-stream');
        res.send(result.data);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: "Could not download the file. " + err,
        });
    }
});

app.get("/user/:username/details", async (req, res) => {
    try {
        const username = req.params.username;
        const result = await getUserDetails(username);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});


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
            message: "Could not get the file messages. " + err,
        });
    }
});

app.delete("/chat/:id", async (req, res) => {
    try {
        const chatId = req.params.id;
        const result = await deleteChat(chatId);
        res.json(result);
    } catch (err) {
        res.json({message: "Errore"});
    }
});

app.get('/github/login', (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = 'http://localhost:3000/github/callback';
    const scope = 'repo';
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=login`;
    res.json({url: url});
});

app.get('/github/register', (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = 'http://localhost:3000/github/callback';
    const scope = 'repo';
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=register`;
    res.json({url: url});
})

app.get('/github/connect/:username', (req, res) => {
    const client_id = gitConfig.client_id;
    const redirect_uri = 'http://localhost:3000/github/callback';
    const scope = 'repo';
    const state = req.params.username;
    const url = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}`;
    res.json({url: url});
});

app.get('/github/callback', async (req, res) => {
    const code = req.query.code;
    const client_id = gitConfig.client_id;
    const client_secret = gitConfig.client_secret;
    const redirect_uri = 'http://localhost:3000/github/callback';
    const state = req.query.state;

    // Scambia il codice di autorizzazione con un token di accesso
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            client_id,
            client_secret,
            code,
            redirect_uri,
        }),
    });

    const data = await response.text();
    const params = new URLSearchParams(data);
    const access_token = params.get('access_token');

    // Utilizza il token di accesso per fare richieste autenticate all'API di GitHub
    const userResponse = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `token ${access_token}`,
        },
    });

    const userData = await userResponse.json();
    //console.log(userData);
    // Adesso hai accesso ai dati dell'utente e puoi salvarli nel database
    // ...
    console.log("state: " + state)
    if (state === "login") {
        try {
            let username = await loginUserGithub(userData.login);
            username = username[0].Username;
            addTokenToUser(userData.login, access_token).then(() => {
                res.redirect(`http://localhost:3000/index.html?login=${username}`);
            }).catch((err) => {
                res.redirect(`http://localhost:3000/index.html?login=${username}&token=false`);
            });
        } catch (err) {
            console.log(err)
            res.redirect(`http://localhost:3000/accedi.html?login=failed`);
        }
    } else if (state === "register") {
        await registerUserGithub(userData.login, access_token);
        res.redirect(`http://localhost:3000/register.html?action=register&username=${userData.login}`);
    } else {
        addGitUsernameToUser(state, userData.login).then((msg) => {
            console.log(msg);
            addTokenToUser(state, access_token).then((msg) => {
                console.log(msg);
                res.redirect('http://localhost:3000/index.html');
            }).catch((err) => {
                console.log(err);
                res.redirect('http://localhost:3000/index.html?username=failed');
            })
        }).catch((err) => {
            console.log(err);
            res.redirect('http://localhost:3000/index.html?token=failed');
        })


    }
    // Reindirizza l'utente alla tua applicazione
    //res.json({url: 'http://localhost:3000/index.html'});
});

app.post('/github/createRepo', async (req, res) => {
    const username = req.body.username;
    const repoSpecs = req.body.repoSpecs;
    const token1 = await getUserToken(username);
    const token = token1[0].Token;
    await createRepo(token, repoSpecs);
});

app.get('/github/content', async (req, res) => {
    const token1 = await getUserToken("Mael");
    const token = token1[0].Token;
    getFiles(token, "maelGhezzi", "node");
})

app.post('/github/sendInvite', async (req, res) => {
    const username = req.body.username;
    const repo = req.body.repo;
    const username2 = req.body.username2;
    const token1 = await getUserToken(username);
    const token = token1[0].Token;
    sendInvite(token, "maelGhezzi", repo, username2);
})

app.post('/github/acceptInvite', async (req, res) => {
    const username = req.body.username;
    const token1 = await getUserToken(username);
    const token = token1[0].Token;
    acceptInviteToRepo(token, 250182506);
})