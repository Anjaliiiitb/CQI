var winston = require('winston');
var util = require('../util');
var _ =require('underscore');
var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var DimCompHier = require('../../../models/widget/dim_comp_hier');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var Func=require('./reuse_functions');
var FlagMetrics=require('../../data/widget/flag_metrics');

/* ProdCompListSearch - List of all Products or Components
 * */
exports.ProdCompListSearch = function (req, res) {
	var products=req.body.Products;
	var components=req.body.Components;
	if(products != undefined){
		var Products_re=[];
		products.forEach(function(Product){
			Products_re.push(new RegExp(Product, "i"))
		});
		DimCompHier.aggregate([
            {$match:{"ProductName":{$in:Products_re}}},
            {$group:{_id:"$ProductName"}},
            {$group:{_id:null, ProductList:{$addToSet:"$_id"}}},
        ])
        .then(function(docs){
        	if(docs.length==0){return [];}
        	return docs[0].ProductList;
        })
        .then(res.jsend.success, res.jsend.error)
	}
	else if(components != undefined){
		var Components_re=[];
		components.forEach(function(Component){
			Components_re.push(new RegExp(Component, "i"))
		});
		DimCompHier.aggregate([
            {$match:{"ComponentName":{$in:Components_re}}},
            {$group:{_id:"$ComponentName"}},
            {$group:{_id:null, ComponentList:{$addToSet:"$_id"}}},
        ])
        .then(function(docs){
        	if(docs.length==0){return [];}
        	return docs[0].ComponentList;
        })
        .then(res.jsend.success, res.jsend.error)
	}
};

/* queryIdProductData - Product data for QueryID
 * */

exports.queryIdProductData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','Primary','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var trend=req.body.Trend; var week_date=req.body.WeekDate;

	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataJson={}; var dataArr=[];

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
					{$group:{_id:{"Product":"$Product","MetricName":"$MetricAttrib.Name"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
				    {$group:{_id:"$_id.Product","MetricData":{$addToSet :  {"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
				    {$project : {"Product" : "$_id","MetricData":1, "_id":0}}
				 ])
				.then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.MetricData.forEach(function(doc){compJson2[doc.MetricName]=doc.MetricValue;})
						var compJson={};
						compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						if(Object.keys(compJson).length > 0){
							compJson["Name"]=data["Product"];
							dataArr.push(compJson);
						}
					});
					dataJson["QueryID"]=query_id; dataJson["ProductData"]=dataArr;
					return dataJson;
				})
				.then(res.jsend.success, res.jsend.error);
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				 FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{$in:listOfDates}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{"Product":"$Product","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:{"Product":"$_id.Product","WeekEndDate":"$_id.WeekEndDate"},"data":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
					{$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"Product":"$_id.Product","data":"$data"}}}}
				])
				.then(function(docs){
	      			var dataJson2={}
					docs.forEach(function(doc){
						var final_arr=[]
						doc.dataA.forEach(function(d){
							var dataJson={};
							d.data.forEach(function(d1){
								dataJson[d1.MetricName]=d1.MetricValue;
							})
							var fi_json={}
							fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
							if(Object.keys(fi_json).length != 0){
								fi_json["Name"]=d.Product
								final_arr.push(fi_json)
							}
						})
						if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
						else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
					})
	      			var final_data=[]
		    		dataJson2["Curr"].forEach(function(js_data){
						var product=js_data.Name;
						var elem=Object.keys(js_data);
						elem.splice(elem.indexOf("Name"),1)
						elem.forEach(function(ele){
							js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
							if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
							else{
								dataJson2["Prev"].forEach(function(js_data_p){
									if(js_data_p["Name"] == product){										
										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
									}
								})
							}
							if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
						})
						final_data.push(js_data)
		    		})
					dataJson["QueryID"]=query_id;
	      			dataJson["ProductData"]=final_data
					return dataJson;
				})
				.then(res.jsend.success, res.jsend.error);
			}
		});
	})
};

/* queryIdComponentProductData - Component data for a Product for a QueryID
 * */

