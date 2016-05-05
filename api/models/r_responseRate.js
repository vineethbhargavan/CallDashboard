/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'redis',
    attributes: {
        date: {
            type: 'string',
            primaryKey: true,
            size: 40,
            required: true
        }, waitingTime: {
            type: 'integer',
            size: 10,
        }, abandonTime: {
            type: 'integer',
            size: 10,
        }, connectedTime: {
            type: 'integer',
            size: 10,
        },connectedCount: {
            type: 'integer',
            size: 10
        },abandonCount: {
            type: 'integer',
            size: 10
        }, totalIncomingCalls: {
            type: 'integer',
            size: 10,
        },abandonCount_10: {
            type: 'integer',
            size: 10
        },abandonCount_30: {
            type: 'integer',
            size: 10
        },abandonCount_120: {
            type: 'integer',
            size: 10
        },abandonCount_140: {
            type: 'integer',
            size: 10
        },dateTime:{
		type:'datetime',
		size:50
		
	}

    }
};