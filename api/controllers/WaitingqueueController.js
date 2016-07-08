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
            sails.sockets.broadcast(roomId, 'waitingqueue', queue);
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

    }
};
//moving average
var movingAvg = setInterval(function () {
    var rrate = {};
    rrate.dateTime = new Date().getTime();
    lastInterval = rrate.dateTime - 300000;
    mv_responseRate.insertOrUpdate("dateTime", rrate, function (err, callstats) {
        sails.log("Initialised MV RR object" + JSON.stringify(callstats));
        r_responseRate.find({'dateTime': {'>': callstats.dateTime,'<':callstats.dateTime-300000}}).exec(function (err, qresult) {
            callstats.instances = qresult.length;
            for (i = 0; i < qresult.length; i++) {
                var queue = qresult[i];
                sails.log("populateQueueStats:" + JSON.stringify(queue));
                if (queue.previousState == "timeout" && queue.queueState == "terminated") {
                    callstats.timeoutCount++;
                    callstats.timeoutTime = (callstats.timeoutTime + queue.timeoutDuration);
                    queue.previousState = "dormant";
                    //update queue to dormant.
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
                    callstats.abandonRate = (callstats.abandonCount / callstats.totalIncomingCalls) * 100;
                    queue.previousState = "dormant";
                    updateQueue(queue);

                } else if (queue.previousState == "calling_op" && queue.queueState == "connected") {
                    callstats.connectedCount++;
                    callstats.waitingTime = (callstats.waitingTime + queue.waitingDuration);
                    callstats.responseRate = (callstats.connectedCount / (callstats.connectedCount + callstats.timeoutCount)) * 100;

                } else if (queue.previousState == "connected" && queue.queueState == "terminated") {
                    callstats.connectedTime = (callstats.connectedTime + queue.connectedDuration);
                    queue.previousState = "dormant";
                    updateQueue(queue);
                } else {
                    sails.log("populateQueueStats Ignored transition:" + queue.previousState + ":" + queue.queueState);
                }
            }
            if (callstats.timeoutCount != 0)
                callstats.timeoutTime = (callstats.timeoutTime) / callstats.timeoutCount;
            if (callstats.abandonCount != 0)
                callstats.abandonTime = (callstats.abandonTime) / callstats.abandonCount;
            if (callstats.connectedCount != 0)
                callstats.waitingTime = (callstats.waitingTime) / callstats.connectedCount;
            if (callstats.connectedCount != 0)
                callstats.connectedTime = (callstats.connectedTime) / callstats.connectedCount;
            sails.log("Callstats" + JSON.stringify(callstats));

            callback(callstats);
        });
    });
}, 300000);
function populateQueueStats(queue, callback) {
    if (queue != undefined) {
        var rrate = {};
        rrate.dateTime = new Date().getTime();
        r_responseRate.insertOrUpdate("dateTime", rrate, function (err, callstats) {
            sails.log("Initialised RR object" + JSON.stringify(callstats));
            r_queue.find({previousState: {'!': 'dormant'}}).exec(function (err, qresult) {
                callstats.totalIncomingCalls = qresult.length;
                for (i = 0; i < qresult.length; i++) {
                    var queue = qresult[i];
                    sails.log("populateQueueStats:" + JSON.stringify(queue));
                    if (queue.previousState == "timeout" && queue.queueState == "terminated") {
                        callstats.timeoutCount++;
                        callstats.timeoutTime = (callstats.timeoutTime + queue.timeoutDuration);
                        queue.previousState = "dormant";
                        //update queue to dormant.
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
                        callstats.abandonRate = (callstats.abandonCount / callstats.totalIncomingCalls) * 100;
                        queue.previousState = "dormant";
                        updateQueue(queue);

                    } else if (queue.previousState == "calling_op" && queue.queueState == "connected") {
                        callstats.connectedCount++;
                        callstats.waitingTime = (callstats.waitingTime + queue.waitingDuration);
                        callstats.responseRate = (callstats.connectedCount / (callstats.connectedCount + callstats.timeoutCount)) * 100;

                    } else if (queue.previousState == "connected" && queue.queueState == "terminated") {
                        callstats.connectedTime = (callstats.connectedTime + queue.connectedDuration);
                        queue.previousState = "dormant";
                        updateQueue(queue);
                    } else {
                        sails.log("populateQueueStats Ignored transition:" + queue.previousState + ":" + queue.queueState);
                    }
                }
                if (callstats.timeoutCount != 0)
                    callstats.timeoutTime = (callstats.timeoutTime) / callstats.timeoutCount;
                if (callstats.abandonCount != 0)
                    callstats.abandonTime = (callstats.abandonTime) / callstats.abandonCount;
                if (callstats.connectedCount != 0)
                    callstats.waitingTime = (callstats.waitingTime) / callstats.connectedCount;
                if (callstats.connectedCount != 0)
                    callstats.connectedTime = (callstats.connectedTime) / callstats.connectedCount;
                sails.log("Callstats" + JSON.stringify(callstats));

                callback(callstats);
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
        queue.timeoutDuration = (currentTime.getTime() - queue.startdate.getTime()) / 1000;
    } else if ((queue.queueState == "entrypoint" || queue.queueState == "finding_op" || queue.queueState == "calling_op") && queueToUpdate.waitingtype == "terminated") {
        queue.abandonDuration = (currentTime.getTime() - queue.startdate.getTime()) / 1000;
    } else if (queue.queueState == "calling_op" && queueToUpdate.waitingtype == "connected") {
        queue.waitingDuration = (currentTime.getTime() - queue.startdate.getTime()) / 1000;
    } else if (queue.queueState == "connected" && queueToUpdate.waitingtype == "terminated") {
        queue.connectedDuration = (currentTime.getTime() - queue.startdate.getTime()) / 1000;
    } else {
        sails.log("handleQueueTransition Ignored transition:" + queue.queueState + ":" + queueToUpdate.waitingtype);
    }
    queue.previousState = queue.queueState;
    queue.queueState = queueToUpdate.waitingtype;
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



