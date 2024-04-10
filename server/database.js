import {createRequire} from "module";
import fs from 'fs';
import path, {resolve} from "path";
import {response} from "express";

const require = createRequire(import.meta.url);
const {v4: uuidv4} = require("uuid");
const dbConfig = require("../asset/conf.json");
const mysql = require("mysql2");
// Crea una connessione al database
const db = mysql.createConnection(dbConfig);
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log("Connesso al database!");
});

export const saveMessagesToDatabase = (room, temporaryMessages) => {
    let messages = temporaryMessages[room];
    if (messages && messages.length > 0) {
        let messageId = 0;
        // Connect to the database and save the messages
        messages.forEach(({username, message, timestamp, FileName}) => {
            messageId = uuidv4(undefined, undefined, undefined);
            let [date, time] = timestamp.split(", ");
            let [day, month, year] = date.split("/");
            year = "20" + year; // Add the century to the year
            month = month - 1; // Subtract 1 from the month
            let dateObject = new Date(year, month, day, ...time.split(':'));
            let sqlDate = dateObject.toISOString().split('T')[0]; // Get the date part in 'YYYY-MM-DD' format
            let sqlTime = dateObject.toTimeString().split(' ')[0]; // Get the time part in 'HH:MM:SS' format
            console.log(sqlDate, sqlTime);
            const sqlMessage = FileName ? `INSERT INTO messaggio (Id, Testo, Data_invio, Ora_invio, IdAutore, IdChat, Path)
                                           VALUES (?, ?, ?, ?, ?, ?,
                                                   ?)` : `INSERT INTO messaggio (Id, Testo, Data_invio, Ora_invio, IdAutore, IdChat)
                                                          VALUES (?, ?, ?, ?, ?, ?)`;
            const params = FileName ? [messageId, message, sqlDate, sqlTime, username, room, FileName] : [messageId, message, sqlDate, sqlTime, username, room];
            db.query(sqlMessage, params, (err) => {
                if (err) throw err;
            });
        });

        // Clear the temporary messages for this chat
        temporaryMessages[room] = [];
    }
};


// messageService.js

export const getMessages = (db, chatId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM messaggio
                     WHERE IdChat = ?
                     ORDER BY Data_invio, Ora_invio `;
        db.query(sql, [chatId], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

export const formatMessages = (messages) => {
    return messages.map(message => {
        let dateFromDb = message.Data_invio;
        let date = new Date(dateFromDb);
        date.setDate(date.getDate() + 1);
        message.Data_invio = date.toISOString();
        return message;
    });
};

export const getFriendsFromDatabase = (db, username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT IdAccount1 as username, account1.ImmagineProfilo as fotoProfilo
                     FROM amicizia
                              JOIN account as account1 ON amicizia.IdAccount1 = account1.Username
                     WHERE IdAccount2 = ?
                       AND stato = true
                     UNION
                     SELECT IdAccount2 as username, account2.ImmagineProfilo as fotoProfilo
                     FROM amicizia
                              JOIN account as account2 ON amicizia.IdAccount2 = account2.Username
                     WHERE IdAccount1 = ?
                       AND stato = true`;
        db.query(sql, [username, username], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

export const convertImagesToBase64 = (result) => {
    result.forEach((user, index) => {
        let imagePath = `./images/${user.fotoProfilo}`;
        result[index].fotoProfilo = fs.readFileSync(imagePath, {encoding: 'base64'});
    });
    return result;
};

export const getChats = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM chat
                              JOIN partecipazione ON chat.Id = partecipazione.IdChat
                     WHERE partecipazione.IdAccount = ?`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

export const getChatUsers = (chatId) => {
    return new Promise((resolve, reject) => {
        const sqlUsers = `SELECT account.Username, account.ImmagineProfilo
                          FROM account
                                   JOIN partecipazione ON account.Username = partecipazione.IdAccount
                          WHERE partecipazione.IdChat = ?`;
        db.query(sqlUsers, [chatId], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.map(user => {
                    let imagePath = `./images/${user.ImmagineProfilo}`;
                    let imageAsBase64 = fs.readFileSync(imagePath, {encoding: 'base64'});
                    return {
                        username: user.Username, profileImage: imageAsBase64
                    };
                }));
            }
        });
    });
};

export const getChatParticipants = (chatId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT account.Username, account.ImmagineProfilo, account.UsernameGithub
                     FROM account
                              JOIN partecipazione ON account.Username = partecipazione.IdAccount
                     WHERE partecipazione.IdChat = ?`;
        db.query(sql, [chatId], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.map(user => {
                    let imagePath = `./images/${user.ImmagineProfilo}`;
                    let imageAsBase64 = fs.readFileSync(imagePath, {encoding: 'base64'});
                    if (user.UsernameGithub == null) {
                        return {
                            username: user.Username, profileImage: imageAsBase64
                        };
                    } else {
                        return {
                            username: user.Username, profileImage: imageAsBase64, usernameGithub: user.UsernameGithub
                        };
                    }
                }));
            }
        });
    });
};


