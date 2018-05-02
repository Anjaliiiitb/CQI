var winston = require('winston');
var util = require('../util');
var _ =require('underscore');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var DimPinHier=require('../../../models/widget/dim_pin_hier');
var Employees=require('../../../models/widget/employees');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var Func=require('./reuse_functions');
var AppView=require('../../../models/widget/app_view');
var FlagMetrics=require('../../data/widget/flag_metrics');

/* gen_query_seg - Internal function
 * to be used by SegmentOQGlanceMob
 * */
var gen_query_seg = function(segment){
	if(segment == undefined || segment == ""){return 1;}
	else{
		return DimPinHier.aggregate([
		     {$match:{"Segment":segment}},
		     {$group:{_id:null, listOfUsers:{'$addToSet':"$EmpUserID"}}},
	    ])
	    .then(function(user){return user;})
}};

/* SegmentOQGlanceMob -  The response is specific to the requirement by the mobile
 * team which needed the data to be separated into CFD, IFD and S1/TS
 * */
exports.SegmentOQGlanceMob = function(req, res) {
	var errors = util.requireFields(req.body, ['ViewName']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var segment=req.body.Segment; var view_name=req.body.ViewName;
	var IFD_b=["IFD MTTR [13 Weeks Outstanding]","IFD Backlog [Current Week]","IFD Incoming [Current Week]","IFD Disposed [Current Week]","IFD Backlog [Current Week]_trend","IFD Incoming [Current Week]_trend","IFD Disposed [Current Week]_trend","IFD MTTR [13 Weeks Outstanding]_trend"];
	var CFD_b=["CFD MTTR [13 Weeks Outstanding]","CFD Backlog [Current Week]","CFD Incoming [Current Week]","CFD Disposed [Current Week]","CFD MTTR [13 Weeks Outstanding]_trend","CFD Backlog [Current Week]_trend","CFD Incoming [Current Week]_trend","CFD Disposed [Current Week]_trend"];
	var S1TS_b=["S1/TS MTTR [13 Weeks Outstanding]","S1/TS Incoming [Current Week]","S1/TS Backlog [Current Week]","S1/TS Disposed [Current Week]","S1/TS MTTR [13 Weeks Outstanding]_trend","S1/TS Incoming [Current Week]_trend","S1/TS Backlog [Current Week]_trend","S1/TS Disposed [Current Week]_trend"];
	AppView.find({"ViewName":view_name},{"ViewID":1, "_id":0})
	.then(function(view){
		if(view.length==0){res.jsend.fail("View Name does not exist"); return;}
		else {
			var view_id=view[0].ViewID;
			var allMetricsRaw = ["IFD Backlog [Current Week]", "IFD Incoming [Current Week]", "IFD Disposed [Current Week]", "IFD MTTR [13 Weeks Outstanding]", "CFD Backlog [Current Week]", "CFD Incoming [Current Week]", "CFD Disposed [Current Week]", "CFD MTTR [13 Weeks Outstanding]", "S1/TS Incoming [Current Week]", "S1/TS Backlog [Current Week]", "S1/TS Disposed [Current Week]", "S1/TS MTTR [13 Weeks Outstanding]"]
			var tasks=[]; var tasks2=[];
			var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
			var config={}; var avgConfig={};
			tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, "OQ"))
			Promise.all(tasks)
			.then(function(details){
				query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
				config = details[0][4]; avgConfig = details[0][5];
				//use only one query_id
				WeekEndDates.find({},{_id:0})
				.then(function(weeks2){
					var listOfDates = weeks2[0].WeekEndDates.slice(0,2);
					tasks2.push(gen_query_seg(segment));
					Promise.all(tasks2)
					.then(function(match_add){
						var match=[{"QueryID":{$in:query_ids}},{"WeekEndDate" : {'$in':listOfDates}}];
						if(match_add[0] == 1){}
						else if(match_add[0].length == 0){res.jsend.fail("Invalid Segment"); return;}
						else {match.push({"DEManagerUserID":{$in:match_add[0][0].listOfUsers}})}
						FactDefectAgg.aggregate([
							{$match:{$and:match}},
		                 	{$unwind:"$MetricAttrib"},
		                 	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
		                 	{$group:{_id:{"WeekEndDate":"$WeekEndDate", "MetricName":"$MetricAttrib.Name"}, MetricValue:{$sum:"$MetricAttrib.Value"}}},
		                 	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{MetricName:"$_id.MetricName",MetricValue:"$MetricValue"}}}},
		                ])
		                .then(function(docs){
		                	if(docs.length == 0){return [];}
		                	var dataJson={}
		                	docs.forEach(function(data){
								  var compJson2={}
								  data.data.forEach(function(doc){
									  compJson2[doc.MetricName]=doc.MetricValue;
							   	  })
								  var compJson={}
								  compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
								  if(data["_id"].getTime() == listOfDates[0].getTime()){dataJson["Curr"]=compJson}
								  else if(data["_id"].getTime() == listOfDates[1].getTime()){dataJson["Prev"]=compJson}
							});
		                	for (var key in dataJson["Curr"]){
		                		dataJson["Curr"][key+"_trend"]=(dataJson["Prev"][key] == undefined) ? "Up" : (dataJson["Curr"][key] > dataJson["Prev"][key]) ? "Up" : "Down"
		                	}
		                	var data={};
		                	data["ViewName"]=view_name; data["IFD"]={}; data["CFD"]={}; data["S1/TS"]={};
		                	for (each in dataJson["Curr"]){
		                		if(IFD_b.indexOf(each) > -1){data["IFD"][each]=dataJson["Curr"][each]};
		                		if(CFD_b.indexOf(each) > -1){data["CFD"][each]=dataJson["Curr"][each]};
		                		if(S1TS_b.indexOf(each) > -1){data["S1/TS"][each]=dataJson["Curr"][each]};
		                	}
		                	return data;
		                })
		                .then(res.jsend.success, res.jsend.error)
				    })
				})
			})
		}
	})
};

