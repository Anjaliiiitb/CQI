/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){
	app.controller("executiveViewFiltersCtrl", ['$scope','$location','globalService','$interval','executiveViewService','$timeout','$rootScope',
		function($scope,$location, globalService,$interval,executiveViewService,$timeout,$rootScope) {

		$scope.hideFilter = true;
		$scope.showFilter = false;
		$scope.showDetails = true;
		$scope.showPF= true;
		$scope.showPFDetails= false;
		$scope.selectedBu = false;
		$scope.selectedBe = false;
		$scope.backToBeBu=false;
		$scope.backToBseSeg=false;
		$scope.backToPin=false;
		 $scope.selectedParentValue = [];					// stores selected BSE/Segment for multiple selection
		 $scope.selectedChildValue = [];					// stores selected Pin/PF for multiple selection
		 $scope.selectedGrandChildValue = [];				// stores selected Product for multiple selection
		 
		 /* to restore selected values in filters */
		 if($location.search().Segment != undefined){
			 var seg =$location.search().Segment.split(',');
			 $scope.selectedParentValue = seg;
		 }
		 if($location.search().BSE != undefined){
			 var seg =$location.search().BSE.split(',');
			 $scope.selectedParentValue = seg;
		 }
		 if($location.search().Pin != undefined){
			 var seg =$location.search().Pin.split(',');
			 $scope.selectedChildValue = seg;
		 }
		 if(JSON.parse(localStorage.getItem("PF")) != undefined){
			 var seg = JSON.parse(localStorage.getItem("PF"));
			 $scope.selectedChildValue = seg;
		 }
			if(JSON.parse(localStorage.getItem("Product")) != undefined){
				 var seg = JSON.parse(localStorage.getItem("Product"));
				 $scope.selectedGrandChildValue = seg;
			 }
			if($location.search().BU != undefined && $location.search().Segment == undefined && $location.search().Pin == undefined){
				localStorage.removeItem("Product");
			}
		$scope.qbrDashboard = $location.url().indexOf("qbrDGMDashboard") > 0 ? true : false;
		$scope.tabCheckQBR = $location.url().indexOf("customer") > 0 ? true : false;
		var request ={};
		
		
		/*to get BE/BSE/PF from URL*/
		if($location.search().BU != undefined){
			$scope.selectedBu = true;
			$scope.multipleBSE =[];
			$scope.multiplePF =[];
			$scope.multiProduct =[];
			request.BU =  $location.search().BU
			$scope.BE = $location.search().BU;
			$scope.BSE = $location.search().Segment;
			$scope.PF = $location.search().Pin;
			$scope.Product = $location.search().Product;
			
			//$scope.placeholder = "Search Segment/Pin";
            //$scope.filterTitle = "Segment/Pin Filter";
			$scope.placeholder = $scope.qbrDashboard ? ($scope.tabCheckQBR ? "Search Segment/Pin" : "Search Segment") : "Search Segment/Pin";
			$scope.filterTitle = $scope.qbrDashboard ? ($scope.tabCheckQBR ? "Segment/Pin Filter" : "Segment Filter") : "Segment/Pin Filter"
		}else if($location.search().BE != undefined){
			$scope.selectedBe = true;
			request.BE =  $location.search().BE
			$scope.BE = $location.search().BE;
			$scope.BSE = $location.search().BSE;
			$scope.PF = $location.search().PF;
			$scope.placeholder = "Search BSE";
			$scope.filterTitle = "BSE Filter"
		}
		if($scope.BSE != null){
			  $scope.backToBeBu=true;
		  }
		  if($scope.PF != null){
			  $scope.backToBseSeg=true;
		  }
		  if($scope.Product != null){
			  $scope.backToPin=true;
		  }
		 
	$scope.multipleFilter = [];
		/* service for filters - BE/BSE and to pass BE/BU to the URL*/
		executiveViewService.getBUBEHier(request).success(function(res) {
			$scope.beFilterData = angular.copy(res.data);			// data for single selection
			if($location.search().BU != undefined){
				$scope.multipleFilter = res.data;					// data for multiple selection when BU is selected
			for(var i=0;i<res.data.length;i++){
				res.data[i].Selected = false;
				for(var j=0;j<res.data[i].PinPfdata.length;j++){
					res.data[i].PinPfdata[j].Selected = false;
					for(var k=0;k<res.data[i].PinPfdata[j].Pfs.length;k++){
						var ab = {};ab.Product = res.data[i].PinPfdata[j].Pfs[k];ab.Selected=false;   
						res.data[i].PinPfdata[j].Pfs[k] = ab;
					}
				}
			}
			
			
			if($scope.qbrDashboard && $scope.tabCheckQBR){
	          
	          var buVal = $location.search().BU;
	          var segmentVal = $location.search().Segment;
	          var pinVal = $location.search().Pin;
	          //var aCheck = $scope.multipleFilter;
	          for(var i = 0;i<$scope.multipleFilter.length;i++){
	            if($scope.multipleFilter[i].Segment == segmentVal){
	              $scope.multipleFilter[i].Selected = true;
	              for(var j=0;j<$scope.multipleFilter[i].PinPfdata.length;j++){
	                if(pinVal != undefined){
	                  var jk=pinVal.split(',')
	                  $scope.multipleFilter[i].PinPfdata[j].Selected = jk.indexOf($scope.multipleFilter[i].PinPfdata[j].Pin) >= 0 ? true : false;
	                }
	                  
	                for(var k=0;k<$scope.multipleFilter[i].PinPfdata[j].Pfs.length;k++){
	                  $scope.multipleFilter[i].PinPfdata[j].Pfs[k].Selected = false;
	                }
	              }
	            }
	          }
	       
	        } 
			
			}
			else if($location.search().BE != undefined){
				$scope.multipleFilterBE = angular.copy(res.data);  // data for multiple selection when BE is selected
			for(var i=0;i<res.data.length;i++){
				$scope.multipleFilterBE[i].Selected = false;
				for(var k=0;k<$scope.multipleFilterBE[i].PFs.length;k++){
						var ab = {};ab.Product = $scope.multipleFilterBE[i].PFs[k];ab.Selected=false;   
						$scope.multipleFilterBE[i].PFs[k] = ab;
					}
				
			}
			}
			if(globalService.beBUType == "BU"){
				if($location.search()['BU'] == undefined && $location.search()['BE'] == undefined)   /*if navigating from homepage*/
					$location.search('BU',globalService.groupName);
				else if($location.search()['BE'] != undefined)											/*if hitting the URL directly with some BE/BU*/
					$location.search('BE',$location.search().BE);
			}else if(globalService.beBUType == "BE"){
				if($location.search()['BE'] == undefined && $location.search()['BU'] == undefined)
					$location.search('BE',globalService.groupName);
				else if($location.search()['BU'] != undefined)
					$location.search('BU',$location.search().BU);
			}
		}).error(function(err) {
			$scope.navigateTo("errorPage");
		});
		/*to show PF level in SR */
		if(window.location.href.indexOf("executiveViewSR") != -1){
			 if($location.search().BE != undefined){
				 $scope.showPFDetails= true;
				$scope.placeholder = "Search BSE/PF";
			
			}
			
		}
		/*to show PF level in Escalation */
		if(window.location.href.indexOf("executiveViewEscalation") != -1){
			
			 if($location.search().BE != undefined){
				 $scope.showPFDetails= true;
				$scope.placeholder = "Search BSE/PF";
				$scope.filterTitle = "BSE/PF Filter"
			} else if($location.search().BU != undefined){
				 $scope.showProduct= true;
				 $scope.placeholder = "Search Segment/Pin/Product";
					$scope.filterTitle = "Segment/Pin/Product Filter"
				}
			
		}
		/*to show PF level in Escalation */
		if(window.location.href.indexOf("capMetrics") != -1 || window.location.href.indexOf("bemsMetrics") != -1 || window.location.href.indexOf("rrrMetrics") != -1 || window.location.href.indexOf("capPrimaryMetrics") != -1){
			 if($location.search().BU != undefined){
				 $scope.showProduct= true;
				 $scope.placeholder = "Search Segment/Pin/Product";
					$scope.filterTitle = "Segment/Pin/Product Filter"
				} else if($location.search().BE != undefined){
					 $scope.showPFDetails= true;
						$scope.placeholder = "Search BSE/PF";
						$scope.filterTitle = "BSE/PF Filter"
					
					}
			
		}
		/*to show PF level in NPS Summary */
		if(window.location.href.indexOf("npsSummary") != -1){
			
			 if($location.search().BE != undefined){
				 $scope.showPFDetails= true;
				$scope.placeholder = "Search BSE/PF";
				$scope.filterTitle = "BSE/PF Filter"
			}else if($location.search().BU != undefined){
				 $scope.showProduct= true;
				 $scope.placeholder = "Search Segment/Pin/Product";
					$scope.filterTitle = "Segment/Pin/Product Filter";
					if($location.search().Segment != undefined && ($location.search().Segment).indexOf(',') > -1)
						$scope.multipleBSE = ($location.search().Segment).split(",")
						if($location.search().Pin != undefined && $location.search().Pin.indexOf(',') > -1)
							$scope.multiplePF = ($location.search().Pin).split(",")
						if($location.search().Product != undefined && $location.search().Product.indexOf(',') > -1)
							$scope.multiProduct = ($location.search().Product).split(",")
					
				}
		}
		/* to show filter pop up*/
		$scope.showFilterFunc = function(){
			$scope.hideFilter = false;
			$scope.showFilter = true;
			$("body").addClass("modal-open");
		}

		/*to hide filter pop up*/
		$scope.hideFilterFunc = function(){
			$scope.hideFilter = true;
			$scope.showFilter = false;
			$("body").removeClass("modal-open");
		}


		/*to show the selected filters in URL (book marking)*/
		$scope.getSelectedBEBSE = function(selectedBseSeg,index,selectedPfPin,selectedProduct){
			//$scope.selectedBE = selectedBE;
			$("body").removeClass("modal-open");
			 
		  if(window.location.href.indexOf("capMetrics") != -1 || window.location.href.indexOf("bemsMetrics") != -1 || window.location.href.indexOf("rrrMetrics") != -1){
			   var currentPage = ''
				if(window.location.href.indexOf("capMetrics") != -1){
					currentPage = 'capMetrics';
				}
				if(window.location.href.indexOf("bemsMetrics") != -1){
					currentPage = 'bemsMetrics';
				}
				if(window.location.href.indexOf("rrrMetrics") != -1){
					currentPage = 'rrrMetrics';
				}
				var trendtype = $location.search().TrendType;
				if($location.search().BE != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined){
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BE='+$scope.BE+'&BSE='+selectedBseSeg+'&PF='+selectedPfPin,false);
					   return ;
					}
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined){
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BE='+$scope.BE+'&BSE='+selectedBseSeg,false);
						return ;
					}
					else{
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BE='+$scope.BE,false);
						return ;
					}
				}else if($location.search().BU != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined && selectedProduct != undefined){
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin+'&Product='+selectedProduct,false);
						return ;
					}else if(selectedBseSeg !=undefined && selectedPfPin != undefined && selectedProduct == undefined){
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin,false);
						return ;
					}else if(selectedBseSeg !=undefined && selectedPfPin == undefined && selectedProduct == undefined){
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BU='+$scope.BE+'&Segment='+selectedBseSeg,false);
						return ;
					}
					else{
						$scope.navigateTo(currentPage,false,'.htm?TrendType='+trendtype+'&BU='+$scope.BE,false);
						return ;
					}
				}
			}
			
			
			if($location.search().BE != undefined){
			if(selectedBseSeg !=undefined && selectedPfPin != undefined){
				$location.search({BE:$scope.BE,BSE:selectedBseSeg,PF:selectedPfPin})
			}else if(selectedBseSeg !=undefined && selectedPfPin == undefined){
				$location.search({BE:$scope.BE,BSE:selectedBseSeg,PF:null})
			}else{
				$location.search({BE:$scope.BE,BSE:null,PF:null})
			}
		}else if($location.search().BU != undefined){
			if(selectedBseSeg !=undefined && selectedPfPin != undefined && selectedProduct != undefined){
				$location.search({BU:$scope.BE,Segment:selectedBseSeg,Pin:selectedPfPin,Product:selectedProduct})
			}
			else if(selectedBseSeg !=undefined && selectedPfPin != undefined && selectedProduct == undefined){
				$location.search({BU:$scope.BE,Segment:selectedBseSeg,Pin:selectedPfPin,Product:null})
			}else if(selectedBseSeg !=undefined && selectedPfPin == undefined && selectedProduct == undefined){
				$location.search({BU:$scope.BE,Segment:selectedBseSeg,Pin:null,Product:null})
			}else{
				$location.search({BU:$scope.BE,Segment:null,Pin:null,Product:null})
			}
		}
			/*book marking for SR screen*/
			if(window.location.href.indexOf("executiveViewSR") != -1){
				if($location.search().BE != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined)
						$scope.navigateTo('executiveViewSR',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg+'&PF='+selectedPfPin,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined)
						$scope.navigateTo('executiveViewSR',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg,false);
					else
						$scope.navigateTo('executiveViewSR',false,'.htm?BE='+$scope.BE,false);
				}else if($location.search().BU != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined)
						$scope.navigateTo('executiveViewSR',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined)
						$scope.navigateTo('executiveViewSR',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg,false);
					else
						$scope.navigateTo('executiveViewSR',false,'.htm?BU='+$scope.BE,false);
				}
				
			}
			/*book marking for SR Details screen*/
			if(window.location.href.indexOf("escalationSRDetails") != -1){
				var bookmark = "&Case="+localStorage.getItem("Case")+"&Type="+localStorage.getItem("type");
				if($location.search().BE != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined)
						$scope.navigateTo('escalationSRDetails',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg+'&PF='+selectedPfPin+bookmark,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined)
						$scope.navigateTo('escalationSRDetails',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg+bookmark,false);
					else
						$scope.navigateTo('escalationSRDetails',false,'.htm?BE='+$scope.BE+bookmark,false);
				}else if($location.search().BU != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined)
						$scope.navigateTo('escalationSRDetails',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin+bookmark,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined)
						$scope.navigateTo('escalationSRDetails',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg+bookmark,false);
					else
						$scope.navigateTo('escalationSRDetails',false,'.htm?BU='+$scope.BE+bookmark,false);
				}
				localStorage.removeItem("type")
				localStorage.removeItem("Case")
			}

			/*book marking for Escalation screen*/
			if(window.location.href.indexOf("executiveViewEscalation") != -1){
				if($location.search().BE != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined)
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg+'&PF='+selectedPfPin,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined)
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BE='+$scope.BE+'&BSE='+selectedBseSeg,false);
					else
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BE='+$scope.BE,false);
				}else if($location.search().BU != undefined){
					if(selectedBseSeg !=undefined && selectedPfPin != undefined  && selectedProduct != undefined)
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin+'&Product='+selectedProduct,false);
					else if(selectedBseSeg !=undefined && selectedPfPin != undefined && selectedProduct == undefined)
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg+'&Pin='+selectedPfPin,false);
					else if(selectedBseSeg !=undefined && selectedPfPin == undefined && selectedProduct == undefined)
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$scope.BE+'&Segment='+selectedBseSeg,false);
					else
						$scope.navigateTo('executiveViewEscalation',false,'.htm?BU='+$scope.BE,false);
				}
				
			}
			
			if(window.location.href.indexOf("qbrDGMDashboard") != -1){
			  var splitUrl = window.location.href.split('?')[1];
			  var splitPage = splitUrl.split("&");
			  var params = $location.url().split("?")[1];
			  if(splitPage.includes("page=internal")){
			    params = "?page=internal&" + params;
			  }else if(splitPage.includes("page=customer")){
			    params = "?page=customer&" + params;
			  }else{
			    params = "?page=internal&" + params;
			  }
			  $scope.navigateTo('qbrDGMDashboard',false,'.htm'+params,false);
			}
			
			
		}
		   /*to go back to selected BE/BU when BSE/Segment is selected*/
        $scope.goBackToBEBU = function(level){
       	 if(level == 'Level1'){
       	 if($scope.BSE != 'undefined' || $scope.PF != 'undefined'){
       		 if($location.search().BU != undefined)
       			 $scope.$emit('navigateTo',{value:'executiveView',boolV:false,data:'.htm?BU='+$scope.BE ,boolVD:false });
       		else if($location.search().BE != undefined)
       		 $scope.$emit('navigateTo',{value:'executiveView',boolV:false,data:'.htm?BE='+$scope.BE ,boolVD:false });
       		} }
       	 else if(level == 'Level2'){
       		 if($scope.PF != 'undefined'){
       			 if($location.search().BU != undefined)
       				 $scope.$emit('navigateTo',{value:'executiveView',boolV:false,data:'.htm?BU='+$scope.BE+'&Segment='+$scope.BSE,boolVD:false });
             	 else  if($location.search().BE != undefined)
       				 $scope.$emit('navigateTo',{value:'executiveView',boolV:false,data:'.htm?BE='+$scope.BE+'&BSE='+$scope.BSE,boolVD:false });
            	}  
       	 }
        }
		/*to show single select in tree view for segment/bse*/
		$scope.showOnlyOne = function(index){
			$scope.index = index;
			$scope.curr = index;
			executiveEvent();
			if($scope.prevIndex == index){
				$scope.showDetails = !$scope.showDetails;
				return;
			}
			$scope.prevIndex = index ;
			if(!$scope.showDetails) {
				$scope.showDetails=!$scope.showDetails;
			}
			
		}
		/*to show single select in tree view for Pin level*/
		$scope.showOnlyOneBSE = function(index){
			$scope.indexBSE = index;
			$scope.currBSE = index;
			executiveEvent();
			if($scope.prevIndexBSE == index){
				$scope.showPF = !$scope.showPF;
				return;
			}
			$scope.prevIndexBSE = index ;
			if(!$scope.showPF) {
				$scope.showPF=!$scope.showPF;
			}
			
		}

		/*search functionality in filters*/
		$scope.showSearchedData = function(searchBE){
			if(searchBE.length !=0){
				$('.bseSubList').removeClass('hiddenExecutive');
				$('.beIcon').removeClass('closedExecutive');
				$('.beIcon').addClass('openExecutive');
				$('.pfList').removeClass('hiddenExecutive');
				$('.bseIcon').removeClass('closedExecutive');
				$('.bseIcon').addClass('openExecutive');
				$scope.showDetails = false;
				$scope.showPF= false;
			}
			else{
				$('.bseSubList').addClass('hiddenExecutive');
				$('.beIcon').addClass('closedExecutive');
				$('.beIcon').removeClass('openExecutive');
				$('.pfList').addClass('hiddenExecutive');
				$('.bseIcon').addClass('closedExecutive');
				$('.bseIcon').removeClass('openExecutive');
				$scope.showDetails = true;	
				$scope.showPF= true;
			}
		}

		/*filters with multiple selection*/
		$scope.selectedParent = function(parent,index,level,child,grandChild){
		  
		 
		  
		  
			if($location.search().BE != undefined)
				var parentLevel = parent.BSE;
			else if($location.search().BU != undefined)
				parentLevel = parent.Segment;
			if(level == "parent"){				// for segment/BSE level
				if($location.search().BE != undefined){
					if(parent.Selected == true){
					  if($scope.selectedParentValue.indexOf(parentLevel) == -1){$scope.selectedParentValue.push(parentLevel);}
						 	for(var j=0;j<parent.PFs.length;j++){
								 if($scope.selectedChildValue.indexOf(parent.PFs[j].Product) == -1){$scope.selectedChildValue.push(parent.PFs[j].Product)}
								 parent.PFs[j].Selected = true;
						}
					}else{
						$scope.selectedParentValue.splice($scope.selectedParentValue.indexOf(parentLevel),1);
						$scope.selectedChildValue = [];
							for(var j=0;j<parent.PFs.length;j++){
								parent.PFs[j].Selected = false;
							}
					}	
				}
				else if($location.search().BU != undefined){
				if(parent.Selected == true){					
				  if($scope.selectedParentValue.indexOf(parentLevel) == -1){$scope.selectedParentValue.push(parentLevel);}
					 for(var i=0;i<parent.PinPfdata.length;i++){				
					   if($scope.selectedChildValue.indexOf(parent.PinPfdata[i].Pin) == -1){$scope.selectedChildValue.push(parent.PinPfdata[i].Pin);}
						 parent.PinPfdata[i].Selected = true;
						 for(var j=0;j<parent.PinPfdata[i].Pfs.length;j++){
							 $scope.selectedGrandChildValue.push(parent.PinPfdata[i].Pfs[j].Product)
							 parent.PinPfdata[i].Pfs[j].Selected = true;
							 
						}
					 }
				}else{
					$scope.selectedParentValue.splice($scope.selectedParentValue.indexOf(parentLevel),1);
					$scope.selectedChildValue = [];
					$scope.selectedGrandChildValue = [];
					 for(var i=0;i<parent.PinPfdata.length;i++){
						 parent.PinPfdata[i].Selected = false;
						 for(var j=0;j<parent.PinPfdata[i].Pfs.length;j++){
							parent.PinPfdata[i].Pfs[j].Selected = false;
						}
					 }
					
				}	
			}
			}
			else if(level == "child"){ 				//for Pin/Pf level
				if($location.search().BE != undefined){
					if($scope.selectedChildValue.length !=0 && $scope.selectedChildValue.indexOf(child.Product) > -1){
						$scope.selectedChildValue.splice($scope.selectedChildValue.indexOf(child.Product), 1);
					}
					if(child.Selected == true && $scope.selectedChildValue.indexOf(child.Product) == -1){
					  if($scope.selectedChildValue.indexOf(child.Product) == -1){$scope.selectedChildValue.push(child.Product)}
						if($scope.selectedParentValue.indexOf(parentLevel) == -1){$scope.selectedParentValue.push(parentLevel);}
						parent.Selected = true;
					}
				}
				else if($location.search().BU != undefined){
					if($scope.selectedChildValue.length !=0 && $scope.selectedChildValue.indexOf(child.Pin) > -1){
						$scope.selectedChildValue.splice($scope.selectedChildValue.indexOf(child.Pin), 1);
						for(var i =0;i<child.Pfs.length;i++){
							child.Pfs[i].Selected = false;
								$scope.selectedGrandChildValue.splice($scope.selectedGrandChildValue.indexOf(child.Pfs[i].Product), 1);
						}
					}
					if(child.Selected == true && $scope.selectedChildValue.indexOf(child.Pin) == -1){
					  if($scope.selectedChildValue.indexOf(child.Pin) == -1){$scope.selectedChildValue.push(child.Pin)}
						if($scope.selectedParentValue.indexOf(parentLevel) == -1){$scope.selectedParentValue.push(parentLevel);}
						parent.Selected = true;
						for(var i =0;i<child.Pfs.length;i++){
							child.Pfs[i].Selected = true;
							$scope.selectedGrandChildValue.push(child.Pfs[i].Product);
						}
						
					}
				}
				
			}
			else if(level == "grandChild"){		// when product is selected for BU
				if($scope.selectedGrandChildValue.length !=0 && $scope.selectedGrandChildValue.indexOf(grandChild.Product) > -1){
					$scope.selectedGrandChildValue.splice($scope.selectedGrandChildValue.indexOf(grandChild.Product), 1);
				}
				if(grandChild.Selected == true && $scope.selectedGrandChildValue.indexOf(grandChild.Product) == -1){
					$scope.selectedGrandChildValue.push(grandChild.Product)
					if($scope.selectedChildValue.indexOf(child.Pin) == -1){$scope.selectedChildValue.push(child.Pin)}
					child.Selected = true;
					if($scope.selectedParentValue.indexOf(parentLevel) == -1){$scope.selectedParentValue.push(parentLevel);}
					parent.Selected = true;
				}
				
			}
			
			 
			
			if($location.search().BE != undefined)
				localStorage.setItem("PF",JSON.stringify($scope.selectedChildValue));				// stores multiple selected PF when BE is selected
			else if($location.search().BU != undefined)
				localStorage.setItem("Product",JSON.stringify($scope.selectedGrandChildValue));		// stores multiple selected Product when BU is selected
			

              
              if($scope.qbrDashboard && $scope.tabCheckQBR){
                //var aCheck = $scope.multipleFilter;
                for(var i = 0;i<$scope.multipleFilter.length;i++){
                  if($scope.multipleFilter[i].Segment != parent.Segment){
                    $scope.multipleFilter[i].Selected = false;
                    for(var j=0;j<$scope.multipleFilter[i].PinPfdata.length;j++){
                      $scope.multipleFilter[i].PinPfdata[j].Selected = false;
                      for(var k=0;k<$scope.multipleFilter[i].PinPfdata[j].Pfs.length;k++){
                        $scope.multipleFilter[i].PinPfdata[j].Pfs[k].Selected = false;
                      }
                    }
                  }
                }
             
              } 
           
		}
		
		
		
		/* to apply multiple filters*/
		 $scope.applyFilters = function(){
			 $("body").removeClass("modal-open");
		   var pageName = "";
		   if($scope.qbrDashboard && $scope.tabCheckQBR){
		     pageName = "qbrDGMDashboard";
		       var aCheck = $scope.multipleFilter;
		       $scope.selectedParentValue = [];
		       $scope.selectedChildValue = [];
	            for(var i = 0;i<aCheck.length;i++){
	              if(aCheck[i].Selected == true){
	                if($scope.selectedParentValue.indexOf(aCheck[i].Segment) == -1){$scope.selectedParentValue.push(aCheck[i].Segment);}
	                for(var j=0;j<aCheck[i].PinPfdata.length;j++){
	                  if(aCheck[i].PinPfdata[j].Selected == true) 
	                    if($scope.selectedChildValue.indexOf(aCheck[i].PinPfdata[j].Pin) == -1){$scope.selectedChildValue.push(aCheck[i].PinPfdata[j].Pin);}
	                }
	              }
	            }
		     if($location.search().BE != undefined){
               if($scope.selectedParentValue.length != 0)
                         $scope.navigateTo(pageName,false,'.htm?page=customer&BE='+$scope.BE+'&BSE='+$scope.selectedParentValue.toString(),true);
                  else 
                         $scope.navigateTo(pageName,false,'.htm?page=customer&BE='+$scope.BE,true);
              }else if($location.search().BU != undefined){
                  if($scope.selectedChildValue.length !=0)
                         $scope.navigateTo(pageName,false,'.htm?page=customer&BU='+$scope.BE+'&Segment='+$scope.selectedParentValue.toString()+'&Pin='+$scope.selectedChildValue.toString(),true);
                      else if($scope.selectedParentValue.length != 0 && $scope.selectedChildValue.length == 0 )
                             $scope.navigateTo(pageName,false,'.htm?page=customer&BU='+$scope.BE+'&Segment='+$scope.selectedParentValue.toString(),true);
                      else {
                          $scope.navigateTo(pageName,false,'.htm?page=customer&BU='+$scope.BE,true);
                             
                      }
              }
		     
		   }else{
		     pageName = "npsSummary";
		     if($location.search().BE != undefined){
               if($scope.selectedParentValue.length != 0)
                         $scope.navigateTo(pageName,false,'.htm?BE='+$scope.BE+'&BSE='+$scope.selectedParentValue.toString()+'&nps='+makeid(),true);
                  else 
                         $scope.navigateTo(pageName,false,'.htm?BE='+$scope.BE+'&nps='+makeid(),true);
              }else if($location.search().BU != undefined){
                  if($scope.selectedChildValue.length !=0)
                         $scope.navigateTo(pageName,false,'.htm?BU='+$scope.BE+'&Segment='+$scope.selectedParentValue.toString()+'&Pin='+$scope.selectedChildValue.toString()+'&nps='+makeid(),true);
                      else if($scope.selectedParentValue.length != 0 && $scope.selectedChildValue.length == 0 )
                             $scope.navigateTo(pageName,false,'.htm?BU='+$scope.BE+'&Segment='+$scope.selectedParentValue.toString()+'&nps='+makeid(),true);
                      else {
                          $scope.navigateTo(pageName,false,'.htm?BU='+$scope.BE+'&nps='+makeid(),true);
                             
                      }
              }
		   }
		   //$scope.multipleFilter
		   
			
			
			//window.location.reload(true);
		  }
		 function makeid() {
		   var text = "";
		   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		   for (var i = 0; i < 5; i++)
		     text += possible.charAt(Math.floor(Math.random() * possible.length));

		   return text;
		 }
		 /*to clear the selected filter*/
		 $scope.clearFilters = function(){
			 $("body").removeClass("modal-open");
			 $scope.selectedParentValue = [];
				$scope.selectedChildValue = [];
				$scope.selectedGrandChildValue = [];
				if($location.search().BE != undefined){
					  $scope.navigateTo('npsSummary',false,'.htm?BE='+$scope.BE,true);
				 }else if($location.search().BU != undefined){
					 $scope.navigateTo('npsSummary',false,'.htm?BU='+$scope.BE,true);
				 }
			//	window.location.reload(true);
		 }
		 
		//stickyFilter
			function executiveEvent(){
			  angular.element(document.querySelector('.executionViewFilters')).bind('scroll', function(){
		            myFunction();
		            console.log("Hi");
		         })
			}
			var header = document.getElementById("appFilterHeader");
			function myFunction() {
			  if ($(".executionViewFilters").scrollTop() >= 55) {
			    $("#appFilterHeader").addClass("stickyFilter");
			  } else {
			    $("#appFilterHeader").removeClass("stickyFilter");
			  }
			}
			//stickyFilterEnd
		//integrating spark with CQL CODE starts here
		$scope.int_spark=function(be,bse){
			$scope.$emit('showLoader',true);
		/*	if(bse!=undefined){
				var beName=bse;
			}else{
				var beName=be;
			}*/
			var filterObj={};
			if(globalService.beBUType == "BE") {
				filterObj["BE"] = $location.search().BE;
				filterObj["BSE"] = $location.search().BSE;
		          } else if(globalService.beBUType == "BU") {
			    	  filterObj["BU"] = $location.search().BU;
			    	  filterObj["Segment"] = $location.search().Segment;
		          }
			//var buName=userAndBuName.split("(")[1].split(")")[0];
			var userId=globalService.userId;
			//asking user to enter user names to be added to the spark room
			executiveViewService.createSparkRoom(filterObj,userId).success(function(data){
				$scope.$emit('showLoader',false);
				if(data.errors!=null){
					//console.log("room  not created created ");
				}else{
					if(data.data=="RoomCreatedMemberAdded"){
						$scope.$emit('addAlert', {Message: "A new room is created!",Type: 'success'});
						window.open('https://web.ciscospark.com', "_blank");
					}
					else if(data.data=="MemberAdded"){
						$scope.$emit('addAlert', {Message: "Room Already Existed! You have been added to the room",Type: 'success'});
						window.open('https://web.ciscospark.com', "_blank");
					}else if(data.data=="AlreadyPresent"){
						$scope.$emit('addAlert', {Message: "You are already the member of the room!",Type: 'success'});
						window.open('https://web.ciscospark.com', "_blank");
					}
				}
			}).error(function(err) {
				console.log("error"+err);
			});
		}
	}]);
});

