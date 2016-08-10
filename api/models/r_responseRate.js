/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'redis',
    attributes: { 
        uuid: {
            type: 'string',
            primaryKey: true,
            required: true
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
        },totalExternalRedirections: {
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
            size: 10,
            defaultsTo: 0
        },abandonRate:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },timestamp:{
            type: 'integer'
        }, totalCallsInQueue: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },loggedInOperators:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },incoming:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },outgoing:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },idle:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },blocked:{
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, country_identifier: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }

    }
};