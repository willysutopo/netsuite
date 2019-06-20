/*
simple way of creating Sales Order
in real case, the fields will be much more than this sample
*/
function create_so(request) {
    /* assuming the content of the request is in JSON format like this :
    {
        'tranid': 'SO-0001',
        'trandate': '31/1/2019',
        'entity': '1000001',
        'location': '1',
        'shippingcost': 10,
        'shipto': '1',
        'orderstatus': 'B',
        'custbody_text', 'Testing',
        'custbody_numeric', 150000,
        'custbody_list': '1',
        'items': [
            {
                'item': '3412',
                'quantity': 3,
                'taxcode': '1',
                'rate': 30.99,
                'description': 'This is a new item',
                'custcol_category': 'New Item'
            },
            {
                'item': '3413',
                'quantity': 5,
                'taxcode': '1',
                'rate': 40.25,
                'description': 'This is an expensive item',
                'custcol_category': 'Expensive Item'
            }
        ]
    }
    */
    var param = JSON.parse(request);

    var soObj = nlapiCreateRecord('salesorder');
    // this can be ignored so the tranid is automatically generated
    soObj.setFieldValue('tranid', param.tranid);
    soObj.setFieldValue('trandate', param.trandate);
    soObj.setFieldValue('entity', param.entity);
    soObj.setFieldValue('location', param.location);
    soObj.setFieldValue('shippingcost', param.shippingcost);
    soObj.setFieldValue('shipto', param.shipto);
    soObj.setFieldValue('orderstatus', param.orderstatus);
    soObj.setFieldValue('custbody_text', param.custbody_text);
    soObj.setFieldValue('custbody_numeric', param.custbody_numeric);
    soObj.setFieldValue('custbody_list', param.custbody_list);

    var items = param.items;
    for (var i = 0; i < items.length; i++) {
        soObj.setLineItemValue('item', 'item', i+1, items[i].item);
        soObj.setLineItemValue('item', 'quantity', i+1, items[i].quantity);
        soObj.setLineItemValue('item', 'taxcode', i+1, items[i].taxcode);
        soObj.setLineItemValue('item', 'rate', i+1, items[i].rate);
        soObj.setLineItemValue('item', 'description', i+1, items[i].description);
        soObj.setLineItemValue('item', 'custcol_category', i+1, items[i].custcol_category);
    }

    try {
        // create SO and get its new ID and then put the value into debug log
        var newSoId = nlapiSubmitRecord(soObj);
        nlapiLogExecution('DEBUG', 'newSoId', newSoId);
        return {
            'status': 1,
            'newSoId': newSoId
        };
    } catch(ex) {
        // put the error message into error log
        nlapiLogExecution('ERROR', 'Error Creating SO', ex);
        return {
            'status': 0,
            'msg': ex
        };
    }
}