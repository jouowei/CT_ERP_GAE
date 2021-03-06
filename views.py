#!/usr/bin/env python
# -*- coding: utf-8 -*-

from models import Delivery, DeliverySchema, Shippment, ShippmentSchema, OperateLog, OperateLogSchema
from main import db, app
from flask import request, jsonify, render_template
from datetime import datetime
from flask_migrate import init, migrate, upgrade, Migrate
import json
import urllib2

delivery_schema = DeliverySchema()
deliveries_schema = DeliverySchema(many=True)

shippment_schema = ShippmentSchema()
shippments_schema = ShippmentSchema(many=True)

log_schema = OperateLogSchema()
logs_schema = OperateLogSchema(many=True)

# Main landing page
@app.route("/")
def homepage():
    """
    Render the homepage template on the / route
    """
    try:
        return render_template('index.html', title="Welcome")
    except:
        return 'Cannot load file specified'

# url to initiate flask migration
@app.route('/admin/dbinit')
def dbinit():
    try:
        migrate_dict = Migrate(app, db)
        print(migrate_dict.directory)
        init(directory=migrate_dict.directory)
        return 'db initiated'
    except Exception as e: 
        return str(e)

# url to update tables in db
@app.route('/admin/dbupgrade')
def dbupgrade():
    try:
        migrate_dict = Migrate(app, db)
        migrate(directory=migrate_dict.directory)
        upgrade(directory=migrate_dict.directory)
        all_tables = ' <br/>'.join(map(str, db.engine.table_names()))
        return 'Tables upgraded in database <br/>' + all_tables
    except Exception as e: 
        return str(e)

def checkKey(data,key):
    if key not in data:
        return ''
    else: 
        return data[key]

# submit data into DB
def add_order(rawdata):
    arrShippment = []
    if len(checkKey(rawdata,'order_ID')) > 0:
        order_ID = checkKey(rawdata,'order_ID')         #訂單編號
    else:
        return 'Error: unfound key "order_ID"'
    clientname = checkKey(rawdata,'clientname')         #客戶名稱
    business_type = checkKey(rawdata,'business_type')   #表單類型
    delivery_date = checkKey(rawdata,'delivery_date')   #配送日期
    delivery_fee = checkKey(rawdata,'delivery_fee')     #總運費
    delivery_fee_before_discount = checkKey(rawdata,'delivery_fee_before_discount')
    car_type = checkKey(rawdata,'car_type')             #車型
    car_ID = checkKey(rawdata,'car_ID')                 #車號
    good_size = checkKey(rawdata,'good_size')           #總材積數
    ship_units = checkKey(rawdata,'ship_units')         #配送件數
    comment = checkKey(rawdata,'comment')               #訂單備註
    ships = checkKey(rawdata,'ships')                   #訂單的配送紀錄
    updateduser = checkKey(rawdata, 'updateduser')      #使用者ID
    # 建立Shippments
    for ship in ships:
        if len(checkKey(ship,'ship_ID')) > 0 :
            ship_ID = checkKey(ship,'ship_ID')          #配送單編號
        else:
            return 'Error: unfound key "ship_ID"'
        contact_info = checkKey(ship,'contact_info')    #客戶姓名/地址/電話
        ship_orderStore = checkKey(ship,'ship_orderStore') #(郭元益)發單店面
        ship_datetime = checkKey(ship,'ship_datetime')  #配送時間
        ship_area = checkKey(ship,'ship_area')          #配送縣市
        ship_district = checkKey(ship,'ship_district')  #配送區域
        driver = checkKey(ship,'ship_driver')           #司機
        is_elevator = checkKey(ship,'is_elevator')      #(郭元益)是否電梯
        floors_byhand = checkKey(ship, 'floors_byhand') #(郭元益)手搬樓層數
        paytype = checkKey(ship, 'paytype')             #(郭元益)付款方式_現金/支票
        amount_collect = checkKey(ship,'amount_collect')#(郭元益)代收款 (旺家)手開單費用
        ship_comment = checkKey(ship,'comment')         #配送單備註
        shipUnits = checkKey(ship, 'shipUnits')         #(旺家)手開單數量
        result_ship = Shippment.query.with_for_update().filter_by(order_ID=order_ID,ship_ID=ship_ID, driver=driver).first()
            # 取消檢查ship_ID是否重複，但是以下廠商在傳入時，須確保ship_ID是唯一的:
            #   1.郭元益
        if result_ship is None: 
            arrShippment.append(Shippment(ship_ID,order_ID,contact_info,ship_orderStore,ship_datetime,ship_area,ship_district,driver,car_type,car_ID,is_elevator,floors_byhand,paytype,amount_collect,ship_comment,shipUnits))
        
    # 查詢此Order是否已存在
    result_delivery = Delivery.query.with_for_update().filter_by(order_ID=order_ID).first()
    # 資料庫沒有此Order => 新增Order
    if result_delivery is None:
        new_delivery = Delivery(business_type, order_ID, clientname, delivery_date,
                                delivery_fee, delivery_fee_before_discount, good_size, ship_units, comment, updateduser)
        try:
            db.session.add(new_delivery)
            db.session.commit()
        except:
            db.session.rollback()
            raise
        # 如果Ships超過一筆，逐筆加入
        if len(arrShippment) > 0:
            for oneShip in arrShippment:
                try:
                    db.session.add(oneShip)
                    db.session.commit()
                except:
                    db.session.rollback()
                    raise

                #add log
                new_log = OperateLog(business_type, "ADD", order_ID, oneShip.ship_ID, updateduser)
                try:
                    db.session.add(new_log)
                    db.session.commit()
                except:
                    db.session.rollback()
                    raise
        else:
            return 'Error: no shippment or shippment duplicated'

        return '新增成功'
    else: 
        return '訂單已經存在'

