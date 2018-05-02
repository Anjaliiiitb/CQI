var winston = require('winston');
var util = require('../util');
var _ =require('underscore');
var WeekEndDates=require('../../../models/widget/week_end_dates');

var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var DimDemgrDir=require('../../../models/widget/dim_demgr_dir');
var Func=require('./reuse_functions');
var Employees=require('../../../models/widget/employees');
var FlagMetrics=require('../../data/widget/flag_metrics');

/* DirMgrListSearch - List all Director/Managers
 * */
exports.DirMgrListSearch = function (req, res) {
	var directors=req.body.Directors;
	var managers=req.body.Managers;
	if(directors != undefined){
		var directors_re=[];
		directors.forEach(function(director){
			directors_re.push(new RegExp(director,"i"))
		});
		Employees.aggregate([
		    {$project:{"Name":{$concat:["$Givenname"," ","$SN"]}, "Userid":1, "_id":0}},
		    {$match:{$or:[{"Userid":{$in:directors_re}},{"Name":{$in:directors_re}}]}}
		])
		.then(function(users){
			var final_data=[];
			if(users.length == 0){res.jsend.success([]); return;}
			var user_json={}
			users.forEach(function(user){user_json[user.Userid]=user.Name;})
			DimDemgrDir.aggregate([
			    {$match:{"DIR_USERID":{$in:Object.keys(user_json)}}},
			    {$group:{_id:null, dirs:{$addToSet:"$DIR_USERID"}}}
			])
			.then(function(dirs){
				if(dirs.length == 0 || dirs[0].dirs.length == 0){return final_data;}
				dirs[0].dirs.forEach(function(dir){
					var dir_js={}; dir_js["Name"]=user_json[dir]; dir_js["Userid"]=dir; final_data.push(dir_js)
				})
				return final_data
			})
			.then(res.jsend.success, res.jsend.error)
		})
	}
	else if(managers != undefined){
		var managers_re=[];
		managers.forEach(function(manager){
			managers_re.push(new RegExp(manager,"i"))
		});
		Employees.aggregate([
 		    {$project:{"Name":{$concat:["$Givenname"," ","$SN"]}, "Userid":1, "_id":0}},
 		    {$match:{$or:[{"Userid":{$in:managers_re}},{"Name":{$in:managers_re}}]}}
 		])
 		.then(function(users){
 			var final_data=[];
 			if(users.length == 0){res.jsend.success([]); return;}
 			var user_json={}
 			users.forEach(function(user){user_json[user.Userid]=user.Name;})
 			DimDemgrDir.aggregate([
 			    {$match:{"DEMGR_USERID":{$in:Object.keys(user_json)}}},
 			    {$group:{_id:null, mgrs:{$addToSet:"$DEMGR_USERID"}}}
 			])
 			.then(function(mgrs){
 				if(mgrs.length == 0 || mgrs[0].mgrs.length == 0){return final_data;}
 				mgrs[0].mgrs.forEach(function(mgr){
 					var mgr_js={}; mgr_js["Name"]=user_json[mgr]; mgr_js["Userid"]=mgr; final_data.push(mgr_js)
 				})
 				return final_data
 			})
 			.then(res.jsend.success, res.jsend.error)
 		})
	}
};


/* queryIdDirData - Director data for a QueryID
 * */
