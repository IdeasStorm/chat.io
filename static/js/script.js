/* Author: YOUR NAME HERE
 */

function Conversation(id, password) {
    this.id = id;
    this.password = password;
    this.messages = [];
}

$(document).ready(function () {
    // get rsa
    var rsa = forge.pki.rsa;
    // generate an RSA key pair
    var keypair = rsa.generateKeyPair({bits: 2048, e: 0x10001});

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

        self.encryptRSA = function(message, publicKey) {
            if (publicKey == null) return "";
            return publicKey.encrypt(message);
        }
        self.decryptRSA = function(encrypted, privateKey) {
            if (privateKey == null) return "";
            return privateKey.decrypt(encrypted);
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