var AppBrdgViewQuery= require('../../../models/widget/app_brdg_view_query');
var oq_config_o = require('../../data/widget/oq_metrics');
var rel_config_o = require('../../data/widget/release_metrics');
var oq_avg_formulas_o = require('../../data/widget/oq_avg_formulas');
var rel_avg_formulas_o = require('../../data/widget/release_avg_formulas');
var flag_metrics = require('../../data/widget/flag_metrics');
var AppView = require('../../../models/widget/app_view');
var _ = require('underscore');

/* viewIdMetrics_new - Internal function
 * Logic to be used to generate queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig
 * for a view_id
 * */
exports.viewIdMetrics_new = function(allMetricsRaw, view_id, view_type) {
	var type=[]; var allMetrics=[];	var sumMetrics=[]; var avgMetrics=[]; var config={}; var avgConfig={};
	var rg_flag=0; var psirt_flag=0;
	if(view_type == "OQ"){
		type=["Defect","Autons","Teacat","PSIRT","TeaCat"];
		config = JSON.parse(JSON.stringify(oq_config_o));
		avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "Release"){
		type=["BugBackLog","Autons","Teacat","Holes","PSIRT","TeaCat"];
		config = JSON.parse(JSON.stringify(rel_config_o));
		avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	allMetricsRaw.forEach(function(metric){
		if(Object.keys(avgConfig).indexOf(metric) > -1){avgMetrics.push(metric)}
		else{sumMetrics.push(metric)}
		if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
			allMetrics.push(each_metric)})
		}
	})
	if(view_type == "OQ"){
		return AppBrdgViewQuery.aggregate([
   			{$match:{"ViewID":view_id}},
   			{$unwind:"$Queries"},
   			{$match:{$and:[{"Queries.QueryType":{$in:type}},{"Queries.Primary":"Y"}]}}
   		])
   		.then(function(docs){
			queryids=[];
			docs.forEach(function(doc){
				if(doc["Queries"]["QueryType"] == "PSIRT"){psirt_flag=1;}
				queryids.push(doc["Queries"]["QueryID"])
			})
			if(psirt_flag == 1){
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["OQ"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["OQ"][metric];
					}
					if(Object.keys(flag_metrics["OQ-PSIRT-avg"]).indexOf(metric) > -1){
						avgConfig[metric]=flag_metrics["OQ-PSIRT-avg"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
						allMetrics.push(each_metric)
					})}
				})
			}
			return [queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig];
   		})
	}		
	else if(view_type == "Release"){
		type_mod=["BugBackLog","Autons","Teacat","Holes","PSIRT","RG","TeaCat"]
		return AppBrdgViewQuery.aggregate([
		    {$match:{"ViewID":view_id}},
		    {$unwind:"$Queries"},
		    {$match:{$and:[{"Queries.QueryType":{$in:type_mod}},{"Queries.Primary":"Y"}]}}
		])
		.then(function(docs){
			queryids=[];
			docs.forEach(function(doc){
				if(doc["Queries"]["QueryType"] == "PSIRT"){psirt_flag=1;
				queryids.push(doc["Queries"]["QueryID"])}
				else if(doc["Queries"]["QueryType"] == "RG"){rg_flag=1;}
				else{queryids.push(doc["Queries"]["QueryID"])}
			})
			if(psirt_flag == 1 && rg_flag == 1){
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["Release-PSIRT"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-PSIRT"][metric];
					}
					else if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-RG"][metric];
					}
					if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
						avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
						allMetrics.push(each_metric)
					})}
				})
			}
			else if(psirt_flag == 1 && rg_flag == 0){
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["Release-PSIRT"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-PSIRT"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
						allMetrics.push(each_metric)
					})}
				})
			}
			else if(psirt_flag == 0 && rg_flag == 1){
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-RG"][metric];
					}
					if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
						avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
						allMetrics.push(each_metric)
					})}
				})
			}
			return [queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig];				
		})
	}
};

