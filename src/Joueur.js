const { v4: uuidv4 } = require('uuid');

class Joueur
{
    constructor (name, socket) {
        this.socket = socket;
        this.room = null;
        this.name = name;
        this.divinite = 'no';
        this.ready = false;
        this.id = socket.id;
        this.pions = [
            {
                id: uuidv4(),
            },
            {
                id: uuidv4(),
            }
        ]
    }

    export () {
        return {
            name: this.name,
            id: this.id,
            divinite: this.divinite,
            ready: this.ready,
            pions: this.pions
        }
    }
}

module.exports = Joueur;