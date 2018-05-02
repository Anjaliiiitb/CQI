/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
		app.controller("widgetTopXCtrl", ['$uibModalInstance', 'items' ,'$scope','uiGridConstants','manageQueryService','globalService','widgetService','$interval','$location', 'uiGridExporterService', 'uiGridExporterConstants',
		                                       function($uibModalInstance, items,$scope,uiGridConstants, manageQueryService,globalService,widgetService,$interval,$location,uiGridExporterService, uiGridExporterConstants) {
			  
			$scope.X=[{'value':'10'},{'value':'20'},{'value':'30'},{'value':'40'},{'value':'50'}];
			$scope.isComp="";
			$scope.metrics=[];
			$scope.colDefinition=[];
			$scope.showLoader = true;
			$scope.subview=widgetService.isPrimary=='Y'?false:true;
			/*angular.copy($scope.colDefs,$scope.colDefinition);
			delete $scope.colDefinition[0];
			$scope.colDefinition[0]={
					 'field': 'Name',
	                 'displayName': 'Name',
	             	 'headerCellClass': 'text-center',
	                 'enableSorting': true,
	                 'enableCellEdit': false,
	                 'width':'15%'
			};
			 */
			var widthCal = function(){
			  var headerObj = $('.modal .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell');
              var headerObjLength = $('.modal  .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell').length;
              var metricDataCellObj = $('.modal .ui-grid-render-container-body .ui-grid-cell');
              
              for(var i=0; i< headerObjLength; i++){
                  
                  if(headerObj[i].clientWidth > metricDataCellObj[i].clientWidth){
                        var headerObjWidth = headerObj[i].clientWidth -1;
                      headerObj[i].style.maxWidth = headerObjWidth + "px";
                      headerObj[i].style.minWidth = headerObjWidth + "px";
                       
                  }
                  
         };  
			  
			}
			 var calcWidth = function(){
			  
			   $(".ui-grid-render-container-body .ui-grid-viewport").on("scroll",function(){

	                $.each($(".ui-grid-category"),function(){
	                  if($(this).find(".categoryheadercell").length == 1){
	                    $(this).find(".ui-grid-categoryheader").addClass("ellipsis");
	                    setTimeout(function(){widthCal();},200);
	                  }
	                });

	                });
			   
			   setTimeout(function(){
			     $.each($(".ui-grid-category"),function(){
                   if($(this).find(".categoryheadercell").length == 1){
                     $(this).find(".ui-grid-categoryheader").addClass("ellipsis");
                     setTimeout(function(){widthCal();},200);
                   }
                 });
			     widthCal();
			     
			   },100);
			   
	            }
			$scope.colDefinition.push({
					 'field': 'Name',
	                 'displayName': 'Name',
	                 'category':'column1',
	             	 'headerCellClass': 'text-center',
	                 'enableSorting': true,
	                 'enableCellEdit': false,
	                 'width':'15%',
	                 'enableColumnMenu':false
			});
			$scope.isComp=$scope.colDefs[0]["displayName"];
			angular.forEach($scope.colDefs, function(val,key){
				if($scope.colDefs[key]["displayName"]!="Organization" && $scope.colDefs[key]["displayName"]!="Pin" && $scope.colDefs[key]["displayName"]!="Product/Component" && $scope.colDefs[key]["displayName"]!="Director/DE-Manager" && $scope.colDefs[key]["displayName"]!="Manager/Component" )
				{	
					$scope.colDefinition.push($scope.colDefs[key]);
				}
			});
			
			angular.forEach($scope.colDefinition, function(val,key){
				$scope.colDefinition[key].sort = {};
				if(key == 1){
				
					$scope.colDefinition[key].sort.direction = uiGridConstants.DESC;
					//$scope.colDefinition[key].sort.priority = $scope.colDefinition.length;
				}
				if(val >7){
				$scope.colDefinition[key]['width']="15%";
				}else{
					if(key==0){
						$scope.colDefinition[key]['width']="15%";
					}
					else{
					$scope.colDefinition[key]['width']="*";
					}
				}
				$scope.colDefinition[key]['cellFilter']='nullToZeroFilter';
				$scope.colDefinition[key]['minWidth']=113;
				//$scope.colDefinition[key]['maxWidth']=200;
				delete $scope.colDefinition[key]['cellTemplate'];
			});
			$scope.emptyData=[];

			$scope.topXGrid="" 
			$scope.topXGrid = {
					data:$scope.emptyData,
					enableSorting : true,
					enableHorizontalScrollbar:1/*uiGridConstants.scrollbars.WHEN_NEEDED*/, 
					enableVerticalScrollbar:1/*uiGridConstants.scrollbars.WHEN_NEEDED*/,
					enableFiltering : false,
					showTreeExpandNoChildren : true,
					enableColumnResizing: true,
					headerTemplate : 'html/views/headTemp.html',
			        gridMenuShowHideColumns:false,
			        exporterCsvFilename: 'TopX.csv',
		            exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
		          
			        onRegisterApi : function(gridApi) {
			        	$scope.gridApi = gridApi;
			        	$interval(function() {
							$scope.gridApi.core.handleWindowResize();
						}, 10);
						$scope.gridApi.core.refresh();
					},
					category : $scope.category,
					enableColumnResize : true,
					enableColumnReordering : true,
					enableGridMenu : false,
					//multiSelect : true,
					columnDefs:$scope.colDefinition
			};
			
			angular.forEach($scope.metricsBody, function(val,key){
				$scope.metrics.push({'name':val});
			});
			 
			$scope.items = items;
			$scope.ok = function () {
				$uibModalInstance.close($scope.selected.item);
			};

			$scope.cancel = function () {
			    $uibModalInstance.dismiss('cancel');
			};
			
			//default loading of the popup
		        if(widgetService.isPrimary == 'Y'){
		        	$scope.X.selected=$scope.X[0]["value"];
		        	$scope.metrics.selected=$scope.metrics[0]["name"];
		        	var data={};
					  data.Metrics=$scope.metricsBody;
					  data.ViewType=widgetService.selectedWidget.ViewType;
					  data.X=$scope.X.selected;
					  data.TopMetric=$scope.metrics.selected;
					  //data.ViewID=parseInt(widgetService.selectedWidget.ViewID);
					  data.ViewID=parseInt($location.search()["viewId"]);
	
					  if($scope.isComp!="Product/Component"){
		        		  $scope.showLoader = true;
			             widgetService.getTopManagers(data).success(function(resultData){
			            	if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}
			             }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	  }else{
		        		  $scope.showLoader = true;
		        		  widgetService.getTopComponents(data).success(function(resultData){
			            	 if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}
		            	 }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	 }
		        }else{

		        	  $scope.X.selected=$scope.X[0]["value"];
		        	  $scope.metrics.selected=$scope.metrics[0]["name"];
		        	  var data={};
					  data.Metrics=$scope.metricsBody;
					  data.ViewType=widgetService.selectedWidget.ViewType;
					  data.X=$scope.X.selected;
					  data.TopMetric=$scope.metrics.selected;
					  //data.ViewID=parseInt(widgetService.selectedWidget.ViewID);
					  data.ViewID=parseInt($location.search()["viewId"]);
					  data.QueryID=$scope.queryIdForInfo; 
		        	  data.Primary="N"; 
		        	  if($scope.isComp!="Product/Component"){ 
		        		  $scope.showLoader = true;
			             widgetService.getTopManagers(data).success(function(resultData){
			            	if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}
			             }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	  }else{
		        		  $scope.showLoader = true;
		        		  widgetService.getTopComponents(data).success(function(resultData){
			            	 if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}
		            	 }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	 }
		    }//default loading of the popup ends

		    $scope.submitDetails=function(){
				  if($scope.metrics.selected==null || $scope.metrics.selected=="" || $scope.X.selected==null ||$scope.X.selected==""){
                      $scope.addAlert("Select values for both X and Metric", "warning");
                      return ;
				  }
				   $scope.topXGrid.data=[];
				  var data={};
				  data.Metrics=$scope.metricsBody;
				  data.ViewType=widgetService.selectedWidget.ViewType;
				  data.X=$scope.X.selected;
				  data.TopMetric=$scope.metrics.selected;
				  
				  //data.ViewID=parseInt(widgetService.selectedWidget.ViewID);
				  data.ViewID=parseInt($location.search()["viewId"]);
				  for(var key = 0;key<$scope.colDefinition.length;key++){
					 
						if($scope.colDefinition[key].displayName == $scope.metrics.selected){
							 for(var i = 0;i<$scope.colDefinition.length;i++){
								 if($scope.colDefinition[i].sort.direction == 'desc')
								delete $scope.colDefinition[i].sort.direction;
							 }
							//$scope.colDefinition[key].sort = {};
							$scope.colDefinition[key].sort.direction = uiGridConstants.DESC;
							$scope.colDefinition[key].sort.priority = 0;
						}
				  }
				  $scope.gridApi.core.refresh();
				  $scope.showLoader = true;
		          if(widgetService.isPrimary == 'Y'){
		        	  if($scope.isComp!="Product/Component"){ 
		        		  $scope.showLoader = true;
			             widgetService.getTopManagers(data).success(function(resultData){
			            	if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}
			             }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	  }else{
		        		  $scope.showLoader = true;
		        		  widgetService.getTopComponents(data).success(function(resultData){
			            	 if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}

		            	 }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        		 
		        	 }
		             
		          }else{
		        	  data.QueryID=$scope.queryIdForInfo; 
		        	  data.Primary="N";
		        	  if($scope.isComp=="Product/Component"){
		        		  $scope.showLoader = true;
		            	 widgetService.getTopComponents(data).success(function(resultData){
			            	 if(resultData.status == 'fail'){
									$scope.showLoader = false;
									$scope.addAlert(resultData.data, 'danger');
									return;
							}
							if(resultData.status == "error") {
									$scope.showLoader = false;
		                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
							} else {
								$scope.showLoader = false;
								if(resultData.data==""){
		                            $scope.addAlert("No data found", "warning");
		                            return ;
								}
								$scope.topXGrid.data=resultData.data;
								setTimeout(calcWidth,1000);
							}

		            	 }).error(function(err){
			  			  $scope.showLoader = false;
		                  $scope.navigateTo("errorPage");
			  			});
		        	  }else{
		        		  $scope.showLoader = true;
		        		  widgetService.getTopManagers(data).success(function(resultData){
				            	if(resultData.status == 'fail'){
										$scope.showLoader = false;
										$scope.addAlert(resultData.data, 'danger');
										return;
								}
								if(resultData.status == "error") {
										$scope.showLoader = false;
			                            $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
								} else {
									$scope.showLoader = false;
									if(resultData.data==""){
			                            $scope.addAlert("No data found", "warning");
			                            return ;
									}
									$scope.topXGrid.data=resultData.data;
									setTimeout(calcWidth,1000);
								}
				             }).error(function(err){
				  			  $scope.showLoader = false;
			                  $scope.navigateTo("errorPage");
				  			});
		        		  
		        	  }
		             }
				  
			  }
			      /*download Grid*/
			
			$scope.downloadGrid = function(){
				var grid = $scope.gridApi.grid;
				  var rowTypes = uiGridExporterConstants.ALL;
				 var colTypes = uiGridExporterConstants.ALL;
				 
				uiGridExporterService.csvExport(grid, rowTypes, colTypes);
			}
		}]);
		
});

