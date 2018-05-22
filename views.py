#!/usr/bin/env python
# -*- coding: utf-8 -*-

from models import Delivery, DeliverySchema, Shippment, ShippmentSchema
from main import db, app
from flask import request, jsonify, render_template
from datetime import datetime
from flask_migrate import init, migrate, upgrade, Migrate

delivery_schema = DeliverySchema()
deliveries_schema = DeliverySchema(many=True)

shippment_schema = ShippmentSchema()
shippments_schema = ShippmentSchema(many=True)

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

# new endpoint to parse post with Json array
@app.route("/order", methods=["POST"])
def add_order_new():
    arrShippment = []
    if request.json:
        rawdata = request.get_json(force=True)
        # 建立Order
        if 'order_ID' not in rawdata:
            order_ID = ""
            return 'Error: "order ID" not exist'
        else: 
            order_ID = rawdata['order_ID']
        if 'clientname' not in rawdata:
            clientname = ""
        else: 
            clientname = rawdata['clientname']
        if 'businesstype' not in rawdata:
            businesstype = ""
        else: 
            businesstype = rawdata['businesstype']
        if 'delivery_date' not in rawdata:
            delivery_date = ""
        else: 
            delivery_date = rawdata['delivery_date']
        if 'delivery_fee' not in rawdata:
            delivery_fee = ""
        else: 
            delivery_fee = rawdata['delivery_fee']
        if 'car_type' not in rawdata:
            car_type = ""
        else: 
            car_type = rawdata['car_type']
        if 'car_ID' not in rawdata:
            car_ID = ""
        else: 
            car_ID = rawdata['car_ID']
        if 'comment' not in rawdata:
            comment = ""
        else: 
            comment = rawdata['comment']
        if 'ships' not in rawdata:
            ships = []
            return 'Error: "ships" not exist'
        else:
            ships = rawdata['ships']
            #建立Shippments
            for ship in ships:
                if 'ship_ID' not in ship:
                    return 'Error: "ship ID" in some ships not exist'
                else:
                    ship_ID = ship['ship_ID']
                if 'contact_info' not in ship:
                    contact_info = ''
                else:
                    contact_info = ship['contact_info']
                if 'ship_orderStore' not in ship:
                    ship_orderStore = ''
                else:
                    ship_orderStore = ship['ship_orderStore']
                if 'ship_datetime' not in ship:
                    ship_datetime = ''
                else:
                    ship_datetime = ship['ship_datetime']
                if 'ship_area' not in ship:
                    ship_area = ''
                else:
                    ship_area = ship['ship_area']
                if 'ship_district' not in ship:
                    ship_district = ''
                else:
                    ship_district = ship['ship_district']
                if 'ship_driver' not in ship:
                    driver = ''
                else:
                    driver = ship['ship_driver']
                if 'is_elevator' not in ship:
                    is_elevator = ''
                else:
                    is_elevator = ship['is_elevator']
                if 'floors_byhand' not in ship:
                    floors_byhand = ''
                else:
                    floors_byhand = ship['floors_byhand']
                if 'amount_collect' not in ship:
                    amount_collect = ''
                else:
                    amount_collect = ship['amount_collect']
                if 'comment' not in ship:
                    ship_comment = ''
                else:
                    ship_comment = ship['comment']
                result_ship = Shippment.query.with_for_update().filter_by(ship_ID=ship_ID).first()
                if result_ship is None: 
                    arrShippment.append(Shippment(ship_ID,order_ID,contact_info,ship_orderStore,ship_datetime,ship_area,ship_district,driver,car_type,car_ID,is_elevator,floors_byhand,amount_collect,ship_comment))

        # 查詢此Order是否已存在
        result_delivery = Delivery.query.with_for_update().filter_by(order_ID=order_ID).first()
        # 資料庫沒有此Order => 新增Order
        if result_delivery is None:
            new_delivery = Delivery(businesstype,clientname,order_ID,delivery_date,delivery_fee,comment)
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
            else:
                return 'Error: no shippment in this order'
            return '新增成功'
        else: 
            return 'this order is already exist'
        # return jsonify(rawdata)
    else:
        return 'Error: no data in the POST request'