# 用orderID取order內容
@app.route("/delivery/<id>", methods=["GET"])
def delivery_detail(id):
    #把對應的delivery order拉出來
    delivery = Delivery.query.filter_by(order_ID=id).first()
    return delivery_schema.jsonify(delivery)

# 用orderID或shipID取ship內容
@app.route("/shippment/<id>", methods=["GET"])
def shippment_detail(id):
    shippment = Shippment.query.filter_by(ship_ID=id).all()
    if len(shippment) == 0:
        shippment = Shippment.query.filter_by(order_ID=id).all()
    result = shippments_schema.dump(shippment)
    return jsonify(result.data)

# 查油價API
@app.route("/diselprice", methods=["GET"])
def get_diselprice():
    url = 'https://quality.data.gov.tw/dq_download_json.php?nid=6339&md5_url=a03335ba6b0bead4ec405a69605db65c'
    open = urllib2.urlopen(url)
    response = open.read().decode('utf-8')
    data = json.loads(response)
    return data[4][u'參考牌價'] #柴油價格

# 更新order
# endpoint to update delivery entry by order id for businesstype, clientname, and comment
@app.route("/delivery/<id>", methods=["PUT", "POST"])
def delivery_update(id):
    delivery = Delivery.query.filter_by(order_ID=id).first()
    if request.json:
        rawdata = request.get_json(force=True)
        try:
            business_type = request.json['business_type']
            delivery.businesstype = business_type
        except:
            pass

        try:
            delivery_date = request.json['delivery_date']
            delivery.delivery_date = delivery_date
        except:
            pass
        try:
            updateduser = request.json['updateduser']
            delivery.updateduser = updateduser
        except:
            pass
        try:
            delivery_fee = request.json['delivery_fee']
            delivery.delivery_fee = delivery_fee
        except:
            pass
        try:
            good_size = request.json['good_size']
            delivery.good_size = good_size
        except:
            pass
        try:
            ship_units = request.json['ship_units']
            delivery.ship_units = ship_units
        except:
            pass
        try:
            #comment = '\ new comment' + request.json['comment']
            comment = request.json['comment']
            delivery.comment = comment
        except:
            pass
        delivery.updated_at = datetime.utcnow()
        db.session.commit() 

        #add log
        new_log = OperateLog(business_type, "UPDATE", id, '', updateduser)
        try:
            db.session.add(new_log)
            db.session.commit()
        except:
            db.session.rollback()
            raise

        return "資料更新成功"

# endpoint to update shippment entry by order id

