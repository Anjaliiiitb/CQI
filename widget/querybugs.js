var util = require('../util');
var indicators = require('../../data/widget/indicators');
var FactDefectQueryResultBase = require('../../../models/widget/fact_defect_query_result_base');
var AppView=require('../../../models/widget/app_view');
var AppBrdgViewQuery= require('../../../models/widget/app_brdg_view_query');
var WeekEndDates=require('../../../models/widget/week_end_dates');
var _ = require('underscore');
var Employees=require('../../../models/widget/employees');
var DimDemgrDir=require('../../../models/widget/dim_demgr_dir');
var DimPinHier=require('../../../models/widget/dim_pin_hier');

var getQueryID = function(query_id, view_id, met_indic, rg_flag){
	var QueryID;
	if(view_id != undefined && query_id != undefined && rg_flag==1){
		return AppView.find({"ViewID":view_id, "RgExistsFlag":"Y"}, {_id:1})
				.then(function(check){
					if(check == 0){return query_id}
					else{
						return AppBrdgViewQuery.aggregate([
							{$match:{_id:view_id}},
							{$unwind:"$Queries"},
							{$match:{"Queries.QueryID":query_id}},
							{$project:{"RGQueryID":"$Queries.RGQueryID", "QueryID":"$Queries.QueryID"}}
						])
						.then(function(rg_data){
							return (rg_data[0]["RGQueryID"])
						})	
					}
				})
	}
	else if(view_id != undefined && query_id != undefined){return query_id}
	else if(query_id == undefined){
		return AppBrdgViewQuery.aggregate([
			{$match:{ViewID:view_id}},
			{$unwind:"$Queries"},
			{$match:{$and:[{"Queries.QueryType":{$in:met_indic["QueryType"]}},{"Queries.Primary":"Y"}]}},
			{$group:{_id:null, data:{$addToSet:{"QueryType":"$Queries.QueryType", "QueryID":"$Queries.QueryID"}}}},
			{$project:{_id:0, data:1}}
		])
		.then(function(query_data){
			var query_js={}
			query_data[0]["data"].forEach(function(each){
				query_js[each["QueryType"]]=each["QueryID"]
			})
			QueryID=(Object.keys(query_js).indexOf(met_indic["QueryType"][0]) > -1) ?
					query_js[met_indic["QueryType"][0]] : ((Object.keys(query_js).indexOf(met_indic["QueryType"][1]) > -1) ?
							query_js[met_indic["QueryType"][1]] : 0);
			return QueryID;
		})
	}
};

var query_dates_modif = function(query, weeks, week, ccoinfo){
	for (var q in query){
		if(_.isString(query[q])){
			if(query[q].indexOf("WKE") > -1){
				var startInd; var endInd; var sd; var ed; var sd_q={}; var ed_q={};
				weeks[0].WeekEndDates.forEach(function(item, index){
					if(item.getTime() == new Date(week).getTime()){startInd = index+1;}
				})
				endInd=startInd + Number(query[q].replace("WKE",""))-1;
				ed=weeks[0].WeekEndDates[startInd]; sd=weeks[0].WeekEndDates[endInd]
				sd_q[q]={"$gte":sd}; ed_q[q]={"$lte":ed}; delete query[q];
				if(query["$and"] == undefined){query["$and"]=[sd_q,ed_q];}
				else{query["$and"].push(sd_q,ed_q)}
				//query["$and"]=[sd_q,ed_q];
			}
			else if(query[q].indexOf("WKI") > -1){
				var startInd; var endInd; var sd; var ed; var sd_q={}; var ed_q={};
				weeks[0].WeekEndDates.forEach(function(item, index){
					if(item.getTime() == new Date(week).getTime()){startInd = index;}
				})
				endInd=startInd + Number(query[q].replace("WKI",""))-1;
				ed=weeks[0].WeekEndDates[startInd]; sd=weeks[0].WeekEndDates[endInd]
				sd_q[q]={"$gt":sd}; ed_q[q]={"$lte":ed}; delete query[q];
				if(query["$and"] == undefined){query["$and"]=[sd_q,ed_q];}
				else{query["$and"].push(sd_q,ed_q)}
				//query["$and"]=[sd_q,ed_q];
			}
		}
		else if(Object.keys(query[q])[0] == '$lt' && query[q]['$lt'] == "CCO-60"){
			if(ccoinfo["CcoCommitDate"] == null){query[q]['$lt']=new Date()}
			else{query[q]['$lt']=new Date(ccoinfo["CcoCommitDate"].setMonth(ccoinfo["CcoCommitDate"].getMonth()-2))}
		}
		else if(q == '$or' && query[q][1]["Submitted-on"] != undefined && query[q][1]["Submitted-on"]['$lt'] == "CCO-60"){
			if(ccoinfo["CcoCommitDate"] == null){query[q][1]["Submitted-on"]['$lt']=new Date()}
			else{query[q][1]["Submitted-on"]['$lt']=new Date(ccoinfo["CcoCommitDate"].setMonth(ccoinfo["CcoCommitDate"].getMonth()-2))}
		}
		else if(q == "$and" && query[q][0]["Submitted-on"] != undefined && query[q][0]["Submitted-on"]["$lt"] == 'CRWK-13' && query[q][1]["Submitted-on"]["$gt"] == 'CRWK-104'){
			var curr_week=new Date(week)
			query[q][0]["Submitted-on"]["$lt"]=new Date(curr_week.setDate(curr_week.getDate()-13))
			var curr_week=new Date(week)
			query[q][1]["Submitted-on"]["$gt"]=new Date(curr_week.setDate(curr_week.getDate()-104))
		}
	}
	return query;
};