/* viewIdMetrics_prim - Internal function
 * Get only primary QueryID for OQ ViewID
 * Get only primary QueryID for Release ViewID with RG column change
 * Use in Glance Data
 *  */
exports.viewIdMetrics_prim = function(allMetricsRaw, view_id, view_type) {
	var type=[]; var query_id=""; var allMetrics=[]; var sumMetrics=[]; var avgMetrics=[]; var config={}; var avgConfig={}; var rg_flag=0;
	if(view_type == "OQ"){
		type=["Defect"]; config = JSON.parse(JSON.stringify(oq_config_o)); avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "Release"){
		type=["BugBackLog"]; config = JSON.parse(JSON.stringify(rel_config_o)); avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	allMetricsRaw.forEach(function(metric){
		if(Object.keys(avgConfig).indexOf(metric) > -1){avgMetrics.push(metric)}
		else{sumMetrics.push(metric)}
		if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
			allMetrics.push(each_metric)})
		}
	})
	if(view_type == "OQ"){
		return AppBrdgViewQuery.aggregate([
   			{$match:{"ViewID":view_id}},
   			{$unwind:"$Queries"},
   			{$match:{$and:[{"Queries.QueryType":{$in:type}},{"Queries.Primary":"Y"}]}},
   			{$project:{"QueryID":"$Queries.QueryID", "_id":0}}
   		])
   		.then(function(docs){
			queryid=docs[0].QueryID;
			return [queryid, allMetrics, sumMetrics, avgMetrics, config, avgConfig];
   		})
	}		
	else if(view_type == "Release"){
		type_mod=["BugBackLog","RG"]
		return AppBrdgViewQuery.aggregate([
		    {$match:{"ViewID":view_id}},
		    {$unwind:"$Queries"},
		    {$match:{$and:[{"Queries.QueryType":{$in:type_mod}},{"Queries.Primary":"Y"}]}}
		])
		.then(function(docs){
			docs.forEach(function(doc){
				if(doc["Queries"]["QueryType"] == "RG"){rg_flag=1;}
				else{queryid = doc["Queries"]["QueryID"]}
			})
			if(rg_flag == 1){
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-RG"][metric];
					}
					if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
						avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
						allMetrics.push(each_metric)
					})}
				})
			}
			return [queryid, allMetrics, sumMetrics, avgMetrics, config, avgConfig];				
		})
	}
}


/* viewIdMetrics - Internal function
 * Logic to be used to generate queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig
 * for a view_id and Primary/Alternate flag combination
 * */
