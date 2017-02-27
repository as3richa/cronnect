(function() {
  "use strict";

  var gridWidth = 7;
  var gridHeight = 6;

  var pieceColors = [
    ["#006090", "#006090"],
    ["#ff0000", "#cc0000"],
    ["#00bbee", "#0099cc"]
  ];
  var pieceWinColor = ["#fff44f", "#ffd700"];
  var outlineColor = "#000000";
  var boardColor = "#faa518";
  var backgroundColor = "#006699";
  var textColor = "#000000";

  function drawPiece(context, colors, x, y, r) {
    var outer = colors[0];
    var inner = colors[1];

    context.lineWidth = r * 0.15;
    context.strokeStyle = outlineColor;
    context.fillStyle = outer;

    context.beginPath();
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.stroke();
    context.fill();


    context.fillStyle = inner;
    context.beginPath();
    context.arc(x, y, r * 0.8, 0, 2 * Math.PI);
    context.fill();
  }

  function renderGame(
      context,
      width, height,
      player1Name, player1Score,
      player2Name, player2Score,
      grid,
      fallingPiece, fallingPieceColumn, fallingPieceRow,
      won, player1Won, winGrid
  ) {
    context.save();

    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, width, height);

    var size = Math.min(width, height);
    context.translate((width - size) / 2, (height - size) / 2);

    var boardWidth = size * 0.88;
    var boardHeight = boardWidth / gridWidth * gridHeight;
    var boardLeft = (size - boardWidth) / 2;
    var boardTop = (size - boardHeight) / 2;

    var boardHorizontalPadding = boardWidth * 0.02;
    var boardVerticalPadding = boardHeight * 0.02;
    var gridLeft = boardLeft + boardHorizontalPadding;
    var gridTop = boardTop + boardVerticalPadding;
    var cellSize = (boardWidth - 2 * boardHorizontalPadding) / gridWidth;
    var pieceRadius = cellSize / 2 * 0.8;

    context.fillStyle = boardColor;
    context.fillRect(boardLeft, boardTop, boardWidth, boardHeight);

    for(var i = 0; i < gridWidth; i ++) {
      for(var j = 0; j < gridHeight; j ++) {
        var cellLeft = gridLeft + i * cellSize;
        var cellTop = gridTop + j * cellSize;

        drawPiece(context, winGrid[i][j] ? pieceWinColor : pieceColors[grid[i][j]],
          cellLeft + cellSize / 2, cellTop + cellSize / 2, pieceRadius);
      }
    }

    var textMid = boardTop + boardHeight + 0.06 * size;
    var textSize = 0.04 * size;
    context.font = "bold " + textSize + "px Roboto";
    context.textBaseline = "middle";

    if(player1Name) {
      context.textAlign = "left";

      drawPiece(context, (won && player1Won) ? pieceWinColor : pieceColors[1],
        boardLeft + boardHorizontalPadding + textSize * 0.9, textMid, textSize * 0.9);
      context.fillStyle = textColor;
      context.fillText(player1Name + " - " + player1Score, boardLeft + boardHorizontalPadding + 2.1 * textSize, textMid);
    }

    if(player2Name) {
      context.textAlign = "right";

      drawPiece(context, (won && !player1Won) ? pieceWinColor : pieceColors[2],
        boardLeft + boardWidth - boardHorizontalPadding - textSize * 0.9, textMid, textSize * 0.9);
      context.fillStyle = textColor;
      context.fillText(player2Score + " - " + player2Name, boardLeft + boardWidth - boardHorizontalPadding - 2.1 * textSize, textMid);
    }

    if(fallingPiece) {
      var pieceHorizontalCenter = gridLeft + fallingPieceColumn * cellSize + cellSize / 2;
      var pieceVerticalCenter = gridTop + fallingPieceRow * cellSize + cellSize / 2;

      if(fallingPieceRow < 0) {
        context.save();

        context.beginPath();
        context.moveTo(boardLeft, 0);
        context.lineTo(boardLeft, boardTop - 1);
        context.lineTo(boardLeft + boardWidth, boardTop - 1);
        context.lineTo(boardLeft + boardWidth, 0);
        context.lineTo(boardLeft, 0);
        context.clip();

        drawPiece(context, pieceColors[fallingPiece], pieceHorizontalCenter, pieceVerticalCenter, pieceRadius);

        context.restore();
      }

      [Math.floor(fallingPieceRow), Math.ceil(fallingPieceRow)].forEach(function(row) {
        context.save();

        context.beginPath();
        context.arc(pieceHorizontalCenter, gridTop + row * cellSize + cellSize / 2, pieceRadius, 0, 2 * Math.PI);
        context.clip();

        drawPiece(context, pieceColors[fallingPiece], pieceHorizontalCenter, pieceVerticalCenter, pieceRadius);

        context.restore();
      });
    }

    context.lineWidth = size * 0.005;
    context.strokeStyle = outlineColor;
    context.strokeRect(boardLeft, boardTop, boardWidth, boardHeight);

    context.restore();
  }

  window.renderGame = renderGame;
})();
