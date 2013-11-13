var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose'),
    io = require('socket.io').listen(8090),
    forge = require('node-forge');

var pki = forge.pki;

function CA() {
    var self = this;

    // Initialization BLOCK

    var mongoose = require('mongoose'),
        Schema = mongoose.Schema;

    var Account = new Schema({
        publicKey: String
    });

    Account.plugin(passportLocalMongoose);

    var model = mongoose.model('Account', Account);

    // GENERTATING CERTIFICATE
    this.keys = pki.rsa.generateKeyPair(2048);
    this.cert = generateCertificate();
    this.cert.sign(keys.privateKey);
    // END GENERATING CERTIFICATE

    this.start = function() {

        // connecting to database
        mongoose.connect('mongodb://localhost/ca');

        io.sockets.on('connection', function (socket) {
            socket.on('register', function (data) {
                // data = {publickey, username, password}
                var account = new Acount(data);
                account.save(function(err) {
                    var cert = generateCertificate(data.publicKey);
                    cert.sign(this.keys.privateKey);
                    var pem = pki.certificateToPem(cert);
                    socket.emit('register', {
                        success : 'true',
                        certificate: pem
                    })
                })
            });
            socket.on('cert_request', function (data) {
                var pem = pki.certificateToPem(this.cert);
                socket.emit('cert_resposne', { certificate: pem });
            });
        });
    }
}



// generate a non-signed certificate
function generateCertificate(publickey){
    var cert = pki.createCertificate();
    cert.publicKey = publickey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    var attrs = [{
        name: 'commonName',
        value: 'Chat.io'
    }, {
        name: 'countryName',
        value: 'SY'
    }, {
        shortName: 'ST',
        value: 'Damascus'
    }, {
        name: 'localityName',
        value: 'Damascus'
    }, {
        name: 'organizationName',
        value: 'Chat.io, inc'
    }, {
        shortName: 'OU',
        value: 'Test'
    }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    return cert;
}


// var privateKey = fs.readFileSync('./../ssl/localhost.key').toString();
// var certificate = fs.readFileSync('./../ssl/localhost.crt').toString();