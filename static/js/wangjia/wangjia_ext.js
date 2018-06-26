//所有旺家service裡面的程式都會放在這裡

//Excel資料處理
function orderBuilder(unparsedData) {
    //檢查是不是配送單格式
    let fileType = {
        add: false,
        return: false,
        return_PXmart: false
    }
    var rawContent;
    //依照定義的欄位格式轉出標題與內容
    for (let x = 0; x < 5; x++){
        const headerNames = XLSX.utils.sheet_to_json(unparsedData, {header: 1})[x];
        if (findArrInArray(add_columnKeys, headerNames)) {
            fileType.add = true;
        } else if (findArrInArray(return_columnKeys, headerNames)) {
            fileType.return = true;
        } else if (findArrInArray(return_PXmart_columnKeys, headerNames)) {
            fileType.return_PXmart = true;
        }
        if (fileType.add || fileType.return || fileType.return_PXmart) {
            rawContent = XLSX.utils.sheet_to_json(unparsedData, {
                header: headerNames
            });
            //移除標頭
            rawContent.splice(0, x+1);
            break;
        }
    }

    //清理資料，並將資料轉成可以顯示在view上的格式
    var dirtys = new Array();
	rawContent.forEach(data => {
        var dirtydata = new wangjia();
        isEmpty = false;
        //排掉原檔因排版而出現的空行，以及行數不存在的錯誤
        for (let i = 0; i < add_columnKeys.length; i++) {
            if (fileType.add && (data[add_columnKeys[i]] === "null" || data[add_columnKeys[i]] === null || typeof data[add_columnKeys[i]] === "undefined")) {
                isEmpty = true;
            } 
            if (fileType.return && (data[return_columnKeys[i]] === "null" || data[return_columnKeys[i]] === null || typeof data[return_columnKeys[i]] === "undefined")) {
                isEmpty = true;
            }
            if (fileType.return_PXmart && (data[return_PXmart_columnKeys[i]] === "null" || data[return_PXmart_columnKeys[i]] === null || typeof data[return_PXmart_columnKeys[i]] === "undefined")) {
                isEmpty = true;
            }
        }
        
        //如果是配送單格式，就存成wangjia準備回傳到view
        if (!isEmpty) {
            //新增配送
            if (fileType.add && data["交易類型"].toString() == "銷") {
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
                dirtydata.data_type = "銷貨";
                //針對縣市做字串處理
                let location = getCityAndDistrict(data["收貨地址"]);
                if (typeof location == "undefined"){
                    return;
                }
                dirtydata.ship_area = location.city;
                dirtydata.ship_district = location.district;
                dirtys.push(dirtydata);
            //一般退貨
            } else if (fileType.return && data["交易類型"].toString() == "退") {
                dirtydata.order_ID = moment(data["發貨過帳日期"]).format('MMDD') + "_" + data["交貨單號碼"].toString();
                dirtydata.ship_ID.push(data["訂單號碼"].toString());
                dirtydata.pickupdate = moment(data["交貨單創建日期"]).format('YYYY-MM-DD');
                dirtydata.shipdate = moment(data["發貨過帳日期"]).format('YYYY-MM-DD');
                dirtydata.clientname = data["收貨人名稱"].toString();
                dirtydata.contact_info = data["儲存地點描述"].toString();
                dirtydata.itemID = data["物料代碼"].toString();
                dirtydata.itemName = data["物料名稱"].toString();
                dirtydata.good_pirce = data["發貨過帳金額"].toString();
                dirtydata.shipUnits = parseFloat(data["發貨過帳數量"].toString());
                dirtydata.comment = data["訂貨原因"].toString() + "/n" + data["銷售備註"].toString();
                //目前採用統一價，以後分區域時，需要要求旺家提供客戶地址，以計算金額
                dirtydata.ship_area = "高雄市";
                dirtydata.data_type = "退貨";
                dirtys.push(dirtydata);
            //全聯軍公教退貨
            } else if (fileType.return_PXmart && data["交易類型"].toString() == "退") {
                dirtydata.order_ID = moment(data["需求日期"]).format('MMDD') + "_" + data["交貨單號"].toString();
                dirtydata.ship_ID.push(data["調撥單號"].toString());
                dirtydata.pickupdate = moment(data["需求日期"]).format('YYYY-MM-DD');
                dirtydata.shipdate = moment(data["需求日期"]).format('YYYY-MM-DD');
                dirtydata.clientname = data["客戶名稱"].toString();
                dirtydata.itemID = data["物料代碼"].toString();
                dirtydata.itemName = data["物料名稱"].toString();
                dirtydata.good_pirce = data["發貨過帳金額"].toString();
                dirtydata.shipUnits = parseFloat(data["發貨過帳數量"].toString());
                dirtydata.comment = data["調撥單表頭內文"].toString();
                //目前採用統一價，以後分區域時，需要要求旺家提供客戶地址，以計算金額
                dirtydata.ship_area = "高雄市";
                dirtydata.data_type = "退貨";
                dirtys.push(dirtydata);
            }
        }
    });
    return calculate_Price_Size(dirtys);
}

