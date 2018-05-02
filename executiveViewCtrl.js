define(['app'/*, 'angular-wysiwyg', 'adf', 'chart'*/], function(app ) {
	  
	 app.controller("executiveViewCtrl", [ '$scope', '$location','relViewService','executiveViewService',   '$rootScope','globalService', '$timeout',
		                                      function(     $scope,$location,relViewService,executiveViewService,  $rootScope ,globalService ,$timeout) {
		 $scope.hideShowWidgetFlag("visible");
		 $scope.model = {};
		 $scope.executiveEdit = false;
		 if(globalService.userType == "Admin"){
			 $scope.executiveEdit = true;
		 }
		 if($location.search().BU != undefined){
			$scope.beOrBu = $location.search().BU;
		}else if($location.search().BE != undefined){
			$scope.beOrBu =  $location.search().BE
		}
		 executiveViewService.getExecPages().success(function(response) {
		  $scope.hasAccessToPage = true;
			//Model contains the widget details for each app.
     		$scope.appPageId = response.data[0].appPageId;
            $scope.collapsible = false;
            $scope.maximizable = false;
            $scope.categories = false;
	        		executiveViewService.getWidgetId($scope.beOrBu,globalService.beBUType).success(function(res) {
	        				$scope.model = removeAllEmptyArray(res.data.defaultView);
	        		}).error(function(err) {
	        			$scope.navigateTo("errorPage");
	        		});
		}).error(function(err) {
			$scope.navigateTo("errorPage");
		});

		// To call parent function addAlert 
	        // Call on child using $scope.emit('addAlert',{Message: "Message Successfully",Type: 'info'});
	        $scope.$on('navigateTo', function (event, data) {
	           $scope.navigateTo(data.value,data.boolV,data.data,data.boolVD);
	        });
		 
		// To call parent function addAlert 
		// Call on child using $scope.emit('addAlert',{Message: "Message Successfully",Type: 'info'});
		$scope.$on('addAlert', function (event, data) {
		   $scope.addAlert(data.Message,data.Type);
		});
		//To call parent loader showLoader
		//Call on child controller $scope.$emit('showLoader', false);
		$scope.$on('showLoader',function(event,data){
		  // $scope.showLoader = data;
		  $scope.showLoaderFun(data);
		});
		    
       /* layoutFactory.query({
       	 	appPageId: $stateParams.appPageId
        }).$promise.then(
            function (response) {

                if (!angular.equals(response, {})) { // User has access to the Dashboard
                    $scope.hasAccessToPage = true;
                    $scope.model = removeAllEmptyArray(response.defaultView);
                    //Model contains the widget details for each app.
                    $rootScope.ProgramManagerFlag = response.isProductManager;

                    $scope.appPageId = response.appPageId;
                    // Escalation count logic will be calculated based on number of escalated widgets for that page.
                    $scope.model.escalationCount = " " + Math.floor((Math.random() * 10) + 1);;

                    $scope.name = name;
                    $scope.collapsible = false;
                    $scope.maximizable = false;
                    $scope.categories = false;
                }
            },
            function (response) {
                if (response.status == 404) {
                    $scope.errorStatus = response.status + " Not Found";
                } else if (response.status == 401) {
                    $scope.errorStatus = response.status + " Access Denied";
                }
                $scope.errorMessage = response.data;
                $scope.hasAccessToPage = false;

            }
            );*/
        function removeAllEmptyArray(JsonObj) {
            $.each(JsonObj, function (key, value) {
                if (value.length == 0) {
                    delete JsonObj[key];
                } else if (typeof (value) === "object") {
                    JsonObj[key] = removeAllEmptyArray(value);
                }
            });
            return JsonObj;
        }
        $scope.$on('adfDashboardChanged', function (event, name, model) {
            //@bamittal 
            //Iterate over the model and get the rows. Create an row model object with just widget published Ids and update default view for now

            var defaultView = angular.copy(model); //deep copy
            $.each(defaultView.rows, function (key, row) { //rows
                $.each(row.columns, function (key, column) {//columns
                    if (column.widgets && column.widgets.length > 0) { //widgets
                        var widgetArr = [];
                        $.each(column.widgets, function (key, widget) {
                            widgetArr.push(widget.publishedWidgetId);
                        });
                        column.widgets = widgetArr;
                        delete column['cid'];
                    }
                    if (column.rows && column.rows.length > 0) {//rows
                        $.each(column.rows, function (key, row) {
                            $.each(row.columns, function (key, column) {//row-column-widget
                                if (column.widgets && column.widgets.length > 0) {
                                    var widgetArr = [];
                                    $.each(column.widgets, function (key, widget) {
                                        widgetArr.push(widget.publishedWidgetId);
                                    });
                                    column.widgets = widgetArr;
                                    delete column['cid'];
                                }
                            });
                        });
                    }
                    delete column['cid'];
                });

            });
            
        })

		 
	 
		 
		 
	 }]);
	
});

 
