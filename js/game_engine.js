(function() {
  "use strict";

  var gridWidth = 7;
  var gridHeight = 6;

  var dropInitialRow = -1.15;
  var dropSpeed = 0.02;

  var winFreezeTime = 5000;

  function GameEngine(player1Name, player2Name) {
    this.eventListeners = {};

    this.player1Name = player1Name;
    this.player2Name = player2Name;

    this.player1Score = 0;
    this.player2Score = 0;

    this.reset();
  }

  GameEngine.prototype.reset = function() {
    this.grid = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0]
    ];

    this.winGrid = [
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false],
      [false, false, false, false, false, false]
    ];
    this.winner = null;
    this.wonAt = null;

    this.currentPlayer = (this.player1Score + this.player2Score) % 2 + 1;

    this.hoveringOrDropping = false;
    this.currentColumn = null;
    this.finishRow = null;
    this.droppedAt = null;

    var currentPlayer = this.currentPlayer;
    (this.eventListeners["reset"] || []).forEach(function(callback) {
      callback(currentPlayer);
    });
  };

  GameEngine.prototype.moveLeft = function() {
    this.commit();
    if(this.currentColumn > 0) {
      this.currentColumn --;
      return true;
    }

    return false;
  };

  GameEngine.prototype.moveRight = function() {
    this.commit();
    if(this.currentColumn < gridWidth - 1) {
      this.currentColumn ++;
      return true;
    }

    return false;
  };

  GameEngine.prototype.moveTo = function(where) {
    this.commit();
    if(0 <= where && where < gridWidth) {
      this.hoveringOrDropping = true;
      this.currentColumn = where;

      return true;
    }

    return false;
  };

  GameEngine.prototype.drop = function(where = null) {
    this.commit();

    if(where === null) {
      where = this.currentColumn;
    }

    if(0 <= where && where < gridWidth) {
      this.hoveringOrDropping = true;
      this.currentColumn = where;

      if(this.grid[this.currentColumn][0] === 0) {
        this.droppedAt = Date.now();

        for(
          this.finishRow = 0;
          this.finishRow + 1 < gridHeight && this.grid[this.currentColumn][this.finishRow + 1] === 0;
          this.finishRow ++) { }

        return true;
      }
    }

    return false;
  };

  GameEngine.prototype.dropOrMoveTo = function(where) {
    this.commit();
    if(where === this.currentColumn) {
      return this.drop(where);
    } else {
      return this.moveTo(where);
    }
  };

  GameEngine.prototype.commit = function() {
    if(this.wonAt) {
      this.reset();
    } else if(this.droppedAt) {
      this.grid[this.currentColumn][this.finishRow] = this.currentPlayer;

      this.hoveringOrDropping = false;
      this.currentColumn = null;
      this.finishRow = null;
      this.droppedAt = null;

      this.currentPlayer = (this.currentPlayer === 1) ? 2 : 1;

      var currentPlayer = this.currentPlayer;
      (this.eventListeners["dropdone"] || []).forEach(function(callback) {
        callback(currentPlayer);
      });
    }
  };

  GameEngine.prototype.render = function(canvas, context) {
    var piece = null;
    var column = null;
    var row = null;

    if(this.winner) {
      if(Date.now() - this.wonAt >= winFreezeTime) {
        this.commit();
      }
    } else if(this.hoveringOrDropping) {
      piece = this.currentPlayer;
      column = this.currentColumn;
      row = dropInitialRow;
      if(this.droppedAt) {
        row += dropSpeed * (Date.now() - this.droppedAt);
      }

      if(row >= this.finishRow) {
        this.commit();
        piece = column = row = null;
      }
    }

    renderGame(
        context,
        canvas.width, canvas.height,
        this.player1Name, this.player1Score,
        this.player2Name, this.player2Score,
        this.grid,
        piece, column, row,
        false, false, this.winGrid
    );
  };

  GameEngine.prototype.addEventListener = function(event, callback) {
    this.eventListeners[event] = this.eventListeners[event] || [];
    this.eventListeners[event].push(callback);
  };

  window.GameEngine = GameEngine;
})();
