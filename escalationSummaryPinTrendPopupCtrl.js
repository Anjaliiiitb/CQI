define(['app'], function(app ) {

	app.controller("escalationSummaryPinTrendPopupCtrl", [ '$scope', '$location',  '$rootScope','$uibModal','$interval','$uibModalInstance','executiveViewService',
		function( $scope,$location, $rootScope ,$uibModal,$interval,$uibModalInstance,executiveViewService ) {
		 var incomingTrendData = [];
			var outgoingTrendData = [];
			var closedTrendData = [];
			var yearQuarterTrendData = [];
		var callTrendService = function(){
			var request = {};
			  if($location.search().BU != undefined){
			    	request.BU = $scope.buBeInTrend;
			    	request.Segment = $scope.segBseInTrend;
			    	request.Pin = $scope.pinPfInTrend;
			    }
			    
			    if($location.search().BE != undefined){
			    	request.BE = $scope.buBeInTrend;
			    	request.BSE = $scope.segBseInTrend;
			    	request.PF = $scope.pinPfInTrend;
			    }
			    request.EscType = $scope.escType;
			    request.TrendType = $scope.trendType;
			    /*if($location.search().Segment != undefined){
			    	request.Segment = $location.search().Segment;
			    }
			    if($location.search().Pin != undefined){
			    	request.Pin = $location.search().Pin;
			    }
			    if($location.search().BSE != undefined){
			    	request.BSE = $location.search().BSE;
			    }
			    if($location.search().PF != undefined){
			    	request.PF = $location.search().PF;
			    }*/
			   $scope.showLoader = true;
			    executiveViewService.getEscalationSummaryTrendForPopup(request).success(function(data){
			    	 $scope.showLoader = false;
			    	 if(data.data.length > 0){
    			    	for(var i=0;i<data.data[0].trend.length;i++){
    			    		incomingTrendData.push(data.data[0].trend[i].incoming_cnt)
    			    		outgoingTrendData.push(data.data[0].trend[i].outstanding_cnt)
    			    		closedTrendData.push(data.data[0].trend[i].closed_cnt)
    			    		yearQuarterTrendData.push(data.data[0].trend[i].yearMonth)
    			    	}
			    	 }else{
			    	   incomingTrendData= [];
                       outgoingTrendData=[];
                       closedTrendData=[];
                       yearQuarterTrendData=[];
			    	 }
			    	 $scope.plotGraph();
			    })
		}
		
		callTrendService();
		
		$scope.plotGraph= function() {
	          //Horizontal
			var chart =
			Highcharts.chart('trendContainer', {
			   /* chart: {
			        type: 'line'
			    },*/
			    title: '',
			    subtitle: {
			    	enabled: false
			    },
			    xAxis: {
			        categories: yearQuarterTrendData,
			        labels: {
			            style:{
			            	cursor:'pointer',
			            	color:'blue'
			            }
			           
			        }
			    },
			    yAxis: {
			        min: 0,
			        title: {
			           enabled:false
			        }
			    },
			    credits:{
			    	enabled:false
			    },
			 /*   plotOptions: {
			            dataLabels: {
			                enabled: true,
			                color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
			                format: '{y}',
			                style: {
			                	fontSize: 8,
			                }
			        },
			        series: {
			               pointWidth: yearQuarterTrendData.length> 7 ? 20 : 30
			           }
			    },*/
			    series: [{
			        name: 'Incoming',
			        data: incomingTrendData,
			        "color" : "#cf2030",
			        type: "column",

			    }, {
			        name: 'Closed',
			        data: closedTrendData,
			        "color" : "#6cc04a",
			        type: "column",

			    }, {
			        name: 'Outstanding',
			        data: outgoingTrendData,
			        "color" : "#00CCFF",
			        type: "line",

			    }],
			    
			});
		
			};
        //Horizontal
/*		$scope.plotGraph= function() {
	          //Horizontal
			Highcharts.chart('trendContainer', {
			    title: {
			        text: ''
			    },
			    xAxis: {
			        categories: yearQuarterTrendData
			    },
			    legend: {
			    	enabled: false
			    },
			    plotOptions: {
			        series: {
			               pointWidth: yearQuarterTrendData.length > 10 ? 15 : 20
			           }
			    },
			    credits:{
			    	enabled:false
			    },
			    tooltip:{
			    	shared: true,
			    	enabled:false
			    },
			    series: [{
			        data: catagoriesSWHWCount,
			        color:'#049fd9',
			        dataLabels: {
			            enabled: true,
			            color: '#FFFFFF',
			            align:'right',
			          formatter: function() {
					                return '<div><span>' +this.y+'</span></div>';
					            },
			            
			            y: 0,
			            style: {
			                fontSize: '10px',
			                fontFamily: 'Verdana, sans-serif'
			            }
			        } 
			    }]
			});
			};*/
			$scope.cancel = function(){
				$uibModalInstance.dismiss('cancel');
			}
			
		}]);
	});


