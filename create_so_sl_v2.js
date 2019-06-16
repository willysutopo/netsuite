/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/runtime', 'N/task', 'N/search', 'N/record'],
    function(ui, runtime, task, search, record) {
        function onRequest(context) {
            var soObj = record.create({type:'salesorder'});
            // this can be ignored so the tranid is automatically generated
            soObj.setValue({
                fieldId: 'tranid', 
                value: 'SO-00001'
            });
            /* set to 31 January 2019.
            the format of the date depends on the date setting on your Netsuite. 
            if the format of the date setting is dd/mm/yyyy, it will be 31/01/2019.
            if the format of the date setting is mm/dd/yyyy, it will be 01/31/2019.
            */
            soObj.setValue({
                fieldId: 'trandate',
                value: '31/01/2019'
            });
            // the ID of the customer, not the name
            soObj.setValue({
                fieldId: 'entity',
                value: '1000001'
            });
            // set ID of the location
            soObj.setValue({
                fieldId: 'location',
                value: '1'
            });
            // set shipping cost (if any)
            soObj.setValue({
                fieldId: 'shippingcost',
                value: 10
            });
            // set shipping address to the customer's address detail ID
            soObj.setValue({
                fieldId: 'shipto',
                value: '1'
            });
            // set status to Pending Fulfillment (B)
            soObj.setValue({
                fieldId: 'orderstatus',
                value: 'B'
            });
            // set value of custom field, assuming the field type is text
            soObj.setValue({
                fieldId: 'custbody_text',
                value: 'Testing'
            });
            // set value of custom field, assuming the field type is numeric
            soObj.setValue({
                fieldId: 'custbody_numeric',
                value: 150000
            });
            // set value of custom field, assuming the field type is list
            // 1 is the ID of the list, ex : {1: 'Testing'}
            soObj.setValue({
                fieldId: 'custbody_list',
                value: '1'
            });

            // now, we are going to set the SO's line items
            // -----------------------------------------------------------------
            // remember, in Suitescript v2, the line number is 0-based
            var lineNo = 0;
            // set the item ID at the first line
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: lineNo,
                value: '3412'
            });
            // set the item quantity
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: lineNo,
                value: 3
            });
            // set the ID of tax code
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                line: lineNo,
                value: '1'
            });
            // set the item's unit price
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: lineNo,
                value: 30.99
            });
            // set the item's description
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                line: lineNo,
                value: 'This is a new item'
            });
            // set the item's custom field
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_category',
                line: lineNo,
                value: 'New Item'
            });


            lineNo++;
            // set the item ID at the second line
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: lineNo,
                value: '3413'
            });
            // set the item quantity
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: lineNo,
                value: 5
            });
            // set the ID of tax code
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                line: lineNo,
                value: '1'
            });
            // set the item's unit price
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: lineNo,
                value: 40.25
            });
            // set the item's description
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'description',
                line: lineNo,
                value: 'This is an expensive item'
            });
            // set the item's custom field
            soObj.setSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_category',
                line: lineNo,
                value: 'Expensive Item'
            });

            try {
                // create SO and get its new ID and then put the value into debug log
                var newSoId = soObj.save();
                log.debug('newSoId', newSoId);
            } catch(ex) {
                // put the error message into error log
                log.error('Error Creating SO', ex);
            }
        }

        return {
            onRequest: onRequest
        };
    });