//計算材積與價格
function calculate_Price_Size(dirtys = new Array()) {
    //把多筆整合成一筆
    var cleans = new Array();
    var singleOrder = 0;
    var arrOrderIDs = []; //儲存OrderID
    var arrNewItems = []; //暫存找不到的產品

    dirtys.forEach(function (dirtydata) {
        var single_order = new wangjia();
        var cleandata = new wangjia();
        var order_CBM = 0;
        var order_price = 0;
        var order_returnPrice = 0; //退貨價格

        //多筆詳細資料 -> 以訂單為單位 -> 計算運費 & 材積數            
        //如果order_ID還沒處理過，開始計算運費
        if (!arrOrderIDs.filter(function (e) {
                return e.order_ID === dirtydata.order_ID;
            }).length > 0) {
            //A.把整筆order拉出來
            single_order = dirtys.filter(
                function (x) {
                    return x.order_ID === dirtydata.order_ID;
                }
            );
            cleandata = single_order[0];
            //B.找出送貨點類型 (倉庫，工廠或其他)
            for (i = 0; i < wangjia_clienttype.length; i++) {
                if (dirtydata.clientname.indexOf(wangjia_clienttype[i]["keyword"]).toString() > -1) {
                    cleandata.client_type = wangjia_clienttype[i]["type"];
                    break;
                } else {
                    cleandata.client_type = "other";
                }
            }
            //注意：退貨單不計算材積與價格(將由使用者於介面手動輸入)
            if (dirtydata.data_type == "銷貨") {
            //C.計算材積與價格 (飲料:重量材，其他：體積材)
                single_order.forEach(ship => {
                    var boolIsDrink = false;
                    //確認是否是飲料，如果是就找出價格跟材積
                    if (findObjInArray(wangjiaDrinkKeyword, ship.itemName).length > 0) {
                        for (i = 0; i < wangjia_beverage_lookup.length; i++) {
                            if (ship.itemID.trim() === wangjia_beverage_lookup[i].id) {
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
                            if (arrNewItems.length == 0) {
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
            }
            //排除運費與材積數為0的單據
            if(order_CBM > 0 && order_price > 0){
                cleandata.good_size = order_CBM;
                //計算運費
                //比對looluptable，不到最低價以最低價計 (此功能未確定前先不加入)
                cleandata.delivery_fee = order_price;
                cleans.push(cleandata);
            }
        } else {
        //如果order ID已經處理過，將ship ID記為已處理
            for (i = 0; i < cleans.length; i++) {
                if (cleans[i].order_ID === dirtydata.order_ID) {
                    for (j = 0; j < cleans[i].ship_ID.length; j++) {
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

/*
//把order轉為wangjia格式
function convert_DbData2Wangjia(order = new order(), ships = new ships()){
    let arrWangjia = new Array();
    let specialKey = ["order_ID","ship_ID","delivery_fee","good_size","comment"]
    for (j = 0; j < ships.length; j++) {
        let objWangjia = new wangjia();
        if (order.order_ID.length > 0) {
            const objOrderKeys = Object.keys(order);
            for (i = 0; i < objOrderKeys.length; i++) {
                if (typeof objWangjia[objOrderKeys[i]] !== "undefined") {
                    if (findObjInArray(specialKey, objOrderKeys[i]).length > 0){
                        objWangjia.initOrder[objOrderKeys[i]] = order[objOrderKeys[i]];
                    }
                    objWangjia[objOrderKeys[i]] = order[objOrderKeys[i]];
                }
            }
        }
        const objShipKeys = Object.keys(ships[j]);
        for (k = 0; k < objShipKeys.length; k++) {
            if (typeof objWangjia[objShipKeys[k]] !== "undefined") {
                if (ships[j][objShipKeys[k]].length > 0) {
                    objWangjia[objShipKeys[k]] = ships[j][objShipKeys[k]];
                }
            }
        }
        arrWangjia.push(objWangjia);
    }
    return arrWangjia;
}
*/