exports.queryIdDirData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
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
		  		FactDefectAgg.aggregate([
		  		    {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())}]}},
		  		    {$unwind:"$MetricAttrib"},
		  		    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  		    {$group:{_id:"$DEManagerUserID"}},
		  		    {$group:{_id:null,"demgrs":{$addToSet:"$_id"}}},
			  	])
			  	.then(function(mgr_data){
			  		if(mgr_data.length==0){res.jsend.success([]); return;}
			  		DimDemgrDir.aggregate([
			  		    {$match:{"DEMGR_USERID":{$in:mgr_data[0].demgrs}}},
			  		    {$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
			  		])
			  		.then(function(dir_data){
			  			if(dir_data.length==0){res.jsend.success([]); return;}
			  			var emps=[]; var emps_js={}
			  			dir_data.forEach(function(dir){emps.push(dir._id)})
						Employees.aggregate([
						    {'$match':{'Userid':{'$in':emps}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						])
						.then(function(emp_data){
							emp_data.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
							var len=dir_data.length;
				  		    dir_data.forEach(function(dir){
				  		    	FactDefectAgg.aggregate([
									{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())},
									  {"DEManagerUserID":{$in:dir.mgrs}}]}},
									{$unwind:"$MetricAttrib"},
									{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
									{$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
							    ])
							    .then(function(data){
							    	if(data.length==0){res.jsend.success([]); return;}
									var orgJson2={}
									for (var item in data) {orgJson2[data[item]._id]=data[item].MetricCount;}
									var orgJson={}
									orgJson = Func.avg_sum_calc(avgMetrics, sumMetrics, orgJson2, avgConfig, config)
						    	    orgJson["Name"]=dir._id
						    	    orgJson["EmpName"]=emps_js[dir._id]
						    	    dataArr.push(orgJson);
							    	if(dataArr.length == len){
							    		for (var each in dataArr) {
							    			if(Object.keys(dataArr[each]).length == 2){
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
			  	})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
		  		FactDefectAgg.aggregate([
		  		    {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":listOfDates[0]}]}},
		  		    {$unwind:"$MetricAttrib"},
		  		    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  		    {$group:{_id:"$DEManagerUserID"}},
		  		    {$group:{_id:null,"demgrs":{$addToSet:"$_id"}}},
			  	])
			  	.then(function(mgr_data){
			  		if(mgr_data.length==0){res.jsend.success([]); return;}
			  		DimDemgrDir.aggregate([
			  		    {$match:{"DEMGR_USERID":{$in:mgr_data[0].demgrs}}},
			  		    {$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
			  		])
			  		.then(function(dir_data){
			  			if(dir_data.length==0){res.jsend.success([]); return;}
			  			var emps=[]; var emps_js={}
			  			dir_data.forEach(function(dir){emps.push(dir._id)})
						Employees.aggregate([
						    {'$match':{'Userid':{'$in':emps}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						])
						.then(function(emp_data){
							emp_data.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
				  		    var len=dir_data.length;
				  		    dir_data.forEach(function(dir){
							    FactDefectAgg.aggregate([
			                      	{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":{$in:dir.mgrs}}]}},
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
				    	   					dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined) ? "Up" : (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
						                }
										dataJson2["Curr"]["Name"]=dir._id
										dataJson2["Curr"]["EmpName"]=emps_js[dir._id]
										dataArr.push(dataJson2["Curr"])
									}
									else{
										dataArr.push({});
									}
							    	if(dataArr.length == len){
							    		for (var each in dataArr) {
							    			if(Object.keys(dataArr[each]).length == 2){
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
			  	})
			}
	  	})
	})
};

/* queryIdMgrDirData - Manager data based on director for a QueryID
 * */
exports.queryIdMgrDirData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','Director','ViewType','ViewID','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var director=req.body.Director;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}

	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var mgr_arr=[]; var data_json={};
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
				DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
		  			var emps=[]; var emps_js={}; emps=mgrs[0].mgrs;
					Employees.aggregate([
					    {'$match':{'Userid':{'$in':emps}}},
			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
					])
					.then(function(emp_data){
						emp_data.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						FactDefectAgg.aggregate([
			      			{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())},
			      			  {"DEManagerUserID":{$in:mgrs[0].mgrs}}]}},
			      			{$unwind:"$MetricAttrib"},
			      			{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			      			{$group:{_id:{"DEManagerUserID":"$DEManagerUserID", "MetricName":"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
			      			{$project:{"DEManagerUserID":"$_id.DEManagerUserID", "MetricName":"$_id.MetricName","MetricCount":"$MetricCount","_id":0}},
			      			{$group:{_id:"$DEManagerUserID", Data:{$addToSet:{MetricName:"$MetricName", MetricCount:{$sum:"$MetricCount"}}}}},
			      			{$project:{"DEManagerUserID":"$_id", "Data":1, "_id":0}},
			      		])
			      		.then(function(docs){
							docs.forEach(function(doc){
								var mgr_json2={}
								doc["Data"].forEach(function(data){mgr_json2[data["MetricName"]]=data["MetricCount"]});
								var mgr_json={}
								mgr_json = Func.avg_sum_calc(avgMetrics, sumMetrics, mgr_json2, avgConfig, config)
								if(Object.keys(mgr_json).length > 0){
				    	    	//0 suppression
				    	    		var sum_vals=0;
				    	    		for (var ea in mgr_json) {
				    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+mgr_json[ea];}
				    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+mgr_json[ea];}
				    	    		}
					    	    	if(sum_vals != (metrics_good.length * 100)){
										mgr_json["Name"]=doc["DEManagerUserID"];
										mgr_json["EmpName"]=emps_js[doc["DEManagerUserID"]];
										mgr_arr.push(mgr_json);
					    	    	}
				    	    	//0 suppression end
								}
							})
							data_json["QueryID"]=query_id; data_json["Director"]=director;
							data_json["MgrData"]=mgr_arr
							return data_json;
					     })
					     .then(res.jsend.success, res.jsend.error);
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
				DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
					var tasks=[];
					//Below task is to get Full names for all mgrs
					tasks.push(Employees.aggregate([
						    {'$match':{'Userid':{'$in':mgrs[0].mgrs}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
					    ]));
					//Below task is to get metric data for all mgrs
					tasks.push(
					    FactDefectAgg.aggregate([
	   	                 	 {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:mgrs[0].mgrs}}]}},
		                 	 {$unwind:"$MetricAttrib"},
		                 	 {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		                 	 {$group:{_id:{"DEManagerUserID":"$DEManagerUserID", "MetricName":"$MetricAttrib.Name", "WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
		                 	 {$group:{_id:{"DEManagerUserID":"$_id.DEManagerUserID","WeekEndDate":"$_id.WeekEndDate"}, Data:{$addToSet:{MetricName:"$_id.MetricName", MetricCount:{$sum:"$MetricCount"}}}}},
		                 	 {$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"DEManagerUserID":"$_id.DEManagerUserID", data:"$Data"}}}}
		                 	 ])
		                 );
					Promise.all(tasks)
					.then(function(docs){
						var userIdMappingData = docs[0];
						var mgrDefectData = docs[1];
   		      			var	emps_js = {};
   		      			var dataJson2={}
						userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]});
   		      			mgrDefectData.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.data.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricCount;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
					    	    	//0 suppression
				    	    		var sum_vals=0;
				    	    		for (var ea in fi_json) {
				    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+fi_json[ea];}
				    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+fi_json[ea];}
				    	    		}
					    	    	if(sum_vals != (metrics_good.length * 100)){
					    	    		fi_json["Name"]=d.DEManagerUserID;
					    	    		fi_json["EmpName"]=emps_js[d.DEManagerUserID];
					    	    		final_arr.push(fi_json)
					    	    	}
					    	    	//0 suppression end
								}
							})
							if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
							else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
						})
		      			var final_data=[]
			    		dataJson2["Curr"].forEach(function(js_data){
							var name=js_data.Name;
							var elem=Object.keys(js_data);
							elem.splice(elem.indexOf("Name"),1);
							elem.splice(elem.indexOf("EmpName"),1);
							elem.forEach(function(ele){
								js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
								if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
								else{
									dataJson2["Prev"].forEach(function(js_data_p){
										if(js_data_p["Name"] == name){
											js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
										}
									})
								}
								if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
							})
							final_data.push(js_data)
			    		})
						data_json["QueryID"]=query_id; data_json["Director"]=director;
						data_json["MgrData"]=final_data
						return data_json;
				     })
				     .then(res.jsend.success, res.jsend.error);
				})
			}
	  	})
	})
};

/* queryIdMgrDirTrendData - Trend for director / manager for a QueryID
 * */
