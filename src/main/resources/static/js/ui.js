var config = {};
var gridSize = 5;

var allCells = new Array();

var addNewSliderDialog;
var addNewReadingDialog;
var addNewGaugeDialog;
var addNewTimerButtonDialog;
var addNewSwitchDialog;

var mainDialog;
var addPageDialog;
var fhemConfigDialog;
var readableContextMenuDialog;
var timerButtonContextMenuDialog;
var menuEntryContextMenuDialog;

var globalMenu = {};

function getConfiguration() {

	return $.ajax({
        type: "GET",
        url: "getConfiguration",
        data: {
			XHR: "1"
		},
		success: function(data) {
		    config = JSON.parse(data);
		    if (config.mode == 'edit') {
              $('#menu_mode').text('Set view mode');
            } else {
              $('#menu_mode').text('Set edit mode');
            }
            updateEditMode();
            if (typeof config.fhemHost == 'undefined') {
              setTimeout(function() {
                fhemConfigDialog.dialog( "open" );
              }, 1000);
            } else {
                // Now we can start the long poll.
                setTimeout(getFhemToken(), 1000);
                setTimeout(FW_longpoll(), 3000);
            }
		},
		error: function() {
		    $.toast({
               heading: 'Error',
               text: 'Die Konfiguration konnte nicht gelesen werden.',
               loader: false,
               hideAfter: 3000,
               showHideTransition: 'slide',
               icon: 'error'
           });

           fhemConfigDialog.dialog( "open" );
		}

    });
}

function saveConfiguration() {

   $.ajax({
        type: "GET",
        url: "saveConfiguration",
        data: {
            config: JSON.stringify(config),
            XHR: "1"
        },
        contentType: "application/json; charset=utf-8",
        error: function(data) {
            $.toast({
               heading: 'Error',
               text: JSON.stringify(cell),
               loader: false,
               hideAfter: 1000,
               showHideTransition: 'slide',
               icon: 'error'
           });
        }

       });

}

function updateEditMode() {
    if (typeof config.mode == 'undefined') {
      setTimeout(updateEditMode, 500);
    }

    $(".editable").each(function() {
      var mode;
      if (config.mode == 'edit') {
        mode = "enable";
      } else {
        mode = "disable";
      }
      $(this).draggable(mode);

      try {
        $(this).resizable(mode);
      } catch (error) {
        //console.log(error);
      }

    });

    $(".hideable").each(function() {
      if (config.mode == 'edit') {
        $(this).show();
      } else {
        $(this).hide();
      }
    });

    $(".canGetDisabled").each(function() {
      if (config.mode == 'edit') {
        $(this).removeClass("ui-state-disabled");
      } else {
        $(this).addClass("ui-state-disabled");
      }
    });

    for (var i in allCells) {
        var oneCell = allCells[i];
        if (typeof oneCell.setEnabled === 'function') {
            oneCell.setEnabled(config.mode == 'view');
        }

    }
}

function initDialogs() {

    $.ajax({
        type: "GET",
        url: "addPageDialog.html",
        cache: false,
        success: function(data) {
            createAddPageDialog(data);
        }
    });

    $.ajax({
        type: "GET",
        url: "fhemConfigDialog.html",
        cache: false,
        success: function(data) {
            createFhemConfigDialog(data);
        }
    });

    $.ajax({
        type: "GET",
        url: "mainDialog.html",
        cache: false,
        success: function(data) {
            createMainDialog(data);
        }
    });

    $.ajax({
        type: "GET",
        url: "readableContextMenuDialog.html",
        cache: false,
        success: function(data) {
            createReadableContextMenuDialog(data);
        }
    });

    $.ajax({
        type: "GET",
        url: "timerButtonContextMenuDialog.html",
        cache: false,
        success: function(data) {
            createTimerButtonContextMenuDialog(data);
        }
    });

    $.ajax({
        type: "GET",
        url: "menuEntryContextMenuDialog.html",
        cache: false,
        success: function(data) {
            createMenuEntryContextMenuDialog(data);
        }
    });

    $( ".icon-close" ).button( {
        icon: "ui-icon-close",
        showLabel: false
    } );

};

function createMenuEntryContextMenuDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    menuEntryContextMenuDialog = $( "#menuEntryContextMenuDialog" ).dialog({
      autoOpen: false,
      modal: true
    });
    $("#menuEntryContextMenuDialog").css('z-index', 9999);
    $( "#menuEntryContextMenu" ).menu();
}

function createReadableContextMenuDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    readableContextMenuDialog = $( "#readableContextMenuDialog" ).dialog({
      autoOpen: false,
      modal: true
    });
    $("#readableContextMenuDialog").css('z-index', 9999);
    $( "#readableContextMenu" ).menu();
}

function createTimerButtonContextMenuDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    timerButtonContextMenuDialog = $( "#timerButtonContextMenuDialog" ).dialog({
      autoOpen: false,
      modal: true
    });
    $("#timerButtonContextMenuDialog").css('z-index', 9999);
    $( "#timerButtonContextMenu" ).menu();
}

function createMainDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    mainDialog = $( "#mainDialog" ).dialog({
      autoOpen: false,
      modal: true
    });
    $("#mainDialog").css('z-index', 9999);

    $( "#mainMenu" ).menu();

    $('#menu_mode').click(function() {
        if (config.mode == 'edit') {
          config.mode = 'view';
          $('#menu_mode').text('Set edit mode');
        } else {
          config.mode = 'edit';
          $('#menu_mode').text('Set view mode');
        }
        updateEditMode();
        saveConfiguration();
        mainDialog.dialog( "close");
    });

    $('#menu_settings').click(function() {
        mainDialog.dialog( "close");
        fhemConfigDialog.dialog( "open" );
    });

    $('#menu_add_page').click(function() {
        mainDialog.dialog( "close");
        addNewPage();
    });

    $('#menu_add_menu').click(function() {
        mainDialog.dialog( "close");
        addMenu();
    });

    $('#menu_add_clock').click(function() {
        mainDialog.dialog( "close");
        addNewClock();
    });

    $('#menu_add_new_gauge').click(function(){
        mainDialog.dialog( "close");
        addNewGaugeDialog.open();
    });

    $('#menu_add_new_slider').click(function(){
        mainDialog.dialog( "close");
        addNewSliderDialog.open();
    });

    $('#menu_add_new_gauge').click(function(){
        mainDialog.dialog( "close");
        addNewGaugeDialog.open();
    });

    $('#menu_add_new_timer_button').click(function(){
        mainDialog.dialog( "close");
        addNewTimerButtonDialog.open();
    });

    $('#menu_add_new_reading').click(function(){
        mainDialog.dialog( "close");
        addNewReadingDialog.open();
    });

    $('#menu_add_new_switch').click(function(){
        mainDialog.dialog( "close");
        addNewSwitchDialog.open();
    });

}

function createAddPageDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    addPageDialog = $( "#addPageDialog" ).dialog({
      autoOpen: false,
      height: 380,
      width: 500,
      modal: true,
      buttons: {
        Ok: function() {
          console.log("Create page " + $( "#pageName" ).val());
          addPageDialog.dialog( "close" );
          sendNewPageToServer($( "#pageName" ).val());
        },
        Cancel: function() {
          addPageDialog.dialog( "close" );
        }
      }

    });

}

function createFhemConfigDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    fhemConfigDialog = $( "#fhemConfigDialog" ).dialog({
      autoOpen: false,
      height: 380,
      width: 500,
      modal: true,
      open: function(event, ui) {
          try {
              if (typeof config.fhemHost != 'undefined') {
                  $( "#fhemHost" ).attr('value', config.fhemHost);
              }
              if (typeof config.fhemUser != 'undefined') {
                  $( "#fhemUser" ).attr('value', config.fhemUser);
              }
              if (typeof config.fhemPassword != 'undefined') {
                  $( "#fhemPassword" ).attr('value', config.fhemPassword);
              }
              if (typeof config.proxyHost != 'undefined') {
                  $( "#proxyHost" ).attr('value', config.proxyHost);
              }
              if (typeof config.proxyPort != 'undefined') {
                  $( "#proxyPort" ).attr('value', config.proxyPort);
              }
          } catch (e) {

          }
        },
      close: function(event, ui) {

        },
      buttons: {
        Test: function() {
          $( "#status" ).text('Testing...');
          let fhemHost = $( "#fhemHost" ).val();
          let fhemUser = $( "#fhemUser" ).val();
          let fhemPassword = $( "#fhemPassword" ).val();
          let headers = new Headers();

          headers.set('Authorization', 'Basic ' + window.btoa(fhemUser + ":" + fhemPassword));
          var url = fhemHost;
          fetch(url, {method:'GET',
                 headers: headers,
                }).then(function(response) {
                  console.log(response);
                  if (! response.ok) {
                    $( "#status" ).text(response.statusText);
                  } else {
                    var token = response.headers.get('X-FHEM-csrfToken');
                    console.log("Token:" + token);
                    $( "#status" ).text('Ok');
                  }

                }).catch(function(error) {
                  $( "#status" ).text(error);
                });
        },
        Ok: function() {
          config.fhemHost = $( "#fhemHost" ).val();
          config.fhemUser = $( "#fhemUser" ).val();
          config.fhemPassword = $( "#fhemPassword" ).val();
          config.proxyHost = $( "#proxyHost" ).val();
          config.proxyPort = $( "#proxyPort" ).val();
          saveConfiguration();
          fhemConfigDialog.dialog( "close" );
        },
        Cancel: function() {
          fhemConfigDialog.dialog( "close" );
        }
      }
    });

    fhemConfigDialog.find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
      console.log("Let's see ...");
    });

}

function getPageName() {
    var url = new URL(window.location.href);
    var pageName = url.searchParams.get("page");
    if (pageName == null) {
      pageName = "home";
    }

    return pageName;
}

function getUIContent() {
	return $.ajax({
        type: "GET",
        url: "getUIContent",
        data: {
			XHR: "1",
			page: getPageName()
		},
		success: function(data) {
		    buildModel(data);
		    updateEditMode();
		}

    });

};

function getDeviceReading(device, reading, callbackFunction, yafuObject) {

    if ((typeof config.fhemHost === undefined) || fhemToken == null) {
      setTimeout(function() {
        getDeviceReading( device, reading, callbackFunction, yafuObject );
      }, 1000);
      return;
    }

    var url = encodeURI(config.fhemHost + '?XHR=1&fwcsrf=' + fhemToken + '&cmd=jsonlist2 ' + device + ' ' + reading);
    let username = config.fhemUser;
    let password = config.fhemPassword;

    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + window.btoa(username + ":" + password));
    fetch(url, {method:'GET',
           headers: headers,
          })
          .then(function(response) { return response.json(); })
          .then(function(data) {
            callbackFunction(data, yafuObject);
          }).catch(function(error) {
            console.log("Error:");
            console.log(error);
          });

};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function addNewPage() {
  addPageDialog.dialog( "open" );
}

function addMenu() {
  globalMenu = {
      "entries": [],
      "size": {
        "width": 100,
        "height": 300
      },
      "position": {
        "top": 10,
        "left": 10
      }
  }
  new YafuMenu(globalMenu, true);
}

function addNewClock() {
  var cell = {
    type: "Clock",
    name: "Clock",
    id: uuidv4(),
    position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y }
  };

  var clock = new YafuClock(cell, true);
  allCells.push(clock);
}

