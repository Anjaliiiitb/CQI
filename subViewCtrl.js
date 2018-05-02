/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){

app.controller("subViewCtrl", ['$scope', '$http', '$interval', 'uiGridTreeViewConstants', '$uibModal', '$log', '$document', 
                               function($scope, $http, $interval, uiGridTreeViewConstants, $uibModal, $log, $document) {
    $scope.showGraph = function() {
        $scope.graphWrapper = !$scope.graphWrapper;
    };
    $scope.gridOptions = {
        enableSorting: false,
        enableFiltering: false,
        showTreeExpandNoChildren: true,
        headerTemplate: 'html/views/headTemp.html',
        enableExpandableRowHeader: false,
        category: [
            { name: 'column1', displayName: 'Column 1', visible: true, showCatName: false },
            { name: 'matricsName', displayName: 'S1', visible: true, showCatName: true },

        ],

        enableGridMenu: false,
        multiSelect: true,
        columnDefs: [
            { name: 'ProductList', category: "column1", enableColumnMenu: false, width: 250, cellTemplate: 'html/templates/dropDownTemp.html' },
            { name: 'Incoming', category: 'matricsName', enableColumnMenu: false, width: 213 },
            { name: 'Backlog', category: "matricsName", enableColumnMenu: false, width: 213 },
            { name: 'Disposed', category: "matricsName", enableColumnMenu: false, width: 213 },
        ],


    };

    $scope.gridOptions.enableHorizontalScrollbar = 0;

    var data = [{
        "id": 1,
        "ProductList": "CSG Overall View",
        "Incoming": "214",
        "Backlog": "100",
        "Disposed": "114",
        "children": []

    }];

    var writeoutNode = function(childArray, currentLevel, dataArray) {
        childArray.forEach(function(childNode) {
            if (childNode.children.length > 0) {
                childNode.$$treeLevel = currentLevel;
            }
            dataArray.push(childNode);
            writeoutNode(childNode.children, currentLevel + 1, dataArray);
        });
    };

    $scope.gridOptions.data = [];
    writeoutNode(data, 0, $scope.gridOptions.data);


    $scope.animationsEnabled = true;

    $scope.open = function(size, parentSelector) {

        var parentElem = parentSelector ?
            angular.element($document[0].querySelector('.modal-demo ' + parentSelector)) : undefined;
        var modalInstance = $uibModal.open({
            animation: $scope.animationsEnabled,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'myModalContent.html',
            controller: 'ModalInstanceCtrl',

            size: size,
            appendTo: parentElem,
            resolve: {
                items: function() {
                    return $scope.items;
                }
            }
        });
    };

}]);

		
});