exports.queryIdMgrDirTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var director=req.body.Director;  var manager=req.body.Manager;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var datesAvaib=[];
	var tasks=[];
	tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
	Promise.all(tasks)
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			var listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
	  		if(director != undefined && manager == undefined){
	  			DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":query_id},{"DEManagerUserID":{$in:mgrs[0].mgrs}},
						  {"WeekEndDate":{$in:listOfDates}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
						{$project:{"Date":"$_id",_id:0,data:1}},
				    ])
				    .then(function(docs){
						docs.forEach(function(data){
							var dirJson2={}
							data.data.forEach(function(doc){dirJson2[doc.Metric]=doc.Value;})
							var dirJson={}
							dirJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, dirJson2, avgConfig, config)
							dirJson["Date"]=data["Date"];
							datesAvaib.push(data["Date"])
							dataArr.push(dirJson);
						});
					 	if(listOfDates.length != datesAvaib.length){
					 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
					 	}
						dataJson["QueryID"]=query_id; dataJson["Director"]=director;
						dataJson["TrendData"]=dataArr;
						return dataJson;
			       })
			       .then(res.jsend.success, res.jsend.error);
				})
	  		}
	  		else if(manager != undefined){
	  			FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":query_id},{"DEManagerUserID":manager},{"WeekEndDate":{$in:listOfDates}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
					{$project:{"Date":"$_id",_id:0,data:1}},
				])
				.then(function(docs){
					docs.forEach(function(data){
						var dirJson2={}
						data.data.forEach(function(doc){dirJson2[doc.Metric]=doc.Value;})
						var dirJson={}
						dirJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, dirJson2, avgConfig, config)
						dirJson["Date"]=data["Date"];
						datesAvaib.push(data["Date"])
						dataArr.push(dirJson);
					});
					if(listOfDates.length != datesAvaib.length){
				 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
				 	}
					dataJson["QueryID"]=query_id; dataJson["Director"]=director; dataJson["Manager"]=manager;
					dataJson["TrendData"]=dataArr;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
	  		}
	  	})
	})
};

/**
*	Query ID trend data for the managers under the director
*/
exports.queryIdDirTrendData = function(req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','ViewType','Primary','Director']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var director=req.body.Director;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var datesAvaib=[];
	var tasks=[];
	tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type))
	Promise.all(tasks)
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			var listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
	  	 DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$lookup:{from:"employees", localField:"DEMGR_USERID", foreignField:"Userid", as:"fullName"}},
					{$unwind: "$fullName"},
					{$project : {"DIR_USERID":1,"DEMGR_USERID":1,"EmpName":{'$concat':["$fullName.Givenname"," ","$fullName.SN"]}}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"},"FullName":{$addToSet:{"Mgrs":"$DEMGR_USERID","EmpName":"$EmpName"}}}},
				])
				.then(function(mgrs){
					var fullNameArr = {};
					mgrs[0].FullName.forEach(function(data){
						fullNameArr[data.Mgrs] = data.EmpName;
					})

					if(mgrs.length==0){res.jsend.success([]); return;}
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":query_id},{"DEManagerUserID":{$in:mgrs[0].mgrs}},
						  {"WeekEndDate":{$in:listOfDates}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name","Mgrs":"$DEManagerUserID"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{"Date":"$_id.Date","Mgrs":"$_id.Mgrs"}, data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
						{$sort : {"_id.Date":1}},
						{$group : {_id:{"Mgrs":"$_id.Mgrs"},"Trend":{$push : {"Date":"$_id.Date","Data":"$data"}}}},
						{$project : {"Mgr":"$_id.Mgrs","Trend":1,"_id":0}}
				    ])
						.then(function(mgrsData){
							//console.log(mgrs);
							var len = mgrsData.length;
							var finalData = [];

							mgrsData.forEach(function(trend){
								datesAvaib = [];
								dataArr = [];
								var mgrDataJson = {};

								trend.Trend.forEach(function(trendData){
										var mgrJson2={};
										trendData.Data.forEach(function(doc){mgrJson2[doc.Metric]=doc.Value;})
										var mgrJson = {};
										mgrJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, mgrJson2, avgConfig, config)
										mgrJson["Date"] = trendData["Date"];
										datesAvaib.push(trendData["Date"])
										dataArr.push(mgrJson);
								})

								if(listOfDates.length != datesAvaib.length){
							 			dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
							 	}

								mgrDataJson["Manager"] = trend.Mgr;
								mgrDataJson["EmpName"] = fullNameArr[trend.Mgr];
								mgrDataJson["TrendData"] = dataArr;
								finalData.push(mgrDataJson);

							});

							return Promise.all(finalData).
							then(function(data){
								var finalJsonIn = {};
								finalJsonIn["QueryID"] = query_id;
								finalJsonIn["Data"] = data;
								return finalJsonIn;
							})
			       }).then(res.jsend.success, res.jsend.error);
				})
	   })
	})
}

