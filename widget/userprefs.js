var winston = require('winston');
var util = require('../util');
var mongoose = require('mongoose');
var ObjectId = mongoose.Types.ObjectId;
var _ = require('underscore');
var AppView = require('../../../models/widget/app_view');
var AppBrdgViewQuery = require('../../../models/widget/app_brdg_view_query');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var WeekEndDates = require('../../../models/widget/week_end_dates');
var MetricMapping = require('../../../models/widget/metric_mapping');
var AppQuery = require('../../../models/widget/app_query');
var ScrubberLink = require('../../data/widget/scrubber_link');
var MetricMappingExec = require('../../../models/widget/metric_mapping_exec');
var AppBuList= require('../../../models/widget/app_bu_list');
var SparkRoomDetails= require('../../../models/widget/spark_room_details');
var UserDetails= require('../../../models/widget/user_details');
var ReleaseScorecardDetails= require('../../../models/widget/release_scorecard_details');
var UserWidgetDetails= require('../../../models/widget/user_widget_dtls');
var KeyNoteDetails= require('../../../models/widget/key_note_details');
var BeBuWidgetMapping= require('../../../models/widget/be_bu_widget_mapping');
var AppGlance = require('../../../models/widget/app_oq_rel_bu_mapping');
var config = require('config');
var rp = require('request-promise');
/* listMetrics - Metrics and SubMetrics for OQ or Release View
 * */
