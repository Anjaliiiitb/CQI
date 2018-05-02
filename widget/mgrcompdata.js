var util = require('../util');
var _ =require('underscore');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var Employees=require('../../../models/widget/employees');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var Func=require('./reuse_functions');
var FlagMetrics=require('../../data/widget/flag_metrics');

/**
* Display Manager Component data for Manager
*/
exports.viewIdMgrData = function (req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }
  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	
	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var dataArr=[]; var dataJson={};
	var tasks=[];

  //Get the basic attributes for the viewID such as queryId,allMetrics, sumMetrics etc.
  tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type));
  Promise.all(tasks)
  .then(function(details){
    query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];

    //Get all weekenddates from the weekenddate collection
    WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      //Trend check flag from request
      if(trend == undefined || trend == "N"){
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}
        //Filter the queryID and latest WeekEnddate and find the metrics and grouped by Manager ID
        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : new Date(latestDate.toISOString())} ]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Name",Metrics: {$addToSet:"$Metric"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"Metrics":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){

          var dataJson2 ;
          data.forEach(function(manager){
            dataJson2 = {};
            manager.Metrics.forEach(function(metric){
              dataJson2[metric.MetricName] = metric.MetricCount
            })

            var pinJson={};
            pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
            pinJson["Name"] = manager._id;
            pinJson["EmpName"] = manager.FullName;
            //pinJson["ViewID"] = view_id;
            dataArr.push(pinJson);
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
            //0 suppression
            var sum_vals=0;
            for (var ea in dataArr[each]) {
              	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
            }
            if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
            //0 suppression end
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["ViewID"]=view_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      }
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : {$in : listOfDates}}]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Name:"$Name",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Name:"$_id.Name",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Name",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"WeekEndMetricsArr":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){
          var dataJson2;
          var final_json = {};
          var dataJson3;

          //For each manager query the same
          data.forEach(function(manager){

            dataJson2 = {};
            //Loop through each week, here it is last two weeks
            manager.WeekEndMetricsArr.forEach(function(weekEndMetric){
              //Reset dataJson3 collection
              dataJson3 = {};

              //Loop through each metrics
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
            })
            if(dataJson2["Curr"] != undefined ){
              for (var key in dataJson2["Curr"]){           	 
            	  dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                  dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
              }

              dataJson2["Curr"]["Name"]=manager._id;
              dataJson2["Curr"]["EmpName"]=manager.FullName;
              //dataJson2["Curr"]["ViewID"]=view_id;
              dataArr.push(dataJson2["Curr"]);
            }
            else{
              dataArr.push({});
            }
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length <= 1){
                delete dataArr[each];
              };
            //0 suppression
            var sum_vals=0;
            for (var ea in dataArr[each]) {
              	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
            }
            if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
            //0 suppression end
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["ViewID"]=view_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }

        })
      } //Trend Check Ends
    })
  })
};