exports.viewIdMetrics = function(allMetricsRaw, view_id, primary, view_type) {
	var QueryData={};	
	var queryids=[]; var allMetrics=[];	var sumMetrics=[]; var avgMetrics=[]; var config={}; var avgConfig={};
	var type=[]; var psirt_flag=0; var rg_flag=0;
	if(view_type == "OQ" && primary == "Y"){
		type=["Defect","Autons","Teacat","PSIRT","TeaCat"]; config = JSON.parse(JSON.stringify(oq_config_o)); avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "OQ" && primary == "N"){
		type=["Defect"]; config = JSON.parse(JSON.stringify(oq_config_o)); avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "Release" && primary == "Y"){
		type=["BugBackLog","Autons","Teacat","Holes","PSIRT","TeaCat"]; config = JSON.parse(JSON.stringify(rel_config_o)); avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	else if(view_type == "Release" && primary == "N"){
		type=["BugBackLog"]; config = JSON.parse(JSON.stringify(rel_config_o)); avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	allMetricsRaw.forEach(function(metric){
		if(Object.keys(avgConfig).indexOf(metric) > -1){avgMetrics.push(metric)}
		else{sumMetrics.push(metric)}
		if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
			allMetrics.push(each_metric)})
		}
	})	
	if(primary == "N"){
		return AppBrdgViewQuery.aggregate([
		     {$match:{"ViewID":view_id}},
		     {$unwind:"$Queries"},
		     {$match:{$and:[{"Queries.QueryType":{$in:type}},{"Queries.Primary":primary}]}},
		     {$group:{_id:null, QueryData:{$addToSet:{QueryID:"$Queries.QueryID", QueryName:"$Queries.QueryName", QueryType:"$Queries.QueryType"}}}},
		     {$project:{QueryData:1,_id:0}}
	     ])
	     .then(function(docs){	    	 
	     	if(docs.length==0){return [];}
			docs[0].QueryData.forEach(function(doc_0){
				QueryData[doc_0.QueryID]=doc_0.QueryName
			})
			//RG start
			return AppView.find({"ViewID":view_id, "RgExistsFlag":"Y", "ViewType":"Release"},{"RgExistsFlag":1})
			.then(function(rg_flag){
				if(rg_flag.length != 0){
					var RG_mets=["RG", "RG Backlog", "RG Incoming", "RG Disposed", "RG Actual Incoming", "RG Average Disposal", "RG Current Outstanding", "RG Average Outstanding", "RG MTTR - Average Outstanding", "RG MTTR - Current Outstanding", "Average Age of RG Bugs"]
					var RG_mets_avg=["RG MTTR - Average Outstanding", "RG MTTR - Current Outstanding", "Average Age of RG Bugs"]
					allMetrics=[];
					allMetricsRaw.forEach(function(metric){
						if(RG_mets.indexOf(metric) > -1){
							config[metric]=flag_metrics["Release-RG"][metric];
							if(RG_mets_avg.indexOf(metric) > -1){
								avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
							}
							if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
							})}
						}
						else{
							if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
							})}
						}
					})
					return [QueryData, allMetrics, sumMetrics, avgMetrics, config, avgConfig]
				}
				else{return [QueryData, allMetrics, sumMetrics, avgMetrics, config, avgConfig]}
			})
			//RG end
			
		    //return [QueryData, allMetrics, sumMetrics, avgMetrics, config, avgConfig]
	     })
	}
	else if(primary == "Y" && view_type == "OQ"){
		return AppBrdgViewQuery.aggregate([
			{$match:{"ViewID":view_id}},
			{$unwind:"$Queries"},
			{$match:{$and:[{"Queries.QueryType":{$in:type}},{"Queries.Primary":"Y"}]}}
		])
		.then(function(docs){
			docs.forEach(function(doc){
				if(doc["Queries"]["QueryType"] == "PSIRT"){psirt_flag=1;}
				queryids.push(doc["Queries"]["QueryID"])
			})
			return AppView.findOne({"ViewID":view_id},{"ViewName":1})
			.then(function(view){
				queryids.push(view["ViewName"])
				if(psirt_flag == 1){
					allMetrics=[];
					allMetricsRaw.forEach(function(metric){
						if(Object.keys(flag_metrics["OQ"]).indexOf(metric) > -1){
							config[metric]=flag_metrics["OQ"][metric];
						}
						if(Object.keys(flag_metrics["OQ-PSIRT-avg"]).indexOf(metric) > -1){
							avgConfig[metric]=flag_metrics["OQ-PSIRT-avg"][metric];
						}
						if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
							allMetrics.push(each_metric)
						})}
					})
				}
				return [queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig];
			})
		})
	}
	else if(primary == "Y" && view_type == "Release"){
		type_mod=["BugBackLog","Autons","Teacat","Holes","PSIRT","RG","TeaCat"]
		return AppBrdgViewQuery.aggregate([
		    {$match:{"ViewID":view_id}},
		    {$unwind:"$Queries"},
		    {$match:{$and:[{"Queries.QueryType":{$in:type_mod}},{"Queries.Primary":"Y"}]}}
		])
		.then(function(docs){
			if(docs.length == 0){ return [queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig]}
			else{				
				queryids=[];
				docs.forEach(function(doc){
					if(doc["Queries"]["QueryType"] == "PSIRT"){psirt_flag=1;
					queryids.push(doc["Queries"]["QueryID"])}
					else if(doc["Queries"]["QueryType"] == "RG"){rg_flag=1;}
					else{queryids.push(doc["Queries"]["QueryID"])}
				})
				return AppView.findOne({"ViewID":view_id},{"ViewName":1})
				.then(function(view){
					queryids.push(view["ViewName"])
					if(psirt_flag == 1 && rg_flag == 1){
						allMetrics=[];
						allMetricsRaw.forEach(function(metric){
							if(Object.keys(flag_metrics["Release-PSIRT"]).indexOf(metric) > -1){
								config[metric]=flag_metrics["Release-PSIRT"][metric];
							}
							else if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
								config[metric]=flag_metrics["Release-RG"][metric];
							}
							if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
								avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
							}
							if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
							})}
						})
					}
					else if(psirt_flag == 1 && rg_flag == 0){
						allMetrics=[];
						allMetricsRaw.forEach(function(metric){
							if(Object.keys(flag_metrics["Release-PSIRT"]).indexOf(metric) > -1){
								config[metric]=flag_metrics["Release-PSIRT"][metric];
							}
							if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
							})}
						})
					}
					else if(psirt_flag == 0 && rg_flag == 1){
						allMetrics=[];
						allMetricsRaw.forEach(function(metric){
							if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
								config[metric]=flag_metrics["Release-RG"][metric];
							}
							if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
								avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
							}
							if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
							})}
						})
					}
					return [queryids, allMetrics, sumMetrics, avgMetrics, config, avgConfig];
				})
			}
		})
	}
};

