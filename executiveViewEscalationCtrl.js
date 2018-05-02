define(['app'], function(app ) {

	app.controller("executiveViewEscalationCtrl", [ '$scope','$route','$location','relViewService','executiveViewService',  '$rootScope','globalService','$uibModal',
		function( $scope,$route,$location,relViewService,executiveViewService, $rootScope ,globalService,$uibModal ) {

		$scope.tooltip = {
            "backgroundColor" : "#e5e5e5",
            "crosshairs" : [ {
                "color" : "grey",
                "dashStyle" : "shortdot",
                "width" : 1.5
            }, false, true ],
            "shared" : true,
            "valueSuffix" : "Bugs",
            "width" : "100%",
                    formatter : function() {
                        var s = '<span style="color:backlogack; font-weight:bold;">'+ this.x + '<span><br>';
                $.each(this.points,function(i, point) {
                                    if (point.series.name == "Incoming")
                                        spanStyle = 'color:#cf2030; font-weight:bold;';
                                    else if (point.series.name == "Closed")
                                        spanStyle = 'color:#83c341; font-weight:bold;';
                                    else if (point.series.name == "Outstanding")
                                        spanStyle = 'color:#00CCFF; font-weight:bold;';
                                    
                                if(typeof spanStyle != 'undefined')
                                  s += ('<span style="'+ spanStyle+ '">'+ point.series.name+ ' : '+ point.y + '<span><br>');
                                });
                    return s;
                                        }
  };
		$scope.CurrentMQFlag='N';
		$scope.isLastMonth=true;
		
		if($location.search().month)
			{
			//console.log("found in location"+$location.search().month)
			if($location.search().month=='current')
				$scope.CurrentMQFlag='Y';
				$scope.isLastMonth=false;
			}
		else
			{
			
			$scope.CurrentMQFlag='N';
			$scope.isLastMonth=true;
			}
		//console.log("flag is"+$scope.CurrentMQFlag)
		$scope.loadCAPPrimaryTrendGraph = function(BE,BSE,PF,BU,Segment,Pin){
			if(globalService.beBUType == "BE") {
				if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,
					"TrendType":$scope.intervalCAPPrimary,
					"EscType":[
						"CAP Primary"
						]
			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"TrendType":$scope.intervalCAPPrimary,
						"EscType":[
							"CAP Primary"
							]

				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF,
						"TrendType":$scope.intervalCAPPrimary,
						"EscType":[
							"CAP Primary"
							]

				};
			}
			}
			else
				{
				if(Segment == 'undefined' && Pin =='undefined' )
				{charParms = { 	
						"BU": BU,
						"TrendType":$scope.intervalCAPPrimary,
						"EscType":[
							"CAP Primary"
							]


				};
				}else if(Pin =='undefined'){
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"TrendType":$scope.intervalCAPPrimary,
							"EscType":[
								"CAP Primary"
								]
					};
				}else if(Pin !='undefined' && PF =='undefined'){
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"Pin":Pin,
							"TrendType":$scope.intervalCAPPrimary,
							"EscType":[
								"CAP Primary"
								]
					};
				}else{
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"Pin":Pin,
							"PF":PF,
							"TrendType":$scope.intervalCAPPrimary,
							"EscType":[
								"CAP Primary"
								]
					};
				}
				}

		/*	if(globalService.beBUType == "BE") {
					filterObj["BE"] = $location.search().BE;
					filterObj["BSE"] = $location.search().BSE;
					filterObj["PF"] = $location.search().BSE;
			          } else if(globalService.beBUType == "BU") {
				    	  filterObj["BU"] = $location.search().BU;
				    	  filterObj["Segment"] = $location.search().Segment;
			          }*/
			charParms.CurrentMQFlag=$scope.CurrentMQFlag;
			executiveViewService.getCAPTrendGraphData(charParms).success(function(graphData) {
				//console.log("length is"+JSON.stringify(graphData))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
				//$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 
		
		$scope.loadBEMSTrendGraph = function(BE,BSE,PF,BU,Segment,Pin){
			if(globalService.beBUType == "BE") {
				
				
				if(BSE == 'undefined' && PF =='undefined' )
				{charParms = { 	
						"BE": BE,
						"TrendType":$scope.intervalBEMS,
						"EscType":[
							"BEMS"
							]


				};
				}else if(PF =='undefined'){
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]

					};
				}else{
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"PF":PF,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]

					};
				}
				}
				else
					{
					if(Segment == 'undefined' && Pin =='undefined' )
					{charParms = { 	
							"BU": BU,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]


					};
					}else if(Pin =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"TrendType":$scope.intervalBEMS,
								"EscType":[
									"BEMS"
									]
						};
					}else if(Pin !='undefined' && PF =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"TrendType":$scope.intervalBEMS,
								"EscType":[
									"BEMS"
									]
						};
					}else{
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"PF":PF,
								"TrendType":$scope.intervalBEMS,
								"EscType":[
									"BEMS"
									]

						};
					}
					}
			

			charParms.CurrentMQFlag=$scope.CurrentMQFlag;
			executiveViewService.getBEMSTrendGraphData(charParms).success(function(graphData) {
				//console.log("length is"+JSON.stringify(graphData))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
			//	$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotBEMSTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotBEMSTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 

		$scope.loadRRRTrendGraph = function(BE,BSE,PF,BU,Segment,Pin){
if(globalService.beBUType == "BE") {
				
				
				if(BSE == 'undefined' && PF =='undefined' )
				{charParms = { 	
						"BE": BE,
						"TrendType":$scope.intervalRRR,
						"EscType":[
							"RRR"
							]


				};
				}else if(PF =='undefined'){
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]

					};
				}else{
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"PF":PF,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]

					};
				}
				}
				else
					{
					if(Segment == 'undefined' && Pin =='undefined' )
					{charParms = { 	
							"BU": BU,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]


					};
					}else if(Pin =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"TrendType":$scope.intervalRRR,
								"EscType":[
									"RRR"
									]
						};
					}else if(Pin !='undefined' && PF =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"TrendType":$scope.intervalRRR,
								"EscType":[
									"RRR"
									]
						};
					}else{
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"PF":PF,
								"TrendType":$scope.intervalRRR,
								"EscType":[
									"RRR"
									]

						};
					}
					}
			
			

				charParms.CurrentMQFlag=$scope.CurrentMQFlag;
			executiveViewService.getRRRTrendGraphData(charParms).success(function(graphData) {
				//console.log("length is"+JSON.stringify(graphData))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
			//	$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotRRRTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotRRRTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 
		$scope.loadEscalTable=function(BE,BSE,PF,BU,Segment,Pin){
			//console.log("called")
				if(globalService.beBUType == "BE") {
					if(BSE == 'undefined' && PF =='undefined' ){
						charParms = { 	
							"BE": BE,
						};
					}else if(PF =='undefined'){
						charParms = { 	
								"BE": BE,
								"BSE":BSE,
						};
					}else{
						charParms = { 	
								"BE": BE,
								"BSE":BSE,
								"PF":PF,
						};
					}
				}else{
					if(Segment == 'undefined' && Pin =='undefined' )
						{charParms = { 	
								"BU": BU,
	
						};
					}else if(Pin =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
						};
					}else if(Pin !='undefined' && PF =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
						};
					}else{
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"PF":PF,
						};
					}
				}
				charParms.CurrentMQFlag=$scope.CurrentMQFlag;
			executiveViewService.getEscalTableData(charParms).success(function(graphData) {
				var jsonObj=[],jsonObj_cap=[];
				for(var i=0;i<graphData.data.length;i++){
					if(graphData.data[i].Complete!=undefined){
						jsonObj.push({
							name:graphData.data[i].Type,
							in_lfq:graphData.data[i].Complete['LastFullQtr_Incoming'],
							in_qq:graphData.data[i].Complete['QoQ_Incoming'],
							in_mm:graphData.data[i].Complete['MoM_Incoming'],
							in_yy:graphData.data[i].Complete['YoY_Incoming'],
							QoQ_In_trend:graphData.data[i].Complete['QoQ_Incoming_trend'],
							YoY_In_trend:graphData.data[i].Complete['YoY_Incoming_trend'],
							MoM_In_trend:graphData.data[i].Complete['MoM_Incoming_trend'],
						
							closed_lfq:graphData.data[i].Complete['LastFullQtr_Closed'],
							closed_qq:graphData.data[i].Complete['QoQ_Closed'],
							closed_mm:graphData.data[i].Complete['MoM_Closed'],
							closed_yy:graphData.data[i].Complete['YoY_Closed'],
							QoQ_Close_trend:graphData.data[i].Complete['QoQ_Closed_trend'],
							MoM_Close_trend:graphData.data[i].Complete['MoM_Closed_trend'],
							YoY_Close_trend:graphData.data[i].Complete['YoY_Closed_trend'],
							
							out_lfq:graphData.data[i].Complete['LastFullQtr_Outstanding'],
							out_qq:graphData.data[i].Complete['QoQ_Outstanding'],
							out_mm:graphData.data[i].Complete['MoM_Outstanding'],
							out_yy:graphData.data[i].Complete['YoY_Outstanding'],
							QoQ_Out_trend:graphData.data[i].Complete['QoQ_Outstanding_trend'],
							MoM_Out_trend:graphData.data[i].Complete['MoM_Outstanding_trend'],
							YoY_Out_trend:graphData.data[i].Complete['YoY_Outstanding_trend']
						});
						//console.log("json till date "+JSON.stringify(jsonObj))
					}else{
						jsonObj.push({
							name:graphData.data[i].Type
						});
					}
					if(graphData.data[i].Type=='CAP' && graphData.data[i].Current!=undefined ){
						jsonObj_cap.push({
							name:"CAP",
							in_cap:graphData.data[i].Current['Incoming'],
							out_cap:graphData.data[i].Current['Outstanding'],
							closed_cap:graphData.data[i].Current['Closed'],
						});
					}
					if(graphData.data[i].Type=='CAP(Primary)' && graphData.data[i].Current!=undefined){
						jsonObj_cap.push({
							name:"CAP(Primary)",
							in_cap:graphData.data[i].Current['Incoming'],
							out_cap:graphData.data[i].Current['Outstanding'],
							closed_cap:graphData.data[i].Current['Closed'],
						
						});
					}
				}
				//cap bu primary data
				/*jsonObj.push({
					name:"CAP (BU as primary)"
				});*/
				$scope.escalGrid.data=jsonObj;
				//$scope.escalGrid_cap.data=jsonObj_cap;
			});
			charParms.CurrentMQFlag=$scope.CurrentMQFlag;
			executiveViewService.getEscalTableDataCap(charParms).success(function(graphData) {
				var jsonObj_cap=[];
				angular.forEach(graphData.data, function(value, key){
					jsonObj_cap.push({
						name:value.Type,
						in_cap:value.Current['Incoming'],
						out_cap:value.Current['Outstanding'],
						closed_cap:value.Current['Closed'],
					});
				 });
				$scope.escalGrid_cap.data=jsonObj_cap;
			});
		};
		
		$scope.plotCAPTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
				{
					"name": "Incoming",
					"data": inc_cnt.length==0?[0]:inc_cnt,
					type: "column",
					"color": "#cf2030"
				},
				{
					"name": "Closed",
					"data": closed_cnt.length==0?[0]:closed_cnt,
					type: "column",
					"color": "#6cc04a"
				},
				{
				
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",
				"color": "#00CCFF",
				"zIndex": 100
			},
		
		

			];
			$scope.chartConfigCAPTrend = {
					options: {
					  tooltip : $scope.tooltip,
						chart: {
						  events: {
				            click: function (event) {
				             window.open(
				                 'http://capbi.cisco.com',
				                 '_blank' // <- This is what makes it open in a new window.
				               );
				             
				            }},
							type: 'column',

						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            itemDistance: 5,
					             
					             itemStyle: {
					                 width: '280px',
					                 overflow: 'hidden',
					                 textOverflow: 'ellipsis',
					                 fontSize: '11px',
					                 fontWeight: 'normal',
					                 color: '#666666'
					             },
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					           // itemWidth:100,
					            labelFormatter: function() {
					            	
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						plotOptions: {
							line: {
								allowPointSelect: true,
								allowOverlap:true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
						dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{
						allowDecimals: false,
						title: {
							text: $scope.label
						},
					}
					],

					series: $scope.chartSeries,

					title: {
						text: 'CAP (Primary)',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
								dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},

							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip: {
						valueSuffix: 'Bugs',
						shared: true,
						crosshairs: [{
							width: 1.5,
							dashStyle: 'shortdot',
							color: 'grey'
						}, false, true],
						width: '100%',
						backgroundColor: "#e5e5e5",
						formatter: function() {

							var s = '<span style="color:backlogack;font-weight:bold;">' + this.x + '<span><br>';
							$.each(this.points,
									function(i, point) {
								if (point.series.name == "Incoming")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Outgoing")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Backlog")
									spanStyle = 'font-weight:bold;';
								s += ('<span style="' + spanStyle + '">' +
										point.series.name +
										' : ' +
										parseInt(
												point.y)
												.toLocaleString() + '<span><br>');
							});

							return s;
						},
						shared: true,
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};
		$scope.plotRRRTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
		
			{
				"name": "Incoming",
				"data": inc_cnt.length==0?[0]:inc_cnt,
				type: "column",
				"color": "#cf2030"
			},
			{
				"name": "Closed",
				"data": closed_cnt.length==0?[0]:closed_cnt,
				type: "column",
				"color": "#6cc04a"
			},
			{
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",
				"color": "#00CCFF",
				"zIndex": 100

			},

			];
			$scope.chartConfigRRRTrend = {
			    tooltip:{shared:true},
					options: {
					  tooltip : $scope.tooltip,
						chart: {
							type: 'column',

						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					            itemDistance: 5,
                                
                                itemStyle: {
                                    width: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '11px',
                                    fontWeight: 'normal',
                                    color: '#666666'
                                },
					           // itemWidth:100,
					            labelFormatter: function() {
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						  		plotOptions: {
						  		line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
						dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{
						allowDecimals: false,
						title: {
							text: $scope.label
						},
					}
					],

					series: $scope.chartSeries,
			title: {
						text: 'Regional Risk Register (RRR)',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
								/*dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},
*/
							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip : {
						valueSuffix : 'Bugs',
						valueDecimals: 2,
						crosshairs : [ {
							width : 1.5,
							dashStyle : 'shortdot',
							color : 'grey'
						}, false, true ],

						width : '100%',
						backgroundColor : "#e5e5e5",
						height : '50%',
						
						shared : true
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};
		/*Highcharts.setOptions({
			tooltip : {
						"backgroundColor" : "#e5e5e5",
						"crosshairs" : [ {
							"color" : "grey",
							"dashStyle" : "shortdot",
							"width" : 1.5
						}, false, true ],
						"shared" : true,
						"valueSuffix" : "Bugs",
						"width" : "100%",
								formatter : function() {
									var s = '<span style="color:backlogack; font-weight:bold;">'+ this.x + '<span><br>';
							$.each(this.points,function(i, point) {
												if (point.series.name == "Incoming")
													spanStyle = 'color:#cf2030; font-weight:bold;';
												else if (point.series.name == "Closed")
													spanStyle = 'color:#83c341; font-weight:bold;';
												else if (point.series.name == "Outstanding")
													spanStyle = 'color:#00CCFF; font-weight:bold;';
												
												s += ('<span style="'+ spanStyle+ '">'+ point.series.name+ ' : '+ point.y + '<span><br>');
											});
								return s;
													}
			  },
		});*/
		$scope.plotBEMSTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			//console.log("here")
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
				{
					"name": "Incoming",
					"data": inc_cnt.length==0?[0]:inc_cnt,
					type: "column",
					"color": "#cf2030"
				},
				{
					"name": "Closed",
					"data": closed_cnt.length==0?[0]:closed_cnt,
					type: "column",
					"color": "#6cc04a"
				},
				{
				
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",

				"color": "#00CCFF",
				"zIndex": 100

			},
		
		

			];
			$scope.chartConfigBEMSTrend = {
					options: {
					  tooltip : $scope.tooltip,
						chart: {
						  events: {
                            click: function (event) {
                             window.open(
                                 'http://bemsbi.cisco.com',
                                 '_blank' // <- This is what makes it open in a new window.
                               );
                             
                            }},
							type: 'column',

						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					            itemDistance: 5,
                                
                                itemStyle: {
                                    width: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '11px',
                                    fontWeight: 'normal',
                                    color: '#666666'
                                },
					           // itemWidth:100,
					            labelFormatter: function() {
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						plotOptions: {
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
					/*	dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},*/
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{
						allowDecimals: false,
						title: {
							text: $scope.label
						},
					}
					],

					series: $scope.chartSeries,

					title: {
						text: 'Business Escalation Management Solution (BEMS)',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
							/*	dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},*/

							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip: {
						valueSuffix: 'Bugs',
						shared: true,
						crosshairs: [{
							width: 1.5,
							dashStyle: 'shortdot',
							color: 'grey'
						}, false, true],
						width: '100%',
						backgroundColor: "#e5e5e5",
			/*			formatter: function() {

							var s = '<span style="color:backlogack;font-weight:bold;">' + this.x + '<span><br>';
							$.each(this.points,
									function(i, point) {
								if (point.series.name == "Incoming")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Outgoing")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Backlog")
									spanStyle = 'font-weight:bold;';
								s += ('<span style="' + spanStyle + '">' +
										point.series.name +
										' : ' +
										parseInt(
												point.y)
												.toLocaleString() + '<span><br>');
							});

							return s;
						},*/
						shared: true,
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};


		$scope.changeDataLabelPopup = function(id, bool){
			if (id == 'CAPTrend') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigCAPTrendPopup = angular.copy($scope.chartConfigCAPTrend);
				if (typeof $scope.chartConfigCAPTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigCAPTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					//$scope.chartConfigCAPTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigCAPTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigCAPTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
				/*      var chart = Highcharts.chart('srGraphContainerFullSreen',  $scope.chartConfigCAPTrendPopup);
                  console.log(JSON.stringify($scope.chartConfigCAPTrendPopup))
					chart.reflow();	*/
			}else if (id == 'RRRPINGraph') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigRRRTrendPopup = angular.copy($scope.chartConfigRRRTrend);
				if (typeof $scope.chartConfigRRRTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigRRRTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					// $scope.chartConfigRRRTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigRRRTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigRRRTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
			}else if (id == 'BEMSGraph') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigBEMSTrendPopup = angular.copy($scope.chartConfigBEMSTrend);
				if (typeof $scope.chartConfigBEMSTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigBEMSTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					$scope.chartConfigBEMSTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigBEMSTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigBEMSTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
			}
		};
		$scope.changeMonth = function (monthType)
		{
			//console.log("called"+monthType);
			if(monthType=="completed")
				$scope.CurrentMQFlag='N';
			else
				$scope.CurrentMQFlag='Y';
			 $location.search('month', monthType);
			//$route.reload();
			
			
		}
		$scope.openChart = function(id) {
			$scope.chartPopup = id;
			modalInstance = $uibModal.open({
				animation: false,
				windowClass: 'the-modal',
				templateUrl: 'fullScreenChart.html',
				size: 'lg',
				scope: $scope
			});
			if (id == 'CAPTrend') {

				$scope.chartConfigCAPTrendPopup = $scope.chartConfigCAPTrend;
				$scope.selectedYNSR = 'N';

			}
			else if (id == 'RRRPINGraph') {

				$scope.chartConfigRRRTrendPopup = $scope.chartConfigRRRTrend;
				$scope.selectedYNSR = 'N';

			}
			else if (id == 'BEMSGraph') {

				$scope.chartConfigBEMSTrendPopup = $scope.chartConfigBEMSTrend;
				$scope.selectedYNSR = 'N';

			}

		}; 
		
		
		/*to go back to selected BE/BU when BSE/Segment is selected*/
	    $scope.goBackToSelected = function(level){
	   	  if(level == 'Level1'){
	   		  if($location.search().BU != undefined)
	   		$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$location.search().BU,false);
	   		 else if($location.search().BE != undefined)
	        		$scope.navigateTo('executiveViewEscalation',false,'.htm?BE='+$location.search().BE,false);
	         }
	   	 else if(level == 'Level2'){
	   		if($location.search().BU != undefined)
	        		$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$location.search().BU+'&Segment='+$location.search().Segment,false);
	   			 else  if($location.search().BE != undefined)
	   				 $scope.navigateTo('executiveViewEscalation',false,'.htm?BE='+$location.search().BE+'&BSE='+$location.search().BSE,false);
	              
	   	 }else if(level == 'Level3'){
	   		$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$location.search().BU+'&Segment='+$location.search().Segment+'&Pin='+$location.search().Pin,false);
	   			
	              
	   	 }
	    }

		$scope.closeChart = function() {
			modalInstance.dismiss('cancel');
		};
		//code for table grid starts
		
			$scope.escalGrid = {

					enableSorting: true,
					enableFiltering: false,
					showTreeExpandNoChildren: true,
					enableColumnResizing: true,
					enableColumnMenus: false,
					enableVerticalScrollbar: 0,
					enableHorizontalScrollbar: 0,
					enableColumnResize: true,
					enableColumnReordering: true,
					showColumnFooter: false,
					headerTemplate: '<div role="rowgroup" class="ui-grid-header text-center">  <div class="ui-grid-top-panel"> <div class="ui-grid-header-viewport"> <div class="ui-grid-header-canvas header-column-font-style"> <div class="ui-grid-header-cell-wrapper " ng-style="colContainer.headerCellWrapperStyle()"> <div role="row" class="ui-grid-header-cell-row row-style"> <div class="ui-grid-header-cell ui-grid-clearfix ui-grid-category " ng-repeat="cat in grid.options.category" ng-if="cat.visible && (colContainer.renderedColumns | filter:{ colDef:{category: cat.name} }).length > 0"> <div ng-if="cat.showCatName === true" class="brdBtm">  {{cat.name}} </div> <span ng-if="cat.showCatName !== true">&nbsp;</span> <div class="ui-grid-header-cell ui-grid-clearfix"  ng-repeat="col in colContainer.renderedColumns | filter:{ colDef:{category: cat.name} }" ui-grid-header-cell col="col" render-index="$index">                            </div> </div>  <div class="ui-grid-header-cell ui-grid-clearfix" ng-if="col.colDef.category === undefined" ng-repeat="col in colContainer.renderedColumns track by col.uid" ui-grid-header-cell col="col" render-index="$index">  </div> </div> </div> </div>  </div> </div></div>',
					category: [{
						name: 'Incoming',
						visible: true,
						showCatName: true
					}, {
						name: 'Closed',
						visible: true,
						showCatName: true
					},
					{
						name: 'Outstanding',
						visible: true,
						showCatName: true
					}],
					columnDefs :
						[{
							field: 'name',
							displayName: '',
							headerCellClass: "text-center",
							cellTemplate:'<div class="ui-grid-cell-contents" ng-click="grid.appScope.dummy(row.entity.name)"><a href="">{{row.entity.name}}</a></div>',
						//	width: "10%",
							pinnedLeft: true,
						
							/*  footerCellTemplate: "<div class='ui-grid-cell-contents'>Total</div>",*/
						},
						{
							field: 'in_lfq',
							displayName: 'Last Full Qtr',
							headerCellClass: "text-center",
							cellClass: 'text-right',
							headerCellTemplate:'<div class="ui-grid-cell-contents"><span>Last Full Qtr</span></div>',
							category: 'Incoming',
							type: 'number',
							cellFilter: 'nullToZeroFilter',
							enableSorting: true,
							enableCellEdit: false,
						},
						{
							field: 'in_mm',
							displayName: 'M/M',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>M/M</span></div>',
							category: 'Incoming',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.in_mm}}</span>"+"<span class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.MoM_In_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'in_qq',
							displayName: 'Q/Q',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Q/Q</span></div>',
							category: 'Incoming',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.in_qq}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.QoQ_In_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'in_yy',
							displayName: 'Y/Y',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents " ><span>Y/Y</span></div>',
							category: 'Incoming',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.in_yy}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.YoY_In_trend)\"></span></div>",
							type: 'number',             
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',    
							},
						
						{
							field: 'closed_lfq',
							displayName: 'Last Full Qtr',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Last Full Qtr</span></div>',
							category: 'Closed',
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'closed_mm',
							displayName: 'M/M',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>M/M</span></div>',
							category: 'Closed',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.closed_mm}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.MoM_Close_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'closed_qq',
							displayName: 'Q/Q',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Q/Q</span></div>',
							category: 'Closed',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.closed_qq}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.QoQ_Close_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'closed_yy',
							displayName: 'Y/Y',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Y/Y</span></div>',
							category: 'Closed',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.closed_yy}}</span>"+"<span  class='glyphicon mrRt-5'  ng-class=\"grid.appScope.getFavClassIcon(row.entity.YoY_Close_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{field: 'out_lfq',
							displayName: 'Last Full Qtr',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Last Full Qtr</span></div>',
							category: 'Outstanding',
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'out_mm',
							displayName: 'M/M',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>M/M</span></div>',
							category: 'Outstanding',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.out_mm}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.MoM_Out_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},	
						{
							field: 'out_qq',
							displayName: 'Q/Q',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Q/Q</span></div>',
							category: 'Outstanding',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.out_qq}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.QoQ_Out_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						},
						{
							field: 'out_yy',
							displayName: 'Y/Y',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Y/Y</span></div>',
							category: 'Outstanding',
							cellTemplate :'<div class="ui-grid-cell-contents">'+"<span>{{row.entity.out_yy}}</span>"+"<span  class='glyphicon mrRt-5' ng-class=\"grid.appScope.getFavClassIcon(row.entity.YoY_Out_trend)\"></span></div>",
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
						}],
						

			};
			$scope.escalGrid_cap=
				{
				
					enableFiltering: false,
					showTreeExpandNoChildren: true,
					enableColumnResizing: true,
					enableColumnMenus: false,
					enableVerticalScrollbar: 0,
					enableHorizontalScrollbar: 0,
					enableColumnResize: true,
					enableColumnReordering: true,
					showColumnFooter: false,
					headerTemplate: '<div role="rowgroup" class="ui-grid-header text-center">  <div class="ui-grid-top-panel"> <div class="ui-grid-header-viewport"> <div class="ui-grid-header-canvas header-column-font-style"> <div class="ui-grid-header-cell-wrapper " ng-style="colContainer.headerCellWrapperStyle()"> <div role="row" class="ui-grid-header-cell-row row-style"> <div class="ui-grid-header-cell ui-grid-clearfix ui-grid-category " ng-repeat="cat in grid.options.category" ng-if="cat.visible && (colContainer.renderedColumns | filter:{ colDef:{category: cat.name} }).length > 0"> <div ng-if="cat.showCatName === true" class="brdBtm">  {{cat.name}} </div> <span ng-if="cat.showCatName !== true">&nbsp;</span> <div class="ui-grid-header-cell ui-grid-clearfix"  ng-repeat="col in colContainer.renderedColumns | filter:{ colDef:{category: cat.name} }" ui-grid-header-cell col="col" render-index="$index">                            </div> </div>  <div class="ui-grid-header-cell ui-grid-clearfix" ng-if="col.colDef.category === undefined" ng-repeat="col in colContainer.renderedColumns track by col.uid" ui-grid-header-cell col="col" render-index="$index">  </div> </div> </div> </div>  </div> </div></div>',
				
					columnDefs :
						[{
							field: 'name',
							displayName: $scope.CurrentMQFlag=='N'?"Last Completed Month":"Current Month",
							headerCellClass: "text-center",
					
							width: "40%",
							pinnedLeft: true
						},
						{
							field: 'in_cap',
							displayName: 'Incoming',
							headerCellClass: "text-center",
							cellClass: 'text-right',
							headerCellTemplate:'<div class="ui-grid-cell-contents"><span>Incoming</span></div>',
							
							type: 'number',
							cellFilter: 'nullToZeroFilter',
							enableCellEdit: false,
							width: "20%",
						},
						{
							field: 'closed_cap',
							displayName: 'Closed',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents "><span>Closed</span></div>',
							type: 'number',
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',
							width: "20%",
						},
						{
							field: 'out_cap',
							displayName: 'Outstanding',
							cellClass: 'text-right',
							headerCellClass: "text-center",
							headerCellTemplate:'<div class="ui-grid-cell-contents " ><span>Outstanding</span></div>',
							type: 'number',             
							enableCellEdit: false,
							cellFilter: 'nullToZeroFilter',    
							width: "20%",
						},
						],
						
				};
			
		
			//code for header ends
			//code for the table grid ends
			
			//code for radio button of quarter /year option
		
			$scope.changeInterval = function(metric, interval) {
				$scope.intervalType = interval;
				if(interval == "MONTH"){
					if(metric == "CAPPrimary"){
						$scope.intervalCAPPrimary = 'Monthly';
						$scope.loadCAPPrimaryTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "BEMS"){
						$scope.intervalBEMS = 'Monthly';
						$scope.loadBEMSTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "RRR"){
						$scope.intervalRRR = 'Monthly';
						$scope.loadRRRTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					
				}
				else if(interval == "QUARTER"){
					if(metric == "CAPPrimary"){
						$scope.intervalCAPPrimary = 'Quarterly';
						$scope.loadCAPPrimaryTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "BEMS"){
						$scope.intervalBEMS =  'Quarterly';
						$scope.loadBEMSTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "RRR"){
						$scope.intervalRRR =  'Quarterly';
						$scope.loadRRRTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
				}
				else if(interval == "YEAR"){
					if(metric == "CAPPrimary"){
						$scope.intervalCAPPrimary = 'Yearly';
						$scope.loadCAPPrimaryTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "BEMS"){
						$scope.intervalBEMS =  'Yearly';
						$scope.loadBEMSTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
					else if(metric == "RRR"){
						$scope.intervalRRR =  'Yearly';
						$scope.loadRRRTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					}
				}
			};
			// loads onload data
			$scope.loadDefaultData = function() {
				$scope.selectedYNSR = "N";
				$scope.selectedYNSR = "N";

				
				/*to get up/down arrow class*/
				$scope.getFavClassIcon= function (_trend) {
					if(_trend == 'Up'){
				     return 'glyphicon glyphicon-triangle-top redArrow alignMiddle mrLt-5';
				    }
				   
				    if(_trend == 'Down'){
				     return 'glyphicon glyphicon-triangle-bottom greenArrow alignMiddle mrLt-5';
				    }
				    if(_trend == 'Same'){
				     return 'glyphicon glyphicon-minus font8 colorBlue alignMiddle mrLt-5';
				    }
				    
				}; 
				 //If BU/Segment is present in URL
				 	  if($location.search()['BU'] != undefined) {
				 		 $scope.BU = $location.search()["BU"];
	            		 $scope.label=$scope.BU;
				 		  if($location.search()['Segment'] != undefined)
				 			  {
				 				$scope.Segment = $location.search()["Segment"];
				 				$scope.label=$scope.Segment;
				 			  }
				 		  if($location.search()['Pin']!= undefined){
				 			  $scope.Pin=$location.search()["Pin"];
				 			  $scope.label=$scope.Pin;
				 		  }
				 		 if($location.search()['Product'] != undefined)
			 			  {
			 			 $scope.PF = $location.search().Product;
			 	 		$scope.label=$scope.Product;
			 			  }
				 	  }
				 	  //If BE/BSE is present in URL
				 	  else if($location.search()['BE'] != undefined) {
				 		 $scope.BE = $location.search()["BE"];
				 		$scope.label=$scope.BE;
				 		  if($location.search()['BSE'] != undefined)
				 			  {
				 			 $scope.BSE = $location.search().BSE;
				 	 		$scope.label=$scope.BSE;
				 			  }
				 		 if($location.search()['PF'] != undefined)
			 			  {
			 			 $scope.PF = $location.search().PF;
			 	 		$scope.label=$scope.PF;
			 			  }
				 		
				 	  }
				 	  //Else take default values from user profile
				 	  else {
				
				 	 	$scope[ globalService.beBUType] = globalService.groupName;
				 	 	
				 	  }
				
				 	  
				 	  
				 	  
		/*		if($scope.pagetype = $location.search()["BE"] != undefined ||  $location.search()["BU"] != undefined)
				{
					
					if(globalService.beBUType == "BU"){
	            		 $scope.BU = $location.search()["BU"];
	            		 $scope.label=$scope.BU;
	             	 	if($location.search()["Segment"] != undefined)
	             	 		$scope.Segment = $location.search()["Segment"];
	             	 	else
	             	 		$scope.Segment = 'undefined';
	             	 	
	             	 	if($location.search()["Pin"] != undefined)
	             	 		$scope.Pin = $location.search()["Pin"];
	             	 	else
	             	 		$scope.Pin = 'undefined';
					} else if(globalService.beBUType == "BE"){
						
	            		 $scope.BE = $location.search()["BE"];
	              	 	if($location.search()["BSE"] != undefined){
	              	 		$scope.label=$scope.BSE;
	              	 		$scope.BSE = $location.search()["BSE"];
	              	 	}
	              	 		
	              	 	else
	              	 		$scope.BSE = 'undefined';
	              	 	
	              	 	if($location.search()["PF"] != undefined)
	              	 		$scope.PF = $location.search()["PF"];
	              	 	else
	              	 		$scope.PF = 'undefined';
	              	 	}
	             	 }*/
					
					

					$scope.showFilterBy = true;
					$scope.selectedBSEBlue = true;
					$scope.selectedBSE =  $scope.BSE;
					$scope.intervalCAP='Monthly';
					$scope.intervalCAPPrimary="Monthly";
					$scope.intervalBEMS="Monthly";
					$scope.intervalRRR="Monthly";
					$scope.loadCAPPrimaryTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					$scope.loadRRRTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					$scope.loadBEMSTrendGraph($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin);
					$scope.loadEscalTable($scope.BE,$scope.BSE,$scope.PF,$scope.BU,$scope.Segment,$scope.Pin)

				


			}
			$scope.loadDefaultData();

			var currentUrl = $location.url();
			var queryString = currentUrl.substr(currentUrl.indexOf('?')+1,currentUrl.length);
			   $scope.dummy=function(escType){
				   //console.log("openeing"+escType)
				   if(escType=='CAP')
					   $scope.openCapMetrics();
				   if(escType=='CAP(Primary)')
					   $scope.openCapPrimaryMetrics();
				   if(escType=='BEMS')
					   $scope.openBemsMetrics();
				   if(escType=='RRR')
					   $scope.openRrrMetrics();
				   
			    	
			    }
			  
			$scope.openCapMetrics = function(){
				$scope.navigateTo('capMetrics',false,'.htm?TrendType='+$scope.intervalCAP+'&'+queryString,false);
			}
			$scope.openCapPrimaryMetrics = function(){
				$scope.navigateTo('capPrimaryMetrics',false,'.htm?TrendType='+$scope.intervalCAPPrimary+'&'+queryString,false);
			}
			
			$scope.openRrrMetrics = function(){
				$scope.navigateTo('rrrMetrics',false,'.htm?TrendType='+$scope.intervalRRR+'&'+queryString,false);
			}
			
			$scope.openBemsMetrics = function(){
				$scope.navigateTo('bemsMetrics',false,'.htm?TrendType='+$scope.intervalBEMS+'&'+queryString,false);
			}
		}]);

	});


