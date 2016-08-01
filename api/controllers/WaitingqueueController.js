/**
 * WaitingqueueController
 *
 * @description :: Server-side logic for managing waitingqueues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    /**
     * `WaitingqueueController.publish()`
     */
    publish: function (roomId) {
        waitingqueue.find().exec(function (err, queue) {
            sails.log.info('waitingqueue to' + roomId);
            sails.log.info('queue' + queue);
            //sails.sockets.broadcast(roomId, 'waitingqueue', queue);
        });
    }, updateQueueObject: function (roomId, event, callback) {
        //Update Quue Object
        // Generate Queue Stats.
        var queueToUpdate = event;
        if (queueToUpdate.custkey != undefined && queueToUpdate.custkey != '') {
            r_queue.find({uniqueKey: queueToUpdate.custkey}).exec(function (err, qfound) {
                if (err) {
                    return callback(err);
                } else {
                    if (qfound[0] != undefined) {
                        populateQueueObject(qfound[0], queueToUpdate, function (err, queue) {
                            if (err)
                                return callback(err);
                            populateQueueStats(queue, function (err, callstats) {
                                if (err)
                                    return callback(err);
                                r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                                    if (err) { //returns if an error has occured, ie id doesn't exist.
                                        return callback(err);
                                    } else {
                                        sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                                        publishRealtimeQueueStats(updated, function (err, realStats) {
                                            if (err)
                                                return callback(err);
                                            callback(null,realStats);
                                        });
                                    }
                                });
                            });
                            //publishQueueToView(roomId, callstat.interval);
                        });
                    } else {
                        initialiseQueueObject(queueToUpdate, function (err, queue) {
                            if (err)
                                return callback(err);
                            populateQueueStats(queue, function (err, callstats) {
                                if (err)
                                    return callback(err);
                                r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                                    if (err) { //returns if an error has occured, ie id doesn't exist.
                                        return callback(err);
                                    } else {
                                        sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                                        publishRealtimeQueueStats(updated, function (err, realStats) {
                                            if (err)
                                                return callback(err);
                                            callback(null,realStats);
                                        });
                                    }
                                });
                            });
                        });
                    }
                }
            });
        } else {
            callback(new Error('updateQueueObject -Custkey Not defined'));
        }

    }, launchQueuedashboard: function (req, resp) {
        return resp.view('queueStats', {
            roomId: 'dashboard'
        });


    }, populateQueuedashboard: function (req,callback) {
        var roomId = req.param('name');
        sails.log.info('join request' + roomId);
        sails.log.info('SocketID' + sails.sockets.getId(req));
        sails.sockets.join(req, roomId);
        var queue = {};
        populateQueueStats(queue, function (err, callstats) {
            if (err)
                return callback(err);
            r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                if (err) { //returns if an error has occured, ie id doesn't exist.
                    return callback(err);
                } else {
                    sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                    var rrate = {};
                    rrate.dateTime = new Date().getTime();
                    lastInterval = rrate.dateTime - interval;
                    rrate.timestamp = rrate.dateTime;
                    publishRealtimeQueueStats(updated, function (err, realStats) {
                        if (err)
                             return callback(err);
                    });

                    populateMovingAverageStats(rrate, lastInterval, function (err, result) {
                        if (err)
                            return callback(err);
                        sails.log.info('populateMovingAverageStats Result upon launch' + JSON.stringify(result));
                    });
                    //pupulateTicketGraph();
                }
            });
            callback(null,callstats);
        });


    }, launchTicketGraph: function (req,callback) { //not used
        pupulateTicketGraph(function (err, ticketResult) {
            if (err)
                return callback(err);
            callback(ticketResult);
        });
    }
};
//moving average
var interval = 1800000;
var realtimeFetchInterval = 0;
var roomId = "dashboard";
var movingAvg = setInterval(function () {
    var queue = {};
    populateQueueStats(queue, function (err, callstats) {
        if (err)
            sails.log.info('populateQueueStats Error' + err);
        r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
            if (err) { //returns if an error has occured, ie id doesn't exist.
                sails.log.info('r_responseRate Update Error' + err);

            } else {
                sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                var rrate = {};
                rrate.dateTime = new Date().getTime();
                rrate.timestamp = rrate.dateTime;
                lastInterval = rrate.dateTime - interval;
                //publishRealtimeQueueStats();
                populateMovingAverageStats(rrate, lastInterval, function (err, result) {
                    if (err)
                        sails.log.info('populateMovingAverageStats Error' + err);
                });
            }
        });
    });

}, interval);