/* queryIdMetrics_new - Internal function
 * Logic to be used to generate allMetrics, sumMetrics, avgMetrics, config, avgConfig
 * for a query_id
 * */
exports.queryIdMetrics_new = function(allMetricsRaw, view_id, query_id, primary, view_type) {
	var allMetrics=[];	var sumMetrics=[]; var avgMetrics=[]; var config={}; var avgConfig={};
	var psirt_flag=0; var rg_flag=0;
	if(view_type == "OQ" && primary == "Y"){
		config = JSON.parse(JSON.stringify(oq_config_o));
		avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "OQ" && primary == "N"){
		config = JSON.parse(JSON.stringify(oq_config_o));
		avgConfig = JSON.parse(JSON.stringify(oq_avg_formulas_o));
	}
	else if(view_type == "Release" && primary == "Y"){
		config = JSON.parse(JSON.stringify(rel_config_o));
		avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	else if(view_type == "Release" && primary == "N"){
		config = JSON.parse(JSON.stringify(rel_config_o));
		avgConfig = JSON.parse(JSON.stringify(rel_avg_formulas_o));
	}
	allMetricsRaw.forEach(function(metric){
		if(Object.keys(avgConfig).indexOf(metric) > -1){avgMetrics.push(metric)}
		else{sumMetrics.push(metric)}
		if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
			allMetrics.push(each_metric)})
		}
	})	
	if(primary == "N" && view_type == "Release"){	
		//RG start
		return AppView.find({"ViewID":view_id, "RgExistsFlag":"Y", "ViewType":"Release"},{"RgExistsFlag":1})
		.then(function(rg_flag){
			if(rg_flag.length != 0){
				var RG_mets=["RG", "RG Backlog", "RG Incoming", "RG Disposed", "RG Actual Incoming", "RG Average Disposal", "RG Current Outstanding", "RG Average Outstanding", "RG MTTR - Average Outstanding", "RG MTTR - Current Outstanding", "Average Age of RG Bugs"]
				var RG_mets_avg=["RG MTTR - Average Outstanding", "RG MTTR - Current Outstanding", "Average Age of RG Bugs"]
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(RG_mets.indexOf(metric) > -1){
						config[metric]=flag_metrics["Release-RG"][metric];
						if(RG_mets_avg.indexOf(metric) > -1){
							avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
						}
						if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
							allMetrics.push(each_metric)
						})}
					}
					else{
						if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
							allMetrics.push(each_metric)
						})}
					}
				})
				return [allMetrics, sumMetrics, avgMetrics, config, avgConfig]
			}
			else{return [allMetrics, sumMetrics, avgMetrics, config, avgConfig]}
		})
		//RG end
	}
	if(primary == "N" && view_type == "OQ"){	
		return [allMetrics, sumMetrics, avgMetrics, config, avgConfig];
	}
	else if(primary == "Y" && view_type == "OQ"){
		return AppBrdgViewQuery.aggregate([
			{$match:{"ViewID":view_id}},
			{$unwind:"$Queries"},
			{$match:{$and:[{"Queries.QueryID":query_id},{"Queries.QueryType":"PSIRT"}]}}
		])
		.then(function(psirt){
			if(psirt.length == 0){return [allMetrics, sumMetrics, avgMetrics, config, avgConfig]}
			else{
				allMetrics=[];
				allMetricsRaw.forEach(function(metric){
					if(Object.keys(flag_metrics["OQ"]).indexOf(metric) > -1){
						config[metric]=flag_metrics["OQ"][metric];
					}
					if(Object.keys(flag_metrics["OQ-PSIRT-avg"]).indexOf(metric) > -1){
						avgConfig[metric]=flag_metrics["OQ-PSIRT-avg"][metric];
					}
					if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
							allMetrics.push(each_metric)
					})}
				})
				return [allMetrics, sumMetrics, avgMetrics, config, avgConfig]
			}
		})
	}
	else if(primary == "Y" && view_type == "Release"){
		return AppBrdgViewQuery.aggregate([
			{$match:{ViewID:view_id}},
			{$unwind:"$Queries"},
			{$match:{$and:[{"Queries.QueryID":query_id},{$or:[{"Queries.QueryType":"PSIRT"},{"Queries.QueryType":"RG"}]}]}}
		])
		.then(function(docs){
			if(docs.length == 0){ return [allMetrics, sumMetrics, avgMetrics, config, avgConfig]}
			else{
				if(docs[0]["Queries"]["QueryType"] == "PSIRT"){
					allMetrics=[];
					allMetricsRaw.forEach(function(metric){
						if(Object.keys(flag_metrics["Release-PSIRT"]).indexOf(metric) > -1){
							config[metric]=flag_metrics["Release-PSIRT"][metric];
						}
						if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
						})}
					})
				}
				else if(docs[0]["Queries"]["QueryType"] == "RG"){
					allMetrics=[];
					allMetricsRaw.forEach(function(metric){
						if(Object.keys(flag_metrics["Release-RG"]).indexOf(metric) > -1){
							config[metric]=flag_metrics["Release-RG"][metric];
						}
						if(Object.keys(flag_metrics["Release-RG-avg"]).indexOf(metric) > -1){
							avgConfig[metric]=flag_metrics["Release-RG-avg"][metric];
						}
						if(config[metric] != undefined){config[metric].split(",").forEach(function(each_metric){
								allMetrics.push(each_metric)
						})}
					})
				}
				return [allMetrics, sumMetrics, avgMetrics, config, avgConfig];
			}				
		})
	}
};

