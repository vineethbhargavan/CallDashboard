/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'Mysql_1300',
    hookTimeout: 50000,
    attributes: {
        count: {
            type: 'integer',
            primaryKey: true,
            size: 10,
            required: true
        }     
    }
};