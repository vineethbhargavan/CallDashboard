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
            sails.log('waitingqueue to' + roomId);
            sails.log('queue' + queue);
            //sails.sockets.broadcast(roomId, 'waitingqueue', queue);
        });
    }, updateQueueObject: function (roomId, event) {
        //Update Quue Object
        // Generate Queue Stats.
        var queueToUpdate = event;
        r_queue.find({uniqueKey: queueToUpdate.custkey}).exec(function (err, qfound) {
            if (qfound[0] != undefined) {
                populateQueueObject(qfound[0], queueToUpdate, function (queue) {
                    populateQueueStats(queue, function (callstats) {
                        r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                            if (err) { //returns if an error has occured, ie id doesn't exist.
                                sails.log('r_responseRate Update Error' + err);
                            } else {
                                sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                            }
                        });
                    });
                    //publishQueueToView(roomId, callstat.interval);
                });
            } else {
                initialiseQueueObject(queueToUpdate, function (queue) {
                    populateQueueStats(queue, function (callstats) {
                        r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                            if (err) { //returns if an error has occured, ie id doesn't exist.
                                sails.log('r_responseRate Update Error' + err);
                            } else {
                                sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                            }
                        });
                    });
                });
            }
        });

    }, launchQueuedashboard: function (req, resp) {
        var queue = {};
        populateQueueStats(queue, function (callstats) {
            r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
                if (err) { //returns if an error has occured, ie id doesn't exist.
                    sails.log('r_responseRate Update Error' + err);
                } else {
                    sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                    var rrate = {};
                    rrate.dateTime = new Date().getTime();
                    lastInterval = rrate.dateTime - interval;
                    populateMovingAverageStats(rrate, lastInterval);
                    return resp.view('queueStats', {
                        roomId: 'dashboard'
                    });
                }
            });
        });


    }
};
//moving average
var interval = 60000;
var roomId = "dashboard";
var movingAvg = setInterval(function () {
    //var display_entities = ['waitingTime', 'abandonTime', 'connectedTime', 'connectedCount', 'abandonCount', 'totalIncomingCalls', 'abandonCount_10', 'abandonCount_30', 'abandonCount_120', 'abandonCount_140', 'timeoutCount', 'timeoutTime', 'responseRate', 'abandonRate'];
//    r_queue.find({queueState: {'!': 'dormant'}}).exec(function (err, qresult) {
//        if (qresult[0] != undefined) {
//            populateQueueStats(qresult[0], function (callstats) {
//                r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
//                    if (err) { //returns if an error has occured, ie id doesn't exist.
//                        sails.log('r_responseRate Update Error' + err);
//                    } else {
//                        sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
//                        var rrate = {};
//                        rrate.dateTime = new Date().getTime();
//                        lastInterval = rrate.dateTime - interval;
//                        populateMovingAverageStats(rrate, lastInterval);
//                    }
//                });
//            });
//        } else {
//            var rrate = {};
//            rrate.dateTime = new Date().getTime();
//            lastInterval = rrate.dateTime - interval;
//            populateMovingAverageStats(rrate, lastInterval);
//        }
//
//    });
    var queue = {};
    populateQueueStats(queue, function (callstats) {
        r_responseRate.insertOrUpdate("dateTime", callstats, function (err, updated) {
            if (err) { //returns if an error has occured, ie id doesn't exist.
                sails.log('r_responseRate Update Error' + err);
            } else {
                sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
                var rrate = {};
                rrate.dateTime = new Date().getTime();
                lastInterval = rrate.dateTime - interval;
                populateMovingAverageStats(rrate, lastInterval);
            }
        });
    });

}, interval);

