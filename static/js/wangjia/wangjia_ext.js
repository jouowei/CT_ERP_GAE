//所有旺家service裡面的程式都會放在這裡

//Excel資料處理
function orderBuilder(rawContent){
    var dirtys = new Array();
    var arrOrderIDs = []; //儲存OrderID
    var arrNewItems = []; //暫存找不到的產品
	rawContent.forEach(data => {
        var dirtydata = new wangjia();
        var isEmpty = false;
        
        //排掉原檔因排版而出現的空行，以及行數不存在的錯誤
        for (var i = 0; i < columnKeys.length; i++) {
            if (data[columnKeys[i]] === "null" || data[columnKeys[i]] === null || typeof data[columnKeys[i]] === "undefined") {
                isEmpty = true;
            }
        }
        
        //存成wangjia格式
        if (!isEmpty) {
            dirtydata.order_ID = moment(data["交貨日期"]).format('MMDD') + "_" + data["交貨單號"].toString();
            dirtydata.ship_ID.push(data["銷售單/調撥單號"].toString());
            dirtydata.pickupdate = moment(data["交貨單建立日期"]).format('YYYY-MM-DD');
            dirtydata.shipdate = moment(data["交貨日期"]).format('YYYY-MM-DD');
            dirtydata.clientname = data["收貨人名稱"].toString();
            dirtydata.contact_info = data["收貨地址"].toString();
            dirtydata.itemID = data["物料"].toString();
            dirtydata.itemName = data["說明"].toString();
            dirtydata.good_pirce = data["金額(未稅)"].toString();
            dirtydata.good_size = parseFloat(data["單品項才數"].toString()) * parseFloat(data["交貨數量"].toString());
            dirtydata.shipUnits = parseFloat(data["交貨數量"].toString());

            //針對縣市做字串處理
            var strCity = findObjInArray(["高雄市", "台南市", "高雄縣", "台南縣", "屏東", "屏縣", "高市", "高縣", "南市", "南縣"], data["收貨地址"]);
            var strDistrict = "";
            if (strCity === "屏東") {   //屏東縣XX鎮 or XX鄉 or XX市
                strDistrict = findObjInArray(["鄉", "鎮", "市"], data["收貨地址"]);
                strCity += "縣";
                dirtydata.ship_area = strCity;
            } else if (strCity === "屏縣") { //屏縣XX鎮 or XX鄉 or XX市
                strDistrict = findObjInArray(["鄉", "鎮", "市"], data["收貨地址"]);
                dirtydata.ship_area = "屏東縣";
            } else if (strCity.indexOf("高雄") > -1 || strCity.indexOf("台南") > -1) { //高雄縣/市 XX鎮 or XX鄉 or XX區
                strDistrict = findObjInArray(["鄉", "鎮", "區"], data["收貨地址"]);
                dirtydata.ship_area = strCity.replace("縣","市");
            } else if (findObjInArray(["高市", "高縣"], strCity).length > 0) { //高市 XX鎮 or XX鄉 or XX區
                strDistrict = findObjInArray(["鄉", "鎮", "區"], data["收貨地址"]);
                dirtydata.ship_area = "高雄市";
            } else if (findObjInArray(["南市", "南縣"], strCity).length > 0) { //南市 XX鎮 or XX鄉 or XX區
                strDistrict = findObjInArray(["鄉", "鎮", "區"], data["收貨地址"]);
                dirtydata.ship_area = "台南市";
            } else {
                ///不處理高雄台南屏東以外地區的送貨單
                return;
            }
            if (strDistrict.length > 0) {
                dirtydata.ship_district = data["收貨地址"].substring(
                    data["收貨地址"].indexOf(strCity) + strCity.length, data["收貨地址"].indexOf(strDistrict)
                );
                dirtydata.ship_district += "區";
            };
            dirtys.push(dirtydata);	
        }
    });

    //把多筆整合成一筆
    var cleans = new Array();
    var singleOrder = 0;

    dirtys.forEach(function(dirtydata){
        var single_order = new wangjia();
        var cleandata = new wangjia();
        var order_CBM = 0;
        var order_price = 0;
        var order_returnPrice = 0;
        
        //多筆詳細資料 -> 以訂單為單位 -> 計算運費 & 材積數            
        //如果order_ID還沒處理過，開始計算運費
        if (!arrOrderIDs.filter(function (e) {
                return e.order_ID === dirtydata.order_ID;
            }).length > 0) {
            // 把整筆訂單拉出來
            single_order = dirtys.filter(
                function (x) {
                    return x.order_ID === dirtydata.order_ID;
                }
            );
            cleandata = single_order[0];
            //找出送貨點類型 (倉庫，工廠或其他)
            for (i = 0; i < wangjia_clienttype.length; i++) {
                if (dirtydata.clientname.indexOf(wangjia_clienttype[i]["keyword"]).toString() > -1) {
                    cleandata.client_type = wangjia_clienttype[i]["type"];
                    break;
                } else {
                    cleandata.client_type = "other";
                    break;
                }
            }
            //計算材積
            single_order.forEach(ship => {
                var boolIsDrink = false;
                //確認是否是飲料，如果是就找出價格跟材積
                if (findObjInArray(wangjiaDrinkKeyword, ship.itemName).length > 0) {
                    for (i = 0; i < wangjia_beverage_lookup.length; i++) {
                        if (ship.itemID === wangjia_beverage_lookup[i].id) {
                            ship.good_size = wangjia_beverage_lookup[i].weightPerUnit * ship.shipUnits;
                            order_CBM += ship.good_size;
                            order_price += calTotalPrice(ship.good_size, cleandata.client_type, "liquid", ship.ship_area);
                            order_returnPrice += wangjia_beverage_lookup[i].reverseShipPrice;
                            boolIsDrink = true;
                            break;
                        }
                    }
                    if (!boolIsDrink) {
                        var boolNewDrink = false;
                        if (arrNewItems.length == 0){
                            boolNewDrink = true;
                        } else {
                            for (i = 0; i < arrNewItems.length; i++) {
                                if (arrNewItems[i].id === ship.itemID) {
                                    boolNewDrink = false;
                                    break;
                                } else {
                                    boolNewDrink = true;
                                }
                            }
                        }
                        if (boolNewDrink) {
                            prompt('找到新的飲料品項，請與旺家確認:', '編號:' + ship.itemID + ' 品名:' + ship.itemName);
                            arrNewItems.push({
                                id: ship.itemID,
                                name: ship.itemName
                            });
                        }
                    }
                } else {
                    //確認是否是飲料，不是的話就沿用rawdata材積
                    order_CBM += parseFloat(ship.good_size);
                    order_price += calTotalPrice(ship.good_size, cleandata.client_type, "dry", ship.ship_area)
                }
            });
            cleandata.good_size = order_CBM;
            //計算運費
            //比對looluptable，不到最低價以最低價計 (此功能未確定前先不加入)
            cleandata.delivery_fee = order_price;
            cleans.push(cleandata);
        } else {
            for (i = 0; i < cleans.length; i++) {
                if (cleans[i].order_ID === dirtydata.order_ID) {
                    for (j = 0; j < cleans[i].ship_ID.length; j++){
                        if (cleans[i].ship_ID[j] === dirtydata.ship_ID[0]) {
                            break;
                        }
                        cleans[i].ship_ID.push(dirtydata.ship_ID[0]);
                    }
                }
            }
        }
        arrOrderIDs.push({
            order_ID: dirtydata.order_ID,
            ship_ID: dirtydata.ship_ID[0]
        });
    });
    return cleans;
	// return JSON.parse(JSON.stringify(cleans));
}

