module.exports={
	connectoAsterisk: function(credentials){
		var ami = new require('asterisk-manager')(credentials.port,credentials.hostname,credentials.managerName,credentials.password, true);
		ami.keepConnected();
	}
};




