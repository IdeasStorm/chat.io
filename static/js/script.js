/* Author: YOUR NAME HERE
 */

function Conversation(id, password) {
    this.id = id;
    this.password = password;
    this.messages = [];
}

var KeySotre = (function() {

    setCert = function(username, cert) {
        localStorage.setItem(username+'Cert', cert);
    };

    return {
        getCert: function(username, callback) {
            var cert = localStorage.getItem(username+'Cert');
            if (cert == null) {
                socket.emit('cert_request', {username: username});
                socket.on('cert_response', function(data) {
                    if (username == data.username) {
                        setCert(username, data.cert);
                        callback(data.cert);
                    }
                });
            } else {
                callback(cert);
            }
        },

        setPrivateKey: function(privateKeyPem) {
            localStorage.setItem('privateKey', privateKeyPem);
        },

        setPublicKey: function(publicKeyPem) {
            localStorage.setItem('publicKey', publicKeyPem);
        },

        setPublicKey: function(username, publicKeyPem) {
            localStorage.setItem(username+'Pk', publicKeyPem);
        },

        getPrivateKey: function() {
            var privateKeyPem = localStorage.getItem('privateKey');
            if (privateKeyPem == null) {
                Encryption.generateKeypair();
                return localStorage.getItem('privateKey');
            }
            else {
                return privateKeyPem
            }
        },

        getPublicKey: function() {
            var publicKeyPem = localStorage.getItem('publicKey');
            if (publicKeyPem == null) {
                Encryption.generateKeypair();
                return localStorage.getItem('publicKey');
            }
            else {
                return publicKeyPem;
            }
        },

        getPublicKey: function(username) {
            //TODO to Syrwan
            //   if localStorage.getItem(username+'Pk') == null
            //      get publicKey from Cert
            return localStorage.getItem(username+'Pk');
        }

    }
});

var Encryption = (function() {

    var pki = forge.pki;
    var keypair = null;
    var publicKeyPem = null;
    var privateKeyPem = null;

    return {
        generateKeypair: function() {
            var publicKey = KeySotre.getPublicKey();
            var privateKey = KeyStore.getPrivateKey();
            if (publicKey == null || privateKey == null) {
                // get rsa
                var rsa = pki.rsa;
                // generate an RSA key pair
                keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});
                // Get Pem of public/private key
                publicKeyPem = pki.publicKeyToPem(keypair.publicKey);
                privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
                // Store pem in local storage
                KeySotre.setPublicKey(publicKeyPem);
                KeySotre.setPrivateKey(privateKeyPem);
            }
        },

        encrypt: function(message) {
            var publicKeyPem = KeySotre.getPublicKey();
            var publicKey = pki.publicKeyFromPem(publicKeyPem);
            return publicKey.encrypt(message);
        },

        decrypt: function(encrypted) {
            var privateKeyPem = KeySotre.getPrivateKey();
            var privateKey = pki.privateKeyFromPem(privateKeyPem);
            return privateKey.decrypt(encrypted);
        }
    }
});

$(document).ready(function () {

    var ExampleViewModel = function () {
        var self = this;
        var socket = io.connect('http://localhost');

        var _conversations = []; //cached index
        socket.on('new_user', function(data) {
            var found = false;
            $(self.users()).each(function(i,v) {
                if (v.username == data.username)
                    found = true;
            })
            if (!found) self.users.push(data);
        });

        socket.on('user_list', function(data) {
            self.users(data.users);
        })

        socket.on('conversation_list', function(data) {
            self.conversations(data.conversations);
        })

        socket.on('new_conversation', function(data){
            var conversation = {
                id: data.conversation_id,
                body: ko.observable(''),
                password: self.new_conversation_password()
            }
            self.conversations.push(conversation);
            _conversations[data.conversation_id] = self.conversations().length-1;
            self.clearConversationsForm();
        })

        socket.on('message', function(data) {
            var id = _conversations[data.conversation_id];
            var conversation = self.conversations()[id];
            conversation.body(conversation.body() + '\n' + self.decrypt(data.message, conversation.password));
            self.new_message_field("");
        })

        self.encrypt = function(message, passphrase) {
            var r = CryptoJS.AES.encrypt(message,passphrase);
            return r.toString();
        }
        self.decrypt = function(message, passphrase) {
            var r = CryptoJS.AES.decrypt(message,passphrase);
            return CryptoJS.enc.Utf8.stringify(r).toString();
        }

        self.createMD5Hash = function(message) {
            var md = forge.md.md5.create();
            md.update(message);
            return md.digest().toHex();
        }

        self.clearConversationsForm = function() {
            self.new_conversation_field("");
            self.new_conversation_password("");
        }

        socket.on('name_change', function(data) {
            self.username(data.username);
        })

        self.users = ko.observableArray([]);
        self.conversations = ko.observableArray([{id: 'asd', body: ko.observable('asd')}]);
        self.new_conversation_field = ko.observable('newbies');
        self.new_conversation_password = ko.observable('');
        self.new_message_field = ko.observable('');
        self.username = ko.observable('');

        self.addConversation = function() {
            socket.emit('new_conversation', {conversation_id: self.new_conversation_field()});
        }

        self.changename = function() {
            socket.emit('name_change', {username: self.username()})
        }

        self.sendMessage = function(conversation) {
            socket.emit('message', {
                conversation_id: conversation.id,
                message: self.encrypt(self.new_message_field(), conversation.password)
            })
        }

        self.alerts = ko.observableArray([
            {'message': 'Here is an Error', 'priority': 'error'},
            {'message': 'Here is a Warning', 'priority': 'warning'},
            {'message': 'Here is a Success', 'priority': 'success'},
            {'message': 'Here is some Info', 'priority': 'info'}
        ]);
    };

    $(function(){
        // make code pretty
        window.prettyPrint && prettyPrint();

        var viewModel = new ExampleViewModel();

        ko.applyBindings(viewModel);
    });
});