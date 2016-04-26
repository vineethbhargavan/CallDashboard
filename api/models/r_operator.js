module.exports = {
  connection: 'redis',
  attributes: {
	id:{
		type:'string',
		primaryKey: true,
		size:10,
		required:true
	},name:{
		type:'string',
                size:30,
                
	},loggedStatus:{
		type:'integer',
                size:10,
                
	},callMode:{
		type:'string',
		size:10,
		
	},incomingCount:{
		type:'integer',
		size:10,
		
	},outgoingCount:{
		type:'integer',
		size:10,
		
	}

  }
};