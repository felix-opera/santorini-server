class Joueur
{
    constructor (name, socket) {
        this.socket = socket;
        this.room = null;
        this.name = name;
        this.divinite = null;
        this.ready = false;
        this.id = socket.id;
    }

    export () {
        return {
            name: this.name,
            id: this.id,
            divinite: this.divinite,
            ready: this.ready
        }
    }
}

module.exports = Joueur;