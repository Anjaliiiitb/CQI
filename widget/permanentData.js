var util = require('../util');
var http = require('http');
var request = require('request');
var UserWidgetDtls = require('../../../models/widget/user_widget_dtls');
var rp = require('request-promise');
var config = require('config');
var getChartOptionsData = function(trend_req, req, res, submetricData) {
	var date_start = req.query.DateStart;
	var date_end = req.query.DateEnd;
	var weeks = req.query.Weeks;
	var months = req.query.Months;
	var hier = req.query.Hier;
	var actual_res_copy
	if(weeks == undefined && months == undefined) {
		var errors = util.requireFields(req.query, ['DateStart','DateEnd']);
		if (errors) {res.jsend.fail(errors);return;}
		trend_req["DateStart"] = date_start;
		trend_req["DateEnd"] = date_end;
	} else if(months == undefined) {
		trend_req["Weeks"] = parseInt(weeks);
	} else {
		trend_req["Months"] = parseInt(months);
	}
	
	if(hier ==  undefined) {
		url = (trend_req["Primary"] == "N")?'queryIdTrendData':'viewIdTrendData';
	}
	else if (hier == 'Org') {
		url = (trend_req["Primary"] == "N")?'queryIdOrgTrendData':'viewIdOrgTrendData';
		var errors = util.requireFields(req.query, ['UserID']);
		if (errors) {res.jsend.fail(errors);return;}
		trend_req["UserID"] = req.query.UserID;
	} else if (hier == 'Comp') {
		trend_req["Product"] =  req.query.Product;
		trend_req["Component"] =  req.query.Component;
		url = (trend_req["Primary"] == "N")?'queryIdProdCompTrendData':'viewIdProdCompTrendData';
	} else if (hier == 'Dir') {
		url = (trend_req["Primary"] == "N")?'queryIdMgrDirTrendData':'viewIdMgrDirTrendData';
		var director = req.query.Director;
		var manager = req.query.Manager;
		trend_req["Director"] =  req.query.Director;
		trend_req["Manager"]  = req.query.Manager;
	} else if (hier == 'Pin') {
		var types=["BU","Segment","Pin","L4UserID","L5UserID","L6UserID","L7UserID","L8UserID","L9UserID","L10UserID","L11UserID","L12UserID"];
		trend_req["Keys"] = {};
		types.forEach(function(type){
			if(req.query[type] != undefined && req.query[type] != null) 
				trend_req.Keys[type] = req.query[type]; 
		});
		url = (trend_req["Primary"] == "N")?'queryIdPinTrendData':'viewIdPinTrendData';
	} else if(hier == 'MgrComp') {
		url = (trend_req["Primary"] == "N")?'queryIdMgrDirTrendData':'viewIdMgrDirTrendData';
		var director = req.query.Director;
		var manager = req.query.Manager;
		trend_req["Manager"] =  req.query.Manager;
		trend_req["Component"] =  req.query.Component;
		url = (trend_req["Primary"] == "N")?'queryIdMgrCompTrendData':'viewIdMgrCompTrendData';
	} else if(hier == 'DirMgr') {
		var met=[];
		met.push(req.query.ParentMetric);
		trend_req["Director"] =  req.query.Director;
		trend_req["Metrics"] = met ;
		trend_req["ViewType"] =  req.query.ViewType;
		url = (trend_req["Primary"] == "N")?'queryIdDirTrendData ':'viewIdDirTrendData ';
	}
	//Calls trend service and gets data to draw trend
	var auth = "Basic " + new Buffer(config.nodeUrl.user + ":" + config.nodeUrl.pass).toString("base64");
	var trend_req_options = {
	    method: 'POST',
	    uri : config.nodeUrl.url+"api/widget/"+url,
	    body: trend_req,
	    headers: {
	    	"Content-Type":"application/json",
	        "Authorization" : auth
	    },
	    json: true // Automatically stringifies the body to JSON 
	};
	rp(trend_req_options)
    .then(function (result) {
    	if(result.status == "fail" || result.status == "error")
    		res.jsend.fail(result.data);
	    else {
	    	if(trend_req["WidgetID"].indexOf("DirMgr") > -1){
	    		for(var i=0;i<result.data.Data.length;i++){
            		result.data.Data[i].TrendData.sort(function(a, b){
						var keyA = new Date(a.Date),
						 keyB = new Date(b.Date);
						 if(keyA < keyB) return -1;
						 if(keyA > keyB) return 1;
								return 0;
						});
            	}
	    		var newGraphTrend = result, dates =[], mgrname=[];
                var temp={};
                //temp['Dates']=[];
                      for (var i = 0; i < newGraphTrend.data.Data.length; i++) {
                    	  var mgrName=newGraphTrend.data.Data[i].Manager;
                    	  mgrname.push(mgrName);
                		  temp[mgrName]=[];
                    	  for(var j=0;j<newGraphTrend.data.Data[i].TrendData.length;j++){
                    		  temp[mgrName].push(newGraphTrend.data.Data[i].TrendData[j][met]);
                    		  
                    		  if(i==0){
                    			  var dt=((newGraphTrend.data.Data[i].TrendData[j]['Date']).split("T"))[0];
                    			  //temp['Dates'].push(dt);
                    			  dates.push(dt);
                    			  
                    		  }
                    	  }
                       }
                      
                     var chartSeries=[];
					for(var j=0;j<mgrname.length;j++){
							var temp1={
							 'name':mgrname[j],
							 'data':temp[mgrname[j]],
							 'type':"line"
							}
							 chartSeries.push(temp1);
						}
					
					var y_axis = [{
			            title : {
			                text : trend_req["Metrics"]
			            }
			        }];	
					var highchartStr = {
							'credits':{'enabled':true,'href':'http://cqi.cisco.com','text':'cqi.cisco.com'},
							'xAxis':{'categories': dates,'rotation':-45,'align':'right','style':{'fontSize':'13px','fontFamily':'Verdana,sans-serif'}}
							,'yAxis':y_axis,'series':chartSeries,title:{text:''}};
					
				  res.jsend.success(highchartStr);	 
	    	}else{
	    		var chart_series = [], metrics_trend_data = [], dates = [] ;
		    	if(result.data.TrendData.length > 0) {
		    		result.data.TrendData.sort(function(a, b){
					    var keyA = new Date(a.Date),
					        keyB = new Date(b.Date);
					    // Compare the 2 dates
					    if(keyA < keyB) return -1;
					    if(keyA > keyB) return 1;
					    return 0;
					});
		    	};
		    	for(var i=0;i<result.data.TrendData.length;i++){
					dates.push(result.data.TrendData[i].Date.substring(0, 10));
				}
		    	//Set color based on metric name
				var getColor = function(name) {
					if(name.toUpperCase().indexOf("BACKLOG") > -1)
						return '#00CCFF'
					else if(name.toUpperCase().indexOf("INCOMING") > -1)
						return '#cf2030'
					else if(name.toUpperCase().indexOf("DISP") > -1)
						return '#6cc04a'
					else if(name.toUpperCase().indexOf("MTTR") > -1)
						return '#856299'
				};
				//Set graph style based on metric name
				var getType = function(name) {
					if(name.toUpperCase().indexOf('BACKLOG') > -1) {
						return 'line';
					} else if(name.toUpperCase().indexOf('DISP') > -1) {
						return  'column';
					} else if(name.toUpperCase().indexOf('INCOMING') > -1) {
						return 'column';
					} else if(name.toUpperCase().indexOf("MTTR") > -1) {
						return 'line';
					} else
						return 'line';
				};
	    		
	    	
	    	var y_axis = [{
	            title : {
	                text : ''
	            }
	        }];	
			if(trend_req["WidgetID"].indexOf("ReleaseGlance") > -1 || trend_req["WidgetID"].indexOf("OQGlance") > -1) {
				submetricData = trend_req["Metrics"];
				for(var i=0;i<submetricData.length;i++) {
				    metrics_trend_data[i] = [];
				    for(var j=0;j<result.data.TrendData.length;j++){ 
						metrics_trend_data[i].push(result.data.TrendData[j][submetricData[i]]);
				    }
				    var chartSeriesObj = {};
					chartSeriesObj.name = submetricData[i];
					chartSeriesObj.data = metrics_trend_data[i];
					chartSeriesObj.type = getType(submetricData[i])
					chartSeriesObj.color = getColor(submetricData[i]);
					if(submetricData[i].toUpperCase().indexOf("MTTR") > -1 ){
			              chartSeriesObj.yAxis = 1;
			              var ob ={"title": {
			                "min":0,
			                "max":10000,
			                "text": chartSeriesObj.name,
			                "style": {
			                    "color": chartSeriesObj.color
			                }
			              },
			              "labels": {
			            	  "format": "{value}",
			                  "style": {
			                      "color": chartSeriesObj.color
			                  }
			              },
			              "opposite": true};
			              y_axis.push(ob);
			            }
					chart_series.push(chartSeriesObj);
				};
			} else {
				metrics_list = trend_req["Metrics"];
				for(var i=0;i<submetricData.length;i++) {
				    metrics_trend_data[i] = [];
				    for(var j=0;j<result.data.TrendData.length;j++){ 
						metrics_trend_data[i].push(result.data.TrendData[j][metrics_list[i]]);
					};
					var chartSeriesObj = {};
					
					chartSeriesObj.name = submetricData[i].MetricDispName;
					chartSeriesObj.data = metrics_trend_data[i];
					chartSeriesObj.type = submetricData[i].GraphStyle;
					chartSeriesObj.color = submetricData[i].Color;
					if(submetricData[i].SecondaryYaxis == true){
		              chartSeriesObj.yAxis = 1;
		              var ob ={"title": {
		                "min":0,
		                "max":10000,
		                "text": chartSeriesObj.name,
		                "style": {
		                    "color": chartSeriesObj.color
		                }
		              },
		              "labels": {
		                  "style": {
		                      "color": chartSeriesObj.color
		                  }
		              },
		              "opposite": true};
		              y_axis.push(ob);
		            }
				chart_series.push(chartSeriesObj);
				};
			};
			var highchartStr = {
					'credits':{'enabled':true,'href':'http://cqi.cisco.com','text':'cqi.cisco.com'},
					'xAxis':{'categories': dates,'rotation':-45,'align':'right','style':{'fontSize':'13px','fontFamily':'Verdana,sans-serif'}}
					,'yAxis':y_axis,'legend':{'title':{'text':'','style':{'width':790, 'fontWeight': 'normal','fontSize':'12px','colors' : [ '#cf2030', '#6cc04a', '#00CCFF', '#856299' ]}},
					'align':'left','verticalAlign':'bottom','padding':3,'itemMarginTop':3,'itemMarginBottom':3,'itemMarginRight':3,'itemStyle':
					{'lineHeight':'12px'}},'series':chart_series,title:{text:''}};
		  res.jsend.success(highchartStr);
	    }
	    }
    });
}
//Service to return json string to be sent to highchart server to get png image based on View ID
exports.viewIdTrendPermLink = function(req, res) {
	var errors = util.requireFields(req.query, ['ViewID','WidgetID','ParentMetric']);
	if (errors) {
		res.jsend.fail(errors);
	    return;
	}
	var actual_req_copy = req;
	var actual_res_copy = res;
	var widget_id = req.query.WidgetID;
	var view_id = req.query.ViewID;
	var trend_req = {}, result, view_type, url;
	trend_req["WidgetID"] = widget_id;
	trend_req["ViewID"] = parseInt(view_id);
	var parent_metric_name = req.query.ParentMetric;
	//As there is no widget corresponding to OQ glance, using OQGlance as dummy widget name
	if(widget_id.indexOf("OQGlance") > -1) {
		var parent_submetric_mapping = {"CFD":["CFD Incoming [Current Week]","CFD Disposed [Current Week]","CFD Backlog [Current Week]","CFD MTTR [13 Weeks Outstanding]"],
				"IFD":["IFD Incoming [Current Week]","IFD Disposed [Current Week]", "IFD Backlog [Current Week]","IFD MTTR [13 Weeks Outstanding]"],
				"IFD S12":["IFD S12 Incoming [Current Week]", "IFD S12 Backlog [Current Week]", "IFD S12 Disposed [Current Week]", "IFD S12 MTTR [13 Weeks Outstanding]"],
				"CFD S12":["CFD S12 Incoming [Current Week]", "CFD S12 Backlog [Current Week]", "CFD S12 Disposed [Current Week]", "CFD S12 MTTR [13 Weeks Outstanding]"]};
		trend_req["ViewType"] = "OQ"; trend_req["Metrics"] = parent_submetric_mapping[parent_metric_name];
		if(trend_req["Metrics"] == null || trend_req["Metrics"] == undefined) {
			res.jsend.fail("Parent metric not present in widget");
			return;
		}
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
		
	}
	//As there is no widget corresponding to Release glance, using ReleaseGlance as dummy widget name
	else if (widget_id.indexOf("ReleaseGlance") > -1) {
		var parent_submetric_mapping = {"KB":["S123 Incoming","S123 Disposed","S123 Backlog","KB MTTR"],
		                    			"URC":["URC[S123 Simplification] Backlog","URC[S123 Simplification] Incoming","URC[S123 Simplification] Disposed","URC MTTR"],
		                    			"RG":["RG Incoming","RG Disposed","RG Backlog","RG MTTR - Average Outstanding"],
		                    			"CFD":["CFD Incoming","CFD Disposed","CFD Backlog","CFD MTTR - Average Outstanding"]};
		trend_req["ViewType"] = "Release";
		trend_req["Metrics"] = parent_submetric_mapping[parent_metric_name];
		if(trend_req["Metrics"] == null || trend_req["Metrics"] == undefined) {
			res.jsend.fail("Parent metric not present in widget");
			return;
		}
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
		
	} else if(widget_id.indexOf("DirMgr") > -1){//for director manager trend everywhere(per metric)
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
	} else {
		UserWidgetDtls.find({"WidgetID":widget_id})
		.then(function(docs){
			trend_req["ViewType"] = docs[0].ViewType;
			var submetricData = [];
			docs[0].MetricDetails.forEach(function(parent_metric) {
				if(parent_metric.MetricName == parent_metric_name) {
					parent_metric.SubMetric.forEach(function(submetric) {
						//Don't draw trend if "TrendSelected" is false for any submetric
						if(submetric.TrendSelected == undefined || submetric.TrendSelected == true) 
							submetricData.push(submetric);
					})
				}
			});
			if(submetricData.length == 0) {
				res.jsend.fail("Parent metric not present in widget");
			}
			var metrics_list = [];
			submetricData.forEach(function(submetric) {
				metrics_list.push(submetric.MetricName)
			});
			trend_req["Metrics"] = metrics_list;
			return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy, submetricData);
			
		})
		.then(res.jsend.success,  res.jsend.error);
	}
}