/* PinListSearch - BU, Segment, Pin and Level info
 * */
exports.PinListSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['Keys']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var keys=req.body.Keys;
	var data_arr=[]; var keys_mod=[];
	var data_json={};
	keys.forEach(function(key){
		keys_mod.push(new RegExp(key, "i"))
	});
	var types=["BU","Segment","Pin","L4UserID","L5UserID","L6UserID","L7UserID","L8UserID","L9UserID","L10UserID","L11UserID","L12UserID"]
	types.forEach(function(type){
		var agg_match_query={}
		agg_match_query[type]={$in:keys_mod}
		DimPinHier.aggregate([
		    {$match:agg_match_query},
		    {$group:{_id:{$concat:["$"+type]}}},
		    {$group:{_id:null,type:{$addToSet:"$_id"}}},
		])
		.then(function(doc){
			if(doc.length == 0){
				data_json[type]=[];
				if((Object.keys(data_json).length) == types.length){
					res.jsend.success(data_json)
				}
			}
			else{
				if(type == "BU" || type == "Segment" || type == "Pin"){
					var emp_arr=[]
					doc[0].type.forEach(function(each){
						var emp_json={}
						emp_json["Name"]=each
						emp_arr.push(emp_json)
					})
					data_json[type]=emp_arr
					if((Object.keys(data_json).length) == types.length){
						res.jsend.success(data_json)
					}
				}
				else{
					var emp_json2={}
					Employees.aggregate([
					    {$match:{Userid:{$in:doc[0].type}}},
					    {$project:{Userid:1,Name:{$concat:["$Givenname"," ","$SN"]},_id:0}},
					])
					.then(function(emp_json2){
						data_json[type] = emp_json2;
						if((Object.keys(data_json).length) == types.length){
							res.jsend.success(data_json)
						}
					})
				}
			}
		})
	})
};

/* queryIdPinData - Pin data for a QueryID
 * */