function pupulateTicketGraph(callback) {
    ticket_count_by_enquiry_type.find().exec(function (err, types) {
        if (err)
            return callback(err);
        sails.log.info('pupulateTicketGraph' + JSON.stringify(types));
        sails.sockets.broadcast(roomId, 'ticketClassification', types);
        callback(null,types);
    });
    populateUrgentTicketCount(function(err,result){
        if (err)
            return callback(err);
        sails.sockets.broadcast(roomId, 'urgentTickets', result);
        sails.log.info('poupulateUrgentTicketCount Result' + result);
    })
}
function populateUrgentTicketCount(callback){
    ticket_urgent.find().exec(function (err, result) {
        if (err)
            return callback(err);
        sails.log.info('poupulateUrgentTicketCount' + result[0].count);
        callback(null,result[0].count);
    });
}
//Need to improve the below function
function populateMovingAverageStats(rrate, lastInterval, callback) {
    try {
        var updatedStats ={};
        mv_responseRate.insertOrUpdate("dateTime", rrate, function (err, mv_rrate) {
            if (err)
                return callback(err);
            sails.log.info("To mv_responseRate" + mv_rrate.dateTime);
            //updateMovingAverageSnapshots(mv_rrate);
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, waitingTime: {'!': 0}}).average('waitingTime').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(waitingTime) " + JSON.stringify(rrate));
                sails.log.info("r_responseRate sum@@@(waitingTime) " + rrate[0].waitingTime);
                if (rrate[0] !== undefined & !isNaN(rrate[0].waitingTime)) {
                    mv_rrate.waitingTime = rrate[0].waitingTime;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonTime: {'!': 0}}).average('abandonTime').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(abandonTime) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].abandonTime)) {
                    mv_rrate.abandonTime = rrate[0].abandonTime;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, connectedTime: {'!': 0}}).average('connectedTime').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(connectedTime) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].connectedTime)) {
                    mv_rrate.connectedTime = rrate[0].connectedTime;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, connectedCount: {'!': 0}}).average('connectedCount').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(connectedCount) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].connectedCount)) {
                    mv_rrate.connectedCount = rrate[0].connectedCount;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonCount: {'!': 0}}).average('abandonCount').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(abandonCount) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].abandonCount)) {
                    mv_rrate.abandonCount = rrate[0].abandonCount;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, totalIncomingCalls: {'!': 0}}).average('totalIncomingCalls').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(totalIncomingCalls) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].totalIncomingCalls)) {
                    mv_rrate.totalIncomingCalls = rrate[0].totalIncomingCalls;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, timeoutCount: {'!': 0}}).average('timeoutCount').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(timeoutCount) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].timeoutCount)) {
                    mv_rrate.timeoutCount = rrate[0].timeoutCount;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, timeoutTime: {'!': 0}}).average('timeoutTime').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(timeoutTime) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].timeoutTime)) {
                    mv_rrate.timeoutTime = rrate[0].timeoutTime;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, responseRate: {'!': 0}}).average('responseRate').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(responseRate) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].responseRate)) {
                    mv_rrate.responseRate = rrate[0].responseRate;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }

            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonRate: {'!': 0}}).average('abandonRate').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(abandonRate) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].abandonRate)) {
                    mv_rrate.abandonRate = rrate[0].abandonRate;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, totalCallsInQueue: {'!': 0}}).average('totalCallsInQueue').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(totalCallsInQueue) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].totalCallsInQueue)) {
                    mv_rrate.totalCallsInQueue = rrate[0].totalCallsInQueue;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, loggedInOperators: {'!': 0}}).average('loggedInOperators').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(loggedInOperators) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].loggedInOperators)) {
                    mv_rrate.loggedInOperators = rrate[0].loggedInOperators;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });
            r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, totalExternalRedirections: {'!': 0}}).average('totalExternalRedirections').exec(function (err, rrate) {
                if (err)
                    return callback(err);
                sails.log.info("r_responseRate sum@@@(totalExternalRedirections) " + JSON.stringify(rrate));
                if (rrate[0] !== undefined & !isNaN(rrate[0].totalExternalRedirections)) {
                    mv_rrate.totalExternalRedirections = rrate[0].totalExternalRedirections;
                    updateMovingAverageSnapshots(mv_rrate, function (err, updated) {
                        if (err)
                            return callback(err);
                        updatedStats = updated;
                    });
                }
            });

            callback(null,updatedStats);
        });
    } catch (err) {
        sails.log.info('exception occured:populateMovingAverageStats', err.message);
        callback(new Error('exception occured:populateMovingAverageStats'));
    }

}


