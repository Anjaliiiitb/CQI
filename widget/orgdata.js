var winston = require('winston');
var util = require('../util');
var _ =require('underscore');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var Employees=require('../../../models/widget/employees');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var Func=require('./reuse_functions');
var FlagMetrics=require('../../data/widget/flag_metrics');

/* topHier - get top hierarchy of a UserID (or upto Num levels)
 * */
exports.topHier = function (req, res) {
	var errors = util.requireFields(req.body, ['UserID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var user_id=req.body.UserID; var num=req.body.Num;
	Employees.find({"Userid":user_id}, {"topHier":1, _id:0})
	.then(function(docs){
		if(docs.length == 0) return [];
		return (num == undefined ? docs[0].topHier : docs[0].topHier.slice(0,num));
	})
	.then(res.jsend.success, res.jsend.error)
};

/* OrgUserListSearch - List all Org Users
 * */
exports.OrgUserListSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['UserIDS']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var user_ids=req.body.UserIDS;
	var user_ids_re=[];
	user_ids.forEach(function(userid){
		user_ids_re.push(new RegExp(userid,"i"))
	});
	Employees.aggregate([
	    {$project:{"Name":{$concat:["$Givenname"," ","$SN"]}, "Userid":1, "_id":0}},
	    {$match:{$or:[{"Userid":{$in:user_ids_re}},{"Name":{$in:user_ids_re}}]}}
	])
	.then(function(docs){
		return docs;
	})
	.then(res.jsend.success, res.jsend.error)
};

/* queryIdOrgData - L3 Level Org data for a QueryID
 * */
exports.queryIdOrgData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','ViewID','Metrics','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var trend=req.body.Trend; var week_date=req.body.WeekDate;

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
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				var emp_arr_query=[]
				emp_arr_query=[{'$match':{'topHier':{'$size':2}}},
				     {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
				Employees.aggregate([
				    emp_arr_query
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
						    {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
						    {$unwind:"$MetricAttrib"},
						    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						    {$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
						])
						.then(function(data){
							var dataJson2={}
							for (var item in data) {
								dataJson2[data[item]._id]=data[item].MetricCount;
							}
							var pinJson={};
							pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
				    	    pinJson["Name"]=user.Userid; pinJson["EmpName"]=user.Name;
				    	    pinJson["QueryID"]=query_id
				    	    dataArr.push(pinJson);
					    	if(dataArr.length == len){
					    		for (var each in dataArr) {
					    			if(Object.keys(dataArr[each]).length == 3){
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
					    	}
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				var emp_arr_query=[]
				emp_arr_query=[{'$match':{'topHier':{'$size':2}}},
				     {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
				Employees.aggregate([
				    emp_arr_query
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
	                      	{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},user_json]}},
	                      	{$unwind:"$MetricAttrib"},
	                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
	                    ])
						.then(function(data){
							var dataJson2={}
							data.forEach(function(doc){
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
								for (var key in dataJson2["Curr"]){
									dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
		    	   					dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
				                }
								dataJson2["Curr"]["Name"]=user.Userid; dataJson2["Curr"]["EmpName"]=user.Name;
								dataJson2["Curr"]["QueryID"]=query_id;								
								dataArr.push(dataJson2["Curr"])
							}
							else{
								dataArr.push({});
							}
					    	if(dataArr.length == len){
					    		for (var each in dataArr) {
					    			if(Object.keys(dataArr[each]).length == 0){
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
					    	}
						})
					})
				})
			}
		})
	})
};

/* queryIdOrgUserData - Org hierarchy data for a UserID for a QueryID
 * */
exports.queryIdOrgUserData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','ViewID','Metrics','UserID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_id=req.body.QueryID; var user_id=req.body.UserID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var trend=req.body.Trend; var week_date=req.body.WeekDate;

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
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				return Employees.distinct("directReportList",{"Userid":user_id})
				.then(function(empl){
					var emp_arr_query=[]
					emp_arr_query=[{'$match':{'Userid':{'$in':empl}}},
						{'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
					Employees.aggregate([
					    emp_arr_query
					])
					.then(function(users){
						if(users.length==0){res.jsend.success([]); return;}
						var len=users.length;
						users.forEach(function(user){
							var test_json={}
							if("listOfUsers" in user)
								var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
							else{
								var user_json = {"DEManagerUserID":user.Userid}
							}
							FactDefectAgg.aggregate([
							    {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
							    {$unwind:"$MetricAttrib"},
							    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
							    {$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
							])
							.then(function(data){
								var dataJson2={}
								for (item in data) {
									dataJson2[data[item]._id]=data[item].MetricCount;
								}
								var pinJson={};
								pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config)
					    	    pinJson["Name"]=user.Userid; pinJson["EmpName"]=user.Name;
					    	    pinJson["QueryID"]=query_id;
					    	    dataArr.push(pinJson);
						    	if(dataArr.length == len){
						    		for (var each in dataArr) {
						    			if(Object.keys(dataArr[each]).length == 3){
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
						    	}
							})
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				return Employees.distinct("directReportList",{"Userid":user_id})
				.then(function(empl){
					var emp_arr_query=[]
					emp_arr_query=[{'$match':{'Userid':{'$in':empl}}},
						{'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
					Employees.aggregate([
					    emp_arr_query
					])
					.then(function(users){
						if(users.length==0){res.jsend.success([]); return;}
						var len=users.length;
						users.forEach(function(user){
							var test_json={}
							if("listOfUsers" in user)
								var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
							else{
								var user_json = {"DEManagerUserID":user.Userid}
							}
							FactDefectAgg.aggregate([
		                      	{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},user_json]}},
		                      	{$unwind:"$MetricAttrib"},
		                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
		                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
		                    ])
							.then(function(data){
								var dataJson2={}
								data.forEach(function(doc){
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
									for (var key in dataJson2["Curr"]){
										dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
			    	   					dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up" : (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
					                }
									dataJson2["Curr"]["Name"]=user.Userid; dataJson2["Curr"]["EmpName"]=user.Name;
									dataJson2["Curr"]["QueryID"]=query_id;
									dataArr.push(dataJson2["Curr"])
								}
								else{
									dataArr.push({});
								}
						    	if(dataArr.length == len){
						    		for (var each in dataArr) {
						    			if(Object.keys(dataArr[each]).length == 0){
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
						    	}
							})
						})
					})
				})
			}
		})
	})
};

/* queryIdOrgTrendData - UserID based trend for a QueryID
 * */
exports.queryIdOrgTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','ViewID','Metrics','UserID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_id=req.body.QueryID; var user_id=req.body.UserID;
	var primary=req.body.Primary; var view_type=req.body.ViewType;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
    var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];

	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var tasks=[];
	tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
	Promise.all(tasks)
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
			Employees.aggregate([
			    {'$match':{'Userid':user_id}},
			    {'$project':{"Userid":1,"listOfUsers":"$allReportees","_id":0}}
			])
			.then(function(users){
				if("listOfUsers" in users[0]){var user_json= {"DEManagerUserID":{'$in':users[0].listOfUsers}}}
				else{var user_json = {"DEManagerUserID":users[0].Userid}}
				FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{$in:listOfDates}},user_json]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{Metric:"$_id.MetricName",Value:"$MetricCount"}}}},
					{$project:{"Date":"$_id",_id:0,data:1}}
				])
				.then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.data.forEach(function(doc){
							compJson2[doc.Metric]=doc.Value;
						})
					    var compJson={};
						compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						compJson["Date"]=data["Date"];
						datesAvaib.push(data["Date"])
						dataArr.push(compJson);
					});
					if(listOfDates.length != datesAvaib.length){
				 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
				 	}
					dataJson["QueryID"]=query_id;
					dataJson["TrendData"]=dataArr;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
			})
	  	})
	})
};

