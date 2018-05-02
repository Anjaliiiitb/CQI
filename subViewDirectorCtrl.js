/* AMD format. Add dependencies like services, directives in the [] */
define(['app'], function(app){

app.controller("subViewDirectorCtrl", ['$scope', '$http', '$interval', 'uiGridTreeViewConstants', function($scope, $http, $interval, uiGridTreeViewConstants) {

    $scope.gridOptions = {
        enableSorting: false,
        enableFiltering: false,
        showTreeExpandNoChildren: true,
        headerTemplate: 'html/views/headTemp.html',
        category: [
            { name: 'column1', displayName: 'Column 1', visible: true, showCatName: false },
            { name: 'matricsName', displayName: 'S1', visible: true, showCatName: true },
            { name: 'matricsName', displayName: 'S2', visible: true, showCatName: true },

        ],

        enableGridMenu: false,
        multiSelect: true,
        columnDefs: [
            { name: 'ProductList', category: "column1", enableColumnMenu: false, width: 250, cellTemplate: 'html/templates/dropDownTemp.html', },
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
        "children": [{
            "id": 2,
            "parentId": 1,
            "ProductList": "rajtanej",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "Second Child Level",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "jmaiya",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "raosudhi",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "bnanjund",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, ]
    }, {
        "id": 1,
        "ProductList": "CSG Overall View 02",
        "Incoming": "214",
        "Backlog": "100",
        "Disposed": "114",
        "children": [{
            "id": 2,
            "parentId": 1,
            "ProductList": "rajtanej",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "Second Child Level",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "jmaiya",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "raosudhi",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, {
            "id": 2,
            "parentId": 1,
            "ProductList": "bnanjund",
            "Incoming": "214",
            "Backlog": "100",
            "Disposed": "114",
            "children": [{
                "id": 4,
                "parentId": 3,
                "ProductList": "jmaiya",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "zhichen",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "jiamzhan",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "vdatar",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "ymovassa",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }, {
                "id": 4,
                "parentId": 3,
                "ProductList": "liagao",
                "Incoming": "214",
                "Backlog": "100",
                "Disposed": "114",
                "children": []
            }]
        }, ]
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

}]);
});