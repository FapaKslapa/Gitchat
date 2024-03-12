// Importa il modulo mysql
const mysql = require("mysql2");
const dbConfig = require("./asset/conf.json");
// Crea una connessione al database
const db = mysql.createConnection(dbConfig);
const http = require("http");
// Express
const express = require("express");
const app = express();
const server = http.createServer(app);
const port = 3000;
const bodyParser = require("body-parser");
const {Server} = require("socket.io");
const io = new Server(server);
let chats = [];
let temporaryMessages = {};
const uuidv4 = require('uuid').v4;
const fs = require('fs');

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

// Quando un utente si connette
io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("join room", (room) => {
        socket.join(room);
        saveMessagesToDatabase(room);
        console.log(`User joined room: ${room}`);
    });

    // Ascolta i messaggi di chat e li trasmette a tutti nella stessa room
    socket.on("chat message", (room, {username, message, timestamp}) => {
        let dateObject = new Date(timestamp);
        let date = dateObject.toLocaleDateString();
        let time = dateObject.toLocaleTimeString();
        io.to(room).emit("chat message", {IdAutore: username, Testo: message, Data_invio: date, Ora_invio: time}); // Trasmetti l'username e il messaggio
        // Aggiungi il messaggio all'array temporaneo
        if (!temporaryMessages[room]) {
            temporaryMessages[room] = [];
        }
        temporaryMessages[room].push({username, message, timestamp});
        console.log(chats);
    });

    socket.on("leaveRoom", (room, username) => {
        socket.leave(room);
        console.log(`User ${username} left room: ${room}`);
        saveMessagesToDatabase(room);
    });
    socket.on("disconnect", (data) => {
        console.log("user disconnected");
    });

    socket.on("message", (data) => {
    });
});

//SERVIZI
app.get("/chat/:id/messages", (req, res) => {
    const chatId = req.params.id;
    const sql = `SELECT *
                 FROM messaggio
                 WHERE IdChat = ?
                 ORDER BY Data_invio, Ora_invio `;
    db.query(sql, [chatId], (err, result) => {
        if (err) res.json({message: "Errore"});
        res.json(result);
    });
});