/* queryIdOrgUserSearch - UserID based Search for QueryID
 * */
exports.queryIdOrgUserSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','UserID','ViewID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID;
	var user_ids=req.body.UserID; var query_ids=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var trend=req.body.Trend; var week_date=req.body.WeekDate;
	
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var user_arr=[]; var flag=0;
	var tasks=[];
	tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_ids, primary, view_type))
	Promise.all(tasks)
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				Employees.aggregate([
				    {'$match':{'Userid':{'$in':user_ids}}},
				    {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
							{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
							{$unwind:"$MetricAttrib"},
							{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
							{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
							{$project:{"QueryID":"$_id.QueryID","MetricName":"$_id.MetricName","MetricValue":"$MetricValue","_id":0}},
							{$group:{_id:"$QueryID","OrgData":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
							{$project:{QueryID:"$_id",_id:0,OrgData:1}}
						])
						.then(function(data){
							flag=flag+1
							if(data.length > 0){
								data.forEach(function(data_each){
									var pin_json2={}
									data_each["OrgData"].forEach(function(data_json){
										pin_json2[data_json["MetricName"]]=data_json["MetricValue"]
									})
									var pin_json={}
									pin_json = Func.avg_sum_calc(avgMetrics, sumMetrics, pin_json2, avgConfig, config)
									pin_json["Name"]=user.Userid; pin_json["EmpName"]=user.Name;
									pin_json["QueryID"]=data_each["QueryID"]
									user_arr.push(pin_json)
								})
							}
							return flag;
						})
						.then(function(flag){
							if(flag == len){
								res.jsend.success(user_arr)
							}
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				Employees.aggregate([
				    {'$match':{'Userid':{'$in':user_ids}}},
				    {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
							{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},user_json]}},
							{$unwind:"$MetricAttrib"},
							{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	                  		{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
	                  		{$group:{_id:{"QueryID":"$_id.QueryID","WeekEndDate":"$_id.WeekEndDate"}, Data:{$addToSet:{MetricName:"$_id.MetricName", MetricCount:"$MetricValue"}}}},
	                  	    {$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"QueryID":"$_id.QueryID", data:"$Data"}}}}
						])
						.then(function(data){
							var dataJson2={};
							flag=flag+1
							if(data.length > 0){
								data.forEach(function(doc){
									var final_arr=[]
									doc.dataA.forEach(function(d){
										var dataJson={};
										d.data.forEach(function(d1){
											dataJson[d1.MetricName]=d1.MetricCount;
										})
										var fi_json={}
										fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
										if(Object.keys(fi_json).length != 0){
											fi_json["QueryID"]=d.QueryID; fi_json["EmpName"]=user.Name;
											fi_json["Name"]=user.Userid
											final_arr.push(fi_json)
										}
									})
									if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
									else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
								})
					    		dataJson2["Curr"].forEach(function(js_data){
									var query_id=js_data.QueryID;
									var elem=Object.keys(js_data);
									elem.splice(elem.indexOf("Name"),1)
									elem.splice(elem.indexOf("QueryID"),1)
									elem.splice(elem.indexOf("EmpName"),1)
									elem.forEach(function(ele){
										js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
										if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
										else{
											dataJson2["Prev"].forEach(function(js_data_p){
												if(js_data_p["QueryID"] == query_id){
													js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
												}
											})
										}
										if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
									})
									user_arr.push(js_data)
					    		})
							}
							return flag
						})
						.then(function(flag){
							if(flag == len){
								res.jsend.success(user_arr)
							}
						})
					})
				})
			}
	  	})
	})
};

