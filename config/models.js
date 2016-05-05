/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#!/documentation/concepts/ORM
 */

module.exports.models = {

  /***************************************************************************
  *                                                                          *
  * Your app's default connection. i.e. the name of one of your app's        *
  * connections (see `config/connections.js`)                                *
  *                                                                          *
  ***************************************************************************/
  //connection: 'pg_1300',
  autoCreatedAt: false,
  autoUpdatedAt: false,
  schema: false,
  /***************************************************************************
  *                                                                          *
  * How and whether Sails will attempt to automatically rebuild the          *
  * tables/collections/etc. in your schema.                                  *
  *                                                                          *
  * See http://sailsjs.org/#!/documentation/concepts/ORM/model-settings.html  *
  *                                                                          *
  ***************************************************************************/
  migrate: 'safe',
    insertOrUpdate: function(key, record, CB){
    var self = this; // reference for use by callbacks
    var where = {};
    //sails.log("record[key"+record[key])
    where[key] = record[key]; // keys differ by model
    this.find(where).exec(function findCB(err, found){
      if(err){
        CB(err, false);
      }
      // did we find an existing record?
      if(found && found.length){
        self.update(record[key], record).exec(function(err, updated){
          if(err) { //returns if an error has occured, ie id doesn't exist.
            CB(err, false);
          } else {
            CB(false, found[0]);
          }
        });
      }else{
        self.create(record).exec(function(err, created){
          if(err) { //returns if an error has occured, ie invoice_id doesn't exist.
            CB(err, false);
          } else {
            CB(false, created);
          }
        });
      }
    });
  }

};