//Need to improve the below function
function populateMovingAverageStats(rrate, lastInterval) {
    mv_responseRate.insertOrUpdate("dateTime", rrate, function (err, mv_rrate) {
        sails.log("To mv_responseRate" + mv_rrate.dateTime);
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, waitingTime: {'!': 0}}).average('waitingTime').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(waitingTime) " + JSON.stringify(rrate));
            sails.log("r_responseRate sum@@@(waitingTime) " + rrate[0].waitingTime);
            if (rrate[0] !== undefined & !isNaN(rrate[0].waitingTime)) {
                mv_rrate.waitingTime = rrate[0].waitingTime;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonTime: {'!': 0}}).average('abandonTime').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(abandonTime) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].abandonTime)) {
                mv_rrate.abandonTime = rrate[0].abandonTime;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, connectedTime: {'!': 0}}).average('connectedTime').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(connectedTime) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].connectedTime)) {
                mv_rrate.connectedTime = rrate[0].connectedTime;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, connectedCount: {'!': 0}}).average('connectedCount').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(connectedCount) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].connectedCount)) {
                mv_rrate.connectedCount = rrate[0].connectedCount;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonCount: {'!': 0}}).average('abandonCount').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(abandonCount) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].abandonCount)) {
                mv_rrate.abandonCount = rrate[0].abandonCount;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, totalIncomingCalls: {'!': 0}}).average('totalIncomingCalls').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(totalIncomingCalls) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].totalIncomingCalls)) {
                mv_rrate.totalIncomingCalls = rrate[0].totalIncomingCalls;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, timeoutCount: {'!': 0}}).average('timeoutCount').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(timeoutCount) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].timeoutCount)) {
                mv_rrate.timeoutCount = rrate[0].timeoutCount;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, timeoutTime: {'!': 0}}).average('timeoutTime').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(timeoutTime) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].timeoutTime)) {
                mv_rrate.timeoutTime = rrate[0].timeoutTime;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, responseRate: {'!': 0}}).average('responseRate').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(responseRate) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].responseRate)) {
                mv_rrate.responseRate = rrate[0].responseRate;
                updateMovingAverageSnapshots(mv_rrate);
            }

        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, abandonRate: {'!': 0}}).average('abandonRate').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(abandonRate) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].abandonRate)) {
                mv_rrate.abandonRate = rrate[0].abandonRate;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, totalCallsInQueue: {'!': 0}}).average('totalCallsInQueue').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(totalCallsInQueue) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].totalCallsInQueue)) {
                mv_rrate.totalCallsInQueue = rrate[0].totalCallsInQueue;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });
        r_responseRate.find({timestamp: {'>': lastInterval, '<': mv_rrate.dateTime}, loggedInOperators: {'!': 0}}).average('loggedInOperators').exec(function (err, rrate) {
            sails.log("r_responseRate sum@@@(loggedInOperators) " + JSON.stringify(rrate));
            if (rrate[0] !== undefined & !isNaN(rrate[0].loggedInOperators)) {
                mv_rrate.loggedInOperators = rrate[0].loggedInOperators;
                updateMovingAverageSnapshots(mv_rrate);
            }
        });


    });
}

//function populateMovingAverageEntity(entity, fromInterval, toInterval) {
//    var expression = 
//    r_responseRate.find({where :{entity.toString():{'!':0}}}).average(entity).exec(function (err, rrate) {
//        sails.log("r_responseRate sum: " + entity + ":" + JSON.stringify(rrate));
//    });
//    r_responseRate.find({timestamp: {'>': fromInterval, '<': toInterval}, totalIncomingCalls: {'!': 0}}).average('totalIncomingCalls').exec(function (err, rrate) {
//        sails.log("r_responseRate sum#############(totalIncomingCalls) " + JSON.stringify(rrate));
//    });
//}

