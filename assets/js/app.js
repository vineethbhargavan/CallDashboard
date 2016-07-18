/**
 * app.js
 *
 * Front-end code and event handling for sailsChat
 *
 */


// Attach a listener which fires when a connection is established:
var app = angular.module('myApp', []);
var socket = io.sails.connect();


socket.on('connect', function socketConnected() {

    console.log('Socket is now connected!'+socket.id);
    // Join the room
    socket.post('/room/queueStats', {id: 'operator', name: 'dashboard'});
});





