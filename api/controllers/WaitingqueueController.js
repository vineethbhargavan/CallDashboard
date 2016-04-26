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
    waitingqueue.find().exec(function(err,queue){
            sails.log('waitingqueue to'+roomId);
            sails.log('queue'+queue);
            sails.sockets.broadcast(roomId, 'waitingqueue', queue);
        });
  },publishMappedCompany: function(roomId){
       sails.log('publishMappedCompany _room'+roomId) ;
       getWaitingQueueDetails(function(wQueueResult,roomId){
       //var wQueueList =[];
       sails.log('publishMappedCompany _room2'+roomId) ;
       if(wQueueResult !=undefined){
           for(i=0; i< wQueueResult.length; i++){
               sails.log('mapping name_id'+wQueueResult[i].company_id);
               queue_temp = wQueueResult[i];
               getCompanyNameFromId(queue_temp,function(compResult,queue_temp){
                   var queue = {};
                   var currentTime = new Date();
                   sails.log('Current TIME'+currentTime);
                   queue.uniqueKey = queue_temp.custkey;
                   queue.queueState = queue_temp.waitingtype;
                   queue.callerInfo = queue_temp.cli;
                   queue.companyName = compResult[0].brand_name;
                   queue.operatorName = queue_temp.operator;
                   queue.startdate = new Date(queue_temp.startdate);
                   sails.log('Start Date '+queue.startdate);
                   queue.duration = (currentTime.getTime()-queue.startdate.getTime())/1000;
                   sails.log('DURATION '+queue.duration);
                   getOperatorNameFronID(queue,function(opName,queue){
                       queue.operatorName = opName.name;
                       updateQueue(queue,function(result){
                                sails.log('R_Queue Objec Created'+result) ;
                                r_queue.find().exec(function(err,qresult){
                                    sails.log('R_Queue Objec publish'+qresult) ;
                                    sails.sockets.broadcast('operator', 'waitingqueue', qresult);
                                });
                        });
                        
                       
                   });
                   

                   //sails.sockets.broadcast('operator', 'waitingqueue', queue);

                   //wQueueList.push(queue);
                   sails.log('wQueueResult'+JSON.stringify(queue));
                   //callback(queue);
               });
           }  
           
       } 
    });
  }
};

function getWaitingQueueDetails(callback,roomId){
    waitingqueue.find().exec(function(err,queue){
            sails.log('waitingqueue to'+roomId);
            sails.log('queue'+queue);
            callback(queue,roomId);
            //sails.sockets.broadcast(roomId, 'waitingqueue', queue);
            
        });
}

function getCompanyNameFromId(queue,callback){
        r_company_info.find({company_info_id:queue.company_id}).exec(function(err,result){
           if(result!=undefined){
               sails.log('Brand_name'+result[0].name);
               callback(result,queue);
           }
        });
}

function updateQueue(queue,callback){
    sails.log("updateQueue");
    r_queue.destroy().exec(function(err,result){
        r_queue.create(queue).exec(function(err,result){
           sails.log('R_Queue Objec Created'+result) ;
           callback(result);
        });
    });
}

function getOperatorNameFronID(queue,callback){
    sails.log("getOperatorNameFronID");
    r_operator.find({id:queue.operatorName}).exec(function(err,oppresult){
       sails.log('getOperatorNameFronID'+oppresult[0]) ;
       callback(oppresult[0],queue);
    });
}
