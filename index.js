const RoomCollection = require('./src/RoomCollection');
const Joueur = require('./src/Joueur');
const NoRoomLeft = require('./src/errors/NoRoomLeft')

const fs = require('fs');
const app = require('express')();
// const http = require('https').createServer({
//     key: fs.readFileSync('./key.pem'),
//     cert: fs.readFileSync('./cert.pem'),
//     passphrase: 'felix'
// }, app);

const http = require("http").createServer(app);
const io = require('socket.io')(http);

const rooms = new RoomCollection;
const players = [];

const roomTransitEvents = [
    'construire', 'construireDome', 'endTurn', 'victory', 'endStep', 'replay',
    'pionSwitch'
];

io.on('connection', (socket) => {
    console.log('new guest', socket.id);

    socket.emit('connected', {
        id: socket.id,
        rooms: rooms.export()
    });

    socket.on('connection', roomName => {
        try {
            roomName = roomName.toLowerCase().replace(/ /g, '').replace(/-+/g, '-');
            console.log('recherche de : ', roomName);
            let room = null;
            const joueur = new Joueur('unknown', socket);
            
            if (rooms.has(roomName)) {
                room = rooms.get(roomName);
            } else {
                room = rooms.add(roomName);
            }
            
            room.add(joueur);
            socket.joueur = joueur;
            joueur.room = room;
            socket.emit('enteredRoom', {
                room: room.export(),
                you: joueur.id
            });

            io.emit('rooms', rooms.export());

            socket.broadcast.to(roomName).emit('playerInfo_RX', joueur.export());
        } catch (e) {
            if (e instanceof NoRoomLeft) {
                socket.emit('noRoom', e.message);
            }
        }
    });

    socket.on('playerInfo_TX', data => {
        socket.joueur.name = data.name;
        socket.joueur.divinite = data.divinite;
        socket.joueur.ready = data.ready;

        console.log('joueur précisé : ', data);

        // Tous prets
        if (socket.joueur.room.players.filter(p => p.ready).length == socket.joueur.room.players.length 
        && socket.joueur.room.players.length > 1 && socket.joueur.room.launched === false) {
            socket.joueur.room.launched = true;
            io.to(socket.joueur.room.name).emit('letsgo', socket.joueur.room.export());
        } else {
            console.log('broadcast to ', socket.joueur.room.name);
            socket.broadcast.to(socket.joueur.room.name).emit('playerInfo_RX', socket.joueur.export());
        }
    });

    socket.on('idlePion', data => {
        socket.broadcast.to(socket.joueur.room.name).emit('idlePion', {
            joueur: socket.joueur.id,
            data: data
        });
    });

    socket.on('deplacerPion', data => {
        socket.broadcast.to(socket.joueur.room.name).emit('deplacerPion', {
            joueur: socket.joueur.id,
            data: data
        });
    });

    socket.on('pionMoveForce', data => {
        socket.broadcast.to(socket.joueur.room.name).emit('deplacerPion', {
            joueur: socket.joueur.id,
            data: data
        });
    });

    roomTransitEvents.forEach(ev => {
        socket.on(ev, data => {
            console.log('transmitting : ', ev, data);
            socket.broadcast.to(socket.joueur.room.name).emit(ev, data);
        });
    });

    socket.on('disconnection', () => {
        disconnection(socket);
    });

    socket.on('disconnect', () => {
        disconnection(socket);
    });
});

function disconnection(socket) {
    if (!socket.joueur) {
        return;
    }
    io.emit('rooms', rooms.export());
    socket.joueur.room.launched = false;
    socket.broadcast.to(socket.joueur.room.name).emit('disconnection', socket.joueur.export());
    rooms.disconnect(socket);
    console.log('a quitté la room : ' + socket.joueur.room.name, socket.joueur.name);
}

http.listen(4949, () => {
    console.log('listening on *:4949');
});