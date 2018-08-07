//新增配送
const add_columnKeys = [
    "銷售單/調撥單號", "交貨單號", "交貨日期", "交貨單建立日期", "收貨人名稱", "收貨地址",
    "物料", "單品項才數", "交貨數量", "金額(未稅)"
];

//一般退貨
const return_columnKeys = [
    "訂單號碼", "交貨單號碼", "發貨過帳日期", "需求日期", "收貨人名稱", "儲存地點描述",
    "物料名稱", "物料代碼", "發貨過帳數量", "發貨過帳金額", "交易類型", "訂貨原因", "銷售備註"
];

//一般退貨2 (格式：退貨明細06)
const return_columnKeys_2 = [
    "訂單號碼", "交貨單號碼", "發貨過帳日期", "需求日期", "客戶簡稱", "儲存地點描述",
    "物料名稱", "物料代碼", "交貨數量", "銷售金額(未稅)", "交易類型", "訂貨原因"
];
//軍公教退貨
const return_PXmart_columnKeys = [
    "調撥單號", "交貨單號", "發貨過帳日期", "需求日期", "客戶名稱",
    "物料名稱", "物料代碼", "發貨過帳數量", "發貨過帳金額", "交易類型", "調撥單表頭內文"
];

//Excel資料處理，轉為wangjia格式供之後的操作
function orderBuilder(unparsedData) {
    //檢查是不是配送單格式
    let fileType = {
        add: false,
        return :false,
        return_type2 :false,
        return_PXmart: false
    }
    var rawContent;
    //依照定義的欄位格式轉出標題與內容
    for (let x = 0; x < 2; x++){
        const headerNames = XLSX.utils.sheet_to_json(unparsedData, {header: 1})[x];
        if (isSubsetOf(add_columnKeys, headerNames)) {
            fileType.add = true;
        }
        if (isSubsetOf(return_columnKeys, headerNames)) {
            fileType.return = true;
        }
        if (isSubsetOf(return_columnKeys_2, headerNames)) {
            fileType.return_type2 = true;
        }
        if (isSubsetOf(return_PXmart_columnKeys, headerNames)) {
            fileType.return_PXmart = true;
        }
        if (fileType.add || fileType.return || fileType.return_type2 || fileType.return_PXmart) {
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
            if (fileType.return && (data[return_columnKeys_2[i]] === "null" || data[return_columnKeys_2[i]] === null || typeof data[return_columnKeys_2[i]] === "undefined")) {
                isEmpty = true; 
            }
            if (fileType.return_PXmart && (data[return_PXmart_columnKeys[i]] === "null" || data[return_PXmart_columnKeys[i]] === null || typeof data[return_PXmart_columnKeys[i]] === "undefined")) {
                isEmpty = true;
            }
        }
        
        //如果是配送單格式，就存成wangjia準備回傳到view
        if (!isEmpty) {
            //新增配送
            if (fileType.add && (findObjInArray(["銷","贈","樣"], data["交易類型"].toString()).length > 0)) {
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
                switch (data["交易類型"].toString()){
                    case "銷":
                        dirtydata.data_type = "銷貨";
                        break;
                    case "贈":
                        dirtydata.data_type = "贈品";
                        break;
                    case "樣":
                        dirtydata.data_type = "樣本";
                        break;
                }
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
                if (typeof data["訂貨原因"] == "undefined") {
                    dirtydata.comment = data["銷售備註"].toString();
                } else if (typeof data["銷售備註"] == "undefined") {
                    dirtydata.comment = data["訂貨原因"].toString();
                } else {
                    dirtydata.comment = data["訂貨原因"].toString() + "\r\n" + data["銷售備註"].toString();
                }
                //目前採用統一價，以後分區域時，需要要求旺家提供客戶地址，以計算金額
                dirtydata.data_type = "退貨";
                dirtys.push(dirtydata);
            //一般退貨 (格式：宜岱退貨明細2018.06.xlsx)
            } else if (fileType.return_type2 && data["交易類型"].toString() == "退") {
                dirtydata.order_ID = moment(data["發貨過帳日期"]).format('MMDD') + "_" + data["交貨單號碼"].toString();
                dirtydata.ship_ID.push(data["交貨單號碼"].toString());
                dirtydata.pickupdate = moment(data["需求日期"]).format('YYYY-MM-DD');
                dirtydata.shipdate = moment(data["發貨過帳日期"]).format('YYYY-MM-DD');
                dirtydata.clientname = data["客戶簡稱"].toString();
                dirtydata.contact_info = data["儲存地點描述"].toString();
                dirtydata.itemID = data["物料代碼"].toString();
                dirtydata.itemName = data["物料名稱"].toString();
                dirtydata.good_pirce = data["銷售金額(未稅)"].toString();
                dirtydata.shipUnits = parseFloat(data["交貨數量"].toString());
                if (typeof data["訂貨原因"] !== "undefined") {
                    dirtydata.comment = data["訂貨原因"].toString();
                }
                //目前採用統一價，以後分區域時，需要要求旺家提供客戶地址，以計算金額
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
                dirtydata.data_type = "退貨";
                dirtys.push(dirtydata);
            }
        }
    });
    return calculate_Price_Size(dirtys);
}