exports.queryIdComponentProductData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','Product','ViewID','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var product=req.body.Product;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataJson={}; var dataArr=[];

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
				       {$unwind:"$MetricAttrib"},
				       {$match:{$and:[{"QueryID":query_id},{"WeekEndDate":new Date(latestDate.toISOString())},
		                     {"Product":product},{"MetricAttrib.Name":{$in:allMetrics}}]}},
				       {$group:{_id :{"Component":"$Component","MetricName":"$MetricAttrib.Name"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
				       {$group:{_id:"$_id.Component","MetricData":{$addToSet :  {"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
				       {$project : {"Component" : "$_id","MetricData":1, "_id":0}},
				])
		       .then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.MetricData.forEach(function(doc){compJson2[doc.MetricName]=doc.MetricValue;})
						var compJson={};
						compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						compJson["Name"]=data["Component"];
						dataArr.push(compJson);
					});
					dataJson["QueryID"]=query_id; dataJson["Product"]=product;
					dataJson["ComponentData"]=dataArr;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":query_id},{"WeekEndDate":{$in:listOfDates}},{"Product":product}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id :{"Component":"$Component","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:{"Component":"$_id.Component","WeekEndDate":"$_id.WeekEndDate"},"data":{$addToSet :{"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
					{$group:{_id:"$_id.WeekEndDate","dataA":{$addToSet :{"Component":"$_id.Component","data":"$data"}}}}
				])
		       .then(function(docs){
	     			var dataJson2={};
					docs.forEach(function(doc){
						var final_arr=[]
						doc.dataA.forEach(function(d){
							var dataJson={};
							d.data.forEach(function(d1){dataJson[d1.MetricName]=d1.MetricValue;})
							var fi_json={}
							fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
							if(Object.keys(fi_json).length != 0){
								fi_json["Name"]=d.Component
								final_arr.push(fi_json)
							}
						})
						if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
						else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
					})
	      			var final_data=[]
		    		dataJson2["Curr"].forEach(function(js_data){
						var component=js_data.Name;
						var elem=Object.keys(js_data);
						elem.splice(elem.indexOf("Name"),1)
						elem.forEach(function(ele){
							js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
							if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
							else{
								dataJson2["Prev"].forEach(function(js_data_p){
									if(js_data_p["Name"] == product){
										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
									}
								})
							}
							if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
						})
						final_data.push(js_data)
		    		})
					dataJson["QueryID"]=query_id; dataJson["Product"]=product;
	      			dataJson["ComponentData"]=final_data;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
			}
		});
	})
};

/* queryIdProdCompTrendData - Product/Component Trend data for a QueryID
 * */