export const createChat = (nomeChat, proprietario) => {
    return new Promise((resolve, reject) => {
        const DataCreazione = new Date();
        const chatId = uuidv4(undefined, undefined, undefined);
        const sqlChat = `INSERT INTO chat (Id, DataCreazione, NomeChat, Proprietario)
                         VALUES (?, ?, ?, ?)`;
        db.query(sqlChat, [chatId, DataCreazione, nomeChat, proprietario], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({chatId, message: "Chat creata con successo"});
            }
        });
    });
};

export const addParticipantsToChat = (chatId, users) => {
    return new Promise((resolve, reject) => {
        let completedQueries = 0;
        users.forEach((user) => {
            const sqlPartecipazione = `INSERT INTO partecipazione (IdChat, IdAccount)
                                       VALUES (?, ?)`;
            db.query(sqlPartecipazione, [chatId, user], (err) => {
                if (err) {
                    reject(err);
                } else {
                    completedQueries++;
                    if (completedQueries === users.length) {
                        resolve({message: "Utenti aggiunti alla chat con successo"});
                    }
                }
            });
        });
    });
};


export const deleteChatParticipants = (chatId) => {
    return new Promise((resolve, reject) => {
        const sqlDelete = `DELETE
                           FROM partecipazione
                           WHERE IdChat = ?`;
        db.query(sqlDelete, [chatId], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({message: "Participants removed from chat successfully"});
            }
        });
    });
};

export const addChatParticipants = (chatId, users) => {
    return new Promise((resolve, reject) => {
        let completedQueries = 0;
        users.forEach((user) => {
            const sqlInsert = `INSERT INTO partecipazione (IdChat, IdAccount)
                               VALUES (?, ?)`;
            db.query(sqlInsert, [chatId, user], (err) => {
                if (err) {
                    reject(err);
                } else {
                    completedQueries++;
                    if (completedQueries === users.length) {
                        resolve({message: "Users added to chat successfully"});
                    }
                }
            });
        });
    });
};

export const deleteChatParticipant = (chatId, username) => {
    return new Promise((resolve, reject) => {
        const sqlDelete = `DELETE
                           FROM partecipazione
                           WHERE IdChat = ?
                             AND IdAccount = ?`;
        db.query(sqlDelete, [chatId, username], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({message: "Utente rimosso dalla chat con successo"});
            }
        });
    });
};

export const createMessage = (Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO messaggio (Id, Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const id = uuidv4(undefined, undefined, undefined);
        db.query(sql, [id, Path, Testo, Data_invio, Ora_invio, IdAutore, IdChat], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({message: "Messaggio creato con successo"});
            }
        });
    });
};

export const addFriendship = (username1, username2) => {
    return new Promise((resolve, reject) => {
        // Check if both users exist
        if (username1 === username2) {
            reject({message: "The usernames cannot be the same"});
        }
        const checkUsersSql = `SELECT *
                               FROM account
                               WHERE Username IN (?, ?)`;
        db.query(checkUsersSql, [username1, username2], (err, result) => {
            if (err) {
                reject(err);
            }
            if (result.length < 2) {
                reject({message: "One or both users do not exist"});
            }
            // Check if friendship already exists
            const checkFriendshipSql = `SELECT *
                                        FROM amicizia
                                        WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                           OR (IdAccount1 = ? AND IdAccount2 = ?)`;
            db.query(checkFriendshipSql, [username1, username2, username2, username1], (err, result) => {
                if (err) {
                    reject(err);
                }
                if (result.length > 0) {
                    reject({message: "Friendship already exists"});
                }
                // Insert friendship
                const sql = `INSERT INTO amicizia (IdAccount1, IdAccount2)
                             VALUES (?, ?)`;
                db.query(sql, [username1, username2], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({message: "Amicizia aggiunta con successo"});
                    }
                });
            });
        });
    });
};