/* viewIdOrgData - L3 Level Org data for a ViewID (primary queries)
 * */
exports.viewIdOrgData = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','ViewType']);
	if (errors) {
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
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				var emp_arr_query=[]
				emp_arr_query=[{'$match':{'topHier':{'$size':2}}},
				     {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
				Employees.aggregate([
				    emp_arr_query
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
						    {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
						    {$unwind:"$MetricAttrib"},
						    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						    {$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
						])
						.then(function(data){
							var dataJson2={}
							for (var item in data) {
								dataJson2[data[item]._id]=data[item].MetricCount;
							}
							var pinJson={};
							pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
				    	    pinJson["Name"]=user.Userid; pinJson["EmpName"]=user.Name;
				    	    pinJson["ViewID"]=view_id;
				    	    dataArr.push(pinJson);
					    	if(dataArr.length == len){
					    		for (var each in dataArr) {
					    			if(Object.keys(dataArr[each]).length == 3){
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
					    	}
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				var emp_arr_query=[]
				emp_arr_query=[{'$match':{'topHier':{'$size':2}}},
				     {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
				Employees.aggregate([
				    emp_arr_query
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
	                      	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},user_json]}},
	                      	{$unwind:"$MetricAttrib"},
	                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
	                    ])
						.then(function(data){
							var dataJson2={}
							data.forEach(function(doc){
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
								for (var key in dataJson2["Curr"]){
									dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
		    	   					dataJson2["Curr"][key+"_trend"]= (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
				                }
								dataJson2["Curr"]["Name"]=user.Userid; dataJson2["Curr"]["EmpName"]=user.Name;
								dataJson2["Curr"]["ViewID"]=view_id;	
								dataArr.push(dataJson2["Curr"]);
							}
							else{
								dataArr.push({});
							}
					    	if(dataArr.length == len){
					    		for (var each in dataArr) {
					    			if(Object.keys(dataArr[each]).length == 0){
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
					    		  res.jsend.error(dataJson);
					    		}
					    	}
						})
					})
				})
			}
		})
	})
};

