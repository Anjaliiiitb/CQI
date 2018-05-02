/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app) {
	app.controller("widgetPinPopupCtrl", [ '$uibModalInstance', 'items', '$scope','widgetService','$location','relViewService','$controller', function($uibModalInstance, items, $scope,widgetService,$location,relViewService,$controller) {
		var $ctrl = this;
		
		$scope.enteredPinOwnerToShare = [];
        $scope.enteredPinOwner = '';
        $scope.dataToLink = [];
        $scope.dataSendToLink = "";
	    var relScoreCtrl1ViewModel = $scope.$new(); 

		$ctrl.ok = function() {
			$uibModalInstance.close($ctrl.selected.item);
		};

		$ctrl.cancel = function() {
			$uibModalInstance.dismiss('cancel');
		};

		 //Grid definition	
		
		$scope.widgetPingrid = {

			enableSorting : true,
			enableHorizontalScrollbar : 0,
			enableVerticalScrollbar : 1,
			enableFiltering : false,
			onRegisterApi : function(gridApi) {
				$scope.gridApiA = gridApi;
			},
		};

		$scope.widgetPingrid.columnDefs = [ {
			field : 'Name',
			displayName : 'Name',
			enableSorting : true,
			enableCellEdit : false,
		}, {
			field : 'UserId',
			displayName : 'User Id',
			enableSorting : true,
			enableCellEdit : false,
		}, {
			field : 'Level',
			displayName : 'Level',
			enableSorting : true,
		}

		];
		
		  //function to load data in grid
		$scope.manipulateData = function(data){
			var newData = [];
			var objectToAdd = {};
			
			angular.forEach(data.data, function(value, key){
				if(value.length !== 0){
				angular.forEach(value, function(val, keys){
					objectToAdd = {}
					if(key.substring(0, 1) == 'L'){
					objectToAdd.Level = key.substring(0, 2);
					}else{
						objectToAdd.Level = key;
					}
					objectToAdd.LevelToSend = key;
					if(val.Userid == undefined){
						objectToAdd.UserId = "";
					}else{
		               objectToAdd.UserId = val.Userid;
					}
						objectToAdd.Name  = val.Name;
						newData.push(objectToAdd);
				});
				}
           
            });
			
			$scope.widgetPingrid.data = newData;
			
		}
		
		//on search button after adding data in input field
		$scope.loadSearch = function(){
		
			$scope.showLoader = true;
        	if($scope.compIn != undefined){
        		$scope.enteredProdComp = $scope.compIn;
        	}else{
        		$scope.compIn = $scope.pin;
        		$scope.enteredProdComp = $scope.pin;
        	}
        	$scope.enteredProdComp =  $scope.enteredProdComp.replace(/\s*,\s*/g, ",");
        	widgetService.getPinList($scope.enteredProdComp).success(function(data){
        		$scope.manipulateData(data);
			$scope.showLoader = false;
			//$scope.arraytoGrid("Product",data.data);
			// $scope.widgetComponentPopupGrid.data = data.data;
		}).error(function(err){
			$scope.showLoader = false;
			$scope.navigateTo("errorPage");
		});
		}
		
		  $scope.loadSearch();
		 
		//sending selected pinOwner to main controller(parent controller)
		$scope.searchSelectedPin = function(){
			
				$scope.selectedRows = $scope.gridApiA.selection.getSelectedRows();
		        if($scope.selectedRows.length < 1){
		        	$scope.addAlert('Select atleast one value from the List','warning');
		        	return;
		        }
		        var selectedArray = [];
		        var keyObject = {};
		        var lev ="";
		        angular.forEach($scope.selectedRows, function(value,keys) {
		        	lev = value.LevelToSend;
		        	if(keyObject[lev] == undefined){
		        	keyObject[lev] = [];
		        	}
		        	if(value.Level != "BU" && value.Level != "Segment" && value.Level != "Pin"){
		        	  keyObject[lev].push(value.UserId);
		        	}else{
		        		keyObject[lev].push(value.Name);
		        	}
		        	
		        });
			    var selectedQueries =  [];
		    	$scope.showLoader = true;
		    	
		    	
		    	//Code to form data to send in URL
		    	 if($location.url().indexOf('widgetReport')>-1){
		    		 if(widgetService.isPrimary == 'Y')
			        		var func = widgetService.getOverviewPinAfterSelect;
			        	else if(widgetService.isPrimary == 'N') {
			        		var func = widgetService.getSubviewPinAfterSelect;
			        		 if($scope.QueryID[0] != undefined){
			 			    	selectedQueries = $scope.QueryID;
			 		        }else{
			 		        	selectedQueries.push($scope.QueryID);
			 		        }
			        	}
		    	var keys = Object.keys(keyObject);
		    	dataToUrl = "&";
		    	for(var i=0;i<keys.length;i++){
		    		if(keys[i].substring(0, 1) == 'L'){
		    			dataToUrl = dataToUrl+keys[i].substring(0, 2)+"=";
		    		}else{
		    		dataToUrl = dataToUrl+keys[i]+"=";
		    		}
		    		for(var j=0;j<keyObject[keys[i]].length;j++){
		    			if(j == (keyObject[keys[i]].length-1)){
		    				if(i == (keys.length-1)){
		    					dataToUrl = dataToUrl+keyObject[keys[i]][j];
		    				}else{
		    				dataToUrl = dataToUrl+keyObject[keys[i]][j]+"&";
		    				}
		    			}else{
		    			dataToUrl = dataToUrl+keyObject[keys[i]][j]+",";
		    			}
		    		}
		    		dataToUrl = dataToUrl.replace(/ /g, "%20");
		    	}
    			$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+dataToUrl);
		    	 }else if($location.url().indexOf('releaseScorecard')>-1) {
		    		 
		    		 $scope.metricsRel = ["RG", "URC","S123 Backlog", "CFD Backlog", "Defects[S1-5]", "Feature[S6]","PSIRT - Critical","PSIRT - High","PSIRT - Medium","% RETI Adoption","Total Dev Escape [%]","Total Test Escape [TTE %]","S1 MTTR - Average Outstanding ","URC MTTR","CFD MTTR - Average Outstanding","S123 TEACAT Backlog","S12 Autons Backlog","S3 Autons Backlog",
		        		  					"SS MTTR - Average Outstanding","TS MTTR - Average Outstanding"];
		    		 widgetService.getSubviewPinAfterSelect($scope.metricsRel,keyObject,parseInt(relViewService.viewId),'Release',$scope.QueryID,'N').success(function(data) {
		    			 $uibModalInstance.dismiss('cancel');
		    			 $scope.showLoader = false;
		    			 if(data.data.length ==0 ){
		    				 $scope.addAlert('No data found', 'warning');
		    				  $scope.alternateViewGrid.data = [];
							  $scope.alternateViewGrid.length = 0;
							$scope.alternateViewGridApi.core.refresh();
							$scpoe.queryIds = $scope.QueryID;
		    			 }else{
		    				 $controller('releaseScorecardCtrl',{$scope : relScoreCtrl1ViewModel});
		    				 relScoreCtrl1ViewModel.alternateView();
		    				 /*relViewService.loadAlternateViewdata(relViewService.viewId,$scope.metricsRel,"").success(function(response) {
									//console.log("Alternate : " + JSON.stringify(response));
									$scope.resp = response.data;			
									if(response.data.length == 0) {
										  $scope.showLoader = false;
										  $scope.alternateViewGrid = [];
										  $scope.alternateViewGrid.length = 0;
									      $scope.addAlert('No data found', 'warning');
							          }else{
							        	  var keys = Object.keys(response.data[0]);
							        	  $scope.getColumn($scope.resp);
								}
									
								});*/
		    			 }
		    				
		    		 });
    			}
				}

	}]);

});
