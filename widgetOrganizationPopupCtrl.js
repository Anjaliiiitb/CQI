/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
		app.controller("widgetOrganizationPopupCtrl", ['$uibModalInstance', 'items','globalService' ,'$scope', '$location','widgetService', 'manageQueryService','relViewService', 'orgViewService','$controller',
		                                               function($uibModalInstance, items,globalService,$scope,$location,widgetService, manageQueryService,relViewService,orgViewService) {
			  var $ctrl = this;
			  
			  $scope.usersToshare = [];
		      $scope.enteredUsers = '';
		      $scope.dataToLink = [];
		      $scope.dataSendToLink = "";
		      

			  $ctrl.ok = function () {
			    $uibModalInstance.close($ctrl.selected.item);
			  };

			  $ctrl.cancel = function () {
			    $uibModalInstance.dismiss('cancel');
			  };
			  
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
			            displayName: 'User ID',
			            enableSorting: true
			        }, {
			            field: 'Name',
			            displayName: 'Name',
			            enableSorting: true,
			            enableCellEdit: false
			  }];
			       // userPreferencesService.setValidUser($scope.viewOverviewOrgSearchUserId);
			        if($location.url().indexOf('widgetReport')>-1){
				    	   $scope.viewOverviewOrgSearchUserId =  $scope.viewOverviewOrgSearchUserId.replace(/\s*,\s*/g, ",");
			        }else if($location.url().indexOf('orgViewReport')>-1){
				    	   $scope.viewOverviewOrgSearchUserId =  $scope.viewOverviewOrgSearchUserId.replace(/\s*,\s*/g, ",");
			        }else if($location.url().indexOf('relViewReport')>-1){
				    	   $scope.viewOverviewOrgSearchUserId =  $scope.viewOverviewOrgSearchUserId.replace(/\s*,\s*/g, ",");
			        }else if(relViewService.tabType == 'scorecard')
			        		$scope.viewOverviewOrgSearchUserId =  $scope.viewOverviewOrgSearchUserId.replace(/\s*,\s*/g, ",");
			        else if(relViewService.tabType == 'alternate')
			        		$scope.viewOverviewOrgSearchUserId =  $scope.viewSubOverviewOrgSearchUserId.replace(/\s*,\s*/g, ",");
			        $scope.user = $scope.viewOverviewOrgSearchUserId;
			        $scope.inOrgUser = $scope.user;
			        
			        //getting data in grid on search button of pop up
			        $scope.searchUser = function(){
			        	
			        	$scope.user = $scope.inOrgUser;
			        	$scope.checkUsers = $scope.inOrgUser.split(',');
			        	for(var i=0;i<$scope.checkUsers.length;i++){
			        		if($scope.checkUsers[i].length < 3){
			        			$scope.addAlert(' Enter first 3 characters of User Id to be searched','warning');
			        			return;
			        		}
			        	}
			        	$scope.showLoader = true;
			        	widgetService.orgUserListSearch($scope.checkUsers).success(function(data){
								$scope.showLoader = false;
								var dataGrid=[];
								//finding exact match of userids searched for
								for(var i=0;i<$scope.checkUsers.length;i++){
									var temp=$scope.checkUsers[i];
									var name=data.data.filter(function(obj){return (obj.Userid==temp);})[0];
									if( name != undefined){
										var name1=name.Name;
										var element={};
										element.Userid=temp;
										element.Name=name1;
										dataGrid.push(element);									
									}
								}
								//console.log(dataGrid);
								if(dataGrid.length==$scope.checkUsers.length)
									$scope.widgetOverViewAllUserList.data = dataGrid;
								else{//appending sorted data.data to the userids that match completely for the grid
									data.data.sort(function(a, b) {
									    var textA = a.Userid.toUpperCase();
									    var textB = b.Userid.toUpperCase();
									    return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
									});
									angular.forEach(data.data,function(obj) {                        		
											dataGrid.push(obj);
									});
									$scope.widgetOverViewAllUserList.data = dataGrid;
								}

							}).error(function(err){
								$scope.showLoader = false;
								$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
							});
			        }
			        $scope.searchUser();
			   			        
			        //on click of select button putting data in input of main page			      
				    $scope.selectedUsers = function(){
			
				        $scope.selectedRows = $scope.gridApiA.selection.getSelectedRows();
				        if($scope.selectedRows.length < 1){
				        	$scope.addAlert('Select atleast one value from the List','warning');
				        	return;
				        }
				        var charParams={}
				       // charParams["userId"]="archds";
				        charParams["userId"]=CISCO.enggit.dashboard_init.user_id;
				      
				        
				        var selectedUsers = [];
				        angular.forEach($scope.selectedRows, function(users) {
				          selectedUsers.push(users.Userid);
				        });
				      // console.log("selected are"+selectedUsers+"by"+globalService.userId)
				      //var selectedUsersString= selectedUsers.join();
				      
				        //for widgetReport Organization search
				        if($location.url().indexOf('widgetReport')>-1){
				        	
					        var metricDetails = [];
					        angular.forEach($scope.gridrefreshData.MetricDetails, function(metric){
					          if(metric.SubMetric.length == 0){
					            metricDetails.push(metric.MetricName);
					          }else{
					            angular.forEach(metric.SubMetric, function(metric1){
					              metricDetails.push(metric1.MetricName);
					            });
					          }
					        });
					        var queryIds = [];
					        angular.forEach($scope.gridDataover, function(queryD){
					          queryIds.push(queryD.QueryID);
					        });
					        
					        var selectedIdsString = selectedUsers.join();
					        charParams["searchQuery"]=selectedIdsString;
					        if(widgetService.isPrimary=='Y')
				    			charParams["pageFlag"]="Widget/overall";
				    		else
				    			charParams["pageFlag"]="Widget/subView";
					        charParams["bebu"]=globalService.groupName;
						       //charParams["pageFlag"]="Widget/overall";
					       // console.log("headers are..widget org"+JSON.stringify(charParams))
						       //save the user search
						       orgViewService.saveUserSearch(charParams).success(function(data){
						    	   //console.log($location.search()["weekDate"]);
						    	 // will remove this condition when $scope.scopeWeekDate is implemented for all tabs
						    	   if($scope.scopeWeekDate != undefined){
									 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+$scope.type+'&hierarchy='+$scope.hierarchy+'&viewId='+$location.search()['viewId']+'&userIds='+selectedIdsString+'&intervalType='+intervaltype+'&weekDate='+$scope.scopeWeekDate);
						    	   }
						    	   /*if($location.search()["weekDate"] != undefined){
						    	     $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+$scope.type+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+selectedIdsString+'&weekDate='+$location.search()["weekDate"]);
						    	   }else{
						    	   $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+$scope.type+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+selectedIdsString);
									}*/
									})
			    				      
				        }
				        else if($location.url().indexOf('orgViewReport')>-1 ||$location.url().indexOf('relViewReport')>-1 )
				        {//for OQ and REL view report org hierarchy search
				        	
				        	var viewIdService="";
				        	var viewTypeService="";
				            if($location.url().indexOf('orgViewReport')>-1){
						        viewIdService=orgViewService.viewId;
						        viewTypeService=orgViewService.viewType;
					        }else if($location.url().indexOf('relViewReport')>-1){
					        	viewIdService=relViewService.viewId;
						        viewTypeService=relViewService.viewType;
					        }
					        $scope.togglePopup(true);
					        $uibModalInstance.dismiss('cancel');
					        if($location.url().indexOf('orgViewReport')>-1)
					        	{
					        	  charParams["searchQuery"]=selectedUsers;
							       charParams["pageFlag"]="OQ/glance";
							      // console.log("headers are..oq"+JSON.stringify(charParams))
							       //save the user search
							       charParams["bebu"]=globalService.groupName;
							       orgViewService.saveUserSearch(charParams).success(function(data){
							    	  // console.log("user search saved successfully"+JSON.stringify(data));
							    	   $scope.navigateTo('orgViewReport',false,".htm?viewId="+orgViewService.viewId +'&viewType=org&userIds='+selectedUsers);
							       })
					        	
					        	}
				            else if($location.url().indexOf('relViewReport')>-1)
				            	{
				       
							       charParams["searchQuery"]=selectedUsers;				
							       charParams["pageFlag"]="Release/glance";
							       charParams["bebu"]=globalService.groupName;
							       //save the user search
							       orgViewService.saveUserSearch(charParams).success(function(data){
							    	   //console.log("user search saved successfully"+JSON.stringify(data));
							       })
				            	
				            	$scope.navigateTo('relViewReport',false,".htm?viewId="+relViewService.viewId +'&viewType=org&userIds='+selectedUsers);
				            	}
				        
				        	} else{ //for releases
				        		
				        		$scope.scorecardGrid.data= [];
				        		$scope.viewOverviewOrgSearchUserId =selectedUsers;
				        		$uibModalInstance.dismiss('cancel');
				        		type = relViewService.tabType;
				        		 $scope.scorecardGridApi.core.refresh();
					            $scope.navigateTo('releaseScorecard',false,".htm?viewId="+relViewService.viewId +'&viewType='+type+'&userIds='+selectedUsers);
	
				        		
				        	}           
			        }
	  
		}]);
		
		var writeoutNode = function(childArray, currentLevel, dataArray) {
                childArray.forEach(function(childNode) {
                      if (childNode.children.length >= 0) {
                          childNode.$$treeLevel = currentLevel;
                      }
                      dataArray.push(childNode);
                      writeoutNode(childNode.children, currentLevel + 1,
                              dataArray);
                  });
        };
		
		
});