const saveMessagesToDatabase = (room) => {
    let messages = temporaryMessages[room];
    if (messages && messages.length > 0) {
        let messageId = 0;
        // Connect to the database and save the messages
        messages.forEach(({username, message, timestamp}) => {
            messageId = uuidv4();
            let dateObject = new Date(timestamp);
            let date = `${dateObject.getFullYear()}-${('0' + (dateObject.getMonth() + 1)).slice(-2)}-${('0' + dateObject.getDate()).slice(-2)}`;
            let time = dateObject.toLocaleTimeString();
            console.log(timestamp);
            console.log(date);
            const sqlMessage = `INSERT INTO messaggio (Id, Testo, Data_invio, Ora_invio, IdAutore, IdChat)
                                VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(sqlMessage, [messageId, message, date, time, username, room], (err, result) => {
                if (err) throw err;
            });
        });

        // Clear the temporary messages for this chat
        temporaryMessages[room] = [];
    }
}


app.get("/user/:username/chats", (req, res) => {
    const username = req.params.username;
    const sql = `SELECT *
                 FROM chat
                          JOIN partecipazione ON chat.Id = partecipazione.IdChat
                 WHERE partecipazione.IdAccount = ?`;
    db.query(sql, [username], (err, result) => {
        if (err) res.json({message: "Errore"});

        let chats = result;
        let completedQueries = 0;

        chats.forEach((chat, index) => {
            const sqlUsers = `SELECT account.Username, account.ImmagineProfilo
                              FROM account
                                       JOIN partecipazione ON account.Username = partecipazione.IdAccount
                              WHERE partecipazione.IdChat = ?`;
            db.query(sqlUsers, [chat.Id], (err, result) => {
                if (err) throw err;
                chats[index].users = result.map(user => {
                    // Leggi il file dell'immagine e convertilo in base64
                    let imagePath = `./images/${user.ImmagineProfilo}`;
                    let imageAsBase64 = fs.readFileSync(imagePath, {encoding: 'base64'});

                    return {
                        username: user.Username,
                        profileImage: imageAsBase64
                    };
                });
                completedQueries++;
                if (completedQueries === chats.length) {
                    res.json(chats);
                }
            });
        });
    });
});
app.get("/user/:username/friends", (req, res) => {
    const username = req.params.username;
    const sql = `SELECT IdAccount1 as username, account1.ImmagineProfilo as fotoProfilo
                 FROM amicizia
                          JOIN account as account1 ON amicizia.IdAccount1 = account1.Username
                 WHERE IdAccount2 = ?
                 UNION
                 SELECT IdAccount2 as username, account2.ImmagineProfilo as fotoProfilo
                 FROM amicizia
                          JOIN account as account2 ON amicizia.IdAccount2 = account2.Username
                 WHERE IdAccount1 = ?`;
    db.query(sql, [username, username], (err, result) => {
        if (err) throw err;

        // Converti le immagini in base64
        result.forEach((user, index) => {
            let imagePath = `./images/${user.fotoProfilo}`; // Modifica questo percorso con il percorso corretto delle tue immagini
            let imageAsBase64 = fs.readFileSync(imagePath, {encoding: 'base64'});
            result[index].fotoProfilo = imageAsBase64;
        });

        res.json(result);
    });
});
app.get("/chat/:id/participants", (req, res) => {
    const chatId = req.params.id;
    const sql = `SELECT account.Username, account.ImmagineProfilo
                 FROM account
                          JOIN partecipazione ON account.Username = partecipazione.IdAccount
                 WHERE partecipazione.IdChat = ?`;
    db.query(sql, [chatId], (err, result) => {
        if (err) res.json({message: "Errore"});

        // Converti le immagini in base64
        result.forEach((user, index) => {
            let imagePath = `./images/${user.ImmagineProfilo}`; // Modifica questo percorso con il percorso corretto delle tue immagini
            let imageAsBase64 = fs.readFileSync(imagePath, {encoding: 'base64'});
            result[index].ImmagineProfilo = imageAsBase64;
        });

        res.json(result);
    });
});

app.post("/user", (req, res) => {
    const {Username, Mail, Password, ImmagineProfilo, Token} = req.body;
    const sql = `INSERT INTO account (Username, Mail, Password, ImmagineProfilo, Token)
                 VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [Username, Mail, Password, ImmagineProfilo, Token], (err, result) => {
        if (err) throw err;
        res.json({message: "Utente creato con successo"});
    });
});


app.post("/chat", (req, res) => {
    const {users, nomeChat} = req.body;
    const DataCreazione = new Date();
    const chatId = uuidv4();
    const sqlChat = `INSERT INTO chat (Id, DataCreazione, NomeChat)
                     VALUES (?, ?, ?)`;
    db.query(sqlChat, [chatId, DataCreazione, nomeChat], (err, result) => {
        if (err) throw err;
        users.forEach((user) => {
            const sqlPartecipazione = `INSERT INTO partecipazione (IdChat, IdAccount)
                                       VALUES (?, ?)`;
            db.query(sqlPartecipazione, [chatId, user], (err, result) => {
                if (err) throw err;
            });
        });
        res.json({message: "Chat creata con successo"});
    });
});

// Aggiunta di persone a una chat esistente
app.post("/chat/:id/users", (req, res) => {
    const chatId = req.params.id;
    const {users} = req.body;

    // Elimina tutti i partecipanti dalla chat
    const sqlDelete = `DELETE
                       FROM partecipazione
                       WHERE IdChat = ?`;
    db.query(sqlDelete, [chatId], (err, result) => {
        if (err) throw err;

        // Aggiungi nuovi partecipanti alla chat
        users.forEach((user) => {
            const sqlInsert = `INSERT INTO partecipazione (IdChat, IdAccount)
                               VALUES (?, ?)`;
            db.query(sqlInsert, [chatId, user], (err, result) => {
                if (err) throw err;
            });
        });

        res.json({message: "Utenti aggiornati nella chat con successo"});
    });
});

app.post("/chat/:id/user", (req, res) => {
    const chatId = req.params.id;
    const {username} = req.body;

    const sqlInsert = `INSERT INTO partecipazione (IdChat, IdAccount)
                       VALUES (?, ?)`;
    db.query(sqlInsert, [chatId, username], (err, result) => {
        if (err) throw err;
        res.json({message: "Utente aggiunto alla chat con successo"});
    });
});

app.delete("/deleteChat/:id/user", (req, res) => {
    const chatId = req.params.id;
    const {username} = req.body;

    const sqlDelete = `DELETE
                       FROM partecipazione
                       WHERE IdChat = ?
                         AND IdAccount = ?`;
    db.query(sqlDelete, [chatId, username], (err, result) => {
        if (err) throw err;
        res.json({message: "Utente rimosso dalla chat con successo"});
    });
});

app.post("/message", (req, res) => {
    const {Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat} = req.body;
    const sql = `INSERT INTO messaggio (Id, Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const id = uuidv4();
    db.query(sql, [id, Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat], (err, result) => {
        if (err) throw err;
        res.json({message: "Messaggio creato con successo"});
    });
});

// Aggiungere un'amicizia
app.post("/friendship", (req, res) => {
    const {username1, username2} = req.body;
    // Check if both users exist
    if (username1 === username2) {
        return res.status(400).json({message: "The usernames cannot be the same"});
    }
    const checkUsersSql = `SELECT *
                           FROM account
                           WHERE Username IN (?, ?)`;
    db.query(checkUsersSql, [username1, username2], (err, result) => {
        if (err) throw err;

        if (result.length < 2) {
            return res.status(400).json({message: "One or both users do not exist"});
        }
        // Check if friendship already exists
        const checkFriendshipSql = `SELECT *
                                    FROM amicizia
                                    WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                       OR (IdAccount1 = ? AND IdAccount2 = ?)`;
        db.query(checkFriendshipSql, [username1, username2, username2, username1], (err, result) => {
            if (err) throw err;

            if (result.length > 0) {
                console.log("Entrato");
                return res.status(400).json({message: "Friendship already exists"});
            }
            // Insert friendship
            const sql = `INSERT INTO amicizia (IdAccount1, IdAccount2)
                         VALUES (?, ?)`;
            db.query(sql, [username1, username2], (err, result) => {
                if (err) throw err;
                res.json({message: "Amicizia aggiunta con successo"});
            });
        });
    });
});

// Modificare un messaggio
app.put("/message/:id", (req, res) => {
    const messageId = req.params.id;
    const {newText} = req.body;
    const sql = `UPDATE messaggio
                 SET Testo = ?
                 WHERE Id = ?`;
    db.query(sql, [newText, messageId], (err, result) => {
        if (err) throw err;
        res.json({message: "Messaggio modificato con successo"});
    });
});

// Eliminare un messaggio
app.delete("/message/:id", (req, res) => {
    const messageId = req.params.id;
    const sql = `DELETE
                 FROM messaggio
                 WHERE Id = ?`;
    db.query(sql, [messageId], (err, result) => {
        if (err) throw err;
        res.json({message: "Messaggio eliminato con successo"});
    });
});

// Login
app.post("/login", (req, res) => {
    const {username, password} = req.body;
    const sql = `SELECT *
                 FROM account
                 WHERE Username = ?
                   AND Password = ?`;
    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            res.json({login: true});
        } else {
            res.json({login: false});
        }
    });
});

app.post("/register", (req, res) => {
    const {mail, username, password} = req.body;

    // Check if all fields are provided
    if (!mail || !username || !password) {
        return res.status(400).json({message: "All fields must be provided"});
    }

    // Check if the username is unique
    const checkUsernameSql = `SELECT *
                              FROM account
                              WHERE Username = ?`;
    db.query(checkUsernameSql, [username], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            return res.status(400).json({message: "Username already in use"});
        }

        // Check if the email is unique
        const checkEmailSql = `SELECT *
                               FROM account
                               WHERE Mail = ?`;
        db.query(checkEmailSql, [mail], (err, result) => {
            if (err) throw err;

            if (result.length > 0) {
                return res.status(400).json({message: "Email already in use"});
            }

            // If the email is unique, proceed with the registration
            const sql = `INSERT INTO account (Mail, Username, Password)
                         VALUES (?, ?, ?)`;
            db.query(sql, [mail, username, password], (err, result) => {
                if (err) return res.status(500).json({message: "An error occurred during registration"});

                res.json({message: "Registration successful"});
            });
        });
    });
});