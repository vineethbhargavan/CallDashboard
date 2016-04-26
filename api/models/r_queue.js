/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
  connection: 'redis',
  attributes: {
	uniqueKey:{
		type:'string',
		primaryKey: true,
		size:10,
		required:true
	},queueState:{
		type:'string',
                size:30,
                
	},callerInfo:{
		type:'integer',
                size:10,
                
	},companyName:{
		type:'string',
		size:10,
		
	},operatorName:{
		type:'string',
		size:10,
		
	},startdate:{
		type:'datetime',
		size:50,
		required:true
	},duration:{
            type:'integer',
            size:10,
        }

  }
};