//Service to return json string to be sent highchart server (to get png image) based on Query ID
exports.queryIdTrendPermLink = function (req, res) {
	var errors = util.requireFields(req.query, ['ViewID','QueryID','WidgetID','ParentMetric','Primary']);
	if (errors) {
	      res.jsend.fail(errors);
	      return;
	}
	var actual_req_copy = req;
	var actual_res_copy = res;
	var widget_id = req.query.WidgetID;
	var view_id = req.query.ViewID;
	var query_id = req.query.QueryID;
	var primary = req.query.Primary;
	var trend_req = {}, submetricData, result, view_type, url;
	trend_req["WidgetID"] = widget_id;
	trend_req["ViewID"] = parseInt(view_id);
	trend_req["QueryID"] = parseInt(query_id);
	trend_req["Primary"] = primary;
	var parent_metric_name = req.query.ParentMetric;
	
	
	if(widget_id.indexOf("OQGlance") > -1) {
		var parent_submetric_mapping = {"CFD":["CFD Incoming [Current Week]","CFD Disposed [Current Week]","CFD Backlog [Current Week]","CFD MTTR [13 Weeks Outstanding]"],
				"IFD":["IFD Incoming [Current Week]","IFD Disposed [Current Week]", "IFD Backlog [Current Week]","IFD MTTR [13 Weeks Outstanding]"],
				"IFD S12":["IFD S12 Incoming [Current Week]", "IFD S12 Backlog [Current Week]", "IFD S12 Disposed [Current Week]", "IFD S12 MTTR [13 Weeks Outstanding]"],
				"CFD S12":["CFD S12 Incoming [Current Week]", "CFD S12 Backlog [Current Week]", "CFD S12 Disposed [Current Week]", "CFD S12 MTTR [13 Weeks Outstanding]"]};
		trend_req["ViewType"] = "OQ"; trend_req["Metrics"] = parent_submetric_mapping[parent_metric_name];
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
		
	} else if (widget_id.indexOf("ReleaseGlance") > -1) {
		var parent_submetric_mapping = {"KB":["S123 Incoming","S123 Disposed","S123 Backlog","KB MTTR"],
				"URC":["URC[S123 Simplification] Backlog","URC[S123 Simplification] Incoming","URC[S123 Simplification] Disposed","URC MTTR"],
    			"RG":["RG Incoming","RG Disposed","RG Backlog", "RG MTTR - Average Outstanding"],
    			"CFD":["CFD Incoming","CFD Disposed","CFD Backlog","CFD MTTR - Average Outstanding"]};
		trend_req["ViewType"] = "Release";
		trend_req["Metrics"] = parent_submetric_mapping[parent_metric_name];
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
		
	} else if(widget_id.indexOf("DirMgr") > -1){//for director manager trend everywhere(per metric)
		return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy);
	} else {
		UserWidgetDtls.find({"WidgetID":widget_id},{"_id":0})
		.then(function(docs){
			trend_req["ViewType"] = docs[0].ViewType;
			var submetricData = [];
			docs[0].MetricDetails.forEach(function(parent_metric) {
				if(parent_metric.MetricName == parent_metric_name) {
					parent_metric.SubMetric.forEach(function(submetric) {
						//Don't draw trend if "TrendSelected" is false for any submetric
						if(submetric.TrendSelected == undefined || submetric.TrendSelected == true) 
							submetricData.push(submetric);
					})
				}
			});
			if(submetricData.length == 0) {
				res.jsend.fail("Parent metric not present in widget");
			}
			var metrics_list = [];
			submetricData.forEach(function(submetric) {
				metrics_list.push(submetric.MetricName)
			});
			trend_req["Metrics"] = metrics_list;
			return getChartOptionsData(trend_req, actual_req_copy, actual_res_copy, submetricData);
			
		}).then(res.jsend.success,  res.jsend.error);
	}

}

