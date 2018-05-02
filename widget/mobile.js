var AppView = require('../../../models/widget/app_view');
var QueryData = require('./querydata');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var util = require('../util');
var Func=require('./reuse_functions');

//Service to return all release scorecard metrics
exports.getReleaseScoreCard = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var view_id=req.body.ViewID; var primary = 'Y'; var view_type = 'Release';
	AppView.find({$and:[{"ViewID":view_id},{"ActiveFlag":"Y"}]},{"ViewID":1,"ViewName":1,"_id":0})
	.then(function(docs){
		if(docs.length == 0) {res.jsend.fail("View Invalid or Inactive");return;}			
		var allMetricsRaw = ["CFD Backlog","RG Backlog","S123 Backlog", "URC[S123 Simplification] Backlog",
		                    "Defects[S1-5]","Feature[S6]",
		                    "PSIRT - Critical","PSIRT - High","PSIRT - Medium",
		                    "Total Dev Escape [%]","% RETI Adoption","Total Test Escape [TTE %]",
		                    "S1 MTTR - Average Outstanding","CFD MTTR - Average Outstanding","SS MTTR - Average Outstanding","TS MTTR - Average Outstanding","URC[S123 Simplification] MTTR - Average Outstanding",
		                    "S123 TEACAT Backlog",
		                    "S12 Autons Backlog","S3 Autons Backlog"
			                ];		
		var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
		var config={}; var avgConfig={};
		var QueryIDS=[]; var main_queryid=""; var main_query="";
	    var QueryData={}; var dataArr=[]; 
		var tasks=[];
		tasks.push(Func.viewIdMetrics(allMetricsRaw, view_id, primary, view_type))
		Promise.all(tasks)
		.then(function(details){
			if(details[0].length == 0){res.jsend.success([]); return;}
			QueryData = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
			config = details[0][4]; avgConfig = details[0][5];
			WeekEndDates.find({},{_id:0})
			.then(function(weeks){
				var latestDate = weeks[0].WeekEndDates[0];
				if(primary == "Y"){
					QueryIDS=QueryData;
					FactDefectAgg.aggregate([
	                 	{$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":new Date(latestDate.toISOString())}]}},
	                 	{$unwind:"$MetricAttrib"},
	                 	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	                 	{$group:{_id:"$MetricAttrib.Name",MetricValue:{$sum:"$MetricAttrib.Value"}}},
	                   	{$group:{_id:null, data:{$addToSet:{MetricName:"$_id", MetricValue:"$MetricValue"}}}},
	                   	{$project:{data:1,_id:0}},
	                ])
	   				.then(function(docs3){
	   					docs3.forEach(function(doc){
		   					var dataJson={};
		   					doc.data.forEach(function(d){
		   						dataJson[d.MetricName]=d.MetricValue;
		   					})
		   					var final_json={}
		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
		   					final_json["ViewName"]=QueryIDS[QueryIDS.length-1];
		   					dataArr.push(final_json)
	   					})
	   					return getFinalDataForScoreCard(dataArr);
	   				})
	   			.then(res.jsend.success, res.jsend.error)
	   			}
			})
		})
	}); 
}

var getFinalDataForScoreCard = function(res) {
	var result, seq, final_metric_data = {}, final_response = {}, metric_label_mapping;
	metric_label_mapping = {"Defects":[{"CFD Backlog" : "CFD Backlog"},{"RG Backlog" : "Release Gating (S1, SS, TS)"},{"S123 Backlog":"S123 Backlog"},{ "URC[S123 Simplification] Backlog":"URC(S123 Simplification)"}],
		"Parity":[{"Defects[S1-5]":"Defects(S1-5)"},{"Feature[S6]":"Feature(S6)"}],
		"Security":[{"PSIRT - Critical":"Critical"},{"PSIRT - High":"High"},{"PSIRT - Medium":"Medium"}],
		"Escapes":[{"Total Dev Escape [%]":"%Dev Escape"},{"% RETI Adoption":"%RETI Adoption"},{"Total Test Escape [TTE %]":"%Test Escape"}],
		"Late Code Churn(MTTR)":[{"CFD MTTR - Average Outstanding":"CFD"},{"S1 MTTR - Average Outstanding":"S1" },{"SS MTTR - Average Outstanding":"SS"},{"TS MTTR - Average Outstanding":"TS"},{"URC[S123 Simplification] MTTR - Average Outstanding":"URC(S123 Simplification)"}],
		"Teacat":[{"S123 TEACAT Backlog":"Teacat"}],
		"Autons":[{"S12 Autons Backlog":"S12 Autons"},{"S3 Autons Backlog":"S3 Autons"}]
		};
	seq = ["Defects", "Parity", "Security",  "Escapes","Late Code Churn(MTTR)", "Teacat", "Autons"];
	seq.forEach(function(data){
		var metrics_list = metric_label_mapping[data], metrics_list_obj = [];;
		metrics_list.forEach(function(metric) {
			var obj = {}, key;
			key = Object.keys(metric)[0];
			if(res[0][key] != undefined)
				obj[metric[key]] = res[0][key];
			else
				obj[metric[key]] = 0;
			metrics_list_obj.push(obj);
			
		});
		final_metric_data[data] = metrics_list_obj;
	});
	final_response.MetricData = final_metric_data;
	final_response.Sequence = seq;
	return final_response;
}