# 更新shippment
@app.route("/shippment/<id>", methods=["PUT", "POST"])
def shippment_update(id):
    shippment = Shippment.query.filter_by(ship_ID=id).first()
    try:
        driver = request.json['driver']
        shippment.driver = driver
    except:
        pass
    try:
        contact_info = request.json['contact_info']
        shippment.contact_info = contact_info
    except:
        pass
    try:
        ship_orderStore = request.json['ship_orderStore']
        shippment.ship_orderStore = ship_orderStore
    except:
        pass

    try:
        ship_datetime = request.json['ship_datetime']
        shippment.ship_datetime = ship_datetime
    except:
        pass


    try:
        amount_collect = request.json['amount_collect']
        shippment.amount_collect = amount_collect
    except:
        pass
    
    try:
        shipUnits = request.json['shipUnits']
        shippment.shipUnits = shipUnits
    except:
        pass
        
    try:
        comment = request.json['comment']
        shippment.comment = comment
    except: 
        pass

    try:
        paytype = request.json['paytype']
        shippment.paytype = paytype
    except:
        pass

    db.session.commit()

    #add log
    try:
        order_ID = request.json['order_ID']
        updateduser = request.json['updateduser']
        db.session.add(OperateLog("", "UPDATE", order_ID, id, updateduser))
        db.session.commit()
    except:
        db.session.rollback()
        raise
    return "資料更新成功"

# 到DB取值
@app.route("/order", methods=["POST"])
def acceptPOST():
    if request.json:
        rawdata = request.get_json(force=True)
        # 透過檢查order_ID來確定這是array of jsons還是json
        if len(checkKey(rawdata,'order_ID')) == 0:
            result = ""
            for data in rawdata:
                result = add_order(data)
                if len(result) > 0 and result != '新增成功':
                    return result
                else:
                    continue
            return result
        else:
            return add_order(rawdata)
    else:
        return 'Error: no data in the POST request'
################################################################

# endpoint to show all delivery entries
@app.route("/delivery", methods=["GET"])
def get_delivery():
    all_delivery = Delivery.query.all()
    print(all_delivery)
    # # May use the following to return other JSON format structure
    # results = {}
    # for delivery in all_delivery:
    #     results.update({
    #         delivery.id:{
    #             'name': delivery.name,
    #             'description': delivery.description
    #             }
    #         }
    #     )
    # return jsonify(results)
    result = deliveries_schema.dump(all_delivery)
    return jsonify(result.data)

# endpoint to delete delivery entry by order id
@app.route("/delivery/<id>", methods=["DELETE"])
def delivery_delete(id):
    delivery = Delivery.query.filter_by(order_ID=id).first()
    db.session.delete(delivery)
    db.session.commit()

    return delivery_schema.jsonify(delivery)

# endpoint to create new shippment entry
@app.route("/shippment", methods=["POST"])
def add_shippment():
    result_ship = Shippment.query.with_for_update().filter_by(ship_ID=request.json['ship_ID']).first()
    if result_ship is None: 
        new_shippment = Shippment(
            request.json['ship_ID'],
            request.json['order_ID'],  
            request.json['contact_info'],
            request.json['ship_orderStore'],
            request.json['ship_datetime'],
            request.json['ship_area'],
            request.json['ship_district'],
            request.json['driver'],
            request.json['car_type'],
            request.json['car_ID'],
            request.json['is_elevator'],
            request.json['floors_byhand'],
            request.json['paytype'],
            request.json['amount_collect'],
            request.json['ship_comment'],
            request.json['shipUnits']            
            )
        try:
            db.session.add(new_shippment)
            db.session.commit()
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
            return '{}'.format(new_shippment)
    else:
        return 'this shippment is already exist'

# endpoint to show all shippment entries
@app.route("/shippment", methods=["GET"])
def get_shippment():
    all_shippments = Shippment.query.all()
    result = shippments_schema.dump(all_shippments)
    return jsonify(result.data)

# endpoint to delete delivery entry by order id
@app.route("/shippment/<id>", methods=["DELETE"])
def shippment_delete(id):
    shippment = Shippment.query.filter_by(ship_ID=id).first()
    db.session.delete(shippment)
    db.session.commit()

    return shippment_schema.jsonify(shippment)

@app.teardown_appcontext
def shutdown_session(exception=None):
    db.session.remove()