/**
* One step drill down for manager to show its Component
*/
exports.viewIdMgrCompData = function(req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','Manager']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType; var user_id = req.body.Manager;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	
	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
  var tasks=[];
  var dataArr = []; var dataJson = {};

  //Get the basic attributes for the viewID such as queryId,allMetrics, sumMetrics etc.
  tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type));
  Promise.all(tasks)
  .then(function(details){
    query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
    config = details[0][4]; avgConfig = details[0][5];

    WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      //Trend check flag from request
      if(trend == undefined || trend == "N"){
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}
        var user_json = {"DEManagerUserID":user_id}

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : new Date(latestDate.toISOString())},user_json ]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",Component:"$Component"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Component:"$_id.Component",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Component",Metrics: {$addToSet:"$Metric"}}}
        ])
        .then(function(data){
            var dataJson2 = {};
            data.forEach(function(component){

              dataJson2 = {};
                component.Metrics.forEach(function(metric){
                dataJson2[metric.MetricName] = metric.MetricCount
              })

              var pinJson={};
              pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
              pinJson["Name"] = component._id;
              //pinJson["UserID"] = user_id;
              //pinJson["ViewID"] = view_id;
              dataArr.push(pinJson);
            })

            for (var each in dataArr) {

              if(Object.keys(dataArr[each]).length == 1){
                  delete dataArr[each];
              };
              //0 suppression
              var sum_vals=0;
              for (var ea in dataArr[each]) {
                	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
                	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              }
              if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
              //0 suppression end
              
            }
            dataArr = dataArr.filter(function(n){ return n != undefined });
            dataJson["ViewID"]=view_id;
            dataJson["Manager"]=user_id;
            dataJson["Data"]=dataArr;

            if(typeof(dataJson) == "object"){
              res.jsend.success(dataJson);
            }
            else{
              res.jsend.error(dataJson);
            }
        })
      }
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        var user_json = {"DEManagerUserID":user_id}

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : {$in : listOfDates}},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",Component:"$Component",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Component:"$_id.Component",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Component:"$Component",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Component:"$_id.Component",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Component",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          var final_json = {};
          var dataJson3 = {};

          //For Each component under that user loop
          data.forEach(function(component){
            dataJson2 = {};

            component.WeekEndMetricsArr.forEach(function(weekEndMetric){
              dataJson3 = {};

              //Loop through the metrics and implement the mapper array
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
          })

          if(dataJson2["Curr"] != undefined ){
            for (var key in dataJson2["Curr"]){
            	  dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                  dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
            }

            dataJson2["Curr"]["Name"]=component._id;
            //dataJson2["Curr"]["UserID"]=user_id;
            //dataJson2["Curr"]["ViewID"]=view_id;
            dataArr.push(dataJson2["Curr"]);
          }
          else{
            dataArr.push({});
          }
        })

        for (var each in dataArr) {
        	if(Object.keys(dataArr[each]).length <= 1){
              delete dataArr[each];
            };
            //0 suppression
            var sum_vals=0;
            for (var ea in dataArr[each]) {
              	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
            }
            if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
            //0 suppression end
        }
        dataArr = dataArr.filter(function(n){ return n != undefined });
        dataJson["ViewID"]=view_id;
        dataJson["Manager"]=user_id;
        dataJson["Data"]=dataArr;

        if(typeof(dataJson) == "object"){
          res.jsend.success(dataJson);
        }
        else{
          res.jsend.error(dataJson);
        }
    })
    }
  })
})
};

/*
  Trend data for view
*/
exports.viewIdMgrCompTrendData=function(req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
  var user_id = req.body.Manager;
  var component=req.body.Component;
	var weeks=req.body.Weeks;

  if (user_id == undefined) {user_id = /.*/}

  //Trend Start date and end date is mandatory
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}

  var date1=req.body.DateStart; var date2=req.body.DateEnd;

  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var query={}; var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];
	var tasks=[];

  //Fetch all mapped metrices from model
  tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
    query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];

		WeekEndDates.find({},{_id:0})
    .then(function(weeks2){

      //Actual list of dates form the request body
      listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
      if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
      if(component != undefined){query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"Component":component},{"DEManagerUserID":user_id}]}}
      else{query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":user_id}]}}

      FactDefectAgg.aggregate([
        {$match : query},
        {$unwind:"$MetricAttrib"},
        {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
        {$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
        {$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{Metric:"$_id.MetricName",Value:"$MetricCount"}}}},
        {$project:{"Date":"$_id",_id:0,data:1}},
        {$sort: {"Date": -1}}
      ])
      .then (function(data){
        data.forEach(function(doc){
          var compJson2 = {};
          doc.data.forEach(function(d){
            compJson2[d.Metric] = d.Value;
          })

          var compJson = {};
          compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
          compJson["Date"]=doc["Date"];
          datesAvaib.push(doc["Date"])
          dataArr.push(compJson);
        })

        if(listOfDates.length != datesAvaib.length){
          dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
        }
        dataJson["ViewID"]=view_id;
        dataJson["TrendData"]=dataArr;
        return dataJson;
         })
         .then(res.jsend.success, res.jsend.error);
       })
    })
};

/*
  Search Manager with view ID
*/
exports.viewIdMgrSearch = function(req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','UserID']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend;var user_id =  req.body.UserID; var week_date=req.body.WeekDate;
  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var dataArr=[]; var dataJson={};
	var tasks=[];

  //Get the basic attributes for the viewID such as queryId,allMetrics, sumMetrics etc.
  tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type));
  Promise.all(tasks)
  .then(function(details){
    query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];

    WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      if(trend == undefined || trend == "N") {
        var user_json = {"DEManagerUserID": {$in : user_id}};
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : new Date(latestDate.toISOString())},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Name",Metrics: {$addToSet:"$Metric"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"Metrics":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data) {
          var dataJson2 = {};
          data.forEach(function(manager){
            dataJson2 = {};
            manager.Metrics.forEach(function(metric){
              dataJson2[metric.MetricName] = metric.MetricCount
            })

            var pinJson={};
            pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
            pinJson["Name"] = manager._id;
            pinJson["EmpName"] = manager.FullName;
            //pinJson["ViewID"] = view_id;
            dataArr.push(pinJson);
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["ViewID"]=view_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      }
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        var user_json = {"DEManagerUserID": {$in : user_id}};

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID":{$in : query_ids}},{"WeekEndDate" : {$in : listOfDates}},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Name:"$Name",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Name:"$_id.Name",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Name",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"WeekEndMetricsArr":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          var final_json = {};
          var dataJson3 = {};

          //For each manager query the same
          data.forEach(function(manager){

            dataJson2 = {};
            //Loop through each week, here it is last two weeks
            manager.WeekEndMetricsArr.forEach(function(weekEndMetric){
              //Reset dataJson3 collection
              dataJson3 = {};
              //Loop through each metrics
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
            })

            if(dataJson2["Curr"] != undefined){
              for (var key in dataJson2["Curr"]){
            	    dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                    dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
              }

              dataJson2["Curr"]["Name"]=manager._id;
              dataJson2["Curr"]["EmpName"]=manager.FullName;
              //dataJson2["Curr"]["ViewID"]=view_id;
              dataArr.push(dataJson2["Curr"]);
            }
            else{
              dataArr.push({});
            }
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["ViewID"]=view_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      } //trend check ends here
    })
  })
};

