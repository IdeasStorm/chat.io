/* Author: YOUR NAME HERE
 */
var socket = io.connect('http://localhost:8080');
var pki = forge.pki;

function makeId()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function Conversation(id, password) {
    this.id = id;
    this.password = password;
    this.invite_user_field = ko.observable('');
    this.new_message_field = ko.observable('');
    this.body = ko.observable('');

    //region PUBLIC METHODS
        this.cipherPassword = function(username, callback) {
           KeyStore.getCert(username, function(cert) {
               var forge_cert = pki.certificateFromPem(cert);
               var cipher = forge_cert.publicKey.encrypt(password);
               callback(cipher)
           })
        }
    //endregion
}

var KeyStore = (function () {
    var myKeypair = null;

    var setCert = function (username, cert) {
        localStorage.setItem(username + 'Cert', cert);
    };

    return {
        getCert: function (username, callback) {
            var cert = localStorage.getItem(username + 'Cert');
            if (cert == "undefined" || !cert) {
                socket.emit('cert_request', {username: username, publicKey: KeyStore.getPublicKey(username)});
                socket.on('cert_response', function (data) {
                    if (username == data.username) {
                        setCert(username, data.cert);
                        callback(data.cert);
                    }
                });
            } else {
                callback(cert);
            }
        },

        setPrivateKey: function (username, privateKeyPem) {
            localStorage.setItem(username + 'Prk', privateKeyPem);
        },

        setPublicKey: function (username, publicKeyPem) {
            localStorage.setItem(username + 'Pk', publicKeyPem);
        },
        getKeyPair: function() {
            return myKeypair;
        },
        getPrivateKey: function (username) {
            var privateKeyPem = localStorage.getItem(username + 'Prk');
            if (privateKeyPem == "undefined") {
                myKeypair = Encryption.generateKeypair(username);
                return localStorage.getItem(username + 'Prk');
            }
            else {
                return privateKeyPem
            }
        },

        getPublicKey: function (username) {
            //TODO to Syrwan
            //   if localStorage.getItem(username+'Pk') == "undefined"
            //      get publicKey from Cert
            return localStorage.getItem(username + 'Pk');
        }

    }
})();

var Encryption = (function () {
    var keypair = null;
    var publicKeyPem = null;
    var privateKeyPem = null;

    return {
        generateKeypair: function (username) {
            var publicKey = localStorage.getItem(username + 'Pk');
            var privateKey = localStorage.getItem(username + 'Prk');
            if (publicKey == "undefined" || privateKey == "undefined") {
                // get rsa
                var rsa = pki.rsa;
                // generate an RSA key pair
                keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});
                // Get Pem of public/private key
                publicKeyPem = pki.publicKeyToPem(keypair.publicKey);
                privateKeyPem = pki.privateKeyToPem(keypair.privateKey);
                // Store pem in local storage
                KeyStore.setPublicKey(username, publicKeyPem);
                KeyStore.setPrivateKey(username, privateKeyPem);
                return keypair;
            }
        },

        encrypt: function (message, publicKeyPem) {
            var publicKey = pki.publicKeyFromPem(publicKeyPem);
            return publicKey.encrypt(message);
        },

        decrypt: function (encrypted, privateKeyPem) {
            var privateKey = pki.privateKeyFromPem(privateKeyPem);
            return privateKey.decrypt(encrypted);
        }
    }
})();

$(document).ready(function () {

    var ExampleViewModel = function () {
        var self = this;

        var _conversations = []; //cached index
        socket.on('new_user', function (data) {
            var found = false;
            $(self.users()).each(function (i, v) {
                if (v.username == data.username)
                    found = true;
            })
            if (!found) self.users.push(data);
        });

        socket.on('user_list', function (data) {
            self.users(data.users);
        })

        socket.on('conversation_list', function (data) {
            self.conversations(data.conversations);
        })

        socket.on('new_conversation', function (data) {
            var conversation = new Conversation(data.conversation_id, forge.random.getBytesSync(16));
            self.conversations.push(conversation);
            _conversations[data.conversation_id] = self.conversations().length - 1;
            self.clearConversationsForm();
        })

        socket.on('message', function (data) {
            var id = _conversations[data.conversation_id];
            var conversation = self.conversations()[id];
            conversation.body(conversation.body() + '\n' + self.decrypt(data.message, conversation.password));
            self.new_message_field("");
        })

        self.encrypt = function (message, passphrase) {
            var r = CryptoJS.AES.encrypt(message, passphrase);
            return r.toString();
        }
        self.decrypt = function (message, passphrase) {
            var r = CryptoJS.AES.decrypt(message, passphrase);
            return CryptoJS.enc.Utf8.stringify(r).toString();
        }

        self.createMD5Hash = function (message) {
            var md = forge.md.md5.create();
            md.update(message);
            return md.digest().toHex();
        }

        self.clearConversationsForm = function () {
            self.new_conversation_field("");
            self.new_conversation_password("");
        }


        socket.on('name_change', function (data) {
            self.username('Username: '+data.username);
            $('.login-section').hide();
            $('.username-section').show();
        })

        socket.on('welcome', function(data) {
            var keys = KeyStore.getKeyPair();
            data.password = keys.privateKey.decrypt(data.password);
            var conversation = new Conversation(data.conversation_id, data.password);
            self.conversations.push(conversation);
            _conversations[data.conversation_id] = self.conversations().length - 1;
        })

        socket.on('cert_request', function(data) {
            KeyStore.getCert(self.username, function(cert) {
                data.cert = cert;
                socket.emit('cert_response', data);
            })

        })

        self.users = ko.observableArray([]);
        self.conversations = ko.observableArray([]);
        self.new_conversation_field = ko.observable('');
        self.new_conversation_password = ko.observable('');
        self.username = ko.observable('');

        self.addConversation = function () {
            var id = self.new_conversation_field() || makeId();
            socket.emit('new_conversation', {conversation_id: id});
        }

        self.inviteUser = function (conversation) {
            conversation.cipherPassword(conversation.invite_user_field(), function(cipher_password) {
                socket.emit('invite_user', {
                    username: conversation.invite_user_field(),
                    conversation_id: conversation.id,
                    password: cipher_password
                });
            })
        }

        self.sendMessage = function (conversation) {
            socket.emit('message', {
                conversation_id: conversation.id,
                message: self.encrypt(conversation.new_message_field(), conversation.password)
            })
        }

        self.alerts = ko.observableArray([
            {'message': 'Here is an Error', 'priority': 'error'},
            {'message': 'Here is a Warning', 'priority': 'warning'},
            {'message': 'Here is a Success', 'priority': 'success'},
            {'message': 'Here is some Info', 'priority': 'info'}
        ]);
    };

    $(function () {
        // make code pretty
        window.prettyPrint && prettyPrint();

        var viewModel = new ExampleViewModel();

        ko.applyBindings(viewModel);
    });
});