exports.listMetrics = function (req, res) {
	var query = req.query;
	var errors = util.requireFields(req.query, ['ViewType']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	query["ParentMetricName"] = "N/A";
	MetricMapping.find(query, { _id: 0 })
	.then(function (docs) {
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
};

/* query_tune - Internal function
 * logic to be used to generate corresponding scrubber date links
 *  */
var query_tune = function (query, view_id, query_id) {
	var query_mod = query;
	var modif = ["1WK", "13WK", "52WK", "StartDate:EndDate", "TODAYP7", "TODAYM100"]; var modif_flag = 0; var key = "";
	modif.forEach(function (ke) {
		if (query.indexOf(ke) > -1) { key = ke; modif_flag = 1 }
	})
	var date_conv = function (date) {
		return (date.toISOString().slice(2, 10).replace(/-/g, ""))
	}
	if (modif_flag == 0) { return query_mod; }
	else if(key == modif[4]){
		var d_temp=new Date(); d_temp.setDate(d_temp.getDate()+7);
		date_str = date_conv(d_temp); var key_re = new RegExp(key, 'g');
		query_mod = query_mod.replace(key_re, date_str);
		query_mod = query_mod.replace("TODAY", date_conv(new Date()));
		return query_mod;
	}
	else if(key == modif[5]){
		var d_temp=new Date(); d_temp.setDate(d_temp.getDate()-100);
		date_str = date_conv(d_temp); var key_re = new RegExp(key, 'g');
		query_mod = query_mod.replace(key_re, date_str);
		return query_mod;
	}
	else {
		var week_start = ""; var week_end = "";
		return WeekEndDates.find({}, { _id: 0 })
			.then(function (dates) {
			if (key == modif[0]) {
				week_end = dates[0].WeekEndDates[0];
				week_start = new Date(dates[0].WeekEndDates[1]); new Date(week_start.setDate(week_start.getDate() + 1))
			}
			else if (key == modif[1]) {
				week_end = dates[0].WeekEndDates[1];
				week_start = new Date(dates[0].WeekEndDates[13]); new Date(week_start.setDate(week_start.getDate() + 1))
			}
			else if (key == modif[2]) {
				week_end = dates[0].WeekEndDates[0];
				week_start = new Date(dates[0].WeekEndDates[51]); new Date(week_start.setDate(week_start.getDate() + 1))
			}
			else if (key == modif[3]) {
				if (query_id != undefined) {
					return AppQuery.find({ "QueryID": query_id }, { "StartDate": 1, "EndDate": 1 })
					.then(function (dates) {
						week_end = dates[0]["EndDate"]
						week_start = dates[0]["StartDate"]
						var date_str = date_conv(week_start) + ":" + date_conv(week_end);
						var key_re = new RegExp(key, 'g');
						query_mod = query_mod.replace(key_re, date_str);
						return query_mod;
					})
				}
				else if (view_id != undefined) {
					return AppBrdgViewQuery.aggregate([
						{ $match: { "ViewID": view_id } },
						{ $unwind: "$Queries" },
						{ $match: { $and: [{ "Queries.QueryType": "BugBackLog" }, { "Queries.Primary": "Y" }] } },
						{ $project: { "QueryID": "$Queries.QueryID", _id: 0 } }
						])
						.then(function (query) {
							return AppQuery.find({ "QueryID": query[0]["QueryID"] }, { "StartDate": 1, "EndDate": 1 })
							.then(function (dates) {
								week_end = dates[0]["EndDate"]
								week_start = dates[0]["StartDate"]
								var date_str = date_conv(week_start) + ":" + date_conv(week_end);
								var key_re = new RegExp(key, 'g');
								query_mod = query_mod.replace(key_re, date_str);
								return query_mod;
							})
						})
				}
			}
			var date_str = date_conv(week_start) + ":" + date_conv(week_end);
			var key_re = new RegExp(key, 'g');
			query_mod = query_mod.replace(key_re, date_str);
			return query_mod;
		})
	}
}

/* scrubberMetric - to get Scrubber link for a metric for ViewID/QueryID
 *  */
exports.scrubberMetric = function (req, res) {
	// for main view, for psirt, append to psirt query, if not main query, same for rg and psirt in rel.
	var errors = util.requireFields(req.body, ['Metric', 'ViewType', 'ViewID']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var metric = req.body.Metric; var view_type = req.body.ViewType; var view_id = req.body.ViewID;
	var query_def = ""; var tasks = []; var file_type=req.body.Type;
	var file_pref = "file:/auto/cqi/CQI_FILES/CQI_"; var file_suff = ".txt";
	var query_id = req.body.QueryID; var primary = req.body.Primary;
	if (query_id != undefined && primary == undefined) { res.jsend.fail({ "Primary": "missing field" }); return; }

	var def_res = { "ScrubberLink": "N", "Metric": metric };
	var qddts_str = ScrubberLink[view_type + "_query"][metric]; var final_query = "";
	if (qddts_str == undefined) { res.jsend.success(def_res); return; }
	if (query_id != undefined && primary == "N") {
		if (metric == "RG" || metric == "RG Backlog" || metric == "RG Current Outstanding") {
			//new logic
			tasks.push(
					AppBrdgViewQuery.aggregate([
						{$match:{"ViewID":view_id}},
						{$unwind:"$Queries"},
						{$match:{"Queries.QueryID":query_id, "Queries.RGQueryID":{$exists:true}, "Queries.RGQueryID":{$ne:0}}},
						{$project:{"Queries.RGQueryID":1}}
						])
						.then(function(rg_data){
							if(rg_data.length != 0){query_id=rg_data[0]["Queries"]["RGQueryID"]}
							if(file_type == "File"){return file_pref+query_id+file_suff+ " " + qddts_str;}
							return AppQuery.find({ "QueryID": query_id }, { "QueryDefinition": 1 })
							.then(function (query) {
								if (query.length == 0) { return [] }
								query_def = query[0]["QueryDefinition"]
								final_query = query_def + " " + qddts_str;
								return final_query;
							})
						})
			)
		}
		else if (Object.keys(ScrubberLink[view_type]).indexOf(metric) > -1) {res.jsend.success(def_res); return; }
		else if(file_type == "File"){tasks.push(file_pref+query_id+file_suff+ " " + qddts_str);}
		else{
			tasks.push(
					AppQuery.find({ "QueryID": query_id }, { "QueryDefinition": 1 })
					.then(function (query) {
						if (query.length == 0) { return [] }
						query_def = query[0]["QueryDefinition"]
						final_query = query_def + " " + qddts_str;
						return final_query;
					})
			)
		}
	}
	else if (view_id != undefined) {
		var type = [];
		if (ScrubberLink[view_type][metric] == undefined && view_type == "OQ") { type = ["Defect"] }
		else if (ScrubberLink[view_type][metric] == undefined && view_type == "Release") { type = ["BugBackLog"] }
		else { type = ScrubberLink[view_type][metric] }
		tasks.push(
				AppBrdgViewQuery.aggregate([
					{ $match: { "ViewID": view_id } },
					{ $unwind: "$Queries" },
					{ $match: { $and: [{ "Queries.QueryType": { $in: type } }, { "Queries.Primary": "Y" }] } },
					{ $project: { "QueryID": "$Queries.QueryID", _id: 0 } }
					])
					.then(function (view) {
						if (view.length == 0 && view_type == "OQ" && type[0] == "PSIRT") { return AppBrdgViewQuery.aggregate([{ $match: { "ViewID": view_id } },{ $unwind: "$Queries" },{ $match: { $and: [{ "Queries.QueryType": "Defect" }, { "Queries.Primary": "Y" }] } },{ $project: { "QueryID": "$Queries.QueryID", _id: 0 } }]).then(function (view2) { if (view2.length == 0) { res.jsend.success(def_res); return 0; } if(file_type == "File"){return file_pref+view2[0]["QueryID"]+file_suff+ " " + qddts_str;}return AppQuery.find({ "QueryID": view2[0]["QueryID"] }, { "QueryDefinition": 1 }).then(function (query) {if (query.length == 0) {return [];}query_def = query[0]["QueryDefinition"];final_query = query_def + " " + qddts_str; return final_query;})})}
						else if (view.length == 0 && view_type == "Release" && (type[0] == "RG" || type[0] == "PSIRT")) { return AppBrdgViewQuery.aggregate([{ $match: { "ViewID": view_id } }, { $unwind: "$Queries" }, { $match: { $and: [{ "Queries.QueryType": "BugBackLog" }, { "Queries.Primary": "Y" }] } }, { $project: { "QueryID": "$Queries.QueryID", _id: 0 } }]).then(function (view2) { if (view2.length == 0) { res.jsend.success(def_res); return 0; } if(file_type == "File"){return file_pref+view2[0]["QueryID"]+file_suff+ " " + qddts_str} return AppQuery.find({ "QueryID": view2[0]["QueryID"] }, { "QueryDefinition": 1 }).then(function (query) { if (query.length == 0) { return []; } query_def = query[0]["QueryDefinition"]; final_query = query_def + " " + qddts_str; return final_query; }) }) }
						else if (view.length == 0) { res.jsend.success(def_res); return 0; }
						else if(file_type == "File"){return file_pref+view[0]["QueryID"]+file_suff+ " " + qddts_str}
						return AppQuery.find({ "QueryID": view[0]["QueryID"] }, { "QueryDefinition": 1 })
						.then(function (query) {
							if (query.length == 0) { return []; }
							query_def = query[0]["QueryDefinition"];
							final_query = query_def + " " + qddts_str;
							return final_query;
						})
					})
		)
	}
	Promise.all(tasks)
	.then(function (final_query) {
		if (final_query[0] == 0) { return; }
		var task2 = []
		task2.push(query_tune(final_query[0], view_id, query_id))
		Promise.all(task2)
		.then(function (query_mod) {
			def_res["ScrubberLink"] = query_mod[0];
			return def_res;
		})
		.then(res.jsend.success, res.jsend.error)
	})
};

/* metricDefnsByMetric - Metric definition message based on metricDispName and view type
 * */
exports.metricDefnsByMetric = function (req, res) {
	var data = [];
	var errors = util.requireFields(req.body, ['ViewType', 'Metrics']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	MetricMapping.find({ "ParentMetricName": { $ne: "N/A" }, "MetricDispName": { $in: req.body.Metrics }, "ViewType": req.body.ViewType },
			{ "MetricDefn": 1, "MetricDispName": 1, "ViewType": 1, "ParentMetricName":1, _id: 0 })
			.then(function (data) {
				return data;
			})
			.then(res.jsend.success, res.jsend.error);
};

/* metricDefns - Metric definition for all Metrics
 * */
exports.metricDefns = function (req, res) {
	var data = [];
	MetricMapping.find({ "ParentMetricName": { $ne: "N/A" } },
			{ "_id": 0, "MetricId": 0, "MetricName": 0, "SubMetric": 0 })
			.then(function (docs) {
				docs.forEach(function (doc) {
					var js = {}
					js["MetricDispName"] = doc["MetricDispName"];
					js["ViewType"] = doc["ViewType"];
					//js["MetricDefn"] = JSON.stringify(doc["MetricDefn"]);
					js["ParentMetricName"] = doc["ParentMetricName"];
					js["MetricDefn"]=JSON.stringify(doc["MetricDefn"]).slice(1,-1);
					data.push(js)
				})
				return data;
			})
			.then(res.jsend.success, res.jsend.error);
};

/* viewsMappedToUser - Accessible views for a user
 * */
exports.viewsMappedToUser = function (req, res) {
	var errors = util.requireFields(req.query, ['UserID', 'ViewType', 'BuName']);
	var user_id = req.query.UserID;
	var view_type = req.query.ViewType;
	var bube=req.query.BuName;
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	//chnage the match
	AppView.aggregate([
//	                   {$match : {
//				$and: [{ "ViewType": view_type }, {$or : [ {"BuName": req.query.BuName},{"BuBeList" : req.query.BuName}] },
//				       { "ActiveFlag": "Y" }, {
//					$or: [{ "CreatedBy": user_id }, { "ReadOnlyUser.UserID": { $in: [user_id, "PUBLIC"] } },
//						{ "CoOwner.UserID": { $in: [user_id, "PUBLIC"] } }]
//				}]
//			}},
		{$match:{$and:[{"ViewType":view_type},
		               {"ActiveFlag":"Y"},
									 {$or:[{"BuName":bube},{"BuBeList":bube}]},
		               {$or:[ {"CreatedBy":user_id},
									 			{"ReadOnlyUser.UserID":{$in:[user_id]}},
												{"CoOwner.UserID":{$in:[user_id]}},
												{"ReadOnlyUser.UserID":{$in:["PUBLIC"]}},
												{"CoOwner.UserID":{$in:["PUBLIC"]}}
										]}
		]}},
		{$project : { "ViewType": 1, "ViewName": 1, "ViewID": 1, "CreatedBy": 1, "ReadOnlyUser": 1, "CoOwner": 1, "_id": 0 }},
		{$lookup : {from : "app_brdg_view_query", localField:"ViewID",foreignField : "ViewID", as:"temp"}},
	    {$project : { "ViewType": 1, "ViewName": 1, "ViewID": 1, "CreatedBy": 1, "ReadOnlyUser": 1, "CoOwner": 1,
	          "Queries":{ $arrayElemAt: ["$temp.Queries",0]}}},
	    {$unwind: "$Queries"},
	    {$match : { $and: [{ "Queries.QueryType": { $in: ["Defect", "BugBackLog"] } }, { "Queries.Primary": "Y" }] }},
	    {$lookup : {from : "app_query",localField:"Queries.QueryID",foreignField:"_id", as:"temp2"}},
			{$project: { "ViewType": 1, "ViewName": 1, "ViewID": 1, "CreatedBy": 1, "ReadOnlyUser": 1, "CoOwner": 1,
	          "LastRefreshDate":{ $arrayElemAt: ["$temp2.LastRefreshDate",0]}}},
	])
	.then(function (doc) {
		var allViewIds = doc.map(function(obj) {return obj.ViewID;});
		var doc_arr = [];
		//Get all the ViewIds which are part of OQ/Release glance
		AppGlance.find({"ViewID":{$in:allViewIds}},{"_id":0,"ViewID":1}).then(function(glanceDoc){
			var glanceViewIds = glanceDoc.map(function(obj) {return obj.ViewID;});
			doc.forEach(function (doc_each) {
				var doc_res = {};
				doc_res["ViewType"] = doc_each["ViewType"]; doc_res["ViewName"] = doc_each["ViewName"]; doc_res["ViewID"] = doc_each["ViewID"];
				doc_res["LastRefreshDate"] = doc_each["LastRefreshDate"];
				if (doc_each["CreatedBy"] == user_id) { doc_res["SharedType"] = "Owner"; }
				else {
					if (doc_each["ReadOnlyUser"] && doc_each["ReadOnlyUser"].length != 0) {
						doc_each["ReadOnlyUser"].forEach(function (check) {
							if (check["UserID"] == "PUBLIC") { doc_res["SharedType"] = "PUBLIC"; }
							else if (check["UserID"] == user_id) { doc_res["SharedType"] = "ReadOnly"; }
						})
					}
					if (doc_each["CoOwner"] && doc_each["CoOwner"].length != 0) {
						doc_each["CoOwner"].forEach(function (check) {
							if (check["UserID"] == user_id) { doc_res["SharedType"] = "CoOwner"; }
						})
					}
				}
				if(_.contains(glanceViewIds, doc_res["ViewID"])) {doc_res["isGlance"] = true;}
				else {doc_res["isGlance"] = false;}
				doc_arr.push(doc_res)
			})
			return doc_arr;
			
		}).then(res.jsend.success, res.jsend.error)
	}).then(res.jsend.success, res.jsend.error)
};

/* ViewDetails - View details of view based on ViewID
 * */
exports.ViewDetails = function (req, res) {
	var errors = util.requireFields(req.query, ['ViewID']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var view_id = req.query.ViewID;
	var view_data = {};
	AppView.findOne({ "ViewID": view_id }, { "ViewName": 1, "ViewType": 1, "ViewID": 1, "_id": 0 })
	.then(function (view_info) {
		if (view_info == null) { res.jsend.success([]) }
		else {
			view_data["ViewName"] = view_info["ViewName"], view_data["ViewType"] = view_info["ViewType"], view_data["ViewID"] = view_info["ViewID"]
			AppBrdgViewQuery.findOne({ "ViewID": view_id }, { "Queries.QueryID": 1, "Queries.Primary": 1, "Queries.QueryName": 1, "Queries.QueryType": 1, "_id": 0 })
			.then(function (query_data) {
				view_data["Queries"] = query_data["Queries"];
				return view_data;
			})
			.then(res.jsend.success, res.jsend.error)
		}
	})
};

/* getViewIDByName - ViewID of a View based on View Name
 * */
exports.getViewIDByName = function (req, res) {
	var query = req.query;
	var errors = util.requireFields(req.query, ['ViewName']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	AppView.findOne({ "ViewName": req.query.ViewName }, { "ViewID": 1, "ViewName": 1, "_id": 0 })
	.then(function (docs) {
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
};

/* getViewNameByID - View Name of a View based on ViewID
 * */
exports.getViewNameByID = function (req, res) {
	var query = req.query;
	var errors = util.requireFields(req.query, ['ViewID']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	/*
	AppView.findOne({ "ViewID": req.query.ViewID }, { "ViewID": 1, "ViewName": 1, "_id": 0 })
	.then(function (docs) {
		return docs;
	})*/
	var viewID = req.query.ViewID;
	AppView.aggregate([
		{$match : {"ViewID": parseInt(viewID)}},
		{$lookup : {from : "app_brdg_view_query", localField:"ViewID",foreignField : "ViewID", as:"temp"}},
   	{$project : {"ViewID":1,"ViewName":1,
		       "Queries":{ $arrayElemAt: ["$temp.Queries",0]}}},
     {$unwind: "$Queries"},
     {$match : { $and: [{ "Queries.QueryType": { $in: ["Defect", "BugBackLog"] } }, { "Queries.Primary": "Y" }] }},
     {$lookup : {from : "app_query",localField:"Queries.QueryID",foreignField:"_id", as:"temp2"}},
     {$project: {"ViewID":1, "ViewName":1,_id:0,
           "LastRefreshDate":{ $arrayElemAt: ["$temp2.LastRefreshDate",0]}}},
	]).then(function(docs){
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
};

/* getQueryIDByName - QueryID of a Query based on Query Name
 * */
exports.getQueryIDByName = function (req, res) {
	var errors = util.requireFields(req.query, ['QueryName']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	AppQuery.findOne({ "QueryName": req.query.QueryName }, { "QueryID": 1, "QueryName": 1, "_id": 0 })
	.then(function (docs) {
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);

};

/* getQueryNameByID - Query Name of a Query based on QueryID
 * */
exports.getQueryNameByID = function (req, res) {
	var errors = util.requireFields(req.query, ['QueryID']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	AppQuery.findOne({ "QueryID": req.query.QueryID }, { "QueryID": 1, "QueryName": 1, "_id": 0 })
	.then(function (docs) {
		return docs;
	})
	.then(res.jsend.success, res.jsend.error);
};

/* updateViewTemp - temp function for dual write to mongo along with oracle
 * updates viewname/activeflag based in inputs
 * */
exports.updateViewTemp = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID', 'ActiveFlag']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var set = {};
	if (req.body.ActiveFlag == "Y") { set = { "ViewName": req.body.ViewName, "ActiveFlag": req.body.ActiveFlag } }
	else if (req.body.ActiveFlag == "N") { set = { "ActiveFlag": req.body.ActiveFlag } };
	AppView.update({ "ViewID": req.body.ViewID }, { $set: set })
	.then(function (upd) {
		if (upd["ok"] == 1) return "Updated";
		else return "Not updated"
	})
	.then(res.jsend.success, res.jsend.error);
};

/* updateQueryTemp - temp function for dual write to mongo along with oracle
 * updates queryname/activeflag based in inputs
 * */
exports.updateQueryTemp = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID', 'ActiveFlag']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var set = {};
	if (req.body.ActiveFlag == "Y") { set = { "QueryName": req.body.QueryName, "ActiveFlag": req.body.ActiveFlag } }
	else if (req.body.ActiveFlag == "N") { set = { "ActiveFlag": req.body.ActiveFlag } };
	AppQuery.update({ "QueryID": req.body.QueryID }, { $set: set })
	.then(function (upd) {
		if (upd["ok"] == 1) return "Updated";
		else return "Not updated"
	})
	.then(res.jsend.success, res.jsend.error);
};

/* getWeekEndDates - List of all Weeks or List of Weeks valid for ViewID, QueryID
 * */
exports.getWeekEndDates = function (req, res) {
	var query_id = req.query.QueryID;
	var view_id = req.query.ViewID;
	if (query_id == undefined && view_id == undefined) {
		WeekEndDates.find({}, { _id: 0 })
		.then(function (dates) {
			return dates[0];
		})
		.then(res.jsend.success, res.jsend.error)
	}
	else if (query_id != undefined) {
		FactDefectAgg.distinct("WeekEndDate", { "QueryID": query_id })
		.then(function (dates) {
			return dates.reverse()
		})
		.then(res.jsend.success, res.jsend.error)
	}
	else if (view_id != undefined) {
		AppBrdgViewQuery.aggregate([
			{ $match: { "ViewID": parseInt(view_id) } },
			{ $unwind: "$Queries" },
			{ $match: { $and: [{ "Queries.QueryType": { $in: ["Defect", "BugBackLog"] } }, { "Queries.Primary": "Y" }] } },
			{ $project: { "QueryID": "$Queries.QueryID", _id: 0 } }
			])
			.then(function (query) {
				FactDefectAgg.distinct("WeekEndDate", { "QueryID": query[0].QueryID })
				.then(function (dates) {
					return dates.reverse()
				})
				.then(res.jsend.success, res.jsend.error)
			})
	}
};

/* loadWeekEndDates - load all the weeks, used weekly by ETL
 * */
exports.loadWeekEndDates = function (req, res) {
	// Update all Weekend dates
	FactDefectAgg.distinct("WeekEndDate")
	.then(function (arr) {
		arr = arr.reverse();
		arr2 = []
		arr.forEach(function (ar) {
			arr2.push(new Date(ar.toISOString()))
		});
		insertJson = {},
		insertJson["_id"] = new ObjectId();
		insertJson["WeekEndDates"] = arr2;
		WeekEndDates.remove({})
		.then(function (remove) {
			var data = new WeekEndDates(insertJson);
			data.save()
			.then(function (savedDoc) {
				res.jsend.success("Loaded Week End Dates")
			})
		})
	})
};

/* listExecMetrics - Used to get all exec metric list
 *  */
exports.listExecMetrics = function (req, res) {
	MetricMappingExec.find({}, { _id: 0 })
	.then(function (metrics) {
		res.jsend.success(metrics)
	})
};

/* exceltojson1 - Used to load List of Metric/Submetrics on initial load
 * DONT RUN
 * */
exports.exceltojson1 = function (req, res) {
	//db.metric_mapping.remove() in mongo shell
	res.send("exceltojson1 complete")
	src = "/Users/priyankapatel/Desktop/MetricSubMetricMapping-11JAN2018.xlsx";
	var exceltojson = require("xlsx-to-json-lc");
	sheet_map = { "OQView": "OQ", "ReleaseView": "Release" }
	Object.keys(sheet_map).forEach(function (sheet) {
		exceltojson({ input: src, output: null, sheet: sheet }, function (err, result) {
			if (err) { console.error(err); }
			else {
				result.forEach(function (each_row) {
					if (each_row.PARENT_METRIC_NAME == "N/A" && each_row.METRIC_ID != '') {
						insertJson = {}
						insertJson['_id'] = new ObjectId(), insertJson['MetricId'] = each_row.METRIC_ID, insertJson['MetricName'] = each_row.METRIC_NAME, insertJson['MetricDispName'] = each_row.METRIC_DISP_NAME, insertJson['ParentMetricName'] = each_row.PARENT_METRIC_NAME, insertJson['ViewType'] = each_row.VIEW_TYPE, insertJson['MetricDefn'] = each_row.Definition, insertJson['Scrubber'] = each_row.Scrubber_YN, insertJson['SubMetric'] = [];
						var data = new MetricMapping(insertJson);
						data.save()
						.then(function (savedDoc) {
						})
					}
					if (each_row.PARENT_METRIC_NAME != "N/A" && each_row.METRIC_ID != '') {
						insertJson = {}
						insertJson['_id'] = new ObjectId(), insertJson['MetricId'] = each_row.METRIC_ID, insertJson['MetricName'] = each_row.METRIC_NAME, insertJson['MetricDispName'] = each_row.METRIC_DISP_NAME, insertJson['ParentMetricName'] = each_row.PARENT_METRIC_NAME, insertJson['ViewType'] = each_row.VIEW_TYPE, insertJson['MetricDefn'] = each_row.Definition, insertJson['Scrubber'] = each_row.Scrubber_YN;
						var data = new MetricMapping(insertJson);
						data.save()
						.then(function (savedDoc) {
						})
					}
				})
			}
		})
	})
};

/* exceltojson2 - one time run after exceltojson1
 * DONT RUN
 * */
exports.exceltojson2 = function (req, res) {
	res.send("exceltojson2 complete")
	MetricMapping.update({}, { $unset: { "__v": "" } }, { multi: true })
	.then(function (unset) {
		MetricMapping.update({ "ParentMetricName": { $ne: "N/A" } }, { $unset: { "SubMetric": "" } }, { multi: true })
		.then(function (unset2) {
			view_types = ["OQ", "Release"]
			view_types.forEach(function (view_type) {
				MetricMapping.aggregate([
					{ $match: { $and: [{ "ParentMetricName": "N/A" }, { ViewType: view_type }] } },
					])
					.then(function (docs) {
						docs.forEach(function (doc) {
							MetricMapping.aggregate([
								{ $match: { $and: [{ "ParentMetricName": doc.MetricName }, { ViewType: view_type }] } },
								])
								.then(function (each) {
									upd_arr = []
									each.forEach(function (met) {
										upd_json = {}
										upd_json["MetricId"] = met["MetricId"], upd_json["MetricName"] = met["MetricName"], upd_json["MetricDispName"] = met["MetricDispName"], upd_json["MetricDefn"] = met["MetricDefn"], upd_json["Scrubber"] = met["Scrubber"];
										upd_arr.push(upd_json)
									})
									MetricMapping.update({ "_id": doc["_id"] }, { $set: { "SubMetric": upd_arr } })
									.then(function (upd) {
									})
								})
						})
					})
			})
		})
	})
};

/* getAllBUNames - static list of all BU's
 * */
exports.getAllBUNames = function (req, res) {
	var bu_names = ['CSG', 'SBG', 'DCBG', 'SPB', 'Overall', 'CBG', 'CSPG'];
	res.jsend.success(bu_names);
};

/* getBUNames - get list of all BU's
 * */
exports.getBUNames = function (req, res) {
	AppBuList.aggregate([
		{$project:{"BuName":"$BU", "BuID":1, _id:0}}
		])
		.then(function(data){
			return data;
		})
		.then(res.jsend.success, res.jsend.error);
};
//service get widget id from given be bu and view type
exports.getWidgetIdbyBeBu=function(req,res)
{
	//console.log("in get widget id request received is"+JSON.stringify(req.body))
	var errors = util.requireFields(req.body, ['ViewType']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	if(req.body.BE!=undefined) // returns one widget id
	{
		var query=
		{	
				$and:
					[{"ViewType":req.body.ViewType},
						{"BE":req.body.BE}
					]
		};
		BeBuWidgetMapping.find(query,{'_id':0,'ViewType':1,'BE':1,'WidgetID':1}).then(function(data1)
				{
			
			data=JSON.parse(JSON.stringify(data1))
			//console.log(" one widget id"+JSON.stringify(data))
			if(data[0]!=undefined)
				{			
				UserWidgetDetails.find({"WidgetID":data[0].WidgetID},{'_id':0,'WidgetName':1}).then(function(data_1)
						{
					//console.log("  widget name"+JSON.stringify(data_1))
					if(JSON.stringify(data_1)!=='[]')
						{			
						data[0].WidgetName=data_1[0].WidgetName;
						}
					else
						{
						data[0].WidgetName='';
						}
					res.jsend.success(data);
						})
				
				}// if association exists
			
			else // send default one
			{
				query=
				{	
						$and:
							[{"ViewType":req.body.ViewType},
								{"BE":"DEFAULT"}
							]
				};
				BeBuWidgetMapping.find(query,{'_id':0,'ViewType':1,'BE':1,'WidgetID':1}).then(function(data1)
						{
					data=JSON.parse(JSON.stringify(data1))
					UserWidgetDetails.find({"WidgetID":data[0].WidgetID},{'_id':0,'WidgetName':1}).then(function(data_1)
							{
						//console.log("  widget name"+JSON.stringify(data_1))
						if(JSON.stringify(data_1)!=='[]')
							{			
							data[0].WidgetName=data_1[0].WidgetName;
							}
						else
							{
							data[0].WidgetName='';
							}
						res.jsend.success(data);
							})
					
						})
			}

				});
	}
	else if(req.body.BU!=undefined) // BU present
	{
		//console.log("BU present")
		var query=
		{	
				$and:
					[{"ViewType":req.body.ViewType},
						{"BU":req.body.BU}
					]
		};
		BeBuWidgetMapping.find(query,{'_id':0,'ViewType':1,'BU':1,'WidgetID':1}).then(function(data1)
				{
			//console.log(" one widget id"+JSON.stringify(data[0]))
			data=JSON.parse(JSON.stringify(data1))
			if(data[0]!=undefined) 
				{// if association exists
				UserWidgetDetails.find({"WidgetID":data[0].WidgetID},{'_id':0,'WidgetName':1}).then(function(data_1)
						{
					//console.log("  widget name"+JSON.stringify(data_1))
					if(JSON.stringify(data_1)!=='[]')
						{			
						data[0].WidgetName=data_1[0].WidgetName;
						}
					else
						{
						data[0].WidgetName='';
						}
					res.jsend.success(data);
						})
				res.jsend.success(data);
				}
			else // send default one
			{
				query=
				{	
						$and:
							[{"ViewType":req.body.ViewType},
								{"BU":"DEFAULT"}
							]
				};
				BeBuWidgetMapping.find(query,{'_id':0,'ViewType':1,'BU':1,'WidgetID':1}).then(function(data1)
						{
					data=JSON.parse(JSON.stringify(data1))
					UserWidgetDetails.find({"WidgetID":data[0].WidgetID},{'_id':0,'WidgetName':1}).then(function(data_1)
							{
						//console.log("  widget name"+JSON.stringify(data_1))
						if(JSON.stringify(data_1)!=='[]')
							{			
							data[0].WidgetName=data_1[0].WidgetName;
							}
						else
							{
							data[0].WidgetName='';
							}
						res.jsend.success(data);
							})
						})
			}

				});
	}
	else // if only view type is present
	{// returns all widget ids corresponding to particular viewtype
		var query={ $and:
			[{"ViewType":req.body.ViewType},
				{"BU": {$ne : "DEFAULT"}},
				{"BE":{$ne:"DEFAULT"}}
				]
		};
		BeBuWidgetMapping.find(query,{'_id':0,'ViewType':1,'BU':1,'BE':1,'WidgetID':1}).then(function(data1)
				{
			//console.log(JSON.stringify(data))
			data=JSON.parse(JSON.stringify(data1))
			//console.log("parsed"+JSON.stringify(data)+"\n length"+data.length)
			var widgetId=[];
			for(var i=0;i<data.length;i++)
			{
				widgetId.push(data[i].WidgetID);				
			}
			//console.log("lists of id"+widgetId)
			UserWidgetDetails.find({"WidgetID":widgetId},{'_id':0,'WidgetName':1,'WidgetID':1}).then(function(data_1)
					{
					//console.log("names"+JSON.stringify(data_1))
					for(var i=0;i<data.length;i++)
						{
						for(var j=0;j<data_1.length;j++)
							{
							if(data[i].WidgetID==data_1[j].WidgetID)
								{
									data[i].WidgetName=data_1[j].WidgetName;
								}
							}
						if(data[i].WidgetName==undefined)
							data[i].WidgetName='';
						}
					res.jsend.success(data);
				})
					
			//res.jsend.success(data);

				});
	}


}
//service to save be/bu mapping
exports.addBeBuMapping=function (req,res)
{
	//console.log("request received in adding be bu mapping"+JSON.stringify(req.body))
	//update with the last search
	if(req.body.BE!=undefined)
		{
	BeBuWidgetMapping.findOneAndUpdate(
			{$and:[{ViewType:req.body.ViewType},{BE:req.body.BE}]},
			{WidgetID:req.body.WidgetID},
			{upsert: true, 'new': true},
			function(err, doc){
				if (err)
					return res.send(500, { error: err });
				return res.send("succesfully saved");
			});

		}
	else
		{
		BeBuWidgetMapping.findOneAndUpdate(
				{$and:[{ViewType:req.body.ViewType},{BU:req.body.BU}]},
				{WidgetID:req.body.WidgetID},
				{upsert: true, 'new': true},
				function(err, doc){
					if (err)
						return res.send(500, { error: err });
					return res.send("succesfully saved");
				});
		}
}

//service to delete be/bu mapping
exports.removeBeBuMapping=function (req,res)
{
	//console.log("request received in removing be bu mapping"+JSON.stringify(req.body))
	//update with the last search
	if(req.body.BU=='DEFAULT' || req.body.BE=='DEFAULT')
		{
		res.jsend.fail("DEFAULT entries cannot be deleted. Please change your selection")
		}
	else
		{
			if(req.body.BE!=undefined)
			{
					BeBuWidgetMapping.findOneAndRemove(
							{$and:[{ViewType:req.body.ViewType},{BE:req.body.BE},{WidgetID:req.body.WidgetID}]},
			function(err, doc){
				if (err)
					return res.send(500, { error: err });
				else
					{
					//console.log(doc);
					if(doc==null)
						return res.send("No such record exists")
				return res.send("succesfully removed");
					}
			});

			}
			else
			{
				BeBuWidgetMapping.findOneAndRemove(
						{$and:[{ViewType:req.body.ViewType},{BU:req.body.BU},{WidgetID:req.body.WidgetID}]},
		function(err, doc){
			if (err)
				return res.send(500, { error: err });
			return res.send("succesfully removed");
		});

		}
		}
}


/* save the quick facts on executive dashboard */
exports.saveEditNote=function(req,res)
{
	//{"editedBy":editedBy,"editNoteContent":editNoteContent,"filterObj":filterObj}
	//console.log("request receive"+JSON.stringify(req.body))
	var filters=["BE","BSE","BU","Segment","PF","PIN"]
	var filterObj={}
	for(var i=0;i<filters.length;i++)
	{
		filterObj[filters[i]]=null;
	}
	if(req.body.charParams.BE!=undefined)
	{
		filterObj["BE"]=req.body.charParams.BE;
	}
	if(req.body.charParams.BSE!=undefined)
	{
		filterObj["BSE"]=req.body.charParams.BSE
	}
	if(req.body.charParams.PF!=undefined)
	{
		filterObj["PF"]=req.body.charParams.PF
	}
	if(req.body.charParams.BU!=undefined)
	{
		filterObj["BU"]=req.body.charParams.BU
	}
	if(req.body.charParams.Segment!=undefined)
	{
		filterObj["Segment"]=req.body.charParams.Segment
	}
	if(req.body.charParams.PIN!=undefined)
	{
		filterObj["PIN"]=req.body.charParams.PIN
	}
	var jsonObj={},subObj={};
	subObj["editedBy"]=req.body.editedBy;
	subObj["editNoteContent"]=req.body.editNoteContent;
	subObj["editedOn"]=new Date();
	jsonObj["editHistory"]=subObj;
	jsonObj['_id'] = new ObjectId();
	jsonObj["filterOn"]=filterObj;
	jsonObj["flag"]=req.body.flag;
	var query={
			$and:
				[{"filterOn.BE":filterObj.BE},
					{"filterOn.BSE":filterObj.BSE},
					{"filterOn.BU":filterObj.BU},
					{"filterOn.PF":filterObj.PF},
					{"filterOn.Segment":filterObj.Segment},
					{"filterOn.PIN":filterObj.PIN},
					{"flag":req.body.flag}
					]
	};
	/*	if(req.body.flag=='ops')
		{
			var status={}
			status['SR']='Y';
			status['FD']='Y';
			status['OF']='Y';

		}
		jsonObj['status']=status*/
	KeyNoteDetails.find(query).then(function(data){
		if(JSON.stringify(data) != JSON.stringify([]))
		{

			//console.log("value already exists..updating")
			KeyNoteDetails.update(query,{$push:{"editHistory":jsonObj.editHistory}}).then(function (data) {
				if (data["ok"] == 1)
					res.jsend.success("Saved Successfully")
					else
						res.jsend.fail("Error occured")
			})
			;
		}

		else
		{
			//console.log("saving"+JSON.stringify(jsonObj))
			var data = new KeyNoteDetails(jsonObj);
			data.save()
			.then(function (savedDoc) {
				res.jsend.success("Saved Successfully")
			})
		}


	});
	/*var data = new KeyNoteDetails(jsonObj);
	data.save()
	.then(function (savedDoc) {
		res.jsend.success("Key Note Saved Successfully")
	})*/
	/*AppBuList.updateOne({"BU":jsonObj.BU},{$push:{"EditNote":jsonObj.editNote}})
	.then(function(data){
		return data;
	})
	.then (res.jsend.success, res.jsend.error);*/
};
//get the checked status
exports.getHardwareInProcessStatus=function(req,res)
{
//	console.log("get status called")
	var filters=["BE","BSE","BU","Segment","PF","PIN"]
	var filterObj={}
	for(var i=0;i<filters.length;i++)
	{
		filterObj[filters[i]]=null;
	}
	if(req.body.charParams.BE!=undefined)
	{
		filterObj["BE"]=req.body.charParams.BE;
	}
	if(req.body.charParams.BSE!=undefined)
	{
		filterObj["BSE"]=req.body.charParams.BSE
	}
	if(req.body.charParams.PF!=undefined)
	{
		filterObj["PF"]=req.body.charParams.PF
	}
	if(req.body.charParams.BU!=undefined)
	{
		filterObj["BU"]=req.body.charParams.BU
	}
	if(req.body.charParams.Segment!=undefined)
	{
		filterObj["Segment"]=req.body.charParams.Segment
	}
	if(req.body.charParams.PIN!=undefined)
	{
		filterObj["PIN"]=req.body.charParams.PIN
	}
	//console.log("fliterobj is"+JSON.stringify(filterObj))
	var query={
			$and:
				[{"filterOn.BE":filterObj.BE},
					{"filterOn.BSE":filterObj.BSE},
					{"filterOn.BU":filterObj.BU},
					{"filterOn.PF":filterObj.PF},
					{"filterOn.Segment":filterObj.Segment},
					{"filterOn.PIN":filterObj.PIN},
					{"flag":"ops"}
					]
	};
	KeyNoteDetails.find(query).then(function(data){

		if(JSON.stringify(data) != JSON.stringify([]))
		{
			//console.log("data retrieved is"+JSON.stringify(data[0].checked)+"--"+(data[0].checked!=undefined))
			if(data[0].checked!=undefined)
			{
				//console.log("value already exists..sending"+JSON.stringify(data[0].checked))
				res.jsend.success( data[0].checked);
			}
			else
			{
				var checked={}
				checked["SR"]="Y";
				checked["FD"]="Y";
				checked["OF"]="Y";
				//console.log("filter exists but checked not saved")
				KeyNoteDetails.update(query,{$set:{"checked":checked}}).then(function (data) {
					if (data["ok"] == 1) return "Updated";
					else return "Not updated"
				});
				res.jsend.success(checked);
			}


		}
		else
		{
			//console.log("no data found")
			var checked={}
			checked["SR"]="Y";
			checked["FD"]="Y";
			checked["OF"]="Y";



			var document ={}
			document['_id'] = new ObjectId();

			document['filterOn']=filterObj;
			document['flag']="ops";
			document["checked"]=checked;

			//	console.log("saving"+JSON.stringify(document))
			var data = new KeyNoteDetails(document);
			data.save()
			.then(function (savedDoc) {
				res.jsend.success(checked);

			})


		}
	});

}
/*save the Hardware-in process status */
exports.saveHardwareInProcessStatus=function(req,res)
{
	/*	jsonObj.editedOn=new Date();
	jsonObj['_id'] = new ObjectId()
	var data = new KeyNoteDetails(jsonObj);
	data.save()
	.then(function (savedDoc) {
		res.jsend.success("Key Note Saved Successfully")
	})*/
	/*	db.test.findAndModify({
	    query: {},
	    sort: {$natural: -1},
	    update: {$set: {foo: 'bar'}}
	})*/
	/*	var query = {'username':req.user.username};
	req.newData.username = req.user.username;
	MyModel.findOneAndUpdate(query, req.newData, {upsert:true}, function(err, doc){
	    if (err) return res.send(500, { error: err });
	    return res.send("succesfully saved");
	});*/
	//console.log("save status called"+JSON.stringify(req.body))
	var filters=["BE","BSE","BU","Segment","PF","PIN"]
	var filterObj={}
	for(var i=0;i<filters.length;i++)
	{
		filterObj[filters[i]]=null;
	}
	if(req.body.charParams.BE!=undefined)
	{
		filterObj["BE"]=req.body.charParams.BE;
	}
	if(req.body.charParams.BSE!=undefined)
	{
		filterObj["BSE"]=req.body.charParams.BSE
	}
	if(req.body.charParams.PF!=undefined)
	{
		filterObj["PF"]=req.body.charParams.PF
	}
	if(req.body.charParams.BU!=undefined)
	{
		filterObj["BU"]=req.body.charParams.BU
	}
	if(req.body.charParams.Segment!=undefined)
	{
		filterObj["Segment"]=req.body.charParams.Segment
	}
	if(req.body.charParams.PIN!=undefined)
	{
		filterObj["PIN"]=req.body.charParams.PIN
	}
	//console.log("fliterobj is"+JSON.stringify(filterObj))
	var query={
			$and:
				[{"filterOn.BE":filterObj.BE},
					{"filterOn.BSE":filterObj.BSE},
					{"filterOn.BU":filterObj.BU},
					{"filterOn.PF":filterObj.PF},
					{"filterOn.Segment":filterObj.Segment},
					{"filterOn.PIN":filterObj.PIN},
					{"flag":"ops"}
					]
	};
	KeyNoteDetails.find(query).then(function(data){
		if(JSON.stringify(data) != JSON.stringify([]))
		{

			//console.log("value already exists..updating")
			KeyNoteDetails.update(query,{$set:{"checked":req.body.checked}}).then(function (data) {
				if (data["ok"] == 1) return "Updated";
				else return "Not updated"
			})
			.then(res.jsend.success, res.jsend.error);
		}

		else
		{
			var document ={}
			document['_id'] = new ObjectId();

			document['filterOn']=filterObj;
			document['flag']="ops";
			document["checked"]=req.body.checked;

			//console.log("saving"+JSON.stringify(document))
			var data = new KeyNoteDetails(document);
			data.save()
			.then(function (savedDoc) {
				res.jsend.success("Saved Successfully")
			})
		}
	});
};

/*	KeyNoteDetails.findOneAndUpdate(query,{"checked":req.body.checked}, {upsert: true, 'new': true}, function(err, doc){
	    if (err)
	    	return res.send(500, { error: err });
	    return res.send("succesfully saved");
	});
 */

/* retrieve the quick facts for executive dashboard */
exports.getEditNote=function(req,res)
{
	//console.log(JSON.stringify(req.body))
	var filterObj={};
	var filters=["BE","BSE","BU","Segment","PF","PIN"]
	for(var i=0;i<filters.length;i++)
	{
		filterObj[filters[i]]=null;
	}
	if(req.body.charParams.BE!=undefined)
	{
		filterObj["BE"]=req.body.charParams.BE;
	}
	if(req.body.charParams.BSE!=undefined)
	{
		filterObj["BSE"]=req.body.charParams.BSE
	}
	if(req.body.charParams.PF!=undefined)
	{
		filterObj["PF"]=req.body.charParams.PF
	}
	if(req.body.charParams.BU!=undefined)
	{
		filterObj["BU"]=req.body.charParams.BU
	}
	if(req.body.charParams.Segment!=undefined)
	{
		filterObj["Segment"]=req.body.charParams.Segment
	}
	if(req.body.charParams.PIN!=undefined)
	{
		filterObj["PIN"]=req.body.charParams.PIN
	}
	filterObj["flag"]=req.body.flag;
	//console.log(JSON.stringify(req.body)+"--")
	//console.log(JSON.stringify(filterObj))
	KeyNoteDetails.find({
		$and:
			[{"filterOn.BE":filterObj.BE},
				{"filterOn.BSE":filterObj.BSE},
				{"filterOn.BU":filterObj.BU},
				{"filterOn.PF":filterObj.PF},
				{"filterOn.Segment":filterObj.Segment},
				{"filterOn.PIN":filterObj.PIN},
				{"flag":filterObj.flag}
				]
	}).then(function(data){
		if(JSON.stringify(data) != JSON.stringify([]))
		{
			//if data for this filter exists
			var o=data[0].toObject();
			if(o.editHistory.length==0)
			{
				var dummy={}
				dummy["editNoteContent"]="";
				res.jsend.success(dummy);
			}
			else
			{
				var o=data[0].toObject();
				o.editHistory.sort(function (m1,m2){ return m2.editedOn - m1.editedOn;});
//				console.log("sorted data is"+JSON.stringify(o.editHistory[0]))
				data1=o.editHistory[0];
				res.jsend.success(data1);
			}
		}


	else
	{
		var dummy={}
		dummy["editNoteContent"]="";
		res.jsend.success(dummy);
	}
})

};


/* to save last searched query for user */
exports.saveUserSearch=function (req,res)
{
	//console.log("request received"+JSON.stringify(req.body))
				//update with the last search
				UserDetails.findOneAndUpdate(
						{$and:[{UserId:req.body.userId},{PageFlag:req.body.pageFlag}]},
						{SearchQuery:req.body.searchQuery},
						{upsert: true, 'new': true},
						function(err, doc){
								if (err)
									return res.send(500, { error: err });
								return res.send("succesfully saved");
				});
			
	
}
 
//return the release scorecard details
exports.getReleaseScoreCardDetails=function(req,res)
{
	//console.log("in service. received"+ JSON.stringify(req.body))
	ReleaseScorecardDetails.find({"bube":req.body.bube}).then(function(data){
		//console.log("response received"+JSON.stringify(data))
		if(JSON.stringify(data) == JSON.stringify([]))
			{
			//console.log("sedning default one")
				ReleaseScorecardDetails.find({"bube":"ENB"}).then(function(data1){
					data=JSON.parse(JSON.stringify(data1));
					//console.log("now data is"+JSON.stringify(data))
					//console.log("here"+data[0].bube);
					data[0]["bube"]=req.body.bube;
					res.jsend.success(data)
				})
			}
		else
			res.jsend.success(data)
		
	})
	};
	


	//save the scorecard details
	exports.saveScoreCardDetails= function(req,res)
	{
		//console.log("in service. received"+ JSON.stringify(req.body))	
		var metricDetails=[]
		/*scorecardDetails:[{metricType: "Defects", metricDescription: "Release Gating (S1, SS, TS)", metricName: "RG", order: 1, fcsGoal: "0 (CCO)"}, 
			{metricType: "Defects", metricDescription: "URC(S123 Simplification)", metricName: "URC", order: 1, fcsGoal: "0 (TP/VTP) [Cut off: TP-3wks]", …}]
*/
		//let types = new Set();
		Array.prototype.groupBy1 = function(prop) {
			  return this.reduce(function(groups, item) {
			    var val = item[prop];
			    groups[val] = groups[val] || [];
			    groups[val].push(item);
			    return groups;
			  }, {});
			}
		
		var byType = req.body.scorecardDetails.groupBy1('metricType');
		//console.log("\n grouped by type"+JSON.stringify(byType))
		var temp={}
		for(var type in byType )
			{
			//console.log("\n reading"+type)
			temp={};
		    temp["metricType"]=type;
		    temp["metricTypeDetails"]=[]
		    var temp1={};
		    var unsorted=byType[type];
		   var sorted = _.sortBy(unsorted,'order');
			for (var j=0;j<sorted.length;j++)
				{
					temp1={}
					//console.log("adding from"+JSON.stringify(sorted[j]))
					temp1["metricName"]=sorted[j].metricName;
			        temp1["metricDisplayName"]=sorted[j].metricDescription;
			        temp1["interimGoal"]=""
			        temp1["FCSGoal"]=sorted[j].fcsGoal;
			        temp1["order"]=sorted[j].order;
			        //console.log("\n \n appending to metricTypeDetails"+JSON.stringify(temp1))
			        temp["metricTypeDetails"].push(temp1);		        
				}
			//console.log("\n \n appending to metric details"+JSON.stringify(temp))
			metricDetails.push(temp)
			}		
		ReleaseScorecardDetails.findOneAndUpdate(
				{bube:req.body.buBe},
				{metricDetails:metricDetails},
				{upsert: true, 'new': true},
				function(err, doc){
						if (err)
							return res.send(500, { error: err });
						return res.send("succesfully saved");
		});
	}
	

exports.getUserSearch=function(req,res)
{
	//fetch the last saved search
	//console.log("request received"+JSON.stringify(req.body))
	var query={
			$and:[
				{UserId:req.body.userId},
				{PageFlag:req.body.pageFlag}
				]
	};
	
	UserDetails.find(query).then(function(data)
			{
				//console.log(JSON.stringify(data))
				res.jsend.success(data);
				
			});
}

/* to create a spark room */
exports.createSparkRoom=function(req,res)
{
	//new code starts
	var title="";
	//console.log("filter obj is"+req.body.filterObj["Segment"])
	if(req.body.filterObj["BSE"]!=undefined)
		 title='CQI_ROOM_'+req.body.filterObj["BSE"];
	else if(req.body.filterObj["BE"]!=undefined)
		 title='CQI_ROOM_'+req.body.filterObj["BE"];
	else if(req.body.filterObj["Segment"]!=undefined)
		 title='CQI_ROOM_'+req.body.filterObj["Segment"];
	else if(req.body.filterObj["BU"]!=undefined)
		 title='CQI_ROOM_'+req.body.filterObj["BU"];
	//var title=req.body.filterObj;
	//console.log(title)
	SparkRoomDetails.find({Title:title}).then(function(data)
			{
		//if room exists already simple add the member
		if(JSON.stringify(data) != JSON.stringify([]))
		{
			//console.log("room exists")
			var addNewMember=
			{
					method: 'POST',
					url: 'https://api.ciscospark.com/v1/memberships',
					async : true,
					headers: {'Content-Type': 'application/json','Authorization':'Bearer ODg4OTFhYWUtNTExYi00ZmMzLTlkNjgtMDJiOTdiZjMxMjJkNjA2MTg1YmMtMTc5'},
					json: true,
					body : {
						"roomId" :data[0].RoomId,
						"personEmail" : req.body.UserId,
						"isModerator" : false
					},
			}
			rp(addNewMember).then (function(result){
				//console.log("room exists..added member")
				res.jsend.success("MemberAdded");
			}).catch(function(err){

				console.log(err.message)
				if(err.message.indexOf("is already in the room.")>0)
				{
					//console.log("room exists and member already present")
					res.jsend.success("AlreadyPresent")
				}
				else
					res.jsend.fail(err)
			});
			//added the member to already existing room
		}//if ends
		//room does not exist
		else
		{
			//service to create a new room
			//console.log("room doesnt not exists")
			var createNewSparkRoom=
			{
					method: 'POST',
					url: 'https://api.ciscospark.com/v1/rooms',
					async : true,
					headers: {'Content-Type': 'application/json','Authorization':'Bearer ODg4OTFhYWUtNTExYi00ZmMzLTlkNjgtMDJiOTdiZjMxMjJkNjA2MTg1YmMtMTc5'},
					json: true,
					body : {'title':title},
			};
			rp(createNewSparkRoom).then (function(result){
				if(result.status == "fail" || result.status == "error")
					res.jsend.fail(result.data);
				else
				{
					//store room details in database;
					var document={
							RoomId: result.id,
							BE:req.body.BEName,
							Title : result.title,
							Type : result.type,
							IsLocked: result.isLocked,
							LastActivity : result.lastActivity,
							CreatorId : result.creatorId,
							Created:result.created
					}
					document['_id'] = new ObjectId()
					var data = new SparkRoomDetails(document);
					data.save()
					.then(function (savedDoc) {
						var addNewMember=
						{
								method: 'POST',
								url: 'https://api.ciscospark.com/v1/memberships',
								async : true,
								headers: {'Content-Type': 'application/json','Authorization':'Bearer ODg4OTFhYWUtNTExYi00ZmMzLTlkNjgtMDJiOTdiZjMxMjJkNjA2MTg1YmMtMTc5'},
								json: true,
								body : {
									"roomId" :result.id,
									"personEmail" : req.body.UserId,
									"isModerator" : true
								},
						}
						rp(addNewMember).then (function(result){
							res.jsend.success ("RoomCreatedMemberAdded");
						}).catch(function(err){

							console.log(err.message)
							if(err.message.indexOf("is already in the room.")>0)
							{
								res.jsend.success("AlreadyPresent")
							}


						});
					}).catch(function(err){
						console.log(err.message)

					})

//					SparkRoomDetails.insert(document,function(err, records){
//					if(!err)
//					{
//					console.log("room inserted!")
//					var addNewMember=
//					{
//					method: 'POST',
//					url: 'https://api.ciscospark.com/v1/memberships',
//					async : true,
//					headers: {'Content-Type': 'application/json','Authorization':'Bearer ODg4OTFhYWUtNTExYi00ZmMzLTlkNjgtMDJiOTdiZjMxMjJkNjA2MTg1YmMtMTc5'},
//					json: true,
//					body : {
//					"roomId" :result.id,
//					"personEmail" : req.body.UserId,
//					"isModerator" : true
//					},
//					}
//					rp(addNewMember).then (function(result){
//					res.jsend.success ("RoomCreatedMemberAdded");
//					}).catch(function(err){

//					console.log(err.message)
//					if(err.message.indexOf("is already in the room.")>0)
//					{
//					res.jsend.success("AlreadyPresent")
//					}


//					});
//					}
//					else
//					{
//					console.log(err)
//					}
//					})//room details insert query ends


				}

			}).catch(function(err){
				console.log("unable to create room"+err.message);
			});
			//adding member to the room
			//return result;
		}	//else ends
			});
}
