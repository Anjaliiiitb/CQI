/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
		app.controller("widgetComponentPopupCtrl", ['$uibModalInstance', 'items','globalService','$scope','widgetService','$location',function($uibModalInstance, items,globalService,$scope,widgetService,$location) {
			  var $ctrl = this;
			  
			  $scope.type = 'PRODUCT';
			  $scope.detailsType = [{name:'PRODUCT'},
			                         {name:'COMPONENT'}];
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
			  $scope.widgetComponentPopupGrid = {

			            enableSorting: true,
			            enableHorizontalScrollbar: 0,
			            enableVerticalScrollbar: 1,
			            enableFiltering: false,
			            onRegisterApi: function(gridApi) {
			                $scope.gridApia = gridApi;
			            },
			        };
			  var intervaltype = '';
			  if($location.search()['intervalType'] != undefined && $location.search()['intervalType'] != 'week'){
				  intervaltype = $location.search()['intervalType'];
			  }else{
				  intervaltype = 'week';
			  }
			        $scope.widgetComponentPopupGrid.columnDefs = [{
			            field: 'Product',
			            displayName: 'Name',
			            enableSorting: true,
			        }
			       
			        ];
			        
			        $scope.arraytoGrid = function(colName, arr) {
			        	  var out = [];
			        	  arr.forEach(function(entry){
			        	    var obj = {};
			        	    obj[colName] = entry;
			        	    out.push(obj);
			        	  });
			        	  $scope.widgetComponentPopupGrid.data = out;

							 $scope.gridApia.core.refresh();
			        	};
			        
			        //function to load data in grid
			        
			        $scope.loadSearch = function(){
			        	$scope.showLoader = true;
			        	if($scope.compIn != undefined){
			        		$scope.checkUsers = $scope.compIn.split(',');
				        	for(var i=0;i<$scope.checkUsers.length;i++){
				        		if($scope.checkUsers[i].length < 3){
				        			$scope.addAlert(' Enter first 3 characters of User Id to be searched','warning');
				        			$scope.showLoader = false;
				        			return;
				        		}
				        	}
			        		$scope.enteredProdComp = $scope.compIn;
			        	}else{
			        		$scope.compIn = $scope.comp;
			        		$scope.enteredProdComp = $scope.comp;
			        	}
			        	$scope.enteredProdComp =  $scope.enteredProdComp.replace(/\s*,\s*/g, ",");
			        	var templist=$scope.enteredProdComp.split(",");
			        widgetService.getProdCompList(templist,$scope.type).success(function(data){
						$scope.showLoader = false;
						$scope.arraytoGrid("Product",data.data);
						// $scope.widgetComponentPopupGrid.data = data.data;
					}).error(function(err){
						$scope.showLoader = false;
						$scope.navigateTo("errorPage");
					});
			        } 
			        $scope.loadSearch();
			        	
			        //Its a product or component
			        $scope.setData = function(name){
			        	$scope.type = name;
			        }
			        
			        //on search button after adding data in input field
			        $scope.searchComp = function(){
			        	 $scope.selectedRows = $scope.gridApia.selection.getSelectedRows();
					        if($scope.selectedRows.length < 1){
					        	$scope.addAlert('Select atleast one value from the List','warning');
					        	return;
					        }
					        var selectedArray = [];
					        angular.forEach($scope.selectedRows, function(selectedRows,selectedRowsIndex) {
					        	selectedArray.push(selectedRows.Product);								
							});
					    var selectedQueries =  [];
					   
				        var selectedIdsString = selectedArray.join();
				        //anjali search code starts
				        var charParams={}
				       // charParams["userId"]="archds";
				        charParams["userId"]=CISCO.enggit.dashboard_init.user_id;
				        charParams["searchQuery"]=$scope.type.toLowerCase()+'='+selectedIdsString;
				    
				        if(widgetService.isPrimary=='Y')
				            charParams["pageFlag"]="Widget/overall/component";
				        else
				            charParams["pageFlag"]="Widget/subView/component";
				        charParams["bebu"]=globalService.groupName;
				        widgetService.saveUserSearch(charParams).success(function(data){
					    	  // console.log("user search saved successfully in widget "+$scope.type.toLowerCase()+"--"+JSON.stringify(data));
				          if($scope.scopeWeekDate != undefined){
				            $scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+$scope.hierarchy+'&viewId='+$location.search()['viewId']+'&'+$scope.type.toLowerCase()+'='+selectedIdsString+'&intervalType='+intervaltype+'&weekDate='+$scope.scopeWeekDate);
				          }
				          /*if($location.search()["weekDate"] != undefined){
					    		$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+'&'+$scope.type.toLowerCase()+'='+selectedIdsString+'&weekDate='+$location.search()["weekDate"]);
				        	}else{
					    		$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+'&'+$scope.type.toLowerCase()+'='+selectedIdsString);
				        	}*/
				        	})
		    		//anjali search code ends
		    		//uncomment this
		    		//		$scope.navigateTo('widgetReport',false,".htm?widgetId="+widgetService.selectedWidget.WidgetID+'&primary='+widgetService.isPrimary+'&hierarchy='+$scope.hierarchy+'&viewId='+widgetService.selectedViewId+'&'+$scope.type.toLowerCase()+'='+selectedIdsString);
			        }
			        
			       

		}]);
		
});