//UserID based Search for Director/DE-Manager for QueryID(all alternate queries)
exports.queryIdMgrDirSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','ViewID','Metrics','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var manager_ids=req.body.Manager;
	var director_ids=req.body.Director;
	if(manager_ids == undefined && director_ids == undefined) {
		var errors = util.requireFields(req.body, ['Director']);
		if (errors) { res.jsend.fail(errors); return;}
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID;
	var query_ids=req.body.QueryID; var trend = req.body.Trend;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var week_date=req.body.WeekDate;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var data_arr=[]; var flag=0;
	var tasks=[];
	tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_ids, primary, view_type));
	Promise.all(tasks)
	.then(function(details){
		allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
		config = details[0][3]; avgConfig = details[0][4];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == 'N') {
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				//First task is to get full names of all managers
				//Second task is to get aggregated defect data of all managers
				if(manager_ids != undefined){
					var allPromise = Promise.all([Employees.aggregate([
					    {'$match':{'Userid':{'$in':manager_ids}}},
			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
					]),
					FactDefectAgg.aggregate([
	  					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:manager_ids}}]}},
	  					{$unwind:"$MetricAttrib"},
	  					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	  					{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name","DEManagerUserID":"$DEManagerUserID"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$project:{"QueryID":"$_id.QueryID","MetricName":"$_id.MetricName","DEManagerUserID":"$_id.DEManagerUserID","MetricValue":"$MetricValue","_id":0}},
	  					{$group:{_id:{"QueryID":"$QueryID","DEManagerUserID":"$DEManagerUserID"},"Data":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
						{$project:{QueryID:"$_id.QueryID","DEManagerUserID":"$_id.DEManagerUserID",_id:0,Data:1}}
	  					])
	  				]);
	  				allPromise.then(function(allDocs){
	  					var userIdMappingData = allDocs[0];
		      			var mgrDefectData = allDocs[1];
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						mgrDefectData.forEach(function(doc){
								var dataJson2={};
								doc["Data"].forEach(function(data){
									dataJson2[data["MetricName"]]=data["MetricValue"]
								})
								var dataJson={};
								dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
								dataJson["QueryID"]=doc["QueryID"];
								dataJson["Name"]=doc["DEManagerUserID"];
								dataJson["EmpName"]=emps_js[doc["DEManagerUserID"]];
								data_arr.push(dataJson)
							})
							return data_arr;
					}).then(res.jsend.success, res.jsend.error);
				} else if(director_ids != undefined) {
					var tasks = [];
					//Below task is to get full names of all directors
					tasks.push(Employees.aggregate([
					    {'$match':{'Userid':{'$in':director_ids}}},
			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
					    ])
					);
					//Get all de-manager ids associated to a director
					director_ids.forEach(function(directorId) {
						//Below task is to get aggregated defect data of all directors
						tasks.push(DimDemgrDir.aggregate([{$match:{"DIR_USERID":directorId}},{$group:{_id:null, managerIds:{$addToSet:"$DEMGR_USERID"}}}
						]));
					});
					//Get aggregated data of all queryIds
					Promise.all(tasks)
					.then(function(allDocs) {
						var userIdMappingData = allDocs[0];
		      			var mgr_docs = allDocs.splice(1);
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						var aggregate_tasks = [];
						mgr_docs.forEach(function(mgr_doc) {
							var manager_ids = [];
							if(mgr_doc.length > 0)
								manager_ids = mgr_doc[0].managerIds;
								aggregate_tasks.push(FactDefectAgg.aggregate([
			       					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:manager_ids}}]}},
			      					{$unwind:"$MetricAttrib"},
			      					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			      					{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
									{$project:{"QueryID":"$_id.QueryID","MetricName":"$_id.MetricName","MetricValue":"$MetricValue","_id":0}},
				  					{$group:{_id:{"QueryID":"$QueryID"},"Data":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
									{$project:{QueryID:"$_id.QueryID",_id:0,Data:1}}
			      				])
				  			);
						})
						//Traversing through all query id objects
						Promise.all(aggregate_tasks).then(function(finalDocs){
							//Traversing through all director objects of single query id
	  						finalDocs.forEach(function(data,index){
	  							if(data.length > 0) {
	  								//Traversing through all metric objects of a director of a queryid
	  								data.forEach(function(queryData,index2) {
	  									var dataJson2={};
	  		  							queryData.Data.forEach(function(finalData) {
			  								dataJson2[finalData["MetricName"]]=finalData["MetricValue"]
			  							})
										var dataJson={};
										dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
										dataJson["QueryID"]=queryData["QueryID"];
										dataJson["Name"]=director_ids[index];
										dataJson["EmpName"]=emps_js[director_ids[index]];
										data_arr.push(dataJson);
	  								});
	  							}
							});
	  						return data_arr;
						 })
					     .then(res.jsend.success, res.jsend.error);
					})
				     .then(res.jsend.success, res.jsend.error);
				}
			} else {
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				if(manager_ids != undefined) {
					//First task is to get full names of all managers
					//Second task is to get aggregated defect data of all managers
					var allPromise = Promise.all([Employees.aggregate([
   					    {'$match':{'Userid':{'$in':manager_ids}}},
   			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
   					]),
   					FactDefectAgg.aggregate([
		  					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:manager_ids}}]}},
		  					{$unwind:"$MetricAttrib"},
		  					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  					{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name","DEManagerUserID":"$DEManagerUserID","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
							{$group:{_id:{"QueryID":"$_id.QueryID","DEManagerUserID":"$_id.DEManagerUserID","WeekEndDate":"$_id.WeekEndDate"},"Data":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
							{$group:{_id:"$_id.WeekEndDate",dataA:{$addToSet:{"QueryID":"$_id.QueryID", "DEManagerUserID":"$_id.DEManagerUserID", "Data":"$Data"}}}}
						])
   	  				])
   	  				allPromise.then(function(allDocs){
	   	  				var userIdMappingData = allDocs[0];
		      			var mgrDefectData = allDocs[1];
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						var dataJson2={};dataJson2["Curr"] = [];dataJson2["Prev"] = [];
						mgrDefectData.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.Data.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricValue;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
									fi_json["Name"]=d.DEManagerUserID;
									fi_json["EmpName"]=emps_js[d.DEManagerUserID];
									fi_json["QueryID"]=d.QueryID;
									final_arr.push(fi_json)
								}
							})
							if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
							else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
						})
						dataJson2["Curr"].forEach(function(js_data){
							var name=js_data.Name;
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
										if(js_data_p["Name"] == name && js_data_p["QueryID"] == query_id){
											js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
										}
									})
								}
								if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
							})
							data_arr.push(js_data)
			    		})
			    		return data_arr
				     })
				     .then(res.jsend.success, res.jsend.error);
				} else if(director_ids != undefined) {
					var tasks = [];
					//Below task is to get full names of all director ids
					tasks.push(Employees.aggregate([
   					    {'$match':{'Userid':{'$in':director_ids}}},
   			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
   					    ])
   					 );
   					//Get all de-manager ids associated to a director
					director_ids.forEach(function(directorId) {
						//Below task is to get aggregated defect data of all directors
						tasks.push(DimDemgrDir.aggregate([{$match:{"DIR_USERID":directorId}},{$group:{_id:null, managerIds:{$addToSet:"$DEMGR_USERID"}}}
						]));
					});
					//Get aggregated data of all queryIds
					Promise.all(tasks)
					.then(function(allDocs) {
						var userIdMappingData = allDocs[0];
		      			var mgr_docs = allDocs.splice(1);
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						var aggregate_tasks = [];
						mgr_docs.forEach(function(mgr_doc) {
							var manager_ids = [];
							if(mgr_doc.length > 0)
								manager_ids = mgr_doc[0].managerIds;
								aggregate_tasks.push(FactDefectAgg.aggregate([
			       					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:manager_ids}}]}},
			      					{$unwind:"$MetricAttrib"},
			      					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			      					{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
									{$group:{_id:{"QueryID":"$_id.QueryID", "WeekEndDate":"$_id.WeekEndDate"},"Data":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
								    {$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"QueryID":"$_id.QueryID", data:"$Data"}}}}

			      				])
			      			);
						})
						//Traversing through all query id objects
						Promise.all(aggregate_tasks).then(function(finalDocs){
							//Traversing through all director objects of single query id
	  						finalDocs.forEach(function(data,index){
	  							if(data.length > 0) {
	  								var dataJson2={}; dataJson2["Curr"] = []; dataJson2["Prev"] = [];
	  								data.forEach(function(doc){
										var final_arr=[]
										doc.dataA.forEach(function(d){
											var dataJson={};
											d.data.forEach(function(d1){
												dataJson[d1.MetricName]=d1.MetricValue;
											});
											var fi_json={}
											fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
											if(Object.keys(fi_json).length != 0){
												fi_json["QueryID"]=d.QueryID;
												fi_json["Name"]=director_ids[index];
												fi_json["EmpName"]=emps_js[director_ids[index]];
												final_arr.push(fi_json)
											}
										})
										if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
										else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
									});
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
										});
										data_arr.push(js_data);
						    		})
	  							}
							});
	  						return data_arr;
						 })
					     .then(res.jsend.success, res.jsend.error);
					})
				     .then(res.jsend.success, res.jsend.error);
				}

			}
	  	})

	})
};


