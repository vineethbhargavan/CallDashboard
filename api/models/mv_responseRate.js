/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'redis',
    attributes: { 
        dateTime: {
            type: 'integer',
            primaryKey: true,
            required: true
        }, waitingTime: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonTime: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, connectedTime: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, connectedCount: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonCount: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, totalIncomingCalls: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonCount_10: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonCount_30: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonCount_120: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, abandonCount_140: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, timeoutCount: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        }, timeoutTime: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        },responseRate:{
            type: 'float',
            size: 10,
            defaultsTo: 0
        },abandonRate:{
            type: 'float',
            size: 10,
            defaultsTo: 0
        },instances:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },timestamp:{
            type: 'integer'
        },totalCallsInQueue: {
            type: 'float',
            size: 10,
            defaultsTo: 0
        },loggedInOperators:{
            type: 'float',
            size: 10,
            defaultsTo: 0
        }

    }
};