function populateOperatorStats(callback) {
    var operatorStats = {};
    Opprf.count({where: {flag: 1, id: {'!': ['1025', '1050']}}}).exec(function (err, total) {
        if (err)
            return callback(err);
        operatorStats.totalOperators = total;
        Opprf.count({where: {flag: 1, isblocked: 1, id: {'!': ['1025', '1050']}}}).exec(function (err, blocked) {
            if (err)
                return callback(err);
            operatorStats.blocked = blocked;
            Opprf.count({where: {flag: 1, mode: 'IN', id: {'!': ['1025', '1050']}}}).exec(function (err, incoming) {
                if (err)
                    return callback(err);
                operatorStats.incoming = incoming;
                Opprf.count({where: {flag: 1, mode: 'OUT', id: {'!': ['1025', '1050']}}}).exec(function (err, outgoing) {
                    if (err)
                        return callback(err);
                    operatorStats.outgoing = outgoing;
                    sails.log.info("populateOperatorStats return" + JSON.stringify(operatorStats));
                    callback(null, operatorStats);
                });

            });
        });
    });
}
function populateQueueStats(queue, callback) {
    try {
        if (queue != undefined) {
            var rrate = {};
            rrate.dateTime = new Date().getTime();
            rrate.timestamp = rrate.dateTime;
            r_responseRate.insertOrUpdate("dateTime", rrate, function (err, callstats) {
                if (err)
                    return callback(err);
                sails.log.info("Initialised RR object" + JSON.stringify(callstats));
                populateOperatorStats(function (err, operatorStats) {
                    if (err)
                        return callback(err);
                    //Opprf.count({where: {flag: 1, id: {'!': ['1025', '1050']}}}).exec(function (err, operators) {
                    callstats.loggedInOperators = operatorStats.totalOperators;
                    callstats.incoming = operatorStats.incoming;
                    callstats.outgoing = operatorStats.outgoing;
                    callstats.idle = operatorStats.idle;
                    callstats.blocked = operatorStats.blocked;
                    r_queue.find({queueState: {'!': 'dormant'}}).exec(function (err, qresult) {
                        if (err)
                            return callback(err);
                        callstats.totalIncomingCalls = qresult.length;
                        for (i = 0; i < qresult.length; i++) {
                            var queue = qresult[i];
                            sails.log.info("populateQueueStats:" + JSON.stringify(queue));
                            if (queue.queueState == "timeout") {
                                callstats.timeoutCount++;
                                callstats.timeoutTime = (callstats.timeoutTime + queue.timeoutDuration);
                            }
                            if (queue.queueState == "entrypoint_external") {
                                callstats.totalExternalRedirections++;
                            }
                            if (queue.queueState == "finding_op" || queue.queueState == "calling_op") {
                                callstats.totalCallsInQueue++;
                            }
                            if ((queue.previousState == "finding_op" || queue.previousState == "calling_op") && queue.queueState == "terminated") {
                                callstats.abandonCount++;
                                if (queue.abandonDuration > 140) {
                                    callstats.abandonCount_140++;
                                } else if (queue.abandonDuration > 30 && queue.abandonDuration < 141) {
                                    callstats.abandonCount_120++;
                                } else if (queue.abandonDuration > 10 && queue.abandonDuration < 31) {
                                    callstats.abandonCount_30++;
                                } else {
                                    callstats.abandonCount_10++;
                                }
                                callstats.abandonTime = (callstats.abandonTime + queue.abandonDuration);

                            }
                            if (queue.queueState == "connected") {
                                callstats.connectedCount++;
                                callstats.waitingTime = (callstats.waitingTime + queue.waitingDuration);
                                sails.log.info("callstats.waitingTime" + callstats.waitingTime);
                                //callstats.responseRate = (callstats.connectedCount / (callstats.connectedCount + callstats.timeoutCount)) * 100;

                            }
                            if (queue.previousState == "connected" && queue.queueState == "terminated") {
                                callstats.connectedTime = (callstats.connectedTime + queue.connectedDuration);
                            }
                            if (queue.queueState == "terminated") {
                                sails.log.info("populateQueueStats: End of Queue life" + JSON.stringify(queue));
                                queue.queueState = "dormant";
                                callstats.totalIncomingCalls = callstats.totalIncomingCalls - 1;
                                updateQueue(queue, function (err, updatedQueue) {
                                    if (err)
                                        return callback(err);
                                    sails.log.info("populateQueueStats: End of Queue life updateQueue" + updatedQueue.queueState);
                                    mysql_queue.insertOrUpdate("uniqueKey", updatedQueue, function (err, qUpdated) {
                                        if (err) { //returns if an error has occured, ie id doesn't exist.
                                            sails.log.info('mysql_queue Update Error' + err);
                                            return callback(err);
                                        } else {
                                            sails.log.info('mysql_queue Update' + JSON.stringify(qUpdated));
                                        }
                                    });

                                });
                            }
                        }
                        if ((callstats.connectedCount + callstats.timeoutCount) != 0)
                            callstats.responseRate = (callstats.connectedCount / (callstats.connectedCount + callstats.timeoutCount)) * 100;
                        if (callstats.totalIncomingCalls != 0)
                            callstats.abandonRate = (callstats.abandonCount / callstats.totalIncomingCalls) * 100;
                        if (callstats.timeoutCount != 0)
                            callstats.timeoutTime = (callstats.timeoutTime) / callstats.timeoutCount;
                        if (callstats.abandonCount != 0)
                            callstats.abandonTime = (callstats.abandonTime) / callstats.abandonCount;
                        if (callstats.connectedCount != 0)
                            callstats.waitingTime = (callstats.waitingTime) / callstats.connectedCount;
                        if (callstats.connectedCount != 0)
                            callstats.connectedTime = (callstats.connectedTime) / callstats.connectedCount;
                        sails.log.info("Callstats" + JSON.stringify(callstats));
                        callback(null, callstats);

                    });
                });
                //callback(callstats);
            });
        }
    } catch (err) {
        sails.log.info('exception occured populateQueueStats:', err.message);
    }
}