export const updateMessage = (messageId, newText) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE messaggio
                     SET Testo = ?
                     WHERE Id = ?`;
        db.query(sql, [newText, messageId], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({message: "Messaggio modificato con successo"});
            }
        });
    });
};

export const deleteMessage = (messageId) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE
                     FROM messaggio
                     WHERE Id = ?`;
        db.query(sql, [messageId], (err) => {
            if (err) {
                reject(err);
            } else {
                resolve({message: "Messaggio eliminato con successo"});
            }
        });
    });
};

export const loginUser = (username, password) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM account
                     WHERE Username = ?
                       AND Password = ?`;
        db.query(sql, [username, password], (err, result) => {
            if (err) {
                reject(err);
            } else {
                if (result.length > 0) {
                    resolve({login: true});
                } else {
                    resolve({login: false});
                }
            }
        });
    });
};

export const loginUserGithub = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT Username
                     FROM account
                     WHERE UsernameGithub = ?`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length === 0) {
                reject({message: "User not found"});
            } else {
                resolve(result);
            }
        });
    });
}

export const registerUser = (mail, username, password) => {
    return new Promise((resolve, reject) => {
        // Check if all fields are provided
        if (!mail || !username || !password) {
            reject({message: "All fields must be provided"});
        }

        // Check if the username is unique
        const checkUsernameSql = `SELECT *
                                  FROM account
                                  WHERE Username = ?`;
        db.query(checkUsernameSql, [username], (err, result) => {
            if (err) {
                reject(err);
            }

            if (result.length > 0) {
                reject({message: "Username already in use"});
            }

            // Check if the email is unique
            const checkEmailSql = `SELECT *
                                   FROM account
                                   WHERE Mail = ?`;
            db.query(checkEmailSql, [mail], (err, result) => {
                if (err) {
                    reject(err);
                }

                if (result.length > 0) {
                    reject({message: "Email already in use"});
                }

                // If the email is unique, proceed with the registration
                const sql = `INSERT INTO account (Mail, Username, Password)
                             VALUES (?, ?, ?)`;
                db.query(sql, [mail, username, password], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({message: "Registration successful"});
                    }
                });
            });
        });
    });
};

export const registerUserGithub = (username, password) => {
    return new Promise((resolve, reject) => {
        // Check if all fields are provided
        if (!username || !password) {
            reject({message: "All fields must be provided"});
        }

        // Check if the username is unique
        const checkUsernameSql = `SELECT *
                                  FROM account
                                  WHERE Username = ?`;
        db.query(checkUsernameSql, [username], (err, result) => {
            if (err) {
                reject(err);
            }

            if (result.length > 0) {
                reject({message: "Username already in use"});
            }

            // If the email is unique, proceed with the registration
            const sql = `INSERT INTO account (Username, Password)
                         VALUES (?, ?)`;
            db.query(sql, [mail, username, password], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({message: "Registration successful"});
                }
            });
        });
    })
}

