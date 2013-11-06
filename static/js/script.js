/* Author: YOUR NAME HERE
 */

$(document).ready(function () {

    var socket = io.connect();

    $('#sender').bind('click', function () {
        socket.emit('message', {
            message: 'Message Sent on ' + new Date(),
            conversation_id: $('#conversation').val()
        });
    });

    $('#invite').bind('click', function() {
        socket.emit('invite', {
            conversation_id: $('#conversation').val(),
            user_id: $('#invited_user').val()
        });
    })

    socket.on('message', function (data) {
        $('#receiver').append('<li>' + data.message + '</li>');
    });

    socket.on('name_change', function (data) {
        $('#username').val(data.name);
    });
});