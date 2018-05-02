var winston = require('winston');
var config = require('config');
var async = require('async');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;

var util = require('../util');
var AppMailNotif = require('../../../models/widget/app_mail_notif');
var Employees=require('../../../models/widget/employees');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var AppView = require('../../../models/widget/app_view');
var AppBrdgViewQuery= require('../../../models/widget/app_brdg_view_query');
var FlagMetrics=require('../../data/widget/flag_metrics');
var DimDemgrDir=require('../../../models/widget/dim_demgr_dir');
var Func=require('./reuse_functions');

var pug = require('pug');
var mailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var sampData = [["Manager_1_2","S1_3","S2_3"],
              ["Sl Backlog","Sl Incoming","Sl Disposed","S2 Backlog","S2 Incoming","S2 Disposed"],
              {user: "nbhau_user", "Sl Backlog": "5_dg","Sl Incoming":"0","Sl Disposed":"0","S2 Backlog": "17_dg","S2 Incoming":"0","S2 Disposed":"0"},
              {user: "aoswal_user", "Sl Backlog": "2_dg","Sl Incoming":"0","Sl Disposed":"0","S2 Backlog": "11_ug","S2 Incoming":"5_ur","S2 Disposed":"0"},
              {user: "hxu_user", "Sl Backlog": "1_dg","Sl Incoming":"0","Sl Disposed":"0","S2 Backlog": "34_ur","S2 Incoming":"0","S2 Disposed":"4_dr"}];

const dateNow = new Date();

var getWeekOfDay = function(exact) {
    var month = exact.getMonth()
      , year = exact.getFullYear()
      , firstWeekDay = new Date(year,month,1).getDay()
      , lastDateofMonth = new Date (year,month + 1, 0).getDate()
      , offsetDate = new Date().getDate() + firstWeekDay - 1
      , index = 1
      , weeksInMonth = index + Math.ceil((lastDateofMonth + firstWeekDay - 7) /7)
      , week = index + Math.floor(offsetDate / 7);

      if (exact || week < 2 + index) return week;
      return week === weeksInMonth ? index + 5 : week;
};

//var nodemailer = require('nodemailer');
//var smtpTransport = require('nodemailer-smtp-transport');
//
let transporter = mailer.createTransport(smtpTransport({
    host:'outbound.cisco.com',
    auth:{
            user:config.get("nodeUrl.user"),
            pass:config.get("nodeUrl.pass")
    }
}))

