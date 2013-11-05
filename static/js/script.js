/* Author: YOUR NAME HERE
*/

$(document).ready(function() {   

  var socket = io.connect();

  $('#sender').bind('click', function() {
   socket.emit('message', {
       message: 'Message Sent on ' + new Date(),
       conversation_id: '12345'
   });
  });

  socket.on('server_message', function(data){
   $('#receiver').append('<li>' + data.message + '</li>');
  });
});