/* avg_sum_calc - Internal function
 * Calculation logic for sum/average metrics
 * HOLES and %DPAI handled differently
 * */
exports.avg_sum_calc = function(avgMetrics, sumMetrics, dataJson, avgConfig, config) {
	var dataJson_mod={}
	avgMetrics.forEach(function(avg_metric){
		if(avgConfig[avg_metric].split(",") != undefined){
			var avg_forml= avgConfig[avg_metric].split(",");			
			if((dataJson[avg_forml[1]] == undefined || dataJson[avg_forml[1]] == 0) &&
					dataJson[avg_forml[0]] != undefined && dataJson[avg_forml[0]] != 0 && avg_forml[2] != "INF" && avg_forml[2] != "INF2"){
				var val=(dataJson[avg_forml[0]]/avg_forml[2])*avg_forml[3];
				dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
				//dataJson_mod[avg_metric] = (val === parseInt(val)) ? val :  (Math.round(val * 100) / 100).toFixed(2);
			}
			else if((dataJson[avg_forml[1]] == undefined || dataJson[avg_forml[1]] == 0) && avg_forml[2] == "INF2"){
				var val=avg_forml[3];
				dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
			}
			else if(dataJson[avg_forml[1]] != undefined && dataJson[avg_forml[1]] != 0
					&& dataJson[avg_forml[0]] != undefined && dataJson[avg_forml[0]] != 0){
				var val=(dataJson[avg_forml[0]]/dataJson[avg_forml[1]])*avg_forml[3];	
				dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
			}
		} 
	})
	sumMetrics.forEach(function(sum_metric){
		if(sum_metric == "HOLES"){
			var holes=(dataJson["CURR_S15_HOLES_BACKLOG"] == undefined ? 0 : dataJson["CURR_S15_HOLES_BACKLOG"])
			+(dataJson["CURR_S6_HOLES_BACKLOG"] == undefined ? 0 : dataJson["CURR_S6_HOLES_BACKLOG"]);
			if(holes != 0){dataJson_mod[sum_metric]=holes};
		}
		else if(sum_metric == "%DPAI"){
			var dpai_1 = dataJson["CR_DENO_CNT"] == undefined ? 1 : (dataJson["CR_CNT"] == undefined ? 0 : dataJson["CR_DENO_CNT"] == 0 ? 1 : (dataJson["CR_CNT"]/dataJson["CR_DENO_CNT"]));
			var dpai_2 = dataJson["SA_DENO_CNT"] == undefined ? 1 : (dataJson["SA_CNT"] == undefined ? 0 : dataJson["SA_DENO_CNT"] == 0 ? 1 : (dataJson["SA_CNT"]/dataJson["SA_DENO_CNT"]));
			var dpai_3 = dataJson["UT_DENO_CNT"] == undefined ? 1 : (dataJson["UT_CNT"] == undefined ? 0 : dataJson["UT_DENO_CNT"] == 0 ? 1 : (dataJson["UT_CNT"]/dataJson["UT_DENO_CNT"]));
			var dpai=(dpai_1+dpai_2+dpai_3)*100/3	
			if(dpai != 0){dataJson_mod[sum_metric]=Math.round(dpai * 100) / 100};
		}
		else if (sum_metric == "% RETI Adoption"){
			var reti_1=dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == undefined ? 100 : (dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == 0 ? 100 : (dataJson["DEV_RETI_ADOPTION_NUM"]/dataJson["DEV_TEST_RETI_ADOPTION_DENO"]*100));
			var reti_2=dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == undefined ? 100 : (dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == 0 ? 100 : (dataJson["TEST_RETI_ADOPTION_NUM"]/dataJson["DEV_TEST_RETI_ADOPTION_DENO"]*100));
			var reti = Math.min(reti_1, reti_2)
			if(reti != 0){dataJson_mod[sum_metric]=Math.round(reti * 100) / 100};
		}
		else if(sum_metric == "%DRE"){
			var dre_1=(dataJson["CURR_IFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_IFDS123_BACKLOG"])
			var dre_2=(dataJson["CURR_IFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_IFDS123_BACKLOG"]) + (dataJson["CURR_CFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_CFDS123_BACKLOG"]);
			if(dre_2 != 0){
				var dre = (dre_1/dre_2)*100;
				if(dre != 0){dataJson_mod[sum_metric]=Math.round(dre * 100) / 100};
			}
			else{dataJson_mod[sum_metric]=100;}
		}
		else if(dataJson[config[sum_metric]] != undefined && dataJson[config[sum_metric]] != 0){
			dataJson_mod[sum_metric]=Math.round(dataJson[config[sum_metric]] * 100) / 100
		}		
	})
	return dataJson_mod;
};