///旺家運費計算公式： 判斷類型(乾貨/液體) => 判斷是指定倉庫，工廠或是其他地方 => 地區(台南/高雄/屏東) => 依照材積計算出對應的價格
function calTotalPrice(unit, clientType, cargo, area) {
    var arrX = wangjia_shipfee.filter(function (e) {
        return (e.shipto === area && e.type === clientType && e.cargo === cargo);
    })
    for (i = 0; i < arrX.length; i++) {
        return Math.round(arrX[i].unitprice * unit);
    }
}

//油價計算公式
function getDieselDiscount ($http,API = "") {
    var result = { 
        price: "",      //油價
        initRate: "",   //油價係數 (未調整)
        rate: ""        //油價係數 (調整後)
    };
    $http({
            method: 'GET',
            url: API
        })
        .then(function (response) {
            if (response.status === 200) {
                let dieselPriceToday = parseInt(response.data);
                for (i = 0; i < wangjia_dieselDiscount.length; i++) {
                    if (wangjia_dieselDiscount[i].maxDieselPrice >= parseInt(response.data)) {
                        let discountRate = wangjia_dieselDiscount[i].discount;
                        result.rate = discountRate;
                        result.initRate = discountRate;
                        result.price = dieselPriceToday;
                        break;
                    }
                }
            } else {
                throw '油價資料來源出錯 \n' + response.data;
            }
        },
        function errorCallback(response) {
            alert('油價伺服器錯誤 \n' + response.data);
        });
    return result;
}

function getDataFromDB($http, API = "", callback) {
    $http({
            method: 'GET',
            url: API
        })
        .then(function successCallback(response) {
                if (response.status === 200) {
                    callback(response.data);
                } else {
                    alert('資料來源出錯! \n' + response.data);
                }
            },
            function errorCallback(response) {
                alert('伺服器錯誤! \n' + response.data);
            });
}

//把order轉為wangjia格式
function convert_DbData2Wangjia(order = new order(), ships = new ships()){
    var objWangjia = new wangjia();
    var arrWangjia = new Array();

    for (j = 0; j < ships.length; j++) {
        if (order.order_ID.length > 0) {
            const objOrderKeys = Object.keys(order);
            for (i = 0; i < objOrderKeys.length; i++) {
                if (typeof objWangjia[objOrderKeys[i]] !== "undefined") {
                    objWangjia[objOrderKeys[i]] = order[objOrderKeys[i]];
                }
            }
        }
        const objShipKeys = Object.keys(ships[j]);
        for (i = 0; i < objShipKeys.length; i++) {
            if (typeof objWangjia[objShipKeys[i]] !== "undefined") {
                objWangjia[objShipKeys[i]] = ships[j][objShipKeys[i]];
            }
        }
        arrWangjia.push(objWangjia);
    }
    return arrWangjia;
}