function buildModel(modelString) {
  var result = JSON.parse(modelString);
  var page = result.page;
  for (i in page.cells) {
      cell = page.cells[i];
      if (cell.type == "Slider") {
        var slider = new YafuSlider(cell, false);
        allCells.push(slider);
      } else if (cell.type == "Reading") {
        var reading = new YafuReading(cell, false);
        allCells.push(reading);
      } else if (cell.type == "Clock") {
        var clock = new YafuClock(cell, false);
        allCells.push(clock);
      } else if (cell.type == "Gauge") {
        var gauge = new YafuGauge(cell, false);
        allCells.push(gauge);
      } else if (cell.type == "TimerButton") {
        var timerButton = new YafuTimerButton(cell, false);
        allCells.push(timerButton);
      } else if (cell.type == "Switch") {
        var toggleButton = new YafuSwitch(cell, false);
        allCells.push(toggleButton);
      } else {
        addCell(cell.id, cell.name, false);
        cellElement = $("div[ui-uuid=" + cell.id + "]");
        cellElement.css({top: cell.position.top, left: cell.position.left, width: cell.size.width, height: cell.size.height, position:'absolute'});
      }
  }
  globalMenu = result.menu;

  if (typeof globalMenu != 'undefined' && globalMenu.entries != null) {
    new YafuMenu(globalMenu, false);
  }
}

function sendNewPageToServer(pageName) {
     $.ajax({
         type: "GET",
         url: "sendNewPageToServer",
         data: {
            page: pageName,
            XHR: "1"
        },
        contentType: "application/json; charset=utf-8",
        success: function() {
          location.reload();
        },
        error: function(data) {
            $.toast({
                     heading: 'Error',
                     text: JSON.stringify(cell),
                     loader: false,
                     hideAfter: 1000,
                     showHideTransition: 'slide',
                     icon: 'error'
                 });
        }

     });
}

function sendCellToServer(cell) {
     $.ajax({
         type: "GET",
         url: "sendCellToServer",
         data: {
            cell: JSON.stringify(cell),
            page: getPageName(),
            XHR: "1"
        },
        contentType: "application/json; charset=utf-8",
        error: function(data) {
            $.toast({
                     heading: 'Error',
                     text: JSON.stringify(cell),
                     loader: false,
                     hideAfter: 1000,
                     showHideTransition: 'slide',
                     icon: 'error'
                 });
        }

     });
}

function sendRemoveCellToServer(cellUUID) {
/*
    {
      "id": "e758d716-f7cb-4e73-9c18-15c1c8e3e831"
    }
*/
     var cell = {
       "id": cellUUID
     }

     $.ajax({
             type: "GET",
             url: "sendRemoveCellToServer",
             data: {
     			cell: JSON.stringify(cell),
     			page: getPageName(),
     			XHR: "1"
     		},
     		error: function(data) {
     		    $.toast({
                         heading: 'Error',
                         text: JSON.stringify(cell),
                         loader: false,
                         hideAfter: 5000,
                         showHideTransition: 'slide',
                         icon: 'error'
                     });
     		}

         });
}

function sendCommandToFhem(cmd) {
    console.log("Sending : " + cmd);

    $.toast({
        heading: 'Send command',
        text: cmd,
        loader: false,
        hideAfter: 2000,
        showHideTransition: 'slide',
        icon: 'info'
    });

    var url = config.fhemHost + '?XHR=1&cmd=' + cmd + '&fwcsrf=' + fhemToken;
    let username = config.fhemUser;
    let password = config.fhemPassword;

    let headers = new Headers();
    headers.set('Authorization', 'Basic ' + window.btoa(username + ":" + password));
    fetch(url, {method:'POST',
           headers: headers,
          }).then(function(response) {
            console.log("Response:");
            console.log(response);
          });
}

