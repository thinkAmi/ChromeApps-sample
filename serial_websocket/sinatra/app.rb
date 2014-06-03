require 'sinatra'
require 'sinatra-websocket'
require 'thin'

set :server, 'thin'
set :sockets, []



get '/' do
  logger.info('accessed')

  unless request.websocket?
    erb :index
  else
    logger.info('received')
    request.websocket do |ws|
      ws.onopen do
        logger.info('opened')
        settings.sockets << ws
      end

      ws.onmessage do |msg|
        logger.info(msg)
        EM.next_tick { settings.sockets.each{|s| s.send(msg) } }

      end
      ws.onclose do
        logger.info('closed')
      end
    end
  end
end


__END__


@@index
<html>
  <body>
    <h1>Received Data</h1>
    <div id="log"></div>
  </body>

  <script type="text/javascript">
    const WEBSOCKET_HOST = 'ws://192.168.0.1:4567';

    function addMessage(msg) {
      var log = document.getElementById('log');
      var p = document.createElement('p');
      p.textContent = msg;
      log.appendChild(p);
    }


    var socket;

    var loadedListener = function() {
      console.log('loaded');

      socket = new WebSocket(WEBSOCKET_HOST);

      socket.onopen = function() {
        addMessage("Socket Status: " + socket.readyState + " (open)");
      }

      socket.onclose = function() {
        addMessage("Socket Status: " + socket.readyState + " (closed)");
      }

      socket.onmessage = function(msg) {
        addMessage("Received: " + msg.data);

        // 送ったら閉じとく
        socket.close();
      }
    };
    window.addEventListener('load', loadedListener, false);
  </script>
</html>