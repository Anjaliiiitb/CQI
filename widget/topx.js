var util = require('../util');
var Func = require('./reuse_functions');
var WeekEndDates = require('../../../models/widget/week_end_dates');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var AppView = require('../../../models/widget/app_view');
var AppQuery = require('../../../models/widget/app_query');
var _ = require('underscore');

/* TopComponents - To get top X Components for a QueryID/ViewID
 *  */
exports.TopComponents = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics', 'ViewType', 'X', 'ViewID', 'TopMetric']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var query_id = req.body.QueryID; var primary = req.body.Primary; var view_id = req.body.ViewID; var top_metric = req.body.TopMetric;
	var allMetricsRaw = req.body.Metrics; var view_type = req.body.ViewType; var X = req.body.X;
	var query_ids = []; var allMetrics = []; var sumMetrics = []; var avgMetrics = [];
	var config = {}; var avgConfig = {};
	var tasks = []; var dataArr = [];
	if (query_id != undefined && primary == undefined) { res.jsend.fail({ "Primary": "missing field" }); return; }
	if (query_id == undefined) { tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type)) }
	else { tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type)) }
	Promise.all(tasks)
	.then(function (details) {
		if (query_id == undefined) {
			query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
			config = details[0][4]; avgConfig = details[0][5];
		}
		else {
			query_ids = [query_id]; allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
			config = details[0][3]; avgConfig = details[0][4];
		}
		WeekEndDates.find({}, { _id: 0 })
		.then(function (weeks) {
			var latestDate = weeks[0].WeekEndDates[0];
			FactDefectAgg.aggregate([
				{ $match: { $and: [{ "QueryID": { $in: query_ids } }, { "WeekEndDate": new Date(latestDate.toISOString()) }] } },
				{ $unwind: "$MetricAttrib" },
				{ $match: { "MetricAttrib.Name": { $in: allMetrics } } },
				{ $group: { _id: { "Component": "$Component", "MetricName": "$MetricAttrib.Name" }, MetricValue: { $sum: "$MetricAttrib.Value" } } },
				{ $group: { _id: "$_id.Component", "ComponentData": { $addToSet: { "MetricName": "$_id.MetricName", "MetricValue": "$MetricValue" } } } },
				{ $project: { Name: "$_id", _id: 0, ComponentData: 1 } }
			])
			.then(function (docs) {
				docs.forEach(function (doc) {
					var dataJson2 = {}
					doc["ComponentData"].forEach(function (data) {
						dataJson2[data["MetricName"]] = data["MetricValue"]
					})
					var dataJson = {}
					dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config)
					if (Object.keys(dataJson).indexOf(top_metric) != -1) {
						dataJson["Name"] = doc["Name"]
						dataArr.push(dataJson)
					}
				})
				if (dataArr.length == 0) { return []; }
				var sorted_data = dataArr.sort(function (a, b) {
					return b[top_metric] - a[top_metric];
				});
				return sorted_data.slice(0, X);
			})
			.then(res.jsend.success, res.jsend.error);
		})
	})
};

/* TopManagers - To get top X DE-managers for a QueryID/ViewID
 *  */
exports.TopManagers = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics', 'ViewType', 'X', 'ViewID', 'TopMetric']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var query_id = req.body.QueryID; var primary = req.body.Primary; var view_id = req.body.ViewID; var top_metric = req.body.TopMetric;
	var allMetricsRaw = req.body.Metrics; var view_type = req.body.ViewType; var X = req.body.X;
	var query_ids = []; var allMetrics = []; var sumMetrics = []; var avgMetrics = [];
	var config = {}; var avgConfig = {};
	var tasks = []; var dataArr = [];
	if (query_id != undefined && primary == undefined) { res.jsend.fail({ "Primary": "missing field" }); return; }
	if (query_id == undefined) { tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type)) }
	else { tasks.push(Func.queryIdMetrics_new(allMetricsRaw, view_id, query_id, primary, view_type)) }
	Promise.all(tasks)
	.then(function (details) {
		if (query_id == undefined) {
			query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
			config = details[0][4]; avgConfig = details[0][5];
		}
		else {
			query_ids = [query_id]; allMetrics = details[0][0]; sumMetrics = details[0][1]; avgMetrics = details[0][2];
			config = details[0][3]; avgConfig = details[0][4];
		}
		WeekEndDates.find({}, { _id: 0 })
		.then(function (weeks) {
			var latestDate = weeks[0].WeekEndDates[0];
			FactDefectAgg.aggregate([
				{ $match: { $and: [{ "QueryID": { $in: query_ids } }, { "WeekEndDate": new Date(latestDate.toISOString()) }] } },
				{ $unwind: "$MetricAttrib" },
				{ $match: { "MetricAttrib.Name": { $in: allMetrics } } },
				{ $group: { _id: { "DEManagerUserID": "$DEManagerUserID", "MetricName": "$MetricAttrib.Name" }, MetricValue: { $sum: "$MetricAttrib.Value" } } },
				{ $group: { _id: "$_id.DEManagerUserID", "ManagerData": { $addToSet: { "MetricName": "$_id.MetricName", "MetricValue": "$MetricValue" } } } },
				{ $project: { Name: "$_id", _id: 0, ManagerData: 1 } }
			])
			.then(function (docs) {
				docs.forEach(function (doc) {
					var dataJson2 = {}
					doc["ManagerData"].forEach(function (data) {
						dataJson2[data["MetricName"]] = data["MetricValue"]
					})
					var dataJson = {}
					dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config)
					if (Object.keys(dataJson).indexOf(top_metric) != -1) {
						dataJson["Name"] = doc["Name"]
						dataArr.push(dataJson)
					}
				})
				if (dataArr.length == 0) { return []; }
				var sorted_data = dataArr.sort(function (a, b) {
					return b[top_metric] - a[top_metric];
				});
				return sorted_data.slice(0, X);
			})
			.then(res.jsend.success, res.jsend.error);
		})
	})
};


