var crypto = require('crypto');

function Conversation(name, _system, users) {
    users = users || [];
    this.name = name;
    var system = system;
    var middlewares = [];
    var shared_key = "default_shared_key";

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
    }

    this.publish = function(data, sender) {
        var cipherdata = decrypt(data);
        users.forEach(function(user) {
            if (sender != user)
                user.send({message: cipherdata, conversation_id: name});
        })
    }
}