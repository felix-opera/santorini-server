const Room = require("./Room");

class RoomCollection
{
    constructor() {
        this.rooms = [];
    }

    add (name) {
        const room = new Room(name);
        this.rooms.push(room);
        return room;
    }

    get (name) {
        return this.rooms.find(r => r.name == name);
    }

    has (name) {
        return !!this.get(name);
    }

    disconnect (socket) {
        this.rooms.forEach(room => {
            room.players.forEach(p => {
                if (p.socket.id == socket.id) {
                    room.disconnect(p);
                }
            });
        });

        return null;
    }

    export () {
        return this.rooms.map(r => r.export());
    }
}

module.exports = RoomCollection;