/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
  connection: 'Mysql_1300',
  attributes: {
	company_info_id:{
		type:'string',
		primaryKey: true,
		size:10,
		required:true
	},brand_name:{
		type:'string',
                size:30,
                
	}

  }
};