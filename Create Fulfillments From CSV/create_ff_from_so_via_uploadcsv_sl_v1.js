/*
In this suitelet, we upload CSV files containing Sales Order information
Then, we create Item Fulfillment using the provided information

The CSV format MUST BE like this in order for the below code to work :
SO Id       Item Id     Bin Id  Inventory No    Qty
12345678    593335      68      10546           122
12345678    470792      2       10916           2497
12345678    470882      2       10918           8
12345678    470792      2       10915           4998
56780212    18051       50                      2

NOTES :
The ids and the Inventory No are internal ids, not Document Number
If the item is non-lot, then leave the Inventory No blank

From the below code, the no. of Fulfillments created will be based on SO and Bin.
The above CSV example will create 3 Fulfillments : from Bin Id 2, 50 and 68.
*/
function main(request, response) {
    var context = nlapiGetContext();
    var currentEnv = context.getEnvironment();
    var scriptId = context.getScriptId();
    var deploymentId = context.getDeploymentId();
    var locationId = '1';
    var shipStatus = 'C'; // C is Shipped
    var html = '';

    // in case the locationId in production environment is different
    if (currentEnv.toLowerCase() == 'production')
        locationId = '2';

    // this form will show initially
    // user will upload CSV with the format explained above
    if (request.getMethod() == 'GET')  {
        var form = nlapiCreateForm('Sales Order to Create Fulfillment');
        var fileField = form.addField('custpage_file', 'file', 'Select CSV File').setMandatory(true);
        
        form.addSubmitButton('Process');
        response.writePage(form);
    }
    // if user hits Process button, the following code will run
    else {
        var currentUrl = nlapiResolveURL('suitelet', scriptId, deploymentId);
        var encrypted = false;
        var objFile = request.getFile('custpage_file');
        // error message if no file is selected
        if (objFile == null) {
            displayError(response, 'Please select file. Do not let it empty.', currentUrl);
            return;
        }

        var fileName = objFile.getName();
        var fileType = objFile.getType();
        var content = objFile.getValue();
        var extension = getExtension(fileName);

        // error message if file extension is not csv
        if (extension == '' || (fileType.toLowerCase() != 'csv' && fileType.toLowerCase() != 'excel')) {
            displayError(response, 'File must be CSV', currentUrl);
            return;
        }

        // if opened from Windows, the csv file type is read as Excel
        // therefore, the content is encrypted. we must decrypt first
        // if opened from Linux or Mac, the csv file type is correct. still csv
        if (extension == 'csv' && fileType.toLowerCase() == 'excel') {
            encrypted = true;
            content = decode_base64(content);
        }

        // arrange the content and put into an object variable
        var content_arr = content.split("\n");
        var datas = {};
        for (var j = 0 ; j < content_arr.length ; j++) {
            // ignore the header, only process the non-header data
            if (j == 0) continue;

            var line_arr = (content_arr[j]).split(",");
            soInternalId = line_arr[0];
            itemId = line_arr[1];
            binId = line_arr[2];
            inventoryLotId = line_arr[3];
            qty = parseInt(line_arr[4]);

            if (soInternalId == '') break;

            var data = {
                'inventoryLotId': inventoryLotId ? inventoryLotId : '',
                'qty': qty
            };

            if (!datas.hasOwnProperty(soInternalId)) 
                datas[soInternalId] = {};
            if (!datas[soInternalId].hasOwnProperty(binId))
                datas[soInternalId][binId] = {};
            if (!datas[soInternalId][binId].hasOwnProperty(itemId))
                datas[soInternalId][binId][itemId] = [];
            datas[soInternalId][binId][itemId].push(data);
        }

        html += '<ol>';

        // begin creating Fulfillment
        for (var so in datas) {
            for (var bin in datas[so]) {
                html += '<li>Sransfer Order Internal ID : ' + so + '<br />';
                try {
                    html += 'Bin Internal ID : ' + bin + '<br />';
                    var ffObj = nlapiTransformRecord('salesorder', so, 'itemfulfillment');
                    ffObj.setFieldValue('createdfrom', so);
                    ffObj.setFieldValue('shipstatus', shipStatus);
                    var itemCount = ffObj.getLineItemCount('item');
                    for (var i = 1 ; i <= itemCount ; i++) {
                        ffObj.selectLineItem('item', i);
                        var currentItemId = ffObj.getCurrentLineItemValue('item', 'item');
                        for (var item in datas[so][bin]) {
                            if (item == currentItemId) {
                                html += 'Item : ' + item + '<br />';
                                // calculate total items
                                var totalItemQty = 0;
                                var itemDetails = datas[so][bin][item];
                                // get the total item quantity first
                                for (var idetail in itemDetails) {
                                    totalItemQty += parseInt(itemDetails[idetail].qty);
                                }
                                ffObj.setCurrentLineItemValue('item', 'quantity', totalItemQty);
                                ffObj.setCurrentLineItemValue('item', 'itemreceive', 'T');
                                ffObj.setCurrentLineItemValue('item', 'location', locationId);
                                itemSubRecord = ffObj.editCurrentLineItemSubrecord('item', 'inventorydetail');
                                if (!itemSubRecord) {
                                    itemSubRecord = ffObj.createCurrentLineItemSubrecord('item', 'inventorydetail');
                                }
                                itemSubRecord.setFieldValue('item', item);
                                itemSubRecord.setFieldValue('quantity', totalItemQty);
                                var counter = 1;
                                var complinelength = itemSubRecord.getLineItemCount('inventoryassignment');
                                for (var detail in itemDetails) {
                                    // if the item is non-lot
                                    if (itemDetails[detail].inventoryLotId == '') {
                                        if (parseInt(complinelength) > 0 && counter <= complinelength)
                                            itemSubRecord.selectLineItem('inventoryassignment', counter);
                                        else
                                            itemSubRecord.selectNewLineItem('inventoryassignment');
                                    }
                                    // if the item is lot numbered
                                    else {
                                        itemSubRecord.selectNewLineItem('inventoryassignment');
                                    }
                                    itemSubRecord.setCurrentLineItemValue('inventoryassignment', 'quantity', itemDetails[detail].qty);
                                    itemSubRecord.setCurrentLineItemValue('inventoryassignment', 'binnumber', bin);
                                    // lot numbered item
                                    if (itemDetails[detail].inventoryLotId != '') {
                                        itemSubRecord.setCurrentLineItemValue('inventoryassignment', 'issueinventorynumber', itemDetails[detail].inventoryLotId);
                                        html += 'Inventory Lot ID : ' + itemDetails[detail].inventoryLotId + '<br />';
                                    }
                                    html += 'Qty : ' + itemDetails[detail].qty + '<br />';
                                    itemSubRecord.commitLineItem('inventoryassignment');
                                    counter++;
                                }
                                itemSubRecord.commit();
                            }
                        }
                        ffObj.commitLineItem('item');
                    }
                    var ffInternalId = nlapiSubmitRecord(ffObj);
                    html += 'Success. New FF Internal ID : ' + ffInternalId + '<br />';
                } catch(ex) {
                    html += 'Error : ' + ex + '<br />';
                }
                html += '</li>';
            }
        }

        html += '</ol>';
        response.write(html);
    }
}

function displayError(response, msg, currentUrl) {
    var errorMsg = msg;
    var str = '';
    str = '<h2 style="color:#ff0000">' + msg + '</h2>' + '<a href="'+currentUrl+'">Back to Previous Page</a>';
    response.write(str);
}

function getExtension(fileName) {
    var fileNameArr = fileName.split('.');
    if (fileNameArr.length > 1) {
        return (fileNameArr[fileNameArr.length - 1]);
    }
    return '';
}

function decode_base64(s) {
    var b=l=0, r='',
    m='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
    s.split('').forEach(function (v) {
    b=(b<<6)+m.indexOf(v); l+=6;
    while (l>=8) r+=String.fromCharCode((b>>>(l-=8))&0xff);
    });
    return r;
}