/**
*   Display Manager based on QueryID
*/
exports.queryIdMgrData = function(req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','QueryID','Primary']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend; var query_id = req.body.QueryID; var primary = req.body.Primary; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
  var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var dataArr=[]; var dataJson={};
	var tasks=[];

  tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
  Promise.all(tasks)
  .then(function(details) {
    allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      //Trend check flag from request
      if(trend == undefined || trend == "N"){
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}
        //Filter the queryID and latest WeekEnddate and find the metrics and grouped by Manager ID
        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : new Date(latestDate.toISOString())} ]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Name",Metrics: {$addToSet:"$Metric"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"Metrics":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          data.forEach(function(manager){
            dataJson2 = {};
            manager.Metrics.forEach(function(metric){
              dataJson2[metric.MetricName] = metric.MetricCount
            })

            var pinJson={};
            pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
            pinJson["Name"] = manager._id;
            pinJson["EmpName"] = manager.FullName;
            //pinJson["QueryID"] = query_id;
            dataArr.push(pinJson);
          })

          for (var each in dataArr) {
        	  if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
              //0 suppression
              var sum_vals=0;
              for (var ea in dataArr[each]) {
                	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
                	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              }
              if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
              //0 suppression end
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["QueryID"]=query_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      }
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : {$in : listOfDates}}]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Name:"$Name",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Name:"$_id.Name",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Name",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"WeekEndMetricsArr":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          var final_json = {};
          var dataJson3 = {};

          //For each manager query the same
          data.forEach(function(manager){

            dataJson2 = {};
            //Loop through each week, here it is last two weeks
            manager.WeekEndMetricsArr.forEach(function(weekEndMetric){
              //Reset dataJson3 collection
              dataJson3 = {};
              //Loop through each metrics
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
            })

            if(dataJson2["Curr"] != undefined){
              for (var key in dataJson2["Curr"]){
            	  dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                  dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
              }

              dataJson2["Curr"]["Name"]=manager._id;
              dataJson2["Curr"]["EmpName"]=manager.FullName;
              dataArr.push(dataJson2["Curr"]);
            }
            else{
              dataArr.push({});
            }
          })

          for (var each in dataArr) {
        	  if(Object.keys(dataArr[each]).length <= 1){
                delete dataArr[each];
              };
              //0 suppression
              var sum_vals=0;
              for (var ea in dataArr[each]) {
                	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
                	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              }
              if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
              //0 suppression end
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["QueryID"]=query_id;
          dataJson["TrendData"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      } //Trend check ends here
    })
  })
};

