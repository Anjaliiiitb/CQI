    /* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app) {

    app.controller("widgetReportCtrl", ['$route','$scope', 'widgetService','$location','$log','$timeout','$rootScope','globalService', '$uibModal','$compile',
                                        function($route,$scope, widgetService,$location,$log,$timeout,$rootScope,globalService,$uibModal,$compile) {
    	$scope.formatD = globalService.dateFormat;
        var $ctrl = this;
    	$ctrl.items = ['item1', 'item2', 'item3'];
    	$ctrl.templateLocation = "";
    	$ctrl.controllerLocation = "";
    	$scope.overall = [false,false,false,false,false];
    	$scope.subview  = [false,false,false,false,false];
    	$scope.isPrimary = "";
    	$scope.hierarchy = "";
    	$scope.ViewsList="";
    	$scope.viewDataForOverall = []; 
		$scope.validDate=true;
		var weekDate = ''
			if($location.search()["weekDate"] != undefined){
				weekDate = $location.search()["weekDate"];
			}
			
    	   $scope.alerts = [];
           $scope.addAlert = function(msg, type) {
               $scope.alerts.push({
                   msg : msg,
                   type : type
               });
           };
           $scope.closeAlert = function(index) {
               $scope.alerts.splice(index, 1);
           };
    	//widgetService.tabChangeUserids="";
    	$scope.selectedViewName = "";
    	$scope.getSavedWidget = function(id){
    		for(var i=0;i<$rootScope.widgetList.length;i++){
				if($rootScope.widgetList[i].WidgetID == id){
					return $rootScope.widgetList[i];
				}
    		}
    	}
    	
    	//widgetService.comparableViews = [];
    	
    	$ctrl.open = function (size, parentSelector) {

			var parentElem = parentSelector ? angular
				.element($document[0].querySelector('.modal-demo '
						 + parentSelector))
				 : undefined;
			var modalInstance = $uibModal.open({
					animation: $ctrl.animationsEnabled,
					ariaLabelledBy: 'modal-title',
					ariaDescribedBy: 'modal-body',
					templateUrl: $ctrl.templateLocation,
					controller: $ctrl.controllerLocation,
					controllerAs: '$ctrl',
					scope: $scope,
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
				$log.info('Modal dismissed at: ' + new Date());
			});
		};
	    
	 // Modal Related Code End
		$scope.openPopUp = function () {
			var tabValsToService = {}
			tabValsToService["hier"] = $location.search()["hierarchy"];
			tabValsToService["primary"] = $location.search()["primary"];
			widgetService.tabvals = tabValsToService;
			if(widgetService.selectedWidget.ViewType == "Release"){
				$ctrl.templateLocation = 'html/templates/compareReleases.html';
				$ctrl.controllerLocation = 'compareReleasesCtrl';
        	}
        	
        	if(widgetService.selectedWidget.ViewType == "OQ"){
        		$ctrl.templateLocation = 'html/templates/compareViews.html';
    			$ctrl.controllerLocation = 'compareReleasesCtrl';
        	}
				$ctrl.open('lg');
			
		};
		// popup function end	
		
		//code to check if current widget is linked with use i.e onwer,co-owner,shared or public, or it is open from bookmark and don't belong to user
    	$scope.checkCompareWidget = function(result){
    		var isWidgetLinked = false;
    		var userId = globalService.userId;
    		for(var i=0;i<result.data.ReadOnly.length;i++){
				if(userId == result.data.ReadOnly[i].UserID || result.data.ReadOnly[i].UserID == "PUBLIC"){
					isWidgetLinked = true;
				}
			}
    		for(var i=0;i<result.data.CoOwner.length;i++){
				if(userId == result.data.CoOwner[i].UserID){
					isWidgetLinked = true;
				}
			}
    		if(userId == result.data.CreatedBy){
    			isWidgetLinked = true;
    		}
    		return isWidgetLinked;
    	}
    	//-----------------------------------------------------------------------
    	$scope.openPrintViewPage = function(){
        	
        	//navigateTo('printView');
	        $scope.navigateTo('printView',false,".htm?viewIdOrName="+widgetService.selectedViewId);

        };
        $scope.setStatusRefreshedDate = function(){
        	var refDate=$scope.ViewsList.LastRefreshDate;
        	
        	if(refDate==null ||refDate=="" ||refDate==undefined){
        		$scope.validDate=false;
            	return;
        	}else
        		$scope.validDate=true;
        	
        	var newDate= new Date();
        	var lastRefDate=new Date($scope.ViewsList.LastRefreshDate);
        	var hours=Math.abs(newDate - lastRefDate) / 36e5;
        	hours=Math.round(hours * 100) / 100 ;
        	if(hours>31)
        		$scope.refreshDateTime="red";
        	else
        		$scope.refreshDateTime="green";
        	
        	var parts = refDate.split("T");
        	var setTime = parts[1].split('.');			
            $scope.lastRefreshDate=parts[0]+" "+setTime[0]+" PST";
        
        };
        $scope.noViewsToUser = false;
    	//code runs on load of page check for values in URL, gets widget Details
    	$scope.onLoad = function(){
    		if ($location.search()["widgetId"] !== undefined) {
    			var getId = $location.search()["widgetId"];
    			if ($location.search()["viewId"] !== undefined) 
    				widgetService.selectedViewId = parseInt($location.search()["viewId"]);
    			
    			widgetService.getWidgetDetails(getId).success(function(result) {
    					$scope.selectedWidget = result.data;
        				widgetService.selectedWidget = result.data;
        				if(result.data == null){
        					 $scope.navigateTo("errorPage");
        				}
        				$scope.linkedWidget = $scope.checkCompareWidget(result);
        				
        				if ($location.search()["viewId"] !== undefined) {
        	    			var ids= $location.search()['viewId'].toString().split(',');
        	    			widgetService.getViews($scope.selectedWidget.ViewType,globalService.groupName)
        	    			.success(function(data) {
        	    			//	$scope.linkedView = $scope.checkCompareView(result);
        	    			
        	    				$scope.viewData = data.data;
        	    				widgetService.compareViewData = data.data;
        	    				var flagTocheckViewlinked = 0;
        	    				for(var j=0;j<ids.length;j++){
        	    				for(var i=0;i<$scope.viewData.length;i++){
        	    					if($scope.viewData[i].ViewID == ids[j]){
        	    						$scope.viewData.selected = $scope.viewData[i];
        	    						$scope.ViewsList = $scope.viewData[i];
        	    					}else{
        	    						flagTocheckViewlinked++;
        	    					}
        	    				}
        	    				}
        	    				var objToSearch = {};
        	    				for(var i=0;i<data.data.length;i++){
        	    					objToSearch = {};
        	    					if(data.data[i].SharedType == 'PUBLIC'){
        	    						objToSearch.color = '#AE1EE3';
        	    					}else if(data.data[i].SharedType == 'Owner'){
        	    						objToSearch.color = '#8A8A8A';
        	    					}else{
        	    						objToSearch.color = '#0275D8';
        	    					}
        	    					objToSearch.name = data.data[i].ViewName;
        	    					objToSearch.abbreviation = '';
        	    					objToSearch.status = false;
        	    					objToSearch.viewId = data.data[i].ViewID
        	    					$scope.viewDataForOverall.push(objToSearch);
        	    				}
        	    				
        	    				if($scope.viewDataForOverall.length == 0){
        	    					$scope.noViewsToUser = true;
        	    				}
        	    				
        	    				$scope.searchViews();
        	    				$scope.searchedViewsSelected = [];
        	    	        	var selectedViewNames  = [];
        	    				var viewIdsAsString =$location.search()['viewId'].toString().split(',');
        	    				for(var i=0;i<viewIdsAsString.length;i++){
        	    					$scope.searchedViewsSelected.push(parseInt(viewIdsAsString[i]))
        	    				}
        	    				
        	    				for(var i=0;i<$scope.viewDataForOverall.length;i++){
        	    					for(var j=0;j<$scope.searchedViewsSelected.length;j++){
        	    						if($scope.viewDataForOverall[i].viewId == $scope.searchedViewsSelected[j]){
        	    							$scope.viewDataForOverall[i].status = true;
        	    							selectedViewNames.push(i);
        	    						}
        	    					}
        	    				}
        	    				for(var k=0;k<selectedViewNames.length;k++){
        	    					
        	    					$.each($(".searchSelectContainer input[type=checkbox]"),function(i,j){
        	    						if(i == selectedViewNames[k]){
        	    					
        	    							$(j).prop('checked',true);
        	    							$scope.noClear = false;
        	    							$scope.noDefault = false;
        	    						}

        	    					});
        	    				}
        	    				if(selectedViewNames.length == 0){
        	    					widgetService.getViewNameById($location.search()['viewId']).success(function(result){
        	    						$scope.searchedPlaceHolder = result.data[0].ViewName;
        	    						$scope.ViewsList= result.data[0];   
               	     				 	$scope.setStatusRefreshedDate();
        	    						
        	    					}).error(
        	    	    					function(err) {
        	    	    						$scope.showLoader = false;
        	    		                        $scope.navigateTo("errorPage");
        	    	    					});
        	    	    			
        	    				}
        	    				if(selectedViewNames.length == 1){
        	    					$scope.searchedPlaceHolder = $scope.viewDataForOverall[selectedViewNames[0]].name;
        	    				}
        	    				else if(selectedViewNames.length > 0){
        	    					$scope.searchedPlaceHolder = selectedViewNames.length +' Views Selected';
        	    				}else{
        	    					$scope.searchedPlaceHolder = 'No View Selected';
        	    				}
        	    				
        	    				// if flagTocheckViewlinked length will be equal to the length of views associated with user that means the current views are not associated with the user
        	    				if($location.search()['primary'] != 'Y'){
	        	    				if(flagTocheckViewlinked == data.data.length){
	        	    					
	        	    					widgetService.getViewNameById($location.search()['viewId']).success(function(data) {
	        	    						$scope.viewData.selected = data.data[0];// if view is not associated with the user then this service call will provide the view name to generate saved graph preferences
	        	    						$scope.ViewsList= data.data[0];   
	               	     				 	$scope.setStatusRefreshedDate();
	
	        	    					}).error(function(err) {
	        	    						  $scope.showLoader = false;
	        	    	                      $scope.navigateTo("errorPage");
	        	    					});
	        	    					$scope.linkedView = false;
	        	    				}else{
	        	    					$scope.linkedView = true;
	           	     				 	$scope.setStatusRefreshedDate();
	        	    				}
        	    				}else{
        	    					if(flagTocheckViewlinked != data.data.length){
        	    						$scope.linkedView = true;
               	     				 	$scope.setStatusRefreshedDate();
        	    					}
        	    				}
        	    			
		    			}).error(function(err) {
		    						$scope.showLoader = false;
			                        $scope.navigateTo("errorPage");
		    			});
	    			}
				}).error(function(err) {
					$scope.showLoader = false;
                      $scope.navigateTo("errorPage");
				});

			};
    			
        	if ($location.search()["hierarchy"] !== undefined) {
        		$scope.hierarchy = $location.search()["hierarchy"];
        	}
        	
        	
        	if ($location.search()["primary"] !== undefined) {
        		$scope.isPrimary = $location.search()["primary"];
        		widgetService.isPrimary = $scope.isPrimary;
        		if($scope.isPrimary == 'Y'){
        			$scope.activeForm = 0;
        			if($scope.hierarchy == 'dir'){
        				$scope.activeFormChild = 3;
            			$scope.overall[3] =true;
            		}else if($scope.hierarchy == 'comp'){
            			$scope.activeFormChild = 1;
            			$scope.overall[1] =true;
            		}else if($scope.hierarchy == 'pin'){
            			$scope.activeFormChild = 2;
            			$scope.overall[2] =true;
            		} else if($scope.hierarchy == 'org'){
            			$scope.activeFormChild = 0;
            			$scope.overall[0] =true;
            		}else{
            			$scope.activeFormChild = 4;
            			$scope.overall[4] =true;
            		}
        		}else{
        			$scope.activeForm = 1;
        			if($scope.hierarchy == 'dir'){
        				$scope.activeFormChild = 3;
            			$scope.subview[3] = true;
            		}else if($scope.hierarchy == 'comp'){
            			$scope.activeFormChild = 1;
            			$scope.subview[1] = true;
            		}else if($scope.hierarchy == 'pin'){
            			$scope.activeFormChild = 2;
            			$scope.subview[2] = true;
            		}else if($scope.hierarchy == 'org'){
            			$scope.activeFormChild = 0;
            			$scope.subview[0] = true;
            		}else{
            			$scope.activeFormChild = 4;
            			$scope.subview[4] = true;
            		}
        		}
        	}
        	
    	}
    	//-------------------------------------------------------
    	
        //on selection of view from the dropdown
    	$scope.newSelected ="";
    	$scope.onQuerySelect = function(item){
    		var interType = 'week';
    		if($location.search()['intervalType'] != undefined){
				interType = $location.search()['intervalType'];
			}
    		$scope.newSelected = item.ViewID;
    		widgetService.selectedViewId = $scope.newSelected;
    		if($scope.isPrimary == 'Y'){
    			if(weekDate != undefined && weekDate != ''){
/*if($location.search()['viewId'].toString().split(',').length > 1){
    				$scope.searchedViews = $location.search()['viewId'].toString().split(',');
       			 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+$scope.hierarchy+'&viewId='+$scope.searchedViews+'&weekDate='+weekDate);
    				}*/
    			 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+$scope.hierarchy+'&viewId='+$scope.newSelected+'&weekDate='+weekDate+'&intervalType='+interType);
    			}else{
       			 $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+$scope.hierarchy+'&viewId='+$scope.newSelected+'&intervalType='+interType);
    			}
    		}else{
    			if(weekDate != undefined && weekDate != ''){
    				/*if($location.search()['viewId'].toString().split(',').length > 1){
        				$scope.searchedViews = $location.search()['viewId'].toString().split(',');
        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+$scope.hierarchy+'&viewId='+$scope.searchedViews+'&weekDate='+weekDate);
        				}*/
    				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+$scope.hierarchy+'&viewId='+$scope.newSelected+'&weekDate='+weekDate+'&intervalType='+interType);
    			}else{
    				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+$scope.hierarchy+'&viewId='+$scope.newSelected+'&intervalType='+interType);
    			}
    		}
    	}
    	//---------------------------------------------------------
    	
    	
    	
    	//Code to shift from one tab to another i.e (org to comp to mgrComp to dir to pin) or (overall to sub-view )
    	$scope.changeURL = function(isPrimary,hierarchy){
    		var interType = 'week';
    		
    		if(isPrimary == 'N' && $location.search()['viewId'].toString().split(',').length > 1){
    			$scope.addAlert('Sub View will not be available if more than 1 view is selected in the widget', 'warning');
    			$scope.activeForm = 0;
    			if($location.search()['hierarchy'] == 'dir'){
    				$scope.activeFormChild = 3;
        			$scope.overall[3] =true;
        		}else if($location.search()['hierarchy'] == 'comp'){
        			$scope.activeFormChild = 1;
        			$scope.overall[1] =true;
        		} else if($location.search()['hierarchy'] == 'org'){
        			$scope.activeFormChild = 0;
        			$scope.overall[0] =true;
        		}else{
        			$scope.activeFormChild = 4;
        			$scope.overall[4] =true;
        		}
    			return;
    		}else{
    			if(isPrimary == 'N' && hierarchy == 'org'){
    				$scope.activeFormChild = 0;
    			}
    			if($location.search()['intervalType'] != undefined){
    				interType = $location.search()['intervalType'];
    			}
    		/*widgetService.isPrimary = isPrimary;
    		if(isPrimary == 'Y'){
    			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId);
    		}else{
    			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId);
    		}
    		*/
    		if($location.search()['viewId'].toString().split(',').length > 1){
    			widgetService.selectedViewId = $location.search()['viewId'].toString();
				}
    		var type="";
    		var searchedUserId=$location.search()["userIds"];
    		if(searchedUserId==undefined)
    			searchedUserId=$location.search()["director"];
    		if(searchedUserId==undefined)
    			searchedUserId=$location.search()["manager"];
        	if(hierarchy!="comp" && hierarchy!="pin" && searchedUserId!=undefined){
        		widgetService.tabChangeUserids=searchedUserId;
        	}
    		if(searchedUserId==undefined && widgetService.tabChangeUserids==""){
        		widgetService.isPrimary = isPrimary;
        		if(isPrimary == 'Y'){
        				if(weekDate != undefined && weekDate != ''){
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            			}else{
                			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);
            			}		
        		}else{
        				if(weekDate != undefined && weekDate != ''){
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            			}else{
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);        				
            			}
        			}
        		
    		}else{
    			if(widgetService.isPrimary != isPrimary){
            		widgetService.tabChangeUserids="";
        			widgetService.isPrimary = isPrimary;
        			if(isPrimary == 'Y'){
        				//for time being till servcies for interval type are ready for comp and mngrComp tab
        				if($location.search()['hierarchy'] == 'comp' || $location.search()['hierarchy'] == 'mgrComp'){
        				if(weekDate != undefined && weekDate != ''){
        					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
        				}else{
        					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);        					
        				}}else{
        					if(weekDate != undefined && weekDate != ''){
            					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            				}else{
            					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=Y&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);        					
            				}
        				}
        			}else{
        				if($location.search()['hierarchy'] == 'comp' || $location.search()['hierarchy'] == 'mgrComp'){
        				if(weekDate != undefined && weekDate != ''){        				
        					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
        				}else{
        					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);        					
        				}
        				}else{
        					if(weekDate != undefined && weekDate != ''){        				
            					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            				}else{
            					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary=N&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);        					
            				}
        				}
        			}
            	}else{//within same parent tab only retain the searched ids
            		if(hierarchy=="org"){
            			if(searchedUserId!=undefined)
	            			$scope.checkUsers=searchedUserId.split(",");
                    	else
                    		$scope.checkUsers = widgetService.tabChangeUserids.split(',');
            			widgetService.orgUserListSearch($scope.checkUsers).success(function(data){
                			if(data.data.length==0){
                				$scope.addAlert('The userid searched does not match for this grid','warning');
                				if(weekDate != undefined && weekDate != ''){  
                					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
                				}else{
                					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+widgetService.tabChangeUserids+'&intervalType='+interType);                					
                				}
                			}else{
                				if(weekDate != undefined && weekDate != ''){ 
                					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
                				}else{
                					$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&userIds='+widgetService.tabChangeUserids+'&intervalType='+interType);                					
                				}
                			}
                		}).error(function(err){
							$scope.showLoader = false;
							$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
						});
            		}else if(hierarchy=="dir"){
            			if(searchedUserId!=undefined)
	            			$scope.checkUsers=searchedUserId.split(",");
                    	else
                    		$scope.checkUsers = widgetService.tabChangeUserids.split(',');
            			widgetService.dirMgrListSearch($scope.checkUsers,"Director").success(function(data){
    		        		if(data.data.length==0){
    		        			widgetService.dirMgrListSearch($scope.checkUsers,"DE-Manager").success(function(data){
    		        				if(data.data.length!=0){
    		        					type="manager";
    		        					if(weekDate != undefined && weekDate != ''){ 
    		        							$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
    		        						}else{
        		        						$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&intervalType='+interType);
    		        						}
    		        					}else{
    		        						$scope.addAlert('The userid searched does not match for this tab','warning');
    		        						if(weekDate != undefined && weekDate != ''){ 
    		        							$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
    		        						}else{
    	    		                			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&intervalType='+interType);	
    		        						}
    		        				}
    				        	}).error(function(err){
    								$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
    							});
    		        		}else{
    		        			type="director";
    		        			if(weekDate != undefined && weekDate != ''){ 
    		        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
    		        			}else{
                        			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+type+'='+widgetService.tabChangeUserids+'&intervalType='+interType);
    		        			}
    		        			}
    		        	}).error(function(err){
    						$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
    					});
            		}else if(hierarchy=="mgrComp"){
            			if(searchedUserId!=undefined)
	            			$scope.checkUsers=searchedUserId.split(",");
                    	else
                    		$scope.checkUsers = widgetService.tabChangeUserids.split(',');
            			widgetService.dirMgrListSearch($scope.checkUsers,"DE-Manager").success(function(data){
    		        		if(data.data.length==0){
    		        			$scope.addAlert('The userid searched does not match for this grid','warning');
    		        			if(weekDate != undefined && weekDate != ''){ 
    		        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+'manager'+'='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
    		        			}else{
    		        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+'manager'+'='+widgetService.tabChangeUserids+'&intervalType='+interType);
    		        			}
    		        		}else{
    		        			if(weekDate != undefined && weekDate != ''){ 
    		        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+'manager'+'='+widgetService.tabChangeUserids+'&weekDate='+weekDate+'&intervalType='+interType);
    		        			}else{
    		        				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&'+'manager'+'='+widgetService.tabChangeUserids+'&intervalType='+interType);
    		        			}
    		        		}
    		        	}).error(function(err){
    						$scope.addAlert('Application error Occurred. Please contact application administrator','warning');
    					});
            			
            		}else if(hierarchy=="pin"){
            			if(weekDate != undefined && weekDate != ''){ 
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            			}else{
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);
            			}
            		}else if(hierarchy=="comp"){
            			if(weekDate != undefined && weekDate != ''){ 
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&weekDate='+weekDate+'&intervalType='+interType);
            			}else{
            				$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+isPrimary+'&hierarchy='+hierarchy+'&viewId='+widgetService.selectedViewId+'&intervalType='+interType);
            			}
            		}	
        		}
        		
    		}
    		}
    	}
    	//----------------------------------------------------------------
    	
    	//Metric definition link code
    	$scope.metricDef = function(){
    	  $scope.navigateTo('metricDefination');
    	}
    	//-----------------------------------------------
    	
    	$scope.linkedButton = function(){
    		if($location.search()['primary'] == 'N' && $location.search()['viewId'].toString().split(',').length > 1){
    			return true;
    		}
    		if($scope.linkedWidget == true && $scope.linkedView == true){
    			return false;
    		}else{
    			return true;
    		}
    	}
    	
     
    	 $scope.moreDropdownMouseOver = function(event) { 		
    	   $("#gridOptionsOverOrg .ui-grid-viewport, #gridOptionsOver .ui-grid-viewport, #gridOptionsPin .ui-grid-viewport, #gridOptionsOverDir .ui-grid-viewport, #gridOptionsOverOrg .ui-grid-viewport, #gridOptionsSub .ui-grid-viewport, #gridOptionsPin .ui-grid-viewport, #gridOptionsSubDir .ui-grid-viewport").on("scroll",function() {
    	     if($(".toggleAdded a[aria-expanded=true]").length > 0){
                $(event.currentTarget).trigger('click');
              //  $("#gridOptionsOverOrg .ui-grid-viewport, #gridOptionsOver .ui-grid-viewport, #gridOptionsPin .ui-grid-viewport, #gridOptionsOverDir .ui-grid-viewport, #gridOptionsOverOrg .ui-grid-viewport, #gridOptionsSub .ui-grid-viewport, #gridOptionsPin .ui-grid-viewport, #gridOptionsSubDir .ui-grid-viewport").off("scroll");
    	     }else return;
            });
    		/* $('.moreDropdown').on('mouseover',function(){
    			 
    				var dropdownOffsetLeft = (($(this).find("#hoverouterdiv").position().left)) + ($(this).find("#hoverouterdiv ul").width());
    				var viewportWidth = $('.ui-grid-render-container-body .ui-grid-header + .ui-grid-viewport').width();
    			
    				if(dropdownOffsetLeft > viewportWidth){
	    				$(this).find("ul.dropdown-menu").addClass("dropdownRight");
    				}
    				var dropdownOffsetTop = (($(this).find("#hoverouterdiv").position().top)) + ($(this).find("#hoverouterdiv ul").height());
    				var viewportHeight = $('.ui-grid-render-container-body .ui-grid-header + .ui-grid-viewport').height();
    			
    				if(dropdownOffsetTop > viewportHeight){
	    				$(this).find("ul.dropdown-menu").addClass("dropdownTop");
    				}
    			});
    			$('.moreDropdown').on('mouseout',function(){
    				$(this).find("ul.dropdown-menu").removeClass("dropdownTop dropdownRight");
    			})*/
    	    };
    	   /* $scope.toggled = function(open) {
    	      if (open) {
    	          console.log('is open');
    	      } else console.log('close');
    	  }*/
    	   /* $('body').on("click","toggleAdded dropdown",function(){
    	      console.log("click");
    	    })*/
    	  /* $("#gridOptionsOverOrg .ui-grid-viewport").on("mousedown scroll",function() {
              if($(".toggleAdded a[aria-expanded=true]").length > 0){
                $(".toggleAdded a[aria-expanded=true]").parent().append($("body > .dropdown-menu"));
                $("body").trigger('click');
              }else return;
            });
    	   $("body").one("click",function(){});*/
    	   /* $("#gridOptionsOverOrg .ui-grid-viewport").on("scroll",function() {
    	      if($(".toggleAdded a[aria-expanded=true]").length > 0){
    	        $("body").trigger('click');
    	      }else return;
    	      $(".toggleAdded a[aria-expanded=true]").parent().append($("body > .dropdown-menu"));
    	      
    	    });
    	    $("body").one("click",function(){
    	      $(".toggleAdded a[aria-expanded=true]").parent().append($("body > .dropdown-menu"));
    	    });*/
    	    
    	    /* gridWidthCalc - fix for grid distortion issue - header and  metric data cell alignment issue  - adhuliaw*/ 
    	    
    	   
    	    var calcWidth = function(){
    	      var headerObj = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell');
              var headerObjLength = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell').length;
              var metricDataCellObj = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-cell');
              
              for(var i=0; i< headerObjLength; i++){
                  if(metricDataCellObj.length > 0){
                    if(headerObj[i].clientWidth > metricDataCellObj[i].clientWidth){
                          var headerObjWidth = headerObj[i].clientWidth -1;
                        headerObj[i].style.maxWidth = headerObjWidth + "px";
                        headerObj[i].style.minWidth = headerObjWidth + "px";
                         
                    }
                  }
         };
    	    }
    	    
    	    
    	    
    	    $scope.gridWidthCalc = function(){
    	      $(".ui-grid-render-container-body .ui-grid-viewport").on("scroll",function(){
    	       /* $.each($(".ui-grid-category"),function(){
                  if($(this).find(".categoryheadercell").length == 1){
                    $(this).find(".ui-grid-categoryheader").addClass("ellipsis");
                    $timeout(function(){calcWidth();},500);
                  }
                });*/
    	        $timeout(function(){calcWidth();},500);
                });
    	      
    	      setTimeout(function(){
    	        calcWidth();
    	        
    	       
    	        
    	     },200);
    	    	 
			
    	    };
    	    
    	    $scope.gridHeaderCellWidthCalc = function() {
    	     
    	    	 var headerObj = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell');
    			 var headerObjLength = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-header-cell.ui-grid-clearfix.categoryheadercell').length;
    			 var metricDataCellObj = $('[ng-controller="widgetReportCtrl"] .ui-grid-render-container-body .ui-grid-cell');
    	    	
				   for(var i=0; i< headerObjLength; i++){
					 
					 if(headerObj[i].clientWidth > metricDataCellObj[i].clientWidth || headerObj[i].clientWidth < metricDataCellObj[i].clientWidth){
						   var metricDataCellObjWidth = metricDataCellObj[i].clientWidth ;
						   
						   headerObj[i].style.maxWidth = metricDataCellObjWidth + "px";
						  
						   headerObj[i].style.minWidth = metricDataCellObjWidth + "px";
						    
					 }
                 }
				
    	    }
    	    
    	    
    	    $scope.milestoneDates = {};
    	    $scope.intervalType = {'data':['Weekly','Monthly','Quarterly','Yearly']};
    	    if($location.search()['intervalType'] == undefined){
    	    	$scope.intervalType.selected = 'Week';
    	    }else{
    	    	$scope.intervalType.selected = $location.search()['intervalType'];
    	    }
    	    $scope.milestoneDates.data = [];
    	    $scope.milestoneDates.data.selected = {};
    	    $scope.getGridCall = function(date){
    	    	if($location.search()["weekDate"]!=undefined){
    	    		$route.updateParams({"weekDate":date.date});
    	    	}
    	    	var dateChangedUrl = '.'+$location.url().split('.')[1]+'&weekDate='+date.date;
    	    	if($location.search()["weekDate"]==undefined){
    	    		$scope.navigateTo('widgetReport',false,dateChangedUrl,true);
    	    	}    			

    	    	var tabName = $location.search()["primary"] + $location.search()["hierarchy"]; 
    	    	$scope.$broadcast ('gridEventCall',{date: date, tabName: tabName});
    	    }
    	    $scope.$on('weekDateAssign', function(e,data) {  
    	      setTimeout(function(){$scope.milestoneDates.data.selected = {date: data};},500);
    	    });
    	    $scope.$on('intervalTypeAssign', function(e,data) {  
    	    	switch (data) {
			    case 'weekly':
			    	$scope.intervalOptions = "Select Weekend Date";
			        break;
			    case 'monthly':
			    	$scope.intervalOptions = "Select Month";
			        break;
			    case 'quarterly':
			    	$scope.intervalOptions = "Select Quarter";
			        break;
			    case 'yearly':
			    	$scope.intervalOptions = "Select Year";
			        break;
			    default : 
			    	$scope.intervalOptions = "Select Weekend Date";
			    	break;
			}
      	      setTimeout(function(){$scope.intervalType.data.selected = data.charAt(0).toUpperCase()+ data.slice(1);},500);
      	    });

            widgetService.getIntervalSelectedValues($scope.intervalType.selected).success(function(result) {
            	if(result.data.length > 0){
                var dataToDrop = [];
                  var datesToAdd = {};
                  for(var i=0;i<result.data.length;i++){
                      datesToAdd = {};
                      datesToAdd.date =  result.data[i];
                      dataToDrop.push(datesToAdd);
                  }
                  if($location.search()['intervalType'] == 'week' || $scope.intervalType.selected == 'Week'){
                  for(var i=0;i<dataToDrop.length;i++){
                         var parts = dataToDrop[i]['date'].split("T");
                 		 var formatDate = parts[0];
     					 dataToDrop[i]['date'] = formatDate;/*+" "+setTime[0]+" PST";*/
                  }
                  }
                $scope.milestoneDates.data = dataToDrop;
                widgetService.weekendDates = dataToDrop;
                if(($location.search()['intervalType'] != 'week' && $location.search()['intervalType'] != undefined) || $scope.intervalType.selected != 'Week' || $location.search()['weekDate'] == undefined){
                	if($location.search()['weekDate'] != undefined){
                		$scope.milestoneDates.data.selected = {'date':$location.search()['weekDate']}
                	}else{
                		$scope.milestoneDates.data.selected = dataToDrop[0];
                	}
                }else{
                
                	$scope.milestoneDates.data.selected = {'date':$location.search()['weekDate']}
                }
                  }
            });
    	    
            /*Added by Rohit C(rohichau)*/
			//Creating a multiselect dropdown here with checkboxes and search
			$scope.searchedPlaceHolder = "Search views";
			$scope.searchViews = function(){
				$('.dropdown-container')
				.on('click', '.dropdown-button', function() {
					$('.dropdown-list').toggle()
					
				})
				.on('input', '.dropdown-search', function() {
					var target = $(this)
					var search = target.val().toLowerCase()

					if (!search) {
				        $('.searchSelectContainer li').show()
				        return false
				    }

					$('.searchSelectContainer li').each(function() {
				    	var text = $(this).text().toLowerCase()
				        var match = text.indexOf(search) > -1
				        $(this).toggle(match)
				    })
				})
				
				var allviews = $scope.viewDataForOverall

				//<li> template
				var stateTemplate = _.template(
					'<li>' +
					'<label class="posRel radCheckLabel" ng-click="searchedViews($event)">'+ 
					'<input type="checkbox"/>'+
					'<span  class="searchedViewspan" style="margin-top: 3px;margin-left: 8px;color:<%= color%>" for="<%= abbreviation %>"><%= capName %></span></label>'+
					'</li>'
				)
				var strTemp = "";
				//Populate list with View Names
				_.each(allviews, function(s) {
				s.capName = s.name
				strTemp +=stateTemplate(s);
				})
				$compile(
				$('.searchSelectContainer ul').append(strTemp)
				)($scope)
			}
			$scope.noClick = true;
			$scope.noClear = true;
			$scope.noDefault = true;
			
			//function to set status of view names which are checked
			$scope.searchedViews = function(event){
				//code below captures the target element clicked and changes status of checked or unchecked accordingly
				var noViewSelected = 0;
				var element = event.target  || event.srcElement;
				var noApplyCount = 0;
				if(element.tagName == 'LABEL'){
					element = element.childNodes[1];
				}
				if(element.tagName == 'INPUT'){
					return;
				}
				
				var viewSearched = element.innerHTML;
				for(var i=0; i< $scope.viewDataForOverall.length;i++){
					if(viewSearched == $scope.viewDataForOverall[i].name){
						$scope.viewDataForOverall[i].status = !$scope.viewDataForOverall[i].status;
					}
				}
				$scope.searchedViewsSelected = [];
				for(var i=0; i< $scope.viewDataForOverall.length;i++){
					if($scope.viewDataForOverall[i].status == true){
						$scope.noClick = false;
						$scope.noClear = false;
						$scope.searchedViewsSelected.push($scope.viewDataForOverall[i].viewId);
					}else{
						noViewSelected++;
					}
				}
				if(noViewSelected == $scope.viewDataForOverall.length){
					$scope.noClick = true;
					$scope.noClear = true;
					$scope.noDefault = true;
				}
			}
			
			//function to clear all searches and bring back original view present on the page
			$scope.clearSearch = function(){
				// uncheck all the selected views
				$.each($(".searchSelectContainer input[type=checkbox]"),function(i,j){
					$(j).prop('checked',false);
				});
				var selectedViewsCount = 0;
				for(var i=0; i< $scope.viewDataForOverall.length;i++){
					if($scope.viewDataForOverall[i].status == true){
						$scope.viewDataForOverall[i].status = false;
					}else{
						selectedViewsCount++;
					}
				}
				$scope.noClear = true;
				$scope.searchedPlaceHolder = 'No View Selected';
			}
			
			//function to select all the views present in dropdown
			$scope.selectAllViews = function(){
				for(var i=0; i< $scope.viewDataForOverall.length;i++){
					$scope.viewDataForOverall[i].status = true;
						$scope.searchedViewsSelected.push($scope.viewDataForOverall[i].viewId);
				}
				$.each($(".searchSelectContainer input[type=checkbox]"),function(i,j){
					$(j).prop('checked',true);
				});
				$scope.searchedPlaceHolder = 'All Views Selected';
			}
			//This function adds the searched views to the URL for bookmarking
			$scope.addViewsToUrl = function(){
				searchApplied = true;
				var idStringToUrl = $scope.searchedViewsSelected.toString();
				$location.search('viewId',idStringToUrl)
			}
			
			//This function calls to service which will bring results for the searched views
			$scope.getDataForSearch = function(){
			}
			
			$scope.resetDefault = function(){
				//clear the search preferences
				$location.search('viewId', $scope.selectedWidget.ViewID);
			}
			
			$(document).on('click', function(event) {
				  if (!$(event.target).closest('.dropdown-container').length) {
					  $('.dropdown-list').css('display','none');
				  }
				});
			
			/*code to change the interval*/
			$scope.changeInterval = function(intervalType){
				switch (intervalType) {
			    case 'Weekly':
			    	intervalType = "week";
			        break;
			    case 'Monthly':
			    	intervalType = "month";
			        break;
			    case 'Quarterly':
			    	intervalType = "quarter";
			        break;
			    case 'Yearly':
			    	intervalType = "year";
			        break;
			}
				var intervalAddedInUrl = '';
				var weekDateRemoved = '';
				var intervalRemoved = '';
			//	if(intervalType != 'week'){
					weekDateRemoved = removeParam('weekDate',$location.url());
				/*}else{
					weekDateRemoved = $location.url();
				}*/
				
				if($location.search()['intervalType'] != undefined){
					intervalRemoved = removeParam('intervalType',weekDateRemoved);
				}else{
					intervalRemoved = weekDateRemoved;
				}
				intervalAddedInUrl = '.'+intervalRemoved.split('.')[1]+'&intervalType='+intervalType;
				$scope.navigateTo('widgetReport',false,intervalAddedInUrl);	
			}
			
			function removeParam(key, sourceURL) {
			    var rtn = sourceURL.split("?")[0],
			        param,
			        params_arr = [],
			        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
			    if (queryString !== "") {
			        params_arr = queryString.split("&");
			        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
			            param = params_arr[i].split("=")[0];
			            if (param === key) {
			                params_arr.splice(i, 1);
			            }
			        }
			        rtn = rtn + "?" + params_arr.join("&");
			    }
			    return rtn;
			}
            
   }]);


});