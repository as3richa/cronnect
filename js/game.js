(function() {
  "use strict";

  var gameInProgress = false;
  var canCurrentlyPlay = false;
  var myPlayerNumber = null;
  var myName = null;
  var otherName = null;
  var queuedWin = null;

  var realActiveGame = new GameEngine("as3richa", "Adam");

  function updatePlayability(currentPlayer) {
    if(!canCurrentlyPlay && currentPlayer == myPlayerNumber) {
      canCurrentlyPlay = true;
      realActiveGame.moveTo(3);
    } else {
      canCurrentlyPlay = false;
    }
  }

  function commitQueuedWin() {
    if(queuedWin) {
      canCurrentlyPlay = false;
      realActiveGame.wonAt = Date.now();
      realActiveGame.winner = queuedWin.winner;
      realActiveGame.winGrid = queuedWin.grid;
      if(queuedWin.winner === 1) {
        realActiveGame.player1Score ++;
      } else {
        realActiveGame.player2Score ++;
      }
      queuedWin = null;
    }
  }

  window.activeGame = {
    moveLeft: function() {
      if(gameInProgress && canCurrentlyPlay) {
        realActiveGame.moveLeft();
      }
    },

    moveRight: function() {
      if(gameInProgress && canCurrentlyPlay) {
        realActiveGame.moveRight();
      }
    },

    drop: function() {
      if(gameInProgress && canCurrentlyPlay) {
        var column = realActiveGame.currentColumn;
        if(realActiveGame.drop()) {
          canCurrentlyPlay = false;
          network.doDrop(column);
        }
      }
    },

    render: function(canvas, context) {
      realActiveGame.render(canvas, context);
    }
  }

  window.addEventListener("load", function() {
    network.addEventListener("nickname", function(e) {
      if(e.success) {
        myName = e.nickname;
      }
    });

    network.addEventListener("challenge", function(e) {
      if(e.success) {
        otherName = e.target;
        myPlayerNumber = 1;
      }
    });

    network.addEventListener("challenged", function(e) {
      if(e.success) {
        otherName = e.challenger;
        myPlayerNumber = 2;
      }
    });

    network.addEventListener("accept", function(e) {
      if(e.success) {
        gameInProgress = true;
        var player1, player2;
        if(myPlayerNumber == 1) {
          player1 = myName, player2 = otherName;
        } else {
          player1 = otherName, player2 = myName;
        }

        realActiveGame = new GameEngine(player1, player2);
        realActiveGame.addEventListener("dropdone", updatePlayability);
        realActiveGame.addEventListener("reset", updatePlayability);
        realActiveGame.addEventListener("dropdone", commitQueuedWin);
        updatePlayability(realActiveGame.currentPlayer);
      }
    });

    network.addEventListener("drop", function(e) {
      if(e.success) {
        if(e.player !== myPlayerNumber) {
          realActiveGame.drop(e.column);
        }
      }
    });

    network.addEventListener("leave", function(e) {
      if(e.success) {
        gameInProgress = false;
        canCurrentlyPlay = false;
      }
    });

    network.addEventListener("win", function(e) {
      if(e.success) {
        queuedWin = e;
      }
    });
  });
})();