function refreshDraggable(sendToServer = false) {
    $(".yafu-draggable").each(function() {
      draggable = $(this).draggable({
          containment: "document",
          snap: false,
          grid: [ 10, 10 ],
          stack: ".yafu-draggable",
          stop: function( event, ui ) {
            var cell = {
              "name": 'Cell',
              "id": $(this).attr("ui-uuid"),
              "position": $(this).position(),
              "size": {width: $(this).width(), height: $(this).height()},
              "views": []
            }
            sendCellToServer(cell);
          }
      }).resizable({
          minWidth: 200,
          minHeight: 50,
          grid: [ 10, 10 ],
          helper: "ui-resizable-helper",
          stop: function( event, ui ) {
            var cell = {
              "name": 'Cell',
              "id": ui.element.attr("ui-uuid"),
              "position": ui.position,
              "size": ui.size,
              "views": []
            }
            sendCellToServer(cell);
          }
      });

      $(this).click(function() {
        var topZ = 0;
        $('.yafu-draggable').each(function(){
          var thisZ = parseInt($(this).css('z-index'), 10);
          if (thisZ > topZ){
            topZ = thisZ;
          }
        });
        console.log(topZ);
        $(this).css('z-index', topZ+1);
      });

      $(this).addClass("rounded-corners");

      if (sendToServer) {
          var cell = {
            "name": 'Cell',
            "id": $(this).attr("ui-uuid"),
            "position": $(this).position(),
            "size": {width: $(this).width(), height: $(this).height()},
            "views": []
          }
          sendCellToServer(cell);
      }
    });
}


// prepare the form when the DOM is ready
$(document).ready(function() {

  $('.icp-auto').iconpicker();

  // Setup the ajax indicator
  $('body').append('<div id="ajaxBusy"><p><img src="images/ajax-loader.gif"></p></div>');
  $("body").attr("generated", new Date().getTime());

  $('#ajaxBusy').css({
    display:"none",
    margin:"0px",
    paddingLeft:"0px",
    paddingRight:"0px",
    paddingTop:"0px",
    paddingBottom:"0px",
    position:"absolute",
    right:"3px",
    top:"3px",
     width:"auto"
  });

  addNewSliderDialog      = new AddNewSliderDialog();
  addNewReadingDialog     = new AddNewReadingDialog();
  addNewGaugeDialog       = new AddNewGaugeDialog();
  addNewTimerButtonDialog = new AddNewTimerButtonDialog();
  addNewSwitchDialog      = new AddNewSwitchDialog();

  document.addEventListener('contextmenu', function(evt) {
    mainDialog.mouse = {"x": evt.clientX, "y": evt.clientY};
    $("#mainDialog").css('z-index', 9999);
    mainDialog.dialog( "open" );
  }, false);


  document.oncontextmenu=RightMouseDown;
  function RightMouseDown() {
    return false;
  }

  initDialogs();

  getConfiguration();

  getUIContent();


});

var fhemToken = null;

function getFhemToken() {

    try {
        var url = config.fhemHost;
        let username = config.fhemUser;
        let password = config.fhemPassword;
        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + window.btoa(username + ":" + password));
        fetch(url, {method:'GET',
               headers: headers,
              }).then(function(response) {
                fhemToken = response.headers.get('X-FHEM-csrfToken');
                console.log("Token:" + fhemToken);
                if (fhemToken == null) {
                  setTimeout(getFhemToken, 5000);
                }
              }).catch(function(error) {
                console.log("Error:" + error);
                setTimeout(getFhemToken, 5000);
              });
    } catch (exc) {
        setTimeout(getFhemToken, 5000);
    }

}

// Ajax activity indicator bound to ajax start/stop document events
$(document).ajaxStart(function(){
  $('#ajaxBusy').show();
}).ajaxStop(function(){
  $('#ajaxBusy').hide();
});

//$.ajaxSetup({
//    cache: false
//});

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

Number.prototype.map = function (in_min, in_max, out_min, out_max) {
  return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

const mapNumber = (number, in_min, in_max, out_min, out_max) => {
  return (number - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

function toPossibleInteger(value) {
  var result = parseFloat(value);
  if (!isNaN(result)) {
    if (Number.isInteger(result)) {
      result = Math.floor(result);
    }
  } else {
    result = value;
  }

  return result;
}

function millisecondsToDateTime(millisecs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setMilliseconds(millisecs);
    return t;
}

function secondsToDateTime(secs) {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
}

Date.prototype.addHours = function(h) {
   this.setTime(this.getTime() + (h*60*60*1000));
   return this;
}