//Function to get Director Manager Hierarchy
var getDirMgrHierarchyData = function(ViewID,ViewType,MetricDetails,UsersList,Hierarchy,PrevWeek,BuName,NotifID,isTecatAuton) {
  var headerPrimary = [];
  var headerSeconday = [];
  var headerTeritary = [];
  var detailRecord = ["EmpName"];
  var FinalMailData = [];
  var displayMetrics = [];
  var TeacatAutons = ['TEACAT', 'S123 TEACAT', 'S12 Autons', 'S3 Autons','TEACAT MTTR','Autons MTTR','Autons'];

  //Loop Metrics and create the header
  if (PrevWeek == "true") {
    headerPrimary.push("Director_1_3");
  } else {
    headerPrimary.push("Director_1_2");
  }

  MetricDetails.forEach(function(parentMetric){

    //Teacat Auton Filter
    if ( isTecatAuton == true &&  TeacatAutons.indexOf(parentMetric.MetricName) == -1) {
      return;
    } else if ( isTecatAuton == false && TeacatAutons.indexOf(parentMetric.MetricName) > -1) {
      return;
    }

    parentMetric.SubMetric.forEach(function(childMetric){
      if (PrevWeek == "true") {
         displayMetrics.push(childMetric.MetricDispName + "_2");
         headerSeconday.push(childMetric.MetricName);
         detailRecord.push(childMetric.MetricName+"_LastWeek");
         detailRecord.push(childMetric.MetricName+"_ThisWeek");
         headerTeritary.push("Last Week");
         headerTeritary.push("Current Week");
      } else {
        displayMetrics.push(childMetric.MetricDispName)
        headerSeconday.push(childMetric.MetricName);
        detailRecord.push(childMetric.MetricName);
      }
    });

    if (PrevWeek == "true") {
        headerPrimary.push(parentMetric.MetricName + "_" + (parentMetric.SubMetric.length * 2));
    } else {
        headerPrimary.push(parentMetric.MetricName + "_" + parentMetric.SubMetric.length);
    }
  });

  FinalMailData.push(headerPrimary);
  FinalMailData.push(displayMetrics);

  if(PrevWeek == "true") {
    FinalMailData.push(headerTeritary);
  }

  var calculateMetricValue = function (user_id,indentSpace) {
      var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
      var config={}; var avgConfig={};

      //Zero suppression calculation of Good and Bad metric
      var metrics_bad=[]; var metrics_good=[];
      for (var i=0; i<headerSeconday.length; i++){
        if(FlagMetrics["Good-Metric"].indexOf(headerSeconday[i]) > -1){metrics_good.push(headerSeconday[i]);}
        else{metrics_bad.push(headerSeconday[i]);}
      }

      var dataJson={};
      var tasks=[];

      tasks.push(Func.viewIdMetrics_new(headerSeconday, ViewID[0], ViewType))

      //Calculate Director
      return Promise.all(tasks)
      .then(function(details){
        query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
        config = details[0][4]; avgConfig = details[0][5];
        //Calculate WeekEndDate
        return WeekEndDates.find({},{_id:0})
        .then(function(weeks){
          var listOfDates = weeks[0].WeekEndDates.slice(0,2);
          return Employees.aggregate([
              {'$match':{'Userid':user_id}},
              {'$project':{"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
          ])
          .then(function(emp_data) {
            if(emp_data[0] == undefined) {return {};};

            return FactDefectAgg.aggregate([
                        {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":user_id}]}},
                        {$unwind:"$MetricAttrib"},
                        {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
                        {$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
                        {$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
                    ])
            .then(function(data){
              var dataJson2 = {};

              //Loop through the WeekEndDates
              data.forEach(function(doc){
                var dataJson3={};

                //For Each Metrics
                doc.data.forEach(function(d){
                  dataJson3[d.MetricName]=d.MetricCount;
                })

                var final_json={}
                final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config)

                if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
                else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
              })  //Loop data Ends


              if (dataJson2 != undefined) {
                if (PrevWeek == "true") { //Calculate and Show Lastweek data like this
                  //Zero suppression check starts again
                  var sum_vals=0;
                  //Calculate This week data
                  for (var key in dataJson2["Curr"]){
                    if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}
                    else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}

                    dataJson2["Curr"][key+"_ThisWeek"] =  dataJson2["Curr"][key] == undefined ? "0" : dataJson2["Curr"][key].toString();
                    delete dataJson2["Curr"][key];  //deletd the key valce since the key has been reassigned.
                  }

                  //Calculate last week data
                  for (var key in dataJson2["Prev"]){
                    if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Prev"][key];}
                    else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Prev"][key];}

                    //Show this week and last week data side by side
                    dataJson2["Curr"][key+"_LastWeek"] =  dataJson2["Prev"][key] == undefined ? "0" : dataJson2["Prev"][key].toString();
                  }

                  if(sum_vals == (metrics_good.length * 100)){ dataJson2["Curr"] = {}}
                  //Zero suppression ends here

                } else {  //InCase of No Previous Week show trend

                  //Zero suppression check starts again
                  var sum_vals=0;

                  for (var key in dataJson2["Curr"]){

                      if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}
                      else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}

                      //Based on good bad metrics trend is being calculated.
                      if (FlagMetrics["Good-Metric"].indexOf(key) > -1 ) //Good Metric
                      {
                          dataJson2["Curr"][key] = (dataJson2["Prev"] == undefined)? ( dataJson2["Curr"][key] + "_ug" ): (dataJson2["Prev"][key] == undefined) ? ( dataJson2["Curr"][key] + "_ug" ) : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? ( dataJson2["Curr"][key] + "_ug" ) : ( dataJson2["Curr"][key] + "_dr" );
                      } else {  //Bad Metric
                          dataJson2["Curr"][key] = (dataJson2["Prev"] == undefined)? ( dataJson2["Curr"][key] + "_ur" ): (dataJson2["Prev"][key] == undefined) ? ( dataJson2["Curr"][key] + "_ur" ) : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? ( dataJson2["Curr"][key] + "_ur" ) : ( dataJson2["Curr"][key] + "_dg" );
                      }
                  }

                  if(sum_vals == (metrics_good.length * 100)){ dataJson2["Curr"] = {}}
                  //Zero suppression ends here
                }

                if (dataJson2["Curr"] == undefined) { dataJson2["Curr"] = {} };

								dataJson2["Curr"]["Name"]= user_id;
                dataJson2["Curr"]["EmpName"]=indentSpace + emp_data[0].EmpName + "_user";
							}
							else{
                dataJson2["Curr"] = {};
								dataJson2["Curr"]["Name"] = user_id;
								dataJson2["Curr"]["EmpName"] = indentSpace + emp_data[0].EmpName + "_user";
							}

              if(dataJson2["Curr"] != undefined) {
                  return dataJson2["Curr"];
              } else { return {};}
            }); //Metrics Calulation Ends
          }); //Employee check Ends
        }); //WeekEnd Fetch Ends
      }); //Main Promise Ends
  }; //internal function ends here

  var userDocs = [];

  return Promise.all(headerSeconday)
  .then(function(headerS){
    //Loop All given directors
    UsersList.forEach(function(director){
      userDocs.push(calculateMetricValue(director,""));

      //Check hierarchy
      if (Hierarchy == "true") {
        //First drill Down
        userDocs.push(
          DimDemgrDir.aggregate([
					  {$match:{"DIR_USERID":director, "DEMGR_USERID" : {$ne : ""}}},
					  {$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				  ]).then(function(mgrs){
              if(mgrs.length == 0 ) { return {};};
              var userDocs2 = [];
              mgrs[0].mgrs.forEach(function(manager){
                userDocs2.push(calculateMetricValue(manager,"--"));
              }); //Loop All Managers

              return Promise.all(userDocs2).then(function(doc){return doc;});

          }) //Look in DimDemgrDir Collection ends
        ); //UserDoc push ends
      } //Hierarchy check ends here
    });//Loop users list ends

    //Flatten the arrays into docs
    var rawCollection = [];

    rawCollection.push(Promise.all(userDocs)
    .then(function(userDoc){
      var returnDoc = [];
      var finalDoc = [];
      userDoc.forEach(function(doc){
        if(Array.isArray(doc)){
          doc.forEach(function(doc1){
            if(Array.isArray(doc1) ){
                doc1.forEach(function(doc2){
                  returnDoc.push(doc2)
                })
            }
            else {
              returnDoc.push(doc1)
            }
          })
        } else {
          returnDoc.push(doc)
        }
      })

      //Row suppression for when no data found
      return Promise.all(returnDoc).then(function(doc){
        doc.forEach(function(eachVal){

          if( Object.keys(eachVal).length > 2){
            finalDoc.push(eachVal)
          } else if( eachVal.EmpName != undefined && eachVal.EmpName.indexOf("-") == -1 && Object.keys(eachVal).length <= 2){
            finalDoc.push(eachVal)
          }

        })

        return Promise.all(finalDoc).then(function(doc){return doc;});
      })
    })); //rawCollection Push ends here

    //Final format for pug template
    return Promise.all(rawCollection).
    then(function(rawcoll){

      rawcoll[0].forEach(function(formatMe){
        var formattedRow = {};

        //Pad 0 during null data
        detailRecord.forEach(function(finalKey){
          formattedRow[finalKey] = formatMe[finalKey] == undefined ? "0" : formatMe[finalKey];
        })

        FinalMailData.push(formattedRow);

      })

      return Promise.all(FinalMailData).then(function(doc){return doc;});
    });
  }); //headerSeconday Promise ends
};

//Function to calculate the Hierarchy Data
var getHierarchyData = function(ViewID,ViewType,MetricDetails,UsersList,Hierarchy,PrevWeek,BuName,NotifID,isTecatAuton) {
  var headerPrimary = [];
  var headerSeconday = [];
  var headerTeritary = [];
  var detailRecord = ["EmpName"];
  var FinalMailData = [];
  var displayMetrics = [];
  var TeacatAutons = ['TEACAT', 'S123 TEACAT', 'S12 Autons', 'S3 Autons','TEACAT MTTR','Autons MTTR','Autons'];

  //Loop Metrics and create the header
  if (PrevWeek == "true") {
    headerPrimary.push("Org_1_3");
  } else {
    headerPrimary.push("Org_1_2");
  }

  MetricDetails.forEach(function(parentMetric){

    //Teacat Auton Filter
    if ( isTecatAuton == true &&  TeacatAutons.indexOf(parentMetric.MetricName) == -1) {
      return;
    } else if ( isTecatAuton == false && TeacatAutons.indexOf(parentMetric.MetricName) > -1) {
      return;
    }

    parentMetric.SubMetric.forEach(function(childMetric){
      if (PrevWeek == "true") {
         displayMetrics.push(childMetric.MetricDispName + "_2");
         headerSeconday.push(childMetric.MetricName);
         detailRecord.push(childMetric.MetricName+"_LastWeek");
         detailRecord.push(childMetric.MetricName+"_ThisWeek");
         headerTeritary.push("Last Week");
         headerTeritary.push("Current Week");
      } else {
        displayMetrics.push(childMetric.MetricDispName)
        headerSeconday.push(childMetric.MetricName);
        detailRecord.push(childMetric.MetricName);
      }
    });

    if (PrevWeek == "true") {
        headerPrimary.push(parentMetric.MetricName + "_" + (parentMetric.SubMetric.length * 2));
    } else {
        headerPrimary.push(parentMetric.MetricName + "_" + parentMetric.SubMetric.length);
    }
  });

  FinalMailData.push(headerPrimary);
  FinalMailData.push(displayMetrics);

  if(PrevWeek == "true") {
    FinalMailData.push(headerTeritary);
  }

  //Internal function to calculate metric value
  var calculateMetricValue = function (user_id,indentSpace) {
    var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
  	var config={}; var avgConfig={};

    //Zero suppression
    var metrics_bad=[]; var metrics_good=[];
    for (var i=0; i<headerSeconday.length; i++){
  		if(FlagMetrics["Good-Metric"].indexOf(headerSeconday[i]) > -1){metrics_good.push(headerSeconday[i]);}
  		else{metrics_bad.push(headerSeconday[i]);}
  	}

  	var dataJson={};
  	var tasks=[];
  	tasks.push(Func.viewIdMetrics_new(headerSeconday, ViewID[0], ViewType))

    return Promise.all(tasks)
  	.then(function(details){
  		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
  		config = details[0][4]; avgConfig = details[0][5];
  		return WeekEndDates.find({},{_id:0})
  		.then(function(weeks){
        var listOfDates = weeks[0].WeekEndDates.slice(0,2);

				return Employees.aggregate([
          {'$match':{'Userid':user_id}},
          {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}
				])
        .then(function(users){
          if (users.length == 1 ) {
            var dataArr=[];
            var test_json={}

            if("listOfUsers" in users[0]) {
                var user_json= {"DEManagerUserID":{'$in':users[0].listOfUsers}}
            } else {
                var user_json = {"DEManagerUserID":users[0].Userid}
            }

            return FactDefectAgg.aggregate([
                      	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},user_json]}},
                      	{$unwind:"$MetricAttrib"},
                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
                    ])
							.then(function(data){
                var dataJson2={};
								data.forEach(function(doc){
                  //console.log(doc);
				   					var dataJson3={};
				   					doc.data.forEach(function(d){
				   						dataJson3[d.MetricName]=d.MetricCount;
				   					})
				   					var final_json={}
				   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config)
				   					if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
									  else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
								})
								if(dataJson2["Curr"] != undefined){

                  if (PrevWeek == "true") {
                    //Zero suppression check starts again
                    var sum_vals=0;
                    //Calculate This week data
                    for (var key in dataJson2["Curr"]){
                      if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}
                      else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}

                      dataJson2["Curr"][key+"_ThisWeek"] =  dataJson2["Curr"][key] == undefined ? "0" : dataJson2["Curr"][key].toString();
                      delete dataJson2["Curr"][key];  //deletd the key valce since the key has been reassigned.
                    }

                    //Calculate last week data
                    for (var key in dataJson2["Prev"]){
                      if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Prev"][key];}
                      else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Prev"][key];}

                      //Show this week and last week data side by side
                      dataJson2["Curr"][key+"_LastWeek"] =  dataJson2["Prev"][key] == undefined ? "0" : dataJson2["Prev"][key].toString();
                    }

                    if(sum_vals == (metrics_good.length * 100)){ dataJson2["Curr"] = {}}
                    //Zero suppression ends here
                  } else {
                    var sum_vals=0;

                    for (var key in dataJson2["Curr"]){

                        if(metrics_good.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}
                        else if(metrics_bad.indexOf(key) > -1){sum_vals=sum_vals+dataJson2["Curr"][key];}

                        if (FlagMetrics["Good-Metric"].indexOf(key) > -1 ) //Good Metric
                        {
                            dataJson2["Curr"][key] = (dataJson2["Prev"] == undefined)? ( dataJson2["Curr"][key] + "_ug" ): (dataJson2["Prev"][key] == undefined) ? ( dataJson2["Curr"][key] + "_ug" ) : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? ( dataJson2["Curr"][key] + "_ug" ) : ( dataJson2["Curr"][key] + "_dr" );
                        } else {  //Bad Metric
                            dataJson2["Curr"][key] = (dataJson2["Prev"] == undefined)? ( dataJson2["Curr"][key] + "_ur" ): (dataJson2["Prev"][key] == undefined) ? ( dataJson2["Curr"][key] + "_ur" ) : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? ( dataJson2["Curr"][key] + "_ur" ) : ( dataJson2["Curr"][key] + "_dg" );
                        }
                    }

                    if(sum_vals == (metrics_good.length * 100)){ dataJson2["Curr"] = {}}
                  }

									dataJson2["Curr"]["Name"]=users[0].Userid;
                  dataJson2["Curr"]["EmpName"]=indentSpace + users[0].Name + "_user";
								}
								else{
                  dataJson2["Curr"] = {};
									dataJson2["Curr"]["Name"] = users[0].Userid;
									dataJson2["Curr"]["EmpName"] = indentSpace + users[0].Name + "_user";
								}

                if(dataJson2["Curr"] != undefined) {
                    return dataJson2["Curr"];
                } else { return {};}
            })
          } //User length check ends here
          else {
            return {"Name": user_id};
          }

        })
      })
    })
  }; //internal function ends here

  var userDocs = [];

  return Promise.all(headerSeconday)
  .then(function(headerS){

    if (headerSeconday.length == 0) {
      return [];
    }

    //loop through the users
    UsersList.forEach(function(user_id){

        userDocs.push(calculateMetricValue(user_id,""));

        if (Hierarchy == "true") {
          //First drill Down
          userDocs.push(Employees.distinct("directReportList",{"Userid":user_id})
          .then(function(firstReportees){
              var userDocs2 = [];

              firstReportees.forEach(function(firstReportee){
                userDocs2.push(calculateMetricValue(firstReportee,"--"));
                //Second Level Manager
                userDocs2.push(Employees.distinct("directReportList",{"Userid":firstReportee})
                    .then(function(secondReportees){
                        var userDocs3 = [];
                        secondReportees.forEach(function(secondReportee){
                            userDocs3.push(calculateMetricValue(secondReportee,"----"));
                        })

                        return Promise.all(userDocs3).then(function(doc){return doc;});
                    })
                ); //Second drill down push ends
              });

              return Promise.all(userDocs2).then(function(doc){return doc;});
            })
          ); //First Drill down push ends
        } //Hierarchy check ends
    }); //UserList loop ends

    //Flatten the arrays into docs
    var rawCollection = [];
    rawCollection.push(Promise.all(userDocs)
    .then(function(userDoc){
      var returnDoc = [];
      var finalDoc = [];
      userDoc.forEach(function(doc){
        if(Array.isArray(doc)){
          doc.forEach(function(doc1){
            if(Array.isArray(doc1)){
                doc1.forEach(function(doc2){
                  returnDoc.push(doc2)
                })
            }
            else {
              returnDoc.push(doc1)
            }
          })
        } else {
          returnDoc.push(doc)
        }
      })

      //Row suppression for when no data found
      return Promise.all(returnDoc).then(function(doc){
        doc.forEach(function(eachVal){

          if(Object.keys(eachVal).length > 2){
            finalDoc.push(eachVal)
          } else if(eachVal.EmpName != undefined && eachVal.EmpName.indexOf("-") == -1 && Object.keys(eachVal).length <= 2){
            finalDoc.push(eachVal)
          }

        })

        return Promise.all(finalDoc).then(function(doc){return doc;});
      })
    }));

    //Final format for pug template
    return Promise.all(rawCollection).
    then(function(rawcoll){

      rawcoll[0].forEach(function(formatMe){
        var formattedRow = {};

        //Pad 0 during null data
        detailRecord.forEach(function(finalKey){
          formattedRow[finalKey] = formatMe[finalKey] == undefined ? "0" : formatMe[finalKey];
        })

        FinalMailData.push(formattedRow);

      })

      return Promise.all(FinalMailData).then(function(doc){return doc;});
    });
  }); //headerSeconday Promise Ends
};

