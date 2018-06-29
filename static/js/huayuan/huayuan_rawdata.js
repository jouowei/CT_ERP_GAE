//旺家單據格式
var viewData = function(){       
    this.business_type = '華元';       //出貨單類型
    this.order_ID = "";             //交貨單號 (日期四碼+"-"+交貨單號10碼)
    this.ship_ID = [];              //銷售單/調撥單號 
    this.shipdate = "";             //交貨日
    this.clientname = "";           //收貨人名稱
    this.delivery_fee = "";         //調整後運費 (油價或手動輸入)
    this.delivery_fee_before_discount= "";
    this.contact_info = "";         //收貨地址
    this.ship_area = "";            //縣市
    this.ship_district = "";        //區域
    this.driver = "";               //駕駛
    this.itemName = "";             //物料品名
    this.good_size = 0;			    //材積(CBM)
    this.good_pirce = 0;            //貨物總金額(未稅)
    this.shipUnits = 0;             //交貨數
    this.comment = "";              //備註
};

//出貨單schema
var order = function(){ 
    this.business_type = '華元';       //出貨單類型
    this.delivery_date = '';           //揀貨日期 (上游取貨)
    this.client_name = '';             //客戶名稱
    this.order_ID = '';                //出貨單號
    this.ships = '';                   //送貨單 (見下方ships)
    this.delivery_fee = '';            //運費
    this.good_size = '';               //材積 (CBM)
    this.ship_units = '';               //材積 (CBM)
    this.good_pirce = '';              //貨物價格 
    this.delivery_fee_before_discount = ''; //油價調整前運費
    this.comment = '';                 //出貨單備註
};

//送貨單schema
var ship = function(){ 
    this.ship_ID = '';         //送貨單號
    this.ship_driver = '';     //司機姓名
    this.ship_deleted = '';    //此單狀態 (''=正常,'1'=刪除)
    this.ship_datetime = '';   //出貨日期 (送到客戶端)
    this.contact_info = '';    //客戶連絡電話 or 地址
    this.ship_area = '';       //縣市
    this.ship_district = '';   //區域
    this.shipUnits = 0;        //數量
};

//運費表
const shipfee_lookup = [
    { shipto: "高雄市", type: "all", cargo: "", unit:"", unitprice: 1.5},
    { shipto: "屏東縣", type: "all", cargo: "", unit:"", unitprice: 1.5},
    { shipto: "台南市", type: "all", cargo: "", unit:"", unitprice: 1.5}
];