exports.queryIdProdCompTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType;
    var product=req.body.Product; var component=req.body.Component;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var query={}; var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];

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
			 if(product != undefined && component == undefined){query={'$and':[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},{"Product":product}]}}
			 if(product != undefined && component != undefined){query={'$and':[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},{"Product":product},{"Component":component}]}}
			 if(product == undefined && component != undefined){query={'$and':[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}},{"Component":component}]}}
			 FactDefectAgg.aggregate([
		          {$match:query},
	  			  {$unwind:"$MetricAttrib"},
	  			  {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	  			  {$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	  			  {$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
	  			  {$project:{"Date":"$_id",_id:0,data:1}},
	  		 ])
	  		 .then(function(docs){
				 docs.forEach(function(data){
					var compJson2={}
					data.data.forEach(function(doc){
						compJson2[doc.Metric]=doc.Value;
					})
					var compJson={}
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
};

/* queryIDProdCompSearch - Search Product/Component Data for a QueryID
 * */
exports.queryIDProdCompSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','Metrics','ViewID','ViewType','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_ids=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType; var products=req.body.Product; var components=req.body.Component;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[];
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
				if(products != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"Product":{$in:products}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{QueryID:"$QueryID",Product:"$Product",MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$project:{"QueryID":"$_id.QueryID","Product":"$_id.Product","MetricName":"$_id.MetricName","MetricValue":"$MetricValue","_id":0}},
						{$group:{_id:{QueryID:"$QueryID",Product:"$Product"},"ProductData":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
						{$project:{QueryID:"$_id.QueryID",Name:"$_id.Product",_id:0,ProductData:1}}
						])
					.then(function(docs){
						docs.forEach(function(doc){
							var dataJson2={}
							doc["ProductData"].forEach(function(data){
								dataJson2[data["MetricName"]]=data["MetricValue"]
							})
							var dataJson={};
							dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
							dataJson["Name"]=doc["Name"];
							dataJson["QueryID"]=doc["QueryID"];
							dataArr.push(dataJson)
						})
						return dataArr;
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
				else if(components != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"Component":{$in:components}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{QueryID:"$QueryID",Component:"$Component",MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$project:{"QueryID":"$_id.QueryID","Component":"$_id.Component","MetricName":"$_id.MetricName","MetricValue":"$MetricValue","_id":0}},
						{$group:{_id:{QueryID:"$QueryID",Component:"$Component"},"ComponentData":{$addToSet:{"MetricName":"$MetricName","MetricValue":"$MetricValue"}}}},
						{$project:{QueryID:"$_id.QueryID",Name:"$_id.Component",_id:0,ComponentData:1}}
						])
					.then(function(docs){
						docs.forEach(function(doc){
							var dataJson2={}
							doc["ComponentData"].forEach(function(data){
								dataJson2[data["MetricName"]]=data["MetricValue"]
							})
							var dataJson={}
							dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config)
							dataJson["Name"]=doc["Name"]
							dataJson["QueryID"]=doc["QueryID"]
							dataArr.push(dataJson)
						})
						return dataArr;
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				if(products != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"Product":{$in:products}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{QueryID:"$QueryID",Product:"$Product",MetricName:"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{QueryID:"$_id.QueryID",Product:"$_id.Product","WeekEndDate":"$_id.WeekEndDate"},
						  "ProductData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$group:{_id:"$_id.WeekEndDate",dataA:{$addToSet:{"QueryID":"$_id.QueryID", "Product":"$_id.Product", "ProductData":"$ProductData"}}}}
					])
					.then(function(docs){
						var dataJson2={};
						docs.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.ProductData.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricValue;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
									fi_json["Name"]=d.Product
									fi_json["QueryID"]=d.QueryID
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
							dataArr.push(js_data)
			    		})
			    		return dataArr
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
				else if(components != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"Component":{$in:components}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{QueryID:"$QueryID",Component:"$Component",MetricName:"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{QueryID:"$_id.QueryID",Component:"$_id.Component","WeekEndDate":"$_id.WeekEndDate"},
						  "ComponentData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$group:{_id:"$_id.WeekEndDate",dataA:{$addToSet:{"QueryID":"$_id.QueryID", "Component":"$_id.Component", "ComponentData":"$ComponentData"}}}}
					])
					.then(function(docs){
						var dataJson2={};
						docs.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.ComponentData.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricValue;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
									fi_json["Name"]=d.Component
									fi_json["QueryID"]=d.QueryID
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
							dataArr.push(js_data)
			    		})
			    		return dataArr
					})
				     .then(res.jsend.success, res.jsend.error);
				}
			}
	  	})
	})
};

/* viewIdProductData - Product data of a ViewID (all primary queries)
 * */

exports.viewIdProductData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataJson={}; var dataArr=[];

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
					{$group:{_id:{"Product":"$Product","MetricName":"$MetricAttrib.Name"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
				    {$group:{_id:"$_id.Product","MetricData":{$addToSet :  {"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
				    {$project : {"Product" : "$_id","MetricData":1, "_id":0}}
				 ])
				.then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.MetricData.forEach(function(doc){
							compJson2[doc.MetricName]=doc.MetricValue;
						})
						var compJson={};
						compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						if(Object.keys(compJson).length > 0){
							compJson["Name"]=data["Product"];
							dataArr.push(compJson);
						}
					});
					dataJson["ViewID"]=view_id;
					dataJson["ProductData"]=dataArr;
					return dataJson;
				})
				.then(res.jsend.success, res.jsend.error);
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id:{"Product":"$Product","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:{"Product":"$_id.Product","WeekEndDate":"$_id.WeekEndDate"},"data":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
					{$group:{_id:"$_id.WeekEndDate", dataA:{$addToSet:{"Product":"$_id.Product","data":"$data"}}}}
				])
				.then(function(docs){
	      			var dataJson2={}
					docs.forEach(function(doc){
						var final_arr=[]
						doc.dataA.forEach(function(d){
							var dataJson={};
							d.data.forEach(function(d1){
								dataJson[d1.MetricName]=d1.MetricValue;
							})
							var fi_json={}
							fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
							if(Object.keys(fi_json).length != 0){
								fi_json["Name"]=d.Product
								final_arr.push(fi_json)
							}
						})
						if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
						else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
					})
	      			var final_data=[]
		    		dataJson2["Curr"].forEach(function(js_data){
						var product=js_data.Name;
						var elem=Object.keys(js_data);
						elem.splice(elem.indexOf("Name"),1)
						elem.forEach(function(ele){
							js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
							if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
							else{
								dataJson2["Prev"].forEach(function(js_data_p){
									if(js_data_p["Name"] == product){
										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
									}
								})
							}
							if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
						})
						final_data.push(js_data)
		    		})
					dataJson["ViewID"]=view_id;
	      			dataJson["ProductData"]=final_data
					return dataJson;
				})
				.then(res.jsend.success, res.jsend.error);
			}
		});
	})
};

