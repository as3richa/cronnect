(function() {
  "use strict;"

  var cooldown = 100;

  var leftDown = false;
  var rightDown = false;
  var dropDown = false;

  function keyHandler(code, down) {
    switch(code) {
      case 37:
        leftDown = down;
        break;
      case 39:
        rightDown = down;
        break;
      case 32:
        dropDown = down;
        break;
    }
  }

  window.addEventListener("keydown", function(e) {
    keyHandler(e.keyCode, true);
  });

  window.addEventListener("keyup", function(e) {
    keyHandler(e.keyCode, false);
  });

  setInterval(function() {
    if(leftDown && !rightDown) {
      activeGame.moveLeft();
    } else if(rightDown && !leftDown) {
      activeGame.moveRight();
    } else if(dropDown) {
      activeGame.drop();
    }
  }, cooldown);
})();
