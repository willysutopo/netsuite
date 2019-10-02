<?php
/*
$scriptId is the Restlet ID of the Netsuite we want to call
*/
function callRestlet($scriptId) {
    $url = NS_RESTLET_HOST.'/app/site/hosting/restlet.nl';
    $realm = NS_ACCOUNT;
    $oauth_consumer_key = NS_OAUTH_CONSUMER_KEY;
    $oauth_consumer_secret = NS_OAUTH_CONSUMER_SECRET;
    $oauth_token = NS_OAUTH_TOKEN_ID;
    $oauth_secret = NS_OAUTH_TOKEN_SECRET;

    $data = is_array($vars) ? json_encode($vars) : $vars;

    $arr = array('script' => $scriptId, 'deploy' => '1');
    $method = 'POST';
    $completeUrl = $url.'?script='.$scriptId.'&deploy=1';
    $oauth_signature_method = 'HMAC-SHA1';
    $oauth_version = '1.0';
    $oauth_nonce = createNonce(30);
    $oauth_timestamp = time();

    // BUILD SIGNATURE
    $params = compact("oauth_consumer_key", "oauth_nonce", "oauth_signature_method", "oauth_timestamp", "oauth_token", "oauth_version");
    $params = array_merge($arr, $params);
    uksort($params, 'strcmp');

    // convert params to string
    $concatenatedParams = http_build_query($params);

    // form base string (first key)
    $baseString = strtoupper($method) . '&' . urlencode_rfc3986($url) . '&' . urlencode_rfc3986($concatenatedParams);

    // form secret (second key)
    $secret = urlencode_rfc3986($oauth_consumer_secret) . '&' . urlencode_rfc3986($oauth_secret);
    // make signature and append to params
    $oauth_signature = urlencode_rfc3986(base64_encode(hash_hmac('sha1', $baseString, $secret, true)));

    $ch = curl_init();

    curl_setopt_array($ch, array(
        CURLOPT_URL => $completeUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 300,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_HTTPHEADER => array(
            "authorization: OAuth realm=\"$realm\",oauth_consumer_key=\"$oauth_consumer_key\",oauth_token=\"$oauth_token\",oauth_signature_method=\"$oauth_signature_method\",oauth_timestamp=\"$oauth_timestamp\",oauth_nonce=\"$oauth_nonce\",oauth_version=\"$oauth_version\",oauth_signature=\"$oauth_signature\"",
            "content-type: application/json",
            "user-agent-x: SuiteScript-Call"
        ),
    ));

    $retry_limit = 10;
    $status = false;

    for ($i = 0 ; $i < $retry_limit ; $i++) {
        try {
            $server_output = curl_exec($ch);
            $httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if ($httpcode != 400) {
                $status = true;
                break;
            }
        }
        catch (Exception $ex) {
            $code = $ex->getCode();
            $errmessage = $ex->getMessage();
            if ($code == 'SSS_REQUEST_LIMIT_EXCEEDED' || $errmessage == 'SSS_REQUEST_LIMIT_EXCEEDED') {
                // retry until reach the limit
            }
        }
    }

    curl_close($ch);

    if ($status == true) {
        if ($server_output !== false) {
            $server_output = json_decode($server_output, true);
            /* 
            assume, from Netsuite, the output is like this :
            {
                'status': 'success', // the status can be 'success' or 'error'
                'data': 'any data'
            }
            */
            if ($server_output['status'] == 'success' || $server_output['status'] == 'error')
                return $server_output;
        }
    }
    return false;
}

function createNonce($length) {
    $chars = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    $clen = strlen($chars)-1;
    $id = '';

    for ($i = 0; $i < $length; $i++) {
        $id .= $chars[mt_rand(0, $clen)];
    }

    return ($id);
}

function urlencode_rfc3986($string) {
    if ($string === 0) {
        return 0;
    }
    if ($string == '0') {
        return '0';
    }
    if (strlen($string) == 0) {
        return '';
    }
    if (is_array($string)) {
        throw new \Exception('Array passed to urlencode_rfc3986');
    }
    $string = urlencode($string);
    // FIX: urlencode of ~ and '+'
    $string = str_replace(Array(
            '%7E',
            '+'
        ), // Replace these
        array(
            '~',
            '%20'
        ), // with these
        $string);
    return $string;
}
?>