function populateQueueStats(queue, callback) {
    if (queue != undefined) {
        var rrate = {};
        rrate.dateTime = new Date().getTime();
        rrate.timestamp = rrate.dateTime;
        r_responseRate.insertOrUpdate("dateTime", rrate, function (err, callstats) {
            sails.log("Initialised RR object" + JSON.stringify(callstats));
            Opprf.count({where: {flag: 1}}).exec(function (err, operators) {
                callstats.loggedInOperators = operators;
                r_queue.find({queueState: {'!': 'dormant'}}).exec(function (err, qresult) {
                    //callstats.totalIncomingCalls = qresult.length;
                    for (i = 0; i < qresult.length; i++) {
                        var queue = qresult[i];
                        sails.log("populateQueueStats:" + JSON.stringify(queue));
                        if (queue.queueState != "entrypoint" && queue.queueState != "terminated" && queue.queueState != "connected") {
                            callstats.totalCallsInQueue++;
                        }
                        if (queue.queueState != "terminated") {
                            callstats.totalIncomingCalls++;
                        }
                        if (queue.previousState == "timeout" && queue.queueState == "terminated") {
                            callstats.timeoutCount++;
                            callstats.timeoutTime = (callstats.timeoutTime + queue.timeoutDuration);
                            //queue.previousState = queue.queueState;
                            queue.queueState = "dormant";
                            updateQueue(queue);

                        } else if ((queue.previousState == "entrypoint" || queue.previousState == "finding_op" || queue.previousState == "calling_op") && queue.queueState == "terminated") {
                            callstats.abandonCount++;
                            if (queue.abandonDuration > 140) {
                                callstats.abandonCount_140++;
                            } else if (queue.abandonDuration > 30 && queue.abandonDuration < 141) {
                                callstats.abandonCount_120++;
                            } else if (queue.abandonDuration > 10 && queue.abandonDuration < 31) {
                                callstats.abandonCount_30++;
                            } else if (queue.abandonDuration < 11) {
                                callstats.abandonCount_10++;
                            }
                            callstats.abandonTime = (callstats.abandonTime + queue.abandonDuration);
                            //callstats.abandonRate = (callstats.abandonCount / callstats.totalIncomingCalls) * 100;
                            //queue.previousState = queue.queueState;
                            queue.queueState = "dormant";
                            updateQueue(queue);

                        } else if (queue.queueState == "connected") {
                            callstats.connectedCount++;
                            callstats.waitingTime = (callstats.waitingTime + queue.waitingDuration);
                            //callstats.responseRate = (callstats.connectedCount / (callstats.connectedCount + callstats.timeoutCount)) * 100;

                        } else if (queue.previousState == "connected" && queue.queueState == "terminated") {
                            callstats.connectedTime = (callstats.connectedTime + queue.connectedDuration);
                            //queue.previousState = queue.queueState;
                            queue.queueState = "dormant";
                            updateQueue(queue);
                        } else {
                            sails.log("populateQueueStats Ignored transition:" + queue.previousState + ":" + queue.queueState);
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
                    sails.log("Callstats" + JSON.stringify(callstats));
                    //sails.sockets.broadcast(roomId, 'callStats', callstats);
//                Opprf.count({where: {flag: 1}}).exec(function (err, operators) {
//                    sails.log("r_responseRate count (operators) " + JSON.stringify(operators));
//                    if (operators !== undefined) {
//                        callstats.loggedInOperators = operators;
//                        callback(callstats);
//                    }
//                });
                    callback(callstats);

                });
            });
        });
    }
}

function updateQueue(queue) {
    r_queue.insertOrUpdate("uniqueKey", queue, function (err, qUpdated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log('r_queue Update Error' + err);
        } else {
            sails.log('r_queue Updated' + JSON.stringify(qUpdated));
        }
    });
}

function updateMovingAverageSnapshots(mv_avg) {
    mv_responseRate.insertOrUpdate("dateTime", mv_avg, function (err, mvUpdated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log('mv_responseRate Update Error' + err);
        } else {
            sails.log('mv_responseRate Updated' + JSON.stringify(mvUpdated));
            sails.sockets.broadcast(roomId, 'callStats', mvUpdated);
            publishMovingAverageStats(mvUpdated);
        }
    });
}

function publishMovingAverageStats(mvAverage) {
    mv_responseRate.find().exec(function (err, qresult) {
        sails.sockets.broadcast(roomId, 'movingcallStats', qresult);
    });
}
//function getCallStats(callback) {
//    var currentTime = new Date();
//    var interval = currentTime.getDate() + "_" + currentTime.getHours() + "_" + ((Math.floor(currentTime.getMinutes() / 5)) * 5);
//    sails.log('getCallStats interval' + interval);
//    r_queue.find({queueState: {'!': 'terminated'}}).exec(function (err, qresult) {
//        sails.log('R_Queue Objec Total Calls' + qresult.length);
//        r_responseRate.find({interval: interval}).exec(function (err, result) {
//            sails.log('r_responseRate query Result' + JSON.stringify(result[0]));
//            var rrate = result[0];
//            if (rrate == undefined) {
//                var rr = {};
//                rr.interval = interval;
//                rr.totalIncomingCalls = qresult.length;
//                rr.dateTime = new Date();
//                rrate = rr;
//            } else {
//                rrate.totalIncomingCalls = qresult.length;
//            }
//            sails.log('getCallStats before update' + JSON.stringify(rrate));
//            r_responseRate.insertOrUpdate("interval", rrate, function (err, updated) {
//                if (err) { //returns if an error has occured, ie id doesn't exist.
//                    sails.log('r_responseRate Update Error' + err);
//                } else {
//                    sails.log('r_responseRate Updated getCallStats' + JSON.stringify(updated));
//                    callback(updated);
//                }
//            });
//
//
//        });
//
//    });
//
//}