exports.sendScheduledMail = function (req,res) {
  var Days = ['Sun','Mon','Tues','Wed','Thrus','Fri','Sat'];
  const todaysDate = new Date();
  var thisDay = todaysDate.getDay();
  var thisMonth = todaysDate.getMonth();
  var thisYear = todaysDate.getFullYear();
  var dateWithOutTime = new Date(thisYear,thisMonth,thisDay);
  var weekNumber = getWeekOfDay(todaysDate);
  var returnDocs = [];
  var finalReturn = [];
  var TestMail = req.body.TestMail;
  if (TestMail == undefined ) {TestMail = "N";};

  var query = {"$and" : [{"ActiveFlag" : "Y"},
                          {"LastRunDate" : {$lt : todaysDate}},
                          {"StartOn" : {$lte: todaysDate}},
                          {"$or" : [{"DueOn" : {$gte : dateWithOutTime}},{"DueOn" : null},{"DueOn" : ""}]}
        ]};

  return AppMailNotif.aggregate([
    {$match : query}
  ])
  .then(function(docs){
      docs.forEach(function(doc){
          if (doc.Repeat == "Monthly" &&
            ((doc.LastRunDate.getFullYear() + doc.LastRunDate.getMonth()) < (thisYear + thisMonth)) &&
            TestMail == "N") {
            //Check whether it ran last month or not
              returnDocs.push(doc);
          }
          else if (doc.Repeat == "Daily" && doc.LastRunDate < todaysDate && TestMail == "N") {
            returnDocs.push(doc);
          }
          else if (doc.Repeat == "Weekly" && doc.RepeatOn != undefined && TestMail == "N") {
            doc.RepeatOn.forEach(function(day){
              if(day == Days[thisDay]){ returnDocs.push(doc); }
            });
          }
          else if (doc.Repeat == "Testing" && TestMail == "Y"){
            returnDocs.push(doc);
          }
      });

      return Promise.all(returnDocs)
      .then(function(pushedDoc){
        var pushedDocLen = pushedDoc.length;

        pushedDoc.forEach(function(schedule,index){
            var retDoc = [];

            if (schedule.HierarchyType == "Org" || schedule.HierarchyType == "") {
              retDoc.push(getHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,false));
              retDoc.push(getHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,true));
            } else if (schedule.HierarchyType == "De-Manager") {
              retDoc.push(getHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,false));
              retDoc.push(getHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,true));
            }

            //retDoc.push(getDirMgrHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,false));
            //retDoc.push(getDirMgrHierarchyData(schedule.ViewID,schedule.ViewType,schedule.MetricDetails,schedule.UsersList,schedule.Hierarchy,schedule.PrevWeek,schedule.BuName,schedule.NotifID,true));

            Promise.all(retDoc).then(function(mailBody){
                //sendMail
                if (mailBody.length > 0) {
                    sendMail(schedule.To,schedule.Subject,schedule.Body,mailBody[0],schedule.NotifID,schedule.ViewID,schedule.CreatedBy,schedule.NotifName,mailBody[1],schedule.PrevWeek);
                }
            })
        })

        return "Success";
      })
      .then(res.jsend.success, res.jsend.error);
  });
};

