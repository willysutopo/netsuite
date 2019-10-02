/*
simple way of creating Sales Order
in real case, the fields will be much more than this sample
*/
function create_so(request, response) {
    var soObj = nlapiCreateRecord('salesorder');
    // this can be ignored so the tranid is automatically generated
    soObj.setFieldValue('tranid', 'SO-00001');
    /* set to 31 January 2019.
    the format of the date depends on the date setting on your Netsuite. 
    if the format of the date setting is d/m/yyyy, it will be 31/1/2019.
    if the format of the date setting is m/d/yyyy, it will be 1/31/2019.
    */
    soObj.setFieldValue('trandate', '31/1/2019');
    // the ID of the customer, not the name
    soObj.setFieldValue('entity', '1000001');
    // set ID of the location
    soObj.setFieldValue('location', '1');
    // set shipping cost (if any)
    soObj.setFieldValue('shippingcost', 10);
    // set shipping address to the customer's address detail ID
    soObj.setFieldValue('shipto', '1');
    // set status to Pending Fulfillment (B)
    soObj.setFieldValue('orderstatus', 'B');
    // set value of custom field, assuming the field type is text
    soObj.setFieldValue('custbody_text', 'Testing');
    // set value of custom field, assuming the field type is numeric
    soObj.setFieldValue('custbody_numeric', 150000);
    // set value of custom field, assuming the field type is list
    // 1 is the ID of the list, ex : {1: 'Testing'}
    soObj.setFieldValue('custbody_list', '1');

    // now, we are going to set the SO's line items
    // -----------------------------------------------------------------
    var lineNo = 1;
    // set the item ID at the first line
    soObj.setLineItemValue('item', 'item', lineNo, '3412');
    // set the item quantity
    soObj.setLineItemValue('item', 'quantity', lineNo, 3);
    // set the ID of tax code
    soObj.setLineItemValue('item', 'taxcode', lineNo, '1');
    // set the item's unit price
    soObj.setLineItemValue('item', 'rate', lineNo, 30.99);
    // set the item's description
    soObj.setLineItemValue('item', 'description', lineNo, 'This is a new item');
    // set the item's custom field
    soObj.setLineItemValue('item', 'custcol_category', lineNo, 'New Item');

    lineNo++;
    // set the item ID at the second line
    soObj.setLineItemValue('item', 'item', lineNo, '3413');
    // set the item quantity
    soObj.setLineItemValue('item', 'quantity', lineNo, 5);
    // set the ID of tax code
    soObj.setLineItemValue('item', 'taxcode', lineNo, '1');
    // set the item's unit price
    soObj.setLineItemValue('item', 'rate', lineNo, 40.25);
    // set the item's description
    soObj.setLineItemValue('item', 'description', lineNo, 'This is an expensive item');
    // set the item's custom field
    soObj.setLineItemValue('item', 'custcol_category', lineNo, 'Expensive Item');

    try {
        // create SO and get its new ID and then put the value into debug log
        var newSoId = nlapiSubmitRecord(soObj);
        nlapiLogExecution('DEBUG', 'newSoId', newSoId);
    } catch(ex) {
        // put the error message into error log
        nlapiLogExecution('ERROR', 'Error Creating SO', ex);
    }
}