/* GlanceDataAll - Data on the basis of multiple view id and viewtype 
 *  */
exports.GlanceDataAll = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewIDS', 'ViewType']);
	if (errors) {
		res.jsend.fail(errors);
		return;
	}
	var view_ids = _.uniq(req.body.ViewIDS); var view_type = req.body.ViewType; var allMetricsRaw = [];
	if (view_type == "OQ") {
		allMetricsRaw = ["IFD Backlog [Current Week]", "CFD Backlog [Current Week]", "S1/TS Backlog [Current Week]",
			"IFD MTTR [13 Weeks Outstanding]", "CFD MTTR [13 Weeks Outstanding]", "S1/TS MTTR [13 Weeks Outstanding]"]
	}
	else if (view_type == "Release") {
		allMetricsRaw = ["RG", "CFD", "URC", "RG MTTR - Average Outstanding", "CFD MTTR - Average Outstanding", "URC MTTR"];
	}
	var view_js = {}; var arr = [];
	AppView.find({ "ViewID": { $in: view_ids } }, { "ViewName": 1, "ViewID": 1, _id: 0 })
	.then(function (views) {
		views.forEach(function (view) { view_js[view["ViewID"]] = view["ViewName"] })
		if (Object.keys(view_js).length != view_ids.length) {
			view_ids=[];
			Object.keys(view_js).forEach(function(view_id2){view_ids.push(Number(view_id2))})
		}
		view_ids.forEach(function (view_id, index) {
			var query_id = ""; var allMetrics = []; var sumMetrics = []; var avgMetrics = [];
            var config = {}; var avgConfig = {};
			var view_name = view_js[view_id];
			var tasks = [];
			tasks.push(Func.viewIdMetrics_prim(allMetricsRaw, view_id, view_type))
			Promise.all(tasks)
			.then(function (details) {
				query_id = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
				config = details[0][4]; avgConfig = details[0][5];
				WeekEndDates.find({}, { _id: 0 })
				.then(function (weeks2) {
					var listOfDates = weeks2[0].WeekEndDates.slice(0, 2);
					FactDefectAgg.aggregate([
						{ $match: { $and: [{ "QueryID": query_id }, { "WeekEndDate": { '$in': listOfDates } }] } },
						{ $unwind: "$MetricAttrib" },
						{ $match: { "MetricAttrib.Name": { $in: allMetrics } } },
						{ $group: { _id: { "WeekEndDate": "$WeekEndDate", "MetricName": "$MetricAttrib.Name" }, MetricValue: { $sum: "$MetricAttrib.Value" } } },
						{ $group: { _id: "$_id.WeekEndDate", data: { $addToSet: { MetricName: "$_id.MetricName", MetricValue: "$MetricValue" } } } },
					])
					.then(function (docs) {
						var dataJson = {}
						if (docs.length == 0) { dataJson["Curr"] = {}; }
						docs.forEach(function (data) {
							var compJson2 = {}
							data.data.forEach(function (doc) { compJson2[doc.MetricName] = doc.MetricValue; })
							var compJson = {}
							compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
							if (data["_id"].getTime() == listOfDates[0].getTime()) { dataJson["Curr"] = compJson }
							else if (data["_id"].getTime() == listOfDates[1].getTime()) { dataJson["Prev"] = compJson }
						});
						for (var key in dataJson["Curr"]) {
							dataJson["Curr"][key + "_trend"] = (dataJson["Prev"] == undefined) ? "Down" : (dataJson["Prev"][key] == undefined) ? "Up" : (dataJson["Curr"][key] > dataJson["Prev"][key]) ? "Up" : "Down";
						}
						if (dataJson["Curr"] == undefined) { dataJson["Curr"] = {} }
						dataJson["Curr"]["ViewName"] = view_name; dataJson["Curr"]["ViewID"] = view_id;
						AppQuery.findOne({ "QueryID": query_id }, { "QueryDefinition": 1, "QueryID": 1, "QueryName":1, _id: 0 })
						.then(function (doc) {
							dataJson["Curr"]["QueryDefinition"] = doc["QueryDefinition"];
							dataJson["Curr"]["QueryName"] = doc["QueryName"];
							return dataJson["Curr"]
							})
							.then(function (data) {
								arr.push(data)
								if (arr.length == view_ids.length) {
									var resultArray = [];
									view_ids.forEach(function (id, index) {
										var temp = arr.filter(function (item) { return item.ViewID == id })[0];
										resultArray.push(temp);
									})
									res.jsend.success(resultArray);
								}
							})
						})
					})
				})
			})
	})
};