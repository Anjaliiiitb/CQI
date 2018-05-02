/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
		app.controller("widgetQueryInfoCtrl", ['$uibModalInstance', 'items' ,'$scope','uiGridConstants','globalService','widgetService','$interval', '$location', 
		                                       function($uibModalInstance, items,$scope,uiGridConstants,globalService,widgetService,$interval, $location) {
			  
		   
			 $scope.queryInfoGrid="" 
			 $scope.queryInfoGrid = {
	                 enableRowSelection: true,
	                 enableRowHeaderSelection: false,
	                enableSorting: true,
	                enableColumnMenus: false,
	                 enableFiltering: false,
	                 enableHorizontalScrollbar: 0,
	                 enableVerticalScrollbar: 1,
	                 width: '100%',
	                 onRegisterApi: function(gridApi){
	                  	 $scope.msqGridApi = gridApi;
	                  	 $interval( function() {
	                           $scope.msqGridApi.core.handleWindowResize();
	                       },100);
	        		    },
	             };

	             $scope.queryInfoGrid.columnDefs = [{
	                 field: 'QueryID',
	                 displayName: 'Query ID',
	             	headerCellClass: "text-center",
	                 enableSorting: true,
	                 type:'number',
	                 width: '7%'
	             }, {
	                 field: 'QueryName',
	                 displayName: 'Query Name',
	             	headerCellClass: "text-center",
	                 enableSorting: true,
	                 width: '16%'
	             }, {
	                 field: 'QueryType',
	                 displayName: 'Query Type',
	             	headerCellClass: "text-center",
	                 enableSorting: true,
	                 enableCellEdit: false,               
	                 width: '7%'
	             }, {
	                 field: 'BacklogIndicStatus',
	                 displayName: 'Backlog Status',
	             	headerCellClass: "text-center",
	                 enableSorting: true,
	                 enableCellEdit: false,               
	                 width: '10%'
	             }, {
	                 field: 'QueryDefinition',
	                 displayName: 'Query Definition',
	                 enableSorting: true,
	             	headerCellClass: "text-center",
	                 enableCellEdit: false,
	                 width: '45%',  
	                 enableFiltering: false,

	             }, {
	                 field: 'LastRefreshDate',
	                 displayName: 'Last Refreshed On',
	             	headerCellClass: "text-center",
	                 enableSorting: true,
	                 enableCellEdit: false,
	                 enableFiltering: false,             
	                 width: '15%',
	                 cellFilter: 'dateFormatGridTZ'

	             }];
	             
	             
	             if(widgetService.selectedWidget.ViewType=="Release"){//hiding the status column for Release queries					 
					 $scope.queryInfoGrid.columnDefs[3] = { field: "BacklogIndicStatus", visible: false };
					 $scope.queryInfoGrid.columnDefs[4] = { field: "QueryDefinition", width:'55%'};
					 //$scope.gridApi.core.notifyDataChange("all") ;
				 };
	             
	             app.filter('dateFormatGridTZ', function() {
	                 return function(value) { 		                	
	                   temp = moment(value).format(globalService.dateFormatGridTZ)+" PST";                   
	              	   return  temp;}
	             });
	             
	             $scope.showLoader = true;
	             //If page is compare views, then get view id from compareViewId
	             if ($location.url().indexOf("compare") > -1 ) {
	            	 widgetService.queryInfo(widgetService.compareViewId).success(function(data){
		            	 var dataToGrid = [];
		            	 for(var i=0;i<data.data.length;i++){
		            		 if(data.data[i]['Primary'] == 'Y'){
		            			 dataToGrid.push(data.data[i]);
		            		 }		 
		            	 }		            	
		            	 $scope.queryInfoGrid.data = dataToGrid;
		  				 $scope.showLoader = false;
		  			}).error(function(err){
		  			  $scope.showLoader = false;
	                  $scope.navigateTo("errorPage");
		  			});
				 }
	             else if(widgetService.isPrimary == 'Y') {
		             widgetService.queryInfo(widgetService.selectedViewId).success(function(data){
		            	 var dataToGrid = [];
		            	 for(var i=0;i<data.data.length;i++){
		            		 if(data.data[i]['Primary'] == 'Y'){
		            			 dataToGrid.push(data.data[i]);
		            		 }		 
		            	 }
		            	
		  				$scope.queryInfoGrid.data = dataToGrid;
		  				
		  				 $scope.showLoader = false;
		  			}).error(function(err){
		  			  $scope.showLoader = false;
	                  $scope.navigateTo("errorPage");
		  			});
		        } else {
	            	 widgetService.subQueryInfo($scope.queryIdForInfo).success(function(data){
	            		 var dataToGrid = [];
	            		 dataToGrid.push(data.data);
	            		            		
		  				$scope.queryInfoGrid.data = dataToGrid;
		  				 $scope.showLoader = false;
		  			}).error(function(err){
		  			  $scope.showLoader = false;
	                  $scope.navigateTo("errorPage");
		  			});
	             }
	             
	             
			  $scope.items = items;
			 

			  $scope.ok = function () {
			    $uibModalInstance.close($scope.selected.item);
			  };

			  $scope.cancel = function () {
			    $uibModalInstance.dismiss('cancel');
			  };
			 
			         
		}]);
		
});