var hier_query = function(user_id, product, component, director, manager, keys){
	if(user_id != undefined){
		return Employees.aggregate([
		    {'$match':{'Userid':user_id}},
			{'$project':{"Userid":1, "listOfUsers":"$allReportees","_id":0}}
		])
		.then(function(users){
			var user_json;
			if(users.length==0 || users[0].listOfUsers == undefined){user_json = {"DE-manager":user_id}}
			else{user_json= {"DE-manager":{'$in':users[0].listOfUsers}}}
			return user_json;
		})
	}
	else if(product != undefined && component == undefined){return {"Product":product}}
	else if(product == undefined && component != undefined){return {"Component":component}}
	else if(product != undefined && component != undefined){return {"Product":product, "Component":component}}
	else if(director != undefined){
		return DimDemgrDir.aggregate([
			{$match:{"DIR_USERID":director}},
			{$group:{_id:"$DIR_USERID",mgrs:{$addToSet:"$DEMGR_USERID"}}},
		])
		.then(function(mgrs){
			var user_json;
			if(mgrs.length==0 || mgrs[0].mgrs == undefined){user_json = {"DE-manager":director}}
			else{user_json= {"DE-manager":{'$in':mgrs[0].mgrs}}}
			return user_json;
		})
	}
	else if(manager != undefined){ return {"DE-manager":manager}}
	else if(keys != undefined){
    	return DimPinHier.aggregate([
 		    {$match:keys},
 		    {$group:{_id:null,listOfUsers:{$addToSet:"$EmpUserID"}}}
 	    ])
 	    .then(function(users){
 	    	var user_json;
 	    	if(users.length==0 || users[0].listOfUsers == undefined){user_json = {"DE-manager":""}}
 	    	else{user_json= {"DE-manager":{'$in':users[0].listOfUsers}}}
 	    	return user_json;
 	    })
	}
	else{return 0;}
};

