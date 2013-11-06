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
        this.publish = function(data) {
            socket.emit('message', data);
        }
    //endregion

    socket.emit('name_change', {name: this.id})

    socket.on('message', function(data) {
        var conversation_id = data.conversation_id;
        var conversation = system.getConversation(conversation_id) || system.createConversation(conversation_id);
        if (conversation.count() == 0) conversation.addUser(self);
        conversation.publish(data.message, self);
    })

    socket.on('invite', function(data) {
        var conversation_id = data.conversation_id;
        var user_id = data.user_id;
        var conversation = system.getConversation(conversation_id);
        if (conversation && conversation.contains(self)) {
            conversation.addUser(user_id);
        }else {
            throw "insufficient privileges";
        }
    })
}

//region STATIC METHODS
    User.generateId = function() {
        return "user_" + last_id++ ;
    }
//endregion

module.exports = User;