/* viewIdDirData - Director data for a ViewID (all primary queries)
 * */
exports.viewIdDirData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
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
		  		FactDefectAgg.aggregate([
		  		    {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())}]}},
		  		    {$unwind:"$MetricAttrib"},
		  		    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  		    {$group:{_id:"$DEManagerUserID"}},
		  		    {$group:{_id:null,"demgrs":{$addToSet:"$_id"}}},
			  	])
			  	.then(function(mgr_data){
			  		if(mgr_data.length==0){res.jsend.success([]); return;}

			  		DimDemgrDir.aggregate([
			  		    {$match:{"DEMGR_USERID":{$in:mgr_data[0].demgrs}}},
			  		    {$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
			  		])
			  		.then(function(dir_data){
			  			if(dir_data.length==0){res.jsend.success([]); return;}
			  			var emps=[]; var emps_js={}
			  			dir_data.forEach(function(dir){emps.push(dir._id)})
						Employees.aggregate([
						    {'$match':{'Userid':{'$in':emps}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						])
						.then(function(emp_data){
							emp_data.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
							var len=dir_data.length;
				  		    dir_data.forEach(function(dir){
				  		    	FactDefectAgg.aggregate([
									{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},
									  {"DEManagerUserID":{$in:dir.mgrs}}]}},
									{$unwind:"$MetricAttrib"},
									{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
									{$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}},
							    ])
							    .then(function(data){
							    	if(data.length==0){res.jsend.success([]); return;}
									var orgJson2={}
									for (var item in data) {orgJson2[data[item]._id]=data[item].MetricCount;}
									var orgJson={}
									orgJson = Func.avg_sum_calc(avgMetrics, sumMetrics, orgJson2, avgConfig, config)
						    	    orgJson["Name"]=dir._id;
									orgJson["EmpName"]=emps_js[dir._id];
						    	    dataArr.push(orgJson);
							    	if(dataArr.length == len){
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
							    	}
							    })
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
		  		FactDefectAgg.aggregate([
		  		    {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":listOfDates[0]}]}},
		  		    {$unwind:"$MetricAttrib"},
		  		    {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  		    {$group:{_id:"$DEManagerUserID"}},
		  		    {$group:{_id:null,"demgrs":{$addToSet:"$_id"}}},
			  	])
			  	.then(function(mgr_data){
			  		if(mgr_data.length==0){res.jsend.success([]); return;}
			  		DimDemgrDir.aggregate([
			  		    {$match:{"DEMGR_USERID":{$in:mgr_data[0].demgrs}}},
			  		    {$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
			  		])
			  		.then(function(dir_data) {
			  			if(dir_data.length==0){res.jsend.success([]); return;}
			  			var emps=[]; var emps_js={}
			  			dir_data.forEach(function(dir){emps.push(dir._id)})
						Employees.aggregate([
						    {'$match':{'Userid':{'$in':emps}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						])
						.then(function(emp_data) {
							emp_data.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]});
							var len=dir_data.length;
								dir_data.forEach(function(dir){
							    FactDefectAgg.aggregate([
		 	                      	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":{$in:dir.mgrs}}]}},
		 	                      	{$unwind:"$MetricAttrib"},
		 	                      	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		 	                      	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
		 	                      	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName", "MetricCount":"$MetricCount"}}}},
		 	                    ]) .then(function(data){
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
				    	   					dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined) ? "Up" : (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
						                }
										dataJson2["Curr"]["Name"]=dir._id;
										dataJson2["Curr"]["EmpName"]=emps_js[dir._id];
										dataArr.push(dataJson2["Curr"])
									}
									else{
										dataArr.push({});
									}
							    	if(dataArr.length == len){
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
							    	}
							    })
				  		    })
						})
			  		})
			  	})
			}
	  	})
	})
};

/* viewIdMgrDirData - Manager data based on director for a ViewID (all primary queries)
 * */
exports.viewIdMgrDirData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','Director','ViewType','ViewID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType; var director=req.body.Director;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}

	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var mgr_arr=[]; var data_json={};
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
				DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
					//First task is to get Full names for all mgrs
					//Second task is to get metric data for all mgrs
					var allPromise = Promise.all([Employees.aggregate([
						    {'$match':{'Userid':{'$in':mgrs[0].mgrs}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						]),
						FactDefectAgg.aggregate([
			      			{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},
			      			  {"DEManagerUserID":{$in:mgrs[0].mgrs}}]}},
			      			{$unwind:"$MetricAttrib"},
			      			{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			      			{$group:{_id:{"DEManagerUserID":"$DEManagerUserID", "MetricName":"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
			      			{$project:{"DEManagerUserID":"$_id.DEManagerUserID", "MetricName":"$_id.MetricName","MetricCount":"$MetricCount","_id":0}},
			      			{$group:{_id:"$DEManagerUserID", Data:{$addToSet:{MetricName:"$MetricName", MetricCount:{$sum:"$MetricCount"}}}}},
			      			{$project:{"DEManagerUserID":"$_id", "Data":1, "_id":0}},
			      		])
		      		]);
					allPromise.then(function(docs){
		      			var userIdMappingData = docs[0];
		      			var mgrDefectData = docs[1];
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						mgrDefectData.forEach(function(doc){
							var mgr_json2={}
							doc["Data"].forEach(function(data){mgr_json2[data["MetricName"]]=data["MetricCount"]});
							var mgr_json={}
							mgr_json = Func.avg_sum_calc(avgMetrics, sumMetrics, mgr_json2, avgConfig, config)
							if(Object.keys(mgr_json).length > 0){
				    	    	//0 suppression
			    	    		var sum_vals=0;
			    	    		for (var ea in mgr_json) {
			    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+mgr_json[ea];}
			    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+mgr_json[ea];}
			    	    		}
				    	    	if(sum_vals != (metrics_good.length * 100)){
									mgr_json["Name"]=doc["DEManagerUserID"];
									mgr_json["EmpName"]=emps_js[doc["DEManagerUserID"]];
									mgr_arr.push(mgr_json);
				    	    	}
				    	    	//0 suppression end
							}
						})
						data_json["ViewID"]=view_id; data_json["Director"]=director;
						data_json["MgrData"]=mgr_arr
						return data_json;
				     })
				     .then(res.jsend.success, res.jsend.error);
				})
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
					//First task is to get Full names for all mgrs
					//Second task is to get metric data for all mgrs
					var allPromise = Promise.all([Employees.aggregate([
					    {'$match':{'Userid':{'$in':mgrs[0].mgrs}}},
			  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
					    ]),
					    FactDefectAgg.aggregate([
		                 	 {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:mgrs[0].mgrs}}]}},
		                 	 {$unwind:"$MetricAttrib"},
		                 	 {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		                 	 {$group:{_id:{"DEManagerUserID":"$DEManagerUserID", "MetricName":"$MetricAttrib.Name", "WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
		                 	 {$group:{_id:{"DEManagerUserID":"$_id.DEManagerUserID","WeekEndDate":"$_id.WeekEndDate"}, Data:{$addToSet:{MetricName:"$_id.MetricName", MetricCount:{$sum:"$MetricCount"}}}}},
		                 	 {$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"DEManagerUserID":"$_id.DEManagerUserID", data:"$Data"}}}}
		                 ])
		            ]);
					allPromise.then(function(docs){
						var userIdMappingData = docs[0];
		      			var mgrDefectData = docs[1];
		      			var	emps_js = {};
		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
						var dataJson2={}
		      			mgrDefectData.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.data.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricCount;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)

								if(Object.keys(fi_json).length != 0){
					    	    	//0 suppression
				    	    		var sum_vals=0;
				    	    		for (var ea in fi_json) {
				    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+fi_json[ea];}
				    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+fi_json[ea];}
				    	    		}
					    	    	if(sum_vals != (metrics_good.length * 100)){
					    	    		fi_json["Name"]=d.DEManagerUserID;
					    	    		fi_json["EmpName"]=emps_js[d.DEManagerUserID];
					    	    		final_arr.push(fi_json)
					    	    	}
					    	    	//0 suppression end
								}
							})

							if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
							else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
						})

						var final_data=[]
			    		dataJson2["Curr"].forEach(function(js_data){
							var name=js_data.Name;
							var elem=Object.keys(js_data);
							elem.splice(elem.indexOf("Name"),1);
							elem.splice(elem.indexOf("EmpName"),1)
							elem.forEach(function(ele){
								js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
								if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
								else{
									dataJson2["Prev"].forEach(function(js_data_p){
										if(js_data_p["Name"] == name){
											js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
										}
									})
								}
								if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
							})
							final_data.push(js_data)
			    		})
						data_json["ViewID"]=view_id; data_json["Director"]=director;
						data_json["MgrData"]=final_data
						return data_json;
				     })
			     .then(res.jsend.success, res.jsend.error);
				})
			}
	  	})
	})
};