# endpoint to create new delivery entry
@app.route("/order_old", methods=["POST"])
def add_order():
    result_delivery = Delivery.query.with_for_update().filter_by(order_ID=request.json['order_ID']).first()
    if result_delivery is None:
        new_delivery = Delivery(
            request.json['businesstype'], 
            request.json['clientname'], 
            request.json['order_ID'],
            request.json['delivery_date'],
            request.json['delivery_fee'],
            request.json['comment']
            )
        try:
            db.session.add(new_delivery)
            db.session.commit()
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
            
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
            request.json['amount_collect'],
            request.json['ship_comment']
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
    
# endpoint to create new delivery entry
@app.route("/delivery", methods=["POST"])
def add_delivery():
    result_delivery = Delivery.query.with_for_update().filter_by(order_ID=request.json['order_ID']).first()
    if result_delivery is None:
        new_delivery = Delivery(
            request.json['businesstype'], 
            request.json['clientname'], 
            request.json['order_ID'],
            request.json['delivery_date'],
            request.json['delivery_fee'],
            request.json['comment']
            )
        try:
            db.session.add(new_delivery)
            db.session.commit()
        except:
            db.session.rollback()
            raise
        finally:
            db.session.close()
            return '{}'.format(new_delivery)
    else:
        return 'this order is already exist'

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

# endpoint to get delivery entry detail by order id
@app.route("/delivery/<id>", methods=["GET"])
def delivery_detail(id):
    delivery = Delivery.query.filter_by(order_ID=id).first()
    return delivery_schema.jsonify(delivery)

# endpoint to update delivery entry by order id for businesstype, clientname, and comment
@app.route("/delivery/<id>", methods=["PUT", "POST"])
def delivery_update(id):
    delivery = Delivery.query.filter_by(order_ID=id).first()
    try:
        businesstype = request.json['businesstype']
        delivery.businesstype = businesstype
    except:
        pass
    try:
        clientname = request.json['clientname']
        delivery.clientname = clientname    
    except:
        pass
    try:
        delivery_date = request.json['delivery_date']
        delivery.delivery_date = delivery_date    
    except:
        pass
    try:
        delivery_fee = request.json['delivery_fee']
        delivery.delivery_date = delivery_fee    
    except:
        pass
    try:
        comment = '\ new comment' + request.json['comment']
        delivery.comment += comment
    except:
        pass
    delivery.updated_at = datetime.utcnow()
    
    db.session.commit()
    return delivery_schema.jsonify(delivery)

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
            request.json['amount_collect'],
            request.json['ship_comment']
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

# endpoint to get shippment entry detail by ship id
@app.route("/shippment/<id>", methods=["GET"])
def shippment_detail(id):
    shippment = Shippment.query.filter_by(ship_ID=id).first()
    return shippment_schema.jsonify(shippment)

# endpoint to update shippment entry by order id
@app.route("/shippment/<id>", methods=["PUT", "POST"])
def shippment_update(id):
    shippment = Shippment.query.filter_by(order_ID=id).first()

    try:
        contact_info = request.json['contact_info']
        shippment.contact_info = contact_info
    except:
        pass

    try:
        ship_ID = request.json['ship_ID']
        shippment.ship_ID = ship_ID
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
        ship_area = request.json['ship_area']
        shippment.ship_area = ship_area
    except:
        pass

    try:
        ship_district = request.json['ship_district']
        shippment.ship_district = ship_district
    except:
        pass

    try:
        driver = request.json['driver']
        shippment.driver = driver
    except:
        pass

    try:
        car_type = request.json['car_type']
        shippment.car_type = car_type
    except:
        pass

    try:
        car_ID = request.json['car_ID']
        shippment.car_ID = car_ID
    except:
        pass

    try:
        is_elevator = request.json['is_elevator']
        shippment.is_elevator = is_elevator
    except:
        pass

    try:
        floors_byhand = request.json['floors_byhand']
        shippment.floors_byhand = floors_byhand
    except:
        pass

    try:
        amount_collect = request.json['amount_collect']
        shippment.amount_collect = amount_collect
    except:
        pass

    try:
        comment = '/ Comment: ' + request.json['ship_comment']
        shippment.comment += comment
    except:
        pass

    db.session.commit()
    return shippment_schema.jsonify(shippment)

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