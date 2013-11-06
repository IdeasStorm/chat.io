var crypto = require('crypto');

function Conversation(name, _system, users) {
    users = users || [];
    this.id = name;
    var system = _system;
    var middlewares = [];
    var shared_key = "default_shared_key";

    this.publish = function(data, sender) {
        console.log('publishing ' + data);
        //var cipherdata = decrypt(data);
        users.forEach(function(user) {
            user.publish({message: data, conversation_id: name});
        })
    }

    this.addUser = function(user) {
        if (typeof user != 'string')
            users.push(user);
        else
            users.push(system.getUser(user));
    }

    this.contains = function(user) {
        return users.indexOf(user) > -1
    }

    this.count = function() {
        return users.length;
    }
}

module.exports = Conversation;

/*

this.use = function (middleware) {
    if (typeof middleware != 'function') throw new Error("middlewares must be functions");
    middleware.check && middleware.check();
    middlewares.push(middleware);
}

this.process = function(data) {
    var index = 0;
    function callback(ndata) {
        if (++index > middlewares.length - 1) return ndata;
        return middlewares[index].send({data: ndata, conversation: this}, callback);
    }
    return middlewares[0]({data: data, conversation: this}, callback);
}

function encrypt(data) {
    var cipher = crypto.createCipher('AES-256-CBC', shared_key);
    cipher.update(JSON.stringify(data));
    return cipher.final('base64');
}

function decrypt(ciphertext) {
    var decipher = crypto.createCipher('AES-256-CBC', shared_key);
    decipher.update(ciphertext, 'base64');
    return JSON.parse(decipher.final());
}*/
