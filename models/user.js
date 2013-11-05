//region PRIVATE STATIC MEMBERS
    var last_id = 0;
//endregion

function User(socket, system) {
    var self = this;

    //region PRIVATE MEMBERS
        var network_driver;
    //endregion

    this.id = User.generateId();

    //region PUBLIC MEMBERS
        this.send = function(data) {
            socket.emit('message', data);
        }
    //endregion

    socket.on('message', function(data) {
        var conversation_id = data.conversation_id;
        system.getConversation(conversation_id).publish(data.message, self);
    })
}

//region STATIC METHODS
    User.generateId = function() {
        return "user_" + last_id++ ;
    }
//endregion

exports = User;