/* viewIdComponentProductData - Component data of a Product for a ViewID (all primary queries)
 * */

exports.viewIdComponentProductData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','Product','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType; var product=req.body.Product;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataJson={}; var dataArr=[];

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
				       {$unwind:"$MetricAttrib"},
				       {$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},
		                     {"Product":product},{"MetricAttrib.Name":{$in:allMetrics}}]}},
				       {$group:{_id :{"Component":"$Component","MetricName":"$MetricAttrib.Name"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
				       {$group:{_id:"$_id.Component","MetricData":{$addToSet :  {"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
				       {$project : {"Component" : "$_id","MetricData":1, "_id":0}},
				])
		       .then(function(docs){
					docs.forEach(function(data){
						var compJson2={}
						data.MetricData.forEach(function(doc){
							compJson2[doc.MetricName]=doc.MetricValue;
						})
						var compJson={};
						compJson = Func.avg_sum_calc(avgMetrics, sumMetrics, compJson2, avgConfig, config)
						compJson["Name"]=data["Component"];
						dataArr.push(compJson);
					});
					dataJson["ViewID"]=view_id; dataJson["Product"]=product;
					dataJson["ComponentData"]=dataArr;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				FactDefectAgg.aggregate([
					{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"Product":product}]}},
					{$unwind:"$MetricAttrib"},
					{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
					{$group:{_id :{"Component":"$Component","MetricName":"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricCount:{$sum:"$MetricAttrib.Value"}}},
					{$group:{_id:{"Component":"$_id.Component","WeekEndDate":"$_id.WeekEndDate"},"data":{$addToSet :{"MetricName":"$_id.MetricName","MetricValue":"$MetricCount"}}}},
					{$group:{_id:"$_id.WeekEndDate","dataA":{$addToSet :{"Component":"$_id.Component","data":"$data"}}}}
				])
		       .then(function(docs){
	    			var dataJson2={}
					docs.forEach(function(doc){
						var final_arr=[]
						doc.dataA.forEach(function(d){
							var dataJson={};
							d.data.forEach(function(d1){
								dataJson[d1.MetricName]=d1.MetricValue;
							})
							var fi_json={}
							fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
							if(Object.keys(fi_json).length != 0){
								fi_json["Name"]=d.Component
								final_arr.push(fi_json)
							}
						})
						if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
						else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
					})
	      			var final_data=[]
		    		dataJson2["Curr"].forEach(function(js_data){
						var component=js_data.Name;
						var elem=Object.keys(js_data);
						elem.splice(elem.indexOf("Name"),1)
						elem.forEach(function(ele){
							js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
							if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
							else{
								dataJson2["Prev"].forEach(function(js_data_p){
									if(js_data_p["Name"] == component){
										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
									}
								})
							}
							if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
						})
						final_data.push(js_data)
		    		})
					dataJson["ViewID"]=view_id; dataJson["Product"]=product;
	      			dataJson["ComponentData"]=final_data;
					return dataJson;
		       })
		       .then(res.jsend.success, res.jsend.error);
			}
		});
	})
};

/* viewIdProdCompTrendData - Trend data for of a Product/Component for a ViewID (all primary queries)
 * */
exports.viewIdProdCompTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['Metrics','ViewID','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
    var product=req.body.Product; var component=req.body.Component;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var query={}; var dataArr=[]; var dataJson={}; var listOfDates=[]; var datesAvaib=[];

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
			 if(product != undefined && component == undefined){query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"Product":product}]}}
			 if(product != undefined && component != undefined){query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"Product":product},{"Component":component}]}}
			 if(product == undefined && component != undefined){query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}},{"Component":component}]}}
			 FactDefectAgg.aggregate([
		          {$match:query},
	  			  {$unwind:"$MetricAttrib"},
	  			  {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	  			  {$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	  			  {$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
	  			  {$project:{"Date":"$_id",_id:0,data:1}},
	  		 ])
	  		 .then(function(docs){
				 docs.forEach(function(data){
					var compJson2={}
					data.data.forEach(function(doc){
						compJson2[doc.Metric]=doc.Value;
					})
					var compJson={}
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
};

/* viewIDProdCompSearch - Search Product/Component Data for ViewID (all primary queries)
 * */
exports.viewIDProdCompSearch = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID;
	var view_type=req.body.ViewType; var products=req.body.Product; var components=req.body.Component;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var dataArr=[];
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
				if(products != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"Product":{$in:products}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Product:"$Product",MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{Product:"$_id.Product"},"ProductData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$project:{Name:"$_id.Product",_id:0,ProductData:1}}
					])
					.then(function(docs){
						docs.forEach(function(doc){
							var dataJson2={}
							doc["ProductData"].forEach(function(data){
								dataJson2[data["MetricName"]]=data["MetricValue"]
							})
							var dataJson={};
							dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
							dataJson["ViewID"]=view_id;
							dataJson["Name"]=doc["Name"];
							dataArr.push(dataJson)
						})
						return dataArr;
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
				else if(components != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":new Date(latestDate.toISOString())},{"Component":{$in:components}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Component:"$Component",MetricName:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{Component:"$_id.Component"},"ComponentData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$project:{Name:"$_id.Component",_id:0,ComponentData:1}}
					  ])
					.then(function(docs){
						docs.forEach(function(doc){
							var dataJson2={}
							doc["ComponentData"].forEach(function(data){
								dataJson2[data["MetricName"]]=data["MetricValue"]
							})
							var dataJson={}
							dataJson = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson2, avgConfig, config);
							dataJson["ViewID"]=view_id;
							dataJson["Name"]=doc["Name"]
							dataArr.push(dataJson)
						})
						return dataArr;
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
			}
			else{
				var listOfDates;
				if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
				else{
					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
				}
				if(products != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"Product":{$in:products}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Product:"$Product",MetricName:"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{WeekEndDate:"$_id.WeekEndDate", "Product":"$_id.Product"},"ProductData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$group:{_id:"$_id.WeekEndDate", "dataA":{$addToSet:{"Product":"$_id.Product", "ProductData":"$ProductData"}}}}
						])
					.then(function(docs){
						var dataJson2={};
						docs.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.ProductData.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricValue;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
									fi_json["Name"]=d.Product
									fi_json["ViewID"]=view_id
									final_arr.push(fi_json)
								}
							})
							if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
							else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
						})
						dataJson2["Curr"].forEach(function(js_data){
							var name=js_data.Name;
							var elem=Object.keys(js_data);
							elem.splice(elem.indexOf("Name"),1)
							elem.splice(elem.indexOf("ViewID"),1)
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
			    		return dataArr
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
				else if(components != undefined){
					FactDefectAgg.aggregate([
						{$match:{$and:[{"QueryID":{$in:query_ids}},{"WeekEndDate":{$in:listOfDates}},{"Component":{$in:components}}]}},
						{$unwind:"$MetricAttrib"},
						{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
						{$group:{_id:{Component:"$Component",MetricName:"$MetricAttrib.Name","WeekEndDate":"$WeekEndDate"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
						{$group:{_id:{WeekEndDate:"$_id.WeekEndDate", "Component":"$_id.Component"},"ComponentData":{$addToSet:{"MetricName":"$_id.MetricName","MetricValue":"$MetricValue"}}}},
						{$group:{_id:"$_id.WeekEndDate", "dataA":{$addToSet:{"Component":"$_id.Component", "ComponentData":"$ComponentData"}}}}
					])
					.then(function(docs){
						var dataJson2={};
						docs.forEach(function(doc){
							var final_arr=[]
							doc.dataA.forEach(function(d){
								var dataJson={};
								d.ComponentData.forEach(function(d1){
									dataJson[d1.MetricName]=d1.MetricValue;
								})
								var fi_json={}
								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
								if(Object.keys(fi_json).length != 0){
									fi_json["Name"]=d.Component
									fi_json["ViewID"]=view_id
									final_arr.push(fi_json)
								}
							})
							if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
							else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
						})
						dataJson2["Curr"].forEach(function(js_data){
							var name=js_data.Name;
							var elem=Object.keys(js_data);
							elem.splice(elem.indexOf("Name"),1)
							elem.splice(elem.indexOf("ViewID"),1)
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
			    		return dataArr
				     })
				     .then(res.jsend.success, res.jsend.error);
				}
			}
	  	})
	})
};