/**
* Display component based on query id and component
*/
exports.queryIdMgrCompData = function (req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','QueryID','Primary','Manager']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend; var query_id = req.body.QueryID; var primary = req.body.Primary; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
	var user_id = req.body.Manager;

  var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var dataArr=[]; var dataJson={};
	var tasks=[];

  tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
  Promise.all(tasks)
  .then(function(details){

    allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      var user_json = {"DEManagerUserID":user_id}
      //Trend check flag from request
      if(trend == undefined || trend == "N"){
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}
    FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : new Date(latestDate.toISOString())},user_json ]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",Component:"$Component"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Component:"$_id.Component",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Component",Metrics: {$addToSet:"$Metric"}}}
        ])
        .then(function(data){
            var dataJson2 = {};
            data.forEach(function(component){

              dataJson2 = {};
                component.Metrics.forEach(function(metric){
                dataJson2[metric.MetricName] = metric.MetricCount
              })

              var pinJson={};
              pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
              pinJson["Name"] = component._id;
              //pinJson["UserID"] = user_id;
              //pinJson["ViewID"] = view_id;
              dataArr.push(pinJson);
            })

            for (var each in dataArr) {
            	if(Object.keys(dataArr[each]).length == 1){
                  delete dataArr[each];
                };
                //0 suppression
                var sum_vals=0;
                for (var ea in dataArr[each]) {
                  	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
                  	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
                }
                if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
                //0 suppression end
            }
            dataArr = dataArr.filter(function(n){ return n != undefined });
            dataJson["QueryID"]=query_id;
            dataJson["Data"]=dataArr;

            if(typeof(dataJson) == "object"){
              res.jsend.success(dataJson);
            }
            else{
              res.jsend.error(dataJson);
            }
        })
      }
      // Trend = Y continue with else
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : {$in : listOfDates}},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",Component:"$Component",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Component:"$_id.Component",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Component:"$Component",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Component:"$_id.Component",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Component",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          var final_json = {};
          var dataJson3 = {};

          //For Each component under that user loop
          data.forEach(function(component){
            dataJson2 = {};

            component.WeekEndMetricsArr.forEach(function(weekEndMetric){
              dataJson3 = {};

              //Loop through the metrics and implement the mapper array
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
          })

          if(dataJson2["Curr"] != undefined ){
            for (var key in dataJson2["Curr"]){
            	dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
            }

            dataJson2["Curr"]["Name"]=component._id;
            //dataJson2["Curr"]["UserID"]=user_id;
            //dataJson2["Curr"]["ViewID"]=view_id;
            dataArr.push(dataJson2["Curr"]);
          }
          else{
            dataArr.push({});
          }
        })

        for (var each in dataArr) {
        	if(Object.keys(dataArr[each]).length <= 1){
              delete dataArr[each];
            };
            //0 suppression
            var sum_vals=0;
            for (var ea in dataArr[each]) {
              	if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
              	else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataArr[each][ea];}
            }
            if(sum_vals == (metrics_good.length * 100)){delete dataArr[each]}
            //0 suppression end
        }
        dataArr = dataArr.filter(function(n){ return n != undefined });
        dataJson["QueryID"]=query_id;
        dataJson["Manager"]=user_id;
        dataJson["Data"]=dataArr;

        if(typeof(dataJson) == "object"){
          res.jsend.success(dataJson);
        }
        else{
          res.jsend.error(dataJson);
        }
      })
      } // Trend check ends here
    })
  })
};


