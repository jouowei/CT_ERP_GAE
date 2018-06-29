//新增配送
const add_columnKeys = [
    "PO_NO", "ARRIVE_DATE", "ORDER_DATE", "SITE_NO_DESCR", "DOCK_MODE_DESCR", "RECEIVE_PLACE_ADDR", "VENDOR_NAME",
    "NAME", "CARTON_QTY", "TotalCase", "ARRIVE_START_TIME", "ITEM_NO"
];

//Excel資料處理，轉為viewData格式供之後的操作
function orderBuilder(unparsedData) {
    //檢查是不是配送單格式
    let fileType = {
        add: false
    }
    var rawContent;
    //依照定義的欄位格式轉出標題與內容
    for (let x = 0; x < 2; x++){
        const headerNames = XLSX.utils.sheet_to_json(unparsedData, {header: 1})[x];
        fileType.add = isSubsetOf(add_columnKeys, headerNames);
        if (fileType.add) {
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
        var dirtydata = new viewData();
        isEmpty = false;
        //排掉原檔因排版而出現的空行，以及行數不存在的錯誤
        for (let i = 0; i < add_columnKeys.length; i++) {
            if (fileType.add && (data[add_columnKeys[i]] === "null" || data[add_columnKeys[i]] === null || typeof data[add_columnKeys[i]] === "undefined")) {
                isEmpty = true;
            } 
        }
        
        //如果是配送單格式，就存成viewData準備回傳到view
        if (!isEmpty) {
            //新增配送
            if (fileType.add) {
                dirtydata.order_ID = moment(data["ARRIVE_DATE"]).format('MMDD') + "_" + data["PO_NO"].toString();
                dirtydata.ship_ID.push(data["PO_NO"].toString());
                dirtydata.pickupdate = moment(data["ARRIVE_DATE"]).format('YYYY-MM-DD');
                dirtydata.shipdate = moment(data["ARRIVE_DATE"]).format('YYYY-MM-DD');
                dirtydata.clientname = data["SITE_NO_DESCR"].toString() + " " + data["DOCK_MODE_DESCR"].toString();
                dirtydata.contact_info = data["RECEIVE_PLACE_ADDR"].toString();
                dirtydata.itemID = data["ITEM_NO"].toString();
                dirtydata.itemName = data["NAME"].toString();
                dirtydata.shipUnits = parseFloat(data["CARTON_QTY"].toString());
                dirtydata.data_type = "銷貨";
                dirtydata.comment = "開始進場時間：" + data["ARRIVE_START_TIME"].toString();
                //針對縣市做字串處理
                let location = getCityAndDistrict(data["RECEIVE_PLACE_ADDR"]);
                if (typeof location == "undefined"){
                    return;
                }
                dirtydata.ship_area = location.city;
                dirtydata.ship_district = location.district;
                dirtys.push(dirtydata);
            }
        }
    });
    return calculate_Price_Size(dirtys);
}