define(['app'], function(app ) {

	app.controller("escalationSummaryCtrl", [ '$scope', '$location','executiveViewService','uiGridExporterService', 'uiGridExporterConstants','uiGridConstants', '$rootScope','globalService','$uibModal','$interval',
		function( $scope,$location,executiveViewService,uiGridExporterService,uiGridExporterConstants,uiGridConstants, $rootScope ,globalService,$uibModal,npsService,$interval) {

		  Highcharts.setOptions({
			     tooltip:{
			       shared: true,
			       useHTML:true,
			       formatter : function(){
			    	   var s = '<span>'
							+ this.x + '<span><br>';
			    		$
						.each(
								this.points,
								function(i, point) {
									
									if (point.series.name == point.series.name)
										var spanStyle = 'color:'+point.series.color;+' font-weight:bold;';
								s += ('<span style="'
											+ spanStyle
											+ '">'
											+ point.series.name
											+ ' : '
											+ 
													point.y + '<span><br>');
								});
			    		
			    		
			    		return s
			       }
			     }
			   });
		  $scope.cap=false;
		  $scope.bems=false;
		  $scope.rrr=false;
		  $scope.capPrimary=false;
		  $scope.trendGraph=false;
			 var incomingTrendData = [];
				var outgoingTrendData = [];
				var closedTrendData = [];
				var yearQuarterTrendData = [];
		  $scope.tooltip = {
		            "backgroundColor" : "#e5e5e5",
		            "crosshairs" : [ {
		                "color" : "grey",
		                "dashStyle" : "shortdot",
		                "width" : 1.5
		            }, false, true ],
		            "shared" : true,
		            "valueSuffix" : "Bugs",
		            "width" : "100%",
		                    formatter : function() {
		                        var s = '<span style="color:backlogack; font-weight:bold;">'+ this.x + '<span><br>';
		                $.each(this.points,function(i, point) {
		                                    if (point.series.name == "Incoming")
		                                        spanStyle = 'color:#cf2030; font-weight:bold;';
		                                    else if (point.series.name == "Closed")
		                                        spanStyle = 'color:#83c341; font-weight:bold;';
		                                    else if (point.series.name == "Outstanding")
		                                        spanStyle = 'color:#00CCFF; font-weight:bold;';
		                                    
		                                if(typeof spanStyle != 'undefined')
		                                  s += ('<span style="'+ spanStyle+ '">'+ point.series.name+ ' : '+ point.y + '<span><br>');
		                                });
		                    return s;
		                                        }
		  };
		  $scope.ifCSG = false;
		/*  if($location.search()["BU"] == "CSG"){
			  $scope.ifCSG = true;
		  }*/
		  $scope.check = '1des';
		var graphHorizontalCatagories = [];
		var incoming = [];
		var closed = [];
		var outstanding = [];
		var gridData = [];
		var modifiedGridData = [];
		$scope.noGraphs = false;
		$scope.noDataGrid = false;
		$scope.firstBlockChartData = [];
		$scope.noGraphsNoGridData = false;
		$scope.trendType = $location.search().TrendType;
		$scope.CurrentMQFlag=$location.search().month=='current'?'Y':'N';
		//console.log("currentMQFlag is"+$scope.CurrentMQFlag)
		   if($location.url().indexOf('capPrimaryMetrics')>-1){
			   //console.log("in cap primary")
				if($location.url().indexOf('CaseType')>-1)
				{
					$scope.capCaseType=$location.search().CaseType

				}
		    	$scope.escType = "CAP Primary"
		    		$scope.selectedEscType = "CAPPrimary"
		    		
	    	 }	
		   if($location.url().indexOf('capMetrics')>-1){
			   if($location.url().indexOf('CaseType')>-1)
				{
				  
					$scope.capCaseType=$location.search().CaseType
					
				}
		    	$scope.escType = "CAP"
		    	$scope.selectedEscType = "CAP"	    		
	    	 }			    
		    if($location.url().indexOf('rrrMetrics')>-1){
		    	if($location.url().indexOf('CaseType')>-1)
				{
				 
					$scope.capCaseType=$location.search().CaseType
					
				}
		    	$scope.escType = "RRR"
		    	$scope.selectedEscType = "RRR"
	    	 }	
		    if($location.url().indexOf('bemsMetrics')>-1){
		    	if($location.url().indexOf('CaseType')>-1)
				{
				  
					$scope.capCaseType=$location.search().CaseType
					
				}
		    	$scope.escType = "BEMS"
		    		$scope.selectedEscType = "BEMS"
	    	 }	
		    $scope.escalPages=['CAP','CAP Primary','RRR','BEMS']
		    $scope.escalPage={};
		    $scope.escalPage.selected=$scope.escType;
		    //console.log("escType is"+$scope.escType)
		  /*to go back to selected BE/BU when BSE/Segment is selected*/
		    $scope.goBackToSelected = function(level){
		    	var currentPage = ''
		    		if(window.location.href.indexOf("capPrimaryMetrics") != -1){
						currentPage = 'capPrimaryMetrics';
					}
					if(window.location.href.indexOf("capMetrics") != -1){
						currentPage = 'capMetrics';
					}
					if(window.location.href.indexOf("bemsMetrics") != -1){
						currentPage = 'bemsMetrics';
					}
					if(window.location.href.indexOf("rrrMetrics") != -1){
						currentPage = 'rrrMetrics';
					}
		   	  if(level == 'Level1'){
		   		  if($location.search().BU != undefined)
		   		$scope.navigateTo(currentPage,false,'.htm?TrendType='+$scope.trendType+'&BU='+$location.search().BU,false);
		   		 else if($location.search().BE != undefined)
		        		$scope.navigateTo(currentPage,false,'.htm?TrendType='+$scope.trendType+'&BE='+$location.search().BE,false);
		         }
		   	 else if(level == 'Level2'){
		   		if($location.search().BU != undefined)
		        		$scope.navigateTo(currentPage,false,'.htm?TrendType='+$scope.trendType+'&BU='+$location.search().BU+'&Segment='+$location.search().Segment,false);
		   			 else  if($location.search().BE != undefined)
		   				 $scope.navigateTo(currentPage,false,'.htm?TrendType='+$scope.trendType+'&BE='+$location.search().BE+'&BSE='+$location.search().BSE,false);		              
		   	 }else if(level == 'Level3'){
		   		$scope.navigateTo(currentPage,false,'.htm?TrendType='+$scope.trendType+'&BU='+$location.search().BU+'&Segment='+$location.search().Segment+'&Pin='+$location.search().Pin,false);
		   			
		              
		   	 }
		    }
		    
		    /*to get interval (Month/Quarter) and date*/
		    var interval;
		    if($location.search().TrendType==undefined)
		    	{
		     interval = "Quarter";
		    $scope.intervalType = "Quarterly";
		    	}
		    else if($location.search().TrendType=="Quarterly")
		    	{
		         interval = "Quarter";
			    $scope.intervalType = "Quarterly";
		    	}
		    else if($location.search().TrendType=="Yearly")
		    	{
			         interval = "Year";
				    $scope.intervalType = "Yearly";
			    	}
		    else
		    	{
		    	$scope.intervalType = "Monthly";
	    		interval = "Month";
		    	}
		    $scope.trendDuration = [{interval:'Monthly'},{interval:'Quarterly'},{interval:'Yearly'}];
		    $scope.changeEsc = function (escType){
		 	   //console.log("called esc")
			   if(escType=='CAP')
				   $scope.openCapMetrics();
			   if(escType=='CAP Primary')
				   $scope.openCapPrimaryMetrics();
			   if(escType=='BEMS')
				   $scope.openBemsMetrics();
			   if(escType=='RRR')
				   $scope.openRrrMetrics();   	
		    }
		    var currentUrl = $location.url();
			var queryString = currentUrl.substr(currentUrl.indexOf('?')+1,currentUrl.length);
		$scope.openCapMetrics = function(){
			$scope.navigateTo('capMetrics',false,'.htm?'+queryString,false);
		}
		$scope.openCapPrimaryMetrics = function(){		
			$scope.navigateTo('capPrimaryMetrics',false,'.htm?'+queryString,false);
		}
		
		$scope.openRrrMetrics = function(){
			$scope.navigateTo('rrrMetrics',false,'.htm?'+queryString,false);
		}
		
		$scope.openBemsMetrics = function(){
			$scope.navigateTo('bemsMetrics',false,'.htm?'+queryString,false);
		}
		    
		    /*on selection of Interval*/
		    $scope.selectInterval = function(value){
		    	if(value.interval == "Monthly"){
		    		//console.log("here")
		    		$scope.intervalType = "Monthly";
		    		 interval = "Month";
		    	}else if(value.interval == "Yearly"){
		    		$scope.intervalType = "Yearly";
		    		 interval = "Year";
		    	}
		    	else{
		    		$scope.intervalType = "Quarterly";
		    		interval = "Quarter";
		    	}
		    	var req=interval+'&CurrentMQFlag='+$scope.CurrentMQFlag;
		    	
		    	
		    //	console.log("shwoing trend graph outside"+$scope.trendGraph)
		    	/*to get Dates based on interval selected*/
		    	 executiveViewService.getTrendData(req).success(function(data){
		    		
		    			$location.search("TrendType",$scope.intervalType)
		    			
		    	/*	 if($scope.CurrentMQFlag=='Y')
		    		$scope.selectedTrendDate = data.data[0];
		    	else
		    		$scope.selectedTrendDate = data.data[1];*/
		    			$scope.selectedTrendDate = data.data[0];
		    		 $scope.defaultVal = {};
		    		 
		    		 $scope.defaultVal.selected = {interval:$scope.intervalType, date:$scope.selectedTrendDate};
		    		
		    		 $scope.trendDate = data.data;
		    		 //console.log("calling data"+$scope.selectedTrendDate)
		    		 callGridData();
			    	 getGraphsCapsPinSummary();
		 		}).error(function(err){
		 				$scope.showLoader = false;
		               $scope.navigateTo("errorPage");
		 		});
		    }
		
		   $scope.selectTrend = function(selectedDate){
		    	$scope.selectedTrendDate = selectedDate;
		    	 callGridData();
		    	 getGraphsCapsPinSummary();
		    }
		 
		    var getGraphsCapsPinSummary = function(){
		    	graphHorizontalCatagories=[];
		    	incoming=[];
		    	outstanding=[];
		    	closed=[];
		    var request = 	{}
		    
		    if($location.search().BU != undefined){
		    	request.BU = $location.search().BU;
		    }
		    
		    if($location.search().BE != undefined){
		    	request.BE = $location.search().BE;
		    }
		    
		    request.TrendType =  $scope.intervalType;
		    //console.log("here in 3rd page"+$scope.escType)
		    request.EscType = $scope.escType;
		  //  console.log("date is"+$scope.selectedTrendDate);
		    request.TrendDate =  $scope.selectedTrendDate;
		   
		    if($location.search().Segment != undefined){
		    	request.Segment = $location.search().Segment;
		    }
		    if($location.search().Pin != undefined){
		    	request.Pin = $location.search().Pin;
		    }
		    if($location.search().Product != undefined){
		    	request.PF = $location.search().Product;
		    }
		    if($location.search().BSE != undefined){
		    	request.BSE = $location.search().BSE;
		    }
		    if($location.search().PF != undefined){
		    	request.PF = $location.search().PF;
		    }
		    request.CaseType=$scope.capCaseType;
		    //	console.log("request in getGraphsCapsPinSummary"+JSON.stringify(request))
			    executiveViewService.getCapsPinSummary(request).success(function(data){
			    	 for(var i=0;i<data.data.length;i++){
			    		  $scope.firstBlockChartData  = data.data;
							  graphHorizontalCatagories.push(data.data[i].item)
						  incoming.push(data.data[i].incoming_cnt);
						  closed.push(data.data[i].closed_cnt);
						  outstanding.push(data.data[i].outstanding_cnt);
				  }
			    	
			    	$scope.plotGraph();
			    })
		    }
		    Highcharts.setOptions({
			     tooltip:{
			       shared: true,
			       useHTML:true,
			       formatter : function(){
			    	   var s = '<span>'
							+ this.x + '<span><br>';
			    		$
						.each(
								this.points,
								function(i, point) {
									
									if (point.series.name == point.series.name)
										var spanStyle = 'color:'+point.series.color;+' font-weight:bold;';
								s += ('<span style="'
											+ spanStyle
											+ '">'
											+ point.series.name 
											+ ' : '
											+ 
													point.y + '<span><br>');
								});
			    		
			    		
			    		return s
			       }
			     }
			   });
		  
		    $scope.trendDataForPopup = '';
		    $scope.RefreshToAll = function()
		    {
		    	   if($location.url().indexOf('capMetrics')>-1){
				    	$scope.cap=true;
				    	$scope.trendGraph=false;
				    	// $scope.loadCAPTrendGraph(trequest);
				    		
			    	 }	
		    	   if($location.url().indexOf('capPrimaryMetrics')>-1){
				    	$scope.capPrimary=true;
				    	$scope.trendGraph=false;
				    	// $scope.loadCAPTrendGraph(trequest);
				    		
			    	 }	
				    
				    if($location.url().indexOf('rrrMetrics')>-1){
				    	$scope.rrr=true;
				    	$scope.trendGraph=false;
				    	// var RRR_request=JSON.parse(JSON.stringify(trequest))
						//	$scope.loadRRRTrendGraph(RRR_request);
			    	 }	

				    if($location.url().indexOf('bemsMetrics')>-1){
				    	$scope.bems=true;
				    	$scope.trendGraph=false;
					   // var BEMS_request=JSON.parse(JSON.stringify(trequest))
						//$scope.loadBEMSTrendGraph(BEMS_request);
			    	 }	
		    }
		    //function to refresh the graph
		    	$scope.refreshTrendGraph=function(val)
		    	{
		  		  $scope.cap=false;
				  $scope.bems=false;
				  $scope.rrr=false;
				  $scope.capPrimary=false;
		    		$scope.trendGraph=true;
		       	$scope.trendDataForPopup = val;
		    	angular.forEach($scope.firstBlockChartData, function(value, key){
		    		if(value.item == val){
		    	    	   if($location.search().BU != undefined){
		    	    		   $scope.buBeInTrend = value.BU;
				    	    	  $scope.pinPfInTrend = value.Pin;
				    	    	  $scope.segBseInTrend = value.Segment;
		    	    	   }
		    	    	   else if($location.search().BE != undefined){
		    	    		   $scope.buBeInTrend = value.BE;
				    	    	  $scope.segBseInTrend = value.BSE;
				    	    	  if(value.PF != undefined){
				    	    		  $scope.pinPfInTrend = value.PF;
				    	    	  }
				    	    	 
		    	    	   }
		    	    	  
		    	      }
		    	   });
		    	// var incomingTrendData = [];
		    	  incomingTrendData = [];
					 outgoingTrendData = [];
					 closedTrendData = [];
					 yearQuarterTrendData = [];
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
					    request.TrendType = $scope.intervalType;
					    //console.log("trend type is"+$scope.trendType)
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
					   request.CaseType=$scope.capCaseType;
					   //console.log("here in refresh graph"+$scope.trendGraph)
					    executiveViewService.getEscalationSummaryTrendForPopup(request).success(function(data){
					    	//console.log("data received"+JSON.stringify(data)+"from"+JSON.stringify(request))
					    	 $scope.showLoader = false;
					    	 if(data.data.length > 0){
		    			    	for(var i=0;i<data.data[0].trend.length;i++){
		    			    		incomingTrendData.push(data.data[0].trend[i].incoming_cnt)
		    			    		outgoingTrendData.push(data.data[0].trend[i].outstanding_cnt)
		    			    		closedTrendData.push(data.data[0].trend[i].closed_cnt)
		    			    		if(data.data[0].trend[i].yearMonth)
		    			    			yearQuarterTrendData.push(data.data[0].trend[i].yearMonth)
		    			    		else if(data.data[0].trend[i].year)
		    			    			yearQuarterTrendData.push(data.data[0].trend[i].year)
		    						else
		    							yearQuarterTrendData.push(data.data[0].trend[i].yearQtr)
		    			    		
		    			    	}
					    	 }else{
					    		 //console.log("data not found")
					    	   incomingTrendData= [];
		                       outgoingTrendData=[];
		                       closedTrendData=[];
		                       yearQuarterTrendData=[];
					    	 }
					    	 //console.log("data formed is"+yearQuarterTrendData)
					    	 $scope.plotTrendGraph();
					    })
				
		    
		    	}
		    	//plotting trend grpah
		    	
				$scope.plotTrendGraph= function() {
					//console.log("in plotting graph")
			          //Horizontal
					var chart =
					Highcharts.chart('trendContainer', {
					   /* chart: {
					        type: 'line'
					    },*/
					    chart: {height:227},
					    title: '',
					    subtitle: {
					    	enabled: false
					    },
					    xAxis: {
					        categories: yearQuarterTrendData,
					        labels: {
					            style:{
					            	cursor:'default'
					            },rotation: -45
					           
					        }
					    },
					    yAxis: {
					    	allowDecimals: false,
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
		    	// function to refresh the graph
		   $scope.openTrendPopup = function(val){
		    	$scope.trendDataForPopup = val;
		    	angular.forEach($scope.firstBlockChartData, function(value, key){
		    	       if(value.item == val){
		    	    	   if($location.search().BU != undefined){
		    	    		   $scope.buBeInTrend = value.BU;
				    	    	  $scope.pinPfInTrend = value.Pin;
				    	    	  $scope.segBseInTrend = value.Segment;
		    	    	   }
		    	    	   else if($location.search().BE != undefined){
		    	    		   $scope.buBeInTrend = value.BE;
				    	    	  $scope.segBseInTrend = value.BSE;
				    	    	  if(value.PF != undefined){
				    	    		  $scope.pinPfInTrend = value.PF;
				    	    	  }
				    	    	 
		    	    	   }
		    	    	  
		    	      }
		    	   });
		    	$scope.templateLocation = 'html/templates/escalationSummaryPinTrendPopup.html';
				$scope.controllerLocation = 'escalationSummaryPinTrendPopupCtrl';
				$scope.open('lg');
		    }
		   
		   
		   var modalInstance;   
		    $scope.open = function (size, parentSelector) {
		    
			var parentElem = parentSelector ? angular
				.element($document[0].querySelector('.modal-demo '
						 + parentSelector))
				 : undefined;
			 modalInstance = $uibModal.open({
					animation: $scope.animationsEnabled,
					ariaLabelledBy: 'modal-title',
					ariaDescribedBy: 'modal-body',
					templateUrl: $scope.templateLocation,
					controller: $scope.controllerLocation,
					controllerAs: '$ctrl',
					scope: $scope,
					size: size,
					appendTo: parentElem,
					resolve: {
						items: function () {
							return $scope.items;
						}
					}
				});
			 

				};
				
				$scope.cancel =function(){
					modalInstance.dismiss('cancel');
				};
				
				$scope.toggleFilter = function(){
					$scope.gridTrend.enableFiltering = !$scope.gridTrend.enableFiltering;
					$scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);		        
				};
				
				
		$scope.plotGraph= function() {
			if($location.url().indexOf('capMetrics')>-1)
				$scope.titleText = "CAP Summary";
			else if($location.url().indexOf('capPrimaryMetrics')>-1)
				$scope.titleText = "CAP(Primary) Summary";
			else if($location.url().indexOf('rrrMetrics')>-1)
				$scope.titleText = "RRR Summary";	
		  else if($location.url().indexOf('bemsMetrics')>-1)
			  $scope.titleText = "BEMS Summary";		
	
	          //Horizontal
			var chart =
			Highcharts.chart('container', {
			    chart: {
			        type: 'column'
			    },
			    title: '',
			    subtitle: {
			    	enabled: false
			    },
			    xAxis: {
			        categories: graphHorizontalCatagories,
			        labels: {
			            style:{
			            	cursor:'pointer',
			            	color:'blue'
			            }
			        }
			    },
			    yAxis: {
			    	allowDecimals: false,
			        min: 0,
			        title: {
			           enabled:false
			        }
			    },
			    credits: {
                    enabled: true,
                    text: 'Note:Please click on individual Pin of graph to see trend',
                    href :null,
                    position: {
                             align: 'left',
                             x: 15
                         },
                   style:{
                	   fontSize:'12px',
                	   cursor:'default'
                   }
                },
			    plotOptions: {
			            dataLabels: {
			                enabled: true,
			                color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
			                format: '{y}',
			                style: {
			                	fontSize: 8,
			                }
			        },
			        series: {
			               pointWidth: graphHorizontalCatagories.length> 7 ? 20 : 30,
			            		 /*  events: {
						                click: function (event) {
						                	$scope.openTrendPopup(event.point.category)
						                }
						            }*/
			           },
			          
			    },
			    series: [{
			        name: 'Incoming',
			        data: incoming,
			        "color" : "#cf2030"

			    }, {
			        name: 'Closed',
			        data: closed,
			        "color" : "#6cc04a"

			    }, {
			        name: 'Outstanding',
			        data: outstanding,
			        "color" : "#00CCFF"

			    }],
			    title: {
                    text: $scope.titleText,
                    align: "left"

                },
			});
			chart.xAxis[0].labelGroup.element.childNodes.forEach(function(label)
					{
				
					  label.onclick = function(){
							
						  //console.log("called x axis"+this.textContent)
					  	$scope.refreshTrendGraph(this.textContent)
					  }
					});
			
			};
		
			var modalInstance;   
		    $scope.open = function (size, parentSelector) {
		    
			var parentElem = parentSelector ? angular
				.element($document[0].querySelector('.modal-demo '
						 + parentSelector))
				 : undefined;
			 modalInstance = $uibModal.open({
					animation: $scope.animationsEnabled,
					ariaLabelledBy: 'modal-title',
					ariaDescribedBy: 'modal-body',
					templateUrl: $scope.templateLocation,
					controller: $scope.controllerLocation,
					controllerAs: '$ctrl',
					scope: $scope,
					size: size,
					appendTo: parentElem,
					resolve: {
						items: function () {
							return $scope.items;
						}
					}
				});
			 

				};
				
				$scope.cancel =function(){
					modalInstance.dismiss('cancel');
				};
				$scope.dataTOSWHW = '';
				$scope.typeSWHW = '';
				$scope.openSWHWPopup = function(data,type){
					$scope.dataTOSWHW  = data;
					$scope.typeSWHW = type;
					$scope.templateLocation = 'html/templates/npsSWHWpopup.html';
					$scope.controllerLocation = 'npsSWHWpopupCtrl';
					$scope.open('lg');
				}
	            
				$scope.productLink = function(row,col){
					if(row.entity.bu == 'ENB'){
						window.open('https://wwss.cisco.com/t/Insight_Engine/views/UCSFY17Q3/MainMetrics?Product=Cisco%20IMC%20Software&:iid=1&:isGuestRedirectFromVizportal=y&:embed=y&:usingOldHashUrl=true','_blank'); 
					}
				}
			
				/*grid for incoming*/ 
	/*	$scope.incomingGridTrend = {
				enableRowSelection: true,
				enableRowHeaderSelection: false,
				enableSorting: true,
				enableColumnMenus: false,
				enableFiltering: false,
				enableHorizontalScrollbar: 1,
				enableVerticalScrollbar: 1,
	   };
		grid for outgoing 
		$scope.outgoingGridTrend = {
				enableRowSelection: true,
				enableRowHeaderSelection: false,
				enableSorting: true,
				enableColumnMenus: false,
				enableFiltering: false,
				enableHorizontalScrollbar: 1,
				enableVerticalScrollbar: 1,
		};	
		grid for closed 
		$scope.closedGridTrend = {
				enableRowSelection: true,
				enableRowHeaderSelection: false,
				enableSorting: true,
				enableColumnMenus: false,
				enableFiltering: false,
				enableHorizontalScrollbar: 1,
				enableVerticalScrollbar: 1,
		 };*/
				$scope.openSRDetails = function(row){
					var metricType = $scope.escType;
					//console.log("row.entity is"+JSON.stringify(row.entity))
					var metricCase;
				
					if(row.entity.CAPCaseNo == undefined)
						 metricCase = row.entity[$scope.selectedEscType == 'CAPPrimary'? 'CAP_Primary_Case' : $scope.selectedEscType+'_Case'];
					else
						metricCase = row.entity.CAPCaseNo;
					if($location.search().BU != undefined && $location.search().Segment != undefined && $location.search().Pin != undefined && $location.search().Product != undefined){
						var urlBookmark = "BU="+$scope.BU+"&Segment="+$scope.Segment+"&Pin="+$scope.Pin+"&Product="+$scope.Product;
						console.log(urlBookmark)
					}else if($location.search().BU != undefined && $location.search().Segment != undefined && $location.search().Pin == undefined && $location.search().Product == undefined){
						urlBookmark = "BU="+$scope.BU+"&Segment="+$scope.Segment;
					}else if($location.search().BU != undefined && $location.search().Segment == undefined && $location.search().Pin == undefined && $location.search().Product == undefined){
						urlBookmark = "BU="+$scope.BU;
					}else if($location.search().BE != undefined && $location.search().BSE != undefined && $location.search().PF != undefined){
						urlBookmark = "BE="+$scope.BE+"&BSE="+$scope.BSE+"&PF="+$scope.PF;
					}
					else if($location.search().BE != undefined && $location.search().BSE != undefined && $location.search().PF == undefined){
						urlBookmark = "BE="+$scope.BE+"&BSE="+$scope.BSE;
					}
					else if($location.search().BE != undefined && $location.search().BSE == undefined && $location.search().PF == undefined){
						urlBookmark = "BE="+$scope.BE;
					}
					var locationParts=window.location.href.split("/");
					//locationParts[0]+"/"+locationParts[1]+"/"+locationParts[2]+"/"+locationParts[3]+"/"+
	    			var url=".htm?"+urlBookmark+"&Case="+metricCase+'&Type'+'='+metricType;
	    			$scope.navigateTo("escalationSRDetails",false,url,false);
	    		}
				
    			$scope.gridTrend = {
						//enableRowSelection: true,
						//enableRowHeaderSelection: false,
						enableSorting: true,
						enableColumnMenus: false,
						enableFiltering: false,
						groupingShowCounts: false,
						enableHorizontalScrollbar: 1,
						enableVerticalScrollbar: 1,
						showTreeExpandNoChildren: false,
						exporterCsvFilename: 'case_Summary.csv',
			            exporterCsvLinkElement: angular.element(document.querySelectorAll(".custom-csv-link-location")),
						onRegisterApi : function(gridApi) {
							$scope.gridApi = gridApi;							
								$scope.gridApi.core.refresh();
								
							},
				 }
		/*column structure*/
    		 var columnDef = [
	    	
	    		{
	    	        field: 'caseType',
	    	        displayName:'caseType',
	    	        grouping: { groupPriority: 0 },
	    	         sort: { priority: 0, direction: 'asc' },
	    	        enableCellEdit: false,               
	    	        width: '12%'
	    	     }
	    	,
	    	{
	        field: $location.search().BU != undefined ? 'segment' : 'bse',
	        displayName: $location.search().BU != undefined ? 'Segment' : 'BSE',
	    	headerCellClass: "text-center",
	        enableSorting: true,
	        enableCellEdit: false,               
	        width: '8%'
	     }, {
	        field: $location.search().BU != undefined ? 'pin' : 'Product',
	        displayName: $location.search().BU != undefined ? 'PIN' : 'PF',
	        enableSorting: true,
	    	headerCellClass: "text-center",
	        enableCellEdit: false,
	        width: '8%'
	     }, {
	        field: $scope.selectedEscType == 'CAPPrimary'? 'CAP_Primary_Case' : $scope.selectedEscType+'_Case',
	        displayName: $scope.selectedEscType == 'CAPPrimary'? 'CAP (Primary) Case' : $scope.selectedEscType+' Case',
	    	headerCellClass: "text-center",
	    	cellTemplate:"<a title='Case Link'   ng-click=grid.appScope.caseLinks(row,col)><div style='padding-left:7px;'> "
                + "<span ng-if='row.entity.BEMS_Case != undefined'>{{row.entity.BEMS_Case}} </span> <span ng-if='row.entity.CAP_Primary_Case != undefined' >  {{row.entity.CAP_Primary_Case}}</span>  <span ng-if='row.entity.CAP_Case != undefined' >  {{row.entity.CAP_Case}}</span> <span ng-if='row.entity.RRR_Case != undefined'>  {{row.entity.RRR_Case}}</span></div></a> ",
	        enableSorting: true,
	        enableCellEdit: false,            
	        width: '12%'
	     },
	     {
		        field: 'Case_Type',
		        displayName: 'Case Type',
		        enableSorting: true,
		    	headerCellClass: "text-center",
		        enableCellEdit: false,
		        width: '8%',	       
		       visible: ($scope.selectedEscType == 'CAPPrimary' ||  $scope.selectedEscType == 'CAP'),
		     },
	     /*{
		        field: 'Case_Type',
		        displayName: 'CAP Type',
		        enableSorting: true,
		        enableCellEdit: false,
		    	headerCellClass: "text-center",
		        width: '6%',
		        enableFiltering: true,
		 },*/{
	        field: 'SR',
	        displayName: '#SR',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '5%',
	        type: 'number',
	        cellTemplate :'<div class="ui-grid-cell-contents"><a href="javascript:void(0)" title = "Click to open SR Details" ng-click="grid.appScope.openSRDetails(row)">{{row.entity.SR}}</a></div>',
	      
	     }, {
	        field: 'Product',
	        displayName: 'Product',
	        enableSorting: true,
	    	headerCellClass: "text-center",
	        enableCellEdit: false,
	        width: '8%',
	       
	       visible:$location.search().BU  != undefined,
	     },{
	        field: 'Case_Status',
	        displayName: 'Case Status',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '10%'
	     },{
	        field: 'Open_Date',
	        displayName: 'Opened Date',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '12%',
	       // cellTemplate:'<div class="ui-grid-cell-contents">{{grid.appScope.formatDate(row.entity.Open_Date)}}</div>',
	       // cellFilter: 'dateFormatGrid'
	     },{
	        field: 'Closed_Date',
	        displayName: 'Closed Date',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '10%',
	       // cellTemplate:'<div class="ui-grid-cell-contents">{{grid.appScope.formatDate(row.entity.Closed_Date)}}</div>',
	       // cellFilter: 'dateFormatGrid'
	     },{
		        field: 'Customer',
		        displayName: 'Customer',
		        enableSorting: true,
		        enableCellEdit: false,
		    	headerCellClass: "text-center",
		        width: '25%',
		       
		        cellTemplate: "html/templates/escalationCell.html"
		  },{
	        field: 'Primary_Assignmment',
	        displayName: 'Primary Assignment',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '15%',
	       
	        visible:$scope.selectedEscType == 'CAPPrimary',
	     },{
	        field: 'Primary_Owner',
	        displayName: 'Primary Owner',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '20%',
	       
	        cellTemplate: "html/templates/escalationCell.html"
	     },{
	        field: $scope.selectedEscType=='CAPPrimary'?'CAP_Primary_Title':$scope.selectedEscType+'_Title',
	        displayName:  $scope.selectedEscType=='CAPPrimary'? 'CAP (Primary) Title ':$scope.selectedEscType+' '+'Title',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '35%',
	       
	        cellTemplate: "html/templates/escalationCell.html"
	     },
	     {
		        field: 'CAP_Age',
		        displayName: 'CAP Age',
		        enableSorting: true,
		        enableCellEdit: false,
		    	headerCellClass: "text-center",
		        width: '10%',
		       
		        visible:($scope.selectedEscType == 'CAPPrimary' || $scope.selectedEscType == 'CAPPrimary'),
		       // cellTemplate:'<div class="ui-grid-cell-contents">{{grid.appScope.formatDate(row.entity.CAP_Age)}}</div>',
		     },/*,{
	        field: 'icon',
	        displayName: '',
	        enableSorting: true,
	        enableCellEdit: false,
	    	headerCellClass: "text-center",
	        width: '5%',
	        enableFiltering: false,
	     }*/];
	   /* $scope.incomingGridTrend.columnDefs = columnDef;
	    $scope.outgoingGridTrend.columnDefs =  columnDef;
		$scope.closedGridTrend.columnDefs =  columnDef;*/
				$scope.gridTrend.columnDefs =  columnDef;
		
				/*function to download grid data*/
				
				$scope.downloadGrid = function(){
					 var grid = $scope.gridApi.grid;
			            var rowTypes = uiGridExporterConstants.ALL;
			            var colTypes = uiGridExporterConstants.ALL;
			          
			            uiGridExporterService.csvExport(grid, rowTypes, colTypes);
				}
				
		$scope.loadCAPTrendGraph = function(trequest){
			trequest.EscType=["CAP"]
		/*	if(globalService.beBUType == "BE") {		
			if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,
					"TrendType":$scope.intervalCAP,
					"EscType":[
						"CAP"
						]
			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]

				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]

				};
			}
			}
			else
				{
				if(Segment == 'undefined' && Pin =='undefined' )
				{charParms = { 	
						"BU": BU,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]


				};
				}else if(Pin =='undefined'){
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"TrendType":$scope.intervalCAP,
							"EscType":[
								"CAP"
								]
					};
				}else{
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"Pin":Pin,
							"TrendType":$scope.intervalCAP,
							"EscType":[
								"CAP"
								]
					};
				}
				}*/

		/*	if(globalService.beBUType == "BE") {
					filterObj["BE"] = $location.search().BE;
					filterObj["BSE"] = $location.search().BSE;
					filterObj["PF"] = $location.search().BSE;
			          } else if(globalService.beBUType == "BU") {
				    	  filterObj["BU"] = $location.search().BU;
				    	  filterObj["Segment"] = $location.search().Segment;
			          }*/
			//console.log("fetching for CAP"+JSON.stringify(trequest))
		    trequest.CaseType=$scope.capCaseType;
			executiveViewService.getCAPTrendGraphData(trequest).success(function(graphData) {
				//console.log("length is in CAP"+JSON.stringify(graphData) +"and request is"+ JSON.stringify(trequest))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
				//$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 
		$scope.loadCAPPrimaryTrendGraph = function(trequest){
			trequest.EscType=["CAP Primary"]			
		/*	if(globalService.beBUType == "BE") {		
			if(BSE == 'undefined' && PF =='undefined' )
			{charParms = { 	
					"BE": BE,
					"TrendType":$scope.intervalCAP,
					"EscType":[
						"CAP"
						]
			};
			}else if(PF =='undefined'){
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]

				};
			}else{
				charParms = { 	
						"BE": BE,
						"BSE":BSE,
						"PF":PF,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]

				};
			}
			}
			else
				{
				if(Segment == 'undefined' && Pin =='undefined' )
				{charParms = { 	
						"BU": BU,
						"TrendType":$scope.intervalCAP,
						"EscType":[
							"CAP"
							]


				};
				}else if(Pin =='undefined'){
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"TrendType":$scope.intervalCAP,
							"EscType":[
								"CAP"
								]
					};
				}else{
					charParms = { 	
							"BU": BU,
							"Segment":Segment,
							"Pin":Pin,
							"TrendType":$scope.intervalCAP,
							"EscType":[
								"CAP"
								]
					};
				}
				}*/

		/*	if(globalService.beBUType == "BE") {
					filterObj["BE"] = $location.search().BE;
					filterObj["BSE"] = $location.search().BSE;
					filterObj["PF"] = $location.search().BSE;
			          } else if(globalService.beBUType == "BU") {
				    	  filterObj["BU"] = $location.search().BU;
				    	  filterObj["Segment"] = $location.search().Segment;
			          }*/
			//console.log("fetching for CAP"+JSON.stringify(trequest))
		    trequest.CaseType=$scope.capCaseType;
			executiveViewService.getCAPTrendGraphData(trequest).success(function(graphData) {
				//console.log("length is in CAP"+JSON.stringify(graphData) +"and request is"+ JSON.stringify(trequest))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
				//$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotCAPTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 
		
		
		$scope.loadBEMSTrendGraph = function(trequest){
			trequest.EscType=["BEMS"]
			/*if(globalService.beBUType == "BE") {
				
				
				if(BSE == 'undefined' && PF =='undefined' )
				{charParms = { 	
						"BE": BE,
						"TrendType":$scope.intervalBEMS,
						"EscType":[
							"BEMS"
							]


				};
				}else if(PF =='undefined'){
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]

					};
				}else{
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"PF":PF,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]

					};
				}
				}
				else
					{
					if(Segment == 'undefined' && Pin =='undefined' )
					{charParms = { 	
							"BU": BU,
							"TrendType":$scope.intervalBEMS,
							"EscType":[
								"BEMS"
								]


					};
					}else if(Pin =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"TrendType":$scope.intervalBEMS,
								"EscType":[
									"BEMS"
									]
						};
					}else{
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"TrendType":$scope.intervalBEMS,
								"EscType":[
									"BEMS"
									]

						};
					}
					}
			
*/
			//console.log("fetching for BEMS"+JSON.stringify(trequest))
		    trequest.CaseType=$scope.capCaseType;
			executiveViewService.getBEMSTrendGraphData(trequest).success(function(graphData) {
				//console.log("length is IN BEMS   "+JSON.stringify(graphData))
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
			//	$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotBEMSTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotBEMSTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 

		$scope.loadRRRTrendGraph = function(trequest){
			trequest.EscType=["RRR"]
			/*if(globalService.beBUType == "BE") {
				
				
				if(BSE == 'undefined' && PF =='undefined' )
				{charParms = { 	
						"BE": BE,
						"TrendType":$scope.intervalRRR,
						"EscType":[
							"RRR"
							]


				};
				}else if(PF =='undefined'){
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]

					};
				}else{
					charParms = { 	
							"BE": BE,
							"BSE":BSE,
							"PF":PF,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]

					};
				}
				}
				else
					{
					if(Segment == 'undefined' && Pin =='undefined' )
					{charParms = { 	
							"BU": BU,
							"TrendType":$scope.intervalRRR,
							"EscType":[
								"RRR"
								]


					};
					}else if(Pin =='undefined'){
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"TrendType":$scope.intervalRRR,
								"EscType":[
									"RRR"
									]
						};
					}else{
						charParms = { 	
								"BU": BU,
								"Segment":Segment,
								"Pin":Pin,
								"TrendType":$scope.intervalRRR,
								"EscType":[
									"RRR"
									]

						};
					}
					}*/
			
			

			//console.log("fetching for RRR"+JSON.stringify(trequest))
		    trequest.CaseType=$scope.capCaseType;
			executiveViewService.getRRRTrendGraphData(trequest).success(function(graphData) {
				//console.log("length is in RRR"+JSON.stringify(graphData) )
				//	 var doaQtyPerc = [],irQtyPerc = [],rmQtyPerc = [],dates=[];
				var inc_cnt=[],outs_cnt=[],closed_cnt=[],dates=[];
			//	$scope.BE=graphData.data[0]['BE']
				if(graphData.data.length > 0) {

					// $scope.doaQtyPerc1 =[],$scope.irQtyPerc1=[];

					for (var i = 0; i < graphData.data[0]['Data'].length; i++) {
						inc_cnt[i] = graphData.data[0]['Data'][i]['incoming_cnt'];
						closed_cnt[i] = graphData.data[0]['Data'][i]['closed_cnt'];
						outs_cnt[i] = graphData.data[0]['Data'][i]['outstanding_cnt'];
						if(graphData.data[0]['Data'][i]['yearQtr'])
							dates[i] = graphData.data[0]['Data'][i]['yearQtr'];
						else if(graphData.data[0]['Data'][i]['year'])
							dates[i] = graphData.data[0]['Data'][i]['year'];
						else
							dates[i] = graphData.data[0]['Data'][i]['yearMonth'];
					}
					$scope.plotRRRTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);
				}else
					$scope.plotRRRTrendGraph(dates,inc_cnt,outs_cnt,closed_cnt);


			});
		}; 
		$scope.showLine = false;
		$scope.typeTitle = "Show Line Chart";
		$scope.toggleChart = function(screen){
			console.log("in"+screen)
			if(screen == "CAP" || screen == "capPrimary"){
			if($scope.chartConfigCAPTrend.options.chart.type == "column"){
				$scope.showLine = true;
				$scope.typeTitle = "Show Column Chart";
				$scope.chartConfigCAPTrend.options.chart.type = "line";
				$scope.chartSeries[0].type="line";
					$scope.chartSeries[1].type="line";
			}
			else{
				$scope.showLine = false;
				$scope.typeTitle = "Show Line Chart";
				$scope.chartConfigCAPTrend.options.chart.type = "column";
				$scope.chartSeries[0].type="column";
				$scope.chartSeries[1].type="column";
				}
			}
			if(screen == "bems"){
				if($scope.chartConfigBEMSTrend.options.chart.type == "column"){
					$scope.showLine = true;
					$scope.typeTitle = "Show Column Chart";
					$scope.chartConfigBEMSTrend.options.chart.type = "line";
					$scope.chartSeries[0].type="line";
						$scope.chartSeries[1].type="line";
				}
				else{
					$scope.showLine = false;
					$scope.typeTitle = "Show Line Chart";
					$scope.chartConfigBEMSTrend.options.chart.type = "column";
					$scope.chartSeries[0].type="column";
					$scope.chartSeries[1].type="column";
					}
				}
			if(screen == "rrr"){
				if($scope.chartConfigRRRTrend.options.chart.type == "column"){
					$scope.showLine = true;
					$scope.typeTitle = "Show Column Chart";
					$scope.chartConfigRRRTrend.options.chart.type = "line";
					$scope.chartSeries[0].type="line";
						$scope.chartSeries[1].type="line";
				}
				else{
					$scope.showLine = false;
					$scope.typeTitle = "Show Line Chart";
					$scope.chartConfigRRRTrend.options.chart.type = "column";
					$scope.chartSeries[0].type="column";
					$scope.chartSeries[1].type="column";
					}
				}
		}
		$scope.plotCAPTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			//console.log("here in plotting cap")
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
				{
					"name": "Incoming",
					"data": inc_cnt.length==0?[0]:inc_cnt,
					type: "column",
					"color": "#cf2030"
				},
				{
					"name": "Closed",
					"data": closed_cnt.length==0?[0]:closed_cnt,
					type: "column",
					"color": "#6cc04a"
				},
				{
				
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",
				"color": "#00CCFF",
				"zIndex": 100
			},
		
		

			];
			
			$scope.chartConfigCAPTrend = {
					options: {
					  tooltip : $scope.tooltip,
						chart: {
						  events: {
				            click: function (event) {
				             window.open(
				                 'http://capbi.cisco.com',
				                 '_blank' // <- This is what makes it open in a new window.
				               );
				             
				            }},
							type: "column",

						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            itemDistance: 5,
					             
					             itemStyle: {
					                 width: '280px',
					                 overflow: 'hidden',
					                 textOverflow: 'ellipsis',
					                 fontSize: '11px',
					                 fontWeight: 'normal',
					                 color: '#666666'
					             },
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					           // itemWidth:100,
					            labelFormatter: function() {
					            	
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						plotOptions: {
							line: {
								allowPointSelect: true,
								allowOverlap:true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
						dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{

						allowDecimals: false,
						title: {
							text: $scope.label
							
						},


					}
					],

					series: $scope.chartSeries,

					title: {
						text:$scope.selectedEscType=='CAPPrimary'? 'CAP (Primary) Trend': $scope.selectedEscType+ ' Trend',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
								dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},

							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip: {
						valueSuffix: 'Bugs',
						shared: true,
						crosshairs: [{
							width: 1.5,
							dashStyle: 'shortdot',
							color: 'grey'
						}, false, true],
						width: '100%',
						backgroundColor: "#e5e5e5",
						formatter: function() {

							var s = '<span style="color:backlogack;font-weight:bold;">' + this.x + '<span><br>';
							$.each(this.points,
									function(i, point) {
								if (point.series.name == "Incoming")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Outgoing")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Backlog")
									spanStyle = 'font-weight:bold;';
								s += ('<span style="' + spanStyle + '">' +
										point.series.name +
										' : ' +
										parseInt(
												point.y)
												.toLocaleString() + '<span><br>');
							});

							return s;
						},
						shared: true,
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};
		$scope.plotRRRTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			//console.log("here")
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
		
			{
				"name": "Incoming",
				"data": inc_cnt.length==0?[0]:inc_cnt,
				type: "column",
				"color": "#cf2030"
			},
			{
				"name": "Closed",
				"data": closed_cnt.length==0?[0]:closed_cnt,
				type: "column",
				"color": "#6cc04a"
			},
			{
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",
				"color": "#00CCFF",
				"zIndex": 100

			},

			];
			$scope.chartConfigRRRTrend = {
			    tooltip:{shared:true},
					options: {
					  tooltip : $scope.tooltip,
						chart: {
							type: 'column',

						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					            itemDistance: 5,
                                
                                itemStyle: {
                                    width: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '11px',
                                    fontWeight: 'normal',
                                    color: '#666666'
                                },
					           // itemWidth:100,
					            labelFormatter: function() {
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						  		plotOptions: {
						  		line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
						dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{

						allowDecimals: false,
						title: {
							text: $scope.label
						},


					}
					],

					series: $scope.chartSeries,
			title: {
						text: 'Regional Risk Register (RRR) Trend',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
								/*dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},
*/
							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip : {
						valueSuffix : 'Bugs',
						valueDecimals: 2,
						crosshairs : [ {
							width : 1.5,
							dashStyle : 'shortdot',
							color : 'grey'
						}, false, true ],

						width : '100%',
						backgroundColor : "#e5e5e5",
						height : '50%',
						
						shared : true
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};
		/*Highcharts.setOptions({
			tooltip : {
						"backgroundColor" : "#e5e5e5",
						"crosshairs" : [ {
							"color" : "grey",
							"dashStyle" : "shortdot",
							"width" : 1.5
						}, false, true ],
						"shared" : true,
						"valueSuffix" : "Bugs",
						"width" : "100%",
								formatter : function() {
									var s = '<span style="color:backlogack; font-weight:bold;">'+ this.x + '<span><br>';
							$.each(this.points,function(i, point) {
												if (point.series.name == "Incoming")
													spanStyle = 'color:#cf2030; font-weight:bold;';
												else if (point.series.name == "Closed")
													spanStyle = 'color:#83c341; font-weight:bold;';
												else if (point.series.name == "Outstanding")
													spanStyle = 'color:#00CCFF; font-weight:bold;';
												
												s += ('<span style="'+ spanStyle+ '">'+ point.series.name+ ' : '+ point.y + '<span><br>');
											});
								return s;
													}
			  },
		});*/
		$scope.plotBEMSTrendGraph = function(dates,inc_cnt,outs_cnt,closed_cnt) {
			//console.log("here")
			var noOfItems = inc_cnt.length;
			itemsToDisplay = noOfItems;
			var minItem = 0;


			$scope.chartSeries = [
				{
					"name": "Incoming",
					"data": inc_cnt.length==0?[0]:inc_cnt,
					type: "column",
					"color": "#cf2030"
				},
				{
					"name": "Closed",
					"data": closed_cnt.length==0?[0]:closed_cnt,
					type: "column",
					"color": "#6cc04a"
				},
				{				
				"name": "Outstanding",
				"data": outs_cnt.length==0?[0]:outs_cnt,
				type: "line",
				"color": "#00CCFF",
				"zIndex": 100
				},
			];
			$scope.chartConfigBEMSTrend = {
					options: {
					  tooltip : $scope.tooltip,
						chart: {
						  events: {
                            click: function (event) {
                             window.open(
                                 'http://bemsbi.cisco.com',
                                 '_blank' // <- This is what makes it open in a new window.
                               );
                             
                            }},
							type: 'column',
							
						},
						lang: {
							thousandsSep: ','
						},
						 legend: {
					            x:10,
					            y:10,
					            //floating: true,
					            //backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
					            borderColor: '#000000',
					            verticalAlign: 'bottom',
					            horizontalAlign:'middle',
					            useHTML:true,
					            borderWidth: 0,
					            itemDistance: 5,
                                
                                itemStyle: {
                                    width: '280px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    fontSize: '11px',
                                    fontWeight: 'normal',
                                    color: '#666666'
                                },
					           // itemWidth:100,
					            labelFormatter: function() {
					                var lastVal = this.yData[this.yData.length - 1];
					                //console.log("last val is"+lastVal)
					                var html=this.name+': <b>'+lastVal + '</b>'
					                //console.log("html is"+html)
					                    return html;
					            		}
						  		},
						plotOptions: {
							line: {
								allowPointSelect: true,
								cursor: 'pointer',
								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								},
								column: {

									dataLabels: {
										enabled: false,
										format: '{point.y:0f}'
									}
								}
							},
							column: {

								dataLabels: {
									enabled: false,
									format: '{point.y:0f}'
								}
							}

						} , 

					},
					xAxis: {
						categories: dates,
						showLastLabel: true,
						//endOnTick: true,
						labels: {
							rotation: -45
						},
					/*	dateTimeLabelFormats: { // don't display the dummy year
							month: '%e. %b',
							year: '%b'
						},*/
						min: minItem,
						max: minItem + (itemsToDisplay - 1),

						scrollbar: {
							enabled: globalService.indicatorValueOrgIfd
						}

					},

					scrollbar: {
						barBackgroundColor: 'gray',
						barBorderRadius: 7,
						barBorderWidth: 0,
						buttonBackgroundColor: 'gray',
						buttonBorderWidth: 0,
						buttonBorderRadius: 7,
						trackBackgroundColor: 'none',
						trackBorderWidth: 1,
						trackBorderRadius: 8,
						trackBorderColor: '#CCC'
					},
					yAxis: [{

						allowDecimals: false,
						title: {
							text: $scope.label
						},


					}
					],

					series: $scope.chartSeries,

					title: {
						text: 'Business Escalation Management Solution (BEMS) Trend',
						align: "left"
					},
					chart: {
						// Edit chart spacing
						spacingBottom: 4,
						marginRight: 0,
						spacingRight: 0,
						height: 100,
					},

					credits: {
						enabled: false,
						enabackloged: false,
						href: 'http://cqi',
						text: 'cqi.cisco.com'
					},
					exporting: {
						chartOptions: {

							xAxis: [{
								//categories: categories,
								min: 0,
								minRange: noOfItems - 1,
								max: noOfItems - 1,
								categories: dates,
								showLastLabel: true,
								//endOnTick : true,
								labels: {
									rotation: -45
								},
							/*	dateTimeLabelFormats: { // don't display the dummy year
									month: '%e. %b',
									year: '%b'
								},*/

							}],

							scrollbar: {
								enabled: false
							},

						},
						buttonsIFD: {
							contextButton: {
								symbol: 'url(../images/glyphicons-182-download-alt_1.png)',
								text: 'Download',
								menuItems: [

									{
										textKey: 'printChart',
										onclick: function() {
											this.print();
										}
									}, {
										textKey: 'downloadPNG',
										onclick: function() {
											this.exportChart();
										}
									}, {
										textKey: 'downloadJPEG',
										onclick: function() {
											this.exportChart({
												type: 'image/jpeg'
											});
										}
									}, {
										textKey: 'downloadPDF',
										onclick: function() {
											this.exportChart({
												type: 'application/pdf'
											});
										}
									},

									,
									]
							}
						}
					},
					navigation: {
						buttonOptions: {
							verticalAlign: 'top',
							y: 0,

						}
					},
					tooltip: {
						valueSuffix: 'Bugs',
						shared: true,
						crosshairs: [{
							width: 1.5,
							dashStyle: 'shortdot',
							color: 'grey'
						}, false, true],
						width: '100%',
						backgroundColor: "#e5e5e5",
			/*			formatter: function() {

							var s = '<span style="color:backlogack;font-weight:bold;">' + this.x + '<span><br>';
							$.each(this.points,
									function(i, point) {
								if (point.series.name == "Incoming")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Outgoing")
									spanStyle = 'font-weight:bold;';
								else if (point.series.name == "Backlog")
									spanStyle = 'font-weight:bold;';
								s += ('<span style="' + spanStyle + '">' +
										point.series.name +
										' : ' +
										parseInt(
												point.y)
												.toLocaleString() + '<span><br>');
							});

							return s;
						},*/
						shared: true,
					},

					loading: false,

					size: {},
					responsive: {
						rules: [{
							condition: {
								maxWidth: 500
							}
						}]
					}
			};


		};
		
		//function to form data of grids in groups
		$scope.groupCap = function(data){
			//console.log("data received is"+JSON.stringify(data))
			 var closeddata=data;
    	     var jsondata=[];
    	     angular.forEach(closeddata, function(value, key){
    	    	 var pushed=0;
    	    	 for(var i=0;i<jsondata.length;i++){
    	    		 if($location.url().indexOf('capPrimaryMetrics')>-1){
    	    			 
    	    			 if(jsondata[i].CAP_Primary_Case==value.CAP_Primary_Case.trim()){
    	    				 jsondata[i].data.push(value);
    	    				 pushed=1;
    	    			 }
    	    		 }
    	    		 if($location.url().indexOf('capMetrics')>-1){
    	    			// console.log("pushing value"+jsondata[i].CAP_Case+"-=-"+value.CAP_Case.trim())
    	    			 if(jsondata[i].CAP_Case==value.CAP_Case.trim()){
    	    				 jsondata[i].data.push(value);
    	    				 pushed=1;
    	    			 }
    	    		 }
    	    		 if($location.url().indexOf('rrrMetrics')>-1){
    	    			 if(jsondata[i].RRR_Case==value.RRR_Case.trim()){
    	    				 jsondata[i].data.push(value);
    	    				 pushed=1;
    	    			 }
    	    		 }
    	    		 if($location.url().indexOf('bemsMetrics')>-1){
    	    			 if(jsondata[i].BEMS_Case==value.BEMS_Case.trim()){
    	    				 jsondata[i].data.push(value);
    	    				 pushed=1;
    	    			 }
    	    		 }
    	     }
    	     if(pushed==0){
    	    	 var temp=[];
    	    	 temp.push(value);
    	    	 if($location.url().indexOf('capPrimaryMetrics')>-1){
    	    		 jsondata.push({
    	    			 CAP_Primary_Case:value.CAP_Primary_Case.trim(),
    	    			 data:temp
    	    		 });
    	    	 }
    	    	 if($location.url().indexOf('capMetrics')>-1){
    	    		 //console.log("value for cap_case is"+value.CAP_Case.trim())
    	    		 jsondata.push({
    	    			 CAP_Case:value.CAP_Case.trim(),
    	    			 data:temp
    	    		 });
    	    	 }
    	    	 if($location.url().indexOf('rrrMetrics')>-1){
    	    		 jsondata.push({
    	    			 RRR_Case:value.RRR_Case.trim(),
    	    			 data:temp
    	    		 });
    	    	 }
    	    	 if($location.url().indexOf('bemsMetrics')>-1){
    	    		 jsondata.push({
    	    			 BEMS_Case:value.BEMS_Case.trim(),
    	    			 data:temp
    	    		 });
    	    	 }
    	     }
    	     });
    	     var outMainArr = [];
    		 for(var k=0;k<jsondata.length;k++){
    			 for(var l=0;l<jsondata[k].data.length;l++){
    			 outMainArr.push(jsondata[k].data[l]);
    			 }
    		 }
    		 var groupedArr = angular.copy(outMainArr);
    		 for(var i=0;i<outMainArr.length;i++){
    			  var j=i+1;
    			  if(j<=outMainArr.length-1){
    				  if($location.url().indexOf('capPrimaryMetrics')>-1){
    					  if(outMainArr[i].CAP_Primary_Case == outMainArr[j].CAP_Primary_Case){
    						  // console.log("feeding capcaseno"+outMainArr[j].CAP_Primary_Case)
    						  groupedArr[j].CAPCaseNo = outMainArr[j].CAP_Primary_Case;
    						  groupedArr[j].CAP_Primary_Case = '';
    					  }
    				  }
    				  if($location.url().indexOf('capMetrics')>-1){
    					  if(outMainArr[i].CAP_Case == outMainArr[j].CAP_Case){
    						  groupedArr[j].CAPCaseNo = outMainArr[j].CAP_Case;
    						  groupedArr[j].CAP_Case = '';
    					  }
    				  }
    				  if($location.url().indexOf('rrrMetrics')>-1){
    					  if(outMainArr[i].RRR_Case == outMainArr[j].RRR_Case){
    						  groupedArr[j].CAPCaseNo = outMainArr[j].RRR_Case;
    						  groupedArr[j].RRR_Case = '';
    					  }
    				  }
    				  if($location.url().indexOf('bemsMetrics')>-1){
    					  if(outMainArr[i].BEMS_Case == outMainArr[j].BEMS_Case){
    						  groupedArr[j].CAPCaseNo = outMainArr[j].BEMS_Case;
    						  groupedArr[j].BEMS_Case = '';
    					  }
    				  }
    			  }
    		 }
    			//console.log("data returned is"+JSON.stringify(groupedArr))
    		 return groupedArr;
		}
		
		
	/* service call for grid data*/
	    var callGridData = function(){
	    	 var request = 	{}
	    	 var trequest={};
			    if($location.search()["BU"] != undefined){
			    	request.BU = $location.search()["BU"];
			    	trequest.BU = $location.search()["BU"];
			    	$scope.BU= $location.search()["BU"];
			    }
			    if($location.search()["BE"] != undefined){
			    	request.BE = $location.search()["BE"];
			    	trequest.BE = $location.search()["BE"];
			    	$scope.BE= $location.search()["BE"];
			    }
			  request.TrendType =  $scope.intervalType;
			  trequest.TrendType =  $scope.intervalType;
			  trequest.CurrentMQFlag=$scope.CurrentMQFlag;
			    request.EscType = $scope.escType;
			   // trequest.EscType = $scope.escType;
			    request.TrendDate = $scope.selectedTrendDate;
			 //   console.log("date is in call grid data"+$scope.selectedTrendDate);
			    if($location.search()["Segment"] != undefined){
			    	request.Segment = $location.search()["Segment"];
			    	trequest.Segment = $location.search()["Segment"];
			    	$scope.Segment= $location.search()["Segment"];
			    }
			    if($location.search()["Pin"] != undefined){
			    	request.Pin = $location.search()["Pin"];
			    	trequest.Pin = $location.search()["Pin"];
			    	$scope.Pin= $location.search()["Pin"];
			    }
			    if($location.search()["Product"] != undefined){
			    	request.PF = $location.search()["Product"];
			    	trequest.PF = $location.search()["Product"];
			    	$scope.Product= $location.search()["Product"];
			    }
			    if($location.search()["BSE"] != undefined){
			    	request.BSE = $location.search()["BSE"];
			    	trequest.BSE = $location.search()["BSE"];
			    	$scope.BSE= $location.search()["BSE"];
			    }
			    if($location.search()["PF"] != undefined){
			    	request.PF = $location.search()["PF"];
			    	trequest.PF = $location.search()["PF"];
			    	$scope.PF= $location.search()["PF"];
			    }
			    
			    if($location.url().indexOf('capMetrics')>-1){
			    	$scope.cap=true;
			    	$scope.trendGraph=false;
			    	$scope.capTitle='CAP'
			    	 $scope.loadCAPTrendGraph(trequest);
			    		
		    	 }	
			    if($location.url().indexOf('capPrimaryMetrics')>-1){
			    	$scope.capPrimary=true;
			    	$scope.trendGraph=false;
			    	$scope.capTitle='CAP(Primary)'
			    	 $scope.loadCAPPrimaryTrendGraph(trequest);
			    		
		    	 }	
			    
			    if($location.url().indexOf('rrrMetrics')>-1){
			    	$scope.rrr=true;
			    	$scope.trendGraph=false;
			    	 var RRR_request=JSON.parse(JSON.stringify(trequest))
						$scope.loadRRRTrendGraph(RRR_request);
		    	 }	

			    if($location.url().indexOf('bemsMetrics')>-1){
			    	$scope.bems=true;
			    	$scope.trendGraph=false;
				    var BEMS_request=JSON.parse(JSON.stringify(trequest))
					$scope.loadBEMSTrendGraph(BEMS_request);
		    	 }	
		
		
				
			    $scope.showLoader = true;
			    request.CaseType=$scope.capCaseType;
	    	 executiveViewService.getPinGridData(request).success(function(data){
	    		 $scope.showLoader = false;
	    		
	    		$scope.incomingGridTrend = $scope.groupCap(data.data[0].Data);
	 			$scope.outgoingGridTrend = $scope.groupCap(data.data[1].Data);
	 			$scope.closedGridTrend = $scope.groupCap(data.data[2].Data);
	 			var gridData=[], finalData=[]
	 			for(var i=0;i<$scope.incomingGridTrend.length;i++)
	 				{
	 					gridData.push($scope.incomingGridTrend[i])
	 					
	 						gridData[i]["caseType"]="Incoming";
	 					if($scope.incomingGridTrend[i]["Open_Date"] != "")
	 					gridData[i]["Open_Date"]=moment($scope.incomingGridTrend[i]["Open_Date"]).format(globalService.dateFormatGrid);
	 					if($scope.incomingGridTrend[i]["Closed_Date"] != "")
	 					gridData[i]["Closed_Date"]=moment($scope.incomingGridTrend[i]["Closed_Date"]).format(globalService.dateFormatGrid);
	 					finalData.push(gridData[i])
	 					
	 				}
	 			gridData=[];
	 		
	 			for(var i=0;i<$scope.closedGridTrend.length;i++)
 				{
 					gridData.push($scope.closedGridTrend[i])
 						gridData[i]["caseType"]="Closed";
 					if($scope.closedGridTrend[i]["Open_Date"] != "")
 					gridData[i]["Open_Date"]=moment($scope.closedGridTrend[i]["Open_Date"]).format(globalService.dateFormatGrid);
 					if($scope.closedGridTrend[i]["Closed_Date"] != "")
 					gridData[i]["Closed_Date"]=moment($scope.closedGridTrend[i]["Closed_Date"]).format(globalService.dateFormatGrid);
 					
 					finalData.push(gridData[i])
 					
 				}
	 			gridData=[];
	 			for(var i=0;i<$scope.outgoingGridTrend.length;i++)
 				{
 					gridData.push($scope.outgoingGridTrend[i])
 					
 						gridData[i]["caseType"]="Outstanding";
 					if($scope.outgoingGridTrend[i]["Open_Date"] != "")
 					gridData[i]["Open_Date"]=moment($scope.outgoingGridTrend[i]["Open_Date"]).format(globalService.dateFormatGrid);
 					if($scope.outgoingGridTrend[i]["Closed_Date"] != "")
 					gridData[i]["Closed_Date"]=moment($scope.outgoingGridTrend[i]["Closed_Date"]).format(globalService.dateFormatGrid);
 					
 					
 					finalData.push(gridData[i])
 					
 				}
	 		
	 			$scope.gridTrend.data=finalData;
	 			
	 			}).error(function(err){
	 				  $scope.showLoader = false;
	               $scope.navigateTo("errorPage");
	 			});
	    	 
	    	
	    }
	    /*to get Dates(by default)*/
		var req=interval+'&CurrentMQFlag='+$scope.CurrentMQFlag;
	    executiveViewService.getTrendData(req).success(function(data){
	    	//console.log("getting dates by default")
	    	/*if($scope.CurrentMQFlag=='Y')
	    		$scope.selectedTrendDate = data.data[0];
	    	else
	    		$scope.selectedTrendDate = data.data[1];*/
	    	$scope.selectedTrendDate = data.data[0];
	    	//console.log("date is by default"+$scope.selectedTrendDate)
	    		/*to show selected default data*/
	    			$scope.defaultVal = {};
	    			$scope.defaultVal.selected = {interval:$scope.intervalType, date:$scope.selectedTrendDate};
	    			$scope.trendDate = data.data;
	    			   callGridData();
	    			   getGraphsCapsPinSummary();
 			}).error(function(err){
 				  $scope.showLoader = false;
               $scope.navigateTo("errorPage");
 			});
	 
		$scope.openChart = function(id) {
			$scope.chartPopup = id;
			modalInstance = $uibModal.open({
				animation: false,
				windowClass: 'the-modal',
				templateUrl: 'fullScreenChart.html',
				size: 'lg',
				scope: $scope
			});
			if (id == 'CAPTrend') {

				$scope.chartConfigCAPTrendPopup = $scope.chartConfigCAPTrend;
				$scope.selectedYNSR = 'N';

			}
			else if (id == 'RRRPINGraph') {

				$scope.chartConfigRRRTrendPopup = $scope.chartConfigRRRTrend;
				$scope.selectedYNSR = 'N';

			}
			else if (id == 'BEMSGraph') {

				$scope.chartConfigBEMSTrendPopup = $scope.chartConfigBEMSTrend;
				$scope.selectedYNSR = 'N';

			}

		}; 
		$scope.changeDataLabelPopup = function(id, bool){
			if (id == 'CAPTrend') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigCAPTrendPopup = angular.copy($scope.chartConfigCAPTrend);
				if (typeof $scope.chartConfigCAPTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigCAPTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					//$scope.chartConfigCAPTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigCAPTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigCAPTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
				/*      var chart = Highcharts.chart('srGraphContainerFullSreen',  $scope.chartConfigCAPTrendPopup);
                  //console.log(JSON.stringify($scope.chartConfigCAPTrendPopup))
					chart.reflow();	*/
			}else if (id == 'RRRPINGraph') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigRRRTrendPopup = angular.copy($scope.chartConfigRRRTrend);
				if (typeof $scope.chartConfigRRRTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigRRRTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					// $scope.chartConfigRRRTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigRRRTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigRRRTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
			}else if (id == 'BEMSGraph') {
				if (bool) {
					$scope.selectedYNSR = 'Y';
				} else {
					$scope.selectedYNSR = 'N';
				}
				$scope.chartConfigBEMSTrendPopup = angular.copy($scope.chartConfigBEMSTrend);
				if (typeof $scope.chartConfigBEMSTrendPopup.options.plotOptions.column != "undefined") {

					$scope.chartConfigBEMSTrendPopup.options.plotOptions.column.dataLabels.enabled = bool;
					$scope.chartConfigBEMSTrendPopup.options.plotOptions.column.dataLabels.allowOverlap = bool;

				}
				if (typeof $scope.chartConfigBEMSTrendPopup.options.plotOptions.line != "undefined") {

					$scope.chartConfigBEMSTrendPopup.options.plotOptions.line.dataLabels.enabled = bool;
				}
			}
		};
		$scope.closeChart = function() {
            modalInstance.dismiss('cancel');
        }
	   $scope.caseLinks = function(row,col){
	    	var caseType = '';
	    	if(row.entity.CAP_Primary_Case != undefined){
	    		caseType = row.entity.CAP_Primary_Case;
	    	}
	    	if(row.entity.CAP_Case != undefined){
	    		caseType = row.entity.CAP_Case;
	    	}
	    	if(row.entity.BEMS_Case != undefined){
	    		caseType = row.entity.BEMS_Case;
	    	}
	    	if(row.entity.RRR_Case != undefined){
	    		caseType = row.entity.RRR_Case;
	    	}
	    	
				window.open('https://clpsvs.cloudapps.cisco.com/services/clip/main/transcation/'+caseType,'_blank'); 
				return caseType;
			
	    }
	    
	  /*  $scope.csgCAPLink = function(){
	    	window.open('https://tableau.cisco.com/#/site/CSG/views/EscalationsDashboard/OpenCAPs?:iid=2','_blank'); 
	    }*/
	    
	    /*function to format date*/
		$scope.closeChart = function() {
			modalInstance.dismiss('cancel');
		};
	    $scope.formatDate = function(date){
	    	if(date==""){
	    		return "";
	    	}else{
		    	var date = date.split('T')
		    	var date1 = new Date(date[0]);
		    	return(date1.getMonth() + 1) + '/' + date1.getDate() + '/' +  date1.getFullYear();
	    		
	    	}
	    	
	    }
		}]);

	});


