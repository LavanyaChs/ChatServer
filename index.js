const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const router = require('./router')
const bodyParser = require('body-parser');
// import mongoose from 'mongoose';
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users.js');
const app = express();

app.use(bodyParser.json({ limit: "30mb", extended: true }))
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }))


//const CONNECTION_URL = 'mongodb+srv://lavanyachs:<atlas0lavanyachs>@cluster0.c7gfo.mongodb.net/<dbname>?retryWrites=true&w=majority';
const PORT = process.env.PORT || 5000;
// mongoose.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => {
//         app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
//     })
//     .catch((error) => console.log(error.message))

const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*"
    }
});

app.use(cors())
app.use(router)
io.on('connection', (socket) => {
    console.log('We have a new connection!');
    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room })
        if (error) return callback(error);
        socket.emit('message', { user: 'Admin', text: `${user.name}, welcome to room ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'Admin', text: `${user.name}, has joined!` })
        socket.join(user.room);
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback();

    })
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback();
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} left the room ${user.room}` })

        }
    })
})


server.listen(PORT, () => console.log(`Server has started on port ${PORT}`))