/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var pg = require ('pg');
var pgConString = "postgres://192.168.0.56/1300_test"
pg.connect(pgConString, function(err, client) {
  if(err) {
    sails.log(err);
  }
  client.on('notification', function(msg) {
    //var jsonstring = JSON.stringify(msg)
    //var payload = JSON.parse(JSON.stringify(eval(msg.payload)));
        sails.log("Notification from table"+JSON.stringify(msg));
    var payload = JSON.parse(JSON.stringify(eval('('+msg.payload+')')));
    sails.log("Waiting Payload"+JSON.stringify(payload));

//    sails.log("Payload"+msg.payload);

    if(payload!=undefined && payload.table == 'opprf'){
//        sails.controllers.operatorstatus.getOperatorDetails('operator','noid',function(result){
//            sails.log("getOperatorDetails_service" + result);
//        });
    }
    
    if(payload!=undefined && payload.table == 'waitingqueue'){
        
        sails.controllers.waitingqueue.generateQueueStats('operator',payload);
    }

  });
  var query = client.query("LISTEN watchers");
});