exports.getBugsforQuery = function(req, res){
	var errors = util.requireFields(req.body, ['ViewID','Metrics','ViewType','Week']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var query_id=req.body.QueryID; var metrics=req.body.Metrics; var view_type=req.body.ViewType; var week=req.body.Week;
	var view_id=req.body.ViewID;
	//optional params depending on the hierarchy
	var user_id=req.body.UserID; var product=req.body.Product; var component=req.body.Component; var director=req.body.Director;
	var manager=req.body.Manager; var keys=req.body.Keys;
	var Indicators=JSON.parse(JSON.stringify(indicators));
	var met_indic=Indicators[view_type][metrics[0]];
	var rg_flag=0; var RG_metrics=["RG Backlog", "RG Incoming", "RG Disposed", "RG MTTR - Average Outstanding", "RG MTTR - Current Outstanding", "RG Actual Incoming", "RG Average Disposal", "RG Current Outstanding", "RG Average Outstanding", "Average Age of RG Bugs", "RG"]
	if(met_indic == undefined || Object.keys(met_indic).length == 0){res.jsend.success("N"); return;}
	AppView.find({$and:[{"ViewID":view_id},{"ActiveFlag":"Y"}]},{"CcoCommitDate":1})
    .then(function(inactive){
    	if(inactive.length == 0){res.jsend.fail("View Invalid or Inactive"); return;}
    	else{
			var tasks=[];
			if(RG_metrics.indexOf(metrics[0]) > -1){rg_flag=1}
			tasks.push(getQueryID(query_id, view_id, met_indic, rg_flag))
			Promise.all(tasks)
			.then(function(QueryID){
				var fields=met_indic["Fields"];
				var proj_stg1={}; var group_stg1={};
				for (var field in fields){
					proj_stg1[fields[field]]=1;
					group_stg1[fields[field]]="$"+fields[field];
				}
				proj_stg1["DefectID"]="$_id.DefectID"; proj_stg1["WeekEndDate"]="$_id.WeekEndDate"; proj_stg1["_id"]=0;
				group_stg1["DefectID"]="$DefectID";

				if(met_indic["Weeks"] == '1WK' && met_indic["Metrics"] == '1M'){
					WeekEndDates.find({},{_id:0})
					.then(function(weeks){
						var mod_query=query_dates_modif(met_indic["Query"], weeks, week, inactive[0]);
						var init_query={}; init_query["_id.QueryID"]=QueryID[0]; init_query["_id.WeekEndDate"]=new Date(week);
						var tasks2=[];
						tasks2.push(hier_query(user_id, product, component, director, manager, keys));
						Promise.all(tasks2)
						.then(function(enh_query){
							if(enh_query[0] != 0){
								Object.keys(enh_query[0]).forEach(function(key){init_query[key]=enh_query[0][key]})
							}
							var cursor = FactDefectQueryResultBase.aggregate([
     					                     {$match:{$and:[init_query, mod_query]}},
     					                     {$project:proj_stg1},
     					             		 {$group:{_id:{"WeekEndDate":"$WeekEndDate"},data:{$addToSet:group_stg1}}},
     					                     {$project:{_id:0, "WeekEndDate":"$_id.WeekEndDate", data:1} }
     					                 ])
     					                 .cursor({batchSize: 1000})
     					                 .exec();
     					    cursor.toArray(function(err,docs) {
     					    	if(err){res.jsend.error(err); return;}
     					    	res.jsend.success(docs)
     					    })
						})
					})
				}
				else if(met_indic["Weeks"] != '1WK' && met_indic["Metrics"] == '1M'){
					WeekEndDates.find({},{_id:0})
					.then(function(weeks){
						var startInd;
						weeks[0].WeekEndDates.forEach(function(item, index){
							if(item.getTime() == new Date(week).getTime()){startInd = index;}
						})
						var weeks_t=Number(met_indic["Weeks"].replace("WK",""));
						var weekEndDates=(weeks_t == 1)?[new Date(week)] : weeks[0].WeekEndDates.slice(startInd+1,startInd+weeks_t+1);
						var mod_query=query_dates_modif(met_indic["Query"], weeks, week, inactive[0])
						var init_query={}; init_query["_id.QueryID"]=QueryID[0]; init_query["_id.WeekEndDate"]={"$in":weekEndDates};
						var tasks2=[];
						tasks2.push(hier_query(user_id, product, component, director, manager, keys));
						Promise.all(tasks2)
						.then(function(enh_query){
							if(enh_query[0] != 0){
								Object.keys(enh_query[0]).forEach(function(key){init_query[key]=enh_query[0][key]})
							}
							var cursor = FactDefectQueryResultBase.aggregate([
     			     	                     {$match:{$and:[init_query, mod_query]}},
     			     	                     {$project:proj_stg1},
     			     	             		 {$group:{_id:{"WeekEndDate":"$WeekEndDate"},data:{$addToSet:group_stg1}}},
     			     	                     {$project:{_id:0, "WeekEndDate":"$_id.WeekEndDate", data:1} }
     			     	                 ])
     			     	                 .cursor({batchSize: 1000})
     			     	                 .exec();
     			     	    cursor.toArray(function(err,docs) {
     			     	    	if(err){res.jsend.error(err); return;}
     			     	    	res.jsend.success(docs)
     			     	    })
						})
					})
				}
				else if(met_indic["Metrics"] == '2M'){
					WeekEndDates.find({},{_id:0})
					.then(function(weeks){
						var startInd;
						weeks[0].WeekEndDates.forEach(function(item, index){
							if(item.getTime() == new Date(week).getTime()){startInd = index;}
						})
						var weeks_tN=Number(met_indic["WeeksN"].replace("WK",""));
						var weekEndDatesN=(weeks_tN == 1)?[new Date(week)] : weeks[0].WeekEndDates.slice(startInd+1,startInd+weeks_tN+1)
						data={"dataN":[], "dataD":[]}
						var mod_queryN=query_dates_modif(met_indic["QueryN"], weeks, week, inactive[0])
						var init_queryN={}; init_queryN["_id.QueryID"]=QueryID[0]; init_queryN["_id.WeekEndDate"]={"$in":weekEndDatesN};
						var tasks2=[];
						tasks2.push(hier_query(user_id, product, component, director, manager, keys));
						Promise.all(tasks2)
						.then(function(enh_queryN){
							if(enh_queryN[0] != 0){
								Object.keys(enh_queryN[0]).forEach(function(key){init_queryN[key]=enh_queryN[0][key]})
							}
							var cursorN = FactDefectQueryResultBase.aggregate([
      			                 {$match:{$and:[init_queryN,mod_queryN]}},
      			                 {$project:proj_stg1},
      			         		 {$group:{_id:{"WeekEndDate":"$WeekEndDate"},data:{$addToSet:group_stg1}}},
      			                 {$project:{_id:0, "WeekEndDate":"$_id.WeekEndDate", data:1} }
      			            ])
      			            .cursor({batchSize: 1000})
      			            .exec();
      			     	    cursorN.toArray(function(err,docsN) {
      			     	    	if(err){res.jsend.error(err); return;}
      			     	    	data["dataN"]=docsN;
      							var weeks_tD=Number(met_indic["WeeksD"].replace("WK",""));
      							var weekEndDatesD=(weeks_tD == 1)?[new Date(week)] : weeks[0].WeekEndDates.slice(startInd+1,startInd+weeks_tD+1);
      							var mod_queryD=query_dates_modif(met_indic["QueryD"], weeks, week, inactive[0])

      							var init_queryD={}; init_queryD["_id.QueryID"]=QueryID[0]; init_queryD["_id.WeekEndDate"]={"$in":weekEndDatesD};
								var tasks3=[];
								tasks3.push(hier_query(user_id, product, component, director, manager, keys));
								Promise.all(tasks3)
								.then(function(enh_queryD){
									if(enh_queryD[0] != 0){
										Object.keys(enh_queryD[0]).forEach(function(key){init_queryD[key]=enh_queryD[0][key]})
									}
	      							var cursorD = FactDefectQueryResultBase.aggregate([
	      			                       {$match:{$and:[init_queryD,mod_queryD]}},
	      			                       {$project:proj_stg1},
	      			               		   {$group:{_id:{"WeekEndDate":"$WeekEndDate"},data:{$addToSet:group_stg1}}},
	      			                       {$project:{_id:0, "WeekEndDate":"$_id.WeekEndDate", data:1} }
	      			                   ])
	      			                   .cursor({batchSize: 1000})
	      			                   .exec();
	      			           	    cursorD.toArray(function(err,docsD) {
	      			           	    	if(err){res.jsend.error(err); return;}
	      			           	    	data["dataD"]=docsD
	      			           	    	res.jsend.success(data)
	      			           	    })
								})
      			     	    })
						})
					})
				}
			})
    	}
    })
};
