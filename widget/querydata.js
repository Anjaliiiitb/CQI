var winston = require('winston');
var util = require('../util');
var _ =require('underscore');

var FactDefectAgg = require('../../../models/widget/fact_defect_agg');
var AppBrdgViewQuery= require('../../../models/widget/app_brdg_view_query');
var AppQuery=require('../../../models/widget/app_query');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var AppView=require('../../../models/widget/app_view');
var Func=require('./reuse_functions');
var MonthJson=require('../../data/widget/monthly_config');
var MetricCumulative=require('../../data/widget/metric_cumulative');
var OQMetrics=require('../../data/widget/oq_metrics');
var FlagMetrics=require('../../data/widget/flag_metrics');
var AppGlance = require('../../../models/widget/app_oq_rel_bu_mapping');

/* getViewIDforRelease - Get list of Views for a Release
 * */
 exports.getViewIDforRelease = function(req, res){
        var errors = util.requireFields(req.query, ['ReleaseName']);
        if (errors) {
              res.jsend.fail(errors);
              return;
        }
        var type = req.query.Type;
        AppView.find({"ReleaseName":req.query.ReleaseName},{"ReleaseName":1,"ViewID":1,"CreatedBy":1,"ViewName":1,_id:0})
        .then(function(doc){
               if(doc.length == 0){res.jsend.success([]); return;}
               else if(type != "Glance"){res.jsend.success(doc); return;}
               else if(type == "Glance"){
                      var view_ids=[]; var final_data=[]; var doc_data={};
                      doc.forEach(function(doc1){view_ids.push(doc1["ViewID"])})
                      doc.forEach(function(doc1){doc_data[doc1["ViewID"]]=doc1})
                      AppGlance.aggregate([
                          {$match:{"ViewID":{$in:view_ids}}},
                          {$group:{_id:null, allViews:{$addToSet:"$ViewID"}}}
                      ])
                      .then(function(glance){
                            if(glance.length == 0) return [];
                             glance[0]["allViews"].forEach(function(view){final_data.push(doc_data[view])})
                            return final_data;
                      })
                      .then(res.jsend.success, res.jsend.error)
               }
        })
 };


/* queryDef - Definition of a QueryID along with Type, Name and Last Refresh Date
 * */
exports.queryDef = function(req,res){
	var errors = util.requireFields(req.query, ['QueryID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	AppQuery.findOne({QueryID:req.query.QueryID},{"QueryName":1,"QueryDefinition":1,"QueryID":1,
		     "QueryType":1,"LastRefreshDate":1,_id:0})
	.then(function(doc){
		if(doc == null){doc=[];}
		return doc
	})
	.then(res.jsend.success, res.jsend.error)
};

/* viewDef -  Definition of all queries(both Primary and Alternate) for a ViewID
 * along with Type, Name and Last Refresh Date
 * */