/* avg_sum_calc_trend - Internal function
 * Calculation logic for sum/average metrics
 * HOLES and %DPAI handled differently
 * */
exports.avg_sum_calc_trend = function(avgMetrics, sumMetrics, dataJson, avgConfig, config) {
	var dataJson_mod={}
	avgMetrics.forEach(function(avg_metric){					
		var avg_forml= avgConfig[avg_metric].split(",");
		if((dataJson[avg_forml[1]] == undefined || dataJson[avg_forml[1]] == 0) &&
				dataJson[avg_forml[0]] != undefined && dataJson[avg_forml[0]] != 0 && avg_forml[2] != "INF" && avg_forml[2] != "INF2"){
			var val=(dataJson[avg_forml[0]]/avg_forml[2])*avg_forml[3];
			dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
		}
		else if((dataJson[avg_forml[1]] == undefined || dataJson[avg_forml[1]] == 0) && avg_forml[2] == "INF2"){
			var val=avg_forml[3];
			dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
		}
		else if(dataJson[avg_forml[1]] != undefined && dataJson[avg_forml[1]] != 0
				&& dataJson[avg_forml[0]] != undefined && dataJson[avg_forml[0]] != 0){
			var val=(dataJson[avg_forml[0]]/dataJson[avg_forml[1]])*avg_forml[3];	
			dataJson_mod[avg_metric]=Math.round(val * 100) / 100;
		}
		else{dataJson_mod[avg_metric] = 0}
	})
	sumMetrics.forEach(function(sum_metric){
		if(sum_metric == "HOLES"){
			dataJson_mod[sum_metric]=(dataJson["CURR_S15_HOLES_BACKLOG"] == undefined ? 0 : dataJson["CURR_S15_HOLES_BACKLOG"])
			+(dataJson["CURR_S6_HOLES_BACKLOG"] == undefined ? 0 : dataJson["CURR_S6_HOLES_BACKLOG"])
		}
		else if(sum_metric == "%DPAI"){
			var dpai_1 = dataJson["CR_DENO_CNT"] == undefined ? 1 : (dataJson["CR_CNT"] == undefined ? 0 : dataJson["CR_DENO_CNT"] == 0 ? 1 : (dataJson["CR_CNT"]/dataJson["CR_DENO_CNT"]));
			var dpai_2 = dataJson["SA_DENO_CNT"] == undefined ? 1 : (dataJson["SA_CNT"] == undefined ? 0 : dataJson["SA_DENO_CNT"] == 0 ? 1 : (dataJson["SA_CNT"]/dataJson["SA_DENO_CNT"]));
			var dpai_3 = dataJson["UT_DENO_CNT"] == undefined ? 1 : (dataJson["UT_CNT"] == undefined ? 0 : dataJson["UT_DENO_CNT"] == 0 ? 1 : (dataJson["UT_CNT"]/dataJson["UT_DENO_CNT"]));
			var dpai=(dpai_1+dpai_2+dpai_3)*100/3
			dataJson_mod[sum_metric]=Math.round(dpai * 100) / 100;
		}
		else if (sum_metric == "% RETI Adoption"){
			var reti_1=dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == undefined ? 100 : (dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == 0 ? 100 : (dataJson["DEV_RETI_ADOPTION_NUM"]/dataJson["DEV_TEST_RETI_ADOPTION_DENO"]*100));
			var reti_2=dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == undefined ? 100 : (dataJson["DEV_TEST_RETI_ADOPTION_DENO"] == 0 ? 100 : (dataJson["TEST_RETI_ADOPTION_NUM"]/dataJson["DEV_TEST_RETI_ADOPTION_DENO"]*100));
			var reti = Math.min(reti_1, reti_2)
			dataJson_mod[sum_metric]=Math.round(reti * 100) / 100;
		}
		else if(sum_metric == "%DRE"){
			var dre_1=(dataJson["CURR_IFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_IFDS123_BACKLOG"]);
			var dre_2=(dataJson["CURR_IFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_IFDS123_BACKLOG"]) + (dataJson["CURR_CFDS123_BACKLOG"] == undefined ? 0 : dataJson["CURR_CFDS123_BACKLOG"]);
			if(dre_2 != 0){
				var dre = (dre_1/dre_2)*100;
				dataJson_mod[sum_metric]=Math.round(dre * 100) / 100;
			}
			else{dataJson_mod[sum_metric]=100;}
		}
		else if(dataJson[config[sum_metric]] != undefined && dataJson[config[sum_metric]] != 0){
			dataJson_mod[sum_metric]=Math.round(dataJson[config[sum_metric]] * 100) / 100;
		}
		else{dataJson_mod[sum_metric]=0}
	})
	return dataJson_mod;
};

