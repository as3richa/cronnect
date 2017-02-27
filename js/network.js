(function() {
  var socket;

  function sendJSON(object) {
    var string = JSON.stringify(object);
    if(socket.readyState === WebSocket.OPEN) {
      try {
        if(network.debug) {
          console.log("> ", string);
        }
        socket.send(string);
      } catch(err) {
        return;
      }
    } else {
      return;
    }
  }

  var listeners = {};

  window.network = {
    doNickname: function(nickname) {
      sendJSON({"command": "NICKNAME", "nickname": nickname})
    },

    doChallenge: function(target) {
      sendJSON({"command": "CHALLENGE", "target": target})
    },

    doAccept: function() {
      sendJSON({"command": "ACCEPT"})
    },

    doCancel: function() {
      sendJSON({"command": "CANCEL"})
    },

    doDrop: function(column) {
      sendJSON({"command": "DROP", "column": column});
    },

    doLeave: function() {
      sendJSON({"command": "LEAVE"});
    },

    debug: true,

    addEventListener: function(command, callback) {
      command = command.toLowerCase();
      listeners[command] = listeners[command] || [];
      listeners[command].push(callback);
    }
  };

  window.addEventListener("load", function() {
    var proto = (window.location.protocol === "http:") ? "ws:" : "wss:";
    var path = proto + "//" + window.location.hostname + ":" + window.location.port + "/engine";

    socket = new WebSocket(path);

    var errorHandler = function(e) {
      if(network.debug) {
        console.log(e);
      }
      listeners["error"].forEach(function(callback) { callback(e); });
    };

    socket.addEventListener("close", errorHandler);
    socket.addEventListener("error", errorHandler);

    socket.addEventListener("message", function(payload) {
      if(network.debug) {
        console.log("< ", payload.data);
      }

      var data;
      try {
        data = JSON.parse(payload.data);
        var command = data.command.toLowerCase();
      } catch(e) {
        return;
      }

      var callbacks = listeners[command] || [];
      callbacks.forEach(function(callback) {
        callback(data);
      });
    });
  });
})();