exports.viewDef = function(req,res){
	var errors = util.requireFields(req.query, ['ViewID']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var query_docs=[]; var QueryIDS=[]; var docs=[];
	AppBrdgViewQuery.findOne({ViewID:req.query.ViewID},{"Queries.QueryName":1,"ViewID":1,_id:0,
		"Queries.Primary":1,"Queries.QueryID":1,"Queries.QueryType":1})
	.then(function(doc){
		if(doc == null){query_docs=[];}
		else{
			doc["Queries"].forEach(function(query){docs.push(query); QueryIDS.push(query["QueryID"])})
			AppQuery.aggregate([
			    {$match:{"QueryID":{$in:QueryIDS}}},
			    {$project:{"QueryDefinition":1,"QueryID":1,"LastRefreshDate":1,"_id":0}}
			])
			.then(function(docs2){
				var query_defs={}
				docs2.forEach(function(querydef){query_defs[querydef["QueryID"]]=[querydef["QueryDefinition"],querydef["LastRefreshDate"]]})
				docs.forEach(function(each){
					each["QueryDefinition"]=query_defs[each["QueryID"]][0];
					each["LastRefreshDate"]=query_defs[each["QueryID"]][1];
					query_docs.push(each)
				})
				return query_docs;
			})
			.then(res.jsend.success, res.jsend.error)
		}
	})
};

exports.viewIdDefectData2 = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Primary','Metrics','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var primary=req.body.Primary; var view_type=req.body.ViewType;
	var trend=req.body.Trend; 
	var DataCalc=req.body.DataCalc; //week, month, by default week
	var week_date=req.body.WeekDate; var month_year=req.body.MonthYear; // like weekdate
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var week_flag=0; var month_flag=0;
	//add wrt week_date and month_year
	if(DataCalc == "month"){month_flag=1} else{week_flag=1}
	var QueryIDS=[]; var main_queryid=""; var main_query="";
    var QueryData={}; var dataArr=[];
    AppView.find({$and:[{"ViewID":view_id},{"ActiveFlag":"Y"}]})
    .then(function(inactive){
    	if(inactive.length == 0){res.jsend.fail("View Invalid or Inactive"); return;}
    	else{
    		var tasks=[];
    		tasks.push(Func.viewIdMetrics(allMetricsRaw, view_id, primary, view_type))
    		Promise.all(tasks)
    		.then(function(details){
    			if(details[0].length == 0){res.jsend.success([]); return;}
    			QueryData = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
    			config = details[0][4]; avgConfig = details[0][5];
    			WeekEndDates.find({},{_id:0})
    			.then(function(weeks){
    				if(trend == undefined || trend == "N"){
    					if(week_flag == 1){
	    					var listOfDates;
	    					if(week_date == undefined){listOfDates = [weeks[0].WeekEndDates[0]];}
	    					else{
		    					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
		    					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = [weeks[0].WeekEndDates[Ind]]};
		    				}
    					}
    					else if(month_flag == 1){
    						if(month_year == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,4);}
    					}
    					console.log(listOfDates)
	    				if(primary == "Y"){
	    					QueryIDS=QueryData;    					
	    				     FactDefectAgg.aggregate([
	            		          {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":{'$in':listOfDates}}]}},
	            	  			  {$unwind:"$MetricAttrib"},
	            	  			  {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	            	  			  {$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	            	  			  {$group:{_id:"$_id.Date", data:{$addToSet:{MetricName:"$_id.Metric",MetricValue:"$MetricCount"}}}},
	            	  			  {$project:{"Date":"$_id",_id:0,data:1}},
	            	  		 ])
	    	   				.then(function(docs3){
	    	   					if(month_flag == 1){
	    	   						if(docs3.length == 0){return [];}
		    	   					docs3.forEach(function(doc){
		    		   					var dataJson={};
		    		   					doc.data.forEach(function(d){dataJson[d.MetricName]=d.MetricValue;})
		    		   					var final_json={}
		    		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)		    		   					
		    		   					if(doc.Date.getTime() == listOfDates[0].getTime()){final_json["datacalc"]="curr"}
		    		   					else{final_json["datacalc"]="prev"}
		    		   					dataArr.push(final_json)
		    	   					})
		    	   					final_json2={}; final_json2["ViewName"]=QueryIDS[QueryIDS.length-1]; dataArr2=[];
		    	   					allMetricsRaw.forEach(function(metric){
    	   								if(MetricCumulative[view_type][metric] == "L"){
    	   									dataArr.forEach(function(dataA){
		    	   								if (dataA["datacalc"] == "curr"){
		    	   									if(dataA[metric] != undefined){final_json2[metric]=dataA[metric]}		    	   									
		    	   								}
    	   									})
    	   								}
	    	   							if(MetricCumulative[view_type][metric] == "S"){
	    	   								dataArr.forEach(function(dataA){
		    	   								if(dataA[metric] != undefined){final_json2[metric]=(final_json2[metric]==undefined ? 0:final_json2[metric])+dataA[metric]}		    	   									
    	   									})
	    	   							}	    	   							
		    	   					})
		    	   					dataArr2.push(final_json2);
		    	   					return dataArr2;
	    	   					}    	   					
	    	   					else if(week_flag == 1){
		    	   					if(docs3.length == 0){return [];}
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
		    	   					return dataArr;
	    	   					}
	    	   				})
	    	   			.then(res.jsend.success, res.jsend.error)
	    	   			}
	    				else if(primary == "N"){
	    					QueryIDS=Object.keys(QueryData); QueryIDS=QueryIDS.map(Number);
	    					
	    				     FactDefectAgg.aggregate([
	            		          {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":{'$in':listOfDates}}]}},
	            	  			  {$unwind:"$MetricAttrib"},
	            	  			  {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	            	  			  {$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	            	  			  {$group:{_id:"$_id.Date", data:{$addToSet:{MetricName:"$_id.Metric",MetricValue:"$MetricCount"}}}},
	            	  			  {$project:{"Date":"$_id",_id:0,data:1}},
	            	  		 ])
	    					
	    					FactDefectAgg.aggregate([
	    					      {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":{'$in':listOfDates}}]}},
	    					      {$unwind:"$MetricAttrib"},
	    					      {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	    					      {$group:{_id:{queryid:"$QueryID",name:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
	    					      {$project:{QueryID:"$_id.queryid",MetricName:"$_id.name",MetricValue:1,_id:0}},
	    					      {$group:{_id:"$QueryID", data:{$addToSet:{MetricName:"$MetricName", MetricValue:"$MetricValue"}}}},
	    					      {$project:{QueryID:"$_id",data:1,_id:0}},
	    					])
	    					.then(function(docs3){
	    						if(docs3.length == 0){return [];}
	    						docs3.forEach(function(doc){
	    							var dataJson={};
	    							doc.data.forEach(function(d){
	    								dataJson[d.MetricName]=d.MetricValue;
	    							})
	    							var final_json={}
	    							final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
	    							final_json["QueryID"]=doc.QueryID;
	    							final_json["QueryName"]=QueryData[doc.QueryID];
	    							dataArr.push(final_json)
	    						})
	    						return dataArr;
	    					})
	    					.then(res.jsend.success, res.jsend.error)
	    				}
    				}
    				else{
    					var listOfDates;
    					if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
    					else{
	    					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
	    					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
	    				}
        				if(primary == "Y"){
        					QueryIDS=QueryData;
        					FactDefectAgg.aggregate([
        	                 	{$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate" : {'$in':listOfDates}}]}},
        	                 	{$unwind:"$MetricAttrib"},
        	                 	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
        	                   	{$group:{_id:{"WeekEndDate":"$WeekEndDate", "MetricName":"$MetricAttrib.Name"}, MetricValue:{$sum:"$MetricAttrib.Value"}}},
    		                 	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{MetricName:"$_id.MetricName",MetricValue:"$MetricValue"}}}},
        	                ])
        	   				.then(function(docs3){
        	   					if(docs3.length == 0){return [];}
        	   					var dataJson2={}
        	   					docs3.forEach(function(doc){
        		   					var dataJson={};
        		   					doc.data.forEach(function(d){
        		   						dataJson[d.MetricName]=d.MetricValue;
        		   					})
        		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
        		   					if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
    								else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
        	   					})
        	   					if(dataJson2["Curr"] == undefined){return []}
        	   					for (var key in dataJson2["Curr"]){
        	   						dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined)? "Up" : (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
        	   						dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
        	   					}
        	   					dataJson2["Curr"]["ViewName"]=QueryIDS[QueryIDS.length-1];
    		                	return [dataJson2["Curr"]];
        	   				})
        	   			.then(res.jsend.success, res.jsend.error)
        	   			}
        				else if(primary == "N"){
        					QueryIDS=Object.keys(QueryData); QueryIDS=QueryIDS.map(Number);
        					FactDefectAgg.aggregate([
    						   {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":{$in:listOfDates}}]}},
    						   {$unwind:"$MetricAttrib"},
    						   {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
    						   {$group:{_id:{"WeekEndDate":"$WeekEndDate","QueryID":"$QueryID","MetricName":"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
    						   {$group:{_id:{"QueryID":"$_id.QueryID","WeekEndDate":"$_id.WeekEndDate"}, data:{$addToSet:{MetricName:"$_id.MetricName", MetricValue:"$MetricValue"}}}},
    						   {$group:{_id:{"WeekEndDate":"$_id.WeekEndDate"}, dataA:{$addToSet:{QueryID:"$_id.QueryID", data:"$data"}}}},
    						   {$project:{_id:0,WeekEndDate:"$_id.WeekEndDate",dataA:1}},
    						])
        					.then(function(docs3){
        						if(docs3.length == 0){return [];}
        						var dataJson2={}
        						docs3.forEach(function(doc){
        							var final_arr=[]
        							doc.dataA.forEach(function(d){
        								var dataJson={};
        								d.data.forEach(function(d1){
        									dataJson[d1.MetricName]=d1.MetricValue;
        								})
            							var fi_json={}
        								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
            							fi_json["QueryID"]=d.QueryID
            							fi_json["QueryName"]=QueryData[d.QueryID]
        								final_arr.push(fi_json)
        							})
            						if(doc["WeekEndDate"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
        							else if(doc["WeekEndDate"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
        						})
        						var final_data=[]
        						if(dataJson2["Curr"] == undefined){return []}
        						dataJson2["Curr"].forEach(function(js_data){
        							var query_id_temp=js_data.QueryID;
        							var elem=Object.keys(js_data);
        							elem.splice(elem.indexOf("QueryID"),1)
        							elem.splice(elem.indexOf("QueryName",1))
        							elem.forEach(function(ele){
        								js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
        								if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
        								else{
    	    								dataJson2["Prev"].forEach(function(js_data_p){
    	    									if(js_data_p["QueryID"] == query_id_temp){
    	    										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
    	    									}
    	    								})
        								}
        								if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
        							})
        							final_data.push(js_data)
        						})
        						return final_data;
        					})
        					.then(res.jsend.success, res.jsend.error)
        				}
    				}
    			})
    		})
    	}
    })
};

/* viewIdDefectData - Primary or Alternate Query data for a ViewID.
 * If Primary=Y (Cumulative result of Defect, Autons, Teacat, Holes and PSIRT primary queries)
 * If Primary=N (Result for each of the alternate defect queries)
 *  */
exports.viewIdDefectData = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Primary','Metrics','ViewType']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var allMetricsRaw=req.body.Metrics; var view_id=req.body.ViewID; var primary=req.body.Primary; var view_type=req.body.ViewType;
	var trend=req.body.Trend; var week_date=req.body.WeekDate;
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};

	var QueryIDS=[]; var main_queryid=""; var main_query="";
    var QueryData={}; var dataArr=[];
    AppView.find({$and:[{"ViewID":view_id},{"ActiveFlag":"Y"}]})
    .then(function(inactive){
    	if(inactive.length == 0){res.jsend.fail("View Invalid or Inactive"); return;}
    	else{
    		var tasks=[];
    		tasks.push(Func.viewIdMetrics(allMetricsRaw, view_id, primary, view_type))
    		Promise.all(tasks)
    		.then(function(details){
    			if(details[0].length == 0){res.jsend.success([]); return;}
    			QueryData = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
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
	    	   					if(docs3.length == 0){return [];}
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
	    	   					return dataArr;
	    	   				})
	    	   			.then(res.jsend.success, res.jsend.error)
	    	   			}
	    				else if(primary == "N"){
	    					QueryIDS=Object.keys(QueryData); QueryIDS=QueryIDS.map(Number);
	    					FactDefectAgg.aggregate([
	    					      {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":new Date(latestDate.toISOString())}]}},
	    					      {$unwind:"$MetricAttrib"},
	    					      {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	    					      {$group:{_id:{queryid:"$QueryID",name:"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
	    					      {$project:{QueryID:"$_id.queryid",MetricName:"$_id.name",MetricValue:1,_id:0}},
	    					      {$group:{_id:"$QueryID", data:{$addToSet:{MetricName:"$MetricName", MetricValue:"$MetricValue"}}}},
	    					      {$project:{QueryID:"$_id",data:1,_id:0}},
	    					])
	    					.then(function(docs3){
	    						if(docs3.length == 0){return [];}
	    						docs3.forEach(function(doc){
	    							var dataJson={};
	    							doc.data.forEach(function(d){
	    								dataJson[d.MetricName]=d.MetricValue;
	    							})
	    							var final_json={}
	    							final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
	    							final_json["QueryID"]=doc.QueryID;
	    							final_json["QueryName"]=QueryData[doc.QueryID];
	    							dataArr.push(final_json)
	    						})
	    						return dataArr;
	    					})
	    					.then(res.jsend.success, res.jsend.error)
	    				}
    				}
    				else{
    					var listOfDates;
    					if(week_date == undefined){listOfDates = weeks[0].WeekEndDates.slice(0,2);}
    					else{
	    					var Ind; var weekDate = new Date(week_date); weeks[0].WeekEndDates.forEach(function(item, index){if(weekDate.getTime() == item.getTime()){Ind = index;}})
	    					if(Ind == -1 || Ind == undefined){ res.jsend.fail("WeekDate Invalid"); return;} else {listOfDates = weeks[0].WeekEndDates.slice(Ind,Ind+2);};
	    				}
        				if(primary == "Y"){
        					QueryIDS=QueryData;
        					FactDefectAgg.aggregate([
        	                 	{$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate" : {'$in':listOfDates}}]}},
        	                 	{$unwind:"$MetricAttrib"},
        	                 	{$match:{"MetricAttrib.Name":{$in:allMetrics}}},
        	                   	{$group:{_id:{"WeekEndDate":"$WeekEndDate", "MetricName":"$MetricAttrib.Name"}, MetricValue:{$sum:"$MetricAttrib.Value"}}},
    		                 	{$group:{_id:"$_id.WeekEndDate", data:{$addToSet:{MetricName:"$_id.MetricName",MetricValue:"$MetricValue"}}}},
        	                ])
        	   				.then(function(docs3){
        	   					if(docs3.length == 0){return [];}
        	   					var dataJson2={}
        	   					docs3.forEach(function(doc){
        		   					var dataJson={};
        		   					doc.data.forEach(function(d){
        		   						dataJson[d.MetricName]=d.MetricValue;
        		   					})
        		   					final_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
        		   					if(doc["_id"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_json}
    								else if(doc["_id"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_json}
        	   					})
        	   					if(dataJson2["Curr"] == undefined){return []}
        	   					for (var key in dataJson2["Curr"]){
        	   						dataJson2["Curr"][key+"_trend"]=(dataJson2["Prev"] == undefined)? "Up" : (dataJson2["Prev"][key] == undefined) ? "Up" : (dataJson2["Curr"][key] > dataJson2["Prev"][key]) ? "Up" : "Down"
        	   						dataJson2["Curr"][key+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(key) > -1 ? "Good" : "Bad";
        	   					}
        	   					dataJson2["Curr"]["ViewName"]=QueryIDS[QueryIDS.length-1];
    		                	return [dataJson2["Curr"]];
        	   				})
        	   			.then(res.jsend.success, res.jsend.error)
        	   			}
        				else if(primary == "N"){
        					QueryIDS=Object.keys(QueryData); QueryIDS=QueryIDS.map(Number);
        					FactDefectAgg.aggregate([
    						   {$match:{$and:[{"QueryID":{$in:QueryIDS}},{"WeekEndDate":{$in:listOfDates}}]}},
    						   {$unwind:"$MetricAttrib"},
    						   {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
    						   {$group:{_id:{"WeekEndDate":"$WeekEndDate","QueryID":"$QueryID","MetricName":"$MetricAttrib.Name"},MetricValue:{$sum:"$MetricAttrib.Value"}}},
    						   {$group:{_id:{"QueryID":"$_id.QueryID","WeekEndDate":"$_id.WeekEndDate"}, data:{$addToSet:{MetricName:"$_id.MetricName", MetricValue:"$MetricValue"}}}},
    						   {$group:{_id:{"WeekEndDate":"$_id.WeekEndDate"}, dataA:{$addToSet:{QueryID:"$_id.QueryID", data:"$data"}}}},
    						   {$project:{_id:0,WeekEndDate:"$_id.WeekEndDate",dataA:1}},
    						])
        					.then(function(docs3){
        						if(docs3.length == 0){return [];}
        						var dataJson2={}
        						docs3.forEach(function(doc){
        							var final_arr=[]
        							doc.dataA.forEach(function(d){
        								var dataJson={};
        								d.data.forEach(function(d1){
        									dataJson[d1.MetricName]=d1.MetricValue;
        								})
            							var fi_json={}
        								fi_json = Func.avg_sum_calc(avgMetrics, sumMetrics, dataJson, avgConfig, config)
            							fi_json["QueryID"]=d.QueryID
            							fi_json["QueryName"]=QueryData[d.QueryID]
        								final_arr.push(fi_json)
        							})
            						if(doc["WeekEndDate"].getTime() == listOfDates[0].getTime()){dataJson2["Curr"]=final_arr}
        							else if(doc["WeekEndDate"].getTime() == listOfDates[1].getTime()){dataJson2["Prev"]=final_arr}
        						})
        						var final_data=[]
        						if(dataJson2["Curr"] == undefined){return []}
        						dataJson2["Curr"].forEach(function(js_data){
        							var query_id_temp=js_data.QueryID;
        							var elem=Object.keys(js_data);
        							elem.splice(elem.indexOf("QueryID"),1)
        							elem.splice(elem.indexOf("QueryName",1))
        							elem.forEach(function(ele){
        								js_data[ele+"_metric_type"] = FlagMetrics["Good-Metric"].indexOf(ele) > -1 ? "Good" : "Bad";
        								if(dataJson2["Prev"] == undefined || dataJson2["Prev"].length == 0){js_data[ele+"_trend"]="Up"}
        								else{
    	    								dataJson2["Prev"].forEach(function(js_data_p){
    	    									if(js_data_p["QueryID"] == query_id_temp){
    	    										js_data[ele+"_trend"] = (js_data_p[ele] == undefined) ? "Up" : (js_data[ele] > js_data_p[ele]) ? "Up" : "Down"
    	    									}
    	    								})
        								}
        								if(js_data[ele+"_trend"] == undefined){js_data[ele+"_trend"]="Up"}
        							})
        							final_data.push(js_data)
        						})
        						return final_data;
        					})
        					.then(res.jsend.success, res.jsend.error)
        				}
    				}
    			})
    		})
    	}
    })
};

/* queryIdTrendData - Trend data for a QueryID
 * */
exports.queryIdTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['QueryID','ViewID','Metrics','Primary','ViewType']);
	if (errors) {res.jsend.fail(errors);return;}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var query_id=req.body.QueryID;
	var primary=req.body.Primary; var view_type=req.body.ViewType;
	var weeks=req.body.Weeks;
	if(weeks == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd;
	var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var query={}; var listOfDates=[];
	var dataArr=[]; var dataJson={}; var datesAvaib=[];
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
			 query={'$and':[{"QueryID":query_id},{"WeekEndDate":{'$in':listOfDates}}]};
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
			 		var compJson={}
					data.data.forEach(function(doc){
						compJson[doc.Metric]=doc.Value;
					})
			 		var compJson2={}
			 		compJson2 = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson, avgConfig, config)
					compJson2["Date"]=data["Date"]
			 		datesAvaib.push(data["Date"])
			 		dataArr.push(compJson2)
			 	})
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

exports.viewIdTrendData = function (req, res) {
	var errors = util.requireFields(req.body, ['ViewID','Metrics','ViewType']);
	if (errors) {res.jsend.fail(errors);return;}
	var allMetricsRaw=req.body.Metrics;  var view_id=req.body.ViewID; var view_type=req.body.ViewType;
	var weeks=req.body.Weeks; var months=req.body.Months;
	if(weeks == undefined && months == undefined){
		var errors2 = util.requireFields(req.body, ['DateStart','DateEnd']);
		if (errors2) {res.jsend.fail(errors2);return;}
	}
	var date1=req.body.DateStart; var date2=req.body.DateEnd; var month_flag=0;
	if(months != undefined){month_flag=1;}
	if(date1 != undefined && date2 != undefined){if(date1.length == 7 && date2.length == 7){month_flag=1;}}
	var query_ids=[]; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[];
	var config={}; var avgConfig={};
	var query={}; var listOfDates=[];
	var dataArr=[]; var dataJson={}; var datesAvaib=[];
	var tasks=[];
	tasks.push(Func.viewIdMetrics_new(allMetricsRaw, view_id, view_type))
	Promise.all(tasks)
	.then(function(details){
		query_ids = details[0][0]; allMetrics = details[0][1]; sumMetrics = details[0][2]; avgMetrics = details[0][3];
		config = details[0][4]; avgConfig = details[0][5];
		WeekEndDates.find({},{_id:0})
		.then(function(weeks2){
			 if(month_flag == 1){listOfDates = Func.monthTrendDates(weeks2,months,date1,date2);}
			 else {listOfDates = Func.trendDates(weeks2,weeks,date1,date2);}
			 if(listOfDates.length == 0) {res.jsend.fail("Week End Date Invalid"); return;};
			 query={'$and':[{"QueryID":{$in:query_ids}},{"WeekEndDate":{'$in':listOfDates}}]};
		     FactDefectAgg.aggregate([
		          {$match:query},
	  			  {$unwind:"$MetricAttrib"},
	  			  {$match:{"MetricAttrib.Name":{$in:allMetrics}}},
	  			  {$group:{_id:{Date:"$WeekEndDate", Metric:"$MetricAttrib.Name"}, MetricCount:{$sum:"$MetricAttrib.Value"}}},
	  			  {$group:{_id:"$_id.Date", data:{$addToSet:{Metric:"$_id.Metric",Value:"$MetricCount"}}}},
	  			  {$project:{"Date":"$_id",_id:0,data:1}},
	  		 ])
		  	.then(function(docs){
		  		if(month_flag == 1){
		  			var months=[]; var month_js={}; var final_json={}
		  			listOfDates.forEach(function(date){months.push(date.toISOString().slice(0,7));})
		  			months.forEach(function(month){month_js[month]=[];})
		  			listOfDates.forEach(function(date){var da = date.toISOString().slice(0,7);if(Object.keys(month_js).indexOf(da) > -1){month_js[da].push(date.toISOString())}})
		  			var dataJson2={}
		  			docs.forEach(function(data){
		  				var compJson={};data.data.forEach(function(doc){compJson[doc.Metric]=doc.Value;});dataJson2[data.Date.toISOString()]=compJson;
		  			})
		  			for (var i in month_js){
		  				var each_month={};
		  				allMetrics.forEach(function(each_met){
			  				if(MonthJson[view_type][each_met] != undefined){
			  					if(MonthJson[view_type][each_met] == "L"){
			  						var i2=dataJson2[month_js[i][0]] ? (dataJson2[month_js[i][0]][each_met] ? dataJson2[month_js[i][0]][each_met]:0):0;
			  						each_month[each_met]=(i2)?i2:0;
			  					}
			  					else if(MonthJson[view_type][each_met] == "S"){
			  						var i3=0;
			  						month_js[i].forEach(function(a){i3=i3+(dataJson2[a] ? (dataJson2[a][each_met] ? dataJson2[a][each_met]:0) : 0);})
			  						each_month[each_met]=(i3)?i3:0;
			  					}
			  				}
		  				})
		  				final_json[i]=each_month
		  			}
		  			for (var each_js in final_json){
				 		var compJson2={}
				 		compJson2 = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, final_json[each_js], avgConfig, config)
				 		compJson2["Date"]=each_js
				 		dataArr.push(compJson2)
		  			}
		  			dataJson["ViewID"]=view_id;
					dataJson["TrendData"]=dataArr;
		  		}
		  		else{
				 	docs.forEach(function(data){
				 		var compJson={}
						data.data.forEach(function(doc){
							compJson[doc.Metric]=doc.Value;
						})
				 		var compJson2={}
				 		compJson2 = Func.avg_sum_calc_trend(avgMetrics, sumMetrics, compJson, avgConfig, config)
				 		compJson2["Date"]=data["Date"]
				 		datesAvaib.push(data["Date"])
				 		dataArr.push(compJson2)
				 	})
				 	if(listOfDates.length != datesAvaib.length){
				 		dataArr = Func.trendFillers(listOfDates, datesAvaib, dataArr, allMetricsRaw)
				 	}
				 	dataJson["ViewID"]=view_id;
					dataJson["TrendData"]=dataArr;
				}
		  		return dataJson;
		   })
		   .then(res.jsend.success, res.jsend.error);
		})
	})
};
