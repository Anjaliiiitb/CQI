/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app) {
			app.controller("styleCtrl", [ '$scope', 'widgetService', '$rootScope',
			          					'$uibModal', '$log', '$document', '$timeout', '$location',
			        					'globalService', '$templateCache', function($scope, widgetService, $rootScope,
					$uibModal, $log, $document, $timeout, $location,
					globalService, $templateCache) {
				
				
				
				$scope.nameGraphColor = "";
				$scope.metricGraphColor = "#000000";
				$scope.dummy = "dummy";
				$scope.widgetName = "";
				var $ctrl = this;
				$ctrl.templateLocation = "";
				$ctrl.controllerLocation = "";
				$scope.GraphStyle = 'line';
				$scope.nameGraphStyle = 'line';
				$scope.currentIndex = 0;
				$scope.checkBox = [];
				$scope.hideShowWidgetFlag("visible");

				$ctrl.open = function(size, parentSelector) {

					var parentElem = parentSelector ? angular
							.element($document[0].querySelector('.modal-demo '
									+ parentSelector)) : undefined;
					var modalInstance = $uibModal.open({
						animation : $ctrl.animationsEnabled,
						ariaLabelledBy : 'modal-title',
						ariaDescribedBy : 'modal-body',
						templateUrl : $ctrl.templateLocation,
						controller : $ctrl.controllerLocation,
						controllerAs : '$ctrl',
						scope: $scope,
						backdrop: 'static',
						size : size,
						appendTo : parentElem,
						resolve : {
							items : function() {
								return $ctrl.items;
							}
						}
					});
					
					

				};

				//$scope.selected = '#7bd148';
				$scope.currentItem = ""
				$scope.toggleFilter = function(name) {
					if ($scope.currentItem == "") {
						$scope.currentItem = name;
						$scope.currentItem.toggle = true;
					} else {
						$scope.currentItem.toggle = false;
						$scope.currentItem = name;
						$scope.currentItem.toggle = true;
					}
				};
				var dates = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
						"JUL", "AUG", "SEP", "OCT", "NOV",
						"DEC"];

				$rootScope.$on("buildGraph", function() {
				  angular.forEach($rootScope.tempWidgetData.MetricDetails,
                      function(metric, index1) {
					  metric.TrendSelected = true;
					  metric.subMetricUnSelected = false
                          if(metric.SubMetric.length > 0) { 
                                      angular.forEach(metric.SubMetric, function(
                                              item, index2) {
                                    	  if(item.Trend == undefined || item.Trend == "Y"){
                                    	  item.TrendSelected = true;
                                    	  }else{
                                    		  item.TrendSelected = false;
                                    	  }
                                    	  
                                          if(typeof item.SecondaryYaxis == "undefined"){
                                            item.SecondaryYaxis = false;
                                          }
                                          $scope.checkBox[metric.MetricId+'-'+item.MetricId] = item.SecondaryYaxis;
                                      });
                       
                      }
                  });
				  $timeout(function(){
					  $scope.buildGraphData(); 
				  },500)
					
					//this if condition contains code to synchronize groups according to re-order operation performed
					if($location.absUrl().indexOf('editWidget') > -1){
						/*-------$rootScope.tempWidgetData.MetricDetails is the object containing metrics from metrics tab in default order---------*/
						/*-------$rootScope.widgetData.MetricDetails is the object containing metrics from Service in the original order as according to the re-order operation performed in some previos edit operation---------*/
						/*1.In this whole if condition we'll apply loops to sync the original order of groups($rootScope.widgetData.MetricDetails) with the order we get from metrics tab($rootScope.tempWidgetData.MetricDetails)------*/
						/*2.we'll also add or remove the metrics selected or removed from the metrics tab------*/
						/*--------Loop checks for new metrics added in the metrics tab in this edit operation------*/
						for(var n=0;n<$rootScope.tempWidgetData.MetricDetails.length;n++){
							var diff = 0;			
							for(var o=0;o<$rootScope.widgetData.MetricDetails.length;o++){
								if($rootScope.tempWidgetData.MetricDetails[n].MetricId == $rootScope.widgetData.MetricDetails[o].MetricId){
									$rootScope.widgetData.MetricDetails[o].MetricDispName = $rootScope.tempWidgetData.MetricDetails[n].MetricDispName;
									$rootScope.widgetData.MetricDetails[o].MetricName = $rootScope.tempWidgetData.MetricDetails[n].MetricName;
									/*If metrics is present in both the objects the diff will be incremented otherwise it will be 0*/
									diff++;
								}
							}
							if(diff == 0){
								/*if diff == 0 then the metrics is newly selected in metrics tab and will be added to the object that will be shown in style tab*/
								$rootScope.widgetData.MetricDetails.push($rootScope.tempWidgetData.MetricDetails[n])
							}
						}
						
						/*--------Loop checks for metrics de-selected in the metrics tab in this edit operation------*/
						for(var n=0;n<$rootScope.widgetData.MetricDetails.length;n++){
							var diff = 0;
							for(var o=0;o<$rootScope.tempWidgetData.MetricDetails.length;o++){
								if($rootScope.widgetData.MetricDetails[n].MetricId == $rootScope.tempWidgetData.MetricDetails[o].MetricId){
									$rootScope.widgetData.MetricDetails[n].MetricDispName = $rootScope.tempWidgetData.MetricDetails[o].MetricDispName;
									$rootScope.widgetData.MetricDetails[n].MetricName = $rootScope.tempWidgetData.MetricDetails[o].MetricName;
									/*If metrics is present in both the objects the diff will be incremented otherwise it will be 0*/
									diff++;
								}
							}
							if(diff == 0){
								/*if diff == 0 then the metrics is not de-selected in metrics tab so will be remove from object showing metrics in style tab*/
								$rootScope.widgetData.MetricDetails.splice(n,1);
							}
						}
						
						/*--------Loop checks for new sub-metrics added in the metrics tab in this edit operation------*/
						for(var i=0;i<$rootScope.tempWidgetData.MetricDetails.length;i++){
							for(var j=0;j<$rootScope.widgetData.MetricDetails.length;j++){
								if($rootScope.tempWidgetData.MetricDetails[i].MetricId == $rootScope.widgetData.MetricDetails[j].MetricId){

									
									$rootScope.widgetData.MetricDetails[j].TrendSelected = $rootScope.tempWidgetData.MetricDetails[i].TrendSelected;
									for(var k=0;k<$rootScope.tempWidgetData.MetricDetails[i].SubMetric.length;k++){
										var diff = 0;
										for(var l=0;l<$rootScope.widgetData.MetricDetails[j].SubMetric.length;l++){
											if($rootScope.tempWidgetData.MetricDetails[i].SubMetric[k].MetricDispName == $rootScope.widgetData.MetricDetails[j].SubMetric[l].MetricDispName ){
												$rootScope.widgetData.MetricDetails[j].SubMetric[l].TrendSelected = $rootScope.tempWidgetData.MetricDetails[i].SubMetric[k].TrendSelected;
												$rootScope.widgetData.MetricDetails[j].SubMetric[l].GraphData = angular.copy($rootScope.tempWidgetData.MetricDetails[i].SubMetric[k].GraphData);
												/*If sub-metrics is present in both the objects the diff will be incremented otherwise it will be 0*/
												diff++;
											}
										}
										if(diff == 0){
											/*if diff == 0 then the sub-metrics is newly selected in metrics tab and will be added to the object that will be shown in style tab*/
											$rootScope.widgetData.MetricDetails[j].SubMetric.push($rootScope.tempWidgetData.MetricDetails[i].SubMetric[k]);
										}
										
									}
								}
							}
						}
						/*--------Loop checks for sub-metrics de-selected in the metrics tab in this edit operation------*/
						for(var i=0;i<$rootScope.widgetData.MetricDetails.length;i++){
							for(var j=0;j<$rootScope.tempWidgetData.MetricDetails.length;j++){
								if($rootScope.tempWidgetData.MetricDetails[j].MetricId == $rootScope.widgetData.MetricDetails[i].MetricId){
									for(var k=$rootScope.widgetData.MetricDetails[i].SubMetric.length-1;k>=0;k--){
										var diff = 0;
										
										for(var l=0;l<$rootScope.tempWidgetData.MetricDetails[j].SubMetric.length;l++){
											if($rootScope.tempWidgetData.MetricDetails[j].SubMetric[l].MetricDispName == $rootScope.widgetData.MetricDetails[i].SubMetric[k].MetricDispName ){
												/*If sub-metrics is present in both the objects the diff will be incremented otherwise it will be 0*/
												diff++;
											}
										}
										if(diff == 0){
											/*if diff == 0 then the sub-metrics is not de-selected in metrics tab so will be remove from object showing metrics in style tab*/
											$rootScope.widgetData.MetricDetails[i].SubMetric.splice(k,1);
										}
									}
								}
							}
						}
						$rootScope.tempWidgetData.MetricDetails = [];
						/*allocating the proper object created according to order and new metrics added or removed to the object taking data to the style tab*/
						$rootScope.tempWidgetData.MetricDetails = angular.copy($rootScope.widgetData.MetricDetails);

					}
				});
				var anyEmptyGroup = false;
				var emptyGroupName = "";
				$scope.parentChange = function(metric){
					if(metric.subMetricUnSelected == true && metric.TrendSelected == false){
					angular.forEach(metric.SubMetric, function(subMetric) {
							subMetric.TrendSelected = true;	
							metric.TrendSelected = true;
							anyEmptyGroup = false;
							metric.subMetricUnSelected = false;
					})
					}
					else if(metric.subMetricUnSelected == false && metric.TrendSelected == false ){
						angular.forEach(metric.SubMetric, function(subMetric) {
								subMetric.TrendSelected = false;	
								metric.TrendSelected = false;
								anyEmptyGroup = true;
								emptyGroupName = metric.MetricDispName;
								$scope.addAlert("Atleast one metric should be selected for the Trend graph", "warning");
						})
						}
					else if(metric.subMetricUnSelected == false && metric.TrendSelected == true){
						angular.forEach(metric.SubMetric, function(subMetric) {
								subMetric.TrendSelected = true;	
								anyEmptyGroup = false;
								metric.TrendSelected = true;
						})
						}
				}
				
				//code to unselect metrics for the trend graph in widget reo
				$scope.uncheckForTrend = function(name,metric){
					var allUnSelectedCount = 0;
					for(var i=0;i<metric.SubMetric.length;i++){
						if(metric.SubMetric[i].TrendSelected == false){
							allUnSelectedCount++;
						}
					}
					
						if(allUnSelectedCount == metric.SubMetric.length){
							metric.TrendSelected = false;
						}else{
							metric.TrendSelected = true;
						}
						if(allUnSelectedCount > 0 ){
							metric.subMetricUnSelected = true;
						}else{
							metric.subMetricUnSelected = false;
						}
						if(name.TrendSelected == true){
							name.Trend = "Y"
							}else{
								name.Trend = "N"
							}
						if(allUnSelectedCount == metric.SubMetric.length){
							anyEmptyGroup = true;
							emptyGroupName = metric.MetricDispName;
							$scope.addAlert("Atleast one metric should be selected for the Trend graph", "warning");
							return
						}
					//}
				}
				
				$scope.hexPicker = {
					color : ''
				};
				$scope.resetColor = function() {
					$scope.hexPicker = {
						color : '#000'
					};
				};
				/*
				 * $rootScope.$on("loadStyle", function(){ $scope.metricsList =
				 * widgetService.metricsList; });
				 */
				$scope.onStylePrev = function() {
					$('#seqNavDiv').animate({
						scrollTop : 590,
					}, 400)
					$('#styleScreen').parent().animate({
						opacity : 0.2,
					}, 400)
					setTimeout(function() {
						$(".slideGroup:nth-of-type(2)").css({
							opacity : "1"
						});
						$('.styleLN').removeClass("leftNavCircleActive");
					}, 400)
				};
				
				
				$scope.isValidate = function(){
					return !anyEmptyGroup;
				}
				
				$scope.onStyleNext = function() {
					if($scope.isValidate()){
					for(var i=0;i<$rootScope.tempWidgetData.MetricDetails.length;i++){
						for(var j=0;j<$rootScope.tempWidgetData.MetricDetails[i].SubMetric.length;j++){
							$rootScope.tempWidgetData.MetricDetails[i].SubMetric[j].Selected = true;
						}
					}
					$scope.openPopUp('html/templates/createWidgetPopup.html',
							'createWidgetPopupCtrl');
					setTimeout(function() {
						$(".slideGroup:nth-of-type(5)").css({
							opacity : "1"
						});
						$('.saveLN').addClass("leftNavCircleActive");
					}, 400)
					/*
					 * $('#seqNavDiv').animate({ scrollTop : 1690, }, 400)
					 * $('#sourceDiv').animate({ opacity : 0.2, }, 400)
					 * $('#reviewScreen').parent().animate({ opacity : 1, },
					 * 400) setTimeout(function() {
					 * $(".slideGroup:nth-of-type(4)").css({ opacity : "1" });
					 * $('.reviewLN').addClass("leftNavCircleActive"); }, 400)
					 */
					}else{
						$scope.addAlert("There is no Sub-metric selected for Trend Graph in " +emptyGroupName+ " Group, Atleast one metric should be selected for the Trend graph", "warning");
					}
				};

				// popup function

				$scope.openPopUp = function(template, ctrl) {

					$ctrl.templateLocation = template;
					$ctrl.controllerLocation = ctrl;
					$ctrl.open();
					
					
					metrics = $rootScope.tempWidgetData.MetricDetails;
		            angular.forEach(metrics, function(item1, index1) {
		                //Delete Graph Data from tempWidgetData as it is generated only for graph purpose
		                if(item1.SubMetric.length == 0) {
		                   
		                } else { 
		                        angular.forEach(item1.SubMetric, function(item2, index2) {
		                          item2.SecondaryYaxis = typeof $scope.checkBox[item1.MetricId+'-'+item2.MetricId] == 'undefined' || $scope.checkBox[item1.MetricId+'-'+item2.MetricId] == false ? false : true ;
		                    });
		                }
		            });

				}

				$scope.chartSeries = [];
				
				$scope.buildGraphData = function(metrics,bool,subMetricN) {
				  // By default, load data for first metric data
					if (metrics == undefined || metrics == null){
						metrics = $rootScope.tempWidgetData.MetricDetails[0];
					}
					$scope.graphPreview = "Preview for "
						+ metrics.MetricDispName;
					$scope.graphPreview = "Preview for " + metrics.MetricDispName;
					$scope.chartSeries = [];
					
					if(metrics.Selected == true) {
					
						if(metrics.SubMetric.length == 0) {
							$scope.chartSeries.push({
								"name" : metrics.MetricDispName,
								"data" : metrics.GraphData,
								"type" : metrics.GraphStyle,
								"color" : metrics.Color,
								
								
							});
						}
						else { 
							angular.forEach(metrics.SubMetric, function(item, index2) {
							
								if(item.TrendSelected == true) {
								
								    var objTemp = {
                                        "name" : item.MetricDispName,
                                        "data" : item.GraphData,
                                        "type" : item.GraphStyle,
                                        "color" : item.Color,
                                     
                                       
                                    };
								    if(subMetricN == item.MetricDispName && bool == true){
								      //objTemp.yAxis = 1;
								      item.SecondaryYaxis = bool;
								    }else if(subMetricN == item.MetricDispName && bool == false){
								      item.SecondaryYaxis = bool;
								    }
									$scope.chartSeries.push(objTemp);
								}
							});
					}
					}
					$scope.addCharts(bool,subMetricN,metrics);
				};
				$scope.addCharts = function(bool,subMetricN,metrics) {
				  $scope.chartStyleCofig = {
						xAxis : {
							categories : dates,
							showLastLabel : true,
							endOnTick : true,
							labels : {
								rotation : -45
							},
							dateTimeLabelFormats : { // don't display the
								// dummy year
								month : '%e. %b',
								year : '%b'
							},
							// min : minItem,
							// max : minItem + (itemsToDisplay - 1),
							scrollbar : {
								enabled : globalService.indicatorValue
							}
						},

						scrollbar : {
							barBackgroundColor : 'gray',
							barBorderRadius : 7,
							barBorderWidth : 0,
							buttonBackgroundColor : 'gray',
							buttonBorderWidth : 0,
							buttonBorderRadius : 7,
							trackBackgroundColor : 'none',
							trackBorderWidth : 1,
							trackBorderRadius : 8,
							trackBorderColor : '#CCC'
						},
						yAxis :/* {
							title : {
								text : 'Bug Count'
							}
						}*/[{
                          title: {
                            text: ''
                        }
                    }],
						series : $scope.chartSeries,
						
						title : {
							text : '',

						},
						chart : {
							// Edit chart spacing
							spacingBottom : 4,
							marginRight : 0,
							marginTop: 50,
							spacingRight : 0,
							height : 255,
						},
						credits : {
							enabackloged : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},
						/*
						 * navigation: { buttonOptions: { verticalAlign:
						 * 'center', y: 0, } },
						 */
						exporting: {
					         enabled: false,
					         buttons: {
					             exportButton: {
					                 enabled: false
					             },
					             printButton: {
					                 enabled: false
					             }

					         }
						},
						tooltip : {
							valueSuffix : '',
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
							width : '100%',
							backgroundColor : "#e5e5e5",
							shared : true,
						},
						plotOptions : {
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValue,
									allowOverlap : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValue,
									allowOverlap : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							}

						},

						loading : false,

						size : {}
					};
					$scope.chartStyleCofig.chart.height = 400;
					
					
					$scope.chartStyleCofig.chart.marginRight = 0;
					var count = 1;
					angular.forEach(metrics.SubMetric,function(value,index){
					  if(value.SecondaryYaxis == true){
					    var ob ={"title": {
					      
                                  "text": value.MetricDispName,
                                  "style": {
                                      "color": "#856299"
                                  }
                                },
                                "labels": {
                                    "format": "{value}",
                                    "style": {
                                        "color": "#856299"
                                    }
                                },
                                "opposite": true};
                        $scope.chartStyleCofig.yAxis.push(ob);
                        $scope.chartStyleCofig.chart.marginRight += 80;
                        
                        angular.forEach($scope.chartStyleCofig.series,function(value1,index1){
                          if(value.MetricDispName == value1.name){
                            $scope.chartStyleCofig.series[index1].yAxis = count++;
                          }
                        });
					  }
					});
					
					/*if(typeof bool != undefined){
    					if(bool == true){
        					var ob ={"title": {
        		                "text": subMetricN,
        		                "style": {
        		                    "color": "#856299"
        		                }
        		            },
        		            "labels": {
        		                "format": "{value}",
        		                "style": {
        		                    "color": "#856299"
        		                }
        		            },
        		            "opposite": true};
        					$scope.chartStyleCofig.yAxis.push(ob);
        					$scope.chartStyleCofig.chart.marginRight = 80;
    					}
					}*/
					 var chart = Highcharts.chart('cfdGraphContainer',$scope.chartStyleCofig);
			          chart.reflow();
					
					var buttonsCFD = Highcharts.getOptions().exporting.buttons.contextButton.menuItems;
					
				
					/*----function to re-order the metrics and sub-metrics in the re-order sub-tab of the style tab-----*/
					$scope.metricsSubMetricsMoveUpOrDown = function(metricSubMetricName,metricOrSubMetric,upOrDown,index,parentMetricIndexIfSubMetric){
						if(metricOrSubMetric == 'metric'){
					    /*if metrics is getting up or down*/
						if(upOrDown == 'up'){
							/*if metrics is ordering up*/
						var  varToSwap = $rootScope.tempWidgetData.MetricDetails[index-1];
						$rootScope.tempWidgetData.MetricDetails[index-1] = $rootScope.tempWidgetData.MetricDetails[index];
						$rootScope.tempWidgetData.MetricDetails[index] = varToSwap;
						}else{
							/*if metrics is ordering Down*/
							var  varToSwap = $rootScope.tempWidgetData.MetricDetails[index+1];
							$rootScope.tempWidgetData.MetricDetails[index+1] = $rootScope.tempWidgetData.MetricDetails[index];
							$rootScope.tempWidgetData.MetricDetails[index] = varToSwap;
						}
						}else{
						    /*if sub-metrics is getting up or down*/
							if(upOrDown == 'up'){
								/*if sub-metrics is ordering up*/
								var  varToSwap = $rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index-1];
								$rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index-1] = $rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index];
								$rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index] = varToSwap;
								}else{
									/*if sub-metrics is ordering down*/
									var  varToSwap = $rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index+1];
									$rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index+1] = $rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index];
									$rootScope.tempWidgetData.MetricDetails[parentMetricIndexIfSubMetric].SubMetric[index] = varToSwap;
								}
						}
					}
					
				}
				
				// $scope.chartStyleCofig =
			}]);
		});