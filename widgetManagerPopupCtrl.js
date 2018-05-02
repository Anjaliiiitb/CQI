/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
		app.controller("widgetManagerPopupCtrl", ['$uibModalInstance', 'items' ,'globalService','$scope','widgetService','$location','relViewService', 'orgViewService', function($uibModalInstance, items,globalService,$scope,widgetService,$location,relViewService,orgViewService) {
			  var $ctrl = this;
			  $scope.type = 'Manager';
			  //$scope.detailsType = [{name:'Manager'}];
			  $scope.detailsType =[{name:'Manager'},{name:'Component'}] ;
			  $scope.enteredComponentToShare = [];
		      $scope.enteredComponent = '';
		      $scope.dataToLink = [];
		      $scope.dataSendToLink = "";

			  $ctrl.ok = function () {
			    $uibModalInstance.close($ctrl.selected.item);
			  };

			  $ctrl.cancel = function () {
			    $uibModalInstance.dismiss('cancel');
			  };
			  
			  //Grid definition
			  $scope.widgetOverViewAllUserList = {
			            enableSorting: true,
			            enableHorizontalScrollbar: 0,
			            enableVerticalScrollbar: 1,
			            enableFiltering: false,
			            onRegisterApi: function(gridApi) {
			                $scope.gridApiA = gridApi;
			            },
			  };
			  var intervaltype = '';
			  if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week'){
				  intervaltype = $location.search()['intervalType'];
			  }else{
				  intervaltype = 'week';
			  }
			  $scope.widgetOverViewAllUserList.columnDefs = [{
																field: 'Userid',
																displayName: 'ID',
																enableSorting: true
															}, {
																field: 'Name',
																displayName: 'Name',
																enableSorting: true,
																enableCellEdit: false
															}];
			  
			  $scope.viewOverviewOrgSearchUserId =  $scope.viewOverviewManCompSearchUserId.replace(/\s*,\s*/g, ",");
			  $scope.user = $scope.viewOverviewOrgSearchUserId;
			  $scope.compIn = $scope.user;
			        
			  //function to load data in grid
			  	$scope.searchUser = function(){
					
			  		$scope.user = $scope.compIn;
					$scope.checkUsers = $scope.compIn.split(',');
					for(var i=0;i<$scope.checkUsers.length;i++){
					        		if($scope.checkUsers[i].length < 3){
					        			$scope.addAlert(' Enter first 3 characters of User Id to be searched','warning');
					        			return;
					        		}
					}
					$scope.showLoader = true;
					if($scope.type.indexOf("Manager")>-1){//Manager Search
					    widgetService.dirMgrListSearch($scope.checkUsers,$scope.type).success(function(data){
					    	$scope.showLoader = false;
					    	$scope.widgetOverViewAllUserList.data = data.data;
					    }).error(function(err){
					    	$scope.showLoader = false;
							$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
						});
						        	
					}else{//Component Search
					        		var tempObj=[];
					        		widgetService.getProdCompList($scope.checkUsers,$scope.type).success(function(data){
										$scope.showLoader = false;
										angular.forEach(data.data, function(value) {
											var temp={};
											temp.Userid=value;
											temp.Name=value;
											tempObj.push(temp);
										});
										$scope.widgetOverViewAllUserList.data = tempObj;
									}).error(function(err){
										$scope.showLoader = false;
										$scope.navigateTo("errorPage");
									});
					}
			  	}
				
			  	$scope.searchUser();
			        	
			    //Its a manager or component
			    $scope.setData = function(name){
			        	$scope.type = name;
			    }
			        
			    //on search button after adding data in input field
			    $scope.searchComp = function(){
			        		 $scope.selectedRows = $scope.gridApiA.selection.getSelectedRows();
						        if($scope.selectedRows.length < 1){
						        	$scope.addAlert('Select atleast one value from the List','warning');
						        	return;
						        }
						        var selectedArray = [];
						        angular.forEach($scope.selectedRows, function(selectedRows,selectedRowsIndex) {
						        	selectedArray.push(selectedRows.Userid);								
								});
						        var selectedQueries =  [];
						        
						        var selectedIdsString = selectedArray.join();
						        //search code starts
						        var charParams={}
							       charParams["searchQuery"]=selectedIdsString;
							     //  charParams["userId"]="archds";
						        charParams["userId"]=CISCO.enggit.dashboard_init.user_id;
						        charParams["bebu"]=globalService.groupName;
							       //save the user search
							     
							       //search code ends
							    if($location.url().indexOf('widgetReport')>-1){
							    	if(widgetService.isPrimary=='Y')
						    			charParams["pageFlag"]="Widget/overall";
						    		else
						    			charParams["pageFlag"]="Widget/subView";
							    	if($scope.scopeWeekDate != undefined){
							    	  $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+'mgrComp'+'&viewId='+$location.search()['viewId']+'&'+$scope.type.toLowerCase()+'='+selectedIdsString+'&intervalType='+intervaltype+'&weekDate='+$scope.scopeWeekDate);
							    	}
							    	/* if($location.search()["weekDate"] != undefined){
							    		 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+'mgrComp'+'&viewId='+widgetService.selectedViewId+'&'+$scope.type.toLowerCase()+'='+selectedIdsString+'&weekDate='+$location.search()["weekDate"]);
							    	 }else{
							    		 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+'mgrComp'+'&viewId='+widgetService.selectedViewId+'&'+$scope.type.toLowerCase()+'='+selectedIdsString);	 
							    	 }*/
							    }else if($location.url().indexOf('relViewReport')>-1){
							    	charParams["pageFlag"]="Release/glance";
					        		 $scope.selectedRows = $scope.gridApiA.selection.getSelectedRows();
								        if($scope.selectedRows.length < 1){
								        	$scope.addAlert('Select atleast one value from the List','warning');
								        	return;
								        }
								        $uibModalInstance.dismiss('cancel');
								        $scope.navigateTo('relViewReport',false,".htm?viewId="+relViewService.viewId +'&viewType=mgrComp&userIds='+selectedArray+'&type='+$scope.type);
								        $scope.togglePopup(true);
								}else{
									charParams["pageFlag"]="OQ/glance";
										$scope.selectedRows = $scope.gridApiA.selection.getSelectedRows();
										if($scope.selectedRows.length < 1){
								        	$scope.addAlert('Select atleast one value from the List','warning');
								        	return;
								        }
								        $uibModalInstance.dismiss('cancel');
								        $scope.navigateTo('orgViewReport',false,".htm?viewId="+orgViewService.viewId +'&viewType=mgrComp&userIds='+selectedArray+'&type='+$scope.type);
								        $scope.togglePopup(true);
								}
							    if($scope.type!='Component')
							    	{
							    	//console.log("not component")
							    widgetService.saveUserSearch(charParams).success(function(data){
							    	  // console.log("user search saved successfully in widget "+$scope.type.toLowerCase()+"--"+JSON.stringify(data));
							    		
							       })
							    	}
			     };
			     
			     // for writing hierachy of director tab
		         var writeoutNode = function(childArray, currentLevel, dataArray) {
		            	childArray.forEach(function(childNode) {
		                    if (childNode.children.length >= 0 && currentLevel != 1) {
		                        childNode.$$treeLevel = currentLevel;
		                    }
		                    dataArray.push(childNode);
		                    writeoutNode(childNode.children, currentLevel + 1,
		                        dataArray);
		                });
		         };
		}]);
});

