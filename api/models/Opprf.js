/**
 * Operator.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  connection: 'pg_1300',
  hookTimeout: 50000,
  attributes: {
	id:{
		type:'integer',
		primaryKey: true,
		size:10,
		required:true
	},
	flag:{
		type:'integer',
                size:10,
                required:true
	},mode:{
		type:'string',
		size:10,
		required:true
            }
//	},name:{
//            collection:'users',
//            via:'id'
//
//        }

  }
};

