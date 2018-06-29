
//計算材積與價格
function calculate_Price_Size(dirtys = new Array()) {
    //把多筆整合成一筆
    var cleans = new Array();
    var singleOrder = 0;
    var arrOrderIDs = []; //儲存OrderID
    var arrNewItems = []; //暫存找不到的產品

    dirtys.forEach(function (dirtydata) {
        var single_order = new viewData();
        var cleandata = new viewData();
        var order_CBM = 0; //華元運費不計算材積，保留
        var order_Units = 0;
        var order_price = 0;
        var order_returnPrice = 0; //退貨價格，保留

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
            cleandata.client_type = "all";
            //注意：退貨單不計算材積與價格(將由使用者於介面手動輸入)
            if (dirtydata.data_type == "銷貨") {
            //C.計算材積與價格 (飲料:重量材，其他：體積材)
                single_order.forEach(ship => {
                    order_Units += parseFloat(ship.shipUnits);
                    order_price += calTotalPrice(ship.shipUnits, cleandata.client_type)
                });
                //排除運費與材積數為0的單據
                if(order_Units > 0 && order_price > 0){
                    cleandata.shipUnits = order_Units;
                    //計算運費
                    //比對looluptable，不到最低價以最低價計 (此功能未確定前先不加入)
                    cleandata.delivery_fee = order_price;
                    cleans.push(cleandata);
                }
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

///運費計算公式： 判斷類型(乾貨/液體) => 判斷是指定倉庫，工廠或是其他地方 => 地區(台南/高雄/屏東) => 依照材積計算出對應的價格
function calTotalPrice(unit, clientType = "all", cargo="", area="高雄市") {
    var arrX = shipfee_lookup.filter(function (e) {
        return (e.shipto === area && e.type === clientType && e.cargo === cargo);
    })
    for (i = 0; i < arrX.length; i++) {
        return arrX[i].unitprice * unit;
    }
}
