var ami = new require('asterisk-manager')('5038','192.168.0.10','dashboard','abc123', true);
//userevent{"event":"UserEvent","privilege":"user,all","userevent":"TriggerOperator","uniqueid":["1449613043.18"],"channel":"SIP/666-00000012"}
//var io = require('sails.io.js')( require('socket.io-client') );


if(ami!=undefined){
try{
	ami.keepConnected();

ami.on('userevent', function(evt) {
        sails.log("userevent"+ JSON.stringify(evt))
        if(evt.userevent == "UpdateQueue"){
                sails.log("UpdateQueue"+evt.custkey);
                //sails.controllers.waitingqueue.publishMappedCompany('operator');
                sails.controllers.waitingqueue.updateQueueObject('dashboard',evt);
        }
});

}catch(err){ 
        sails.log('exception occured:During AMI action', err.message);
}
}else{
	sails.log('AMI object is not Present Trying to login agan');
	ami = new require('asterisk-manager')('5038','localhost','escalation','abc123', true);
}


process.on('uncaughtException',function(err){
        sails.log(' unhandled exception caught : ',err.message);
	var ami = new require('asterisk-manager')('5038','localhost','escalation','abc123', true);
	ami.keepConnected();

});