export const getUnacceptedFriendships = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT account1.Username as username, account1.ImmagineProfilo as fotoProfilo
                     FROM amicizia
                              JOIN account as account1 ON amicizia.IdAccount1 = account1.Username
                     WHERE IdAccount2 = ?
                       AND Stato = 0`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            } else {
                // Convert images to base64
                result.forEach((user, index) => {
                    let imagePath = `./images/${user.fotoProfilo}`; // Modify this path with the correct path of your images
                    result[index].fotoProfilo = fs.readFileSync(imagePath, {encoding: 'base64'});
                });
                resolve(result);
            }
        });
    });
};

export const acceptFriendship = (username1, username2) => {
    return new Promise((resolve, reject) => {
        // Check if both users exist
        if (username1 === username2) {
            reject({message: "The usernames cannot be the same"});
        }

        const checkUsersSql = `SELECT *
                               FROM account
                               WHERE Username IN (?, ?)`;
        db.query(checkUsersSql, [username1, username2], (err, result) => {
            if (err) {
                reject(err);
            }

            if (result.length < 2) {
                reject({message: "One or both users do not exist"});
            }

            // Check if friendship already exists
            const checkFriendshipSql = `SELECT *
                                        FROM amicizia
                                        WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                           OR (IdAccount1 = ? AND IdAccount2 = ?)`;
            db.query(checkFriendshipSql, [username1, username2, username2, username1], (err, result) => {
                if (err) {
                    reject(err);
                }

                if (result.length === 0) {
                    reject({message: "Friendship does not exist"});
                }

                // If the friendship exists, accept it
                const sql = `UPDATE amicizia
                             SET Stato = 1
                             WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                OR (IdAccount1 = ? AND IdAccount2 = ?)`;
                db.query(sql, [username1, username2, username2, username1], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({message: "Friendship accepted"});
                    }
                });
            });
        });
    });
};


export const rejectFriendship = (username1, username2) => {
    return new Promise((resolve, reject) => {
        // Check if both users exist
        if (username1 === username2) {
            reject({message: "The usernames cannot be the same"});
        }

        const checkUsersSql = `SELECT *
                               FROM account
                               WHERE Username IN (?, ?)`;
        db.query(checkUsersSql, [username1, username2], (err, result) => {
            if (err) {
                reject(err);
            }

            if (result.length < 2) {
                reject({message: "One or both users do not exist"});
            }

            // Check if friendship already exists
            const checkFriendshipSql = `SELECT *
                                        FROM amicizia
                                        WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                           OR (IdAccount1 = ? AND IdAccount2 = ?)`;
            db.query(checkFriendshipSql, [username1, username2, username2, username1], (err, result) => {
                if (err) {
                    reject(err);
                }

                if (result.length === 0) {
                    reject({message: "Friendship does not exist"});
                }

                // If the friendship exists, reject it (delete the row)
                const sql = `DELETE
                             FROM amicizia
                             WHERE (IdAccount1 = ? AND IdAccount2 = ?)
                                OR (IdAccount1 = ? AND IdAccount2 = ?)`;
                db.query(sql, [username1, username2, username2, username1], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({message: "Friendship rejected"});
                    }
                });
            });
        });
    });
};

export const getOwnedChats = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM chat
                     WHERE Proprietario = ?`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};


export const downloadFile = (room, filename) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join('uploads', room, filename);

        // Extract the file extension
        const extension = path.extname(filename);

        // Extract the part of the file name after the underscore
        const namePart = filename.split('_')[1];

        // Create a new unique file name
        const newFilename = `${namePart}${extension}`;

        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve({data, newFilename});
            }
        });
    });
};
export const getUserDetails = (username) => {
    console.log(username);
    return new Promise((resolve, reject) => {
        const sql = `SELECT Username, ImmagineProfilo, UsernameGithub, Mail, Password
                     FROM account
                     WHERE Username = ?`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            }

            if (result.length === 0) {
                reject({message: "User does not exist"});
            }

            let user = result[0];
            console.log(result);
            let imagePath = `./images/${user.ImmagineProfilo}`;
            user.ImmagineProfilo = fs.readFileSync(imagePath, {encoding: 'base64'});

            const sqlFriends = `SELECT COUNT(*) as numFriends
                                FROM amicizia
                                WHERE (IdAccount1 = ? OR IdAccount2 = ?)
                                  AND Stato = 1`;
            db.query(sqlFriends, [username, username], (err, result) => {
                if (err) {
                    reject(err);
                }

                user.numFriends = result[0].numFriends;
                resolve(user);
            });
        });
    });
};

export const getChatFileMessages = (chatId) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT *
                     FROM messaggio
                     WHERE IdChat = ?
                       AND Path IS NOT NULL`;
        db.query(sql, [chatId], (err, dbMessages) => {
            if (err) {
                reject(err);
            } else {
                // Map the database messages to the new format
                dbMessages = dbMessages.map(message => ({
                    autore: message.IdAutore,
                    path: message.Path,
                    dataInvio: message.Data_invio,
                    oraInvio: message.Ora_invio
                }));
                resolve(dbMessages);
            }
        });
    });
};

export const addGitUsernameToUser = (username, usernameGit) => {
    return new Promise((resolve, reject) => {
        const getSql = `SELECT Username
                        FROM account_github
                        WHERE Username = ?`;
        db.query(getSql, [usernameGit], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length > 0) {
                reject({message: "Username already in use"});
            } else {
                const getSql2 = `SELECT UsernameGithub
                                 FROM account
                                 WHERE UsernameGithub = ?`;
                db.query(getSql2, [usernameGit], (err, result) => {
                    if (err) {
                        reject(err);
                    } else if (result.length > 0) {
                        reject({message: "Username already in use"});
                    } else {
                        const setSql = `INSERT INTO account_github(Username)
                                        VALUES (?)`;
                        db.query(setSql, [usernameGit], (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                const setSql2 = `UPDATE account
                                                 SET UsernameGithub = ?
                                                 WHERE Username = ?`;
                                db.query(setSql2, [usernameGit, username], (err) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({message: "Username added succesfully"});
                                    }
                                })
                            }
                        })
                    }
                })
            }
        })
    })
}

export const addTokenToUser = (username, token) => {
    return new Promise((resolve, reject) => {
        const getSql = `SELECT Token
                        FROM account_github
                        WHERE Token = ?`;
        db.query(getSql, [token], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length > 0) {
                reject({message: "Token already inserted"})
            }

            const insertSql = `UPDATE account_github
                               SET Token = ?
                               WHERE Username = ?`;
            db.query(insertSql, [token, username], (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({message: "Token inserted successfully"})
                }
            });
        })

    });
}

export const getUserToken = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT account_github.Token
                     FROM account
                              JOIN account_github ON account.UsernameGithub = account_github.Username
                     WHERE account.Username = ?
                        OR account.UsernameGithub = ?`;
        db.query(sql, [username, username], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length === 0) {
                reject({message: "User not found"});
            } else {
                resolve(result);
            }
        });
    });
};

