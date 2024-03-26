import {createRequire} from "module";
import path from "path";
import {saveMessagesToDatabase} from "./database.js";
import {v4 as uuidv4} from "uuid";
import fs from "fs";

const require = createRequire(import.meta.url);
const mkdirp = require('mkdirp');

export const socketFunction = {
    onJoinRoom: async (socket, temporaryMessages) => (room) => {
        socket.join(room);
        saveMessagesToDatabase(room, temporaryMessages);
        console.log(`User joined room: ${room}`);
    },

    onChatMessage: async (socket, io, temporaryMessages) => (room, {username, message, timestamp}) => {
        let [date, time] = timestamp.split(", ");
        let [day, month, year] = date.split("/");
        year = "20" + year; // Add the century to the year
        let dateObject = new Date(`${year}-${month}-${day}T${time}`);
        let isoString = dateObject.toISOString();
        console.log(isoString, time);
        io.to(room).emit("chat message", {
            IdAutore: username, Testo: message, Data_invio: isoString, Ora_invio: time, Path: null
        }); // Trasmetti l'username e il messaggio
        // Aggiungi il messaggio all'array temporaneo
        if (!temporaryMessages[room]) {
            temporaryMessages[room] = [];
        }
        temporaryMessages[room].push({username, message, timestamp, FileName: null});
    },

    onFile: (socket, io, temporaryMessages) => (room, {username, message, timestamp, file, fileName}) => {
        const roomDir = path.join('uploads', room);
        mkdirp.sync(roomDir); // Ensure the directory exists
        const uniqueName = `${uuidv4(undefined, undefined, undefined)}_${fileName}`;
        const filePath = path.join(roomDir, uniqueName);
        console.log(`File object: ${JSON.stringify(file)}`); // Log the file object
        fs.writeFile(filePath, Buffer.from(file), (err) => {
            if (err) {
                console.log(`Error writing file: ${err}`); // Log any errors
            }
            console.log('file salvato');
        });

        const [date, time] = timestamp.split(", ");
        let [day, month, year] = date.split("/");
        year = "20" + year; // Add the century to the year
        let dateObject = new Date(`${year}-${month}-${day}T${time}`);
        let isoString = dateObject.toISOString();
        io.to(room).emit("chat message", {
            IdAutore: username, Testo: message, Data_invio: isoString, Ora_invio: time, Path: uniqueName
        }); // Trasmetti l'username e il messaggio
        if (!temporaryMessages[room]) {
            temporaryMessages[room] = [];
        }
        temporaryMessages[room].push({username, message, FileName: uniqueName, timestamp});
    }, onLeaveRoom: (socket, temporaryMessages) => (room, username) => {
        socket.leave(room);
        saveMessagesToDatabase(room, temporaryMessages);
    }, onDisconnect: () => () => {
        console.log("user disconnected");
    }, onMessage: () => () => {
    }
}