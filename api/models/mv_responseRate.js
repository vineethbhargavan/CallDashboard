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
            required: true,
            size: 50
        }, waitingTime: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonTime: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, connectedTime: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, connectedCount: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonCount: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, totalIncomingCalls: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonCount_10: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonCount_30: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonCount_120: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonCount_140: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, timeoutCount: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, timeoutTime: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },responseRate:{
            type: 'integer',
            size: 10
        },abandonRate:{
            type: 'integer',
            size: 10
        },instances:{
            type: 'integer',
            size: 10
        }

    }
};