exports.queryIdPinData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','Primary','ViewType','Keys']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; 	var keys=req.body.Keys;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
	var pin_keys_map={"BU":1, "Segment":2, "Pin":3, "L4UserID":4, "L5UserID":5, "L6UserID":6, "L7UserID":7,
			"L8UserID":8, "L9UserID":9, "L10UserID":10, "L11UserID":11, "L12UserID":12};
	var max_val_arr=[]; var pin_keys_map_inv={}; var group=""; var keys_mod={};
	var dim_pin_match={}; var dim_pin_group={}; var pin_list=[]; var count=0;
	var group_js={"BU":"Segment","Segment":"Pin","Pin":"L4UserID","L4UserID":"L5UserID","L5UserID":"L6UserID",
			"L6UserID":"L7UserID","L7UserID":"L8UserID","L8UserID":"L9UserID","L9UserID":"L10UserID",
			"L10UserID":"L11UserID","L11UserID":"L12UserID"}
	if(Object.keys(keys).length == 0){group="BU";}
	else{
		Object.keys(keys).forEach(function(key){max_val_arr.push(pin_keys_map[key])})
		pin_keys_map_inv = _.invert(pin_keys_map);
		group = group_js[pin_keys_map_inv[Math.max.apply(Math,max_val_arr)]];
	}
	keys_mod=JSON.parse(JSON.stringify(keys));
	keys_mod[group]={'$ne':null};
	dim_pin_match={'$match':keys_mod};
	pin_list=keys;
	dim_pin_group={'$group':{"_id":"$"+group,listOfUsers:{'$addToSet':"$EmpUserID"}}}

	count=Object.keys(pin_list).length
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
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
				DimPinHier.aggregate([dim_pin_match, dim_pin_group,])
				.then(function(users){
					var tasks2=[];
				    users.forEach(function(user){
					    tasks2.push(
					    	FactDefectAgg.aggregate([
			                	{$match:{$and:[{"QueryID":query_id},{"WeekEndDate" : new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:user.listOfUsers}}]}},
			                	{$unwind:"$MetricAttrib"},
			                	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			                	{$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}}
			                ])
			                .then(function(data){
						    	  var pinJson2={}
						    	  for (var item in data) {pinJson2[data[item]._id]=data[item].MetricCount;}
						    	  if(_.isEmpty(pinJson2)) {}
						    	  else{
									  var pinJson={}
									  pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, pinJson2, avgConfig, config)					  
									  //0 suppression
									  var sum_vals=0;
									  for (var ea in pinJson) {
					    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+pinJson[ea];}
					    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+pinJson[ea];}
									  }
									  if(sum_vals != (metrics_good.length * 100)){
										  pinJson["Name"]=user._id; pinJson["QueryID"]=query_id
								    	  Object.keys(pin_list).forEach(function(pin_l){pinJson[pin_l]=pin_list[pin_l]})
								    	  pinJson["Level"]=group;
								    	  return pinJson;
									  }
									  //0 suppression end
						    	  }
			                })
					    )
				    })
					Promise.all(tasks2)
					.then(function(dataArr){
					    	dataArr = dataArr.filter(function(n){ return n != undefined });
					    	dataJson["QueryID"]=query_id; dataJson["Data"]=dataArr;
				    		res.jsend.success(dataJson);
					    }, function(err){
					    	res.jsend.error(err)
					})
				})
			}
			else if(trend == "Y"){
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				DimPinHier.aggregate([
				     dim_pin_match,
				     dim_pin_group,
			    ])
				.then(function(users){
					var tasks2=[];
				    users.forEach(function(user){
					    tasks2.push(
					    	FactDefectAgg.aggregate([
			                	{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:user.listOfUsers}}]}},
			                	{$unwind:"$MetricAttrib"},
			                	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			                	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
			                	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName","MetricCount":"$MetricCount"}}}}
			                ])
			                .then(function(data){
			                	var dataJson2={}
			                	data.forEach(function(doc){
	    		   					var dataJson={};
	    		   					doc.data.forEach(function(d){
	    		   						dataJson[d.MetricName]=d.MetricCount;
	    		   					})
	    		   					var final_json={}
	    		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
	    		   					if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
									else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
	    	   					})
	    	   					for (var key in dataJson2["Curr"]){
	    	   						dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
	    	   						dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined) ? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
			                	}
			                	if(_.isEmpty(dataJson2)) {}
			                	else{
									  //0 suppression
									  var sum_vals=0;
									  for (var ea in dataJson2["Curr"]) {
					    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataJson2["Curr"][ea];}
					    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataJson2["Curr"][ea];}
									  }
									  if(sum_vals != (metrics_good.length * 100)){
						                	dataJson2["Curr"]["Name"]=user._id; dataJson2["Curr"]["QueryID"]=query_id;
									    	Object.keys(pin_list).forEach(function(pin_l){
									    		dataJson2["Curr"][pin_l]=pin_list[pin_l]
									    	})
									    	dataJson2["Curr"]["Level"]=group;
						                	return dataJson2["Curr"];
									  }
									  //0 suppression end
			                	}
			                })
					    )
				    })
					Promise.all(tasks2)
					.then(function(dataArr){
					    	dataArr = dataArr.filter(function(n){ return n != undefined });
					    	dataJson["QueryID"]=query_id; dataJson["Data"]=dataArr;
				    		res.jsend.success(dataJson);
					    }, function(err){
					    	res.jsend.error(err)
					})
				})
			}
		})
	})
};

