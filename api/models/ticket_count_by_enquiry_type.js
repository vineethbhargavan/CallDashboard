/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'Mysql_1300',
    hookTimeout: 50000,
    attributes: {
        enquiry_type: {
            type: 'integer',
            primaryKey: true,
            size: 10,
            required: true
        }, nos: {
            type: 'integer',
            size: 30
        }, assigned:{
            type: 'integer',
            size: 30
        },unassigned:{
            type: 'integer',
            size: 30
        }, urgent:{
            type: 'integer',
            size: 30
        }


    }
};