var sendMail = function(toList,subject,body,tableColl,NotifID,ViewID,CreatedBy,NotifName,tableTeacatAuton,PrevWeek) {

  var templateFile =  __dirname +  "/../../../mail_templates/table_trend.pug";
  var templateCompareFile =  __dirname +  "/../../../mail_templates/table_compare_week.pug";

	var data = "";
  var teacatAuton = "";

  if ( tableColl != undefined && tableColl.length > 0 ) {
    if ( PrevWeek == "false" ) {
      data = pug.renderFile(templateFile, {
      	node: tableColl
    	});
    } else {
      data = pug.renderFile(templateCompareFile, {
      	node: tableColl
    	});
    }
  }

  if ( tableTeacatAuton != undefined && tableTeacatAuton.length > 0 ) {
    if ( PrevWeek == "false") {
      teacatAuton = pug.renderFile(templateFile, {
        node: tableTeacatAuton
      });
    } else {
      teacatAuton = pug.renderFile(templateCompareFile, {
      	node: tableTeacatAuton
    	});
    }
  }

  var finalToList = toList.map(x => x + "@cisco.com").join();

  //console.log(ViewID);
  //send mail with defined transport object
  return AppView.aggregate([
          {$match :{"ViewID": ViewID[0]}},
          {$lookup : {from : "app_brdg_view_query", localField:"ViewID",foreignField : "ViewID", as:"temp"}},
          {$project : {"ViewID":1,"ViewName":1,
                "Queries":{ $arrayElemAt: ["$temp.Queries",0]}}},
          {$unwind: "$Queries"},
          {$match : { $and: [{ "Queries.QueryType": { $in: ["Defect", "BugBackLog"] } }, { "Queries.Primary": "Y" }] }},
          {$lookup : {from : "app_query",localField:"Queries.QueryID",foreignField:"_id", as:"temp2"}},
          {$project: {"ViewName":1,
                "LastRefreshDate":{ $arrayElemAt: ["$temp2.LastRefreshDate",0]}}},
      ])
      .then(function(ViewNameDoc){
          var latestDate = ViewNameDoc[0].LastRefreshDate;
          var year = latestDate.getFullYear();
          var month = latestDate.getMonth()+1;
          var dt = latestDate.getDate()+1;
          var hour = latestDate.getHours();
          var minute = latestDate.getMinutes();
          var second = latestDate.getSeconds();

          if (dt < 10) { dt = '0' + dt; }
          if (month < 10) { month = '0' + month; }
          if (hour < 10) { hour = '0' + hour; }
          if (minute < 10) { minute = '0' + minute; }
          if (second < 10) { second = '0' + second; }
          var formattedDate = month + '/' + dt + '/' + year + ' ' + hour + ':' + minute + ':' + second + ' PST';

          var finalData = "<font size='2' face='Arial,Helvetica,sans-serif'>Hi,<br/><br/>&emsp;&emsp;" + body ;
          finalData = finalData + "<br/><br/>&emsp;&emsp;Data for: <i><b>View ID: </b><a href='http://wwwin-cqi.cisco.com/cqi/orgViewReport.htm?viewId="+ViewID+"&viewType=org'>"+ ViewID +"</a>, <b>View Name: </b>" + ViewNameDoc[0].ViewName + ", <b>As of:</b> "+formattedDate+"</i><br/><br/>";
          if (data.length > 0) { finalData = finalData + data + '<br/><br/>'; }
          if (teacatAuton.length > 0) { finalData = finalData + teacatAuton + '<br/><br/>'; }
          finalData = finalData + '<font size="1" >The above data has been generated on <b>'+ dateNow + '</b>, the actual data may vary as of now.';
          finalData = finalData + '<br><br>To unsubscribe contact ' + CreatedBy + '@cisco.com </font>';

          let mailOptions = {
                from: CreatedBy+'@cisco.com', // sender address
                to: finalToList, // list of receivers
                subject: "["+NotifName+"] " + subject, // Subject line
                text: 'Hello world?', // plain text body
                html: finalData // html body
                //attachments: [{
                //    filename: 'chart.jpeg',
                //    path: __dirname + '\\chart.jpeg',
                //    cid: 'image1@embed.com' //same cid value as in the html img src
                //}]
          };

          return transporter.sendMail(mailOptions, (error, info) => {
        	    if (error) {
        					//res.jsend.fail("Mail Send failed")
        	        return error;
        	    }

              //Update LastRunDate with current date.
              return AppMailNotif.update({"NotifID":NotifID},{$set : {"LastRunDate":new Date()}})
              .then(function(upd){
                if (upd["ok"] == 1){
                  return "Success";
                } else {
                    return "Failure";
                }
              })
        });
    });
};

