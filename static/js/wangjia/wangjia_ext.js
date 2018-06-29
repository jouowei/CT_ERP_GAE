//所有旺家service裡面的程式都會放在這裡

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
                //排除運費與材積數為0的單據
                if(order_CBM > 0 && order_price > 0){
                    cleandata.good_size = order_CBM;
                    //計算運費
                    //比對looluptable，不到最低價以最低價計 (此功能未確定前先不加入)
                    cleandata.delivery_fee = order_price;
                    cleans.push(cleandata);
                }
            } else {
                cleandata.good_size = 0;
                cleandata.delivery_fee = 0;
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
    result.price = getDieselPriceToday($http,API);
    for (i = 0; i < wangjia_dieselDiscount.length; i++) {
        if (wangjia_dieselDiscount[i].maxDieselPrice >= parseInt(result.price)) {
            let discountRate = wangjia_dieselDiscount[i].discount;
            result.rate = discountRate;
            result.initRate = discountRate;
            break;
        }
    }
    return result;
}

function handleDataToWangjia(response, ev, $http, $mdDialog) {
    let rawdata = new wangjia();
    rawdata.order_ID = response.order_ID;
    rawdata.clientname = response.clientname;
    rawdata.delivery_date = response.delivery_date;
    rawdata.delivery_fee = response.delivery_fee;
    rawdata.good_size = response.good_size;
    rawdata.comment = response.comment;
    rawdata.initOrder = {
        order_ID: response.order_ID,
        ship_ID: "",
        delivery_fee: response.delivery_fee,
        good_size: response.good_size,
        comment: response.comment
    }
    let ship_API = document.location.origin + "/shippment/" + response.order_ID;
    getDataFromDB($http, ship_API, function (ships) {
        if (JSON.stringify(ships) !== "{}" || JSON.stringify(response) == "[]") {
            let drivers = new Array();
            for (i = 0; i < ships.length; i++) {
                drivers.push(ships[i].driver);
                rawdata.ship_ID.push(ships[i].ship_ID);
            }
            rawdata.driver = drivers;
        } else {
            showAlert($mdDialog, ev, "查詢不到資料", '請檢查"配送日期"與"出貨單號"');
        }
    });
    return rawdata;
}