/* viewIdOrgUserData - Org hierarchy data for a UserID for a ViewID (primary queries)
 * */
exports.viewIdOrgUserData = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','UserID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var user_id=req.body.UserID; var view_type=req.body.ViewType;
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
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				return Employees.distinct("directReportList",{"Userid":user_id})
				.then(function(empl){
					var emp_arr_query=[]
					emp_arr_query=[{'$match':{'Userid':{'$in':empl}}},
						{'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
					Employees.aggregate([
					    emp_arr_query
					])
					.then(function(users){
						if(users.length==0){res.jsend.success([]); return;}
						var len=users.length;
						users.forEach(function(user){
							var test_json={}
							if("listOfUsers" in user)
								var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
							else{
								var user_json = {"DEManagerUserID":user.Userid}
							}
							FactDefectAgg.aggregate([
							    {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
							    {$unwind:"$MetricAttrib"},
							    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
							    {$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
							])
							.then(function(data){
								var dataJson2={}
								for (item in data) {
									dataJson2[data[item]._id]=data[item].MetricCount;
								}
								var pinJson={};
								pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config)
					    	    pinJson["Name"]=user.Userid;  pinJson["EmpName"]=user.Name;
					    	    pinJson["ViewID"]=view_id;
					    	    dataArr.push(pinJson);
						    	if(dataArr.length == len){
						    		for (var each in dataArr) {
						    			if(Object.keys(dataArr[each]).length == 3){
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
						    	}
							})
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				return Employees.distinct("directReportList",{"Userid":user_id})
				.then(function(empl){
					var emp_arr_query=[]
					emp_arr_query=[{'$match':{'Userid':{'$in':empl}}},
						{'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}];
					Employees.aggregate([
					    emp_arr_query
					])
					.then(function(users){
						if(users.length==0){res.jsend.success([]); return;}
						var len=users.length;
						users.forEach(function(user){
							var test_json={}
							if("listOfUsers" in user)
								var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
							else{
								var user_json = {"DEManagerUserID":user.Userid}
							}
							FactDefectAgg.aggregate([
		                      	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},user_json]}},
		                      	{$unwind:"$MetricAttrib"},
		                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
		                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
		                    ])
							.then(function(data){
								var dataJson2={}
								data.forEach(function(doc){
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
									for (var key in dataJson2["Curr"]){
										dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
			    	   					dataJson2["Curr"][key+"_trend"] = (dataJson2["Prev"] == undefined)? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
					                }
									dataJson2["Curr"]["Name"]=user.Userid; dataJson2["Curr"]["EmpName"]=user.Name;
									dataJson2["Curr"]["ViewID"]=view_id;
									dataArr.push(dataJson2["Curr"])
								}
								else{
									dataArr.push({});
								}
						    	if(dataArr.length == len){
						    		for (var each in dataArr) {
						    			if(Object.keys(dataArr[each]).length == 0){
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
						    	}
							})
						})
					})
				})
			}
		})
	})
};

/* viewIdOrgTrendData - UserID based trend for a ViewID (primary queries)
 * */
exports.viewIdOrgTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','UserID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var user_id=req.body.UserID;
	var view_type=req.body.ViewType;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
    var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];

	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
			Employees.aggregate([
			    {'$match':{'Userid':user_id}},
			    {'$project':{"Userid":1,"listOfUsers":"$allReportees","_id":0}}
			])
			.then(function(users){
				if("listOfUsers" in users[0]){var user_json= {"DEManagerUserID":{'$in':users[0].listOfUsers}}}
				else{var user_json = {"DEManagerUserID":users[0].Userid}}
				FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},user_json]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{Metric:"$_id.MetricName",Value:"$MetricCount"}}}},
					{$project:{"Date":"$_id",_id:0,data:1}}
				])
				.then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.data.forEach(function(doc){
							compJson2[doc.Metric]=doc.Value;
						})
					    var compJson={};
						compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						compJson["Date"]=data["Date"];
						datesAvaib.push(data["Date"])
						dataArr.push(compJson);
					});
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
	})
};

