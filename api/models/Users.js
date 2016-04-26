module.exports = {
  connection: 'Mysql_1300',
  hookTimeout: 50000,
  attributes: {
	id:{
		type:'string',
		primaryKey: true,
		size:10,
		required:true,
                unique:true,
                //model:'opprf'
	},
	name:{
		type:'string',
                size:30,
                required:true
	}


  }
};