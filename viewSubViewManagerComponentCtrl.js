/* AMD format. Add dependencies like services, directives in the [] */
define(['app'],
		function(app) {
		
			app.controller("viewSubViewManagerComponentCtrl", [ '$scope', '$http', '$interval',
			                        					'uiGridTreeViewConstants', '$timeout', '$rootScope',
			                        					'globalService','widgetService', '$uibModal', '$timeout', '$location', 'uiGridExporterService', 'uiGridExporterConstants', 
			                        					function($scope, $http, $interval, uiGridTreeViewConstants, $timeout, $rootScope,
					globalService, widgetService, $uibModal,$timeout,$location,uiGridExporterService, uiGridExporterConstants) {
			  var userCheckList = []; // For User Check which is in search list
				$scope.queryIDNameMapping = {}; 
				$scope.chartStyleCofig = [];
				$scope.yAxis = [];
				$scope.ifPin = true;
				var graphsToSaveLocal = []; //local array to save graphs to send to main array
				var savedGraphsFlag = false;
				$scope.graphsDataToSave = {
					    "UserID" :globalService.userId
				};
				var savedGraphCount = 0;
				$scope.selectPopup = false;
				$scope.gridHeightToggle = false;
				$scope.arrType = 'Manager';
				$scope.togglePopup = function(bool){
				  $scope.selectPopup = bool;
				}
				$scope.scopeWeekDate = "";
				var weekDate = ''
					if($location.search()["weekDate"] != undefined){
						weekDate = $location.search()["weekDate"];
						$scope.$emit("weekDateAssign",weekDate);
					}
			//code to add value of the interval type in the interval type dropdown in widgetReport html page
				if($location.search()["intervalType"] != undefined){
					intervalType = $location.search()["intervalType"]+'ly';
					$scope.ifweek = intervalType;
					$scope.$emit("intervalTypeAssign",intervalType);
				}else{
					intervalType = 'Weekly';
					$scope.ifweek = intervalType;
					$scope.$emit("intervalTypeAssign",intervalType);

				}
				//-------------------------------------------------------------------------------------------
				$scope.deleteChart = function (highchart, index) {
					//$scope.highchart.testArray.splice($scope.highchart.testArray.indexOf(highchart), 1);
					$scope.openGraphs.splice(index, 1);	
					$scope.builtGraph.splice(index, 1);
					$scope.highchart.dates.splice(index,1);
					$scope.highchart.titles.splice(index,1);
					$scope.highchart.testArray.splice(index, 1);
					$scope.chartStyleCofig.splice(index,1);
					$scope.graphRowValues.splice(index,1);
					graphsToSaveLocal.splice(index,1);
			    }
				$scope.hideShowWidgetFlag("visible");
				$scope.gridDataLength = 1;
				  var modalInstance;
				  $scope.openNew = function () {
				    modalInstance = $uibModal.open({
						  animation: false,
						  windowClass: 'the-modal',
						  templateUrl: 'myModalCon.html'
						});

						$timeout(function(){
						    plotChart();
						});
				
					};
					$scope.dataLabel = function(dataLabel){
                      
                      
                      index= $scope.datalabelIndex;
                      dataLabel == 'Y' ? $scope.selectedYN = 'Y' : $scope.selectedYN = 'N'; 
                      var bool = false;
                      $scope.selectedYN == 'Y' ? bool = true : bool = false;
                      $scope.chartStyleCofigPopup  = {};
                      var obj = angular.copy($scope.chartStyleCofig[index]);
                      obj.chart.marginRight = 180;
                      obj.chart.height = 450;
                      obj.plotOptions.column.dataLabels.enabled = bool;
                      obj.plotOptions.column.dataLabels.allowOverlap = bool;
                      obj.plotOptions.line.dataLabels.enabled = bool; 
                      $timeout(function(){
                        $("#myGrpahPopup").highcharts(obj);
                      },200);
                    };
					
                    
                $scope.openDownloadPopup = function(row,col){
					  var t="";
		       			if(($location.search()["weekDate"])!=undefined)
		       				t=($location.search()["weekDate"]);
		       			else 
		       				t=$scope.edDate;
		       			
		       			var locationParts=window.location.href.split("/");
		       			var path1=locationParts[0]+"/"+locationParts[1]+"/"+locationParts[2]+"/"+locationParts[3]+"/"+"downloadModal.htm?viewType="+widgetService.selectedWidget.ViewType+"&metric="+globalService.encodeURIString(col.field)+"&viewId="+widgetService.selectedViewId+"&viewName="+$scope.viewData.selected.ViewName+"&week="+t;
		       			if(($location.search()["component"])!=undefined && row.treeLevel==undefined)//component searched and clicked
	       					path1=path1+"&component="+row.entity.Name;

		       			else if(row.treeLevel!=0){
		       				if(row.treeLevel==1)
		       					path1=path1+"&manager="+row.entity.Name;
		       				else
		       					path1=path1+"&component="+row.entity.Name+"&manager="+row.treeNode.parentRow.entity.Name;
		       			}
		       			if(row.entity.$$treeLevel==undefined && row.treeNode.parentRow.entity.QueryID!=undefined){
		       				path1=path1+"&queryId="+parseInt(row.treeNode.parentRow.entity.QueryID);
						}else if(row.entity.$$treeLevel == 0){
							path1=path1+"&queryId="+parseInt(row.entity.QueryID);
						}else if(row.entity.$$treeLevel == 1){
							path1=path1+"&queryId="+parseInt(row.treeNode.parentRow.entity.QueryID);
						}else if(row.entity.$$treeLevel != 0 && row.entity.$$treeLevel != 1){
							path1=path1+"&queryId="+parseInt(row.treeNode.parentRow.treeNode.parentRow.entity.QueryID);
						}
		       			//console.log(path1);
		       			window.open(path1, '_blank');
					};
           		
           		
					
				  $scope.openChart = function (highchart, index) {
				    modalInstance = $uibModal.open({

						  animation: false,
						  windowClass: 'the-modal',
						  templateUrl: 'myModalnt.html',
						  size: 'lg',
						  scope: $scope
						});
				    $scope.selectedYN = 'N';
                    $scope.datalabelIndex = index;
                    $scope.chartStyleCofigPopup  = {};
                    var obj = angular.copy($scope.chartStyleCofig[index]);
                    obj.chart.marginRight = 180;
                    obj.chart.height = 450;
                    $timeout(function(){
                      $("#myGrpahPopup").highcharts(obj);
                    },200);
				
					};
				$scope.gridOptionsSubManComp = {
					enableSorting : true,
					enableFiltering : false,
					showTreeExpandNoChildren : true,
					enableColumnResizing: true,
					
					headerTemplate : 'html/views/headTemp.html',
					  exporterCsvFilename: 'view-Subview-Manager.csv',
		                exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
		                gridMenuShowHideColumns:false,
		                exporterFieldCallback : function ( grid, row, col, value ){
		                	  if ( col.displayName === 'Manager/Component' ){
								if(row.treeLevel >= 1){
									for(var i=0;i<row.treeLevel;i++){
										   value = ' '+"--"+ value
									}
								}
								  if(row.treeLevel == undefined){
											   value = " "+ value
									}
							  }
							  return value;
							},
					onRegisterApi : function(gridApi) {
						$scope.gridApi = gridApi;
						$interval(function() {
							$scope.gridApi.core.handleWindowResize();
						}, 10);
						$scope.gridApi.core.refresh();
						$scope.gridApi.treeBase.on.rowExpanded($scope,
								function(row) {
						  if(userCheckList.includes(row.entity.Name)==false) 
						  if($scope.selectPopup == false){
									$scope.treeButtonClick(row);
						          }else{
						        	  $scope.gridOptionsSubManComp.data = [];
			                        writeoutNode($scope.gridDataover, 0,
			                        		$scope.gridOptionsSubManComp.data);
			                        
			                      }
								});
						
						$scope.gridApi.treeBase.on.rowCollapsed($scope,
                            function(row) {
                          if(row.entity.$$treeLevel == 0){
                            userCheckList=[];
                            var a=angular.copy($scope.viewOverviewManCompSearchUserId);
                            if(a !== undefined){
                            var b=a.split(',');
                            }
                            for(var i=0;i<row.entity.children.length;i++){
                              if(b.includes(row.entity.children[i].Name)){
                                userCheckList.push(row.entity.Name)
                              } 
                            }
                          }
                         
                        });

					},
					category : $scope.category,
					enableColumnResize : true,
					enableColumnReordering : true,
					enableGridMenu : false,
					multiSelect : true,
					columnDefs : $scope.colDefs,

				};
				
				$scope.exportCsv = function() {
		            var grid = $scope.gridApi.grid;
		            var rowTypes = uiGridExporterConstants.ALL;
		            var colTypes = uiGridExporterConstants.ALL;
		           uiGridExporterService.csvExport(grid, rowTypes, colTypes);
		        };
		        
		        //for download grid and trend
		        $scope.downloadGridGraph = function (mailRecipents,emailBody,attachoptions){
		        	  var request = {};
		        	  var treelevel = {};
		              request.images =[];
		              $scope.showLoader = true;
		              $scope.isMail =false;
		        	if($scope.openGraphs.length >0){
		        		for(var i=0 ;i<$scope.openGraphs.length ;i++){
		        			 var imgChart = $('#myGrpah'+i).highcharts();
		        			 var svg =  imgChart.getSVG();
		        			 var chartsvgbase64 =window.btoa(unescape(encodeURIComponent(svg)));
		        			 request.images[i]=chartsvgbase64;
		        		}
		        	}
		          
		            var fileName = 'widget_Subview_mgrComp_download';
		            request.gridData =  $scope.gridOptionsSubManComp.data;
		            request.columnDefs = $scope.gridOptionsSubManComp.columnDefs;
		            request.fileName = fileName;
		            request.tab = "mgrComp";
		            if(mailRecipents != undefined){
			       		  $scope.isMail =true;
			       		 request.isMail =true;
			       	    }else
			       		 request.isMail =false;
			       	  
			       	  request.mailRecipents = mailRecipents;
			       	  request.mailSubject = $scope.widgetNm+'_MgrComp_Report';
			       	  request.mailBody = emailBody;
	           	      request.url=window.location.href; 
	           	      request.attachOptions=attachoptions;          	
		            angular.forEach(request.gridData, function(value, index) {
		                if(value["$$treeLevel"] == undefined || value["$$treeLevel"] =='undefined')
		                     	treelevel[value.Name]=2;
		                 else
		                     	treelevel[value.Name]=value["$$treeLevel"];
		                 
		            });
		            request.treelevel = treelevel;
		           	widgetService.getDownloadExcelforGridGraphs(request).success(function(data, status, headers, config) {
		           	$scope.showLoader = false;
		            if(!$scope.isMail){
		            	var filename = headers('X-ExcelFilename');
			      		var contentType = headers('content-type');
			      		var linkElement = document.createElement('a');
			      		try {
			      			var blob = new Blob([data], {
			      					type: contentType
			      				});
			      			var url = window.URL.createObjectURL(blob);
			      			linkElement.setAttribute('href', url);
			      			linkElement.setAttribute("download", filename);
			      			var clickEvent = new MouseEvent("click", {
			      					"view": window,
			      					"bubbles": true,
			      					"cancelable": false
			      				});
			      			linkElement.dispatchEvent(clickEvent);
			      		} catch (ex) {}
			      		 $scope.addAlert('Your File is downloaded.','success'); 
		           }else
		        	   $scope.addAlert('Email is sent.','success');  
		      		

		      	}).error(function(err) {
		      			$scope.showLoader = false;
		      			$scope.navigateTo("errorPage");
		      		});
		      };
				$scope.gridOptionsSubManComp.enableHorizontalScrollbar = 1;

				function sortNullString(a, b) {
				    a = (a == undefined || a == '') ? ' ' : a; 
				    b = ( b == undefined || b == '') ? ' ' : b;
				    if (a === b) { return 0 }; 
				    if (a < b) { return -1 }; 
				    if (a > b) { return 1 }; 
				};
				
				$scope.countColumn = function(data){
                  var countColumn=0;
                  data.filter(function(value){ value.SubMetric.length == 0 ? countColumn = countColumn + 1 : countColumn = countColumn + value.SubMetric.length   });
                  return countColumn;
                }
				
				$scope.setColumnDefs = function(data) {
					if(data != null){
					$scope.colDefs = [];
					$scope.colDefs.push(getColumnDefObject('Name', 'Name',
							'Manager/Component', 'column1', false, "*", 350,
							'html/templates/dropDownTemp.html',sortNullString,'Manager/Component'));
					
				/*	$scope.colDefs.push(getColumnDefObject('Name', 'Name',
							'Manager/Component', 'column1', false, "*", 350,
							'',sortNullString,'Manager/Component'));*/
					
					var countColumn= $scope.countColumn(data.MetricDetails);
					angular.forEach(data.MetricDetails, function(value, key) {
						angular.forEach(value.SubMetric,
								function(value2, key2) {
									var obj = getColumnDefObject(
											value2.MetricId+value.MetricId+value2.MetricName,  //To uniquely identify column name
											value2.MetricName,
											value2.MetricDispName,
											value.MetricId+"-"+value.MetricName, false, "*", (countColumn <= 6 ? 150 : 113),
											"html/templates/metricDataCell.html",sortNullString, value2.MetricDefn,value2.Scrubber);
									$scope.colDefs.push(obj);
								});
					});
					$scope.gridOptionsSubManComp.columnDefs = $scope.colDefs;
					$scope.getMetricDefinitions();//loading metric definitions for coldefs tooltips

					}
				};
			
				var getColumnDefObject = function(metricId, name, displayName, category,
						enableColumnMenu, width, minWidth, cellTemplate,sortAlgo, metricDefn, scrubber) {
					var colDefObject = {};
					colDefObject.name = metricId;
					colDefObject.field = name;
					var checkMessage = category.substring(category.indexOf('-')+1,category.length);
					colDefObject.displayName = displayName;
					colDefObject.category = category;
					colDefObject.enableColumnMenu = enableColumnMenu;
					colDefObject.width = width;
					colDefObject.minWidth = minWidth;
					colDefObject.cellTemplate = cellTemplate;
					colDefObject.sortingAlgorithm = sortNullString;
					if(metricDefn == ""){
						colDefObject.headerTooltip = displayName;
					}else{
						//colDefObject.headerTooltip = metricDefn;
					}
					if(colDefObject.name != 'Name'){
						colDefObject.cellClass = "text-right";
						}
						colDefObject.headerCellClass = "text-center";
					if(colDefObject.displayName==="Manager/Component"){
							colDefObject.pinnedLeft = true;
					}
					if(colDefObject.displayName !="Manager/Component")
						colDefObject.headerCellTemplate='<div class="ui-grid-cell-contents hoverHeader trendChartScrubberLink " title="{{grid.appScope.resultObj\[\''+name+'\'\]}}"><span ng-click=grid.appScope.openMetricDefinition("'+widgetService.selectedWidget.ViewType+'","'+encodeURIComponent(name)+'")>'+displayName+'</span><i ng-class="{ \'ui-grid-icon-up-dir\': col.sort.direction == asc, \'ui-grid-icon-down-dir\': col.sort.direction == desc, \'ui-grid-icon-blank\': !col.sort.direction }" title="Click to Sort" aria-hidden="true"></i></div>';
					colDefObject.scrubber = scrubber;
					colDefObject.pin = false;
					return colDefObject;
				};
				var getCatObject = function(name, displayName, visible,
						showCatName) {
					var catObject = {};
					catObject.name = name;
					catObject.displayName = displayName;
					catObject.visible = visible;
					catObject.showCatName = showCatName;
					return catObject;
				};

				$scope.setCatOfGrid = function(data) {
					if(data != null){
					$scope.category = [];
					$scope.category.push(getCatObject('column1', 'column1',
							true, false));
					angular.forEach(data.MetricDetails, function(value, key) {
						var obj = getCatObject(value.MetricId+"-"+value.MetricName,
								value.MetricName, true, true);
						$scope.category.push(obj);

					});
					
					$scope.gridOptionsSubManComp.category = $scope.category;
					}
				}

				/*opens metric definition for that particular view*/
				$scope.openMetricDefinition = function(view,met){
					//var metric=decodeURIComponent(met);
        			//$scope.navigateTo('metricsDefinitions',false,".htm?viewType="+view+"&metric="+met,false);
					var locationParts=window.location.href.split("/");
        			var path1=locationParts[0]+"/"+locationParts[1]+"/"+locationParts[2]+"/"+locationParts[3]+"/"+"metricsDefinitions.htm?viewType="+view+"&metric="+met;
        			window.open(path1, '_blank');
				};
				//getting metric definitions for GRID tooltips
				$scope.getMetricDefinitions = function(){
					var metricArray=[];
					angular.forEach($scope.gridOptionsSubManComp.columnDefs,function(value,index) {
						if(value.field!="Name" && value.field!="icons")
							metricArray.push(value.field);
					});
					var request={};
					request.Metrics=metricArray;
					request.ViewType=widgetService.selectedWidget.ViewType;
					$scope.resultObj={};
					widgetService.metricDefnsByMetric(request).success(function(result) {
						angular.forEach(result.data,function(value,index) {
							var temp=value.MetricDispName;
							$scope.resultObj[temp]=value.MetricDefn;
						});
					}).error(function(err) {
						$scope.navigateTo("errorPage");
					});
				};
				$scope.highchart = {};
				$scope.highchart.testArray = [];
				$scope.highchart.dates = [];
				$scope.highchart.titles = [];
		
				//Get level 0 data
				$scope.widgetView = parseInt(widgetService.selectedViewId);
				$scope.getMasterQueryData = function(data) {
					if(data != null){
						var request = {};
						if($scope.widgetView == ''){
							request.ViewID = parseInt(widgetService.selectedViewId);
						}else{
							request.ViewID = $scope.widgetView;
						}
						request.UserID = CISCO.enggit.dashboard_init.user_id;
						request.Primary = 'N';
						request.ViewType = data.ViewType;
						request.Trend = 'Y';
						 $scope.metricsBody = [];
							angular.forEach(data.MetricDetails, function(metric, metricIndex) {
								angular.forEach(metric.SubMetric, function(submetric,submetricIndex) {
									 $scope.metricsBody.push(submetric.MetricName);								
								});
								
							});
						request.Metrics =  $scope.metricsBody;
						$scope.showLoader = true;
						$scope.QueryID = [];
						//code to add interval type and value in the request header to be sent to the service
						//check if intervalType is not defined then use week as default otherwise use the selected one
						if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
							request.DataCalc = $location.search()['intervalType'];
						}else{
							request.DataCalc = 'week';
							request.WeekDate = $scope.milestoneDates.data.selected.date;
						}
						
						//adding the selected date according to the selected interval type
						if(request.DataCalc == "quarter") {
							request.QuarterYear = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "year"){
							request.Year = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "month"){
							request.MonthYear = $scope.milestoneDates.data.selected.date;
						}
						
						//-----------------------------------------------------------------------------------------
						widgetService.getQueryData(request).success(function(data){
							if(data.status == 'fail' && (data.data.indexOf('Invalid') != -1 || data.data.indexOf('Inactive') != -1)){
								$scope.showLoader = false;
								$scope.gridOptionsSubManComp.data = [];
								$scope.addAlert('View is either invalid or inactive', 'danger');
								return;
							}
						  if(data.status == "error") {
	                        $scope.showLoader = false;
	                        $scope.gridOptionsSubManComp.data = [];
	                        $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
	                    } else {
	                    	 $scope.gridDataover = [];
							 if(data.data.length == 0) {
								  $scope.showLoader = false;
								  $scope.gridDataLength = 0;
								  $scope.gridOptionsSubManComp.data = [];
				                  $scope.addAlert('No data found', 'warning');
					          } else {
					            $scope.gridDataLength = 1;
					        	  	angular.forEach(data.data, function(value,index) {
										$scope.queryID = value.QueryID;
										$scope.QueryID.push(value.QueryID)
										value.Name = value.QueryName;
										$scope.queryIDNameMapping[value.QueryID] = value.QueryName;
								    	value.children = [];
										$scope.gridDataover.push(value);
					        	  	});
					        	  	
					        	  	if(Object.keys($scope.queryIDNameMapping).length != 0 ){
					     				var getGraphobj = {
					     						 "UserID" :globalService.userId,
					     						 "WidgetID":$location.search()["widgetId"],
					     						 "Primary":"N",
					     						 "Hierarchy":"MgrComp"
					     				};
					     				   if($scope.isRefresh == false){
					     						widgetService.getSavedWidgetGraphs(getGraphobj)
					     						.success(function(data) {
					     							if(data.status == "success" && data.data.GraphDetails != undefined){
					     							var totalGraphs = data.data.GraphDetails.length;
					     							$scope.savedGraphs = data.data.GraphDetails;
					     							$scope.graphsFromOwner = data.IfSavedByOwner;
					     							savedGraphsFlag = true;
					     							if(data.data.GraphDetails.length >0){
					     							$scope.addGraph($scope.savedGraphs[savedGraphCount])
					     							}
					     							}
					     						})
					     				.error(
					     						function(err) {
					     							$scope.showLoader = false;
					     			              $scope.navigateTo("errorPage");
					     						});
					     						}
					     					   }
					        	  	
					        	  	$scope.gridOptionsSubManComp.data = [];
					        	  
					        	  	writeoutNode($scope.gridDataover, 0, $scope.gridOptionsSubManComp.data);
					        	  	/* fix for grid distortion issue - header and  metric data cell alignment issue  - adhuliaw*/ 
									if($scope.gridOptionsSubManComp.data.length>0){
										  setTimeout($scope.gridWidthCalc,1000);
									}
							
								// END
								$timeout(function () {
								    $scope.gridApi.core.refresh();
								    if($scope.isRefresh == false){
									    if($location.search()["manager"] !== undefined || $location.search()["component"] !== undefined){
									    	$scope.selectedString='';
									    	if($location.search()["component"] !== undefined){
									    		$scope.arrType = "Component"
									    		$scope.selectedString = $location.search()["component"];
									    	}else{
									    		$scope.arrType = "Manager"
									    		$scope.selectedString = $location.search()["manager"];
									    	}	
									    	
									    	  var DataCalc = '';
										        var DataCalcValue = '';
									    	  //check if intervalType is not defined then use week as default otherwise use the selected one
									        if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
												DataCalc = $location.search()['intervalType'];
											}else{
												DataCalc = 'week';
												DataCalcValue = {'type':'WeekDate','value' : $scope.milestoneDates.data.selected.date};
											}
									        
									        //adding the selected date according to the selected interval type
											if(DataCalc.DataCalc == "quarter") {
												DataCalcValue = {'type':'QuarterYear','value' :  $scope.milestoneDates.data.selected.date};
											}else if(request.DataCalc == "year"){
												DataCalcValue = {'type':'Year','value' :  $scope.milestoneDates.data.selected.date};
											}else if(request.DataCalc == "month"){
												DataCalcValue = {'type':'MonthYear','value' :  $scope.milestoneDates.data.selected.date};
											}
									    	
									    	$scope.viewOverviewManCompSearchUserId = $scope.selectedString;
									    	$scope.selectedArray = $scope.selectedString.split(',');
									    widgetService.getSubviewDirAfterSelect($scope.metricsBody,$scope.selectedArray,$scope.arrType, widgetService.selectedViewId, widgetService.selectedWidget.ViewType,$scope.QueryID,widgetService.isPrimary,weekDate,DataCalc,DataCalcValue).success(function(data){
							        		$scope.showLoader = false;
						                      if(data.data.length == 0){
						                    	  $scope.gridOptionsSubManComp.data = [];
						                    	  $scope.gridDataLength = 0;
							                    	$scope.gridApi.core.refresh();
						                      }else{
						                        var rowsPushed = [];
						                        if(typeof $scope.gridDatd != 'undefined' ){
						                          for(var j=0;j<$scope.gridDatd.length;j++){
					                                  for(var i=0;i<data.data.length;i++){
					                                    if(i==0) $scope.gridDatd[j].children = [];
					                                      var obj = data.data[i];
					                                      if(!rowsPushed.includes(j))
					                                        rowsPushed.push(j);
					                                      delete obj.QueryID;
					                                      obj.children = [];
					                                      $scope.gridDatd[j].children.push(obj);
					                                      
					                                    }
					                                //}
					                                
					                              }
					                                $scope.togglePopup(true);
					                                $scope.gridOptionsSubManComp.data = [];
					                                $scope.gridOptionsSubManComp.data = $scope.gridDatd;
					                                $scope.gridApi.treeBase.collapseAllRows();
						                        }else{
	
						                          for(var j=0;j<$scope.gridDataover.length;j++){
				                                    for(var i=0;i<data.data.length;i++){
				                                      if(i==0) $scope.gridDataover[j].children = [];
				                                      if($scope.gridDataover[j].QueryID == data.data[i].QueryID){
				                                        var obj = data.data[i];
				                                        if(!rowsPushed.includes(j))
				                                          rowsPushed.push(j);
				                                        delete obj.QueryID;
				                                        obj.children = [];
				                                        $scope.gridDataover[j].children.push(obj);
				                                        
				                                      }
				                                  }
				                                  
				                                }
						                         //writeoutNode($scope.gridDataover,0,[]);
				                                  //$scope.selectPopup = true;
				                                  $scope.togglePopup(true);
				                                  $scope.gridOptionsSubManComp.data = [];
				                                  $scope.gridOptionsSubManComp.data = $scope.gridDataover;
				                                 $scope.gridApi.treeBase.collapseAllRows();
				                                 for(var i=$scope.gridOptionsSubManComp.data.length-1;i>=0;i--){
							                    	   if($scope.gridOptionsSubManComp.data[i].children.length == 0){
							                    		   $scope.gridOptionsSubManComp.data.splice(i,1);
							                    	   }
							                       }
							                       $scope.gridApi.core.refresh();
							                     /* if(rowsPushed.length > 0){
							                        for (var i = 0; i< rowsPushed.length ;i++){
							                          $scope.gridApi.treeBase.expandRow($scope.gridApi.grid.renderContainers.body.visibleRowCache[rowsPushed[i]]);
							                        }
							                       
							                      }*/
							                       if(rowsPushed.length == 0){
							                    	   $scope.gridDataLength = 0;
							                       }
						                        //$scope.gridApi.treeBase.collapseAllRows();
						                        if(rowsPushed.length > 0){
						                          for (var i = 0; i< rowsPushed.length ;i++){
						                            $scope.gridApi.treeBase.expandRow($scope.gridApi.grid.renderContainers.body.visibleRowCache[rowsPushed[i]]);
						                          }
						                         
						                        }
						                        $scope.togglePopup(false);
						                        }
						                      }  
										}).error(function(err){
											$scope.showLoader = false;
											$scope.navigateTo("errorPage");
										});
									    }
									    }else{
									    	
									    	$scope.viewOverviewManCompSearchUserId = "";
							    			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy=mgrComp&viewId='+widgetService.selectedViewId+'&intervalType='+request.DataCalc+'&weekDate='+$scope.milestoneDates.data.selected.date,true);
									    }
								    $scope.showLoader = false;
					            }, 300);
					          }
	                    }
						}).error(function(err) {
							$scope.showLoader = false;
		                      $scope.navigateTo("errorPage");
						});
					}
				};
					
			
				
				var writeoutNode = function(childArray, currentLevel, dataArray) {
						childArray.forEach(function(childNode) {
						if (childNode.children.length >= 0 && currentLevel !=2 && $scope.arrType != 'Component') {
							childNode.$$treeLevel = currentLevel;
						}
						dataArray.push(childNode);
						writeoutNode(childNode.children, currentLevel + 1,
								dataArray);
					});
				};
				
				//Function to be called on click of expand/collapse icon in grid
				
				$scope.treeButtonClick = function(row) {
					//Load product on click of row at level 0
					if (row.entity.$$treeLevel == 0) {
					$scope.showLoader = true;
						var request  = {};
						request.QueryID  = row.entity.QueryID;
						request.Metrics = $scope.metricsBody;
						request.ViewType = widgetService.selectedWidget.ViewType;
						request.ViewID = parseInt(widgetService.selectedViewId);
						request.Primary = 'N';
						request.Trend = 'Y';
						//check if intervalType is not defined then use week as default otherwise use the selected one
						if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
							request.DataCalc = $location.search()['intervalType'];
						}else{
							request.DataCalc = 'week';
							request.WeekDate = $scope.milestoneDates.data.selected.date;
						}
						
						//adding the selected date according to the selected interval type
						if(request.DataCalc == "quarter") {
							request.QuarterYear = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "year"){
							request.Year = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "month"){
							request.MonthYear = $scope.milestoneDates.data.selected.date;
						}
						widgetService.getSubviewQueryIdMgrDataForWidgets(request).success(function(data) {
							if(data.data.Data.length === 0 || data.data.Data === "Data not available for this request") {
								$scope.showLoader = false;
								 $scope.addAlert('No data found', 'warning');
							} else{
							$scope.showLoader = false;
							row.entity.children = [];
							angular.forEach(data.data.Data, function(value,index) {
								value.Name = value.Name;
								value.children = [];
								row.entity.children.push(value);
							});
							
							$scope.gridOptionsSubManComp.data = [];
							writeoutNode($scope.gridDataover, 0,
									$scope.gridOptionsSubManComp.data);
							}
						}).error(function(err) {
							$scope.showLoader = false;
		                      $scope.navigateTo("errorPage");
						});
					} else if(row.entity.$$treeLevel == 1){ ////Load component data on click of row at level 1
						$scope.showLoader = true;
						var request  = {};
						request.QueryID  = row.treeNode.parentRow.entity.QueryID;
						request.Metrics = $scope.metricsBody;
						request.Manager = row.entity.Name;
						request.ViewType = widgetService.selectedWidget.ViewType;
						request.ViewID = parseInt(widgetService.selectedViewId);
						request.Primary = 'N';
						request.Trend = 'Y';
						//check if intervalType is not defined then use week as default otherwise use the selected one
						if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
							request.DataCalc = $location.search()['intervalType'];
						}else{
							request.DataCalc = 'week';
							request.WeekDate = $scope.milestoneDates.data.selected.date;
						}
						
						//adding the selected date according to the selected interval type
						if(request.DataCalc == "quarter") {
							request.QuarterYear = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "year"){
							request.Year = $scope.milestoneDates.data.selected.date;
						}else if(request.DataCalc == "month"){
							request.MonthYear = $scope.milestoneDates.data.selected.date;
						}
						widgetService.getSubviewQueryIdMgrCompDataForWidgets(request).success(function(data) {
							if(data.data.constructor === Array || data.data === "Data not available for this request") {
								$scope.showLoader = false;
								 $scope.addAlert('No data found', 'warning');
							} else{
							$scope.showLoader = false;
							row.entity.children = [];
							
							angular.forEach(data.data.Data, function(value,index) {
								value.Name = value.Name;
								value.children = [];
								row.entity.children.push(value);
							});
							
							$scope.gridOptionsSubManComp.data = [];
							writeoutNode($scope.gridDataover, 0,
									$scope.gridOptionsSubManComp.data);
							}
						}).error(function(err) {
							$scope.showLoader = false;
		                      $scope.navigateTo("errorPage");
						});
					}
				};
				var getId = "";
				//Get widget details i.e. widgetId, viewId, selected metrics on page load on click of widget
				$scope.gridrefreshData = "";
				if ($location.search()["widgetId"] !== undefined) {
	    			 getId = $location.search()["widgetId"];
				}
				$scope.$on('gridEventCall', function(e,data) {  
                  if(data.tabName == 'NmgrComp'){
                    weekDate = data.date;
                    $scope.scopeWeekDate = data.date;
                    $scope.getWidgetDetails();
                  }else{
                    return false;
                  }
               });
				$scope.gridrefreshData = "";
				
				/* $scope.$watch('viewData', function(newValue, oldValue) {
					   if(newValue != undefined){
				var getGraphobj = {
						 "UserID" :globalService.userId,
						 "WidgetID":$location.search()["widgetId"],
						 "Primary":"N",
						 "Hierarchy":"Dir"
				};
				   if($scope.isRefresh == false){
						widgetService.getSavedWidgetGraphs(getGraphobj)
						.success(function(data) {
							if(data.status == "success" && data.data.GraphDetails != undefined){
							var totalGraphs = data.data.GraphDetails.length;
							$scope.savedGraphs = data.data.GraphDetails;
							$scope.graphsFromOwner = data.IfSavedByOwner;
							savedGraphsFlag = true;
							if(data.data.GraphDetails.length >0){
							$scope.addGraph($scope.savedGraphs[savedGraphCount])
							}
							}
						})
				.error(
						function(err) {
							$scope.showLoader = false;
			              $scope.navigateTo("errorPage");
						});
						}
					   }
				 });*/
				$scope.getWidgetDetails =  function() {
					$scope.showLoader = true;
					widgetService.getWidgetDetails(getId).success(function(result) {
					
						$scope.showLoader = false;
						$scope.setCatOfGrid(result.data);
						$scope.setColumnDefs(result.data);
						 if($location.search()['viewId'].toString().split(',').length == 1){
						$scope.getMasterQueryData(result.data);
						 } else{
				        	  $scope.gridDataLength = 0;
				        	  $scope.addAlert('Sub View will not be available if more than 1 view is selected in the widget', 'warning');
				          }
						$scope.gridrefreshData = result.data;
						$scope.widgetNm = result.data.ViewType +" "+result.data.WidgetName;
					}).error(function(err) {
						$scope.showLoader = false;
	                      $scope.navigateTo("errorPage");
					});
				};
				
				 
				$scope.openInfo = function(row,col){
					$scope.queryIdForInfo = row.entity.QueryID
				    $scope.templateLocation = 'html/templates/widgetQueryInfo.html';
					$scope.controllerLocation = 'widgetQueryInfoCtrl';
					$scope.open('lg');
				};
				 
				 $scope.openTopX = function(row,col){
					 $scope.queryIDForInfo = row.entity.QueryID;
					 $scope.queryNameForInfo = row.entity.QueryName;
					 $scope.templateLocation = 'html/templates/TopXInfo.html';
					 $scope.controllerLocation = 'widgetTopXCtrl';
						$scope.open('lg');
						
				 };
			
				 $scope.templateLocation = "";
				 $scope.controllerLocation = "";
				 $scope.selected = "";
				 $scope.open = function(size, parentSelector) {

						var parentElem = parentSelector ? angular
								.element($document[0].querySelector('.modal-demo '
										+ parentSelector)) : undefined;
						 modalInstance = $uibModal.open({
							animation : $scope.animationsEnabled,
							ariaLabelledBy : 'modal-title',
							ariaDescribedBy : 'modal-body',
							templateUrl : $scope.templateLocation,
							controller : $scope.controllerLocation,
							controllerAs : '$ctrl',
							scope : $scope,
							size : size,
							appendTo : parentElem,
							resolve : {
								items : function() {
									return $scope.items;
								}
							}
						});

					

					};
					
					$scope.cancel = function(){
						modalInstance.dismiss('cancel');
					};
					$scope.highchart = {};
					$scope.highchart.testArray = [];
					$scope.highchart.dates = [];
					$scope.highchart.titles = [];
					$scope.builtGraph = [];
					$scope.openGraphs = [];
					$scope.checkGraphExist = function(val){
						if($scope.builtGraph.length == 0){
							return false;
						}
						for(var i=0;i<$scope.builtGraph.length;i++){
							if($scope.builtGraph[i] == val){
								return true;
							}
						}
						return false;
					}
					$scope.stDate = "";
					$scope.edDate = "";
					$scope.chartRefreshId = "";
					/*$scope.getDates = function(highcharts, index){
						$scope.templateLocation = 'html/templates/widgetGraphDatePopup.html';
						 $scope.controllerLocation = 'widgetGraphDatePopupCtrl';
							$scope.open();
					}*/
				
					$scope.graphRowValues = [];
					$scope.metricsList = [];
					$scope.fullMetricsData = [];
					$scope.metricsParent = ""; 
					$scope.index = "";
					$scope.ifGraphUpdate = false;
					$scope.flagForGraphCount = 0;
					
					$scope.getSelectedDates = function(d1,d2){
						$scope.stDate = d1.toString();
						$scope.edDate = d2.toString();
						
						$scope.ifGraphUpdate = true;
						if($scope.graphRowValues[0] != undefined){
							$scope.chartRefreshId = 0;
							$scope.ifGraphUpdate = true;
							$scope.addGraph($scope.graphRowValues[0].row,$scope.graphRowValues[0].col);
						}
					/*	$scope.chartRefreshId = i;
					$scope.getMetricsFullData($scope.graphRowValues[i].row, $scope.graphRowValues[i].col);
					if($scope.index >= 0) {
						$scope.getMetricsData();
					}
					$scope.chartSeriesCallPlot($scope.graphRowValues[i].row, $scope.graphRowValues[i].col);*/
					
					}
				
					
					$scope.addGraph = function(row, col) {
						
						//metricsList contains list of metrics for graph 
						//fullMetricsData contains metrics with style data
						if($scope.ifGraphUpdate == true){
							$scope.openGraphs.splice(0, 1);
							$scope.builtGraph.splice(0, 1);
							$scope.highchart.dates.splice(0,1);
							$scope.highchart.titles.splice(0,1);
							$scope.highchart.testArray.splice(0, 1);
							$scope.chartStyleCofig.splice(0,1);
						}
						
						if($scope.builtGraph.length < 6 ) {
								if(col != undefined){
									$scope.getMetricsFullData(row, col);
								//index is -1 if submetrics are not present
									if($scope.index >= 0) 
										$scope.getMetricsData();
									if(!$scope.checkGraphExist($scope.checkGraphValue))
										$scope.chartSeriesCallPlot(row, col);
									else 
										$scope.addAlert('Graph already exists','warning');
								}else{
									if(row.Level0 == 'Y'){
										$scope.checkGraphValue = $scope.queryIDNameMapping[row.QueryID] + " : "+row.ChartLabel;
										}else{
											$scope.checkGraphValue = $scope.queryIDNameMapping[row.QueryID] +"->"+row.ChartLabel;
										}
										$scope.chartSeriesCallPlot(row,col);
								}
								//Check if graph already exists and show message accordingly
						}else
							$scope.addAlert('Remove one of the existing graphs to add a new graph (only 6 allowed at once)','warning');
					};
				
				$scope.getMetricsFullData = function(row, col){
					var category = col.colDef.category.substring(col.colDef.category.indexOf('-')+1,col.colDef.category.length)
					$scope.metricsParent = [];
					$scope.fullMetricsData = [];
					var parentMetricFound = false;
					for(var i = 0; i<$scope.gridrefreshData.MetricDetails.length;i++) {
						//if child metrics are none, then show graph for parent metric
						if(category == $scope.gridrefreshData.MetricDetails[i].MetricName){
							for(var j=0;j<$scope.gridrefreshData.MetricDetails[i].SubMetric.length;j++) {
								if( $scope.gridrefreshData.MetricDetails[i].SubMetric[j].MetricName == col.field) {
									$scope.metricsParent = angular.copy($scope.gridrefreshData.MetricDetails[i].MetricName);
									$scope.fullMetricsData = angular.copy($scope.gridrefreshData.MetricDetails[i].SubMetric);
									$scope.index = i;
									parentMetricFound = true;
									break;
								}
							}
						}
					}
					if(row.treeLevel == 0)
						$scope.checkGraphValue = row.entity.QueryName + " : " + $scope.metricsParent;
					else if (row.treeLevel == 1) {
						$scope.checkGraphValue = row.treeNode.parentRow.entity.QueryName
								+ "->"
								+ row.entity.Name
								+ " : "
								+ $scope.metricsParent;
					} else {
						$scope.checkGraphValue = row.treeNode.parentRow.treeNode.parentRow.entity.QueryName
								+"->"
								//+ row.treeNode.parentRow.entity.Name
								//+ " : " 
								+ row.entity.Name 
								+ " : " 
								+ $scope.metricsParent;
					}

					if($scope.checkGraphValue == undefined){
						$scope.checkGraphValue = $scope.searchedPlaceHolder+"->"+ row.entity.Name + " : " + $scope.metricsParent;
					}
				}
				
				$scope.getMetricsData = function(){
					$scope.metricsList = [];
					for(var j=0;j<$scope.gridrefreshData.MetricDetails[$scope.index].SubMetric.length;j++) {
						if($scope.gridrefreshData.MetricDetails[$scope.index].SubMetric[j].Trend != "N"){
						$scope.metricsList.push(angular.copy($scope.gridrefreshData.MetricDetails[$scope.index].SubMetric[j].MetricName));
						}
					}
				}
				
				var paramsToGraphSave={};
			
				$scope.chartSeriesCallPlot = function(row, col){
					if($scope.ifGraphUpdate != true){
						$scope.myGraph = {};
						$scope.myGraph.row = row;
						if(col != undefined){
							$scope.myGraph.col = col;
						}
						$scope.graphRowValues.push($scope.myGraph);
					}
					$scope.builtGraph.push($scope.checkGraphValue);
					$scope.showLoader = true;
					var charParms="", graphFunc;
					if(col != undefined){
						if(row.treeLevel == 0){
							var chartLabel = $scope.checkGraphValue.substr($scope.checkGraphValue.indexOf(':')+2,$scope.checkGraphValue.length);
							charParms = { 	
								"Metrics":$scope.metricsList,							
								"ViewType": widgetService.selectedWidget.ViewType,
								"ViewID": parseInt(widgetService.selectedViewId),
								"QueryID":row.entity.QueryID,
						    	"Primary" : 'N',
						    	"DateStart" : $scope.stDate,
						    	"DateEnd" : $scope.edDate					   
							  };
							
							paramsToGraphSave = {
									"QueryID":row.entity.QueryID,
									"Level0" : 	"Y",
									"Metrics":$scope.metricsList,
									"ParentMetricName":$scope.metricsParent,
									"ChartLabel":chartLabel
								}
							graphFunc = widgetService.getSubviewGraphDataForWidgets;
						}/*
						//This condition is required when user searches for manager directly and draws trend for the same
	                    else if($scope.arrType == "Manager" && row.treeLevel == undefined){
	                    	var chartLabel = $scope.checkGraphValue.substr($scope.checkGraphValue.indexOf('>')+1,$scope.checkGraphValue.length);
							charParms = { 
									//"QueryID":$scope.queryID,
									"Metrics":$scope.metricsList,							
									"Manager":row.entity.Name,
									"ViewType": widgetService.selectedWidget.ViewType,
									"ViewID" : parseInt(widgetService.selectedViewId),
									"QueryID":row.treeNode.parentRow.entity.QueryID,
									"Primary" : 'N',
									"DateStart" : $scope.stDate,
							    	"DateEnd" : $scope.edDate	
	
									};
							
							paramsToGraphSave = {
									"Manager":row.entity.Name,
									"QueryID":row.treeNode.parentRow.entity.QueryID,
									"Level0" : 	"N",
									"Metrics":$scope.metricsList,
									"ParentMetricName":$scope.metricsParent,
									"ChartLabel":chartLabel
								}
							
									graphFunc = widgetService.getSubviewGraphDataForMgrComp;
						}*/
						else if(row.treeLevel == 1){
							
							var chartLabel = $scope.checkGraphValue.substr($scope.checkGraphValue.indexOf('>')+1,$scope.checkGraphValue.length);
							charParms = { 
									 "Metrics":$scope.metricsList,								
									 "Manager":row.entity.Name,
									 "ViewType": widgetService.selectedWidget.ViewType,
									 "ViewID" : parseInt(widgetService.selectedViewId),
									 "QueryID":row.treeNode.parentRow.entity.QueryID,
									 "Primary" : 'N',
									 "DateStart" : $scope.stDate,
								     "DateEnd" : $scope.edDate	
	
									};
							
							paramsToGraphSave = {
									 "Manager":row.entity.Name,
									 "QueryID":row.treeNode.parentRow.entity.QueryID,
									"Level0" : 	"N",
									"Metrics":$scope.metricsList,
									"ParentMetricName":$scope.metricsParent,
									"ChartLabel":chartLabel
								}
							
							graphFunc = widgetService.getSubviewGraphDataForMgrCompForWidgets;
						}else{
							var chartLabel = $scope.checkGraphValue.substr($scope.checkGraphValue.indexOf('>')+1,$scope.checkGraphValue.length);
							charParms = { 
									"Metrics":$scope.metricsList,							
									"Manager":row.treeNode.parentRow.entity.Name,
									"Component":row.entity.Name,
									"ViewType": widgetService.selectedWidget.ViewType,
									"ViewID" : parseInt(widgetService.selectedViewId),
									"QueryID":row.treeNode.parentRow.treeNode.parentRow.entity.QueryID,
									"Primary" : 'N',
									"DateStart" : $scope.stDate,
							    	"DateEnd" : $scope.edDate	
									};
							paramsToGraphSave = {
									"Manager":row.treeNode.parentRow.entity.Name,
									"Component":row.entity.Name,
									"QueryID":row.treeNode.parentRow.treeNode.parentRow.entity.QueryID,
									"Level0" : 	"N",
									"Metrics":$scope.metricsList,
									"ParentMetricName":$scope.metricsParent,
									"ChartLabel":chartLabel
								}
							graphFunc = widgetService.getSubviewGraphDataForMgrCompForWidgets;
						}
				}else{
					paramsToGraphSave = row;
					$scope.metricsList = angular.copy(row.Metrics);
					for(var i=0;i<$scope.selectedWidget.MetricDetails.length;i++){
						if($scope.selectedWidget.MetricDetails[i].MetricName == row.ParentMetricName){
							for(var j=0;j<$scope.selectedWidget.MetricDetails[i].SubMetric.length;j++){
							$scope.fullMetricsData[j] = angular.copy($scope.selectedWidget.MetricDetails[i].SubMetric[j]);
							}
						}
					}
					
					if(row.Level0 == 'Y'){
						charParms = { 	
								"Metrics":$scope.metricsList,
								"ViewType": widgetService.selectedWidget.ViewType,
								"ViewID": parseInt(widgetService.selectedViewId),
								"Primary" : 'N',
								"QueryID":row.QueryID,
								"DateStart":$scope.stDate,
								"DateEnd":$scope.edDate
							  };
						graphFunc = widgetService.getSubviewGraphDataForWidgets;
						}else{
							charParms = { 	
									"Metrics":$scope.metricsList,
									"ViewType": widgetService.selectedWidget.ViewType,
									"ViewID": parseInt(widgetService.selectedViewId),
									"Primary" : 'N',
									"QueryID":row.QueryID,
									"DateStart" : $scope.stDate,
									"DateEnd" : $scope.edDate
								  };
							
							if(row.Component != undefined){
								charParms.Component = row.Component;
							}
							if(row.Manager != undefined){
								charParms.Manager = row.Manager;
							}
							graphFunc = widgetService.getSubviewGraphDataForMgrCompForWidgets;
						}
				}
					var graphAlreadyInSavedPreference = false;
					for(var i=0;i<graphsToSaveLocal.length;i++){
						if(graphsToSaveLocal[i].ParentMetricName == paramsToGraphSave.ParentMetricName){
							graphAlreadyInSavedPreference = true;
						}
					}
					if(graphAlreadyInSavedPreference == false){
					graphsToSaveLocal.push(paramsToGraphSave);
					}
					//check if intervalType is not defined then use week as default otherwise use the selected one
					if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
						charParms.DataCalc = $location.search()['intervalType'];
					}else{
						charParms.DataCalc = 'week';
					}
					var dates = [];
					var resultData=[];
					var metricsTrendData = [];
					$scope.chartSeries = [];
					graphFunc(charParms).success(function(result) {
						if(result.status == "fail" || result.status == "error") {
							$scope.builtGraph.pop();
							$scope.showLoader = false;
                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
						} else {
							if(result.data.constructor === Array){
								result.data = {'TrendData':[]};
							}
							
							resultData=result.data.TrendData;
							if(resultData==undefined)
								resultData=result.data.Data;
							
							if(charParms.DataCalc == 'week') {
								for (var i=0;i<resultData.length;i++) {
									for (var j=0;j<$scope.startDate.length;j++) {
										if (resultData[i].Date.split('T')[0] == $scope.startDate[j].date.replace(/ /g,'')) {
											resultData[i].indexNo = $scope.startDate[j].indexNo;
										}
									}
								}
							} else if(charParms.DataCalc == 'month') {
								for (var i=0;i<resultData.length;i++) {
									for (var j=0;j<$scope.startDate.length;j++) {
										if (resultData[i].Date == $scope.startDate[j].date.replace('20','').replace(/ /g,'')) {
											resultData[i].indexNo = $scope.startDate[j].indexNo;
										}
									}
								}
							} else if(charParms.DataCalc == 'quarter') {
								for (var i=0;i<resultData.length;i++) {
									for (var j=0;j<$scope.startDate.length;j++) {
										if ((resultData[i].Date.split(' ')[1]+resultData[i].Date.split(' ')[0]) == $scope.startDate[j].date.replace(/ /g,'')) {
											resultData[i].indexNo = $scope.startDate[j].indexNo;
										}
									}
								}
							} else if(charParms.DataCalc == 'year') {
								for (var i=0;i<resultData.length;i++) {
									for (var j=0;j<$scope.startDate.length;j++) {
										if (resultData[i].Date == $scope.startDate[j].date.replace(/ /g,'')) {
											resultData[i].indexNo = $scope.startDate[j].indexNo;
										}
									}
								}
							}
							
							
							var tempArr = angular.copy(resultData)
							tempArr.sort(function(a, b) {
							    return b.indexNo - a.indexNo;
							});
							resultData = angular.copy(tempArr);
							var chartSeriesObj = {};
								/*resultData.sort(function(a, b){
								    var keyA = new Date(a.Date),
								        keyB = new Date(b.Date);
								    // Compare the 2 dates
								    if(keyA < keyB) return -1;
								    if(keyA > keyB) return 1;
								    return 0;
								});*/
								//Form array of trend values for each metric
								$scope.yAxis = [{
                                  title : {
                                      text : ''
                                  }
                              }];	
								for(var i=0;i<$scope.metricsList.length;i++) {
									metricsTrendData[i] = [];
									for(var j=0;j<resultData.length;j++){
										metricsTrendData[i].push(resultData[j][$scope.metricsList[i]]);
									};
									var chartSeriesObj = {};
									chartSeriesObj.name = $scope.metricsList[i];
									chartSeriesObj.data = metricsTrendData[i];
									chartSeriesObj.type = $scope.fullMetricsData[i].GraphStyle;
									chartSeriesObj.color = $scope.fullMetricsData[i].Color;
									if($scope.fullMetricsData[i].SecondaryYaxis == true){
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
                                      $scope.yAxis.push(ob);
                                    }else{
                                    	  chartSeriesObj.yAxis = 0;
                                    	  var ob ={
                                              title : {
                                                  text : ''
                                              }
                                          }
                                          $scope.yAxis.push(ob);
                                    }
									
									$scope.chartSeries.push(chartSeriesObj)
								}
								for(var j=0;j<resultData.length;j++){
									dates.push(resultData[j].Date.substring(0, 10));
								}
							
									$scope.openGraphs.push($scope.checkGraphValue);
									$scope.highchart.testArray.push(angular.copy($scope.chartSeries));
									$scope.highchart.dates.push(dates);
									$scope.highchart.titles.push($scope.checkGraphValue);
									
									if(resultData.length == 0) {
										$scope.addAlert(
												'No data found for the Graph',
												'warning');
									}	
									
									$scope.plotGraph(dates, $scope.checkGraphValue);
									
								
							}
								$scope.showLoader = false;
							
						}).error(function(err) {
					//$scope.showLoader = false;
					$scope.navigateTo("errorPage");
				});
					
				}
				
					$scope.plotGraph = function(dates, titleData) {
						$scope.chartStyleCofig.push( {
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
							yAxis : $scope.yAxis,
							series: $scope.chartSeries,
							title : {
								text : titleData,
								align : "left",
		                        style : {
		                            "font-size" : "14px",
		                            "font-weight" : "bold"
		                        },
		                        useHTML : true

							},
							chart : {
								// Edit chart spacing
								spacingBottom : 4,
								marginRight : 0,
								spacingRight : 0,
								height : 255,
							},
							credits : {
								enabackloged : false,
								href : 'http://cqi',
								text : 'cqi.cisco.com'
							},
							
							// * navigation: { buttonOptions: { verticalAlign:
							 //* 'center', y: 0, } },
							 
							exporting : {
		                        buttons:{

		                          contextButton : {
		                              text: "",
		                              
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

		                                              filename = this.title.textStr+'.xls';

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
		                                              document.body.appendChild(link);
		                                              // document.getElementById('xlscsvContainer').appendChild(link);
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
							tooltip : {
								valueSuffix : '',
								 valueDecimals: 2,
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
									dataLabels : {
										enabled : globalService.indicatorValue,
										format : '{point.y:0f}'
									}
								},
								column : {
									dataLabels : {
										enabled : globalService.indicatorValue,
										allowOverlap : globalService.indicatorValue,
										format : '{point.y:0f}'
									}
								},
								column : {
									dataLabels : {
										enabled : globalService.indicatorValue,
										allowOverlap : globalService.indicatorValue,
										format : '{point.y:0f}'
									}
								}

							// enableMouseTracking: true

							},

							loading : false,
							size : {}
						});
					
						// $scope.chartStyleCofig.chart.redraw();
						// $scope.plotGraph(dates, Backlog, Disposed, Incoming);
					// $scope.chartStyleCofig = {};
					// $scope.chartStyleCofig.chart.height = 255;
					
						//$scope.chartSeries=[];
						if(savedGraphsFlag == true){
							
							savedGraphCount++;
							if($scope.savedGraphs[savedGraphCount] != undefined){
							$scope.addGraph($scope.savedGraphs[savedGraphCount])
							}
						}
						if($scope.ifGraphUpdate == true){
						if($scope.graphRowValues[++$scope.flagForGraphCount] != undefined){
							$scope.showLoader = true;
							$scope.chartRefreshId = 0;
						$scope.ifGraphUpdate = true;
						
						$scope.addGraph($scope.graphRowValues[$scope.flagForGraphCount].row,$scope.graphRowValues[$scope.flagForGraphCount].col);
						
						}else{
							$scope.flagForGraphCount = 0;
							$scope.ifGraphUpdate = false;
							$scope.showLoader = false;
						}
						}else{
							$scope.showLoader = false;
						}
				};
				
				$scope.selectedDates= function(){
					if($scope.startDate.selected == undefined || $scope.endDate.selected == undefined){
						$scope.addAlert('Please Select Start Date and End Date','warning');
						return;
					}
					var d1 = $scope.startDate.selected.date;
					var d2 = $scope.endDate.selected.date;
					
					var d1age = $scope.startDate.selected.indexNo;
					var d2age = $scope.endDate.selected.indexNo;
					if(d1 == "" || d1 == undefined || d2 == "" || d2 == undefined){
						$scope.addAlert('Start/End date cannot be Empty','warning');
					}
					if(d1age > d2age){
						$scope.getSelectedDates(d1,d2);
					}
					if(d1age <= d2age){
						$scope.addAlert('End Date should be greater than Start Date','warning');
					}
				}
				
				$scope.clearDates = function(){
					$scope.startDate.selected = "";
					$scope.endDate.selected = "";
				}
				Highcharts
				.setOptions({
					tooltip : {
						"backgroundColor" : "#e5e5e5",
						 "valueDecimals": 2,
						"crosshairs" : [ {
							"color" : "grey",
							"dashStyle" : "shortdot",
							"width" : 1.5
						}, false, true ],
						"shared" : true,
						"valueSuffix" : "",
						"width" : "100%",
						formatter : function() {

							var s = '<span style="color:backlogack; font-weight:bold;">'
									+ this.x + '<span><br>';
							$
									.each(
											this.points,
											function(i, point) {
												
												if (point.series.name == point.series.name)
													var spanStyle = 'color:'+point.series.color;+' font-weight:bold;';
											s += ('<span style="'
														+ spanStyle
														+ '">'
														+ point.series.name
														+ ' : '
														+ point.y + '<span><br>');
											});

							return s;
						}

					},
					exporting : {
						buttons : {

							contextButton : {
								text : "",

								align : "right",
								x : -15,
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

												filename = this.title.textStr
														+ '.xls';

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
												document.body
														.appendChild(link);
												// document.getElementById('xlscsvContainer').appendChild(link);
												link.click();
												document.body
														.removeChild(link);

											}
										}, {
											textKey : 'downloadXLS',
											onclick : function() {

												this.downloadXLS();

											}

										}, ]
							}

						}

					}
				});
							
				
				
				$scope.plotGraphPopup = function(dates, Backlog, Disposed, Incoming, titleData) {

					 var chart = Highcharts.chart('container',{
						options : {
							chart : {
								type : 'column'
							},
							lang : {
								thousandsSep : ','
							},
							plotOptions : {
								series : {
									stacking : ''
								}
							}
						},
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
						yAxis : {
							title : {
								text : ''
							}
						},
						 series: $scope.chartSeries,
						title : {
							text : titleData,

						},
						chart : {
							// Edit chart spacing
							spacingBottom : 4,
							marginRight : 0,
							spacingRight : 0
						},
						credits : {
							enabackloged : false,
							href : 'http://cqi',
							text : 'cqi.cisco.com'
						},
						
						// * navigation: { buttonOptions: { verticalAlign:
						 //* 'center', y: 0, } },
						 
						exporting : {
							chartOptions : {

								xAxis : [ {
									// categories: categories,
									min : 0,
									
									categories : dates,
									showLastLabel : true,
									endOnTick : true,
									labels : {
										rotation : -45
									},
									dateTimeLabelFormats : { // don't
										// display
										// the dummy
										// year
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
									text : 'Export'
								}
							}
						},
						tooltip : {
							valueSuffix : '',
							 valueDecimals: 2,
							crosshairs : [ {
								width : 1.5,
								dashStyle : 'shortdot',
								color : 'grey'
							}, false, true ],
							width : '100%',
							backgroundColor : "#e5e5e5",
							formatter : function() {

								var s = '<span style="color:backlogack; font-weight:bold;">'
										+ this.x + '<span><br>';
								$
										.each(
												this.points,
												function(i, point) {
													if (point.series.name == "Incoming")
														spanStyle = 'font-weight:bold;';
													else if (point.series.name == "Outgoing")
														spanStyle = ' font-weight:bold;';
													else if (point.series.name == "Backlog")
														spanStyle = 'font-weight:bold;';
													s += ('<span style="'
															+ spanStyle
															+ '">'
															+ point.series.name
															+ ' : '
															+ 
																	point.y + '<span><br>');
												});

								return s;
							},
							shared : true,
						},
						plotOptions : {

							line : {
								dataLabels : {
									enabled : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							},
							column : {
								dataLabels : {
									enabled : globalService.indicatorValue,
									allowOverlap : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							},
							column : {
								dataLabels : {
									enabled : globalService.indicatorValue,
									allowOverlap : globalService.indicatorValue,
									format : '{point.y:0f}'
								}
							}

						// enableMouseTracking: true

						},

						loading : false,

						size : {}
					});
					 chart.reflow();
					
					
				
				
			};
			$scope.changeDate = function(val1,val2){
				if(val1 == 'start'){
				$scope.stDate = val2.toString();
				}else{
				$scope.edDate = val2.toString();
				}
				}


			$scope.clearDates = function(){
				$scope.startDate.selected = "";
				$scope.endDate.selected = "";
				$scope.stDate = "";
				$scope.edDate = "";
				}
			 widgetService.getIntervalSelectedValues($scope.intervalType.selected).success(function(result) {
			       	if(result.data.length > 0){
			           var dataToDrop = [];
			             var datesToAdd = {};
			             for(var i=0;i<result.data.length;i++){
			                 datesToAdd = {};
			                 datesToAdd.date =  result.data[i];
			                 datesToAdd.indexNo = i;
			                 dataToDrop.push(datesToAdd);
			             }
			             if($location.search()['intervalType'] == 'week' || $scope.intervalType.selected == 'Week'){
			             for(var i=0;i<dataToDrop.length;i++){
			                    var parts = dataToDrop[i]['date'].split("T");
			            		 var formatDate = parts[0];
								 dataToDrop[i]['date'] = formatDate;/*+" "+setTime[0]+" PST";*/
			             }
			             }
			             $scope.startDate = angular.copy(dataToDrop);
			             $scope.endDate = angular.copy(dataToDrop);
			             if($location.search()['intervalType'] == 'week' || $location.search()['intervalType'] == undefined){
			           	$scope.startDate.selected =  $scope.startDate[12];
			 				$scope.endDate.selected = $scope.endDate[0];
			 				$scope.stDate = $scope.startDate[12].date;
			 				$scope.edDate = $scope.endDate[0].date;
			             }else if($location.search()['intervalType'] == 'month'){
			           	  	$scope.startDate.selected =  $scope.startDate[3];
			     				$scope.endDate.selected = $scope.endDate[0];
			     				$scope.stDate = $scope.startDate[3].date;
			     				$scope.edDate = $scope.endDate[0].date;
			             }else if($location.search()['intervalType'] == 'quarter'){
			           	  	$scope.startDate.selected =  $scope.startDate[2];
			     				$scope.endDate.selected = $scope.endDate[0];
			     				$scope.stDate = $scope.startDate[2].date;
			     				$scope.edDate = $scope.endDate[0].date;
			             }else if($location.search()['intervalType'] == 'year'){
			           	  	$scope.startDate.selected =  $scope.startDate[0];
			     				$scope.endDate.selected = $scope.endDate[0];
			     				$scope.stDate = $scope.startDate[0].date;
			     				$scope.edDate = $scope.endDate[0].date;
			             }
			             }
			       }).error(function(err) {
			$scope.showLoader = false;
			  $scope.navigateTo("errorPage");
			});
			/*$scope.refreshTabGrid = function(){
				$scope.getWidgetDetails();
			}*/
			
			
			//Manager Component search
			$scope.openManagerSearch = function(){
				$scope.compCheck = $scope.viewOverviewManCompSearchUserId.split(',');
				for(var i=0;i<$scope.compCheck.length;i++){
					if($scope.compCheck[i].length < 3){
						$scope.addAlert('Enter first 3 characters of Component to be searched','warning');
						return;
					}
				}
				if($scope.milestoneDates.data.selected != undefined){
                  $scope.scopeWeekDate = $scope.milestoneDates.data.selected.date;
                }
				$scope.templateLocation = 'html/templates/widgetManagerPopup.html';
				 $scope.controllerLocation = 'widgetManagerPopupCtrl';
					$scope.open();
			}
				
				// highcharts end here 
				// highchart ends 
			
			$scope.openScrubberLink = function(row,col,type){
				//$scope.showLoader = true;
				
				var request = {};
				request.Metric = col.displayName;
				request.ViewType = $scope.selectedWidget.ViewType;
				request.ViewID = parseInt(widgetService.selectedViewId);;
				request.Primary = 'N';
				if(type=='File')
					request.Type=type;
				if(row.entity.$$treeLevel == 0){
					request.QueryID = row.entity.QueryID;
				}
				if(row.entity.$$treeLevel == 1){
					request.QueryID = row.treeNode.parentRow.entity.QueryID;
				}
				if(row.entity.$$treeLevel != 0 && row.entity.$$treeLevel != 1){
					 //request.QueryID = row.treeNode.parentRow.treeNode.parentRow.entity.QueryID;
					request.QueryID=$scope.queryID;
				}
				
				widgetService.openScrubber(request).success(function(result) {
					if(result.data["ScrubberLink"] == "N"){
						$scope.addAlert('Scrubber is not available for this Metric','warning');
						  return;
					}
					var appendToUrl = "?pageName=result.html&type=scrubber&expert=";
					var query = result.data["ScrubberLink"];
					
					 if(row.entity.$$treeLevel == 1){
						 query = query+" and DE-manager:"+row.entity.Name;
					 }
					 else if(row.entity.$$treeLevel != 0 && row.entity.$$treeLevel != 1){
						query = query+" and DE-manager:"+row.treeNode.parentRow.entity.Name+" and Component:"+row.entity.Name;
					 }
					 if (query.length < 5000) {
						var url = CISCO.enggit.dashboard_init.urlScrubberReport + appendToUrl;
						url = url.replace(/ /g, "%20");
						url = url + query;
						window.open(url,"_blank");
		             }else{
	                	queryName = widgetService.selectedViewId + "_" + name + "_" + col.displayName;
	                    url = CISCO.enggit.dashboard_init.urlScrubberReport + appendToUrl;
	                    queryName=queryName+"_"+globalService.userId;
	                    url = url + "SAVEDQUERY:" + queryName;
	                    query = "&expert=" + query + "&fields=Age,Component,Component-transition,DE-manager,Foreign-bug,Foreign-bugs,Found,Headline,Priority,Severity,Status&ex_field=&sort=N/A&order=asc&type=scrubber";
	                    var encodedQry = globalService.encodeURIString(query);
	                    widgetService.savescrubberQddtsQuery(encodedQry,queryName).success(function(result) {
	                    	url = url.replace(/ /g, "%20");
	                    	window.open(url,"_blank");
	                    }).error(function(err) {
	                        $scope.showLoader = false;
	                        $scope.navigateTo("errorPage");
	                    });
		             }
				}).error(function(err) {
					$scope.showLoader = false;
					$scope.navigateTo("errorPage");
				});
			}
			
			//for the permanent url
			$scope.getChartUrl = function(highchart, index){
				var row = $scope.graphRowValues[index].row;
				var encodedParentMetric = "";
				var treeLevel = "";
				var manager = "";
				var component = "";
				if($scope.graphRowValues[index].col != undefined){
					var col = $scope.graphRowValues[index].col; 
					encodedParentMetric = encodeURIComponent(col.colDef.category.substring(col.colDef.category.indexOf('-')+1,col.colDef.category.length));	
					treeLevel = row.entity.$$treeLevel;
					if(treeLevel == 0){
						queryId = row.entity.QueryID;
					}else if(treeLevel == 1){
						manager = row.entity.Name;
						queryId = row.treeNode.parentRow.entity.QueryID;
					}else if(treeLevel == undefined){
						component = row.entity.Name;
						manager = row.treeNode.parentRow.entity.Name;
						queryId = row.treeNode.parentRow.treeNode.parentRow.entity.QueryID;
					}
				}else{
						encodedParentMetric = row.ParentMetricName;
						if(row.Level0 == 'Y' && row.Component == undefined && row.Manager == undefined){
							treeLevel = 0;
						}else if(row.Level0 == 'N' && row.Component != undefined && row.Manager == undefined){
							$scope.arrType == "Component"
							treeLevel = undefined;
						}else if(row.Level0 == 'N' && row.Component == undefined && row.Manager != undefined){
							treeLevel = 1;
						}else if(row.Level0 == 'N' && row.Component != undefined && row.Manager != undefined){
							treeLevel = 2;
						}
						
						if(row.Component != undefined){
							component = row.Component;
						}
						if(row.Manager != undefined){
							manager = row.Manager;
						}

						queryId = row.QueryID;
					}
				var DataCalc = '';
				if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week') {
					DataCalc = $location.search()['intervalType'];
				}else{
					DataCalc = 'week';
				}
				if(treeLevel == 0){
					url = CISCO.enggit.dashboard_init.nodeServiceContext+ "api/widget/queryIdTrendPermLink?ViewID="+ $location.search()["viewId"] 
					+ "&WidgetID=" + widgetService.selectedWidget.WidgetID +"&ParentMetric="+ encodedParentMetric+"&QueryID="+queryId+"&Primary=N" + "&DateEnd=" + $scope.edDate + "&DateStart=" + $scope.stDate + '&DataCalc='+ DataCalc ;
				}
				else if(treeLevel == 1){
					url = CISCO.enggit.dashboard_init.nodeServiceContext+ "api/widget/queryIdTrendPermLink?ViewID="+ $location.search()["viewId"] 
					+ "&WidgetID=" + widgetService.selectedWidget.WidgetID +"&ParentMetric="+ encodedParentMetric+"&QueryID="+queryId+"&Primary=N"  + "&DateEnd=" + $scope.edDate + "&DateStart=" + $scope.stDate+"&Hier=MgrComp"+"&Manager="+manager + '&DataCalc='+ DataCalc ;
				}
				else if(treeLevel != 0 && treeLevel != 1){
					url = CISCO.enggit.dashboard_init.nodeServiceContext+ "api/widget/queryIdTrendPermLink?ViewID="+ $location.search()["viewId"] 
					+ "&WidgetID=" + widgetService.selectedWidget.WidgetID +"&ParentMetric="+ encodedParentMetric+"&QueryID="+queryId+"&Primary=N"  + "&DateEnd=" + $scope.edDate + "&DateStart=" + $scope.stDate+"&Hier=MgrComp"+"&Manager="+manager+"&Component="+component + '&DataCalc='+ DataCalc ;
				}
				url = url.replace("widgetReport.htm", "");
				$("#chartUrlModal").modal();
				$('.permaUrl').html(
						"<a target='_blank' href='" + url
								+ "';>" + url + "</a>");
				 $('#trendPermaURLImage').attr('src', '');
				$('#trendPermaURLImage').attr('src', url);
			
			}
			
			$scope.isRefresh = false;
			
			$scope.refreshTabGrid = function(){
			  userCheckList=[];
				$scope.isRefresh = true;
				$scope.arrType = 'Manager';
				widgetService.tabChangeUserids="";
				$scope.openGraphs = [];
				$scope.builtGraph = [];
				$scope.highchart.dates = [];
				$scope.highchart.titles = [];
				$scope.highchart.testArray = [];
				$scope.chartStyleCofig = [];
				$scope.graphRowValues = [];
				graphsToSaveLocal = [];
				$scope.getWidgetDetails();
				savedGraphCount = 0;
				var getGraphobj = {
						 "UserID" :globalService.userId,
						 "WidgetID":$location.search()["widgetId"],
						 "Primary":"N",
						 "Hierarchy":"MgrComp"
				};
						widgetService.getSavedWidgetGraphs(getGraphobj)
						.success(function(data) {
							if(data.status == "success" && data.data.GraphDetails != undefined){
							var totalGraphs = data.data.GraphDetails.length;
							$scope.savedGraphs = data.data.GraphDetails;
							$scope.graphsFromOwner = data.IfSavedByOwner;
							savedGraphsFlag = true;
							if(data.data.GraphDetails.length >0){
							$scope.addGraph($scope.savedGraphs[savedGraphCount])
							}
							}
						})
				.error(
						function(err) {
							$scope.showLoader = false;
			              $scope.navigateTo("errorPage");
						});
						
			}
			
			//Manager search
			$scope.openManagerSearch = function(){
				$scope.compCheck = $scope.viewOverviewManCompSearchUserId.split(',');
				for(var i=0;i<$scope.compCheck.length;i++){
					if($scope.compCheck[i].length < 3){
						$scope.addAlert('Enter first 3 characters of Component to be searched','warning');
						return;
					}
				}
  				$scope.templateLocation = 'html/templates/widgetManagerPopup.html';
  				$scope.controllerLocation = 'widgetManagerPopupCtrl'; 
  				$scope.open('lg');         
			}
			
			//function to save the graphs in the application level variable to send it to the back-end
			$scope.saveGraph = function(){
				$scope.graphsDataToSave.Primary = 'N';
				$scope.graphsDataToSave.Hierarchy = 'MgrComp';
				$scope.graphsDataToSave.WidgetID = $location.search()["widgetId"];
				$scope.graphsDataToSave.GraphDetails = graphsToSaveLocal;
				$scope.templateLocation = 'html/templates/confirmSaveGraphPopUp.html';
				$scope.controllerLocation = 'confirmSaveGraphPopUpCtrl'; 
				$scope.open();
			}
			
			$scope.clearGraphPreferences = function(){
				$scope.graphsDataToSave.Primary = 'N';
				$scope.graphsDataToSave.Hierarchy = 'MgrComp';
				$scope.graphsDataToSave.WidgetID = $location.search()["widgetId"];
				$scope.graphsDataToSave.GraphDetails = [];
				$scope.builtGraph = [];
				$scope.templateLocation = 'html/templates/confirmSaveGraphPopUp.html';
					$scope.controllerLocation = 'confirmSaveGraphPopUpCtrl'; 
					$scope.open();
			}
			
			 $scope.toggleHeight = function(){
	            	$scope.gridHeightToggle = !$scope.gridHeightToggle;
	            	if($scope.gridHeightToggle){
	            		$scope.gridOptionsSubManComp.enableVerticalScrollbar = 0;
	            		$('#gridOptionsSubManComp').css('height','auto');
	            		$('#gridOptionsSubManComp').css('min-height','200px');
	            		$('#gridOptionsSubManComp .ui-grid-viewport').css('height','auto');
	            		$('#gridOptionsSubManComp .ui-grid-viewport').css('min-height','200px');
	            		$('#gridOptionsSubManComp .ui-grid-canvas').css('height','auto');
	            	}else{
	            		$scope.gridOptionsSubManComp.enableVerticalScrollbar = 1;
	            		$('#gridOptionsSubManComp').css('height','347px');
	            		$('#gridOptionsSubManComp .ui-grid-viewport').css('height','');
	            		$('#gridOptionsSubManComp .ui-grid-canvas').css('height','');
	            	}
	            }
			 
			 $scope.getFavClassIcon= function (_trend,_metricType) {
				    if(_trend == 'Up' && _metricType == 'Bad'){
				    	return 'glyphicon glyphicon-triangle-top redArrow alignMiddle';
				    }
				    if(_trend == 'Up' && _metricType == 'Good'){
				    	return 'glyphicon glyphicon-triangle-top greenArrow alignMiddle';
				    }
				    if(_trend == 'Down' && _metricType == 'Bad'){
				    	return 'glyphicon glyphicon-triangle-bottom greenArrow alignMiddle';
				    }
				    if(_trend == 'Down' && _metricType == 'Good'){
				    	return 'glyphicon glyphicon-triangle-bottom redArrow alignMiddle';
				    }
				    if(_trend == 'Same'){
					     return 'glyphicon glyphicon-minus font8 alignMiddle';
					    }
				};
				//modal related code started
	        	var $ctrl = this;
	    		$ctrl.items = ['item1', 'item2', 'item3'];
	    		$ctrl.templateLocation ="";
	    		$ctrl.controllerLocation ="";
	    		$ctrl.open = function (size, parentSelector) {

	    			var parentElem = parentSelector ? 
	    					angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
	    					var modalInstance = $uibModal.open({
	    						animation: $ctrl.animationsEnabled,
	    						ariaLabelledBy: 'modal-title',
	    						ariaDescribedBy: 'modal-body',
	    						templateUrl:  $ctrl.templateLocation,
	    						controller:   $ctrl.controllerLocation,
	    						controllerAs: '$ctrl',
	    						scope : $scope,
	    						size: size,
	    						appendTo: parentElem,
	    						resolve: {
	    							items: function () {
	    								return $ctrl.items;
	    							}
	    						}
	    					});

	    					modalInstance.result.then(function (selectedItem) {
	    						$ctrl.selected = selectedItem;
	    					}, function () {
	    						
	    					});
	    		};

	    		//Modal Related Code  End
	          
	            //for opening mail pop up
	            $scope.openPopUp = function(template , ctrl){

	    			$ctrl.templateLocation =template;
	    			$ctrl.controllerLocation =ctrl;
	    			$ctrl.open();
	    		};
			
			}]);
			
		});