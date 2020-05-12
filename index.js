const RoomCollection = require('./src/RoomCollection');
const Joueur = require('./src/Joueur');
const NoRoomLeft = require('./src/errors/NoRoomLeft')

const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const rooms = new RoomCollection;
const players = [];

const roomTransitEvents = [
    'construct', 'constructDome', 'endTurn', 'victory', 'endStep'
];

io.on('connection', (socket) => {
    console.log('new guest');

    socket.emit('connected', socket.id);

    socket.on('register', roomName => {
        try {
            let room = null;
            const joueur = new Joueur('unknown', socket);
            
            if (rooms.has(roomName)) {
                room = rooms.get(roomName);
                console.log('room retrouvée : ', room);
            } else {
                room = rooms.add(roomName);
                console.log('room added : ', room);
            }
            
            room.add(joueur);
            socket.joueur = joueur;
            joueur.room = room;
            socket.emit('enteredRoom', {
                room: room.export(),
                you: joueur.id
            });
    
            console.log('ajouté : ', joueur.name);

            socket.broadcast.to(roomName).emit('newPlayer', joueur.export());
        } catch (e) {
            console.log('la grosse erreur : ', e.message);
            if (e instanceof NoRoomLeft) {
                socket.emit('noRoom', e.message);
            }
        }
    });

    socket.on('ready', data => {
        socket.joueur.name = data.name;
        socket.joueur.divinite = data.divinite;
        socket.joueur.ready = !socket.joueur.ready;

        console.log('joueur précisé : ', data);

        // Tous prets
        if (socket.joueur.room.players.filter(p => p.ready).length == socket.joueur.room.players.length 
        && socket.joueur.room.players.length > 1) {
            io.to(socket.joueur.room.name).emit('letsgo', socket.joueur.room.export());
        } else {
            socket.broadcast.to(socket.joueur.room.name).emit('newPlayer', socket.joueur.export());
        }
    });

    socket.on('idlePion', data => {
        socket.broadcast.to(socket.joueur.room.name).emit('idlePion', {
            joueur: socket.joueur.id,
            data: data
        });
    });

    socket.on('pionMove', data => {
        socket.broadcast.to(socket.joueur.room.name).emit('pionMove', {
            joueur: socket.joueur.id,
            data: data
        });
    });

    roomTransitEvents.forEach(ev => {
        socket.on(ev, data => {
            socket.broadcast.to(socket.joueur.room.name).emit(ev, data);
        });
    });

    socket.on('disconnect', () => {
        socket.broadcast.to(socket.joueur.room.name).emit('disconnection', socket.joueur.export());
        rooms.disconnect(socket);
    });
});

http.listen(4949, () => {
    console.log('listening on *:4949');
});