/* queryIdPinTrendData - Pin trend for a QueryID
 * */
exports.queryIdPinTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','Keys','ViewID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType;
	var keys=req.body.Keys;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;

	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];
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
			DimPinHier.aggregate([
	 		    {$match:keys},
	 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
	 	    ])
	 		.then(function(users){
	 			if(users.length==0){res.jsend.success([]); return;}
	 			FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{ MetricName:"$MetricAttrib.Name",WeekEndDate:"$WeekEndDate"}, MetricValue:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{MetricName:"$_id.MetricName",MetricValue:"$MetricValue"}}}},
				])
				.then(function(docs){
					docs.forEach(function(data){
						  var compJson2={}
						  data.data.forEach(function(doc){
							  compJson2[doc.MetricName]=doc.MetricValue;
					   	  })
						  var compJson={}
						  compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						  compJson["Date"]=data["_id"];
						  datesAvaib.push(data["_id"])
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

/* queryIdPinSearch - Pin search for a QueryID
 * */
exports.queryIdPinSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryIDS','Metrics','Keys','ViewID','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var query_ids=req.body.QueryIDS;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var Keys=req.body.Keys;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var len=0;
	Object.keys(Keys).forEach(function(key){
		len=len+Keys[key].length;
	})
	var flag=0; var user_arr=[];
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
				Object.keys(Keys).forEach(function(key){
				    Keys[key].forEach(function(key_val){
				    	var key_val_json={}
				    	key_val_json[key]=key_val
				    	DimPinHier.aggregate([
				 		    {$match:key_val_json},
				 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
				 	    ])
				 	    .then(function(users){
							FactDefectAgg.aggregate([
								{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},
								               {"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
								{$unwind:"$MetricAttrib"},
								{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
								{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
								{$project:{"QueryID":"$_id.QueryID","MetricName":"$_id.MetricName","MetricValue":"$MetricValue","_id":0}},
								{$group:{_id:"$QueryID","PinData":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
								{$project:{QueryID:"$_id",_id:0,PinData:1}}
							])
							.then(function(data){
								flag=flag+1
								if(data.length > 0){
									data.forEach(function(data_each){
										var pin_json2={}
										data_each["PinData"].forEach(function(data_json){
											pin_json2[data_json["MetricName"]]=data_json["MetricValue"]
										})
										var pin_json={}
										pin_json = Func.avg_sum_calc(avgMetrics, sumMetrics, pin_json2, avgConfig, config)
										pin_json["Name"]=key_val; pin_json["Level"]=key;
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
				});
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				Object.keys(Keys).forEach(function(key){
				    Keys[key].forEach(function(key_val){
				    	var key_val_json={}
				    	key_val_json[key]=key_val
				    	DimPinHier.aggregate([
				 		    {$match:key_val_json},
				 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
				 	    ])
				 	    .then(function(users){
				 	    	FactDefectAgg.aggregate([
								{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},
								               {"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
								{$unwind:"$MetricAttrib"},
								{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
								{$group:{_id:{"QueryID":"$QueryID","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
								{$group:{_id:{"QueryID":"$_id.QueryID","WeekEndDate":"$_id.WeekEndDate"},"PinData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
								{$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"QueryID":"$_id.QueryID","PinData":"$PinData"}}}}
							])
							.then(function(docs){
								flag=flag+1
								if(docs.length > 0){
									var dataJson2={}
									docs.forEach(function(doc){
										var final_arr=[]
										doc.dataA.forEach(function(d){
											var dataJson={};
											d.PinData.forEach(function(d1){
												dataJson[d1.MetricName]=d1.MetricValue;
											})
											var fi_json={}
											fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
											if(Object.keys(fi_json).length != 0){
												fi_json["QueryID"]=d.QueryID
												fi_json["Name"]=key_val; fi_json["Level"]=key;
												final_arr.push(fi_json)
											}
										})
										if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
										else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
									})
						    		dataJson2["Curr"].forEach(function(js_data){
										var query_id=js_data.QueryID;
										var elem=Object.keys(js_data);
										elem.splice(elem.indexOf("QueryID"),1)
										elem.splice(elem.indexOf("Name"),1)
										elem.splice(elem.indexOf("Level"),1)
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
								return flag;
							})
							.then(function(flag){
								if(flag == len){
									res.jsend.success(user_arr)
								}
							})
				 	    })
				    })
				});
			}
		})
	})
};

/* viewIdPinData - Pin data for a ViewID (all primary queries)
 * */

exports.viewIdPinData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType','Keys']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType; var keys=req.body.Keys;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var metrics_bad=[];; var metrics_good=[];	
	for (var i=0; i<allMetricsRaw.length; i++){
		if(FlagMetrics["Good-Metric"].indexOf(allMetricsRaw[i]) > -1){metrics_good.push(allMetricsRaw[i]);}
		else{metrics_bad.push(allMetricsRaw[i]);}
	}
	
	var pin_keys_map={"BU":1, "Segment":2, "Pin":3, "L4UserID":4, "L5UserID":5, "L6UserID":6, "L7UserID":7,
			"L8UserID":8, "L9UserID":9, "L10UserID":10, "L11UserID":11, "L12UserID":12};
	var max_val_arr=[]; var pin_keys_map_inv={}; var group=""; var keys_mod={};
	var dim_pin_match={}; var dim_pin_group={}; var pin_list=[]; var count=0;
	var group_js={"BU":"Segment","Segment":"Pin","Pin":"L4UserID","L4UserID":"L5UserID","L5UserID":"L6UserID",
			"L6UserID":"L7UserID","L7UserID":"L8UserID","L8UserID":"L9UserID","L9UserID":"L10UserID",
			"L10UserID":"L11UserID","L11UserID":"L12UserID"}
	if(Object.keys(keys).length == 0){group="BU";}
	else{
		Object.keys(keys).forEach(function(key){max_val_arr.push(pin_keys_map[key])})
		pin_keys_map_inv = _.invert(pin_keys_map);
		group = group_js[pin_keys_map_inv[Math.max.apply(Math,max_val_arr)]];
	}
	keys_mod=JSON.parse(JSON.stringify(keys));
	keys_mod[group]={'$ne':null};
	dim_pin_match={'$match':keys_mod};
	pin_list=keys;
	dim_pin_group={'$group':{"_id":"$"+group,listOfUsers:{'$addToSet':"$EmpUserID"}}}

	count=Object.keys(pin_list).length
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
				DimPinHier.aggregate([dim_pin_match, dim_pin_group,])
				.then(function(users){
					var tasks2=[];
				    users.forEach(function(user){
					    tasks2.push(
					    	FactDefectAgg.aggregate([
			                	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate" : new Date(latestDate.toISOString())},{"DEManagerUserID":{$in:user.listOfUsers}}]}},
			                	{$unwind:"$MetricAttrib"},
			                	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			                	{$group:{_id:"$MetricAttrib.Name", MetricCount:{$sum:"$MetricAttrib.Value"}}}
			                ])
			                .then(function(data){
						    	  var pinJson2={}
						    	  for (var item in data) {pinJson2[data[item]._id]=data[item].MetricCount;}
						    	  if(_.isEmpty(pinJson2)) {}
						    	  else{
									  var pinJson={}
									  pinJson = Func.avg_sum_calc(avgMetrics, sumMetrics, pinJson2, avgConfig, config)
									  //0 suppression
									  var sum_vals=0;
									  for (var ea in pinJson) {
					    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+pinJson[ea];}
					    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+pinJson[ea];}
									  }
									  if(sum_vals != (metrics_good.length * 100)){
									  pinJson["Name"]=user._id; pinJson["ViewID"]=view_id;
							    	  Object.keys(pin_list).forEach(function(pin_l){pinJson[pin_l]=pin_list[pin_l]})
							    	  pinJson["Level"]=group;
							    	  return pinJson;
									  }
									  //0 suppression end
						    	  }
			                })
					    )
				    })
					Promise.all(tasks2)
					.then(function(dataArr){
					    	dataArr = dataArr.filter(function(n){ return n != undefined });
					    	dataJson["ViewID"]=view_id; dataJson["Data"]=dataArr;
				    		res.jsend.success(dataJson);
					    }, function(err){
					    	res.jsend.error(err)
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
				DimPinHier.aggregate([dim_pin_match, dim_pin_group,])
				.then(function(users){
					var tasks2=[];
				    users.forEach(function(user){
					    tasks2.push(
			                FactDefectAgg.aggregate([
			                	{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"DEManagerUserID":{$in:user.listOfUsers}}]}},
			                	{$unwind:"$MetricAttrib"},
			                	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
			                	{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
			                	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{"MetricName":"$_id.MetricName","MetricCount":"$MetricCount"}}}}
			                ])
			                .then(function(data){
			                	if(data.length != 0){
				                	var dataJson2={}
				                	data.forEach(function(doc){
		    		   					var dataJson={};
		    		   					doc.data.forEach(function(d){dataJson[d.MetricName]=d.MetricCount;})
		    		   					var final_json={}
		    		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
		    		   					if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
										else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
		    	   					})
		    	   					for (var key in dataJson2["Curr"]){
		    	   						dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
		    	   						dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined) ? "Up": (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
				                	}
				                	if(_.isEmpty(dataJson2)) {}
				                	else{
										  //0 suppression
										  var sum_vals=0;
										  for (var ea in dataJson2["Curr"]) {
						    	    			if(metrics_good.indexOf(ea) > -1){sum_vals=sum_vals+dataJson2["Curr"][ea];}
						    	    			else if(metrics_bad.indexOf(ea) > -1){sum_vals=sum_vals+dataJson2["Curr"][ea];}
										  }
										  if(sum_vals != (metrics_good.length * 100)){
							                	dataJson2["Curr"]["Name"]=user._id; dataJson2["Curr"]["ViewID"]=view_id;
										    	Object.keys(pin_list).forEach(function(pin_l){dataJson2["Curr"][pin_l]=pin_list[pin_l]})
										    	dataJson2["Curr"]["Level"]=group;
							                	return dataJson2["Curr"];
										  }
										  //0 suppression end
				                	}
			                	}
			                })
					    )
				    })
					Promise.all(tasks2)
					.then(function(dataArr){
					    	dataArr = dataArr.filter(function(n){ return n != undefined });
					    	dataJson["ViewID"]=view_id; dataJson["Data"]=dataArr;
				    		res.jsend.success(dataJson);
					    }, function(err){
					    	res.jsend.error(err)
					})
				})
			}
		})
	})
};

/* viewIdPinTrendData - Get Pin trend for a ViewID (all primary queries)
 * */
exports.viewIdPinTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','Keys','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var keys=req.body.Keys;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];
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
			DimPinHier.aggregate([
	 		    {$match:keys},
	 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
	 	    ])
	 		.then(function(users){
	 			if(users.length==0){res.jsend.success([]); return;}
	 			FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{ MetricName:"$MetricAttrib.Name",WeekEndDate:"$WeekEndDate"}, MetricValue:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{MetricName:"$_id.MetricName",MetricValue:"$MetricValue"}}}},
				])
				.then(function(docs){
					docs.forEach(function(data){
						  var compJson2={}
						  data.data.forEach(function(doc){
							  compJson2[doc.MetricName]=doc.MetricValue;
					   	  })
						  var compJson={}
						  compJson = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						  compJson["Date"]=data["_id"];
						  datesAvaib.push(data["_id"])
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

/* viewIdPinSearch - Pin search for a ViewID (all primary queries)
 * */
exports.viewIdPinSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','Keys','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var Keys=req.body.Keys; var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var len=0;
	Object.keys(Keys).forEach(function(key){
		len=len+Keys[key].length;
	})
	var flag=0; var user_arr=[]

	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

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
				Object.keys(Keys).forEach(function(key){
				    Keys[key].forEach(function(key_val){
				    	var key_val_json={}
				    	key_val_json[key]=key_val
				    	DimPinHier.aggregate([
				 		    {$match:key_val_json},
				 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
				 	    ])
				 	    .then(function(users){
							FactDefectAgg.aggregate([
								{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},
								               {"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
								{$unwind:"$MetricAttrib"},
								{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
								{$group:{_id:{"MetricName":"$MetricAttrib.Name"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
								{$group:{_id:null,"PinData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
								{$project:{_id:0,PinData:1}}
							])
							.then(function(data){
								flag=flag+1
								if(data.length > 0){
									data.forEach(function(data_each){
										var pin_json2={}
										data_each["PinData"].forEach(function(data_json){
											pin_json2[data_json["MetricName"]]=data_json["MetricValue"]
										})
										var pin_json={}
										pin_json = Func.avg_sum_calc(avgMetrics, sumMetrics, pin_json2, avgConfig, config)
										pin_json["Name"]=key_val; pin_json["Level"]=key;
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
				});
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				Object.keys(Keys).forEach(function(key){
				    Keys[key].forEach(function(key_val){
				    	var key_val_json={}
				    	key_val_json[key]=key_val
				    	DimPinHier.aggregate([
				 		    {$match:key_val_json},
				 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
				 	    ])
				 	    .then(function(users){
							FactDefectAgg.aggregate([
								{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},
								               {"DEManagerUserID":{$in:users[0].listOfUsers}}]}},
								{$unwind:"$MetricAttrib"},
								{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
								{$group:{_id:{"MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},"MetricValue":{$sum:"$MetricAttrib.Value"}}},
								{$group:{_id:"$_id.WeekEndDate","PinData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
							])
							.then(function(docs){
								flag=flag+1
								if(docs.length > 0){
									var dataJson2={}
									docs.forEach(function(doc){
										var final_arr=[]
										var dataJson={};
										doc.PinData.forEach(function(d){
											dataJson[d.MetricName]=d.MetricValue;
										})
										var fi_json={}
										fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
										if(Object.keys(fi_json).length != 0){
											fi_json["ViewID"]=view_id
											fi_json["Name"]=key_val; fi_json["Level"]=key;
											final_arr.push(fi_json)
										}
										if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
										else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
									})
						    		dataJson2["Curr"].forEach(function(js_data){
						    			var name=js_data.Name;
										var elem=Object.keys(js_data);
										elem.splice(elem.indexOf("ViewID"),1)
										elem.splice(elem.indexOf("Name"),1)
										elem.splice(elem.indexOf("Level"),1)
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
										user_arr.push(js_data)
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
				});
			}
		})
	})
};