function updateQueue(queue, callback) {
    if (queue.uniqueKey !== undefined) {
        r_queue.insertOrUpdate("uniqueKey", queue, function (err, qUpdated) {
            if (err) { //returns if an error has occured, ie id doesn't exist.
                sails.log.info('r_queue Update Error' + err);
                return callback(err);
            } else {
                sails.log.info('r_queue Updated' + JSON.stringify(qUpdated));
                callback(null, qUpdated);
            }
        });
    } else {
        callback(new Error('update Queue failed- No unique Key'));
    }
}

function updateMovingAverageSnapshots(mv_avg, callback) {
    mv_responseRate.insertOrUpdate("dateTime", mv_avg, function (err, mvUpdated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log.info('mv_responseRate Update Error' + err);
            return callback(err);
        } else {
            sails.log.info('mv_responseRate Updated' + JSON.stringify(mvUpdated));
            sails.sockets.broadcast(roomId, 'movingCallStats', mvUpdated);
            publishMovingAverageStats(mvUpdated, function (err, result) {
                if (err)
                    return callback(err);
            });
            pupulateTicketGraph(function (err, ticketResult) {
                if (err)
                    return callback(err);
            });
            callback(null,mvUpdated);
        }
    });
}

function publishMovingAverageStats(mvAverage, callback) {
    var currentTime = new Date().getTime();
    var previousInterval = currentTime - 86400000;
    sails.log.info('publishMovingAverageStats' + JSON.stringify(mvAverage));
    mv_responseRate.find({timestamp: {'>': previousInterval, '<': currentTime}}).exec(function (err, qresult) {
        if (err)
            return callback(err);
        //sails.log.info('publishMovingAverageStats Array List' + JSON.stringify(qresult));
        sails.sockets.broadcast(roomId, 'movingSystemStats', qresult);
        callback(null,qresult);
    });
}
function publishRealtimeQueueStats(qStats, callback) {
    var currentTime = new Date().getTime();
    var previousInterval = currentTime - 600000;
    sails.log.info('publishRealtimeQueueStats' + JSON.stringify(qStats));
    sails.sockets.broadcast(roomId, 'realTimecallStats', qStats);
    pupulateTicketGraph(function (err, ticketResult) {
        if (err)
            return callback(err);
    });
    r_responseRate.find({timestamp: {'>': previousInterval, '<': currentTime}}).exec(function (err, qresult) {
        if (err)
            return callback(err);
        sails.sockets.broadcast(roomId, 'realtimeSystemStats', qresult);
        callback(null,qresult);
    });
}