/**
* Manager Trend Data
*/
exports.queryIdMgrCompTrendData = function (req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','Primary','QueryID']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
  var user_id = req.body.Manager;var query_id = req.body.QueryID; var primary = req.body.Primary;
  var component=req.body.Component;	var weeks=req.body.Weeks;

  if (user_id == undefined) {user_id = /.*/}

  //Trend Start date and end date is mandatory
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}

  var date1=req.body.DateStart; var date2=req.body.DateEnd;

  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var query={}; var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];
	var tasks=[];

  //Fetch all mapped metrices from model
  tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
  Promise.all(tasks)
  .then(function(details){
    allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
    .then(function(weeks2){
      //Actual list of dates form the request body
      listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
      if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
      if(component != undefined){query={'$and':[{"QueryID": query_id},{"WeekEndDate":{'$in':listOfDates}},{"Component":component},{"DEManagerUserID":user_id}]}}
      else{query={'$and':[{"QueryID": query_id },{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":user_id}]}}

      FactDefectAgg.aggregate([
        {$match : query},
        {$unwind:"$MetricAttrib"},
        {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
        {$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
        {$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{Metric:"$_id.MetricName",Value:"$MetricCount"}}}},
        {$project:{"Date":"$_id",_id:0,data:1}},
        {$sort: {"Date" : -1}}
      ])
      .then (function(data){
        data.forEach(function(doc){
          var compJson2 = {};
          doc.data.forEach(function(d){
            compJson2[d.Metric] = d.Value;
          })

          var compJson = {};
          compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
          compJson["Date"]=doc["Date"];
          datesAvaib.push(doc["Date"])
          dataArr.push(compJson);
        })

        if(listOfDates.length != datesAvaib.length){
          dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
        }
        dataJson["QueryID"]=query_id;
        dataJson["Data"]=dataArr;
        return dataJson;
        })
         .then(res.jsend.success, res.jsend.error);
       })
    })
};

/**
* List the component based on Qurery id and manager
*/
exports.queryIdMgrSearch = function (req, res) {
  var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','UserID','QueryID','Primary']);
  if(errors){
    res.jsend.fail(errors);
    return;
  }

  var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend;var user_id =  req.body.UserID; var query_id = req.body.QueryID;
  var primary = req.body.Primary; var week_date=req.body.WeekDate;

  var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var dataArr=[]; var dataJson={};
	var tasks=[];

  //Fetch all mapped metrices from model
  tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
  Promise.all(tasks)
  .then(function(details){
    allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
    .then(function(weeks){
      if(trend == undefined || trend == "N") {
        var user_json = {"DEManagerUserID": {$in : user_id}};
		var latestDate;
		if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
		}

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : new Date(latestDate.toISOString())},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:"$Name",Metrics: {$addToSet:"$Metric"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"Metrics":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data) {
          var dataJson2 = {};
          data.forEach(function(manager){
            dataJson2 = {};
            manager.Metrics.forEach(function(metric){
              dataJson2[metric.MetricName] = metric.MetricCount
            })

            var pinJson={};
            pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
            pinJson["Name"] = manager._id;
            pinJson["EmpName"] = manager.FullName;
            //pinJson["ViewID"] = view_id;
            dataArr.push(pinJson);
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["QueryID"]=query_id;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      }
      else {
		var listOfDates;
		if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
		else{
			var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
			if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
		}
        var user_json = {"DEManagerUserID": {$in : user_id}};

        FactDefectAgg.aggregate([
          {$match : {$and : [{"QueryID": query_id},{"WeekEndDate" : {$in : listOfDates}},user_json]}},
          {$unwind : "$MetricAttrib"},
          {$match : {"MetricAttrib.Name" : {$in :allMetrics}}},
          {$group : {_id:{MetricName:"$MetricAttrib.Name",DEManagerUserID:"$DEManagerUserID",WeekEndDate:"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
          {$project : {Name:"$_id.DEManagerUserID",WeekEndDate:"$_id.WeekEndDate",Metric:{MetricName:"$_id.MetricName","MetricCount":"$MetricCount"},_id:0}},
          {$group : {_id:{Name:"$Name",WeekEndDate:"$WeekEndDate"},Metrics: {$addToSet:"$Metric"}}},
          {$project : {Name:"$_id.Name",WeekEndMetrics:{WeekEndDate:"$_id.WeekEndDate",Metrics:"$Metrics"},_id:0}},
          {$group : {_id:"$Name",WeekEndMetricsArr:{$addToSet:"$WeekEndMetrics"}}},
          {$lookup: {from:"employees", localField:"_id", foreignField:"Userid", as:"temp"}},
          {$project : {"WeekEndMetricsArr":1, "FullName":{$concat :[{$arrayElemAt : ["$temp.Givenname",0]}," ",{$arrayElemAt : ["$temp.SN",0]}]}}}
        ])
        .then(function(data){
          var dataJson2 = {};
          var final_json = {};
          var dataJson3 = {};

          //For each manager query the same
          data.forEach(function(manager){

            dataJson2 = {};
            //Loop through each week, here it is last two weeks
            manager.WeekEndMetricsArr.forEach(function(weekEndMetric){
              //Reset dataJson3 collection
              dataJson3 = {};
              //Loop through each metrics
              weekEndMetric.Metrics.forEach(function(metric){
                dataJson3[metric.MetricName] = metric.MetricCount;
              })
              final_json = {};
              final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson3, avgConfig, config);
              if (weekEndMetric.WeekEndDate.getTime() == listOfDates[0].getTime()){dataJson2["Curr"] = final_json;}
              else if (weekEndMetric.WeekEndDate.getTime() == listOfDates[1].getTime()){dataJson2["Prev"] = final_json}
            })

            if(dataJson2["Curr"] != undefined){
              for (var key in dataJson2["Curr"]){
            	  dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
                  dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
              }

              dataJson2["Curr"]["Name"]=manager._id;
              dataJson2["Curr"]["EmpName"]=manager.FullName;
              //dataJson2["Curr"]["ViewID"]=view_id;
              dataArr.push(dataJson2["Curr"]);
            }
            else{
              dataArr.push({});
            }
          })

          for (var each in dataArr) {
            if(Object.keys(dataArr[each]).length == 1){
                delete dataArr[each];
              };
          }
          dataArr = dataArr.filter(function(n){ return n != undefined });
          dataJson["QueryID"]=QueryID;
          dataJson["Data"]=dataArr;

          if(typeof(dataJson) == "object"){
            res.jsend.success(dataJson);
          }
          else{
            res.jsend.error(dataJson)
          }
        })
      } //trend check ends here
    })
  })
};
