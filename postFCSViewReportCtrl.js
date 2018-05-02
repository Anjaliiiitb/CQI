/* AMD format. Add dependencies like services, directives in the [] */
define(['app'],function(app) {

			app.controller("postFCSViewReportCtrl", [ '$scope', 'relViewService','postFCSViewService', 'uiGridConstants', '$uibModal', '$interval', 'globalService', '$location', '$timeout', 
			                                          function($scope, relViewService, postFCSViewService, uiGridConstants, $uibModal, $interval, globalService, $location, $timeout) {
				$scope.showLoader = true;
				$scope.isDataFound = false;
				//var viewType = 'platform';
				$scope.chartPopup = "";
				var modalInstance = "";
				$scope.commonChart = [];
				$scope.popUpChartDataLabel = 'N';
				$scope.openChartBool = false;
				$scope.hideShowWidgetFlag("visible");
				$("#sreContainer").hide();
  				$("#irrContainer").hide();
				$scope.existChart = function(id) {
					var obj = angular.forEach($scope.commonChart, function(e, i) {
						if (e.id == id) {
							$scope.commonChart.splice(i, 1);
							return e;
						}
					});
					/*var obj = $scope.commonChart.find(function(e, i) {
						if (e.id == id) {
							$scope.commonChart.splice(i, 1);
							return e;
						}
					});*/

					if (typeof obj == 'undefined') {
						return false;
					} else {
						return true;
					}
				};

				/* to show viewId in URL */
				if ($location.search()["viewId"] !== null
						|| $location.search()["viewId"] !== 'null') {
					var item = $location.search()["viewId"];
					if (item) {
						postFCSViewService.viewId = item;
						$timeout(function() {
							$scope.addToUrl(item);
						}, 250);
					}
				}
				$scope.savedViewId = postFCSViewService.viewId;
				
				$scope.addToUrl = function() {
					$location.search('viewId', $scope.savedViewId);
				};
				$scope.addToUrl();
				
				$scope.changeDataLabelPopup = function(id, bool) {
					var obj = $scope.commonChart.filter(function(e) {
						if (e.id == id)
							return e;
					});
					if (obj !== 'undefined') {
						var objA = obj[obj.length - 1];

						objA.chartData.plotOptions.column.dataLabels.enabled = bool;
						objA.chartData.plotOptions.column.dataLabels.allowOverlap = bool;
						objA.chartData.plotOptions.line.dataLabels.enabled = bool;
						var chart = Highcharts.chart('kbGraphContainerFullScreen', objA.chartData);
						chart.reflow();
					}

				};

				/* get viewName 
				postFCSViewService.getGraphData(postFCSViewService.viewId).success(
						function(data) {
							if(data.errorMessage != undefined && data.errorMessage != null) {
				                $scope.showLoader = false;
				                $scope.addAlert(data.errorMessage, "danger");
				            } else {	
								$scope.postFCSReportViewName = data.VIEW_NAME;
								$scope.viewName = data.VIEW_NAME;
								$scope.baseQuery = data.QUERY;
				            }
						});*/

				postFCSViewService.loadViewData(postFCSViewService.viewId)
				.success(function(viewData) {
					if(viewData.errorMessage != undefined && viewData.errorMessage != null) {
		                $scope.showLoader = false;
		                $scope.addAlert(viewData.errorMessage, "danger");
		            } else {
		            		if(viewData != undefined && viewData != null && viewData.length !=0){
		            			var viewData = viewData[0];
		            			$scope.viewName = viewData["VIEW_NAME"];
		            			$scope.postFCSReportViewName = viewData["VIEW_NAME"];
		            			$scope.postFCSGlanceBaseQuery = viewData["QUERY"];
		            			$scope.baseQuery=viewData["QUERY"];
		            			/*$scope.postFCSGlanceHolesQuery = viewData["HOLES_QUERY"];
								$scope.postFCSGlanceRGQuery = viewData["RG_QUERY"];*/
								/*$scope.bugbacklogStartDate = viewData["BUGBACKLOG_START_DATE"];
								$scope.bugbacklogEndDate = viewData["BUGBACKLOG_END_DATE"];*/
								$scope.loadDefaultData(); // load default
		            		}else{
		            			$scope.showLoader = false;
		            			$scope.addAlert("No data found", "warning");
		            		}
		            		
		            	}
				 }).error(function(err) {
					$scope.showLoader = false;
					$scope.navigateTo("errorPage");
				});
				
				$scope.loadDefaultData = function() {
					$scope.intervalType = 'WEEK';
					$scope.subDurationSelectedRG = '3M';
					$scope.subDurationSelectedOIB = '3M';
					$scope.subDurationSelectedCFD = '3M';
					$scope.subDurationSelectedKB = '3M';
					$scope.view = 'director';
      				
					//populate RG data
					postFCSViewService.loadGraphData(postFCSViewService.viewId, 'RG',	$scope.intervalType)
					.success(
							function(graphData) {
								if(graphData.errorMessage != undefined && graphData.errorMessage != null) {
					                $scope.showLoader = false;
					                $scope.addAlert(graphData.errorMessage, "danger");
					            } else {	
									$scope.showLoader = false;
									$scope.graphDataRG = graphData;
									$scope.calcDuration($scope.graphDataRG, 'RG', $scope.subDurationSelectedRG);
					            }
							}).error(function(err) {
								$scope.showLoader = false;
								$scope.navigateTo("errorPage");
							});

					// Populate CFD data
					postFCSViewService.loadGraphData(postFCSViewService.viewId, 'CFD', $scope.intervalType).success(
							function(graphData) {
								if(graphData.errorMessage != undefined && graphData.errorMessage != null) {
					                $scope.showLoader = false;
					                $scope.addAlert(graphData.errorMessage, "danger");
					            } else {
									$scope.graphDataCFD = graphData;
									$scope.calcDuration($scope.graphDataCFD, 'CFD', $scope.subDurationSelectedCFD);
					            }
							}).error(function(err) {
								$scope.showLoader = false;
								$scope.navigateTo("errorPage");
							});
					

					/*UI grid for director*/
					$scope.directorGrid = {
							enableSorting : true,
							enableHorizontalScrollbar : 0,
							enableVerticalScrollbar : 1,
							enableFiltering : false,
							enableColumnMenus : false,
							showTreeExpandNoChildren : false,
							enableColumnResizing : true,
							showColumnFooter : true,
							onRegisterApi : function(gridApi) {
								$scope.dirGridApi = gridApi;
								$interval(function() {
									$scope.dirGridApi.core.handleWindowResize();
								}, 10);
							}
					};
	
					$scope.directorGrid.columnDefs = [
					                                  {
					                                	  field : 'name',
					                                	  displayName : 'Director',
					                                	  enableSorting : true,
					                                	  pinnedLeft:true,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-left'>Total</div>",
					                                	  width : "15%",
					                                	  headerTooltip : postFCSViewService.DirTooltip.Director,
					                                	  cellTooltip : function(row) {
					                                		  return row.entity.name;
					                                	  }
					                                  },
					                                  {
					                                	  field : 'kb',
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                                	  displayName : 'KB',
					                          			  cellClass:'text-right',
					                        			  headerCellClass: "text-center",
					                                	  type : 'number',
					                                	  enableSorting : true,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.kbCaption}}</div>",
					                                	  sort: { direction: 'desc', priority: 0 },
					                                	  width : "10%",
					                                	  					//trendChartScrubberLink class and title="Click to Open Scrubber" removed 
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","KB")>{{row.entity.kb}}</span><span class="trendCls" ng-class="row.entity.kb_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.KB,
					                                	  // cellTooltip: "open scruber"
					                                  },
					                                  {
					                                	  field : 'rg',
					                                	  displayName : 'RG',
					                          			cellClass:'text-right',
					                        			headerCellClass: "text-center",
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                                	  type : 'number',
					                                	  enableSorting : true,
					                                	  enableCellEdit : false,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.rgCaption}}</div>",
					                                	  width : "10%",
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","RG")>{{row.entity.rg}}</span><span class="trendCls" ng-class="row.entity.rg_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.RG
					                                  },
					                                  {
					                                	  field : 'oib',
					                                	  displayName : 'OIB',
					                          			cellClass:'text-right',
					                        			headerCellClass: "text-center",
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                        			  type : 'number',
					                                	  enableSorting : true,
					                                	  enableCellEdit : false,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.oibCaption}}</div>",
					                                	  width : "10%",
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","OIB")>{{row.entity.oib}}</span><span class="trendCls" ng-class="row.entity.holes_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.OIB
					                                  },
					                                  {
					                                	  field : 'cfd',
					                                	  displayName : 'CFD',
					                          			cellClass:'text-right',
					                        			headerCellClass: "text-center",
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                        			  type : 'number',
					                                	  enableSorting : true,
					                                	  type : 'number',
					                                	  enableCellEdit : false,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.cfdCaption}}</div>",
					                                	  width : "10%",
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span  ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","CFD") >{{row.entity.cfd}}</span><span class="trendCls" ng-class="row.entity.cfd_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.CFD
					                                  },
					                                  {
					                                	  field : 'psirt',
					                                	  displayName : 'PSIRT',
					                          			cellClass:'text-right',
					                        			headerCellClass: "text-center",
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                        			type : 'number',
					                                	  enableSorting : true,
					                                	  enableCellEdit : false,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.psirtCaption}}</div>",
					                                	  width : "10%",
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","HOLES")>{{row.entity.holes}}</span><span class="trendCls" ng-class="row.entity.holes_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.PSIRT
					                                  },
					                                  {
					                                	  field : 'holes',
					                                	  displayName : 'Holes',
					                          			cellClass:'text-right',
					                        			headerCellClass: "text-center",
					                                	  /*aggregationType : uiGridConstants.aggregationTypes.sum,
					                                	  aggregationHideLabel : true,*/
					                        			type : 'number',
					                                	  enableSorting : true,
					                                	  enableCellEdit : false,
					                                	  footerCellTemplate : "<div class='ui-grid-cell-contents text-right'>{{grid.appScope.holesCaption}}</div>",
					                                	  width : "10%",
					                                	  cellTemplate : '<div class="ui-grid-cell-contents text-right " ><span ng-disabled=\'row.entity.name=="OTHER" || row.entity.dirName=="OTHER"\' ng-click=grid.appScope.showIndiScrubberDir(row.entity.level,row.entity.name,row.entity.dirName,"director","HOLES")>{{row.entity.holes}}</span><span class="trendCls" ng-class="row.entity.holes_trend"></span></div>',
					                                	  headerTooltip : postFCSViewService.DirTooltip.Holes
					                                  },
					          						{
					          							field : 'icons',
					          							displayName : 'Trend',
					          							enableSorting : true,
					          							enableCellEdit : false,
					          							width : "25%",
					                        			headerCellClass: "text-center",
					          							/* cellTemplate :"<div class='ui-grid-cell-contents'><button title='Trend Chart' class='btn btn-default btn-xs graphIcon' data-toggle='modal' ng-disabled=\"row.entity.name=='OTHER' || row.entity.dirName=='OTHER'\" ng-click=\"grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','KB','dirTrendKBContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','URC','dirTrendURCContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','CFD','dirTrendCFDContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','RG','dirTrendRGContainer')\"><span   class='glyphicon glyphicon-stats' aria-hidden='true'></span></button><button title='Release Score Card' class='btn btn-default btn-xs obieeIcon ' data-toggle='modal' ng-disabled=row.entity.name=='OTHER' ng-click=grid.appScope.loadObiee(row.entity,grid)><span></span></button></div>",*/
					          							cellTemplate : " <div class='text-center'> <a href='javascript:void(0)'  class='icocircle gridico ico-trend' data-toggle='modal' ng-disabled=\"row.entity.name=='OTHER' || row.entity.dirName=='OTHER'\" ng-click=\"grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','RG','dirTrendRGContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','OIB','dirTrendOIBContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','CFD','dirTrendCFDContainer');grid.appScope.showIndividualTrendChartDir(row.entity.level,row.entity.name,row.entity.dirName,'director','KB','dirTrendKBContainer')\">  </a> </div>" //<a href='javascript:void(0)' title='Post FCS Score Card' class='icocircle gridico ico-obiee ' data-toggle='modal' ng-disabled=row.entity.name=='OTHER' ng-click=grid.appScope.loadObiee(row.entity.name,'director')><span></span></a>

					          						}
	
					                       ];
				
				//UI grid for IRR 
				
				$scope.irrGrid = {

						enableSorting : true,
						showColumnFooter : true,
						enableColumnMenus : false,
						//enableHorizontalScrollbar : 1,
						enableVerticalScrollbar : 1,
						enableFiltering : false,
						enableColumnResizing : true,
						onRegisterApi : function(gridApi) {
							$scope.irrGrid = gridApi;
							$interval(function() {
								$scope.irrGrid.core.handleWindowResize();
							}, 10);
						}
					};

					$scope.irrGrid.columnDefs = [ {
						field : 'sreMonth',
						displayName : 'Month',
						headerCellClass: "text-center",
						//footerCellTemplate : "<div class='ui-grid-cell-contents'>Total</div>",
						enableSorting : true,
						width : "20%",
					
					}, {
						field : 'incoming',
						displayName : 'Incoming',
						cellClass:'text-right',
						headerCellClass: "text-center",
						//aggregationType : uiGridConstants.aggregationTypes.sum,
						//aggregationHideLabel : true,
						type : 'number',
						enableSorting : true,
						enableCellEdit : false,
						width : "15%"
					//headerTooltip : relViewService.PlatformTooltip.KB

					}, {
						field : 'empty',
						displayName : '',
						cellClass:'text-right',
						 type : 'number',
						enableCellEdit : false,
						width : "*"
			 

					}

					];
					
				// populate Director grid on load
				postFCSViewService.loadGridData(postFCSViewService.viewId, 'director')
				.success(function(gridData) {
					if(gridData.errorMessage != undefined && gridData.errorMessage != null) {
		                $scope.showLoader = false;
		                $scope.addAlert(gridData.errorMessage, "danger");
		            } else {
		            	//console.log("data returned :"+angular.toJson(gridData));
		            	$scope.showLoader = false;
		            	$scope.isDataFound = true;
		            	postFCSViewService.getTotalData(postFCSViewService.viewId,'POSTFCS')
						.success(function(dirGridCaption) {
									if (dirGridCaption.errorMessage != undefined || dirGridCaption.errorMessage != null) {
										$scope.showLoader = false;
										$scope.addAlert(data.errorMessage, "danger");
									} else {
										$scope.showLoader = false;

										$scope.kbCaption = dirGridCaption[0].kb;
										$scope.rgCaption = dirGridCaption[0].rg;
										$scope.oibCaption = dirGridCaption[0].oib;
										$scope.cfdCaption = dirGridCaption[0].cfd_rel;
										$scope.psirtCaption = dirGridCaption[0].psirt;
										$scope.holesCaption = dirGridCaption[0].holes;
									}
								})
						.error(function(err) {
									$scope.showLoader = false;
									$scope.navigateTo("errorPage");
								});
						$scope.gridDataDirector = gridData;
						var dirData = gridData.dirData;
						var gridDataDir = [];
						var id = 0, parent;
						var directorFields = [ "kb", "rg", "cfd", "holes", "oib", "psirt", "kb_trend", "oib_trend", "rg_trend", "cfd_trend", "holes_trend" ];  

						for (var i = 0; i < dirData.length; i++) {
							if (dirData[i]["manager"] == undefined) {
								id++;
								gridDataDir[i] = {};
								gridDataDir[i]["$$treeLevel"] = 0;
								gridDataDir[i]["level"] = 0;
								gridDataDir[i]["parent"] = null;
								gridDataDir[i]["dirName"] = null;
								gridDataDir[i]["name"] = dirData[i]["director"];
								gridDataDir[i]["id"] = id.toString();
								gridDataDir[i]["expanded"] = false;
								gridDataDir[i]["isLeaf"] = false;
								gridDataDir[i]["loaded"] = true;
								directorFields.forEach(function(item, index) {
									gridDataDir[i][item] = dirData[i][item];

								});
								parent = id.toString();
								parentName = dirData[i]["director"];
							} else {

								id++;
								gridDataDir[i] = {};
								gridDataDir[i]["$$treeLevel"] = 1;
								gridDataDir[i]["level"] = 1;
								gridDataDir[i]["parent"] = parent;
								gridDataDir[i]["dirName"] = parentName;
								gridDataDir[i]["name"] = dirData[i]["manager"];
								gridDataDir[i]["id"] = id.toString();
								gridDataDir[i]["expanded"] = false;
								gridDataDir[i]["isLeaf"] = true;
								gridDataDir[i]["loaded"] = true;
								directorFields.forEach(function(item, index) {
									gridDataDir[i][item] = dirData[i][item];

								});
							};
						}
						$scope.directorGrid.data = gridDataDir;
		            };
        
				});
				//Service calls on load for the other tabs
				$scope.loadSREGraph();
				$scope.loadGridData('irr');

			};
			
			$scope.calcDuration = function(graphData, metric, subDurationSelected) {

				if (metric == 'RG') {

					var inBugs = [], outBugs = [], backlogs = [], dates = [], urcMttr = [], newGraphRG = graphData;
					if ($scope.intervalType == 'MONTH') {
						if (subDurationSelected == "9M") {
							newGraphRG = graphData.slice(4);
						} else if (subDurationSelected == "6M") {
							newGraphRG = graphData.slice(7);
						} else if (subDurationSelected == "3M") {
							newGraphRG = graphData.slice(10);
						}
					} else if ($scope.intervalType == 'WEEK') {
						if (subDurationSelected == "9M") {
							newGraphRG = graphData.slice(14);
						} else if (subDurationSelected == "6M") {
							newGraphRG = graphData.slice(28);
						} else if (subDurationSelected == "3M") {
							newGraphRG = graphData.slice(40);
						}
					}

					for (var i = 0; i < newGraphRG.length; i++) {

						inBugs[i] = parseInt(newGraphRG[i].incoming);
						outBugs[i] = parseInt(newGraphRG[i].closed);
						backlogs[i] = parseInt(newGraphRG[i].backlog);
						//rgMttr[i] = parseInt(newGraphRG[i].rgMttr);
						dates[i] = ($scope.intervalType == 'MONTH') ? newGraphRG[i].endDate.substring(newGraphRG[i].endDate.indexOf("-") + 1) : newGraphRG[i].endDate;

					}

					$scope.plotGraph('rgGraphContainer', metric, dates,
							inBugs, outBugs, backlogs);  //rgMttr
				} else if (metric == 'KB') {
					var inBugs = [], outBugs = [], backlogs = [], kbmttr = [], dates = [], newGraphKB = graphData;

					if ($scope.intervalType == 'MONTH') {
						if (subDurationSelected == "9M") {
							newGraphKB = graphData.slice(4);
						} else if (subDurationSelected == "6M") {
							newGraphKB = graphData.slice(7);
						} else if (subDurationSelected == "3M") {
							newGraphKB = graphData.slice(10);
						}
					} else {
						if (subDurationSelected == "9M") {
							newGraphKB = graphData.slice(14);
						} else if (subDurationSelected == "6M") {
							newGraphKB = graphData.slice(28);
						} else if (subDurationSelected == "3M") {
							newGraphKB = graphData.slice(40);
						}
					}

					for (var i = 0; i < newGraphKB.length; i++) {
						inBugs[i] = parseInt(newGraphKB[i].incoming);
						outBugs[i] = parseInt(newGraphKB[i].closed);
						backlogs[i] = parseInt(newGraphKB[i].backlog);
						kbmttr[i] = parseInt(newGraphKB[i].kbMttr);
						dates[i] = ($scope.intervalType == 'MONTH') ? newGraphKB[i].endDate
								.substring(newGraphKB[i].endDate
										.indexOf("-") + 1)
								: newGraphKB[i].endDate;
					}

					$scope.plotGraph('kbGraphContainer', metric, dates, inBugs, outBugs, backlogs, kbmttr);

				} else if (metric == 'CFD'){

					var inBugs = [], outBugs = [], backlogs = [], dates = [], newGraphCFD = graphData;
					if ($scope.intervalType == 'MONTH') {
						if (subDurationSelected == "9M") {
							newGraphCFD = graphData.slice(4);
						} else if (subDurationSelected == "6M") {
							newGraphCFD = graphData.slice(7);
						} else if (subDurationSelected == "3M") {
							newGraphCFD = graphData.slice(10);
						}
					} else if ($scope.intervalType == 'WEEK') {
						if (subDurationSelected == "9M") {
							newGraphCFD = graphData.slice(14);
						} else if (subDurationSelected == "6M") {
							newGraphCFD = graphData.slice(28);
						} else if (subDurationSelected == "3M") {
							newGraphCFD = graphData.slice(40);
						}
					}

					for (var i = 0; i < newGraphCFD.length; i++) {
						inBugs[i] = parseInt(newGraphCFD[i].incoming);
						outBugs[i] = parseInt(newGraphCFD[i].closed);
						backlogs[i] = parseInt(newGraphCFD[i].backlog);
						dates[i] = ($scope.intervalType == 'MONTH') ? newGraphCFD[i].endDate
								.substring(newGraphCFD[i].endDate.indexOf("-") + 1) : newGraphCFD[i].endDate;
					}
					$scope.plotGraph('cfdGraphContainer', metric, dates,
							inBugs, outBugs, backlogs);
				}
				else if (metric == 'OIB'){

					var inBugs = [], outBugs = [], backlogs = [], dates = [], newGraphCFD = graphData;
					if ($scope.intervalType == 'MONTH') {
						if (subDurationSelected == "9M") {
							newGraphCFD = graphData.slice(4);
						} else if (subDurationSelected == "6M") {
							newGraphCFD = graphData.slice(7);
						} else if (subDurationSelected == "3M") {
							newGraphCFD = graphData.slice(10);
						}
					} else if ($scope.intervalType == 'WEEK') {
						if (subDurationSelected == "9M") {
							newGraphCFD = graphData.slice(14);
						} else if (subDurationSelected == "6M") {
							newGraphCFD = graphData.slice(28);
						} else if (subDurationSelected == "3M") {
							newGraphCFD = graphData.slice(40);
						}
					}

					for (var i = 0; i < newGraphCFD.length; i++) {
						inBugs[i] = parseInt(newGraphCFD[i].incoming);
						outBugs[i] = parseInt(newGraphCFD[i].closed);
						backlogs[i] = parseInt(newGraphCFD[i].backlog);
						dates[i] = ($scope.intervalType == 'MONTH') ? newGraphCFD[i].endDate
								.substring(newGraphCFD[i].endDate.indexOf("-") + 1) : newGraphCFD[i].endDate;
					}
					$scope.plotGraph('oibGraphContainer', metric, dates,
							inBugs, outBugs, backlogs);
				}

			};
			
			/* plot graph for RG, OIB, CFD */
			$scope.plotGraph = function(container, metric, dates, inBugs,
					outBugs, backlogs, urcMttr) {

				var noOfItems = inBugs.length;
				itemsToDisplay = noOfItems;
				var minItem = 0;

				/*
				 * if (globalService.indicatorValueRelUrc == true) { minItem =
				 * noOfItems - 4; itemsToDisplay = 4; }
				 */
				if (metric == 'RG') {
					var obj = {};
					obj.id = container;

					$scope.chartSeries = [ {
						"name" : "Incoming",
						"data" : inBugs,
						type : "column",
						"color" : "#cf2030"
					}, {
						"name" : "Outgoing",
						"data" : outBugs,
						type : "column",
						"color" : "#6cc04a"
					}, {
						"name" : "Backlog",
						"data" : backlogs,
						type : "line",
						"color" : "#00CCFF"
					}, /*{
						"name" : "RG MTTR",
						"data" : urcMttr,  //rgMttr
						type : "line",
						"color" : "#856299",
						yAxis : 1
					} */];
					obj.chartSeries = $scope.chartSeries;
					obj.chartData = {
						title : {
							text : 'RG - Release Gating (Unique Count of S1, SS and TS bugs)',
							align : "left",
							style : {
								"font-size" : "14px",
								"font-weight" : "bold"
							},
							useHTML : true

						},
						options : {
							lang : {
								thousandsSep : ','
							},
						},
						xAxis : {
							categories : dates,
							showLastLabel : true,
							// endOnTick: true,
							labels : {
								rotation : -45
							},
							dateTimeLabelFormats : { // don't display the dummy year
								month : '%e. %b',
								year : '%b'
							},
							min : minItem,
							max : minItem + (itemsToDisplay - 1),

							/*scrollbar : {
								enabled : globalService.indicatorValueRelUrc
							}*/

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
						yAxis : [ {
							title : {
								text : 'Bug Count'
							}
						}, /*{

							opposite : true,
							title : {
								text : 'RG MTTR',
								style : {
									color : '#856299'
								}
							},
							labels : {
								style : {
									color : '#856299'
								}
							},
						//min: 0,   // for plotting start from 0 in right scale
						} */],

						chart : {
							// Edit chart spacing
							spacingBottom : 0,
							marginRight : 80,
							spacingRight : 0,

						},
						credits : {
							enabled : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},
						/*navigation: {
						            buttonOptions: {
						                verticalAlign: 'center',
						                y: 0,

						            }
						        },*/
						exporting : {
							chartOptions : {

								xAxis : [ {
									//categories: categories,
									min : 0,
									minRange : noOfItems - 1,
									max : noOfItems - 1,
									categories : dates,
									showLastLabel : true,
									//endOnTick : true,
									labels : {
										rotation : -45
									},
									dateTimeLabelFormats : { // don't display the dummy year
										month : '%e. %b',
										year : '%b'
									},

								} ],

							},
							buttons : {
								contextButton : {
									align : "right",
									x : -10,
									menuItems : [
											{
												textKey : 'printChart',
												onclick : function() {
													this.print();
												}
											},
											{
												textKey : 'downloadPNG',
												onclick : function() {
													this.exportChart();
												}
											},
											{
												textKey : 'downloadJPEG',
												onclick : function() {
													this.exportChart({
														type : 'image/jpeg'
													});
												}
											},
											{
												textKey : 'downloadPDF',
												onclick : function() {
													this
															.exportChart({
																type : 'application/pdf'
															});
												}
											},
											{
												textKey : 'downloadCSV',
												onclick : function() {

													var data, filename, link;
													var csv = this.getCSV();

													filename = 'Rg-(Release-Gating).xls';

													if (!csv
															.match(/^data:text\/csv/i)) {
														csv = 'data:text/csv;charset=utf-8,'
																+ csv;
													}
													data = encodeURI(csv);

													link = document
															.createElement('a');
													link.setAttribute(
															'href', data);
													link.setAttribute(
															'download',
															filename);
													// document.getElementById('xlscsvContainer').appendChild(link);
													document.body.appendChild(link);
													link.click();
													document.body.removeChild(link);

												}
											}, {
												textKey : 'downloadXLS',
												onclick : function() {

													this.downloadXLS();

												}

											}, ]
								}
							}
						},
						plotOptions : {
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSRg,
									format : '{point.y:0f}'
								}
							},
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSRg,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSRg,
									allowOverlap : globalService.indicatorValuePostFCSRg,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSRg,
									allowOverlap : globalService.indicatorValuePostFCSRg,
									format : '{point.y:0f}'
								}
							}

						},
						/*exporting : {
						    enabled : true
						},*/

						tooltip : {
							valueSuffix : 'Bugs',
							 valueDecimals: 2,
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
							valueDecimals: 2,
							width : '100%',
							backgroundColor : "#e5e5e5",
							height : '50%',
							formatter : function() {

								var s = '<span style="color:black;font-weight:bold;">'
										+ this.x + '</span><br>';
								$
										.each(
												this.points,
												function(i, point) {
													if (point.series.name == "Incoming")
														spanStyle = 'color:#cf2030;font-weight:bold;';
													else if (point.series.name == "Outgoing")
														spanStyle = 'color:#6cc04a;font-weight:bold;';
													else if (point.series.name == "RG MTTR")
														spanStyle = 'color:#856299;font-weight:bold;';
													else if (point.series.name == "Backlog")
														spanStyle = 'color:#00CCFF;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+ 
															point.y + '</span><br>');
												});

								return s;
							},
							shared : true
						},
						series : $scope.chartSeries,
						loading : false,

						size : {}
					};
					$('#' + container).highcharts(obj.chartData);
					$scope.existChart(obj.id);
					$scope.commonChart.push(obj);

					if ($scope.openChartBool == true) {

						var chart = Highcharts.chart('kbGraphContainerFullScreen',
										obj.chartData);
						chart.reflow();
					}
					//globalService.indicatorValueRelUrc = false;
				}

				else if (metric == 'OIB') {
					var obj = {};
					obj.id = container;

					$scope.chartSeries = [ {
						"name" : "Incoming",
						"data" : inBugs,
						type : "column",
						"color" : "#cf2030"
					}, {
						"name" : "Outgoing",
						"data" : outBugs,
						type : "column",
						"color" : "#6cc04a"
					}, {
						"name" : "Backlog",
						"data" : backlogs,
						type : "line",
						"color" : "#00CCFF"
					},

					];
					obj.chartSeries = $scope.chartSeries;
					obj.chartData = {
						title : {
							text : 'OIB',
							align : "left",
							style : {
								"font-size" : "14px",
								"font-weight" : "bold"
							},
							useHTML : true

						},
						options : {

							lang : {
								thousandsSep : ','
							},

						},
						xAxis : {
							categories : dates,
							showLastLabel : true,
							//endOnTick: true,
							labels : {
								rotation : -45
							},
							dateTimeLabelFormats : { // don't display the dummy year
								month : '%e. %b',
								year : '%b'
							},
							min : minItem,
							max : minItem + (itemsToDisplay - 1),

							/*scrollbar : {
								enabled : globalService.indicatorValueRelRg
							}*/

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
						yAxis : {
							title : {
								text : 'Bug Count'
							}
						},

						series : $scope.chartSeries,

						chart : {
							// Edit chart spacing
							spacingBottom : 0,
							marginRight : 80,
							spacingRight : 0,
						//height: 300,
						},
						credits : {
							enabled : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},

						exporting : {
							chartOptions : {

								xAxis : [ {
									//categories: categories,
									min : 0,
									minRange : noOfItems - 1,
									max : noOfItems - 1,
									categories : dates,
									showLastLabel : true,
									//endOnTick : true,
									labels : {
										rotation : -45
									},
									dateTimeLabelFormats : { // don't display the dummy year
										month : '%e. %b',
										year : '%b'
									},

								} ],

							},
							buttons : {
								contextButton : {
									align : "right",
									x : -10,
									menuItems : [
											{
												textKey : 'printChart',
												onclick : function() {
													this.print();
												}
											},
											{
												textKey : 'downloadPNG',
												onclick : function() {
													this.exportChart();
												}
											},
											{
												textKey : 'downloadJPEG',
												onclick : function() {
													this.exportChart({
														type : 'image/jpeg'
													});
												}
											},
											{
												textKey : 'downloadPDF',
												onclick : function() {
													this
															.exportChart({
																type : 'application/pdf'
															});
												}
											},
											{
												textKey : 'downloadCSV',
												onclick : function() {

													var data, filename, link;
													var csv = this.getCSV();

													filename = 'OIB.xls';

													if (!csv
															.match(/^data:text\/csv/i)) {
														csv = 'data:text/csv;charset=utf-8,'
																+ csv;
													}
													data = encodeURI(csv);

													link = document
															.createElement('a');
													link.setAttribute(
															'href', data);
													link.setAttribute(
															'download',
															filename);
													// document.getElementById('xlscsvContainer').appendChild(link);
													document.body.appendChild(link);
													link.click();
													document.body.removeChild(link);

												}
											}, {
												textKey : 'downloadXLS',
												onclick : function() {

													this.downloadXLS();

												}

											}, ]
								}
							}
						},
						plotOptions : {
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSOib,  
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSOib,	
									allowOverlap : globalService.indicatorValuePostFCSOib,	
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSOib,	
									allowOverlap : globalService.indicatorValuePostFCSOib,	
									format : '{point.y:0f}'
								}
							}

						},
						/*   exporting : {
						       enabled : true
						   }*/

						tooltip : {
							valueSuffix : 'Bugs',
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
							width : '100%',
							valueDecimals: 2,
							backgroundColor : "#e5e5e5",
							formatter : function() {

								var s = '<span style="color:backlogack; font-weight:bold;">'
										+ this.x + '</span><br>';
								$
										.each(
												this.points,
												function(i, point) {
													if (point.series.name == "Incoming")
														spanStyle = 'color:#cf2030;font-weight:bold;';
													else if (point.series.name == "Outgoing")
														spanStyle = 'color:#6cc04a;font-weight:bold;';
													else if (point.series.name == "Backlog")
														spanStyle = 'color:#00CCFF;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+ point.y+ '</span><br>');
												});

								return s;
							},
							shared : true,
						},

						loading : false,

						size : {}
					};

					$('#' + container).highcharts(obj.chartData);
					$scope.existChart(obj.id);
					$scope.commonChart.push(obj);
					if ($scope.openChartBool == true) {
						var chart = Highcharts
								.chart('kbGraphContainerFullScreen',
										obj.chartData);
						chart.reflow();
					}
					//globalService.indicatorValueRelRg = false;
				}//endof if()

				else if (metric == 'CFD') {
					var obj = {};
					obj.id = container;
					$scope.chartSeries = [ {
						"name" : "Incoming",
						"data" : inBugs,
						type : "column",
						"color" : "#cf2030"
					}, {
						"name" : "Outgoing",
						"data" : outBugs,
						type : "column",
						"color" : "#6cc04a"
					}, {
						"name" : "Backlog",
						"data" : backlogs,
						type : "line",
						"color" : "#00CCFF"
					},

					];
					obj.chartSeries = $scope.chartSeries;
					obj.chartData = {
						title : {
							text : 'CFD',
							align : "left",
							style : {
								"font-size" : "14px",
								"font-weight" : "bold"
							},
							useHTML : true

						},
						options : {

							lang : {
								thousandsSep : ','
							},

						},
						xAxis : {
							categories : dates,
							showLastLabel : true,
							endOnTick : true,
							labels : {
								rotation : -45
							},
							dateTimeLabelFormats : { // don't display the dummy year
								month : '%e. %b',
								year : '%b'
							},
							min : minItem,
							max : minItem + (itemsToDisplay - 1),

							/*scrollbar : {
								enabled : globalService.indicatorValue
							}*/

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
						yAxis : {
							title : {
								text : 'Bug Count'
							}
						},

						series : $scope.chartSeries,

						chart : {
							// Edit chart spacing
							spacingBottom : 0,
							marginRight : 80,
							spacingRight : 0,
						//height: 300,
						},
						credits : {
							enabled : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},

						exporting : {
							chartOptions : {

								xAxis : [ {
									//categories: categories,
									min : 0,
									minRange : noOfItems - 1,
									max : noOfItems - 1,
									categories : dates,
									showLastLabel : true,
									//endOnTick : true,
									labels : {
										rotation : -45
									},
									dateTimeLabelFormats : { // don't display the dummy year
										month : '%e. %b',
										year : '%b'
									},

								} ],

								scrollbar : {
									enabled : false
								},

							},
							buttons : {
								contextButton : {
									align : "right",
									x : -10,
									menuItems : [
											{
												textKey : 'printChart',
												onclick : function() {
													this.print();
												}
											},
											{
												textKey : 'downloadPNG',
												onclick : function() {
													this.exportChart();
												}
											},
											{
												textKey : 'downloadJPEG',
												onclick : function() {
													this.exportChart({
														type : 'image/jpeg'
													});
												}
											},
											{
												textKey : 'downloadPDF',
												onclick : function() {
													this
															.exportChart({
																type : 'application/pdf'
															});
												}
											},
											{
												textKey : 'downloadCSV',
												onclick : function() {

													var data, filename, link;
													var csv = this.getCSV();

													filename = 'CFD.xls';

													if (!csv
															.match(/^data:text\/csv/i)) {
														csv = 'data:text/csv;charset=utf-8,'
																+ csv;
													}
													data = encodeURI(csv);

													link = document
															.createElement('a');
													link.setAttribute(
															'href', data);
													link.setAttribute(
															'download',
															filename);
													// document.getElementById('xlscsvContainer').appendChild(link);
													document.body.appendChild(link);
													link.click();
													document.body.removeChild(link);

												}
											}, {
												textKey : 'downloadXLS',
												onclick : function() {

													this.downloadXLS();

												}

											}, ]
								}
							}
						},
						plotOptions : {
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSCfd,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSCfd,
									allowOverlap : globalService.indicatorValuePostFCSCfd,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSCfd,
									allowOverlap : globalService.indicatorValuePostFCSCfd,
									format : '{point.y:0f}'
								}
							}

						},
						/*  exporting : {
						      enabled : true
						  },*/

						tooltip : {
							valueSuffix : 'Bugs',
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
							valueDecimals: 2,
							width : '100%',
							backgroundColor : "#e5e5e5",
							height : '50%',
							formatter : function() {

								var s = '<span style="color:black;font-weight:bold;">'
										+ this.x + '</span><br>';
								$
										.each(
												this.points,
												function(i, point) {
													if (point.series.name == "Incoming")
														spanStyle = 'color:#cf2030;font-weight:bold;';
													else if (point.series.name == "Outgoing")
														spanStyle = 'color:#6cc04a;font-weight:bold;';
													else if (point.series.name == "KB MTTR")
														spanStyle = 'color:#856299;font-weight:bold;';
													else if (point.series.name == "Backlog")
														spanStyle = 'color:#00CCFF;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+point.y+ '</span><br>');
												});

								return s;
							},
							shared : true
						},

						loading : false,

						size : {}
					};
					$('#' + container).highcharts(obj.chartData);
					$scope.existChart(obj.id);
					$scope.commonChart.push(obj);

					if ($scope.openChartBool == true) {
						var chart = Highcharts
								.chart('kbGraphContainerFullScreen',
										obj.chartData);
						chart.reflow();
					}

				}
				else if (metric == 'KB') {
					var obj = {};
					obj.id = container;
					$scope.chartSeries = [ {
						"name" : "Incoming",
						"data" : inBugs,
						type : "column",
						"color" : "#cf2030"
					}, {
						"name" : "Outgoing",
						"data" : outBugs,
						type : "column",
						"color" : "#6cc04a"
					}, {
						"name" : "Backlog",
						"data" : backlogs,
						type : "line",
						"color" : "#00CCFF"
					},

					];
					obj.chartSeries = $scope.chartSeries;
					obj.chartData = {
						title : {
							text : 'KB (Known Backlog)',
							align : "left",
							style : {
								"font-size" : "14px",
								"font-weight" : "bold"
							},
							useHTML : true

						},
						options : {

							lang : {
								thousandsSep : ','
							},

						},
						xAxis : {
							categories : dates,
							showLastLabel : true,
							endOnTick : true,
							labels : {
								rotation : -45
							},
							dateTimeLabelFormats : { // don't display the dummy year
								month : '%e. %b',
								year : '%b'
							},
							min : minItem,
							max : minItem + (itemsToDisplay - 1),

							/*scrollbar : {
								enabled : globalService.indicatorValue
							}*/

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
						yAxis : {
							title : {
								text : 'Bug Count'
							}
						},

						series : $scope.chartSeries,

						chart : {
							// Edit chart spacing
							spacingBottom : 0,
							marginRight : 80,
							spacingRight : 0,
						//height: 300,
						},
						credits : {
							enabled : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},

						exporting : {
							chartOptions : {

								xAxis : [ {
									//categories: categories,
									min : 0,
									minRange : noOfItems - 1,
									max : noOfItems - 1,
									categories : dates,
									showLastLabel : true,
									//endOnTick : true,
									labels : {
										rotation : -45
									},
									dateTimeLabelFormats : { // don't display the dummy year
										month : '%e. %b',
										year : '%b'
									},

								} ],

								scrollbar : {
									enabled : false
								},

							},
							buttons : {
								contextButton : {
									align : "right",
									x : -10,
									menuItems : [
											{
												textKey : 'printChart',
												onclick : function() {
													this.print();
												}
											},
											{
												textKey : 'downloadPNG',
												onclick : function() {
													this.exportChart();
												}
											},
											{
												textKey : 'downloadJPEG',
												onclick : function() {
													this.exportChart({
														type : 'image/jpeg'
													});
												}
											},
											{
												textKey : 'downloadPDF',
												onclick : function() {
													this
															.exportChart({
																type : 'application/pdf'
															});
												}
											},
											{
												textKey : 'downloadCSV',
												onclick : function() {

													var data, filename, link;
													var csv = this.getCSV();

													filename = 'KB.xls';

													if (!csv
															.match(/^data:text\/csv/i)) {
														csv = 'data:text/csv;charset=utf-8,'
																+ csv;
													}
													data = encodeURI(csv);

													link = document
															.createElement('a');
													link.setAttribute(
															'href', data);
													link.setAttribute(
															'download',
															filename);
													// document.getElementById('xlscsvContainer').appendChild(link);
													document.body.appendChild(link);
													link.click();
													document.body.removeChild(link);

												}
											}, {
												textKey : 'downloadXLS',
												onclick : function() {

													this.downloadXLS();

												}

											}, ]
								}
							}
						},
						plotOptions : {
							line : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSKb,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSKb,
									allowOverlap : globalService.indicatorValuePostFCSKb,
									format : '{point.y:0f}'
								}
							},
							column : {
								allowPointSelect : true,
								cursor : 'pointer',
								dataLabels : {
									enabled : globalService.indicatorValuePostFCSKb,
									allowOverlap : globalService.indicatorValuePostFCSKb,
									format : '{point.y:0f}'
								}
							}

						},
						/*  exporting : {
						      enabled : true
						  },*/

						tooltip : {
							valueSuffix : 'Bugs',
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
						    valueDecimals: 2,
							width : '100%',
							backgroundColor : "#e5e5e5",
							height : '50%',
							formatter : function() {

								var s = '<span style="color:black;font-weight:bold;">'
										+ this.x + '</span><br>';
								$.each(
												this.points,
												function(i, point) {
													if (point.series.name == "Incoming")
														spanStyle = 'color:#cf2030;font-weight:bold;';
													else if (point.series.name == "Outgoing")
														spanStyle = 'color:#6cc04a;font-weight:bold;';
													else if (point.series.name == "KB MTTR")
														spanStyle = 'color:#856299;font-weight:bold;';
													else if (point.series.name == "Backlog")
														spanStyle = 'color:#00CCFF;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+
																	point.y + '</span><br>');
												});

								return s;
							},
							shared : true
						},

						loading : false,

						size : {}
					};
					$('#' + container).highcharts(obj.chartData);
					$scope.existChart(obj.id);
					$scope.commonChart.push(obj);

					if ($scope.openChartBool == true) {
						var chart = Highcharts
								.chart('kbGraphContainerFullScreen',
										obj.chartData);
						chart.reflow();
					}

				}

				/*Highcharts.chart.setSize(400, 300);*/
			};
			
			$scope.loadChartTabData = function(tab) {
				// Populate RG data
				$scope.showLoader = true;
				if(tab == 'OIB'){
					postFCSViewService.loadGraphData(postFCSViewService.viewId, 'OIB', $scope.intervalType)
					.success(
							function(graphData) {
								if(graphData.errorMessage != undefined || graphData.errorMessage != null) {
									$scope.showLoader = false;
								    $scope.addAlert(data.errorMessage, "danger");
								}else{
								$scope.showLoader = false;
								$scope.graphDataOIB = graphData;
								$scope.calcDuration($scope.graphDataOIB,'OIB', $scope.subDurationSelectedOIB);
								}
							}).error(function(err) {
						$scope.showLoader = false;
						$scope.navigateTo("errorPage");
					});
				}
				else if(tab == 'KB'){
					postFCSViewService.loadGraphData(postFCSViewService.viewId, 'KB', $scope.intervalType)
					.success(
							function(graphData) {
								if(graphData.errorMessage != undefined || graphData.errorMessage != null) {
									$scope.showLoader = false;
								    $scope.addAlert(data.errorMessage, "danger");
								}else{
								$scope.showLoader = false;
								$scope.graphDataKB = graphData;
								$scope.calcDuration($scope.graphDataKB, 'KB', $scope.subDurationSelectedKB);
								}
							}).error(function(err) {
						$scope.showLoader = false;
						$scope.navigateTo("errorPage");
					});
				}
				
			};
			
				//function called from View on click of tab
				$scope.loadGridData = function(view) {
					$scope.showLoader = true;
					$scope.gridData = "";
					$scope.gridTitle = "", $scope.gridhd1 = "",
					$scope.gridhd2 = "", $scope.gridhd3 = "",
					$scope.gridhd4 = "", $scope.gridhd5 = "";
					postFCSViewService.loadGridData(postFCSViewService.viewId, view).success(
							function(gridData) {
								if(gridData.errorMessage != undefined && gridData.errorMessage != null) {
					                $scope.showLoader = false;
					                $scope.addAlert(gridData.errorMessage, "danger");
					            } else {	
					            	$scope.showLoader = false;

									if (view == 'director' && gridData.dirData != "") {
										$scope.gridDataDirector = gridData;
										$scope.isDataFound = true;
										/*$scope.gridTitle = "Trend Data (KB: "
											+ $scope.kbCaption
											+ ",KB MTTR: "
											+ $scope.kbMttrCaption
											+ ",URC: "
											+ $scope.urcCaption
											+ ",URC MTTR: "
											+ $scope.urcMttrCaption
											+ ",RG: "
											+ $scope.rgCaption
											+ ",CFD: "
											+ $scope.cfdCaption
											+ ",HOLES: "
											+ $scope.holesCaption + ")";*/

										var dirData = gridData.dirData;

										gridDataDir = [];
										var id = 0, parent;
										var directorFields = [ "kb", "rg", "cfd", "holes", "oib", "psirt", "kb_trend", "oib_trend", "rg_trend", "cfd_trend", "holes_trend" ]
										/*var directorFields = [ "kb", "rg"
										                       "oib", "cfd", "psirt", "holes",
										                       "rg_trend", "kb_trend",
										                       "urc_trend", "holes_trend",
										                       "cfd_trend", "kb_mttr",
										                       "urc_mttr" ];*/

										for (var i = 0; i < dirData.length; i++) {
											if (dirData[i]["manager"] == null) {
												id++;
												gridDataDir[i] = {};
												gridDataDir[i]["$$treeLevel"] = 0;
												gridDataDir[i]["level"] = 0;
												gridDataDir[i]["parent"] = null;
												gridDataDir[i]["dirName"] = null;
												gridDataDir[i]["name"] = dirData[i]["director"];
												gridDataDir[i]["id"] = id.toString();
												gridDataDir[i]["expanded"] = false;
												gridDataDir[i]["isLeaf"] = false;
												gridDataDir[i]["loaded"] = true;
												directorFields.forEach(function(item, index) {
													gridDataDir[i][item] = dirData[i][item];
												});
												parent = id.toString();
												parentName = dirData[i]["director"];
											} else {
												id++;
												gridDataDir[i] = {};
												gridDataDir[i]["$$treeLevel"] = 1;
												gridDataDir[i]["level"] = 1;
												gridDataDir[i]["parent"] = parent;
												gridDataDir[i]["dirName"] = parentName;
												gridDataDir[i]["name"] = dirData[i]["manager"];
												gridDataDir[i]["id"] = id.toString();
												gridDataDir[i]["expanded"] = false;
												gridDataDir[i]["isLeaf"] = true;
												gridDataDir[i]["loaded"] = true;
												directorFields.forEach(function(item, index) {
													gridDataDir[i][item] = dirData[i][item];
												});
											}

										}

										$scope.directorGrid.data = gridDataDir;

									} else if (view == 'irr' && gridData.irrdata != "") {
										//console.log("IRR grid data:"+angular.toJson(gridData.irrdata));
										$scope.showLoader = true;
										postFCSViewService.getIrrGridTitle(postFCSViewService.viewId).success(function(data) { 	
								
												if(null == data){
												
												$scope.irrGridTitle = "IRR = NA";
												
											}else{
													if(data.errorMessage != undefined && null != data.errorMessage) {
										                $scope.showLoader = false;
										                $scope.addAlert(data.errorMessage, "danger");
										            } else {	
														$scope.showLoader = false;
														$scope.irrGridTitle = "IRR = " + data+" %";
										            }
													
										}
													$scope.irrDataDirector = gridData;
			
													$scope.isDataFound = true;
													$scope.irrGrid.data = gridData;
													$("#irrContainer").hide();
												}).error(function(err) {
													$scope.showLoader = false;
													$scope.navigateTo("errorPage");
												});
				
									} else {
										$scope.isDataFound = false;
									}
					            }

							}).error(function(err) {
								$scope.showLoader = false;
								$scope.navigateTo("errorPage");
							});

				};
				
				// scrubber for Graph
				$scope.showScrubberForGraphs = function(metric) {
					var url;
					var appendToUrl = "?pageName=result.html&type=scrubber&header=n&expert=";
					url = CISCO.enggit.dashboard_init.urlScrubberReport
							+ appendToUrl;
					var query = $scope.baseQuery;
					console.log("$scope.baseQuery"+$scope.baseQuery);

						// var sevAndStatusCond = " and (
						// Severity:1,2,3,4,5,6 and ( Severity:1 or
						// TS:TS or SS:SS ) )";
					if(metric == "CFD"){
						query = query + " and Found:customer-use and Severity:1,2,3 and Status:S,N,A,O,W,I"
					} else if(metric == "OIB"){
						query = query + " and OIB:OIB and Status:S,N,A,O,W,I";
					} else if(metric == "RG"){
						query = query + " and ( Severity:1,2,3,4,5,6 and ( Severity:1 or TS:TS or SS:SS ) )";
					} else if(metric == "KB"){
						query = query + " and ( Severity:1,2,3)";
					}
				
					url = url + query;
					window.open(url,"_blank");
				};

				//Trend Chart for Director view
				$scope.showIndividualTrendChartDir = function(level, name, dirName, view, metric, container) {
					$scope.level = level;
										$scope.directorName = name;
					
				
					if (level == "1") {
						$scope.chartHeading = "Trend chart for Manager : "
							+ name;
						$scope.mgrName = name;
						$scope.name = name;


					} else {
						dirName = name;
						$scope.dirName = name;
						name = null;
						$scope.chartHeading = "Trend chart for Director : "
							+ dirName;
					}

					$scope.showLoader = true;
					
					postFCSViewService.getOQDirTrendByViewId(postFCSViewService.viewId, dirName, name, metric)
					.success(
							function(graphData) {
								if (graphData.errorMessage != undefined
										|| graphData.errorMessage != null) {
									$scope.showLoader = false;
									$scope.addAlert(graphData.errorMessage, "danger");
								}else {
									$scope.showLoader = false;
									var inBugs = [], outBugs = [], backlogs = [], dates = [], kbmttr = [], urcmttr = [], newGraphTrendDir = graphData;
									for (var i = 0; i < newGraphTrendDir.length; i++) {
										inBugs[i] = parseInt(newGraphTrendDir[i].incoming);
										outBugs[i] = parseInt(newGraphTrendDir[i].closed);
										backlogs[i] = parseInt(newGraphTrendDir[i].backlog);
										kbmttr[i] = parseInt(newGraphTrendDir[i].kbMttr);
										//urcmttr[i] = parseInt(newGraphTrendDir[i].urcMttr);
										dates[i] = newGraphTrendDir[i].endDate;
									}

									$("#chartModal").modal('show');
									$('#chartModal').on('shown.bs.modal', function(e) {
											$scope.plotGraph(
													container,
													metric,
													dates,
													inBugs,
													outBugs,
													backlogs);  //,urcmttr
									});
									/*for data label*/
									/*if (metric == "KB") {
										$scope.plotGraphKB(container,
												metric, dates, inBugs,
												outBugs, backlogs,
												kbmttr);

									} else {*/
										$scope.plotGraph(container,
												metric, dates, inBugs,
												outBugs, backlogs); 	//,urcmttr
									//}
								}
							});
					

				$scope.queryButtonText = "Show Query";
				$scope.showHideDirTrendQuery = function(queryVal) {

					$scope.trendQuery = !$scope.trendQuery;
					if (queryVal == true) {
						$scope.queryButtonText = "Show Query";
					} else {
						$scope.queryButtonText = "Hide Query";
					}

				};
			};
			
			//scrubber for grid for director 
			//*********************** Need to modify this code for Scrubber popup on grid *********/
			
			/*$scope.showIndiScrubberDir = function(level, name, dirName, view, metric) {

				var appendToUrl = "?pageName=result.html&type=scrubber&header=N&expert=";
				var url = CISCO.enggit.dashboard_init.urlScrubberReport
						+ appendToUrl;
				$scope.isManager = (level == "1") ? true : false;
				var tempQuery = '', finalQuery = '';
				var q_name;
				if ($scope.relGlanceBaseQuery != '' && $scope.isManager == true) {
					tempQuery = $scope.relGlanceBaseQuery
							+ " and DIRECTOR:" + dirName
							+ " and DE-manager:" + name;
					q_name = postFCSViewService.viewId + "_" + dirName + "_"
							+ name + "_" + metric;
				} else if ($scope.relGlanceBaseQuery != '') {
					tempQuery = $scope.relGlanceBaseQuery
							+ " and DIRECTOR:" + name;
					q_name = postFCSViewService.viewId + "_" + name + "_"
							+ metric;
				}

				if (tempQuery != '' && metric == "KB") {
					finalQuery = tempQuery + " and Severity:1,2,3";
				} else if (tempQuery != '' && metric == "CFD") {
					finalQuery = tempQuery
							+ " and Found:customer-use and Severity:1,2,3";
					//if RG query is not present, take master query and append conditions to form RG query
				} else if (tempQuery != '' && metric == "RG") {
					if ($scope.relGlanceRGQuery == null
							|| $scope.relGlanceRGQuery == ""
							|| $scope.relGlanceRGQuery == undefined) {
						finalQuery = tempQuery
								+ " and ( Severity:1,2,3,4,5,6 and ( Severity:1 or TS:TS or SS:SS ) )";
					} else {
						if ($scope.isManager == true) {
							finalQuery = $scope.relGlanceRGQuery
									+ " and DIRECTOR:" + dirName
									+ " and DE-manager:" + mgrName;
						} else {
							finalQuery = $scope.relGlanceRGQuery
									+ " and DIRECTOR:" + dirName;

						}
					}
				} else if (tempQuery != '' && metric == "URC"
						&& $scope.bugbacklogStartDate != null
						&& $scope.bugbacklogStartDate != null)
					
					finalQuery = tempQuery
							+ " and Severity:2,3 and Status:S["
							+ $scope.bugbacklogStartDate + ":"
							+ $scope.bugbacklogEndDate + "]";
				
				else if ($scope.relGlanceHolesQuery != null
						&& metric == "HOLES")
					finalQuery = $scope.relGlanceHolesQuery + tempQuery
							+ " minus Severity:7";
				
				if (finalQuery == '')
					$scope.addAlert("HOLES query not found",'danger');
				else {
					$scope.makeScrubberReport(name, finalQuery, q_name,
							view);
				}
				
			};*/
			
			//SRE graph code 
			$scope.SRE = [ {
				name : 'Default(S123)'
			}, {
				name : 'As-Is'
			} ];
			$scope.loadSREGraph = function() {

				$scope.showLoader = true;
				postFCSViewService.getSREQueryId(postFCSViewService.viewId)
						.success(function(data) {
									
									$scope.queryId = "0";
									if (data[0] != null) {
										$scope.queryId = data[0].queryId;
									}
									postFCSViewService.populateSREGraph($scope.queryId)
											.success(function(data) {
														$scope.showLoader = false;
														
														if (data.length != 0) {
															 
															$scope.isDataFound = true;
															
															$scope.weekendDateList = $scope.formateWeekEndDate(data);
															$scope.selectedDate = {};
															$scope.selectedDate.selected = {
																weekEndDate : $scope.weekendDateList[0].weekEndDate
															};
															
															$scope.selectedSreType = {};
															$scope.selectedSreType.selected = {
																name : "Default(S123)"
															}
															$scope.setSRECurve($scope.selectedDate.selected.weekEndDate);
															$scope.setSREType($scope.selectedSreType.selected.name);

														} else { 
															$scope.isDataFound = false;
														}
														
														
													})
											.error(function(err) {
														$scope.showLoader = false;
														$scope.navigateTo("errorPage");
													});
								}).error(function(err) {
							$scope.showLoader = false;
							$scope.navigateTo("errorPage");
						});

			};
			$scope.setSRECurve = function(date) {
				 $("#sreContainer").show();
				var objDate = new Date(date);

				locale = "en-us";
				month = objDate.toLocaleString(locale, {
					month : "short"
				});
				var d1 = new Date(objDate);
				var date = d1.getDate();
				if (d1.getDate() < 10)
					date = "0" + date;

				var parsedDate = (date + "-" + month + "-" + d1
						.getFullYear()).toLocaleString().replace(/[^ -~]/g,
						'');

				$scope.week_End_date = parsedDate;

				$scope.getSRECurveData();
				$scope.setSREType = function(type) {
					$scope.sre_type = type;
					if (type == 'As-Is') {
						$scope.sre_type = "SRE";
					} else if (type == 'Default(S123)') {
						$scope.sre_type = "Default";
					}

					$scope.getSRECurveData();
				}

			};
			$scope.getSRECurveData = function() {
				 $scope.showLoader = true;
				postFCSViewService.getSRECurveHeading($scope.queryId, $scope.week_End_date, $scope.sre_type)
						.success(
								function(headingSRE) {

									if (headingSRE.length > 0) {
										$scope.sreCurveHeading = headingSRE[0].sreHeading;
									}
								}).error(function(err) {
									$scope.showLoader = false;
									$scope.navigateTo("errorPage");
								});

				postFCSViewService.getSRECurve($scope.queryId, $scope.week_End_date,$scope.sre_type)
						.success(function(data) {
							if (data.length != 0) {

								if (data.errorMessage != undefined || data.errorMessage != null) {
								 
									$scope.addAlert( data.errorMessage, "danger");
								} else {
									 

									actualInc = [], predInc = [], sreDate = [], SreCurveData = data;
									for (var i = 0; i < SreCurveData.length; i++) {
										actualInc[i] = parseInt(SreCurveData[i].actualInc);

										predInc[i] = parseInt(SreCurveData[i].predInc);
										sreDate[i] = SreCurveData[i].sreDate;

										// sarondla to resolve IE issue 
										if (data[i].sreDate != undefined || data[i].sreDate != null) {
											var d1 = new Date(data[i].sreDate.replace(/ /g,'T'));
											var d2 = [ "Jan", "Feb",
														"Mar", "Apr",
														"May", "Jun",
														"Jul", "Aug",
														"Sep", "Oct",
														"Nov", "Dec" ][d1
														.getMonth()]
														+ ' '
														+ d1.getDate()
														+ ', '
														+ d1.getFullYear();

												sreDate[i] = d2;
										}

									}
									setTimeout(function(){
										$scope.plotGraphSRE(actualInc, predInc, sreDate, SreCurveData); 
										$scope.showLoader = false;
									}, 3000);
								}

							}
								}).error(function(err) {
									//$scope.showLoader = false;
									$scope.navigateTo("errorPage");
								});
			};
			$scope.formateWeekEndDate = function(jsonData) {

				var weekEndDateData = [];
				for (var i = 0; i < jsonData.length; i++) {
					var item = {};
					
					var parts = jsonData[i]["weekEndDate"].split(" ");
					//var d1 = new Date(jsonData[i]["weekEndDate"]);
					//var d3 = new Date(d1);
					var formatDate = parts[0];
					var d3 = new Date();

				    parts = formatDate.split(/[-\/]/);  // Split date on - or /
				    d3.setFullYear(parseInt(parts[0], 10));
				    d3.setMonth(parseInt(parts[1], 10) - 1); // Months start at 0 in JS
				    d3.setDate(parseInt(parts[2], 10));
					var date = d3.getDate();
					if (d3.getDate() < 10)
						date = "0" + date;
					
					var month = (d3.getMonth() + 1);
					if ((d3.getMonth() + 1) < 10)
						month = "0" + month;

					var weekEnd_date = month + "/" + date + "/"
							+ d3.getFullYear();

					item["weekEndDate"] = weekEnd_date;
					if (i == 0)
						item["selected"] = true;
					weekEndDateData.push(item);
				}
				return weekEndDateData;
			};
			
			$scope.plotGraphSRE = function(actualInc, predInc, sreDate, sreCurve) {
				var obj = {};
				obj.id = "SRE";
				var noOfItems = sreCurve.length;
				itemsToDisplay = noOfItems;
				var minItem = 0;
				/*if (globalService.indicatorValue == true) {
				    minItem = noOfItems - 4;
				    itemsToDisplay = 4;
				}*/
				$scope.chartSeries = [ {
					"name" : "Pred_Inc",
					"data" : predInc,
					type : "line",
					"color" : "#cf2030"
				}, {
					"name" : "Actual_Inc",
					"data" : actualInc,
					type : "line",
					"color" : "#6cc04a"
				}];
				obj.chartSeries = $scope.chartSeries;
				$scope.chartConfigSRE = {
					options : {
						chart : {
							type : 'column',

						}
					},

					lang : {
						thousandsSep : ','
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
				
					title : {
						text : $scope.sreCurveHeading,
						align : "left",
						useHTML : true,
						style : {
							"font-size" : "14px",
							"font-weight" : "bold"
						}

					},
					subtitle: {
					    text: 'SRE data gets refreshed every Saturday (weekend)',
					    align:'right',
					 y:250
					},
					chart : {
						// Edit chart spacing
						spacingBottom : 4,
						marginRight : 0,
						spacingRight : 0,
						renderTo : '#sreGraphContainer'
					//height: 255,
					},
					xAxis : {
						categories : sreDate,
						showLastLabel : true,
						endOnTick : false,
						labels : {
							rotation : -45
						},
						dateTimeLabelFormats : { // don't display the dummy year
							month : '%e. %b',
							year : '%b'
						},
						min : minItem,
						max : minItem + (itemsToDisplay - 1),
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
						trackBorderColor : '#CCC',

					},
					yAxis : {
						title : {
							text : 'Value'
						}
					},

					series : $scope.chartSeries,

					credits : {
						enabled : false,
						href : 'http://cqi',
						text : 'cqi.cisco.com'
					},
					/*  navigation: {
					                buttonOptions: {
					                    verticalAlign: 'top',
					                    y:-60,

					                }
					            },*/
					exporting : {
						chartOptions : {

							xAxis : [ {
								//categories: categories,
								min : 0,
								minRange : noOfItems - 1,
								max : noOfItems - 1,
								categories : sreDate,
								showLastLabel : true,
								//endOnTick : true,
								labels : {
									rotation : -45
								},
								dateTimeLabelFormats : { // don't display the dummy year
									month : '%e. %b',
									year : '%b'
								},

							} ],

						},
						buttons : {
							contextButton : {
								align : "right",
								x : -40,
								verticalAlign : 'top',
								y : -60,
								menuItems : [ {
									text : 'Get permanent URL',

								}, {
									textKey : 'downloadPNG',
									onclick : function() {
										this.exportChart();
									}
								}, {
									textKey : 'downloadJPEG',
									onclick : function() {
										this.exportChart({
											type : 'image/jpeg'
										});
									}
								}, {
									textKey : 'downloadPDF',
									onclick : function() {
										this.exportChart({
											type : 'application/pdf'
										});
									},
								},

								],

							}
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
						crosshairs : [ false, true ],
						width : '100%',
						backgroundColor : "#e5e5e5",
						formatter : function() {

							var s = '<span style="color:black;font-weight:bold;">'
									+ this.x + '</span><br>';
							$.each(
											this.points,
											function(i, point) {
												if (point.series.name == "Pred_Inc") {
													spanStyle = 'color:#cf2030;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+ parseFloat(
																	point.y)
																	.toLocaleString() + '</span><br>');
												} else if (point.series.name == "Actual_Inc") {
													spanStyle = 'color:#6cc04a;font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+ point.y + '</span><br>');
												}
											});

							return s;
						},
						shared : true
					},

					loading : false,

					size : {}
				};

				obj.chartData = $scope.chartConfigSRE;
				$scope.existChart(obj.id);
				$scope.commonChart.push(obj);
				if ($scope.openChartBool == true) {
					var chart = Highcharts.chart(
							'kbGraphContainerFullScreen', obj.chartData);
					chart.reflow();
				}

			};
			
			$scope.changeInterval = function(metric, interval) {

				$scope.showLoader = true;
				$scope.intervalType = interval;
				postFCSViewService.loadGraphData(postFCSViewService.viewId, metric, $scope.intervalType)
						.success(
								function(graphData) {
									if(graphData.errorMessage != undefined || graphData.errorMessage != null) {
										$scope.showLoader = false;
									    $scope.addAlert(data.errorMessage, "danger");
									}
									else{
										$scope.showLoader = false;
										if (metric == "RG") {
											$scope.graphDataRG = graphData;
											$scope.calcDuration($scope.graphDataRG, metric, $scope.subDurationSelectedRG);
	
										} else if (metric == "OIB") {
											$scope.graphDataOIB = graphData;
											$scope.calcDuration($scope.graphDataOIB, metric, $scope.subDurationSelectedOIB);
	
										} else if (metric == "CFD") {
											$scope.graphDataCFD = graphData;
											$scope.calcDuration($scope.graphDataCFD, metric, $scope.subDurationSelectedCFD);
										}
										else {
											$scope.graphDataKB = graphData;
											$scope.calcDuration($scope.graphDataKB, metric, $scope.subDurationSelectedKB);
										}
									}
								}).error(function(err) {
							$scope.showLoader = false;
							$scope.navigateTo("errorPage");
						});
			};
			
			$scope.subDurSelected = function(duration, metric) {
				switch (duration) {
				case '1Y':
					if (metric == 'RG') {
						$scope.subDurationSelectedRG = '1Y';
						$scope.calcDuration($scope.graphDataRG, metric,
								$scope.subDurationSelectedRG);
					} else if (metric == 'OIB') {

						$scope.subDurationSelectedOIB = '1Y';
						$scope.calcDuration($scope.graphDataOIB, metric,
								$scope.subDurationSelectedOIB);
					} else if (metric == 'KB') {

						$scope.subDurationSelectedKB = '1Y';
						$scope.calcDuration($scope.graphDataKB, metric,
								$scope.subDurationSelectedKB);
					} else {
						$scope.subDurationSelectedCFD = '1Y';
						$scope.calcDuration($scope.graphDataCFD, metric,
								$scope.subDurationSelectedCFD);
					}
					break;
				case '9M':
					if (metric == 'RG') {
						$scope.subDurationSelectedRG = '9M';
						$scope.calcDuration($scope.graphDataRG, metric,
								$scope.subDurationSelectedRG);
					} else if (metric == 'OIB') {

						$scope.subDurationSelectedOIB = '9M';
						$scope.calcDuration($scope.graphDataOIB, metric,
								$scope.subDurationSelectedOIB);
					} else if (metric == 'KB') {

						$scope.subDurationSelectedKB = '9M';
						$scope.calcDuration($scope.graphDataKB, metric,
								$scope.subDurationSelectedKB);
					} else {
						$scope.subDurationSelectedCFD = '9M';
						$scope.calcDuration($scope.graphDataCFD, metric,
								$scope.subDurationSelectedCFD);
					}
					break;
				case '6M':
					if (metric == 'RG') {
						$scope.subDurationSelectedRG = '6M';
						$scope.calcDuration($scope.graphDataRG, metric,
								$scope.subDurationSelectedRG);
					} else if (metric == 'OIB') {

						$scope.subDurationSelectedOIB = '6M';
						$scope.calcDuration($scope.graphDataOIB, metric,
								$scope.subDurationSelectedOIB);
					}else if (metric == 'KB') {

						$scope.subDurationSelectedKB = '6M';
						$scope.calcDuration($scope.graphDataKB, metric,
								$scope.subDurationSelectedKB);
					} else {
						$scope.subDurationSelectedCFD = '6M';
						$scope.calcDuration($scope.graphDataCFD, metric,
								$scope.subDurationSelectedCFD);
					}
					break;
				case '3M':
					if (metric == 'RG') {
						$scope.subDurationSelectedRG = '3M';
						$scope.calcDuration($scope.graphDataRG, metric,
								$scope.subDurationSelectedRG);
					} else if (metric == 'OIB') {

						$scope.subDurationSelectedOIB = '3M';
						$scope.calcDuration($scope.graphDataOIB, metric,
								$scope.subDurationSelectedOIB);
					} else if (metric == 'KB') {

						$scope.subDurationSelectedKB = '3M';
						$scope.calcDuration($scope.graphDataKB, metric,
								$scope.subDurationSelectedKB);
					} else {
						$scope.subDurationSelectedCFD = '3M';
						$scope.calcDuration($scope.graphDataCFD, metric,
								$scope.subDurationSelectedCFD);
					}
					break;
				}
				;
			};
			
			$scope.clickData = function(data) {
				$scope.popUpChartDataLabel = data;
			};
			
			$scope.openChart = function(id) {
				$scope.popUpChartDataLabel = 'N';
				$scope.openChartBool = true;
				$scope.chartPopup = id;
				modalInstance = $uibModal.open({
					animation : false,
					windowClass : 'the-modal zIndex2000',
					templateUrl : 'fullScreenChart.html',
					size : 'lg',
					scope : $scope
				});

				var obj = $scope.commonChart.filter(function(e) {
					if (e.id == id)
						return e;
				});
				if (obj !== 'undefined') {
					var objA = obj[obj.length - 1];
					// $scope.fullScreenData = obj.commonChart;
					$timeout(
							function() {
								objA.chartData.series = objA.chartSeries;
								/*console.log("objA.chartData.plotOptions : "+angular.toJson(objA.chartData.plotOptions));
								console.log("objA.chartData.plotOptions.column :" + angular.toJson(objA.chartData.plotOptions.column));*/
								objA.chartData.plotOptions.column.dataLabels.enabled = false;
								objA.chartData.plotOptions.column.dataLabels.allowOverlap = false;
								objA.chartData.plotOptions.line.dataLabels.enabled = false;
								var chart = Highcharts.chart(
										'kbGraphContainerFullScreen',
										objA.chartData);
								chart.reflow();
							}, 500);
				}
			};

			$scope.closeChart = function() {
				$scope.openChartBool = false;
				modalInstance.dismiss('cancel');
			};
			
			/*get permanent Url*/

			$scope.getChartUrl = function(container) {
				//console.log("container : "+container);
				var interval = "";
				var queryId = "";
				var sreDate = "";
				var sreType = "";
				var metric = "", mgrName = "", dirName = "";
				if (container.indexOf("dirTrend") != -1) {
					if ($scope.name != undefined) {
						mgrName = $scope.mgrName;
					} else {
						mgrName = null;
					}
					if ($scope.directorName != undefined) {
						dirName = $scope.dirName;
					} else {
						dirName = null;
					}

					if (container.indexOf("KB") != -1) {
						metric = "KB";
					} else if (container.indexOf("RG") != -1) {
						metric = "RG";
					} else if (container.indexOf("OIB") != -1) {
						metric = "OIB";
					} else
						metric = "CFD";
				} 
				else if (container.indexOf("sre") != -1) {
					sreDate = $scope.week_End_date;
					sreType = $scope.sre_type;
					/*console.log("sreData is ---"
							+ $scope.week_End_date + "---");*/
				} else {
					if (container.indexOf("rg") != -1) {
						metric = "RG";
						/*interval = $(
								'input[name=rgGraphRadio]:checked')
								.val();*/

					} else if (container.indexOf("kb") != -1) {
						metric = "KB";
						/*interval = $(
								'input[name=kbGraphRadio]:checked')
								.val();*/
					}
					 else if (container.indexOf("oib") != -1) {
						metric = "OIB";
					} else
						metric = "CFD";
				}
				var url = "";
				/*if (metric == "URC") {
					url = document.location.origin
							+ document.location.pathname
							+ "chartUrc.png?viewId="
							+ relViewService.viewId + "&metric="
							+ metric + "&interval=" + "WEEK"
							+ "&queryId=" + queryId + "&dirName="
							+ dirName + "&mgrName=" + mgrName;

				} else if (metric == "KB") {

					url = document.location.origin
							+ document.location.pathname
							+ "chartKb.png?viewId="
							+ relViewService.viewId + "&metric="
							+ metric + "&interval=" + "WEEK"
							+ "&queryId=" + queryId + "&dirName="
							+ dirName + "&mgrName=" + mgrName;

				}

				else*/ 
				if (container.indexOf("sre") != -1) {
					url = document.location.origin
							+ document.location.pathname
							+ "chartSre.png?sreQueryId="
							+ $scope.queryId + "&sreType="
							+ sreType + "&sreDate=" + sreDate;
				} else {
					url = document.location.origin
							+ document.location.pathname
							+ "chart.png?viewId="
							+ postFCSViewService.viewId + "&metric="
							+ metric + "&interval=" + "WEEK"
							+ "&queryId=" + queryId + "&dirName="
							+ dirName + "&mgrName=" + mgrName;
				}
				url = url.replace("postFCSViewReport.htm", "");
				$("#chartUrlModal").modal();
				$('.permaUrl').html(
						"<a target='_backlogank' href='" + url
								+ "';>" + url + "</a>");
				$('#trendPermaURLImage').attr('src', url);

			};
			
			//function to download grid 
			$scope.createExcelFromGrid = function(view) {

				var ShowLabel = true, JSONData;

				$scope.showLoader = true;

				/*if (view == "platform") {
					data = $scope.gridDataPlatform;
				} else*/ if (view == "director") {
					data = $scope.gridDataDirector;
				} else if (view == "irr") {
				
					data = $scope.irrDataDirector;

				}

				$scope.showLoader = false;
				if (view == "director") {
					var arrData;
					arrData = typeof data.dirData != 'object' ? JSON
							.parse(data.dirData) : data.dirData;
				} /*else if (view == "platform") {
					arrData = typeof data.platData != 'object' ? JSON
							.parse(data.platData) : data.platData;
				}*/ else if (view == "irr") {
					arrData = typeof data != 'object' ? JSON
							.parse(data) : data;

				}

				var CSV = '';

				if (ShowLabel) {
					var row = "";
					// This loop will extract the label from 1st index of on array
					for ( var index in arrData[0]) {
						// Now convert each value to string and comma-seprated
						if (index != '$$hashKey')
							row += index + ',';
					}
					row = row.slice(0, -1);
					// append Label row with line break
					CSV += row + '\r\n';
				}
				http: //localhost:8041/EnggDashboardLSVN/

				// 1st loop is to extract each row
				for (var i = 0; i < arrData.length; i++) {
					var row = "";
					// 2nd loop will extract each column and convert it in
					// string comma-seprated
					for ( var index in arrData[i]) {
						if (index != '$$hashKey')
							row += '"' + arrData[i][index] + '",';

					}

					row.slice(0, row.length - 1);
					// add a line break after each row
					CSV += row + '\r\n';

				}

				if (CSV == '') {
					alert("Invalid data");
					return;
				}

				// Generate a file name
				var fileName = $scope.viewName + "_report"; // currently giving the grid div as csv
				// Initialize file format you want csv or xls
				var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

				// you can use either>> window.open(uri) but this will not work in some browsers
				// or you will not get the correct file extension
				// this trick will generate a temp <a /> tag
				var link = document.createElement("a");
				link.href = uri;

				// set the visibility hidden so it will not effect on your
				// web-layout
				link.style = "visibility:hidden;width:200";
				link.download = fileName + ".csv";

				// this part will append the anchor tag and remove it after
				// automatic click
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

			};
			
			 $scope.changeURL = function(viewType){
            	 $scope.navigateTo('postFCSViewReport',false,'.htm?viewId='+postFCSViewService.viewId+'&viewType='+viewType,true);
            	 if(viewType == 'dir'){
      				$("#sreContainer").hide();
      				$("#irrContainer").hide();
      				$("#dirContainer").show();
      			}
      			else if(viewType == 'sre'){
      				$("#dirContainer").hide();
      				$("#irrContainer").hide();
      				$("#sreContainer").show();
      			}
      			else if(viewType = "irr"){
            		 $("#dirContainer").hide();
      				$("#sreContainer").hide();
      				$("#irrContainer").show(); 
            	 }
             };
             if ($location.search()["viewType"] !== undefined) {
           	  $scope.tabName = $location.search()["viewType"];
         			if($scope.tabName == 'dir'){
         				$scope.activeForm = 0;
         				$("#sreContainer").hide();
         				$("#irrContainer").hide();
         				$("#dirContainer").show();
         			}
         			else if($scope.tabName == 'sre'){
         				$scope.activeForm = 1;
         				$("#dirContainer").hide();
         				$("#irrContainer").hide();
         				$("#sreContainer").show();
         				//$scope.loadSREGraph();
         				
         			}else if($scope.tabName == 'irr'){
         				$scope.activeForm = 2;
         				$("#dirContainer").hide();
         				$("#sreContainer").hide();
         				$("#irrContainer").show();
         				//$scope.loadGridData('irr');
         				
         			}
             }       
			
		}]);
});
