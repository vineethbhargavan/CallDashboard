/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    connection: 'Mysql_1300',
    hookTimeout: 50000,
    attributes: {
        uniqueKey: {
            type: 'string',
            primaryKey: true,
            size: 10,
            required: true
        }, queueState: {
            type: 'string',
            size: 30,
        }, callerInfo: {
            type: 'string',
            size: 10,
            defaultsTo: '0'
        }, companyName: {
            type: 'string',
            size: 10,
            defaultsTo: '0'
        }, operatorName: {
            type: 'string',
            size: 10,
            defaultsTo: '0'
        }, startdate: {
            type: 'datetime',
            size: 50,
            required: true
        }, queueEntryTime: {
            type: 'integer',
            size: 50,
            defaultsTo: '0'
        }, callconnectedTime: {
            type: 'integer',
            size: 50,
            defaultsTo: '0'
        }, duration: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, waitingDuration: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, connectedTime: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, abandonDuration: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, operator_id: {
            type: 'string',
            size: 30,
            defaultsTo: '0'
        }, company_id: {
            type: 'string',
            size: 30,
            defaultsTo: '0'
        }, connectedDuration: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, timeoutDuration: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        }, previousState: {
            type: 'string',
            size: 30,
            defaultsTo: '0'
        }, country_identifier: {
            type: 'integer',
            size: 10,
            defaultsTo: 0
        },stateTransition:{
            type: 'string'
        }

    }
};