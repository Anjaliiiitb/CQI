define(['app'], function(app) {


    //var returnUserPref = function($scope, userPreferencesService, $http, uiGridConstants) {

	app.controller("escalationSRDetailsCtrl", [ '$scope', '$location','executiveViewService', '$rootScope','globalService','$uibModal','$interval',
	                                  		function( $scope,$location,executiveViewService, $rootScope ,globalService,$uibModal,$interval ) {
 	
    	$scope.hideShowWidgetFlag("visible");
    	$scope.escType=$location.search().Type;
    	 $scope.srDetailsGrid = {
                 enableRowSelection: true,
                 enableRowHeaderSelection: false,
                enableSorting: true,
                enableColumnMenus: false,
                 enableFiltering: false,
                 enableHorizontalScrollbar: 0,
                 enableVerticalScrollbar: 0,
                 width: '100%',
                 onRegisterApi: function(gridApi){
                  	 $scope.msqGridApi = gridApi;
                  	 $interval( function() {
                           $scope.msqGridApi.core.handleWindowResize();
                       },100);
        		    },
             };

             $scope.srDetailsGrid.columnDefs = [{
                 field: 'CaseNumber',
                 displayName: $scope.escType+ ' Case',
             	headerCellClass: "text-center",
             	cellTemplate:'<div class="ui-grid-cell-contents">{{row.entity.caseNumber}}</div>',
                 width: '8%'
                 


             }, {
                 field: 'sr_number',
                 displayName: 'SR',
             	headerCellClass: "text-center",
                  enableCellEdit: false,               
                 width: '8%'
                

             }, {
                 field: 'sr_age',
                 displayName: 'Age',
                headerCellClass: "text-center",
                 enableCellEdit: false,
                 width: '5%',  
              }, {
                 field: 'created_date',
                 displayName: 'Created Date',
             	headerCellClass: "text-center",
             	//cellTemplate:'<div class="ui-grid-cell-contents">{{grid.appScope.formatDate(row.entity.created_date)}}</div>',
                  width: '8%',
                  cellFilter: 'dateFormatGrid'

             },{
                 field: 'closed_date',
                 displayName: 'Closed Date',
                headerCellClass: "text-center",
                 width: '8%',
                //cellTemplate:'<div class="ui-grid-cell-contents">{{grid.appScope.formatDate(row.entity.closed_date)}}</div>',
                cellFilter: 'dateFormatGrid'
             },
             {
                 field: 'status',
                 displayName: 'Status',
                headerCellClass: "text-center",
                width: '9%',
             },
             {
                 field: 'sr_defect',
                 displayName: 'SR Defect',
                 headerCellClass: "text-center",
                 width: '10%',
				 cellTemplate:'<div class="ui-grid-cell-contents trendChartScrubberLink "><span ng-click=grid.appScope.openCDETSLink(row.entity.sr_defect)>{{row.entity.sr_defect}}</span></div>',

             },
             {
                 field: 'sr_contract',
                 displayName: 'SR Contract',
               headerCellClass: "text-center",
                 width: '8%',
              },
             {
                 field: 'sw_product',
                 displayName: 'SW Product',
               headerCellClass: "text-center",
                 width: '12%',
              },
             {
                 field: 'hw_product',
                 displayName: 'HW Product',
               headerCellClass: "text-center",
                 width: '10%',
             },
             {
                 field: 'sr_customer',
                 displayName: 'SR Customer',
               headerCellClass: "text-center",
                  width: '15%',
             }];

             $scope.openCDETSLink = function(defectId){
 				var path="http://cdetsweb-prd.cisco.com/apps/dumpcr?identifier="+defectId;
 				window.open(path, '_blank');			
 			};
             $scope.showLoader = true;
             var req = {};
            
             req.EscType = $location.search().Type;
             req.CaseNumber = $location.search().Case;
             localStorage.setItem("type",  $location.search().Type);
				localStorage.setItem("Case", $location.search().Case);
             executiveViewService.getSRDetails(req).success(function(data){
            	 if(data.status == "error"){
            		 $scope.showLoader = false;
            		 $scope.addAlert(CISCO.enggit.dashboard_init.applicationErrorMsg, "danger");
            	 }else if(data.data.length == 0){
            		 $scope.showLoader = false;
            		 $scope.addAlert("No Data Found", "warning");
            	 }else{
            		 $scope.caseNumber = data.data.CaseNumber;
                 	var finalGrid = [];
                 	for(var i=0;i< data.data.Data.length;i++){
                 		 
                     	 if(i==0)
                     		data.data.Data[i].caseNumber = $scope.caseNumber;
                     	 else
                     		data.data.Data[i].caseNumber = "";
                     	 finalGrid.push(data.data.Data[i]);
                 	 }
                 	 
                 	 $scope.srDetailsGrid.data = finalGrid;
                 	  $scope.showLoader = false;
            	 }
            	
 				
 			}).error(function(err){
 				  $scope.showLoader = false;
                  $scope.navigateTo("errorPage");
 			});
            /* $scope.formatDate = function(date){
     	    	if(date==null){
     	    		return "";
     	    	}else{
     		    	var date = date.split('T')
     		    	var date1 = new Date(date[0]);
     		    	return(date1.getMonth() + 1) + '/' + date1.getDate() + '/' +  date1.getFullYear();
     	    		
     	    	}
     	    	
     	    }*/
             $scope.goBackToSelected = function(level){
            	 var bookmark = "&Case="+$location.search().Case+"&Type="+$location.search().Type;
 		    	if(level == 'Level1'){
 		   		  if($location.search().BU != undefined)
 		   		$scope.navigateTo("escalationSRDetails",false,'.htm?&BU='+$location.search().BU+bookmark,false);
 		   		 else if($location.search().BE != undefined)
 		        		$scope.navigateTo("escalationSRDetails",false,'.htm?&BE='+$location.search().BE+bookmark,false);
 		         }
 		   	 else if(level == 'Level2'){
 		   		if($location.search().BU != undefined)
 		        		$scope.navigateTo("escalationSRDetails",false,'.htm?&BU='+$location.search().BU+'&Segment='+$location.search().Segment+bookmark,false);
 		   			 else  if($location.search().BE != undefined)
 		   				 $scope.navigateTo("escalationSRDetails",false,'.htm?&BE='+$location.search().BE+'&BSE='+$location.search().BSE+bookmark,false);
 		              
 		   	 }
 		    }
    }]);
    
});