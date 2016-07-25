/**
 * OperatorStatusController
 *
 * @description :: Server-side logic for managing operatorstatuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Opprf_global;
var userlist_global;
var companylist_global;

function testFunction() {
    sails.log.info("Test function");
    var opp_user = {};
    opp_user.flag = 1;
    opp_user.name = 'userResult[0].name';
    opp_user.id = '1222';
    opp_user.mode = '5';
    //sails.log.info(opp_user['id']);
    r_operator.insertOrUpdate('id', opp_user, function (err, updated) {
        if (err) { //returns if an error has occured, ie invoice_id doesn't exist.
            sails.log.info(err);
        } else {
            sails.log.info('insertOrUpdate client record ', updated.mode); //+updated[0].name
        }
    })


//                    r_operator.update({id:opp_user.id}).exec(function (err,opp_user){
//                              sails.log.info('Operator Objec Updated'+err);
//                    });
//                   r_operator.findOrCreate({id:opp_user.id},opp_user,function(err,result){
//                      
//                      if(result==undefined){
//                        sails.log.info('Operator Objec Created'+result) ;
//                      }
//                   });
}

function updateOperator(operatorD, callback) {
    sails.log.info("updateOperator");

    r_operator.insertOrUpdate("id", operatorD, function (err, result) {
        sails.log.info('Operator Objec Created' + result);
        callback(result);
    });


}

function getOpprfDetails(callback) {
    Opprf.find({flag: '1'}).exec(function (err, operators) {
        sails.log.info('getOpprfDetails id' + JSON.stringify(operators));
        //sails.log.info('getOpprfDetails name'+operators[0].name);
        callback(operators);
    });
}

function getUserDetailsDetails(opp, callback) {
    Users.find({where: {id: opp.id}}).exec(function (err, Users) {
        sails.log.info('getUserDetailsDetails' + JSON.stringify(Users));
        callback(Users, opp);
    });
}

function mapOperatorNameID(callback) {

    getOpprfDetails(function (OpprfResult) {
        var opp_userList = [];
        if (OpprfResult != undefined) {
            for (i = 0; i < OpprfResult.length; i++) {
                sails.log.info('mapping name_id' + OpprfResult[i].id);
                oppr_temp = OpprfResult[i];
                getUserDetailsDetails(oppr_temp, function (userResult, oppr_temp) {
                    var opp_user = {};
                    opp_user.loggedStatus = oppr_temp.flag;
                    opp_user.name = userResult[0].name;
                    opp_user.id = userResult[0].id;
                    opp_user.callMode = oppr_temp.mode;
//                   operator.create(opp_user).exec(function(err,result){
//                        sails.log.info('Operator Objec Created'+result) ;
//                        //callback(result);
//                    });
                    updateOperator(opp_user, function (result) {
                        sails.log.info('Operator Objec Created' + result);
                    });

                    opp_userList.push(opp_user);
                    sails.log.info('userResult' + JSON.stringify(opp_userList));
                    callback(opp_userList);
                });
            }
            //sails.log.info('userResult callback'+JSON.stringify(opp_userList));

        }
        //sails.log.info('userResult callback'+JSON.stringify(opp_userList));
        //callback(opp_userList);
    });
}

module.exports = {
    index: function (request, response) {
        return response.view('homepage', {
            currentDate: (new Date()).toString()
        });
    }, getOperators_ind: function (req, resp) {
        OperatorServices.getOperators(function (operators) {
            console.log(operators);
            resp.json(operators);
        });
    }, getOperators_old: function (req, resp) {
        Opprf.find({where: {flag: 1}}).exec(function (err, operators) {
            sails.log.info(operators);
            //return resp.json(operators);
            return resp.view('operator', {
                operators: operators
            });
        });
    }, getLoggedInOperators: function (req, resp) {
        Opprf.query("select Opprf.id from Opprf where flag='1'", function (err, operators) {
            sails.log.info(operators);
            //return resp.json(operators);
            return resp.view('operator', {
                operators: operators
            });
        });
    }, updateOperatorStatus: function (callstatus) {
        sails.log.info("In Controller" + callstatus.operator);
        //sails.sockets.broadcast('operator', 'callstatus', callstatus);
        sails.controllers.operatorstatus.getOperatorDetails('operator', 'noid');
    }, getOperators: function (req, resp) {
        Opprf.find({where: {flag: 1}}).exec(function (err, operators) {
            sails.log.info('Opprf' + operators);
            //return resp.json(operators);
            return resp.view('operator', {
                operators: operators
            });
        });
    }, getUserNames: function (req, res, next) {
        var roomId = req.param('id');
        var SocketID = sails.sockets.getId(req);
        Users.find().exec(function (err, Users) {
            sails.log.info('Users to' + roomId);
            sails.log.info('Users' + Users);
            //sails.sockets.broadcast(roomId, 'userlist', Users);
            sails.sockets.broadcast(SocketID, 'userlist', Users);
        });
    }, join: function (req, res, next) {
        // Get the ID of the room to join
        var roomId = req.param('name');
        sails.log.info('join request' + roomId);
        sails.log.info('SocketID' + sails.sockets.getId(req));
        sails.sockets.join(req, roomId);
        //testfunction();
        sails.controllers.operatorstatus.getOperatorDetails(roomId, 'noid');
        //sails.controllers.waitingqueue.publishMappedCompany(roomId);


        //getUserNames(roomId);
        return next();
    }, getOpprf: function (roomId, socketID) {
        Opprf.find({where: {flag: 1}}).exec(function (err, operators) {
            sails.log.info('Opprf' + operators);
            sails.log.info('Opprf to' + roomId);
            sails.log.info('operators leght' + operators.length);
            Opprf_global = operators;
            //sails.sockets.broadcast(socketID, 'Opprflist', operators);
            sails.sockets.broadcast(roomId, 'opprflist', Opprf_global);

        });
    }, getOperatorDetails: function (roomId, socketID) {
        mapOperatorNameID(function (result) {
            sails.log.info("calling map" + result);
            sails.sockets.broadcast(roomId, 'opprflist', result);

        });

    }, launchdashboard: function (req, resp) {
        sms_services.find().exec(function (err, result_sms) {
            var comp = result_sms;
            if (comp != undefined) {

                r_company_info.insertOrUpdate("company_info_id", comp, function (err, result) {
                    sails.log.info('r_company_info Objec Created' + result);
                    //callback(result);
                });

            }

        });
        return resp.view('operator', {
            roomId: 'dashboard'
        });
    }, testFunction: function (req, resp) {
        testFunction();
    }




};

