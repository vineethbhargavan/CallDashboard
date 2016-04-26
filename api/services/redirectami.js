var ami = new require('asterisk-manager')('5038','localhost','escalation','abc123', true);
//userevent{"event":"UserEvent","privilege":"user,all","userevent":"TriggerOperator","uniqueid":["1449613043.18"],"channel":"SIP/666-00000012"}
//var io = require('sails.io.js')( require('socket.io-client') );


if(ami!=undefined){
try{
	ami.keepConnected();
ami.on('managerevent', function(evt) {
        sails.log("ManagerEvet"+ JSON.stringify(evt));
//        if(evt.event == "PeerStatus"){
//                logger.info("Redirect to conf"+evt.username);
//                sails.controllers.operatorstatus.updateOperatorStatus(evt);
//        }
	//sails.controllers.operatorstatus.updateOperatorStatus(evt);
});
ami.on('userevent', function(evt) {
        sails.log("userevent"+ JSON.stringify(evt))
        if(evt.userevent == "RedirectToBridge"){
                sails.log("Redirect to conf"+evt.context);
                if(evt.context=='conference'){
                    sails.controllers.operatorstatus.updateOperatorStatus(evt);
                }
        }
        if(evt.userevent == "UpdateCallStatus"){
                sails.log("UpdateCallStatus"+evt.operator);
                sails.controllers.operatorstatus.updateOperatorStatus(evt);
        }
        if(evt.userevent == "UpdateQueue"){
                sails.log("UpdateQueue"+evt.custkey);
                sails.controllers.waitingqueue.publish('operator');
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