//Send a test mail
exports.sendSampleMail = function (req, res) {
	var errors = util.requireFields(req.body, ['email']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}

	var templateFile =  __dirname +  "/../../../mail_templates/table_trend.pug";
	var data = pug.renderFile(templateFile, {
  	node: sampData
	});

  data = data + '<br/><br/>The above data has been generated on <b>'+ dateNow + '</b> the actual data may vary';

  let mailOptions = {
        from: '"CQI-Mailer" <no-reply@cisco.com>', // sender address
        to: req.body.email, // list of receivers
        subject: 'Mail testing', // Subject line
        text: 'Hello world?', // plain text body
        html: data // html body
        //attachments: [{
        //    filename: 'chart.jpeg',
        //    path: __dirname + '\\chart.jpeg',
        //    cid: 'image1@embed.com' //same cid value as in the html img src
        //}]
    };


	//send mail with defined transport object
	transporter.sendMail(mailOptions, (error, info) => {
	    if (error) {
					res.jsend.fail("Mail Send failed")
	        return console.log(error);
	    }
	    console.log('Message sent: %s', info.messageId);
	    // Preview only available when sending through an Ethereal account
	    console.log('Preview URL: %s', mailer.getTestMessageUrl(info));
			res.jsend.success("Sample Mail Sent successfully")
	    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
	    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
	});

}