/* trendFillers - Internal function
 * Make all metrics with null data as 0
 * */
exports.trendFillers = function(listOfDates_m, datesAvaib_m, dataArr, allMetricsRaw) {
	var listOfDates=[]; var datesAvaib=[]; dates=[]; var temp_js={};
	listOfDates_m.forEach(function(ld){listOfDates.push(ld.getTime())})
	datesAvaib_m.forEach(function(da){datesAvaib.push(da.getTime())})
	_.difference(listOfDates,datesAvaib).forEach(function(dd){dates.push(new Date(dd))})
	dates.forEach(function(d){
		temp_js={};
		allMetricsRaw.forEach(function(am){temp_js[am]=0});
		temp_js["Date"]=d;
		dataArr.push(temp_js)
	})
	return dataArr;
};

/* trendDates - Internal function
 * Get the list of dates for a request based on weeks or startdate/enddate
 * */
exports.trendDates = function(weeks2,weeks,date1,date2){
	var startInd; var endInd;
	var dateS = new Date(date1); var dateE = new Date(date2);
	datesData = weeks2[0].WeekEndDates;
	if(weeks != undefined){ return listOfDates = datesData.slice(0,weeks) }
	else if(dateS != undefined && dateE != undefined){
		datesData.forEach(function(item, index){
			if(dateS.getTime() == item.getTime()){endInd = index;}
			if(dateE.getTime() == item.getTime()){startInd= index;}
		})
		if(startInd == -1 || startInd == undefined || endInd == -1 || endInd == undefined){ return []}
		return datesData.slice(startInd,endInd+1);
	}
};

/* monthTrendDates - Internal function
 * Get the list of dates for a request based on startdate/enddate(in yyyy-mm)
 * */
exports.monthTrendDates = function(weeks2,months,date1,date2){
	var startInd; var endInd; var weekEndDates=[]; var weekEndDates_m=[];
	if(months != undefined){
		weeks2[0].WeekEndDates.forEach(function(each_date){weekEndDates.push(each_date.toISOString().slice(0,7))})
		weekEndDates.forEach(function(each_date){weekEndDates_m.push(new Date(each_date+"-5"))})
		startInd = 0; var end_date=weekEndDates_m[0];
		end_date = (new Date(end_date.setMonth(weekEndDates_m[0].getMonth()+1-months)))
		end_date=end_date.toISOString().slice(0,7)
		endInd = weekEndDates.lastIndexOf(end_date);
		return weeks2[0].WeekEndDates.slice(startInd, endInd+1)
	}	
	else {
		weeks2[0].WeekEndDates.forEach(function(each_date){
			weekEndDates.push(each_date.toISOString().slice(0,7))
		})
		startInd = weekEndDates.indexOf(date2);
		endInd = weekEndDates.lastIndexOf(date1);
		return weeks2[0].WeekEndDates.slice(startInd, endInd+1)
	}
};
