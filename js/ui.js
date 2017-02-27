(function() {
  "use strict";

  var modalProportion = 0.6;
  var modalAspectRatio = 2;
  var modalBorderRadiusProportion = 0.05;
  var modalFontSizeProportion = 0.034;
  var modalPaddingProportion = 0.08;

  var leaveButtonProportion = 0.1;
  var leaveButtonAspectRatio = 1.6;
  var leaveButtonFontSizeProportion = 0.02;

  function defaultButton(text, width) {
    var button = document.createElement("button");
    button.style.width = width;
    button.style.height = "100%";
    button.innerHTML = text;
    button.style.fontFamily = "Roboto";
    button.style.fontWeight = "bold";
    return button;
  }

  function defaultTextInput(placeholder, width, button) {
    var input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.style.width = width;
    input.style.height = "100%";
    input.style.fontFamily = "Roboto";
    input.style.fontWEight = "bold";
    input.style.textAlign = "center";
    input.addEventListener("keydown", function(e) { if(e.keyCode == 13) { button.click(); input.value = ""; } });
    return input;
  }

  var modalStates = ["unidentified", "waiting", "challenging", "challenged", "error"]

  var modalContentCallbacks = {
    unidentified: function(content) {
      var button = defaultButton("Register", "30%");
      var input = defaultTextInput("Nickname", "70%", button)

      button.addEventListener("click", function() {
        network.doNickname(input.value);
      });

      content.appendChild(input);
      content.appendChild(button);
    },

    waiting: function(content) {
      var button = defaultButton("Challenge", "30%");
      var input = defaultTextInput("Opponent", "70%", button)

      button.addEventListener("click", function() {
        network.doChallenge(input.value);
      });

      content.appendChild(input);
      content.appendChild(button);
    },

    challenging: function(content) {
      content.appendChild(defaultButton("Cancel", "80%"));
      content.lastChild.style.display = "block";
      content.lastChild.style.marginLeft = content.lastChild.style.marginRight = "auto";
      content.lastChild.addEventListener("click", function() {
        network.doCancel();
      });
    },

    challenged: function(content) {
      content.appendChild(defaultButton("Accept", "50%"));
      content.appendChild(defaultButton("Decline", "50%"));

      content.firstChild.addEventListener("click", function() {
        network.doAccept();
      });

      content.lastChild.addEventListener("click", function() {
        network.doCancel();
      });
    },

    error: function(content) {
      content.appendChild(defaultButton("Refresh", "80%"));
      content.lastChild.style.display = "block";
      content.lastChild.style.marginLeft = content.lastChild.style.marginRight = "auto";
      content.lastChild.addEventListener("click", function() {
        window.location.reload();
      });
    }
  };

  var currentState = null;

  var canvas;
  var context;

  var modalBackground;
  var modalWindows;
  var modalFlashes;

  var leaveButton;

  window.addEventListener("load", function() {
    canvas = document.createElement("canvas");
    context = canvas.getContext("2d");
    context.translate(0.5, 0.5);

    document.body.appendChild(canvas);

    leaveButton = document.createElement("button");
    leaveButton.innerHTML = "Leave Game";
    leaveButton.addEventListener("click", function() {
      network.doLeave();
    });
    leaveButton.style.display = "none";
    leaveButton.style.fontFamily = "Roboto";
    leaveButton.style.fontWeight = "bold";
    leaveButton.style.position = "absolute";
    leaveButton.style.left = "0";
    leaveButton.style.top = "0";
    document.body.appendChild(leaveButton);

    modalBackground = document.createElement("div");
    modalBackground.style.position = "fixed";
    modalBackground.style.left = "0";
    modalBackground.style.top = "0";
    modalBackground.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    modalBackground.style.width = "100%";
    modalBackground.style.height = "100%";
    document.body.appendChild(modalBackground);

    modalWindows = {};
    modalFlashes = {};

    modalStates.forEach(function(state) {
      var modalWindow = document.createElement("div");
      modalWindow.style.backgroundColor = "#eeeeee";
      modalWindow.style.border = "3px solid #006699";
      modalWindow.style.position = "fixed";
      modalWindow.style.display = "none";

      var modalFlash = document.createElement("div");
      modalFlash.style.width = "100%";
      modalFlash.style.height = "30%";
      modalFlash.style.textAlign = "center";
      modalFlash.style.fontFamily = "Roboto";
      modalWindow.appendChild(modalFlash);

      var modalContent = document.createElement("div");
      modalContent.style.marginTop = "3%";
      modalContent.style.width = "100%";
      modalContent.style.height = "67%";
      modalContentCallbacks[state](modalContent);
      modalWindow.appendChild(modalContent);

      modalWindows[state] = modalWindow;
      modalFlashes[state] = modalFlash;

      document.body.appendChild(modalWindow);
    });

    doResize();
    doStateTransition("waiting");
    requestAnimationFrame(doAnimation);
  });

  function doStateTransition(newState, message, success) {
    var stateNeedsModal = false;
    currentState = newState;

    for(var state in modalWindows) {
      var modalWindow = modalWindows[state];
      if(state === currentState) {
        stateNeedsModal = true;
        modalWindow.style.display = "block";
        modalFlashes[state].innerHTML = message + ".";
        modalFlashes[state].style.color = (success) ? "black" : "#cc0000";
      } else {
        modalWindow.style.display = "none";
      }
    }

    modalBackground.style.display = (stateNeedsModal) ? "block" : "none";
    leaveButton.style.display = (stateNeedsModal) ? "none" : "block";
  }

  function doResize() {
    var viewport = verge.viewport();

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    var modalWidth = Math.min(viewport.width, viewport.height) * modalProportion;
    var modalHeight = modalWidth / modalAspectRatio;
    var modalLeft = (viewport.width - modalWidth) / 2;
    var modalTop = (viewport.height - modalHeight) / 2;
    var modalBorderRadius = modalWidth * modalBorderRadiusProportion;
    var modalFontSize = modalWidth * modalFontSizeProportion;
    var modalPadding = modalWidth * modalPaddingProportion;

    for(var state in modalWindows) {
      var modalWindow = modalWindows[state];
      modalWindow.style.width = modalWidth + "px";
      modalWindow.style.height = modalHeight + "px";
      modalWindow.style.left = modalLeft + "px";
      modalWindow.style.top = modalTop + "px";
      modalWindow.style.borderRadius = modalBorderRadius + "px";
      modalWindow.style.fontSize = modalFontSize + "px";
      modalWindow.style.padding = modalPadding + "px";
      modalWindow.lastChild.childNodes.forEach(function(elem) {
        elem.style.fontSize = (1.2 * modalFontSize) + "px";
      });
    }

    var leaveButtonWidth = Math.min(viewport.width, viewport.height) * leaveButtonProportion;
    leaveButton.style.width = leaveButtonWidth + "px";
    leaveButton.style.height = (leaveButtonWidth / leaveButtonAspectRatio) + "px";
    leaveButton.style.fontSize = (Math.min(viewport.width, viewport.height) * leaveButtonFontSizeProportion) + "px";
  }

  window.addEventListener("resize", doResize);

  function doAnimation() {
    activeGame.render(canvas, context);
    requestAnimationFrame(doAnimation);
  }

  network.addEventListener("hello", function(data) {
    doStateTransition("unidentified", data.message, true);
  });

  network.addEventListener("nickname", function(data) {
    if(data.success) {
      doStateTransition("waiting", data.message, true);
    } else {
      doStateTransition("unidentified", data.message, false);
    }
  });

  network.addEventListener("challenge", function(data) {
    if(data.success) {
      doStateTransition("challenging", data.message, true)
    } else {
      doStateTransition("waiting", data.message, false);
    }
  });

  network.addEventListener("challenged", function(data) {
    doStateTransition("challenged", data.message, data.success);
  });

  network.addEventListener("cancel", function(data) {
    doStateTransition("waiting", data.message, data.success);
  });

  network.addEventListener("accept", function(data) {
    if(data.success) {
      doStateTransition("playing", data.message, true);
    } else {
      doStateTransition("waiting", data.message, false);
    }
  });

  network.addEventListener("leave", function(data) {
    doStateTransition("waiting", data.message, data.success);
  });

  network.addEventListener("error", function() {
    doStateTransition("error", "Something went wrong; please refresh the page", false);
  });
})();
