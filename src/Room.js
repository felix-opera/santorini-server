const NoRoomLeft = require('./errors/NoRoomLeft')

class Room 
{
    constructor(name) {
        this.name = name;
        this.players = [];
        this.places = 2;
        this.launched = false;
    }

    export() {
        return {
            name: this.name,
            joueurs: this.players.map(p => p.export())
        };
    }

    add(joueur) {
        if (this.placeLeft == 0) {
            throw new NoRoomLeft("Plus de place dans la room " + this.name);
        }

        joueur.socket.join(this.name);
        this.players.push(joueur);
    }

    disconnect(joueur) {
        joueur.socket.leave(this.name);
        this.players = this.players.filter(p => p.id !== joueur.id);
        console.log(joueur.name + ' a quitté la room : ' + this.name);
    }

    get placeLeft () {
        return this.places - this.players.length;
    }
}

module.exports = Room;