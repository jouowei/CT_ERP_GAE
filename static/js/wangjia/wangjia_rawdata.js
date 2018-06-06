//旺家單據格式
var wangjia = function(){       
    this.order_ID = "";             //交貨單號 (日期四碼+"-"+交貨單號10碼)
    this.ship_ID = [];              //銷售單/調撥單號 
    this.shipdate = "";             //交貨日
    this.pickupdate = "";           //送單日期 (目前無用)
    this.clientname = "";           //收貨人名稱
    this.client_type = "";          //客戶類型 (計算運費用)
    this.delivery_fee = "";         //運費
    this.contact_info = "";         //收貨地址
    this.ship_area = "";            //縣市
    this.ship_district = "";        //區域
    this.driver = "";               //駕駛
    this.itemID = "";               //物料(飲料計算運費用)
    this.itemName = "";             //物料品名(飲料計算運費用)
    this.good_size = 0;			    //材積(CBM)
    this.good_pirce = 0;            //金額(未稅)
    this.shipUnits = 0;             //交貨數
    this.comment = "";              //備註
};

var intOrderSize = 0; //總訂單材積
var after_intOrderPrice = 0; //總訂單運費
var intOrderPrice = 0; //總訂單運費

//出貨單schema
var order = function(){ 
    this.business_type = '旺家';       //出貨單類型
    this.delivery_date = '';           //揀貨日期 (上游取貨) (新增)
    this.client_name = '';             //客戶名稱
    this.order_ID = '';                //出貨單號
    this.ships = '';                   //送貨單 (見下方ships)
    this.delivery_fee = '';            //運費
    this.before_intOrderPrice = '';    //油價調整前運費
    this.good_size = '';               //材積 (CBM) (新增)
    this.good_pirce = '';              //貨物價格 (新增)
    this.delivery_fee_before_discount = ''; //油價調整前價格 (新增)
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
};

//旺家用(飲料關鍵字)
const wangjiaDrinkKeyword = [
    "吸吸冰", "形動", "梅酒", "每日完勝", "吸C凍", "旺仔牛奶",
    "果粒多", "深層水", "水飲", "飲料", "果汁"];

//旺家用(客戶類型)  
///還需確認定義
const wangjia_clienttype = [
    { id:1, keyword: "全台",type: "warehouse" },
    { id:2, keyword: "捷盟",type: "warehouse" },
    { id:3, keyword: "萊爾富",type: "warehouse" },
    { id:4, keyword: "百及物流",type: "warehouse" },
    { id:5, keyword: "弘達流通",type: "warehouse" },
    { id:6, keyword: "家福",type: "warehouse" },
    { id:7, keyword: "統一超食代",type: "factory" },
    { id:8, keyword: "育勇高雄",type: "warehouse" },
    { id:9, keyword: "大潤發",type: "warehouse" },
    { id:10, keyword: "戒治所",type: "prison" },
    { id:11, keyword: "監獄",type: "prison" }
    //統倉與CVS定義
];

//油價浮動公式
const wangjia_dieselDiscount = [
    {maxDieselPrice: 18, discount: "error"},
    {maxDieselPrice: 23, discount: "0.97"},
    {maxDieselPrice: 25, discount: "0.99"},
    {maxDieselPrice: 31, discount: "1.00"},
    {maxDieselPrice: 33, discount: "1.01"},
    {maxDieselPrice: 37, discount: "1.03"}
];

//旺家用(運費表)
/*
unitprice = 每材積價格 (乾貨為體積才，飲品為重量才)
unit = 單位 (乾貨為CBM，飲品為每10KG一才)
*/
const wangjia_shipfee = [
    { shipto: "台南市", type: "warehouse", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 300, minimumUnit: 33}, 
    { shipto: "台南市", type: "warehouse", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 300, minimumUnit: 33},
    { shipto: "台南市", type: "prison", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 500, minimumUnit: 55}, 
    { shipto: "台南市", type: "prison", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 500, minimumUnit: 55},
    { shipto: "台南市", type: "other", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 300, minimumUnit: 33}, 
    { shipto: "台南市", type: "other", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 300, minimumUnit: 33},
    { shipto: "高雄市", type: "warehouse", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 200, minimumUnit: 22}, 
    { shipto: "高雄市", type: "warehouse", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 200, minimumUnit: 22},
    { shipto: "高雄市", type: "prison", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 350, minimumUnit: 34}, 
    { shipto: "高雄市", type: "prison", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 350, minimumUnit: 34},
    { shipto: "高雄市", type: "other", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 200, minimumUnit: 22}, 
    { shipto: "高雄市", type: "other", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 200, minimumUnit: 22},
    { shipto: "屏東縣", type: "warehouse", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 200, minimumUnit: 22}, 
    { shipto: "屏東縣", type: "warehouse", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 200, minimumUnit: 22},
    { shipto: "屏東縣", type: "prison", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 350, minimumUnit: 34}, 
    { shipto: "屏東縣", type: "prison", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 350, minimumUnit: 34},
    { shipto: "屏東縣", type: "other", cargo: "dry", unit:"CBM", unitprice: 7.5, minimumPirce: 200, minimumUnit: 22}, 
    { shipto: "屏東縣", type: "other", cargo: "liquid", unit:"10kg", unitprice: 8, minimumPirce: 200, minimumUnit: 22},
    { shipto: "special", type: "weekend", cargo: "", unit:"person", unitprice: 1000}, 
    { shipto: "special", type: "CNY", cargo: "", unit:"person", unitprice: 2000}
    //其他地區?
];

