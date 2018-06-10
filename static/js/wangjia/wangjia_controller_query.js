//MVC的C
myApp.controller('queryForm', function ($scope, $http, myService, myFactory) {
    var result = function(){
        this.order = new order();
        this.ships = new Array();
    }
    $scope.wangjias = new Array();
    $scope.query = function () {
        this.shipDate = "",
        this.orderID = ""
    };
    $scope.queryData = function () {
        let delivery_API = document.location.origin + "/delivery/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        let ship_API = document.location.origin + "/shippment/" + moment($scope.query.shipDate).format('MMDD') + "_" + $scope.query.orderID;
        
        myService.getDataFromDB($http, delivery_API,function(response) {
            result.order = response;
            if (JSON.stringify(result.order) == "{}") {
                alert ("查詢不到資料! \n請檢查'配送日期'與'出貨單號'");
            } else {
                myService.getDataFromDB($http, ship_API, function (response) {
                    result.ships = response;
                    if (result.ships.length > 0) {
                        $scope.wangjias = myService.convertOrder2Wangjia(result.order, result.ships);
                        myFactory.data = $scope.wangjias;
                    } else {
                        alert("查詢不到資料! \n請檢查'配送日期'與'出貨單號'");
                    }
                });
            }
        });
    }
    
});

myApp.controller('resultForm', function ($scope, $http, myService, myFactory) {
    $scope.wangjias = myFactory;
});