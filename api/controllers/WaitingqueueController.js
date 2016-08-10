/**
 * WaitingqueueController
 *
 * @description :: Server-side logic for managing waitingqueues
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var uuid = require('node-uuid');
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
                    if (qfound && qfound.length) {
                        populateQueueObject(qfound[0], queueToUpdate, function (err, queue) {
                            if (err)
                                return callback(err);
                            populateQueueStats(queue, function (err, callstats) {
                                sails.log.info('populateQueueStats UpdateQueueObject' + callstats);
                                if (err)
                                    return callback(err);
                                if (callstats !== null) {
                                    r_responseRate.create(callstats).exec(function (err, updated) {
                                        if (err) { //returns if an error has occured, ie id doesn't exist.
                                            return callback(err);
                                        } else {
                                            sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                                            publishRealtimeQueueStats(updated, function (err, realStats) {
                                                if (err)
                                                    return callback(err);
                                                callback(null, realStats);
                                            });
                                        }
                                    });
                                }
                            });
                            //publishQueueToView(roomId, callstat.interval);
                        });
                    } else {
                        initialiseQueueObject(queueToUpdate, function (err, queue) {
                            if (err)
                                return callback(err);
                            populateQueueStats(queue, function (err, callstats) {
                                sails.log.info('populateQueueStats initialiseQueueObject' + callstats);
                                if (err)
                                    return callback(err);
                                if (callstats !== null) {
                                    r_responseRate.create(callstats).exec(function (err, updated) {
                                        if (err) { //returns if an error has occured, ie id doesn't exist.
                                            return callback(err);
                                        } else {
                                            sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                                            publishRealtimeQueueStats(updated, function (err, realStats) {
                                                if (err)
                                                    return callback(err);
                                                callback(null, realStats);
                                            });
                                        }
                                    });
                                } else {
                                    sails.log.info('EMPTY');
                                }
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


    }, populateQueuedashboard: function (req) {
        var roomId = req.param('name');
        sails.log.info('join request' + roomId);
        sails.log.info('SocketID' + sails.sockets.getId(req));
        sails.sockets.join(req, roomId);
        var queue = {};
        populateQueueStats(queue, function (err, callstats) {
            if (err)
                sails.log.info('populateQueueStats ERROR');
            if (callstats !== null) {
                r_responseRate.create(callstats).exec(function (err, updated) {
                    if (err) { //returns if an error has occured, ie id doesn't exist.
                        sails.log.info('populateQueueStats ERROR');
                    } else {
                        sails.log.info('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                        var lastInterval = new Date().getTime() - interval;
                        publishRealtimeQueueStats(updated, function (err, realStats) {
                            if (err)
                                sails.log.info('populateQueueStats ERROR');
                        });
                        populateMovingAverageStats(lastInterval, function (err, result) {
                            if (err)
                                sails.log.info('populateQueueStats ERROR');
                            sails.log.info('populateMovingAverageStats Result upon launch' + JSON.stringify(result));
                            updateMovingAverageSnapshots(result, function (err, updated) {
                                if (err)
                                    sails.log.info('populateQueueStats ERROR');
                                //sails.log.info('updateMovingAverageSnapshots Result' + JSON.stringify(updated));
                            });
                        });
                        //pupulateTicketGraph();
                    }
                });
                sails.log.info('populateQueueStats SUCCESS');
            } else {
                sails.log.info('populateQueueStats EMPTY');
                for (i = 0; i < country_codes.length; i++) {
                    var callstats = new r_responseRate._model({uuid: uuid.v1(), waitingTime: 0, abandonTime: 0, connectedTime: 0, connectedCount: 0, abandonCount: 0, totalIncomingCalls: 0, totalExternalRedirections: 0, abandonCount_10: 0, abandonCount_30: 0, abandonCount_120: 0, abandonCount_140: 0, timeoutCount: 0, timeoutTime: 0, responseRate: 0, abandonRate: 0, timestamp: 0, totalCallsInQueue: 0, loggedInOperators: 0});
                    callstats.country_identifier = country_codes[i];
                    r_responseRate.create(callstats).exec(function (err, updated) {
                        populateOperatorStats(function (err, operatorStats) {
                            if (err)
                                return callback(err);
                            //Opprf.count({where: {flag: 1, id: {'!': ['1025', '1050']}}}).exec(function (err, operators) {
                            updated.loggedInOperators = operatorStats.totalOperators;
                            updated.incoming = operatorStats.incoming;
                            updated.outgoing = operatorStats.outgoing;
                            updated.idle = operatorStats.idle;
                            updated.blocked = operatorStats.blocked;
                            //callback(null, updated);
                            publishRealtimeQueueStats(updated, function (err, realStats) {
                                if (err)
                                    sails.log.info('populateQueueStats ERROR');
                            });
                        });

                        var lastInterval = new Date().getTime() - interval;
                        populateMovingAverageStats(lastInterval, function (err, result) {
                            if (err)
                                sails.log.info('populateQueueStats ERROR');
                            sails.log.info('populateMovingAverageStats Result upon launch' + JSON.stringify(result));
                            updateMovingAverageSnapshots(result, function (err, updated) {
                                if (err)
                                    sails.log.info('populateQueueStats ERROR');
                                //sails.log.info('updateMovingAverageSnapshots Result' + JSON.stringify(updated));
                            });
                        });
                    });

                }
            }
        });


    }, launchTicketGraph: function (req, callback) { //not used
        pupulateTicketGraph(function (err, ticketResult) {
            if (err)
                return callback(err);
            callback(ticketResult);
        });
    }
};
//moving average
var country_codes = [1, 2];
var interval = 1800000;
var realtimeFetchInterval = 0;
var roomId = "dashboard";
var movingAvg = setInterval(function () {
    var lastInterval = new Date().getTime() - interval;
    //publishRealtimeQueueStats();
    populateMovingAverageStats(lastInterval, function (err, result) {
        if (err) {
            sails.log.info('populateMovingAverageStats Error' + err);
        } else {
            updateMovingAverageSnapshots(result, function (err, updated) {
                if (err)
                    return callback(err);
                //sails.log.info('updateMovingAverageSnapshots Result' + JSON.stringify(updated));
            });
        }
    });

}, interval);
//var testmethod = setInterval(function () {
//    iterateTest(2);
////    var car = {};
////    car.name = 'sdfdsf';
////    var key = 'model';
////    car[key] = 'country_identifier';
////    //sails.log.info('testmethod' + car[key]);
////    var country_identifier = 2;
////    var where_key1 = 'country_identifier';
////    var criteria = {};
////    criteria[where_key1] = {'!': 0};
////    r_responseRate.find(criteria).average(where_key1).exec(function (err, qresult) {
////        sails.log.info('qresult' + qresult[0][where_key1]);
////    });
//
//}, 6000);
//
//function iterateTest(country_identifier) {
//    sails.log.info('iterateTest country + time' + country_identifier);
//    var callstats = new r_responseRate._model({uuid: uuid.v1(),waitingTime:0});
//    sails.log.info('iterateTest' + JSON.stringify(callstats));
//    
////    callstats.dateTime = new Date().getTime();
////    callstats.timestamp = callstats.dateTime;
////    callstats.country_identifier = country_identifier;
////    r_responseRate.create(callstats).exec(function (err, callstats) {
////        if (err){
////            sails.log.info('iterateTest ERROR');
////            return callback(err);
////        }
////        sails.log.info('iterateTest' + JSON.stringify(callstats));
////        callback(null, callstats);
////    });
//}
function populateTicketGraphBasedOnCountry(callback) {
    for (i = 0; i < country_codes.length; i++) {
        extractTicketDetails(country_codes[i], function (err, extractedStats) {
            if (err)
                return callback(err);
            callback(null, extractedStats);
        });
        extractUrgentTicketDetails(country_codes[i], function (err, extractedStats) {
            if (err)
                return callback(err);
            callback(null, extractedStats);
        });
    }
}
function extractTicketDetails(country_identifier, callback) {
    ticket_count_by_enquiry_type.find({country: country_identifier}).exec(function (err, types) {
        if (err)
            return callback(err);
        sails.log.info('extractTicketDetails' + JSON.stringify(types));
        sails.sockets.broadcast(roomId, 'ticketClassification', types);
        callback(null, types);
    });

}
function extractUrgentTicketDetails(country_identifier, callback) {
    ticket_count_by_enquiry_type.find({country: country_identifier}).sum('urgent').exec(function (err, urgent) {
        if (err)
            return callback(err);

        var result = {};
        result.country = country_identifier;
        result.urgent = urgent;
        sails.log.info('extractUrgentTicketDetails' + JSON.stringify(result));
        sails.sockets.broadcast(roomId, 'urgentTickets', result);
        callback(null, result);
    });

}

function pupulateTicketGraph(callback) {
    populateTicketGraphBasedOnCountry(function (err, types) {
        if (err)
            return callback(null);
        sails.log.info('populateTicketGraphBasedOnCountry Result' + JSON.stringify(types));
        callback(null, types);
    });
}


function populateMovingAverageStats(lastInterval, callback) {
    try {
        for (i = 0; i < country_codes.length; i++) {
            extractMovingAverageStats(country_codes[i], lastInterval, function (err, extractedStats) {
                if (err)
                    return callback(err);
                callback(null, extractedStats);
            });
        }
    } catch (err) {
        sails.log.info('exception occured:populateMovingAverageStats', err.message);
        callback(new Error('exception occured:populateMovingAverageStats'));
    }
}



function extractMovingAverageStats(country_identifier, lastInterval, callback) {
    var mv_rrate = new mv_responseRate._model({uuid: uuid.v1(), waitingTime: 0, abandonTime: 0, connectedTime: 0, connectedCount: 0, abandonCount: 0, totalIncomingCalls: 0, totalExternalRedirections: 0, abandonCount_10: 0, abandonCount_30: 0, abandonCount_120: 0, abandonCount_140: 0, timeoutCount: 0, timeoutTime: 0, responseRate: 0, abandonRate: 0, timestamp: 0, totalCallsInQueue: 0, loggedInOperators: 0});
    mv_rrate.timestamp = new Date().getTime();
    mv_rrate.country_identifier = country_identifier;
    var key = ['waitingTime', 'abandonTime', 'connectedTime', 'connectedCount', 'abandonCount', 'totalIncomingCalls', 'timeoutCount', 'timeoutTime', 'responseRate', 'abandonRate', 'totalCallsInQueue', 'loggedInOperators', 'totalExternalRedirections'];
    extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[0], function (err, mv_rrate) {
        //sails.log.info("extractAverageValuesForEntities return" + JSON.stringify(mv_rrate));
        if (err)
            return callback(err);
        extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[1], function (err, mv_rrate) {
            if (err)
                return callback(err);
            extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[2], function (err, mv_rrate) {
                if (err)
                    return callback(err);
                extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[3], function (err, mv_rrate) {
                    if (err)
                        return callback(err);
                    extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[4], function (err, mv_rrate) {
                        if (err)
                            return callback(err);
                        extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[5], function (err, mv_rrate) {
                            if (err)
                                return callback(err);
                            extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[6], function (err, mv_rrate) {
                                if (err)
                                    return callback(err);
                                extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[7], function (err, mv_rrate) {
                                    if (err)
                                        return callback(err);
                                    extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[8], function (err, mv_rrate) {
                                        if (err)
                                            return callback(err);
                                        extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[9], function (err, mv_rrate) {
                                            if (err)
                                                return callback(err);
                                            extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[10], function (err, mv_rrate) {
                                                if (err)
                                                    return callback(err);
                                                extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[11], function (err, mv_rrate) {
                                                    if (err)
                                                        return callback(err);
                                                    extractAverageValuesForEntities(country_identifier, lastInterval, mv_rrate.timestamp, mv_rrate, key[12], function (err, mv_rrate) {
                                                        if (err)
                                                            return callback(err);
                                                        callback(null, mv_rrate);
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

function extractAverageValuesForEntities(country_identifier, lastInterval, currentTime, mv_rrate, key, callback) {
    var where = {};
    where.timestamp = {'>': lastInterval, '<': currentTime};
    where.country_identifier = country_identifier;
    where[key] = {'!': 0};
    //sails.log.info("extractAverageValuesForEntities query" + JSON.stringify(where));
    r_responseRate.find(where).average(key).exec(function (err, rrate) {
        if (err)
            return callback(err);
        //sails.log.info("r_responseRate sum@@@" + key + ":" + JSON.stringify(rrate));
        if (rrate[0] !== undefined & !isNaN(rrate[0][key])) {
            mv_rrate[key] = rrate[0][key];
            callback(null, mv_rrate);
        } else {
            //continue
            mv_rrate[key] = 0;
            callback(null, mv_rrate);
        }
    });
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
            extractQueueStatsBasedOnCountry(function (err, callstatus) {
                if (err)
                    return callback(err);
                if (callstatus !== null) {
                    //get the other details.
                    populateOperatorStats(function (err, operatorStats) {
                        if (err)
                            return callback(err);
                        //Opprf.count({where: {flag: 1, id: {'!': ['1025', '1050']}}}).exec(function (err, operators) {
                        callstatus.loggedInOperators = operatorStats.totalOperators;
                        callstatus.incoming = operatorStats.incoming;
                        callstatus.outgoing = operatorStats.outgoing;
                        callstatus.idle = operatorStats.idle;
                        callstatus.blocked = operatorStats.blocked;
                        callback(null, callstatus);
                    });
                } else {
                    //empty snapshot
                    return callback(null, null)
                }
            });
        }
    } catch (err) {
        sails.log.info('exception occured populateQueueStats:', err.message);
    }
}
function extractQueueStatsBasedOnCountry(callback) {
    for (i = 0; i < country_codes.length; i++) {
        extractQueueStatsFromQueue(country_codes[i], function (err, extractedStats) {
            if (err) {
                return callback(err);
            } else {
                sails.log.info("extractQueueStatsFromQueue: successful" + JSON.stringify(extractedStats));
                callback(null, extractedStats);
            }
        });
    }
}

function extractQueueStatsFromQueue(country_identifier, callback) {
    sails.log.info('extractQueueStatsFromQueue input:', country_identifier);
    r_queue.find({where: {country_identifier: country_identifier, queueState: {'!': 'dormant'}}}).exec(function (err, qresult) {
        if (err)
            return callback(err);
        if (qresult.length == 0) {
            //ignore
            return callback(null, null);
        } else {
            var callstats = new r_responseRate._model({uuid: uuid.v1(), waitingTime: 0, abandonTime: 0, connectedTime: 0, connectedCount: 0, abandonCount: 0, totalIncomingCalls: 0, totalExternalRedirections: 0, abandonCount_10: 0, abandonCount_30: 0, abandonCount_120: 0, abandonCount_140: 0, timeoutCount: 0, timeoutTime: 0, responseRate: 0, abandonRate: 0, timestamp: 0, totalCallsInQueue: 0, loggedInOperators: 0});
            callstats.timestamp = new Date().getTime();
            callstats.totalIncomingCalls = qresult.length;
            callstats.country_identifier = country_identifier;
            for (i = 0; i < qresult.length; i++) {
                var queue = qresult[i];
                sails.log.info("extractQueueStatsFromQueue:" + JSON.stringify(queue));
                switch (queue.queueState) {
                    case "timeout":
                        callstats.timeoutCount++;
                        callstats.timeoutTime = (callstats.timeoutTime + queue.timeoutDuration);
                        break;
                    case "entrypoint_external":
                        callstats.totalExternalRedirections++;
                        break;
                    case "connected":
                        callstats.connectedCount++;
                        callstats.waitingTime = (callstats.waitingTime + queue.waitingDuration);
                        sails.log.info("callstats.waitingTime" + callstats.waitingTime);
                        break;
                    case "calling_op":
                        callstats.totalCallsInQueue++;
                        break;
                    case "finding_op":
                        callstats.totalCallsInQueue++;
                        break;
                    case "terminated":
                        if ((queue.previousState === "finding_op" || queue.previousState === "calling_op")) {
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

                        } else if (queue.previousState === "connected") {
                            callstats.connectedTime = (callstats.connectedTime + queue.connectedDuration);
                        } else {
                            //Not sure.
                        }
                        //Save to mysql
                        sails.log.info("extractQueueStatsFromQueue: End of Queue life" + JSON.stringify(queue));
                        queue.queueState = "dormant";
                        callstats.totalIncomingCalls = callstats.totalIncomingCalls - 1;
                        updateQueue(queue, function (err, updatedQueue) {
                            if (err)
                                return callback(err);
                            sails.log.info("extractQueueStatsFromQueue: End of Queue life updateQueue" + updatedQueue.queueState);
                            mysql_queue.create(updatedQueue).exec(function (err, qUpdated) {
                                if (err) { //returns if an error has occured, ie id doesn't exist.
                                    sails.log.info('mysql_queue Update Error' + err);
                                    return callback(err);
                                } else {
                                    sails.log.info('mysql_queue Update' + JSON.stringify(qUpdated));
                                }
                            });

                        });
                        break;
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
            sails.log.info("Callstats extractQueueStatsFromQueue " + JSON.stringify(callstats));
            callback(null, callstats);
        }


    });
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
    mv_responseRate.create(mv_avg).exec(function (err, mvUpdated) {
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
            callback(null, mvUpdated);
        }
    });
}

function publishMovingAverageStats(mvAverage, callback) {
    var currentTime = new Date().getTime();
    var previousInterval = currentTime - 86400000;
    sails.log.info('publishMovingAverageStats' + JSON.stringify(mvAverage));
    mv_responseRate.find({timestamp: {'>': previousInterval, '<': currentTime}, country_identifier: mvAverage.country_identifier}).sort('timestamp ASC').exec(function (err, qresult) {
        if (err)
            return callback(err);
        //sails.log.info('publishMovingAverageStats Array List' + JSON.stringify(qresult));
        var result = {};
        result.country_identifier = mvAverage.country_identifier;
        result.data = qresult;
        sails.log.info('publishMovingAverageStats Array List' + JSON.stringify(result));
        sails.sockets.broadcast(roomId, 'movingSystemStats', result);
        callback(null, qresult);
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
        callback(null, ticketResult);
    });
//    r_responseRate.find({timestamp: {'>': previousInterval, '<': currentTime}}).exec(function (err, qresult) {
//        if (err)
//            return callback(err);
//        sails.sockets.broadcast(roomId, 'realtimeSystemStats', qresult);
//        callback(null, qresult);
//    });
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
        switch (queueToUpdate.waitingtype) {
            case 'finding_op':
                queue.queueEntryTime = queueToUpdate.current_time;
                sails.log.info("handleQueueTransition: queueEntryTime" + queue.queueEntryTime);
                break;
            case 'connected':
                queue.waitingDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
                queue.callconnectedTime = queueToUpdate.current_time;
                sails.log.info("handleQueueTransition: waitingDuration" + queue.waitingDuration);
                break;
            case 'terminated':
                if (queue.queueState == "connected") {
                    queue.connectedDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
                    sails.log.info("handleQueueTransition: connectedDuration" + queue.connectedDuration);
                }
                if (queue.queueState == "entrypoint" || queue.queueState == "finding_op" || queue.queueState == "calling_op") {
                    queue.abandonDuration = queueToUpdate.current_time - queueToUpdate.previous_state_time;
                    sails.log.info("handleQueueTransition: abandonDuration" + queue.abandonDuration);
                }
                break;
            case 'timeout':
                queue.timeoutDuration = queueToUpdate.current_time - queue.queueEntryTime;
                sails.log.info("handleQueueTransition: timeout" + queue.timeoutDuration);
                break;

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
    var queue = new r_queue._model({uniqueKey: queueToCreate.custkey});
    var stateTransition = [];
    queue.queueState = queueToCreate.waitingtype;
    queue.callerInfo = queueToCreate.cli;
    queue.company_id = queueToCreate.company_id;
    queue.operator_id = queueToCreate.operator;
    queue.previousState = queueToCreate.waitingtype;
    queue.country_identifier = queueToCreate.countrycode;
    stateTransition.push(queueToCreate.waitingtype);
    queue.stateTransition = stateTransition;
    queue.startdate = new Date();

    r_queue.create(queue).exec(function (err, updated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log.info('r_queue Update Error' + err);
            return callback(err);
        } else {
            sails.log.info('r_queue Updated' + JSON.stringify(updated));
            return callback(null, updated);
        }
    });
}