/* viewIdOrgUserSearch - UserID based Search for ViewID(all primary queries)
 * */
exports.viewIdOrgUserSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','UserID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var user_ids=req.body.UserID; var trend=req.body.Trend; var week_date=req.body.WeekDate;
	
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var user_arr=[]; var flag=0;
	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N"){
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				Employees.aggregate([
				    {'$match':{'Userid':{'$in':user_ids}}},
				    {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}
				])
				.then(function(users){
					if(users.length==0){res.jsend.success([]); return;}
					var len=users.length;
					users.forEach(function(user){
						var test_json={}
						if("listOfUsers" in user)
							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
						else{
							var user_json = {"DEManagerUserID":user.Userid}
						}
						FactDefectAgg.aggregate([
							{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},user_json]}},
							{$unwind:"$MetricAttrib"},
							{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
							{$group:{_id:{"MetricName":"$MetricAttrib.Name"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
							{$group:{_id:null,"OrgData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
							{$project:{_id:0,OrgData:1}}
						])
						.then(function(data){
							flag=flag+1
							if(data.length > 0){
								data.forEach(function(data_each){
									var pin_json2={}
									data_each["OrgData"].forEach(function(data_json){
										pin_json2[data_json["MetricName"]]=data_json["MetricValue"]
									})
									var pin_json={}
									pin_json = Func.avg_sum_calc(avgMetrics, sumMetrics, pin_json2, avgConfig, config)
									pin_json["Name"]=user.Userid; pin_json["EmpName"]=user.Name;
									pin_json["ViewID"]=view_id;
									user_arr.push(pin_json)
								})
							}
							return flag;
						})
						.then(function(flag){
							if(flag == len){
								res.jsend.success(user_arr)
							}
						})
					})
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				Employees.aggregate([
 				    {'$match':{'Userid':{'$in':user_ids}}},
 				    {'$project':{"Userid":1,"Name":{'$concat':["$Givenname"," ","$SN"]},"listOfUsers":"$allReportees","_id":0}}
 				])
 				.then(function(users){
 					if(users.length==0){res.jsend.success([]); return;}
 					var len=users.length;
 					users.forEach(function(user){
 						var test_json={}
 						if("listOfUsers" in user)
 							var user_json= {"DEManagerUserID":{'$in':user.listOfUsers}}
 						else{
 							var user_json = {"DEManagerUserID":user.Userid}
 						}
						FactDefectAgg.aggregate([
							{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},user_json]}},
							{$unwind:"$MetricAttrib"},
							{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	                  		{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
	                  		{$group:{_id:"$_id.WeekEndDate", Data:{$addToSet:{MetricName:"$_id.MetricName", MetricValue:"$MetricValue"}}}},
						])
						.then(function(data){
							var dataJson2={};
							flag=flag+1
							if(data.length > 0){
								data.forEach(function(doc){
									var dataJson={};
									var final_arr=[]
									doc.Data.forEach(function(d){
										dataJson[d.MetricName]=d.MetricValue;
									})
									var fi_json={}
									fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
									if(Object.keys(fi_json).length != 0){
										fi_json["Name"]=user.Userid; fi_json["EmpName"]=user.Name;
										fi_json["ViewID"]=view_id;
										final_arr.push(fi_json)
									}
									if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
									else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
								})
					    		dataJson2["Curr"].forEach(function(js_data){
									var elem=Object.keys(js_data);
									elem.splice(elem.indexOf("Name"),1)
									elem.splice(elem.indexOf("ViewID"),1)
									elem.splice(elem.indexOf("EmpName"),1)
									elem.forEach(function(ele){
										js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
										if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
										else{
											dataJson2["Prev"].forEach(function(js_data_p){
												js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
											})
										}
										if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
									})
									user_arr.push(js_data)
					    		})
							}
							return flag
						})
						.then(function(flag){
							if(flag == len){
								res.jsend.success(user_arr)
							}
						})
					})
				})
			}
	  	})
	})
};
