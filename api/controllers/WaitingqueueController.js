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
    }, publishMappedCompany: function (roomId, payload) {
        sails.log('publishMappedCompany _room' + roomId);
        //set Room ID globally instead of carrying it along in all the functions
        var payload = payload;

        //var roomId = roomId
        getWaitingQueueDetails(roomId, function (wQueueResult, roomId) {
            //var wQueueList =[];
            sails.log('publishMappedCompany _room2' + roomId);
            sails.log('getWaitingQueueDetails RESUKT' + wQueueResult.length);

            if (wQueueResult != undefined && wQueueResult.length != 0) {
                for (i = 0; i < wQueueResult.length; i++) {
                    sails.log('mapping name_id' + wQueueResult[i].company_id);
                    queue_temp = wQueueResult[i];
                    getCompanyNameFromId(queue_temp, function (compResult, queue_temp) {
                        var queue = {};
                        var currentTime = new Date();
                        sails.log('Current TIME' + currentTime);
                        queue.uniqueKey = queue_temp.custkey;
                        queue.queueState = queue_temp.waitingtype;
                        queue.callerInfo = queue_temp.cli;
                        queue.companyName = compResult[0].brand_name;
                        queue.operatorName = queue_temp.operator;
                        queue.startdate = new Date(queue_temp.startdate);
                        sails.log('Start Date ' + queue.startdate);
                        queue.duration = (currentTime.getTime() - queue.startdate.getTime()) / 1000;
                        sails.log('DURATION ' + queue.duration);
                        getOperatorNameFronID(queue, function (opName, queue) {
                            if (opName != undefined) {
                                queue.operatorName = opName.name;
                            }

                            //sails.sockets.broadcast('operator', 'waitingqueue', queue); - Not an array at this point
                            updateQueue(queue, function (result) {
                                sails.log('R_Queue Objec Created' + result);

                                r_queue.find().exec(function (err, qresult) {
                                    sails.log('R_Queue Objec publish' + qresult);
                                    sails.sockets.broadcast('operator', 'waitingqueue', qresult);
                                });
//                                getResponseRate(roomId, function (responseRate, roomId) {
//                                    sails.log('getResponseRate Result' + JSON.stringify(responseRate));
//                                    sails.sockets.broadcast(roomId, 'callStats', responseRate);
//                                });
                            });


                        });


                        //sails.sockets.broadcast('operator', 'waitingqueue', queue);

                        //wQueueList.push(queue);
                        sails.log('wQueueResult' + JSON.stringify(queue));
                        //callback(queue);
                    });
                }

            } else {
                sails.log("Empty Queue");
                sails.sockets.broadcast('operator', 'waitingqueue', undefined);
            }
        });

    }, generateQueueStats: function (roomId, payload_trig) {
        sails.log('generateQueueStats _room' + roomId);
        sails.log('generateQueueStats _room' + JSON.stringify(payload_trig));
        //check if the key is found.
        // if found - update the stats
        // else create a new object.
        if (payload_trig.operation != "DELETE") {
            getWaitingQueueDetailsFromCustkey(payload_trig.custkey, payload_trig, function (queueDetails, payload_trig) {
                sails.log("Queue - From custkey from waitingqueue tbale" + queueDetails);
                if (queueDetails != undefined) {
                    var payload = queueDetails;
                    payload.operation = payload_trig.operation;
                    sails.log("Payload _initia>>>>>>>" + JSON.stringify(payload));
                    r_queue.find({uniqueKey: payload.custkey}).exec(function (err, qfound) {
                        var found = qfound;
                        if (found && found.length) {
                            //found.queueState = payload.waitingtype;
                            if (payload.operation == "UPDATE") {
                                if (payload.waitingtype == "connected" && found[0].queueState != "connected") {
                                    var currentTime = new Date();
                                    found[0].waitingDuration = (currentTime.getTime() - found[0].startdate.getTime()) / 1000;
                                    found[0].queueState = payload.waitingtype;
                                    found[0].operator_id = payload.operator;
                                    found[0].connectedTime = currentTime.getTime();
                                    sails.log('Waiting Time ' + found[0].waitingDuration);
                                    r_queue.insertOrUpdate("uniqueKey", found[0], function (err, updated) {
                                        if (err) { //returns if an error has occured, ie id doesn't exist.
                                            sails.log('r_queue Update Error' + err);
                                        } else {
                                            sails.log('r_queue Updated' + JSON.stringify(updated));
                                        }
                                        r_queue.find({queueState: {'!': 'terminated'}}).exec(function (err, queueresult) {
                                            var qresult = queueresult;
                                            sails.log('R_Queue Objec publish' + JSON.stringify(qresult));
                                            sails.sockets.broadcast('operator', 'waitingqueue', qresult);
                                            var dateQuery;
                                            if (currentTime.getMinutes() > 30) {
                                                dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 30;
                                            } else {
                                                dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 0;
                                            }
                                            r_responseRate.find({date: dateQuery}).exec(function (err, responseRate) {
                                                //from finding_op to connected
                                                // waiting time
                                                var rRate = responseRate;
                                                sails.log("r_responseRate find -CONNECTED" + JSON.stringify(rRate));
                                                if (rRate != undefined) {
                                                    //rRate[0].totalConnected = rRate[0].totalConnected +1;
                                                    rRate[0].connectedCount = rRate[0].connectedCount + 1;

                                                    rRate[0].waitingTime = (rRate[0].waitingTime + found[0].waitingDuration) / rRate[0].connectedCount;
                                                    sails.log("r_responseRate find -CONNECTED before update" + JSON.stringify(rRate[0]));
                                                    sails.sockets.broadcast(roomId, 'callStats', rRate[0]);
                                                    r_responseRate.insertOrUpdate("date", rRate[0], function (err, updated) {
                                                        if (err) { //returns if an error has occured, ie id doesn't exist.
                                                            sails.log('r_responseRate Update Error' + err);
                                                        } else {
                                                            sails.log('r_responseRate Updated' + JSON.stringify(updated));
                                                            //sails.sockets.broadcast(roomId, 'callStats', updated);
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    });




                                } else {
                                    sails.log('Repeated Connected event- To be ignored ' + found[0].queueState);
                                }
                            } else {
                                sails.log('State>>>> ' + payload.operation);
                            }

                        } else {
                            //update and create object.
                            sails.log("Payload _initial" + payload.company_id);
                            getCompanyNameFromId(payload, function (compResult, payload) {
                                var queue = {};
                                queue.uniqueKey = payload.custkey;
                                queue.queueState = payload.waitingtype;
                                queue.callerInfo = payload.cli;
                                queue.company_id = payload.company_id;
                                queue.operator_id = payload.operator;
                                queue.startdate = new Date(payload.startdate);
                                queue.companyName = compResult[0].brand_name;
                                sails.log("Queue Object Created for insert" + queue.uniqueKey);
                                createQueue(queue, function (result) {
                                    sails.log('r_queue Objec Created' + result);
                                    r_queue.find({queueState: {'!': 'terminated'}}).exec(function (err, qresult) {
                                        sails.log('R_Queue Objec publish' + qresult);
                                        sails.sockets.broadcast('operator', 'waitingqueue', qresult);
                                    });
                                });
                                sails.log("Init Date getDate" + new Date().getDate());
                                sails.log("Init Date" + new Date().getDay());
                                var dateQuery;
                                var currentTime = new Date();
                                if (currentTime.getMinutes() > 30) {
                                    dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 30;
                                } else {
                                    dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 0;
                                }
                                r_responseRate.find({date: dateQuery}).exec(function (err, result) {
                                    //from finding_op or timeout or calling_op to terminated
                                    // abandon time
                                    var rRate = result;
                                    sails.log("rRate" + result);
                                    if (rRate != undefined) {
                                        sails.log("rRate[0]" + rRate[0]);
                                        if (rRate[0] == undefined) {
                                            var rRateInit = {};

                                            if (currentTime.getMinutes() > 30) {
                                                rRateInit.date = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 30;
                                            } else {
                                                rRateInit.date = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 0;
                                            }
                                            //rRateInit.totalConnected = 0;
                                            rRateInit.waitingTime = 0;
                                            rRateInit.abandonTime = 0;
                                            rRateInit.connectedTime = 0;
                                            rRateInit.totalIncomingCalls = 1;
                                            rRateInit.dateTime = new Date();
                                            rRateInit.connectedCount = 0;
                                            rRateInit.abandonCount = 0;
                                            rRateInit.abandonCount_10 = 0;
                                            rRateInit.abandonCount_30 = 0;
                                            rRateInit.abandonCount_120 = 0;
                                            rRateInit.abandonCount_140 = 0;
                                            //rRateInit.date = new Date().getDate();
                                            rRate = rRateInit;
                                        } else {
                                            rRate = rRate[0];
                                            rRate.totalIncomingCalls = rRate.totalIncomingCalls + 1;
                                            rRate.dateTime = new Date();
                                        }
                                        sails.log("rRate before insert" + rRate);
                                        sails.sockets.broadcast(roomId, 'callStats', rRate);
                                        r_responseRate.insertOrUpdate("date", rRate, function (err, updated) {
                                            if (err) { //returns if an error has occured, ie id doesn't exist.
                                                sails.log('r_responseRate Update Error' + err);
                                            } else {
                                                sails.log('totalConnected Updated' + updated.totalConnected);
                                                //sails.sockets.broadcast(roomId, 'callStats', updated);
                                            }
                                        });
                                    }
                                });

                            });

                        }

                    });
                }
            });
        } else {
            r_queue.find({uniqueKey: payload_trig.custkey}).exec(function (err, found) {
                if (found && found.length) {
                    sails.log("Inside DELETE action queue object" + JSON.stringify(found));
                    if (payload_trig.waitingtype == "connected") {
                        var currentTime = new Date();
                        found[0].connectedDuration = (currentTime.getTime() - found[0].connectedTime) / 1000;
                        sails.log('connectedTime Duration ' + found[0].connectedDuration);
                        found[0].queueState = "terminated";
                        var dateQuery;
                        if (currentTime.getMinutes() > 30) {
                            dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 30;
                        } else {
                            dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 0;
                        }
                        r_responseRate.find({date: dateQuery}).exec(function (err, rRate) {
                            //from connected to terminated
                            // connected time
                            if (rRate != undefined) {
                                //rRate[0].totalConnected++;
                                //rRate[0].connectedCount++;
                                rRate[0].connectedTime = (rRate[0].connectedTime + found[0].connectedDuration) / rRate[0].connectedCount;
                                sails.sockets.broadcast(roomId, 'callStats', rRate[0]);
                                r_responseRate.insertOrUpdate("date", rRate[0], function (err, updated) {
                                    if (err) { //returns if an error has occured, ie id doesn't exist.
                                        sails.log('r_responseRate Update Error' + err);
                                    } else {
                                        sails.log('r_responseRate Updated' + updated.connectedTime);
                                        //sails.sockets.broadcast(roomId, 'callStats', updated);
                                    }
                                });
                            }
                        });
                    } else {
                        sails.log('Finding_Timeout_Calling_op ' + payload_trig.operation);
                        var currentTime = new Date();
                        found[0].abandonDuration = (currentTime.getTime() - found[0].startdate.getTime()) / 1000;
                        sails.log('abandonDuration Time ' + found[0].abandonDuration);
                        found[0].queueState = "terminated";
                        var dateQuery;
                        if (currentTime.getMinutes() > 30) {
                            dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 30;
                        } else {
                            dateQuery = currentTime.getDate() + "_" + currentTime.getHours() + "_" + 0;
                        }
                        r_responseRate.find({date: dateQuery}).exec(function (err, rRate) {
                            //from finding_op or timeout or calling_op to terminated
                            // abandon time
                            if (rRate != undefined) {
                                //rRate[0].totalConnected++;
                                rRate[0].abandonCount++;
                                if (found[0].abandonDuration > 120) {
                                    rRate[0].abandonCount_140++;
                                } else if (found[0].abandonDuration > 30 && found[0].abandonDuration < 121) {
                                    rRate[0].abandonCount_120++;
                                } else if (found[0].abandonDuration > 10 && found[0].abandonDuration < 31) {
                                    rRate[0].abandonCount_30++;
                                } else if (found[0].abandonDuration < 11) {
                                    rRate[0].abandonCount_10++;
                                }
                                rRate[0].abandonTime = (rRate[0].abandonTime + found[0].abandonDuration) / rRate[0].abandonCount;
                                sails.sockets.broadcast(roomId, 'callStats', rRate[0]);
                                r_responseRate.insertOrUpdate("date", rRate[0], function (err, updated) {
                                    if (err) { //returns if an error has occured, ie id doesn't exist.
                                        sails.log('r_responseRate Update Error' + err);
                                    } else {
                                        sails.log('r_responseRate Updated' + updated.abandonCount);
                                        //sails.sockets.broadcast(roomId, 'callStats', updated);
                                    }
                                });
                            }
                        });

                    }

                    // Update the queue Object.
                    r_queue.insertOrUpdate("uniqueKey", found[0], function (err, updated) {
                        if (err) { //returns if an error has occured, ie id doesn't exist.
                            sails.log('r_queue Update Error' + err);
                        } else {
                            sails.log('r_queue Updated' + updated.uniqueKey);
                        }
                        r_queue.find({queueState: {'!': 'terminated'}}).exec(function (err, qresult) {
                            sails.log('R_Queue Objec publish' + qresult);
                            sails.sockets.broadcast('operator', 'waitingqueue', qresult);
                        });
                        r_queue.find({queueState: 'terminated'}).exec(function (err, qresult) {
                            sails.log('R_Queue Objec publish Terminated' + qresult);
                            sails.sockets.broadcast('operator', 'terminatedCalls', qresult);
                        });
                        r_responseRate.find().exec(function (err, qresult) {
                            sails.log('r_responseRate' + qresult);
                            sails.sockets.broadcast('operator', 'callstatsHistory', qresult);
                        });
                    });
                } else {
                    //update and create object.
                    sails.log("Unexpected Condition" + payload_trig.custkey);

                }

            });
        }


    }
};

function getWaitingQueueDetails(roomId, callback) {
    waitingqueue.find().exec(function (err, queue) {
        sails.log('waitingqueue to' + roomId);
        sails.log('queue' + queue);
        callback(queue, roomId);
        //sails.sockets.broadcast(roomId, 'waitingqueue', queue);

    });
}

function getWaitingQueueDetailsFromCustkey(custkey, payload, callback) {
    sails.log("Queue - From custkey from waitingqueue tbale Before query" + custkey);
    waitingqueue.find({custkey: custkey}).exec(function (err, queue) {
        if (queue != undefined) {
            sails.log('queue' + queue[0].custkey);
            callback(queue[0], payload);
        }
    });
}

function getCompanyNameFromId(payload, callback) {
    sails.log("getCompanyNameFromId for" + payload.company_id);
    r_company_info.find({company_info_id: payload.company_id}).exec(function (err, result) {
        if (result != undefined) {
            sails.log("getCompanyNameFromId" + JSON.stringify(result));
            sails.log('Brand_name' + result[0].brand_name);
            callback(result, payload);
        }
    });
}

function updateQueue(queue, callback) {
    sails.log("updateQueue");
    r_queue.insertOrUpdate("uniqueKey", queue, function (err, result) {

        sails.log('R_Queue Objec Created' + result);
        callback(result);

    });
}

function createQueue(queue, callback) {
    sails.log("createQueue");
    r_queue.create(queue, function (err, result) {
        sails.log('R_Queue Objec Created' + result);
        callback(result);
    });
}

function getOperatorNameFronID(queue, callback) {
    sails.log("getOperatorNameFronID");
    r_operator.find({id: queue.operatorName}).exec(function (err, oppresult) {
        sails.log('getOperatorNameFronID' + oppresult[0]);
        callback(oppresult[0], queue);
    });
}
function getOperatorNameFromID(id, callback) {
    sails.log("getOperatorNameFromID");
    r_operator.find({id: id}).exec(function (err, oppresult) {
        if (result != undefined) {
            sails.log('getOperatorNameFromID' + oppresult[0]);
            callback(oppresult[0]);
        }
    });
}

function deleteQueueEntries(roomId, callback) {
    r_queue.destroy().exec(function (err, desresult) {
        sails.log('r_queue destroy ' + desresult);
        callback(desresult, roomId);
    });
}

function getResponseRate(roomId, callback) {
    var responseRate = {};
    waitingqueue.count().exec(function (err, countAll) {
        responseRate.total = countAll;
        sails.log('getResponseRate Total Calls' + responseRate.total);
        waitingqueue.count({waitingtype: 'connected'}).exec(function (err, countConnected) {
            responseRate.connected = countConnected;
            responseRate.rate = (countConnected / responseRate.total) * 100;
            responseRate.time = new Date().getTime();
            responseRate.date = new Date();
            r_queue.find({queueState: 'finding_op'}).exec(function (err, result) {
                if (result != undefined) {
                    var length = result.length;
                    var totalDuration = 0;
                    for (i = 0; i < length; i++) {
                        totalDuration = totalDuration + result[i].duration;
                    }
                    responseRate.waitTime = totalDuration / length;
                    callback(responseRate, roomId);
                }
            })
            sails.log('getResponseRate Total Calls2' + responseRate.total);
            sails.log('getResponseRate Total Calls2' + responseRate.rate);

        });

        //sails.sockets.broadcast(roomId, 'waitingqueue', queue);

    });
}