/*  旺家飲料運費查詢表 (餅乾類以體積才計價，飲料類以重量才計價)
id = 物料(產品編號)
name = 說明(品名)
weightPerUnit = 重量才(箱)(重量才=單箱重量/10公斤)
volumePerUnit = 體積才(箱)(同"單品項才數")
shipPrice = 運費(箱)
reverseShipPrice = 逆物流運費(箱)*/
///有新產品更新都需要提供
const wangjia_beverage_lookup = [
    { id: "308103000322", name: "旺旺果粒多葡萄汁24袋", weightPerUnit: 0.989, volumePerUnit: 0.717, shipPrice: 7.91, reverseShipPrice: 5.54 },
    { id: "308103000323", name: "旺旺果粒多水蜜桃汁24袋", weightPerUnit: 0.989, volumePerUnit: 0.717, shipPrice: 7.91, reverseShipPrice: 5.54 },
    { id: "308103000324", name: "旺旺果粒多柳橙汁24袋", weightPerUnit: 0.989, volumePerUnit: 0.717, shipPrice: 7.91, reverseShipPrice: 5.54 },
    { id: "308103000539", name: "形動動能飲料790ml*20入", weightPerUnit: 1.700, volumePerUnit: 0.838, shipPrice: 13.60, reverseShipPrice: 9.52 },
    { id: "308103000572", name: "吸吸冰芒果87g*5包*8盒", weightPerUnit: 0.478, volumePerUnit: 0.532, shipPrice: 3.82, reverseShipPrice: 2.67 },
    { id: "308103000573", name: "吸吸冰蘇打87g*5包*8盒", weightPerUnit: 0.478, volumePerUnit: 0.532, shipPrice: 3.82, reverseShipPrice: 2.67 },
    { id: "308103000630", name: "形動動能飲料590ml*4*6", weightPerUnit: 1.600, volumePerUnit: 1.019, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000636", name: "形動動能飲料300ml*6*4", weightPerUnit: 0.780, volumePerUnit: 0.321, shipPrice: 6.24, reverseShipPrice: 4.37 },
    { id: "308103000637", name: "旺仔牛奶245ml*24", weightPerUnit: 0.725, volumePerUnit: 0.370, shipPrice: 5.80, reverseShipPrice: 4.06 },
    { id: "308103000638", name: "旺仔牛奶245ml*6*4", weightPerUnit: 0.740, volumePerUnit: 0.370, shipPrice: 5.92, reverseShipPrice: 4.14 },
    { id: "308103000640", name: "吸吸冰芒果120g*5包*8盒", weightPerUnit: 0.608, volumePerUnit: 0.688, shipPrice: 4.86, reverseShipPrice: 3.40 },
    { id: "308103000644", name: "吸吸冰芒果120g*8包*6袋", weightPerUnit: 0.701, volumePerUnit: 0.679, shipPrice: 5.60, reverseShipPrice: 3.92 },
    { id: "308103000645", name: "吸吸冰香橙120g*5包*8盒", weightPerUnit: 0.608, volumePerUnit: 0.688, shipPrice: 4.86, reverseShipPrice: 3.40 },
    { id: "308103000681", name: "吸吸冰香橙120g*8包*6袋", weightPerUnit: 0.701, volumePerUnit: 0.679, shipPrice: 5.60, reverseShipPrice: 3.92 },
    { id: "308103000682", name: "形動能量飲790ml*20入", weightPerUnit: 1.700, volumePerUnit: 0.939, shipPrice: 13.60, reverseShipPrice: 9.52 },
    { id: "308103000683", name: "吸吸冰雪梨120g*5包*8盒", weightPerUnit: 0.608, volumePerUnit: 0.688, shipPrice: 4.86, reverseShipPrice: 3.40 },
    { id: "308103000690", name: "吸吸冰香橙87g*5包*8盒", weightPerUnit: 0.478, volumePerUnit: 0.532, shipPrice: 3.82, reverseShipPrice: 2.67 },
    { id: "308103000695", name: "吸吸冰雪梨120g*8包*6袋", weightPerUnit: 0.701, volumePerUnit: 0.679, shipPrice: 5.60, reverseShipPrice: 3.92 },
    { id: "308103000699", name: "形動動能飲料300ml*24入", weightPerUnit: 0.780, volumePerUnit: 0.321, shipPrice: 6.24, reverseShipPrice: 4.37 },
    { id: "308103000700", name: "形動動能飲料590ml*24入", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000701", name: "吸吸冰蘇打120g*5包*8盒", weightPerUnit: 0.608, volumePerUnit: 0.688, shipPrice: 4.86, reverseShipPrice: 3.40 },
    { id: "308103000702", name: "吸吸冰蘇打120g*8包*6袋", weightPerUnit: 0.701, volumePerUnit: 0.679, shipPrice: 5.60, reverseShipPrice: 3.92 },
    { id: "308103000707", name: "形動動能飲料350ml*24入", weightPerUnit: 0.950, volumePerUnit: 0.717, shipPrice: 7.60, reverseShipPrice: 5.32 },
    { id: "308103000770", name: "吸吸冰雪梨120g*20包", weightPerUnit: 0.335, volumePerUnit: 0.310, shipPrice: 2.48, reverseShipPrice: 1.74 },
    { id: "308103000775", name: "旺仔牛奶245ml*3*8", weightPerUnit: 0.750, volumePerUnit: 0.370, shipPrice: 6.00, reverseShipPrice: 4.20 },
    { id: "308103000822", name: "果粒多水蜜桃綜合果汁350ml*24", weightPerUnit: 0.989, volumePerUnit: 0.717, shipPrice: 7.91, reverseShipPrice: 5.54 },
    { id: "308103000823", name: "果粒多水蜜桃綜合果汁350ml*3*8", weightPerUnit: 0.989, volumePerUnit: 0.717, shipPrice: 7.91, reverseShipPrice: 5.54 },
    { id: "308103000826", name: "吸吸冰芒果87g*4包*10袋", weightPerUnit: 0.397, volumePerUnit: 0.51, shipPrice: 3.18, reverseShipPrice: 2.22 },
    { id: "308103000827", name: "吸吸冰蘇打87g*4包*10袋", weightPerUnit: 0.397, volumePerUnit: 0.51, shipPrice: 3.18, reverseShipPrice: 2.22 },
    { id: "308103000828", name: "吸吸冰香橙87g*4包*10袋", weightPerUnit: 0.397, volumePerUnit: 0.51, shipPrice: 3.18, reverseShipPrice: 2.22 },
    { id: "308103000829", name: "形動動能飲料590ml*4*6(新)", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000830", name: "形動動能飲料590ml*24入(新)", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000833", name: "形動動能飲料300ml*6*4(新)", weightPerUnit: 0.780, volumePerUnit: 0.321, shipPrice: 6.24, reverseShipPrice: 4.37 },
    { id: "308103000834", name: "形動動能飲料300ml*24入(新)", weightPerUnit: 0.780, volumePerUnit: 0.321, shipPrice: 6.24, reverseShipPrice: 4.37},
    { id: "308103000908", name: "形動海洋深層水800ml*20入", weightPerUnit: 1.722, volumePerUnit: 1.038, shipPrice: 13.78, reverseShipPrice: 9.64 },
    { id: "308103000916", name: "形動動能飲料590ml*4*6(新)", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000917", name: "形動動能飲料590ml*24入(新)", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000918", name: "形動動能飲料300ml*6*4(新)", weightPerUnit: 0.780, volumePerUnit: 1.011, shipPrice: 6.24, reverseShipPrice: 8.96 },
    { id: "308103000993", name: "形動補給水飲590ml*24入", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000994", name: "形動補給水飲590ml*4*6", weightPerUnit: 1.600, volumePerUnit: 1.011, shipPrice: 12.80, reverseShipPrice: 8.96 },
    { id: "308103000996", name: "形動補給水飲300ml*6*4", weightPerUnit: 0.780, volumePerUnit: 1.011, shipPrice: 6.24, reverseShipPrice: 4.37 },
    { id: "308103000998", name: "形動海洋深層鹼性元素水800ml*20", weightPerUnit: 1.722, volumePerUnit: 1.038, shipPrice: 13.78, reverseShipPrice: 9.64 },
    { id: "308104000352", name: "雪姬梅酒", weightPerUnit: 1.250, volumePerUnit: 1.011, shipPrice: 10.00, reverseShipPrice: 7.00 },
    { id: "308104000691", name: "雪姬梅酒(餐通)", weightPerUnit: 1.250, volumePerUnit: 1.011, shipPrice: 10.00, reverseShipPrice: 7.00 },
    { id: "308104000752", name: "每日完勝-奇異果口味", weightPerUnit: 0.504, volumePerUnit: 1.011, shipPrice: 4.03, reverseShipPrice: 2.82 },
    { id: "308104000755", name: "每日完勝-鳳梨口味", weightPerUnit: 0.504, volumePerUnit: 1.011, shipPrice: 4.03, reverseShipPrice: 2.82 },
    { id: "308105000350", name: "雪姬梅酒禮盒", weightPerUnit: 1.300, volumePerUnit: 1.011, shipPrice: 10.40, reverseShipPrice: 7.28 }
    ];

const columnKeys = ["銷售單/調撥單號", "交貨單號", "交貨日期", "交貨單建立日期", "收貨人名稱", "收貨地址", "物料", "單品項才數", "交貨數量", "金額(未稅)"];