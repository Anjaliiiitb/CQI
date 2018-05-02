define(['app'], function(app ) {

	app.controller("executiveViewSRCtrl", [ '$scope', '$location','relViewService','executiveViewService',  '$rootScope','globalService','$uibModal',
		function( $scope,$location,relViewService,executiveViewService, $rootScope ,globalService,$uibModal ) {



		$scope.loadSRCategoryGraph = function(BE,BSE,PF){
			if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,

			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE
				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF
				};
			}


			executiveViewService.getSRCategory(charParms).success(function(graphData) {
				var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				if(graphData.data.length > 0) {

					$scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data.length; i++) {
						doaQtyPerc[i] = graphData.data[i]['doa_qty'];
						irQtyPerc[i] = graphData.data[i]['ir_qty'];
						rmQtyPerc[i] = graphData.data[i]['rma_qty'];
						dates[i] = graphData.data[i].Date.substring(0, 10);
					}
					$scope.plotSRCatGraph(dates, rmQtyPerc, irQtyPerc, doaQtyPerc);
				}else
					$scope.plotSRCatGraph(dates, rmQtyPerc, irQtyPerc, doaQtyPerc);


			});
		};
		$scope.loadRMAGraph =function(BE){
			$scope.showLoader = true;

			charParms= {"filter":[{"value":["SBTG","TBA"],"field":"techGroup","condition":"notIn"},
				{"value":[BE],"field":"businessEntity","condition":"in"},
				{"value":[],"field":"businessUnit","condition":"in"},
				{"value":[],"field":"productFamily","condition":"in"},
				{"value":[],"field":"fiscalMonth","condition":"in"},
				{"field":"gpiCdprcTarget","condition":"notIn","value":[]},
				{"field":"gpiHwFilterStatus","condition":"equals","value":"Non-Mem HW"}]};
			$scope.chartConfigRMA={
					"loading": true,
					title: {
						text: "RMA Authorizations",
						align: "left"
					}
			};
			executiveViewService.getRMAGraphdata(charParms).success(function(graphData) {
				$scope.showLoader = false;
				if(graphData.length > 0) {
					var RMAUnits = [],dates=[];

					for (var i = 0; i < graphData.length; i++) {
						RMAUnits[i] = parseInt(graphData[i]['hWRMAUnits']);
						dates[i] = graphData[i].fiscalMonth;
					}
					$scope.plotRMAGraph(dates, RMAUnits);
				}
			});
		};

		$scope.loadSRAgingGraph = function(BE,BSE,PF){
			if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,

			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE
				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF
				};
			}
			executiveViewService.getSRAgingGraph(charParms).success(function(graphData) {
				$scope.showLoader = false;
				var srWithOutDefect = [],dates=[],srWithDefect=[];
				if(graphData.data.length != 0) {


					for (var i = 0; i < graphData.data.length; i++) {
						dates[i] = graphData.data[i].agebucket;
						srWithOutDefect[i]=graphData.data[i]['sr_without_defect'];
						srWithDefect[i]=graphData.data[i]['sr_with_defect'];
					}
					$scope.plotSRAgingGraph(dates,srWithOutDefect,srWithDefect)
				}else
					$scope.plotSRAgingGraph(dates,srWithOutDefect,srWithDefect)
			});
		},
		$scope.loadSRTrend = function(BE,BSE,PF){
			if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,

			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE
				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF
				};
			}
			executiveViewService.getSRTrendGraph(charParms).success(function(graphData) {
				$scope.showLoader = false;
				var srWithOutDefect = [],dates=[],srWithDefect=[];
				if(graphData.data.length != 0) {


					for (var i = 0; i < graphData.data.length; i++) {
						dates[i] = graphData.data[i].Date;
						srWithDefect[i]=graphData.data[i]['sr_count_with_bugs'];
						srWithOutDefect[i]=graphData.data[i]['sr_count_without_bugs'];
					}
					$scope.plotSRTrend(dates,srWithDefect,srWithOutDefect)
				}else{
					$scope.plotSRTrend(dates,srWithDefect,srWithOutDefect);
				}
			});

		}
		//loading SR chronic trend
		$scope.loadSRChronicTrend = function(BE){
			$scope.showLoader = true;
			charParms= {"filter":[{"value":["SBTG","TBA"],"field":"techGroup","condition":"notIn"},
				{"value":[BE],"field":"businessEntity","condition":"in"},
				{"value":[],"field":"businessUnit","condition":"in"},
				{"value":[],"field":"productFamily","condition":"in"},
				{"value":[],"field":"fiscalMonth","condition":"in"},
				{"field":"gpiCdprcTarget","condition":"notIn","value":[]},
				{"field":"gpiHwFilterStatus","condition":"equals","value":"Non-Mem HW"}]};

			$scope.chartConfigChronicRedTrend = {
					"loading": true,
					title: {
						text: "Non-Red and Non-Chronic Red",
						align: "left"
					},
					tooltip: {"shared":true}
			};
			executiveViewService.getSRChronicTrendData(charParms).success(function(graphData) {
				$scope.showLoader = false;
				if(graphData.length > 0) {
					var redPerc = [],dates=[],chronicRedPerc = [];

					for (var i = 0; i < graphData.length; i++) {
						redPerc[i] = 1-graphData[i]['RED_PERCENTAGE'];
						dates[i] = graphData[i]['FISCAL_MTH_NAME'];
						chronicRedPerc[i] = 1-graphData[i]['CHRONIC_RED_PERCENTAGE'];
					}
					$scope.plotChronicRedGraph(dates, redPerc,chronicRedPerc);
				}else{
					$scope.chartConfigChronicRedTrend = {
							"loading": false,
					};

				}
			}); 
		}

		$scope.plotSRAgingGraph = function(dates,srWithOutDefect,srWithDefect){
			var obj = {
					chart: {
						type: 'column'
					},
					title: {
						text: 'SR Aging- All open SR\'s as of today',
						align: "left"

					},
					xAxis: {
						categories: dates,
					},
					yAxis: {
						min: 0,
						title: {
							text: '#SR'
						},
						/*stackLabels: {
				            enabled: true,
				            style: {
				                color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
				            }
				        }*/
					},
					legend: {
						align: 'center',
						x: 0,
						verticalAlign: 'bottom',
						y: 0,

					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					tooltip: {
						headerFormat: '<b>{point.x}</b><br/>',
						shared: true,
						pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
					},
					plotOptions: {
						column: {
							stacking: 'normal',
							dataLabels: {
								enabled: true,
								color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
							}
						}
					},
					series: [{
						name: 'SR Without Defect',
						color:'#2d5986',
						data: srWithOutDefect,
						type:'column'
					}, {
						name: 'SR With Defect',
						data: srWithDefect,
						color:'#dd5d16',
						type:'column'
					}, ]
			};
			$scope.srAgingTrend = obj;

			$('#srAgingGraphContainer').highcharts(obj);
		}
		$scope.plotSRCatGraph = function(dates, rmQtyPerc, irQtyPerc, doaQtyPerc) {
			var noOfItems=0;
			noOfItems  = rmQtyPerc.length;
			$scope.chartSeries = [{
				"name": "RMA",
				"data": rmQtyPerc,
				type: "line",
				"color": "#cf2030"
			},
			{
				"name": "IR",
				"data": irQtyPerc,
				type: "line",
				"color": "#2d5986"
			},
			{
				"name": "DOA",
				"data": doaQtyPerc,
				type: "line",
				yAxis: 1,
				"color": "#00CCFF"
			},

			];


			itemsToDisplay = noOfItems;
			var minItem = 0;
			$scope.chartConfigSRCat = {
					options: {
						chart: {
							type: 'line',

						},

						plotOptions: {
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							},
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							},
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}
						},
						tooltip: {shared: true}
					},

					lang: {
						noData: "No Data Found"
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

						title: {
							text: ''
						},
					},
					{

						title: {
							text: 'DOA',
							style: {
								color: '#856299'
							}
						},

						opposite: true,
						min: 0

					}
					],
					series: $scope.chartSeries,
					title: {
						text: 'RMA,IR,DOA as a percentage of all SR\'s',
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
						crosshairs: [{
							width: 1.5,
							dashStyle: 'shortdot',
							color: 'grey'
						}, false, true],
						width: '100%',
						backgroundColor: "#e5e5e5",
						shared: true,
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
		$scope.plotChronicRedGraph = function(dates, redPerc, chronicRedPerc) {
			var noOfItems = redPerc.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [{
				"name": "Non-Red",
				"data": redPerc,
				type: "line",
				"color": "#2d5986"
			},
			{
				"name": "Non-Chronic Red",
				"data": chronicRedPerc,
				type: "line",
				"color": "#dd5d16"
			},


			];
			$scope.chartConfigChronicRedTrend = {
					options: {
						chart: {
							type: 'line',

						},
						lang: {

							noData: "No Data Found"
						},
						plotOptions: {
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							},
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}
						} , 
						tooltip:{shared:true}

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


						title: {
							text: '%'
						},

					}
					],
					series: $scope.chartSeries,
					title: {
						text: 'Non-Red and Non-Chronic Red',
						align: "left"

					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,

					},

					credits: {
						enabled: true,
						enabackloged: false,
						href: 'http://cqi',
						text: 'only BE level filter applied on this Trend'
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
		$scope.plotSRTrend = function(dates, srWithDefect, srWithoutDefect) {
			var noOfItems = srWithDefect.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [{
				"name": "SR With Defect",
				"data": srWithDefect,
				type: "line",
				"color": "#2d5986"
			},
			{
				"name": "SR Without Defect",
				"data": srWithoutDefect,
				type: "line",
				"color": "#dd5d16"
			},


			];
			$scope.chartConfigSRTrends = {
					options: {
						chart: {
							type: 'line',

						},
						lang: {
							thousandsSep: ','
						},
						plotOptions: {
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							},
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						},  tooltip:{shared:true}

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

						title: {
							text: ''
						},


					}
					],
					series: $scope.chartSeries,
					title: {
						text: 'SR QoQ Trends',
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


		$scope.plotRMAGraph = function(dates,RMAUnits) {
			var noOfItems = RMAUnits.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [{
				"name": "RMA Units",
				"data": RMAUnits,
				stype: "column",
				"color": "#2d5986"
			},

			];
			$scope.chartConfigRMA = {
					options: {
						chart: {
							type: 'column',

						},
						lang: {
							thousandsSep: ','
						},
						plotOptions: {
							column: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							},

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


						title: {
							text: 'RMA Units'
						},


					}
					],

					series: $scope.chartSeries,

					title: {
						text: 'RMA Authorizations',
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
						enabled: true,
						enabackloged: false,
						href: 'http://cqi',
						text: 'only BE level filter applied on this Trend'
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

		$scope.changeDataLabelPopup = function(id, bool){
			if (id == 'SRAge') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigSRAgingPopup = angular.copy($scope.srAgingTrend);
				if (typeof $scope.chartConfigSRAgingPopup.options.plotOptions.column != "undefined") {
					$scope.chartConfigSRAgingPopup.options.plotOptions.column.dataLabels.enabled = bool;
					$scope.chartConfigSRAgingPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;
				}

			}else if (id == 'SRCat') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigSRCatPopup = angular.copy($scope.chartConfigSRCat);
				if (typeof $scope.chartConfigSRCatPopup.options.plotOptions.line != "undefined") 
					$scope.chartConfigSRCatPopup.options.plotOptions.line.dataLabels.enabled = bool;

			}else if (id == 'SRTrend') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigSRTrendPopup = angular.copy($scope.chartConfigSRTrends);
				if (typeof $scope.chartConfigSRTrendPopup.options.plotOptions.line != "undefined") 
					$scope.chartConfigSRTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
			}
			else if (id == 'SRchronic') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigchronicRedPopup = angular.copy($scope.chartConfigChronicRedTrend);
				if (typeof $scope.chartConfigchronicRedPopup.options.plotOptions.line != "undefined") 
					$scope.chartConfigchronicRedPopup.options.plotOptions.line.dataLabels.enabled = bool;
			}
			else if (id == 'SRRMA') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigSRRMAPopup = angular.copy($scope.chartConfigRMA);
				if (typeof $scope.chartConfigSRRMAPopup.options.plotOptions.column != "undefined") 
					$scope.chartConfigSRRMAPopup.options.plotOptions.column.dataLabels.enabled = bool;
			}

		};
		$scope.openChart = function(id) {
			$scope.chartPopup = id;
			modalInstance = $uibModal.open({
				animation: false,
				windowClass: 'the-modal',
				templateUrl: 'fullScreenChart.html',
				size: 'lg',
				scope: $scope
			});
			if (id == 'SRAge') {

				$scope.chartConfigSRAgingPopup = $scope.srAgingTrend;
				$scope.selectedYNSR = 'N';

			}else if (id == 'SRCat') {

				$scope.chartConfigSRCatPopup =  $scope.chartConfigSRCat;
				$scope.selectedYNSR = 'N';

			}else if (id == 'SRTrend') {

				$scope.chartConfigSRTrendPopup =  $scope.chartConfigSRTrends;
				$scope.selectedYNSR = 'N';

			}else if (id == 'SRchronic') {

				$scope.chartConfigchronicRedPopup =  $scope.chartConfigChronicRedTrend;
				$scope.selectedYNSR = 'N';

			}else if (id == 'SRRMA') {

				$scope.chartConfigSRRMAPopup =  $scope.chartConfigRMA;
				$scope.selectedYNSR = 'N';

			}



		}; 

		$scope.closeChart = function() {
			modalInstance.dismiss('cancel');
		};
		// loads onload data
		$scope.loadDefaultData = function() {
			$scope.selectedYNSR = "N";
			$scope.selectedYNSR = "N";
			if($scope.pagetype = $location.search()["BE"] != undefined)
			{

				$scope.BE = $location.search()["BE"];
				if($location.search()["BSE"] != undefined)
					$scope.BSE = $location.search()["BSE"];
				else
					$scope.BSE = 'undefined';

				if($location.search()["PF"] != undefined)
					$scope.PF = $location.search()["PF"];
				else
					$scope.PF = 'undefined';

				$scope.showFilterBy = true;
				$scope.selectedBSEBlue = true;
				$scope.selectedBSE =  $scope.BSE;

				$scope.loadSRCategoryGraph($scope.BE,$scope.BSE,$scope.PF);
				$scope.loadRMAGraph($scope.BE);
				$scope.loadSRAgingGraph($scope.BE,$scope.BSE,$scope.PF);
				$scope.loadSRChronicTrend($scope.BE);
				$scope.loadSRTrend($scope.BE,$scope.BSE,$scope.PF);
			}


		}
		$scope.loadDefaultData();

	}]);

});


