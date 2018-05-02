/* AMD format. Add dependencies like services, directives in the [] */
define(['app'],
		function(app) {
			app.controller("weeklyThresholdCtrl", [ '$scope', '$http','uiGridConstants', '$log', '$document', '$timeout',
			                    					'$location', '$interval', 'globalService','weeklyThresholdService', 
			                    					function($scope, $http,uiGridConstants, $log, $document, $timeout, $location,$interval, globalService, weeklyThresholdService) {
				$scope.hideWeeklyThresholdForm = true;
				$scope.weeklyThresholdTable = true;
				$scope.disableSetGoal = false;
				$scope.setGoal = true;
				$scope.column = [];
				$scope.durationDisplay = "0";
				$scope.editGoal = true;
				$scope.previousData = [];
				$scope.weeklyThresholdData=[];
				$scope.selectedView = {};
				$scope.hideShowWidgetFlag("visible");

				/* to load views in dropdown */
					$scope.showLoader = true;
				weeklyThresholdService.getAllViews(globalService.groupName)
							.success(function(data, response) {
								if(data.errorMessage != undefined || data.errorMessage != null) {
									$scope.showLoader = false;
								    $scope.addAlert(data.errorMessage, "danger");
								}else{
								$scope.weeklyThreshold = data;
								//$scope.showLoader = false;
								}
							})
							.error(
								function(err) {
									$scope.showLoader = false;
		                              $scope.navigateTo("errorPage");

							});
					
				
					 
				  	
				/* loading views depending on view id */
				
							$scope.setViewId = function(id, name) {
								$location.search('viewName', name);
							$scope.viewName = name;
						
							$scope.weeklyThresholdTable = false;
							weeklyThresholdService.setViewId(id);
							weeklyThresholdService.setViewName($scope.viewName);
							 
							//$scope.showLoader = true;
							weeklyThresholdService.checkThreshold()
								.success(
									function(data) {
										if(data.errorMessage != undefined || data.errorMessage != null) {
											$scope.showLoader = false;
										    $scope.addAlert(data.errorMessage, "danger");
										}else{
										$scope.a = data[0].count;
										if ($scope.a == "0") {
											/* load threshold for form */
											//$scope.showLoader = true;
											weeklyThresholdService.loadThreshold()
												.success(function(data, response) {
													if(data.errorMessage != undefined || data.errorMessage != null) {
														$scope.showLoader = false;
													    $scope.addAlert(data.errorMessage, "danger");
													}else{
													//$scope.showLoader = false;
													$scope.threshold = data;
													}
												})
												.error(function(err) {
													$scope.showLoader = false;
							                        $scope.navigateTo("errorPage");

												});
											// if threshold is not already created
											$scope.hideWeeklyThresholdForm = false;
											$scope.weeklyThresholdTable = true;
											$scope.editGoal = true;
											
											weeklyThresholdService.loadDate()
													.success(function(data) {
														$scope.showLoader = false;
															if (data.length != "0") {
																$scope.actualFcsDate = data[0].actualFcsDate;
																$scope.endDate = new Date();
																$scope.sDate = data[0].startDate;
																//$scope.startDate = new Date();
																}
															
															})
													.error(
															function(err) {
																$scope.showLoader = false;
									                              $scope.navigateTo("errorPage");

													});
										} else {

											$scope.hideWeeklyThresholdForm = true;
											$scope.editGoal = true;
											$scope.showLoader = true;
											weeklyThresholdService.createWeeklyThresholdGrid()
													.success(function(data) {
														$scope.displayName = data.split(',');
														weeklyThresholdService.loadMetricData()
																.success(function(data) {
																		$scope.showLoader = false;
																		$scope.weeklyThresholdData = data;
																		$scope.jsonObj = [];
																		$scope.weeklyThresholdGridData();
																		$scope.addColumn();
																		$scope.weeklyThresholdGrid.data = $scope.jsonObj;
																		$scope.column = [];
																		$scope.durationDisplay = "0";
																		
																	})
																	.error(function(err) {
																		$scope.showLoader = false;
											                              $scope.navigateTo("errorPage");
																	});
														

														})
													  .error(function(err) {
														  $scope.showLoader = false;
							                              $scope.navigateTo("errorPage");
													  });
									}
										}
							})
							.error(function(err) {
								$scope.showLoader = false;
	                              $scope.navigateTo("errorPage");
							});
						
				}
						
				/* if threshold is already created data will be displayed in this grid */
				 
				$scope.weeklyThresholdGrid = {
					enableRowSelection : true,
					multiSelect : false,
					enableSorting : true,
					enableHorizontalScrollbar : 1,
					enableVerticalScrollbar : 0,
					enableColumnMenus : false,
					columnDefs : $scope.column,
					
					onRegisterApi : function(gridApi) {
						$scope.mtGridApi = gridApi;
						$scope.mtGridApi.selection.on.rowSelectionChanged($scope,function(row) {
							
								$scope.currentSelected = row;
							
								var selectedNumofRows = $scope.mtGridApi.grid.selection.selectedCount;
								$scope.selectedNumofRows = selectedNumofRows;
								
						});
						$interval(function() {
							$scope.mtGridApi.core.handleWindowResize();
						}, 5)
						$scope.mtGridApi.core.refresh();
					}
				};
				
				/* to dynamically add column in ui grid depending on no of weeks/months */
				 
				$scope.addColumn = function() {
				
					for ($scope.j = 0; $scope.j < $scope.displayName.length; $scope.j++) {
						$scope.column = [];
						$scope.weeklyThresholdGrid = {
							enableRowSelection : true,
							enableSelectAll : false,
							enableSorting : true,
							enableColumnMenus : false,
							enableHorizontalScrollbar : 1,
							enableVerticalScrollbar : 0,
							
							columnDefs : $scope.column,
							onRegisterApi : function(gridApi) {
								$scope.mtGridApi = gridApi;
								$scope.mtGridApi.selection.on.rowSelectionChanged($scope,function(row) {
										$scope.currentSelected = row;
										var selectedNumofRows = $scope.mtGridApi.grid.selection.selectedCount;
										$scope.selectedNumofRows = selectedNumofRows;
								});
								$interval(function() {
									$scope.mtGridApi.core.handleWindowResize();
								}, 5)
								$scope.mtGridApi.core.refresh();
							}
						};
						$scope.column.push({field : 'name',displayName : 'Metric Name',headerTooltip : true,cellTooltip : true, width:"20%",pinnedLeft:true,headerCellClass: "text-center",});
						for (var i = 0; i < $scope.displayName.length; i++) {
							var templ = '<div><div class="ui-grid-cell-contents text-right leftDivWeeklyGrid">{{row.entity.low'+ i+'}}</div><div class="rightDivWeeklyGrid text-right">{{row.entity.high'
									+ i + '}}</div></div>'
							$scope.durationDisplay = $scope.column.push({
								field : 'low' + i,
								displayName : $scope.displayName[i],
								headerTooltip : true,
								cellTemplate : templ,
								width:"20%",
								headerCellClass: "text-center",
							
							
							});
					
						}
					}
					if($scope.column.length<=4){
						
						for(var i=0;i<$scope.column.length;i++){
						$scope.weeklyThresholdGrid.columnDefs[i].width="*";
						}
					}
				}

				/* pushing data from service in grid to array format */
				$scope.weeklyThresholdGridData = function() {
					angular.forEach($scope.weeklyThresholdData,function(obj, idx) {
						$scope.metricList = obj.split("#");
						$scope.threholdVals = $scope.metricList[1].split(",");
						$scope.count = $scope.metricList[2];
						$scope.metricData = {};
						for ($scope.i = 0; $scope.i < $scope.count; $scope.i++) {
							
								$scope.lowvalue = $scope.threholdVals[$scope.i];
								$scope.validation = $scope.metricList[3];
								$scope.highVal = $scope.lowvalue.substring($scope.lowvalue.indexOf("-") + 1);
								$scope.lowVal = $scope.lowvalue.substring(0,$scope.lowvalue.indexOf("-"));
								$scope.addRedColor = $scope.addRed($scope.validation,$scope.lowVal,$scope.highVal);
								$scope.addGreenColor = $scope.addGreen($scope.validation,$scope.lowVal,$scope.highVal);
								$scope.metricData["low" + $scope.i] = $scope.addRedColor;
								$scope.metricData["high" + $scope.i] = $scope.addGreenColor;
						}
								$scope.metricData["name"] = $scope.metricList[0];
								$scope.metricData["validation"] = $scope.metricList[3];
								$scope.jsonObj.push($scope.metricData);
					});
				}

				/* calculate red based on low and high */
				$scope.addRed = function(validation, low, high) {
					
					var addRed = "0";
					if (validation != null && validation == "low" && high != 0) {
						addRed = ">=" + high;
					} else if (validation != null && validation == "high"
							&& low != 0) {
						addRed = ">=" + low;
					}

					if (addRed != null)
						return addRed;
					else
						return "";

				}
				/* calculate green based on low and high */
				$scope.addGreen = function(validation, low, high) {
					var addGreen = "0";
					if (validation != null && validation == "low" && low != 0) {
						addGreen = "<=" + low;
					} else if (validation != null && validation == "high"
							&& high != 0) {
						addGreen = ">=" + high;
					}

					if (addGreen != null)
						return addGreen;
					else
						return "";

				}
				/* calculate yellow based on low and high */
				$scope.addYellow = function(validation, low, high) {
					var addYellow = "";
					if (low == 0 && high == low) {
						addYellow = 0;
					} else if (validation != null && validation == "low") {
						addYellow = low + " - " + high;
						;
					} else if (validation != null && validation == "high") {
						addYellow = low + " - " + high;
					}
					if (addYellow != "" || addYellow != null)
						return addYellow;
					else
						return "";
				}
				/* set metric name */
				$scope.setThreshold = function(threshold) {
					weeklyThresholdService.setThresholdName(threshold);
				}
				

				/* goal for form */
				$scope.goal = [ {name : 'Weekly'}, {name : 'Monthly'}, {name : 'Fortnightly'} ];

				/* Datepicker */
				  $scope.today = function() {
					    $scope.endDate = new Date();
					   
					};
					  $scope.today();
					  $scope.inlineOptions = {
							    customClass: getDayClass,
							    minDate: new Date(),
							    showWeeks: true
							  };
					  $scope.open1 = function() {
							$scope.popup1.opened = true;
						};
				$scope.setDate = function(year, month, day) {
				    $scope.start = new Date(year, month, day);
				  };
				var setStartDate = new Date();
				
				   $scope.startDate =setStartDate.setDate(setStartDate.getDate() -30);
			
					  $scope.open2 = function() {
							
							$scope.popup2.opened = true;
						};
						

						$scope.popup2 = {
							opened : false
						};
						$scope.popup1 = {
							opened : false
						};



						function getDayClass(data) {
						    var date = data.date,
						      mode = data.mode;
						    if (mode === 'day') {
						      var dayToCheck = new Date(date).setHours(0,0,0,0);

						      for (var i = 0; i < $scope.events.length; i++) {
						        var currentDay = new Date($scope.events[i].date).setHours(0,0,0,0);

						        if (dayToCheck === currentDay) {
						          return $scope.events[i].status;
						        }
						      }
						    }

						    return '';
						  }
				/* table to be displayed on click on setGoal */
				$scope.setGoalWeeklyThreshold = {

					enableRowSelection : true,
					enableSelectAll : false,
					enableFiltering : false,
					enableColumnMenus : false,
					onRegisterApi : function(gridApi) {
						$scope.mtGridApi = gridApi;
						$interval(function() {
							$scope.mtGridApi.core.handleWindowResize();
						}, 10);
						$scope.mtGridApi.core.refresh();
						$scope.mtGridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue,oldValue) {
							$scope.editedLow = rowEntity.low;
							$scope.editedHigh = rowEntity.high;
								if (rowEntity.low != ''&& rowEntity.high != '') {
										if ($scope.validation == "low") {
											if ($scope.editedLow == "0"&& $scope.editedHigh == "0") {
														rowEntity.yellow = "0";
														rowEntity.red = "0";
														rowEntity.green = "0";
													} else {

														rowEntity.yellow = $scope.editedLow+ " - "+ $scope.editedHigh;
														rowEntity.red = '>='+ $scope.editedHigh;
														rowEntity.green = '<='+ $scope.editedLow;
													}
												} else {
													if ($scope.editedLow == "0"
															&& $scope.editedHigh == "0") {
														rowEntity.yellow = "0";
														rowEntity.red = "0";
														rowEntity.green = "0";
													} else {
														rowEntity.yellow = $scope.editedLow+ " - "	+ $scope.editedHigh;
														rowEntity.red = '<='+ $scope.editedLow;
														rowEntity.green = '>='+ $scope.editedHigh;
													}
												}
												$scope.$apply();
											}

						});
						
						

					},
					enableSorting : true,
					enableHorizontalScrollbar : 0,
					enableVerticalScrollbar : 0,
					
				};
				$scope.setGoalWeeklyThreshold.columnDefs = [
						{
							field : 'goal',
							displayName : 'Goal ',
							enableCellEdit : false,
							headerCellClass: "text-center",
						
						},
						{
							field : 'start_date',
							displayName : 'Start Date',
							enableCellEdit : false,
							headerCellClass: "text-center",
							cellFilter: 'dateFormatGrid'
						},
						{
							field : 'end_date',
							displayName : 'End Date',
							enableCellEdit : false,
							headerCellClass: "text-center",
							cellFilter: 'dateFormatGrid'
						},
						{
							field : 'low',
							displayName : 'Low',
							enableCellEdit : true,
							cellClass:'text-right',
							headerCellClass: "text-center",
							cellTemplate : "<div class='editableBox'>{{row.entity.low}}</div>"
							
						},
						{
							field : 'high',
							displayName : 'High',
							headerCellClass: "text-center",
							enableCellEdit : true,
							cellClass:'text-right',
							cellTemplate : "<div class='editableBox'>{{row.entity.high}}</div>"
						
						},
						{
							field : 'red',
							displayName : 'Red',
							headerCellClass: "text-center",
							cellClass : 'mtBgDanger text-right',
							enableCellEdit : false,
							
							
						},
						{
							field : 'yellow',
							displayName : 'Yellow',
							headerCellClass: "text-center",
							cellClass : 'mtBgWarning text-right',
							enableCellEdit : false,
							
						},
						{
							field : 'green',
							displayName : 'Green',
							headerCellClass: "text-center",
							cellClass : 'mtBgSuccess text-right',
							enableCellEdit : false,
							
						
						},
						{
							field : '""',
							displayName : '',
							headerCellClass: "text-center",
							cellTemplate : '<a class="icocircle gridico ico-copy" href="javascript:void(0)"  id="" name="" data-toggle="tooltip" title="Copy" ng-click="grid.appScope.copy(rowRenderIndex)"> <span data-tooltip="Copy"></span></a> <a  class="icocircle gridico ico-copyAll" href="javascript:void(0)" id="" name="" data-toggle="tooltip" data-placement="left" title="Copy All"  ng-click="grid.appScope.copyAll(rowRenderIndex)"> <span data-tooltip="Copy All"></span></a>'
							/*cellTemplate : '<div class="ui-grid-cell-contents"><input type="button" value="Copy" class="btn btn-primary btn-copy"  id="" name="" data-toggle="tooltip" title="Copy" ng-click="grid.appScope.copy(rowRenderIndex)"><input type="button" value="Copy All" class="btn btn-primary btn-copy-all"  id="" name="" data-toggle="tooltip" data-placement="left" title="Copy All"  ng-click="grid.appScope.copyAll(rowRenderIndex)"></div>'*/
						} ];
			

				/* to create new threshold on click on set goal */
				$scope.createThreshold = function() {
				
					if ($scope.threshold.selected == undefined) {
						$scope.addAlert("Select threshold", "warning");
					}
					else if ($scope.startDate >= $scope.endDate) {
						$scope.addAlert("Start date should not be greater than or equal to end date",
										"warning");
					} else if ($scope.goal.selected == undefined) {
						$scope.addAlert("Select goal", "warning");
					} else {
						$scope.setGoal = false;
						$scope.showLoader = true;
						
							weeklyThresholdService.setGoal(globalService.groupName)
								.success(function(data) {
									if(data.errorMessage != undefined || data.errorMessage != null) {
										$scope.showLoader = false;
									    $scope.addAlert(data.errorMessage, "danger");
									}else{
										$scope.showLoader = false;
										$scope.validation = data;
										$scope.d3 = new Date($scope.startDate);
										$scope.d4 = new Date($scope.endDate);
										if ($scope.goal.selected.name == 'Weekly') {
											
													$scope.addDays = 7 - $scope.d3.getDay();
													$scope.d3.setDate($scope.d3.getDate()+ $scope.addDays - 7);
													$scope.jsondata = [];
													$scope.n = 0;
													$scope.i = 0;
													$scope.rows = 0;
													$scope.noOfRows = 0;
													while ($scope.d4 > $scope.d3) {
														$scope.d5 = new Date($scope.d3);
														$scope.d5.setDate($scope.d5.getDate() + 6);
														$scope.sta_date = ($scope.d3.getMonth() + 1)+ "/"+ $scope.d3.getDate()+ "/"+ $scope.d3.getFullYear();
														$scope.en_date = ($scope.d5.getMonth() + 1)+ "/"+ $scope.d5.getDate()+ "/"+ $scope.d5.getFullYear();
														$scope.goalName = "Week"+ ($scope.i + 1);
														$scope.low = '';
														$scope.high = '';
														$scope.addRed = '';
														$scope.addYellow = '';
														$scope.addGreen = '';
														$scope.jsondata[$scope.i] = {
															goal : $scope.goalName,
															start_date : $scope.sta_date,
															end_date : $scope.en_date,
															low : $scope.low,
															high : $scope.high,
															red : $scope.addRed,
															yellow : $scope.addYellow,
															green : $scope.addGreen
														};
														$scope.i = $scope.i + 1;
														$scope.d3.setDate($scope.d3.getDate() + 7);
														$scope.n++;
	
													}
	
													$scope.rows = $scope.n;
													$scope.noOfRows = $scope.rows;
	
												} else if ($scope.goal.selected.name == "Monthly") {
												
													$scope.addDays = 7 - $scope.d3.getDay();
	
													$scope.d3.setDate($scope.d3.getDate()+ $scope.addDays - 7);
													$scope.jsondata = [];
													$scope.n = 0;
													$scope.i = 0;
													while ($scope.d4 > $scope.d3) {
	
														$scope.d5 = new Date($scope.d3);
	
														$scope.d5.setDate($scope.d5.getDate() + 27);
														$scope.sta_date = ($scope.d3.getMonth() + 1)+ "/"+ $scope.d3.getDate()+ "/"+ $scope.d3.getFullYear();
														$scope.en_date = ($scope.d5.getMonth() + 1)+ "/"+ $scope.d5.getDate()+ "/"+ $scope.d5.getFullYear();
	
														$scope.goalName = "Month"
																+ ($scope.i + 1);
	
														$scope.jsondata[$scope.i] = {
															goal : $scope.goalName,
															start_date : $scope.sta_date,
															end_date : $scope.en_date,
															low : '',
															high : '',
															red : '',
															yellow : '',
															green : ''
														};
														$scope.i = $scope.i + 1;
														$scope.d3.setDate($scope.d3.getDate() + 28);
														$scope.n++;
													}
	
													$scope.rows = $scope.n;
													$scope.noOfRows = $scope.rows;
	
												} else {
													
													$scope.addDays = 7 - $scope.d3.getDay();
													$scope.d3.setDate($scope.d3.getDate()+ $scope.addDays - 7);
													$scope.jsondata = [];
													$scope.n = 0;
													$scope.i = 0;
													while ($scope.d4 > $scope.d3) {
														$scope.d5 = new Date($scope.d3);
														$scope.d5.setDate($scope.d5.getDate() + 13);
														$scope.sta_date = ($scope.d3.getMonth() + 1)+ "/"+ $scope.d3.getDate()+ "/"+ $scope.d3.getFullYear();
														$scope.en_date = ($scope.d5.getMonth() + 1)+ "/"+ $scope.d5.getDate()+ "/"+ $scope.d5.getFullYear();
														$scope.goalName = "Fortnight"+ ($scope.i + 1);
														$scope.jsondata[$scope.i] = {
															goal : $scope.goalName,
															start_date : $scope.sta_date,
															end_date : $scope.en_date,
															low : '',
															high : '',
															red : '',
															yellow : '',
															green : ''
														};
														$scope.i = $scope.i + 1;
														$scope.d3.setDate($scope.d3.getDate() + 14);
														$scope.n++;
	
													}
	
													$scope.rows = $scope.n;
													$scope.noOfRows = $scope.rows;
												}
											
												$scope.disableSetGoal = true;
												$scope.metricName = weeklyThresholdService.getThresholdName();
												$scope.setGoalWeeklyThreshold.data = $scope.jsondata;
									}
								})
								.error(function(err) {
									$scope.showLoader = false;
		                              $scope.navigateTo("errorPage");
								});
						}
								


				}
				/* copy functionality */
				$scope.copy = function(iRow) {
					
					$scope.jsondata[iRow + 1].low = $scope.jsondata[iRow].low;
					$scope.jsondata[iRow + 1].high = $scope.jsondata[iRow].high;
					$scope.jsondata[iRow + 1].red = $scope.jsondata[iRow].red;
					$scope.jsondata[iRow + 1].yellow = $scope.jsondata[iRow].yellow;
					$scope.jsondata[iRow + 1].green = $scope.jsondata[iRow].green;

				}
				/* copyAll functionality */
				$scope.copyAll = function(iRow) {

					for ($scope.i = iRow; $scope.i < $scope.noOfRows; $scope.i++) {

						if ($scope.jsondata[iRow + $scope.i] == undefined) {

						} else {
							$scope.jsondata[iRow + $scope.i].low = $scope.jsondata[iRow].low;
							$scope.jsondata[iRow + $scope.i].high = $scope.jsondata[iRow].high;
							$scope.jsondata[iRow + $scope.i].red = $scope.jsondata[iRow].red;
							$scope.jsondata[iRow + $scope.i].yellow = $scope.jsondata[iRow].yellow;
							$scope.jsondata[iRow + $scope.i].green = $scope.jsondata[iRow].green;
						}
					}
				}
				var flagForNew=0;
				$scope.validateFieldsForNew = function(){
				
				
					for(var i=0;i<$scope.jsondata.length;i++){
						if($scope.jsondata[i].low == '' || $scope.jsondata[i].low == null || $scope.jsondata[i].low == undefined || 
								$scope.jsondata[i].high == '' || $scope.jsondata[i].high == null || $scope.jsondata[i].high == undefined){
							$scope.addAlert("Enter values for all fields",
							"warning");
							flagForNew=0;
							break;
						}
						else if (isNaN($scope.jsondata[i].low)|| isNaN($scope.jsondata[i].high)) {
							
								$scope.addAlert("Enter number for Low and High value",
										"warning");
								flagForNew=0;
								break;
							}else if ($scope.jsondata[i].low < 0 || $scope.jsondata[i].high < 0) {
							
								$scope.addAlert("Enter a positive value for Low and High",
												"warning");
								flagForNew=0;
								break;
							} else if ((parseInt($scope.jsondata[i].low) != 0 && parseInt($scope.jsondata[i].high) != 0)	&&( parseInt($scope.jsondata[i].low) >= parseInt($scope.jsondata[i].high))) {
						$scope.addAlert("Low value cannot be greater than or equal to High value",
											"warning");
						flagForNew=0;
						break;
					}
							else{
								
								flagForNew=1;
							
									}
							}
					return flagForNew;
				} 
				/* save data for create new threshold */
				$scope.saveWeeklyData = function() {
					var returnVal = $scope.validateFieldsForNew();
					
					if(returnVal == 0) {
						return ;
					}
				 else {
						$scope.goalName = $scope.goal.selected.name;
						$scope.showLoader = true;
						weeklyThresholdService.saveWeeklyThreshold($scope.goalName,$scope.validation, $scope.jsondata)
								.success(function(result) {
									if(result.errorMessage != undefined || result.errorMessage != null) {
										$scope.showLoader = false;
									    $scope.addAlert(data.errorMessage, "danger");
									}else{
									if(result != null && result.ERROR != "ERROR") {
										weeklyThresholdService.sendWeeklyThresholdEmail($scope.goalName,$scope.validation,$scope.jsondata)
											.success(function(resultData) {
								
												if(resultData.errorMessage != undefined || resultData.errorMessage != null) {
													$scope.showLoader = false;
												    $scope.addAlert(data.errorMessage, "danger");
												}else{
												$scope.showLoader = false;
													if(resultData.ERROR == "ERROR") {
														$scope.addAlert('Email is not sent due to an application error. Please contact application administrator',
																						'failure');

													} else {
													$scope.addAlert('Email sent , support team will contact you',
																						'success');

													}
												}
												})
												.error(function(err) {
													$scope.showLoader = false;
						                              $scope.navigateTo("errorPage");

												});
											}
											$scope.showLoader = true;
											weeklyThresholdService.createWeeklyThresholdGrid()
												.success(function(data,response) {
													if(data.errorMessage != undefined || data.errorMessage != null) {
														$scope.showLoader = false;
													    $scope.addAlert(data.errorMessage, "danger");
													}else{
													$scope.displayName = data.split(',');
													weeklyThresholdService.loadMetricData()
														.success(function(data) {
															if(data.errorMessage != undefined || data.errorMessage != null) {
																$scope.showLoader = false;
															    $scope.addAlert(data.errorMessage, "danger");
															}else{
															$scope.weeklyThresholdData = data;
															$scope.jsonObj = [];
															$scope.weeklyThresholdGridData();
															$scope.addColumn();
															$scope.weeklyThresholdGrid.data = $scope.jsonObj;
															$scope.showLoader = false;
															$scope.column = [];
															$scope.durationDisplay = "0";
															$scope.addAlert("Threshold successfully updated. Changes will be reflected in report after 30 mins",
																									"success");
															
															}
														})
														.error(function(err) {
															$scope.showLoader = false;
								                              $scope.navigateTo("errorPage");
														});
													}
													$scope.hideWeeklyThresholdForm = true;
													$scope.weeklyThresholdTable = false;
										})
										.error(function(err) {
											$scope.showLoader = false;
				                              $scope.navigateTo("errorPage");

										});
									}
								})
								.error(function(err) {
									$scope.showLoader = false;
		                              $scope.navigateTo("errorPage");
								});
						
						
					}
				}

				/* on click on cancel button while creating new threshold */
				$scope.cancelThreshold = function() {
					$scope.setGoal = true;
					$scope.disableSetGoal = false;

				}
				/* Copy functionality for edit */
				$scope.copyEdit = function(iRow) {

					$scope.editedData[iRow + 1].low = $scope.editedData[iRow].low;
					$scope.editedData[iRow + 1].high = $scope.editedData[iRow].high;
					$scope.editedData[iRow + 1].red = $scope.editedData[iRow].red;
					$scope.editedData[iRow + 1].yellow = $scope.editedData[iRow].yellow;
					$scope.editedData[iRow + 1].green = $scope.editedData[iRow].green;

				}
				/* copyAll functionality for edit */
				$scope.copyAllEdit = function(iRow) {
					for ($scope.i = iRow; $scope.i < $scope.editedData.length; $scope.i++) {
						if ($scope.editedData[iRow + $scope.i] == undefined) {

						} else {
							$scope.editedData[iRow + $scope.i].low = $scope.editedData[iRow].low;
							$scope.editedData[iRow + $scope.i].high = $scope.editedData[iRow].high;
							$scope.editedData[iRow + $scope.i].red = $scope.editedData[iRow].red;
							$scope.editedData[iRow + $scope.i].yellow = $scope.editedData[iRow].yellow;
							$scope.editedData[iRow + $scope.i].green = $scope.editedData[iRow].green;
						}
					}
				}

				/* table to be displayed on edit */
				$scope.editGoalWeeklyThreshold = {
					enableRowSelection : true,
					enableSelectAll : false,
					enableFiltering : false,
					enableColumnMenus : false,
					onRegisterApi : function(gridApi) {
						$scope.mtGridApi = gridApi;
						$scope.mtGridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue,oldValue) {
						
							$scope.editedLow = rowEntity.low;
							$scope.editedHigh = rowEntity.high;
						
								if (rowEntity.low != '' && rowEntity.high != '') {
										if ($scope.validation == "low") {
											if ($scope.editedLow == "0" && $scope.editedHigh == "0") {
													rowEntity.yellow = "0";
													rowEntity.red = "0";
													rowEntity.green = "0";
											} else {
												rowEntity.yellow = $scope.editedLow+ " - "+ $scope.editedHigh;
												rowEntity.red = '>='+ $scope.editedHigh;
												rowEntity.green = '<='+ $scope.editedLow;
											}
										} else {
											if ($scope.editedLow == "0"&& $scope.editedHigh == "0") {
												rowEntity.yellow = "0";
												rowEntity.red = "0";
												rowEntity.green = "0";
											} else {
												rowEntity.yellow = $scope.editedLow+ " - "+ $scope.editedHigh;
												rowEntity.red = '<='	+ $scope.editedLow;
												rowEntity.green = '>='+ $scope.editedHigh;
											}
										}
											$scope.$apply();
									}
						
						});
						$interval(function() {
							$scope.mtGridApi.core.handleWindowResize();
						}, 5);
						$scope.mtGridApi.core.refresh();

					},
					enableSorting : true,
					enableHorizontalScrollbar : 0,
					enableVerticalScrollbar : 0,
					
				};
				$scope.editGoalWeeklyThreshold.columnDefs = [
						{
							field : 'goal',
							displayName : 'Goal ',
							headerCellClass: "text-center",
							enableCellEdit : false
						},
						{
							field : 'start_date',
							displayName : 'Start Date',
							headerCellClass: "text-center",
							enableCellEdit : false,
							cellFilter: 'dataFormatGrid'
						},
						{
							field : 'end_date',
							displayName : 'End Date',
							headerCellClass: "text-center",
							enableCellEdit : false,
							cellFilter: 'dataFormatGrid'
						},
						{
							field : 'low',
							displayName : 'Low',
							enableCellEdit : true,
							cellClass:'text-right',
							headerCellClass: "text-center",
							cellTemplate : "<div class='editableBox'>{{row.entity.low}}</div>"
						},
						{
							field : 'high',
							displayName : 'High',
							enableCellEdit : true,
							headerCellClass: "text-center",
							cellClass:'text-right',
							cellTemplate : "<div class='editableBox'>{{row.entity.high}}</div>"
						},
						{
							field : 'red',
							displayName : 'Red',
							headerCellClass: "text-center",
							cellClass : 'mtBgDanger text-right',
							
							enableCellEdit : false
						},
						{
							field : 'yellow',
							displayName : 'Yellow',
							headerCellClass: "text-center",
							cellClass : 'mtBgWarning text-right',
							enableCellEdit : false
						},
						{
							field : 'green',
							displayName : 'Green',
							headerCellClass: "text-center",
							cellClass : 'mtBgSuccess text-right',
							
							enableCellEdit : false
						},
						{
							field : '""',
							displayName : '',
							cellTemplate : '<a class="icocircle gridico ico-copy" href="javascript:void(0)"  id="" name="" data-toggle="tooltip" title="Copy" ng-click="grid.appScope.copyEdit(rowRenderIndex)"> <span data-tooltip="Copy"></span></a> <a  class="icocircle gridico ico-copyAll" href="javascript:void(0)" id="" name="" data-toggle="tooltip" data-placement="left" title="Copy All"  ng-click="grid.appScope.copyAllEdit(rowRenderIndex)"> <span data-tooltip="Copy All"></span></a>'
							/*cellTemplate : '<input type="button" value="Copy" class="btn btn-primary btn-copy"  id="" name="" data-toggle="tooltip" title="Copy" ng-click="grid.appScope.copyEdit(rowRenderIndex)"><input type="button" value="Copy All" class="btn btn-primary btn-copy-all"  id="" name="" data-toggle="tooltip" data-placement="left" title="Copy All"  ng-click="grid.appScope.copyAllEdit(rowRenderIndex)">'*/
						} ];
				/* data to be displayed for edit */
				$scope.editWeeklyThresholdGoal = function() {
				if ($scope.selectedNumofRows == 1) {
						weeklyThresholdService.setThresholdName($scope.currentSelected.entity.name);
						$scope.metricNameEdit = weeklyThresholdService.getThresholdName();
						$scope.hideWeeklyThresholdForm = true;
						$scope.weeklyThresholdTable = true;
						$scope.editGoal = false;
						$scope.showLoader = true;
						weeklyThresholdService.editWeeklyThreshold()
							.success(function(data) {
								if(data.errorMessage != undefined || data.errorMessage != null) {
									$scope.showLoader = false;
								    $scope.addAlert(data.errorMessage, "danger");
								}else{
								$scope.showLoader = false;
								$scope.editedData = [];
									for (var i = 0; i < data.length; i++) {
										$scope.editLow = data[i].low;
										$scope.editHigh = data[i].high;
										$scope.editValidation = data[i].validation;
											if ($scope.editValidation == null) {
													weeklyThresholdService.setGoal(globalService.groupName)
														.success(function(data,response) {
																$scope.showLoader = false;
																$scope.editValidation = data;
														})
														.error(function(err) {
															$scope.showLoader = false;
								                              $scope.navigateTo("errorPage");
														});
												}
												$scope.goalVal = data[0].interval;
												var s_date = data[i].start_date.split('-');
												var s_day = s_date[2].substring(0, 2);
												var e_date = data[i].end_date.split('-');
												var e_day = e_date[2].substring(0, 2);
												var sta_date = new Date(data[i].start_date);
												var en_date = new Date(data[i].end_date);
												$scope.startDateEdit = s_date[1]	+ "/"+ s_day+ "/"+ s_date[0];
												$scope.endDateEdit = e_date[1]+ "/" + e_day + "/"+ e_date[0];
												if ($scope.editValidation == "low") {
													$scope.editAddRed = $scope.addRed("low",$scope.editLow,$scope.editHigh);
													$scope.editAddYellow = $scope	.addYellow("low",$scope.editLow,$scope.editHigh);
													$scope.editAddGreen = $scope.addGreen("low",$scope.editLow,$scope.editHigh);
												} else {
													$scope.editAddRed = $scope.addRed("high",$scope.editLow,$scope.editHigh);
													$scope.editAddYellow = $scope.addYellow("high",$scope.editLow,	$scope.editHigh);
													$scope.editAddGreen = $scope.addGreen("high",$scope.editLow,	$scope.editHigh);
												}
												if ($scope.goalVal == "Weekly"|| $scope.goalVal == "weekly") {
													$scope.goalNameEdit = "Week"+ (i + 1);
												} else if ($scope.goalVal == "Monthly"|| $scope.goalVal == "monthly") {
													$scope.goalNameEdit = "Month"+ (i + 1);
												} else {
													$scope.goalNameEdit = "Fortnight"+ (i + 1);
												}

												$scope.editedData[i] = {
													goal : $scope.goalNameEdit,
													start_date : $scope.startDateEdit,
													end_date : $scope.endDateEdit,
													low : $scope.editLow,
													high : $scope.editHigh,
													red : $scope.editAddRed,
													yellow : $scope.editAddYellow,
													green : $scope.editAddGreen,
													validation : $scope.editValidation
												};
												
												$scope.previousData.push( {
													goal : $scope.goalNameEdit,
													start_date : $scope.startDateEdit,
													end_date : $scope.endDateEdit,
													low : $scope.editLow,
													high : $scope.editHigh,
													red : $scope.editAddRed,
													yellow : $scope.editAddYellow,
													green : $scope.editAddGreen,
													validation : $scope.editValidation
												}); 
											
											}
											$scope.editGoalWeeklyThreshold.data = $scope.editedData;
								}
										})
								.error(function(err) {
									$scope.showLoader = false;
		                              $scope.navigateTo("errorPage");

								});
						$scope.selectedNumofRows =0;
					} else {
						$scope.addAlert("Select a row to be edited","warning");

					}

				}
				var flag=0;
				$scope.validateFields = function(){
				
				
					for(var i=0;i<$scope.editedData.length;i++){
						if($scope.editedData[i].low == '' || $scope.editedData[i].low == null || $scope.editedData[i].low == undefined || 
								$scope.editedData[i].high == '' || $scope.editedData[i].high == null || $scope.editedData[i].high == undefined){
							$scope.addAlert("Enter values for all fields",
							"warning");
							flag=0;
							break;
						}
						else if (isNaN($scope.editedData[i].low)|| isNaN($scope.editedData[i].high)) {
							
								$scope.addAlert("Enter number for Low and High value",
										"warning");
								flag=0;
								break;
							}else if ($scope.editedData[i].low < 0 || $scope.editedData[i].high < 0) {
							
								$scope.addAlert("Enter a positive value for Low and High",
												"warning");
								flag=0;
								break;
							} else if ((parseInt($scope.editedData[i].low) != 0 && parseInt($scope.editedData[i].high) != 0)	&&( parseInt($scope.editedData[i].low) >= parseInt($scope.editedData[i].high))) {
						$scope.addAlert("Low value cannot be greater than or equal to High value",
											"warning");
						flag=0;
						break;
					}
							else{
								
								flag=1;
							
									}
							}
					return flag;
				} 
				/* save functionality on edit */
				
				$scope.saveWeeklyDataEdit = function() {
						
					var returnVal = $scope.validateFields();
					if(returnVal == 0) {
						return ;
					}
				
					 else {
				
						$scope.showLoader = true;
						
						weeklyThresholdService.saveWeeklyThresholdEdit($scope.goalName,$scope.validation, $scope.previousData,$scope.editedData)
								.success(function(result) {
									if(result.errorMessage != undefined || result.errorMessage != null) {
										$scope.showLoader = false;
									    $scope.addAlert(data.errorMessage, "danger");
									}else{
									weeklyThresholdService.createWeeklyThresholdGrid()
										.success(function(data,response) {
												$scope.displayName = data.split(',');
												weeklyThresholdService.loadMetricData()
																		.success(function(data) {
																			if(data.errorMessage != undefined || data.errorMessage != null) {
																				$scope.showLoader = false;
																			    $scope.addAlert(data.errorMessage, "danger");
																			}else{
																			$scope.showLoader = false;
																					$scope.weeklyThresholdData = data;
																					$scope.jsonObj = [];
																					$scope.weeklyThresholdGridData();
																					$scope.addColumn();

																					$scope.weeklyThresholdGrid.data = $scope.jsonObj;
																					$scope.showLoader = false;

																					$scope.column = [];
																					$scope.durationDisplay = "0";
																					$scope.addAlert("Threshold successfully updated. Changes will be reflected in report after 30 mins",
																									"success");
																					$scope.weeklyThresholdTable = true;
																					$scope.editGoal = true;
																					$scope.weeklyThresholdTable = false;
																			}	
																			})
																		.error(function(err) {
																			$scope.showLoader = false;
												                              $scope.navigateTo("errorPage");

																		});
											})
											.error(function(err) {
												$scope.showLoader = false;
					                              $scope.navigateTo("errorPage");

											});
									}

										})
								.error(
										function(err) {
											$scope.showLoader = false;
				                              $scope.navigateTo("errorPage");
								});
				}
					 }
				//}
				
				$scope.cancelEditThreshold = function() {
					
					$scope.editGoal = true;
					$scope.weeklyThresholdTable = false;
				}
			/*Book marking*/
				$scope.getViewToReset = function(items){
					for(var i=0;i<$scope.weeklyThreshold.length;i++){
						if($scope.weeklyThreshold[i].viewName == items){
							return $scope.weeklyThreshold[i];
						}
					}
					return false;
				}
					$scope.togIt=true;
				$timeout(function () {
					if ($location.search()["viewName"] !== undefined) {
						var item = $scope.getViewToReset($location.search()["viewName"]);
						$scope.selectedView.selected = {id:item.id,viewName:item.viewName};
						$scope.togIt=false;
						$scope.setViewId($scope.selectedView.selected.id,$scope.selectedView.selected.viewName);
						return $scope.togIt
						}
					else{
						$scope.showLoader = false;
					}
				}, 2000);
				

			}]);
			
		});