//function publishQueueToView(roomId, interval) {
//    r_queue.find({queueState: {'!': 'terminated'}}).exec(function (err, qresult) {
//        sails.log('R_Queue Objec publish' + qresult);
//        sails.sockets.broadcast(roomId, 'waitingqueue', qresult);
//    });
//    r_responseRate.find({'interval': interval}).exec(function (err, rrCurrent) {
//        sails.log('r_responseRate Current' + rrCurrent[0]);
//        sails.sockets.broadcast(roomId, 'currentResponseRate', rrCurrent[0]);
//    });
//    r_responseRate.find().exec(function (err, rrHistorical) {
//        sails.log('r_responseRate Historical' + rrHistorical);
//        sails.sockets.broadcast(roomId, 'historicalResponseRate', rrHistorical);
//    });
//}

function populateQueueObject(queue, queueToUpdate, callback) {
    handleQueueTransition(queue, queueToUpdate, function (qresult) {
        sails.log("handleQueueTransition callback queue result" + qresult.queueState);
        r_queue.insertOrUpdate("uniqueKey", qresult, function (err, qUpdated) {
            if (err) { //returns if an error has occured, ie id doesn't exist.
                sails.log('r_queue Update Error' + err);
            } else {
                sails.log('r_queue Updated' + JSON.stringify(qUpdated));
                callback(qUpdated);
            }
        });
    });

}
function handleQueueTransition(queue, queueToUpdate, callback) {
    var currentTime = new Date();
    sails.log("handleQueueTransition:" + queue.queueState + ":" + queueToUpdate.waitingtype);
    if (queue.queueState == "timeout" && queueToUpdate.waitingtype == "terminated") {
        queue.timeoutDuration = (currentTime.getTime() - queue.queueEntryTime.getTime()) / 1000;
    } else if ((queue.queueState == "finding_op" || queue.queueState == "calling_op") && queueToUpdate.waitingtype == "terminated") {
        queue.abandonDuration = (currentTime.getTime() - queue.queueEntryTime.getTime()) / 1000;
    } else if (queue.queueState == "calling_op" && queueToUpdate.waitingtype == "connected") {
        queue.waitingDuration = (currentTime.getTime() - queue.queueEntryTime.getTime()) / 1000;
        queue.callconnectedTime = new Date();
    } else if (queue.queueState == "connected" && queueToUpdate.waitingtype == "terminated") {
        queue.connectedDuration = (currentTime.getTime() - queue.callconnectedTime.getTime()) / 1000;
    } else if (queue.queueState == "entrypoint" && queueToUpdate.waitingtype == "finding_op") {
        queue.queueEntryTime = new Date();
    } else {
        sails.log("handleQueueTransition Ignored transition:" + queue.queueState + ":" + queueToUpdate.waitingtype);
    }

    if (queue.queueState != "dormant") {
        queue.previousState = queue.queueState;
        queue.queueState = queueToUpdate.waitingtype;
    }
    queue.operator_id = queueToUpdate.operator;
    sails.log('handleQueueTransition QUEUE Object' + JSON.stringify(queue));
    callback(queue);
}

function initialiseQueueObject(queueToCreate, callback) {
    var queue = {};
    queue.uniqueKey = queueToCreate.custkey;
    queue.queueState = queueToCreate.waitingtype;
    queue.callerInfo = queueToCreate.cli;
    queue.company_id = queueToCreate.company_id;
    queue.operator_id = queueToCreate.operator;
    queue.previousState = queueToCreate.waitingtype;
    queue.startdate = new Date();

    r_queue.insertOrUpdate("uniqueKey", queue, function (err, updated) {
        if (err) { //returns if an error has occured, ie id doesn't exist.
            sails.log('r_queue Update Error' + err);
        } else {
            sails.log('r_queue Updated' + JSON.stringify(updated));
            callback(updated);
        }
    });
}