/* viewIdMgrDirTrendData - Trend for director / manager for a ViewID (all primary queries)
 * */
exports.viewIdMgrDirTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID;
	var view_type=req.body.ViewType; var director=req.body.Director;  var manager=req.body.Manager;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var datesAvaib=[];
	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			var listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
	  		if(director != undefined && manager == undefined){
	  			DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
				])
				.then(function(mgrs){
					if(mgrs.length==0){res.jsend.success([]); return;}
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"DEManagerUserID":{$in:mgrs[0].mgrs}},
						  {"WeekEndDate":{$in:listOfDates}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
						{$project:{"Date":"$_id",_id:0,data:1}},
				    ])
				    .then(function(docs){
						docs.forEach(function(data){
							var dirJson2={}
							data.data.forEach(function(doc){dirJson2[doc.Metric]=doc.Value;})
							var dirJson={}
							dirJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, dirJson2, avgConfig, config)
							dirJson["Date"]=data["Date"];
							datesAvaib.push(data["Date"])
							dataArr.push(dirJson);
						});
					 	if(listOfDates.length != datesAvaib.length){
					 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
					 	}
						dataJson["ViewID"]=view_id; dataJson["Director"]=director;
						dataJson["TrendData"]=dataArr;
						return dataJson;
			       })
			       .then(res.jsend.success, res.jsend.error);
				})
	  		}
	  		else if(manager != undefined){
	  			FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":{$in:query_ids}},{"DEManagerUserID":manager},{"WeekEndDate":{$in:listOfDates}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
					{$project:{"Date":"$_id",_id:0,data:1}},
				])
				.then(function(docs){
					docs.forEach(function(data){
						var dirJson2={}
						data.data.forEach(function(doc){dirJson2[doc.Metric]=doc.Value;})
						var dirJson={}
						dirJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, dirJson2, avgConfig, config)
						dirJson["Date"]=data["Date"];
						datesAvaib.push(data["Date"])
						dataArr.push(dirJson);
					});
					if(listOfDates.length != datesAvaib.length){
				 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
				 	}
					dataJson["ViewID"]=view_id; dataJson["Director"]=director; dataJson["Manager"]=manager;
					dataJson["TrendData"]=dataArr;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
	  		}
	  	})
	})
};

