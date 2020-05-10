const RoomCollection = require('./src/RoomCollection');
const Joueur = require('./src/Joueur');
const NoRoomLeft = require('./src/errors/NoRoomLeft')

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = new RoomCollection;

io.on('connection', (socket) => {
    console.log('new guest');

    const joueur = new Joueur(socket);

    socket.emit('connected', socket.id);

    socket.on('register', data => {
        try {
            let room = null;
            const joueur = new Joueur(data.joueur, socket);
            
            if (rooms.has(data.roomName)) {
                room = rooms.get(data.roomName);
                console.log('room retrouvée : ', room);
            } else {
                room = rooms.add(data.roomName);
                console.log('room added : ', room);
            }
            
            socket.emit('enteredRoom', room.export());
            room.add(joueur);
    
            console.log('ajouté : ', joueur.name);

            socket.broadcast.to(data.roomName).emit('someoneEnteredRoom', {
                joueur: joueur.name
            });
        } catch (e) {
            console.log('la grosse erreur : ', e.message);
            if (e instanceof NoRoomLeft) {
                socket.emit('noRoom', e.message);
            }
        }
    });
});

io.on('disconnect', socket => {
    rooms.disconnect(socket);
});

http.listen(4949, () => {
    console.log('listening on *:4949');
});