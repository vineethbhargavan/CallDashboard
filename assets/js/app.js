/**
 * app.js
 *
 * Front-end code and event handling for sailsChat
 *
 */


// Attach a listener which fires when a connection is established:
var app = angular.module('myApp', []);
var socket = io.socket;

google.charts.load('current', {'packages': ['table', 'gauge', 'corechart']});

var roomId = roomId;


$('document').ready(function () {
    setTimeout(function () {
        socket.post('/room/queueStats', {id: 'operator', name: 'dashboard'},function(err,data){
            if(err){
                console.log('/room/queueStats Error'+err);
            }else{
                console.log('Data Received'+data);
            }
        });
    }, 3000);


    socket.on('connect', function socketConnected() {
        console.log('Socket is now connected!' + socket.id + roomId);
        // Join the room
    });

});