export const getGithubUsername = (username) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT account_github.Username
                     FROM account
                              JOIN account_github ON account.UsernameGithub = account_github.Username
                     WHERE account.Username = ?`;
        db.query(sql, [username], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length == 0) {
                reject({message: "User not found"});
            } else {
                resolve(result[0].Username);
            }
        })
    })
}

//{ url: url, id: idChat, name, name}
export const insertRepo = (repoSpecs, url, idChat) => {
    return new Promise((resolve, reject) => {
        const getSql = `SELECT Url, IdChat
                        FROM repository
                        WHERE Nome = ?`;
        db.query(getSql, [repoSpecs.name], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length > 0) {
                reject({message: "Repository already present"});
            } else {
                const setSql = `INSERT INTO repository (Url, IdChat, Nome)
                                VALUES (?, ?, ?)`;
                db.query(setSql, [url, idChat, repoSpecs.name], (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({message: "Repo inserted successfully"});
                    }
                })
            }
        })
    })
}

export const getRepo = (repoName) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT Url
                     FROM repository
                     WHERE Name = ?`;
        db.query(sql, [repoName], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length == 0) {
                reject({message: "Repo not found"});
            } else {
                resolve(result[0].url);
            }
        })
    })
}

export const getRepoByChatId = (IdChat) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT Url, Nome
                     FROM repository
                     WHERE IdChat = ?`;
        db.query(sql, [IdChat], (err, result) => {
            if (err) {
                reject(err);
            } else if (result.length == 0) {
                reject({message: "Repo not found"});
            } else {
                console.log(result)
                resolve(result[0]);
            }
        })
    })
}

export const deleteChat = (chatId) => {
    return new Promise((resolve, reject) => {
        // Start the transaction
        db.beginTransaction((err) => {
            if (err) {
                reject(err);
            }

            // Delete the chat from the `chat` table
            const sqlDeleteChat = `DELETE
                                   FROM chat
                                   WHERE Id = ?`;
            db.query(sqlDeleteChat, [chatId], (err) => {
                if (err) {
                    db.rollback(() => {
                        reject(err);
                    });
                } else {
                    // Delete the participants of the chat from the `partecipazione` table
                    const sqlDeleteParticipants = `DELETE
                                                   FROM partecipazione
                                                   WHERE IdChat = ?`;
                    db.query(sqlDeleteParticipants, [chatId], (err) => {
                        if (err) {
                            db.rollback(() => {
                                reject(err);
                            });
                        } else {
                            // Delete the messages of the chat from the `messaggio` table
                            const sqlDeleteMessages = `DELETE
                                                       FROM messaggio
                                                       WHERE IdChat = ?`;
                            db.query(sqlDeleteMessages, [chatId], (err) => {
                                if (err) {
                                    db.rollback(() => {
                                        reject(err);
                                    });
                                } else {
                                    // Delete the repository connected to the chat from the `repository` table
                                    const sqlDeleteRepository = `DELETE
                                                                 FROM repository
                                                                 WHERE IdChat = ?`;
                                    db.query(sqlDeleteRepository, [chatId], (err) => {
                                        if (err) {
                                            db.rollback(() => {
                                                reject(err);
                                            });
                                        } else {
                                            db.commit((err) => {
                                                if (err) {
                                                    db.rollback(() => {
                                                        reject(err);
                                                    });
                                                } else {
                                                    resolve({message: "Chat deleted successfully"});
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    });
};