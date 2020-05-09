const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = [];

io.on('connection', (socket) => {
    console.log('new guest');

    socket.emit('connected');

    socket.on('register', roomName => {
        socket.join(roomName);
        socket.emit('enteredRoom', roomName);
        socket.broadcast.to(roomName).emit('someoneEnteredRoom');
    });
});

io.on('disconnection', socket => {
    console.log(socket);
});

http.listen(4949, () => {
    console.log('listening on *:4949');
});