//To get list of all mail notifications
exports.getMailNotif = function (req, res) {
	var errors = util.requireFields(req.query, ['UserID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var user_id = req.query.UserID; var widget_docs=[];
	var query = {$and:[{"CreatedBy":user_id},{"ActiveFlag":"Y"}]};
	AppMailNotif.aggregate([{$match: query},
                        {$project : {"_id":0,"NotifName":1,"NotifID":1,"ViewID":1,
                                "ViewType":1,"EndDate":"$DueOn","StartDate":"$StartOn",
                                "Metrics" :"$MetricDetails", "Subject" :1,"BuName":1,"Frequency":"$Repeat",
                                "Days":"$RepeatOn","Hierarchy":1,"PrevWeek" :1,"Notes":"$Body",
                                "SendTo":"$To","LastRunDate":1,"UserID":1,"DataFor":"$UsersList","BuName":1,"HierarchyType":1
                          }}])
	.then(function(docs){
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
}

//To save/update mail notification
exports.saveMailNotif = function (req, res) {
	var errors = util.requireFields(req.body, ['NotifName','ViewID','ViewType','Metrics',
                                              'Subject','BuName','Frequency','UserID',
                                              'SendTo','StartDate','Hierarchy','PrevWeek',
                                              'DataFor','Notes']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}

  var HierarchyType = req.body.HierarchyType == undefined ? "": req.body.HierarchyType;
  var DueOn = req.body.EndDate;
  var Days = req.body.days;
  var toUsersList = req.body.SendTo;
  var ccUserList = req.body.Cc;
  var dataForList = req.body.DataFor;

  toUsersList = toUsersList.toString().toLowerCase();
  ccUserList = ccUserList != undefined ? ccUserList.toString().toLowerCase():undefined;
  dataForList = dataForList.toString().toLowerCase();

  toUsersList = toUsersList.replace(/@cisco.com/g,"").replace(/;/g,",").replace(/ /g,"").split(",");
  ccUserList = ccUserList != undefined ? ccUserList.replace(/@cisco.com/g,"").replace(/;/g,",").replace(/ /g,"").split(","):undefined;
  dataForList = dataForList.replace(/@cisco.com/g,"").replace(/;/g,",").replace(/ /g,"").split(",");

	if(req.body.NotifID == "" || req.body.NotifID == undefined) {
		var insertJson = {
			"_id" : new ObjectId(),
      "NotifName" : req.body.NotifName,
      "To" : toUsersList,
      "Cc" : ccUserList,
      "Subject" : req.body.Subject,
      "Body" : req.body.Notes,
      "BuName" : req.body.BuName,
			"MetricDetails" : req.body.Metrics,
			"ViewID" : req.body.ViewID,
			"ViewType" : req.body.ViewType,
      "UsersList" : dataForList,
			"Repeat" : req.body.Frequency,
			"RepeatOn" : req.body.Days,
      "StartOn" : new Date(req.body.StartDate),
			"DueOn" : DueOn,
			"LastRunDate" : new Date("1984-12-10"),
      "ActiveFlag":"Y",
			"CreatedDate" : new Date(),
			"CreatedBy" : req.body.UserID,
			"LastUpdatedDate" : new Date(),
			"LastUpdatedBy" : req.body.UserID,
      "Hierarchy" : req.body.Hierarchy,
      "HierarchyType" : HierarchyType,
      "PrevWeek" : req.body.PrevWeek
		};
		AppMailNotif.count({"NotifName":req.body.NotifName})
		.then(function(count) {
			if(count==0) {
				AppMailNotif.count().then(function(count){
					var NotifID = parseInt(count)+1;
					insertJson["NotifID"] = NotifID;
					var data=new AppMailNotif(insertJson);
					data.save()
					.then(function(savedDoc){
              var htmlData = "New email scheduled information<br/>";
              htmlData = htmlData + "UserID: " + req.body.UserID + "</br>";
              htmlData = htmlData + "Notification ID: "+ NotifID + "</br>";
              htmlData = htmlData + "Notification Name: "+ req.body.NotifName + "</br>";
              var env = config.util.getEnv('NODE_ENV');
              let mailOptions = {
                    from: '"CQI-Mailer" <no-reply@cisco.com>', // sender address
                    to: "cqi-etl@cisco.com", // list of receivers
                    subject: '[Info] ['+env+'] New E-Mail Scheduled', // Subject line
                    text: 'Hello world?', // plain text body
                    html: htmlData // html body
                };
              transporter.sendMail(mailOptions, (error, info) => {
            	    /*if (error) {
            					//res.jsend.fail("Mail Send failed")
            	        return console.log(error);
            	    }*/
            	});

              return NotifID;
					}).then(res.jsend.success, res.jsend.error)
				})
			} else {
				var err_res="notif_name_exists";
				res.jsend.fail(err_res);
			}
		});
	} else {

		updateJson={
			"NotifName" : req.body.NotifName,
			"ViewID" : req.body.ViewID,
			"Metrics" : req.body.Metrics,
			"Subject" : req.body.Subject,
			"Frequency" : req.body.Frequency,
			"BuName" : req.body.BuName,
			"LastUpdatedDate" : new Date(),
			"LastUpdatedBy" : req.body.UserID,
      "Hierarchy" : req.body.Hierarchy,
      "HierarchyType" : HierarchyType,
      "PrevWeek" : req.body.PrevWeek,
      "Repeat" : req.body.Frequency,
			"RepeatOn" : req.body.Days,
      "UsersList" : dataForList,
      "DueOn" : DueOn,
      "Body" : req.body.Notes,
      "To" : toUsersList,
		}
		AppMailNotif.count({$and:[{"NotifID":{$ne:req.body.NotifID}},{"NotifName":req.body.NotifName}]})
		.then(function(count) {
			if(count==0) {
				var NotifID = req.body.NotifID;
				updateJson["NotifID"] = NotifID;
				AppMailNotif.update({"NotifID":NotifID},{$set : updateJson})
				.then(function(updatedDoc){
				      return NotifID;
				}).then(res.jsend.success,res.jsend.error);
			}
			else{
				var err_res="notif_name_exists";
				res.jsend.fail(err_res);
			}
		})
	}
};

//To delete metric notifs
exports.deleteMailNotif = function (req, res) {
	var errors = util.requireFields(req.body, ['NotifID','UserID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var notif_id = req.body.NotifID;
	var user_id = req.body.UserID;
	AppMailNotif.findOne({"NotifID":notif_id},{"CreatedBy":1,"_id":0})
	.then(function(doc){
		//console.log("found 1");
		if(doc["CreatedBy"] == user_id){
			AppMailNotif.update({"NotifID":notif_id},{$set:{"ActiveFlag":"N"}})
			.then(function(delflag){
				//console.log("deleted one");
				res.jsend.success({"Deleted":1})
			})
		}
		else{
			res.jsend.fail("No access to delete Mail Notifcation");
		}
	})
};


//Function to notify users while sharing the wiget.
exports.sendSharedWidgetMail = function(sharedby, sharedto, widgetname, coowners, type, createdby, viewId){

  var finalToList = sharedto.map(x => x + "@cisco.com").join();
  var finalCcList = coowners.map(x => x + "@cisco.com").join();
  var linktoGo = "";

  if (config.util.getEnv('NODE_ENV') == "prod") {
    linktoGo = "https://wwwin-cqi.cisco.com/cqi/widgetReport.htm?widgetId="+widgetname+"&primary=Y&hierarchy=org&viewId="+viewId;
  } else {
    linktoGo = "https://wwwin-cqi-stage.cisco.com/cqi/widgetReport.htm?widgetId="+widgetname+"&primary=Y&hierarchy=org&viewId="+viewId;
  }

  finalCcList = finalCcList + "," + createdby + "@cisco.com";

  Employees.aggregate([
      {'$match':{'Userid':sharedby}},
      {'$project':{"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
  ])
  .then(function(sharedbyName){

    var data = "Hi,";

    if ( type != "Co-Owner") {
      data = data + '<br/><br/>    This Widget <b><a href="'+linktoGo+'">'+widgetname+'</a></b> has been shared with you by <b>'+ sharedbyName[0].EmpName +'</b>';
    } else {
      data = data + '<br/><br/>    You are now Co-Owner of the Widget <b><a href="'+linktoGo+'">'+widgetname+'</a></b>, which has been shared by <b>'+ sharedbyName[0].EmpName +'</b>';
    }

    data = data + "<br/><br/>Regards,<br/>CQI"

    let mailOptions = {
          from: '"CQI-Mailer" <no-reply@cisco.com>', // sender address
          to: finalToList, // list of receivers
          cc: finalCcList,
          subject: 'CQI : Widget-'+widgetname+' Shared', // Subject line
          text: 'Hello world?', // plain text body
          html: data
      };


    //send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        //console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        //console.log('Preview URL: %s', mailer.getTestMessageUrl(info));
        //res.jsend.success("Sample Mail Sent successfully")
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
  })
};