//Managers under the directors trend for a given metrics
exports.viewIdDirTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','Director']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID;
	var view_type=req.body.ViewType; var director=req.body.Director;
	var weeks = req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var datesAvaib=[];
	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];

		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			var listOfDates = Func.trendDates(weeks2,weeks,date1,date2);
			if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
	  		if(director != undefined ){
	  			DimDemgrDir.aggregate([
					{$match:{"DIR_USERID":director}},
					{$lookup:{from:"employees", localField:"DEMGR_USERID", foreignField:"Userid", as:"fullName"}},
					{$unwind: "$fullName"},
					{$project : {"DIR_USERID":1,"DEMGR_USERID":1,"EmpName":{'$concat':["$fullName.Givenname"," ","$fullName.SN"]}}},
					{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"},"FullName":{$addToSet:{"Mgrs":"$DEMGR_USERID","EmpName":"$EmpName"}}}},
				])
				.then(function(mgrs){
					var fullNameArr = {};
					mgrs[0].FullName.forEach(function(data){
						fullNameArr[data.Mgrs] = data.EmpName;
					})

					if(mgrs.length==0){res.jsend.success([]); return;}
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"DEManagerUserID":{$in:mgrs[0].mgrs}},
						  {"WeekEndDate":{$in:listOfDates}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name","Mgrs" : "$DEManagerUserID"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{"Mgrs":"$_id.Mgrs","Date":"$_id.Date"}, data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
						{$sort : {"_id.Date":1}},
						{$group : {_id:{"Mgrs":"$_id.Mgrs"},"Trend":{$push : {"Date":"$_id.Date","Data":"$data"}}}},
						{$project : {"Mgr":"$_id.Mgrs","Trend":1,"_id":0}}
				    ])
				    .then(function(mgrsData){
							//console.log(mgrs);
							var len = mgrsData.length;
							var finalData = [];

							mgrsData.forEach(function(trend){
								datesAvaib = [];
								dataArr = [];
								var mgrDataJson = {};

								trend.Trend.forEach(function(trendData){
										var mgrJson2={};
										trendData.Data.forEach(function(doc){mgrJson2[doc.Metric]=doc.Value;})
										var mgrJson = {};
										mgrJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, mgrJson2, avgConfig, config)
										mgrJson["Date"] = trendData["Date"];
										datesAvaib.push(trendData["Date"])
										dataArr.push(mgrJson);
								})

								if(listOfDates.length != datesAvaib.length){
							 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
							 	}

								mgrDataJson["Manager"] = trend.Mgr;
								mgrDataJson["EmpName"] = fullNameArr[trend.Mgr];
								mgrDataJson["TrendData"] = dataArr;
								finalData.push(mgrDataJson);

							});

							return Promise.all(finalData).
							then(function(data){
								var finalJsonIn = {};
								finalJsonIn["ViewID"] = view_id;
								finalJsonIn["Data"] = data;
								return finalJsonIn;
							})
			       })
			       .then(res.jsend.success, res.jsend.error);
					})
	  		}
	  	})
	})
}
//UserID based Search for Director/DE-Manager for ViewID(all primary queries)
exports.viewIdMgrDirSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var manager_ids=req.body.Manager;
	var director_ids=req.body.Director;
	if(manager_ids == undefined && director_ids == undefined) {
		var errors = util.requireFields(req.body, ['Director']);
		if (errors) { res.jsend.fail(errors); return;}
	}

	var all_metrics_raw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var config={}; var avgConfig={};
	var data_arr=[]; var dataJson={}; var flag=0, dataArr = [];
	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(all_metrics_raw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks){
			if(trend == undefined || trend == "N") {
				var latestDate;
				if(week_date == undefined){latestDate = weeks[0].WeekEndDates[0];}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {latestDate = weeks[0].WeekEndDates[Ind]};
				}
				if(manager_ids != undefined){
					//First task is to get full names for all manager Ids
					//Second task is to get aggregated defect data
					var allPromise = Promise.all([Employees.aggregate([
						    {'$match':{'Userid':{'$in':manager_ids}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						]),
						FactDefectAgg.aggregate([
		  					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:manager_ids}}]}},
		  					{$unwind:"$MetricAttrib"},
		  					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		  					{$group:{_id:{Manager:"$DEManagerUserID",MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
		  					{$group:{_id:{Manager:"$_id.Manager"},"ManagerData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
		  					{$project:{Name:"$_id.Manager",_id:0,ManagerData:1}}
		  				])
	  				]);
   					allPromise.then(function(docs){
   		      			var userIdMappingData = docs[0];
   		      			var mgrDefectData = docs[1];
   		      			var	emps_js = {};
   		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
   						mgrDefectData.forEach(function(doc){
							var dataJson2={}
							doc["ManagerData"].forEach(function(data){
								dataJson2[data["MetricName"]]=data["MetricValue"]
							})
							var dataJson={};
							dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
							dataJson["ViewID"]=view_id;
							dataJson["Name"]=doc["Name"];
							dataJson["EmpName"]=emps_js[doc["Name"]];
							data_arr.push(dataJson)
						})
						return data_arr;
				     })
				     .then(res.jsend.success, res.jsend.error);
				} else if(director_ids != undefined) {
					var tasks = [];
					director_ids.forEach(function(directorId) {
						tasks.push(DimDemgrDir.aggregate([{$match:{"DIR_USERID":directorId}},{$group:{_id:null, managerIds:{$addToSet:"$DEMGR_USERID"}}}
						]));
					});
					Promise.all(tasks)
					.then(function(mgr_docs) {
						var aggregate_tasks = [];
						//Below task is to get full names for all director ids
						aggregate_tasks.push(Employees.aggregate([
  						    {'$match':{'Userid':{'$in':director_ids}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						]));
						//Below task is to get aggregated defect data for all director ids
						mgr_docs.forEach(function(mgr_doc) {
							var manager_ids = [];
							if(mgr_doc.length > 0)
								manager_ids = mgr_doc[0].managerIds;
							aggregate_tasks.push(
								FactDefectAgg.aggregate([
				  					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:manager_ids}}]}},
				  					{$unwind:"$MetricAttrib"},
				  					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
				  					{$group:{_id:{MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
									{$project:{_id:0,"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}
					  			])
				  			);
						})
						Promise.all(aggregate_tasks).then(function(finalDocs){
							var userIdMappingData = finalDocs[0];
	   		      			var	emps_js = {};
	   		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
	  						finalDocs.splice(1).forEach(function(data,index){
	  							var dataJson2={};
	  							if(data.length > 0) {
		  		  					data.forEach(function(finalData) {
		  								dataJson2[finalData["MetricName"]]=finalData["MetricValue"]
		  							})
									var dataJson={};
									dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
									dataJson["ViewID"]=view_id;
									dataJson["Name"]=director_ids[index];
									dataJson["EmpName"]=emps_js[director_ids[index]];
									data_arr.push(dataJson);
	  							}
							});
	  						return data_arr;
						 })
					     .then(res.jsend.success, res.jsend.error);
					})
				     .then(res.jsend.success, res.jsend.error);
				}
			} else {
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				if(manager_ids != undefined){
					var allPromise = Promise.all([Employees.aggregate([
   						    {'$match':{'Userid':{'$in':manager_ids}}},
   				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
   						]),
						FactDefectAgg.aggregate([
							{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:manager_ids}}]}},
							{$unwind:"$MetricAttrib"},
							{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
							{$group:{_id:{Manager:"$DEManagerUserID",MetricName:"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
							{$group:{_id:{Manager:"$_id.Manager",WeekEndDate:"$_id.WeekEndDate"},"ManagerData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
							{$group:{_id:"$_id.WeekEndDate", "dataA":{$addToSet:{"Manager":"$_id.Manager", "ManagerData":"$ManagerData"}}}}

							//{$project:{Name:"$_id.Manager",_id:0,ManagerData:1}}
						])
					]);
  	  				allPromise.then(function(docs){
						var userIdMappingData = docs[0];
   		      			var mgrDefectData = docs[1];
   		      			var	emps_js = {};
   		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]});
   							var dataJson2={}; dataJson2["Curr"] = [];dataJson2["Prev"] = [];
							mgrDefectData.forEach(function(doc){
								var final_arr=[]
								doc.dataA.forEach(function(d){
									var dataJson={};
									d.ManagerData.forEach(function(d1){
										dataJson[d1.MetricName]=d1.MetricValue;
									})
									var fi_json={}
									fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
									if(Object.keys(fi_json).length != 0){
										fi_json["Name"]=d.Manager;
										fi_json["EmpName"]=emps_js[d.Manager];
										fi_json["ViewID"]=view_id;
										final_arr.push(fi_json)
									}
								})
								if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
								else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
							})
							dataJson2["Curr"].forEach(function(js_data){
								var name=js_data.Name;
								var elem=Object.keys(js_data);
								elem.splice(elem.indexOf("Name"),1);
								elem.splice(elem.indexOf("ViewID"),1);
								elem.splice(elem.indexOf("EmpName"),1);
								elem.forEach(function(ele){
									js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
									if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
									else{
										dataJson2["Prev"].forEach(function(js_data_p){
											if(js_data_p["Name"] == name){
												js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
											}
										})
									}
									if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
								})
								dataArr.push(js_data)
				    		})
				    		return dataArr;

							})
				     .then(res.jsend.success, res.jsend.error);
				} else if(director_ids != undefined) {
					var tasks = [], user_arr = [];
					director_ids.forEach(function(directorId) {
						tasks.push(DimDemgrDir.aggregate([{$match:{"DIR_USERID":directorId}},{$group:{_id:null, managerIds:{$addToSet:"$DEMGR_USERID"}}}
						]));
					});
					Promise.all(tasks)
					.then(function(mgr_docs) {
						var aggregate_tasks = [];
						//Below task is to get full names for all director ids
						aggregate_tasks.push(Employees.aggregate([
  						    {'$match':{'Userid':{'$in':director_ids}}},
				  			{'$project':{"Userid":1,"EmpName":{'$concat':["$Givenname"," ","$SN"]},"_id":0}}
						]));
						//Below task is to get aggregated defect data for all director ids
						mgr_docs.forEach(function(mgr_doc) {
							var manager_ids = [];
							if(mgr_doc.length > 0)
								manager_ids = mgr_doc[0].managerIds;
							aggregate_tasks.push(
								FactDefectAgg.aggregate([
				  					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:manager_ids}}]}},
				  					{$unwind:"$MetricAttrib"},
				  					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
				  					{$group:{_id:{MetricName:"$MetricAttrib.Name", "WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
				  					{$group:{_id:"$_id.WeekEndDate", Data:{$addToSet:{MetricName:"$_id.MetricName", MetricValue:"$MetricValue"}}}},
								])
				  			);
						})
						Promise.all(aggregate_tasks).then(function(finalDocs){
							var userIdMappingData = finalDocs[0];
	   		      			var	emps_js = {};
	   		      			userIdMappingData.forEach(function(emp){emps_js[emp["Userid"]]=emp["EmpName"]})
	  						finalDocs.splice(1).forEach(function(data,index){
									var dataJson2={};
		  							dataJson2["Curr"] = [];dataJson2["Prev"] = [];
		  							if(data.length > 0) {
										data.forEach(function(doc){
											var dataJson={};
											var final_arr=[]
											doc.Data.forEach(function(d){
												dataJson[d.MetricName]=d.MetricValue;
											})
											var fi_json={}
											fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
											if(Object.keys(fi_json).length != 0){
												fi_json["Name"]=director_ids[index];
												fi_json["EmpName"]=emps_js[director_ids[index]];
												fi_json["ViewID"]=view_id;
												final_arr.push(fi_json)
											}
											if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
											else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
										});
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
											dataArr.push(js_data)
							    		});
									}
								});
		  						return dataArr;
						 })
					     .then(res.jsend.success, res.jsend.error);
					})
				     .then(res.jsend.success, res.jsend.error);
				}

			}
		})

	})
};
