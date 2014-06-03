const WEBSOCKET_HOST = "ws://192.168.0.1:4567";

var connectionId = '';
var stringReceived = '';
var arrayReceived = [];


//--------------------------
//  Serialport
//--------------------------
/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
function convertArrayBufferToString(buf){
  var bufView = new Uint8Array(buf);
  var encodedString = String.fromCharCode.apply(null, bufView);
  return decodeURIComponent(escape(encodedString));
}


var onConnectCallback = function(connectionInfo){
  //  onReceiveイベントでconnectionIdの一致を確認するので、保持しておく
  connectionId = connectionInfo.connectionId;
}


var clickedSerialListener = function() {
  console.log('clickedSerial');

  var e = document.getElementById('port');
  var port = e.options[e.selectedIndex].value;

  chrome.serial.connect(port, {bitrate: 9600, receiveTimeout: 5000}, onConnectCallback);
}
document.getElementById('connectSerial').addEventListener("click", clickedSerialListener, false);



var loadedListener = function() {
  console.log('loaded');

  //  デバイスをリスト化して、画面に表示する
  chrome.serial.getDevices(function(devices) {
    console.log('input');
    var selection = document.getElementById('port');

    devices.forEach(function(port){
      //  select menu に追加
      var option = document.createElement('option');
      option.value = port.path;
      //  今のところ、手元の環境ではport.displayNameが設定されていない
      option.text = port.displayName ? port.displayName : port.path;
      selection.appendChild(option);
    });
  });
};
window.addEventListener('load', loadedListener, false);



var onReceiveCallback = function(info) {
  console.log('received');
  if (info.connectionId == connectionId && info.data) {

    //  こいつがうまく動かない：メソッドを定義してあげるとよい
    var str = convertArrayBufferToString(info.data);

    //  改行コード来たら、一つのデータの終端
    if (str.charAt(str.length-1) === '\n') {
      arrayReceived.push(stringReceived);
      stringReceived = '';
    } else {
      stringReceived += str;
    }
  }
};
chrome.serial.onReceive.addListener(onReceiveCallback);


var onDisconnectCallback = function(result) {
  if (result) { console.log('disconnected'); }
  else { console.log('error'); }
}


var onReceiveErrorCallback = function(info) {
  console.log('end');
  //  receiveTimeoutで設定した時間が経過すると、このイベントが発生
  //  ->データの受信は全て完了したとみなし、受信データを一覧表示する
  console.log(arrayReceived.join(','));

  var disconnect = chrome.serial.disconnect(connectionId, onDisconnectCallback);


  var upload = document.getElementById('upload');
  arrayReceived.forEach(function(item) {
    var li = document.createElement('li');
    li.textContent = item;
    upload.appendChild(li);
  });
}
chrome.serial.onReceiveError.addListener(onReceiveErrorCallback);


//--------------------------
//  WebSocket
//--------------------------
var clickedWebSocketListener = function() {
  var ws = new WebSocket(WEBSOCKET_HOST);

  ws.onopen = function() {
    console.log('opened');
    ws.send(arrayReceived.join(''));

    //  送ったら閉じとく
    ws.close();

    //  同じデータを再送しないよう、送ったものはクリアしておく
    stringReceived = '';
    arrayReceived = [];
    var upload = document.getElementById('upload');
    while (upload.firstChild) {
      upload.removeChild(upload.firstChild);
    }
  };

  ws.onclose = function() {
    console.log('closed');
  };
};
document.getElementById('connectWebSocket').addEventListener("click", clickedWebSocketListener, false);



