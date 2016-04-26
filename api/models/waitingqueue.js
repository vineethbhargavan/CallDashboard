/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

 
  module.exports = {
  connection: 'pg_1300',
  attributes: {
	waitingtype:{
		type:'string',
		size:30,
		required:true
	},company_id:{
		type:'string',
                size:10,
                required:true
	},countrycode:{
		type:'integer',
		size:10,
		required:true
	},cli:{
		type:'string',
		size:20,
		required:true
	},startdate:{
		type:'datetime',
		size:50,
		required:true
	},custkey:{
		type:'string',
                primaryKey: true,
		size:30,
		required:true
	},operator:{
		type:'string',
		size:30,
		required:true
	}

  }
};