function populateQueueObject(queue, queueToUpdate, callback) {
    handleQueueTransition(queue, queueToUpdate, function (err, qresult) {
        if (err)
            return callback(err);
        sails.log.info("handleQueueTransition callback queue result" + qresult.queueState);
        r_queue.insertOrUpdate("uniqueKey", qresult, function (err, qUpdated) {
            if (err) { //returns if an error has occured, ie id doesn't exist.
                sails.log.info('r_queue Update Error' + err);
                return callback(err);
            } else {
                sails.log.info('r_queue Updated' + JSON.stringify(qUpdated));
                callback(null, qUpdated);
            }
        });
    });

}
function handleQueueTransition(queue, queueToUpdate, callback) {
    try {
        sails.log.info("handleQueueTransition:" + queue.queueState + ":" + queueToUpdate.waitingtype);
        queueToUpdate.current_time = parseInt(queueToUpdate.current_time);
        queueToUpdate.previous_state_time = parseInt(queueToUpdate.previous_state_time);
        if (queueToUpdate.waitingtype == "finding_op") {
            queue.queueEntryTime = queueToUpdate.current_time;
            sails.log.info("handleQueueTransition: queueEntryTime" + queue.queueEntryTime);
        } else if (queueToUpdate.waitingtype == "connected") {
            queue.waitingDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
            queue.callconnectedTime = queueToUpdate.current_time;
            sails.log.info("handleQueueTransition: waitingDuration" + queue.waitingDuration);
        } else if (queueToUpdate.waitingtype == "terminated" && queue.queueState == "connected") {
            queue.connectedDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
            sails.log.info("handleQueueTransition: connectedDuration" + queue.connectedDuration);
        } else if (queueToUpdate.waitingtype == "terminated" && (queue.queueState == "entrypoint" || queue.queueState == "finding_op" || queue.queueState == "calling_op")) {
            queue.abandonDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
            sails.log.info("handleQueueTransition: abandonDuration" + queue.abandonDuration);
        } else if (queueToUpdate.waitingtype == "timeout") {
            queue.timeoutDuration = queueToUpdate.current_time - queue.queueEntryTime;
            sails.log.info("handleQueueTransition: timeout" + queue.timeoutDuration);
        } else {
            sails.log.info("handleQueueTransition: Ignored State" + JSON.stringify(queue));
        }

        if (queue.queueState != "dormant") {
            queue.previousState = queue.queueState;
            queue.queueState = queueToUpdate.waitingtype;
            queue.stateTransition.push(queue.queueState);
            sails.log.info("handleQueueTransition: status Swap" + queue.queueState + ":" + queueToUpdate.waitingtype);
        }
        queue.operator_id = queueToUpdate.operator;
        sails.log.info('handleQueueTransition QUEUE Object' + JSON.stringify(queue));
        callback(null, queue);
    } catch (err) {
        sails.log.info('Exception in handleQueueTransition :' + err.message);
        callback(err)
    }
}

function initialiseQueueObject(queueToCreate, callback) {
    var queue = {};
    var stateTransition = [];
    queue.uniqueKey = queueToCreate.custkey;
    queue.queueState = queueToCreate.waitingtype;
    queue.callerInfo = queueToCreate.cli;
    queue.company_id = queueToCreate.company_id;
    queue.operator_id = queueToCreate.operator;
    queue.previousState = queueToCreate.waitingtype;
    queue.country_identifier = queueToCreate.countrycode;
    stateTransition.push(queueToCreate.waitingtype);
    queue.stateTransition = stateTransition;
    queue.startdate = new Date();

    r_queue.insertOrUpdate("uniqueKey", queue, function (err, updated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log.info('r_queue Update Error' + err);
            return callback(err);
        } else {
            sails.log.info('r_queue Updated' + JSON.stringify(updated));
            return callback(null, updated);
        }
    });
}



