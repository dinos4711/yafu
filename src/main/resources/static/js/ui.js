var config = {};

var allCells = new Array();
var sliderDialog;
var readingDialog;
var gridSize = 5;

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

}

function initDialogs() {

    fhemConfigDialog = $( "#fhemConfigDialog" ).dialog({
      autoOpen: false,
      height: 300,
      width: 500,
      modal: true,
      open: function(event, ui) {
          console.log('Opening');
          try {
              if (typeof config.fhemHost != 'undefined') {
                  $( "#fhemHost" ).attr('value', config.fhemHost);
                  $( "#fhemUser" ).attr('value', config.fhemUser);
                  $( "#fhemPassword" ).attr('value', config.fhemPassword);
              }
          } catch (e) {

          }
        },
      close: function(event, ui) {
          console.log('Closing');
        },
      buttons: {
        Test: function() {
          $( "#status" ).text('Testing...');
          let fhemHost = $( "#fhemHost" ).val();
          let fhemUser = $( "#fhemUser" ).val();
          let fhemPassword = $( "#fhemPassword" ).val();
          let headers = new Headers();
          console.log(fhemUser + ":" + fhemPassword + "@" + fhemHost);
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
          saveConfiguration();
          fhemConfigDialog.dialog( "close" );
          location.reload();
        },
        Cancel: function() {
          fhemConfigDialog.dialog( "close" );
        }
      }
    });

    form = fhemConfigDialog.find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
      console.log("Let's see ...");
    });

    mainDialog = $( "#mainDialog" ).dialog({
      autoOpen: false,
    });
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

    $('.menu_add_new_cell').click(function() {
        addNewCell();
    });

    $('#menu_settings').click(function() {
        mainDialog.dialog( "close");
        fhemConfigDialog.dialog( "open" );
    });

    $('#menu_clock').click(function() {
        mainDialog.dialog( "close");
        addNewClock();
    });

    $('#menu_add_new_slider').click(function(){
        mainDialog.dialog( "close");
        sliderDialog.open();
    });

    $('#menu_add_new_reading').click(function(){
        mainDialog.dialog( "close");
        readingDialog.open();
    });

    $( ".icon-close" ).button( {
        icon: "ui-icon-close",
        showLabel: false
    } );
};

function getContentFromServer(cmdline) {
	cmdline = cmdline.replace('  ', ' ');

	return $.ajax({
        type: "GET",
        url: "getContentFromServer",
        data: {
			cmd: cmdline,
			XHR: "1"
		},
		success: function(data) {
		    buildModel(data);
		    updateEditMode();
		}

    });

};

function getDeviceReading(device, reading, callbackFunction) {

	return $.ajax({
        type: "GET",
        url: "getDeviceReading",
        data: {
			"device": device,
			"reading": reading,
			XHR: "1"
		},
		success: function(data) {
		  callbackFunction(data);
		}
    });

};

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function addNewClock() {
  var cell = {
    type: "Clock",
    name: "Clock",
    id: uuidv4(),
  };

  var clock = new YafuClock(cell, true);
  allCells.push(clock);
}

function addNewCell() {
    var cellUUID = uuidv4();
    var cellName = "Cell";

    addCell(cellUUID, cellName, true);
    sendCellToServer(cellUUID, cellName);
}

function addCell(cellUUID = uuidv4(), cellName = 'Cell', sendToServer = false) {

    var cell = document.createElement("div");
    cell.setAttribute("class", "yafu-draggable ui-widget-content");
    cell.setAttribute("ui-uuid", cellUUID);

    var divLeft = document.createElement("div");
    divLeft.setAttribute("class", "left");
    var divButtonGear = document.createElement("button");
    divButtonGear.setAttribute("class", "icon-gear stick-top");
    divLeft.appendChild(divButtonGear);

    var divMiddle = document.createElement("div");
    divMiddle.setAttribute("class", "ui-widget-header rounded-corners middle-remain");
    var header = document.createElement("header");
    header.innerHTML = cellUUID;
    divMiddle.appendChild(header);

    var divRight = document.createElement("div");
    divRight.setAttribute("class", "right");
    var divButtonTrash = document.createElement("button");
    divButtonTrash.setAttribute("class", "icon-trash stick-top");
    divRight.appendChild(divButtonTrash);

    cell.appendChild(divLeft);
    cell.appendChild(divMiddle);
    cell.appendChild(divRight);

    var element = document.getElementById("uicontainer");
    element.appendChild(cell);
//    document.appendChild(cell);

    $(divButtonGear).button( {
        icon: "ui-icon-gear",
        showLabel: false
    } ).on( "click", function() {
           $("div[ui-uuid=" + cellUUID + "]").remove();
           });

    $(divButtonTrash).button( {
        icon: "ui-icon-trash",
        showLabel: false
    } ).on( "click", function() {
        sendRemoveCellToServer(cellUUID, cellName);
        $("div[ui-uuid=" + cellUUID + "]").remove();
    } );

    refreshDraggable(sendToServer);


}

function buildModel(modelString) {
  var json = JSON.parse(modelString);
  var firstPage = json.pages[0];
  for (i in firstPage.cells) {
      cell = firstPage.cells[i];
      if (cell.type == "Slider") {
        var slider = new YafuSlider(cell, false);
        allCells.push(slider);
      } else if (cell.type == "Reading") {
        var reading = new YafuReading(cell, false);
        allCells.push(reading);
      } else if (cell.type == "Clock") {
        var clock = new YafuClock(cell, false);
        allCells.push(clock);
      } else {
        addCell(cell.id, cell.name, false);
        cellElement = $("div[ui-uuid=" + cell.id + "]");
        cellElement.css({top: cell.position.top, left: cell.position.left, width: cell.size.width, height: cell.size.height, position:'absolute'});
      }
  }
}

function sendCellToServer(cellUUID, cellName, position = { left: "0", top: "0"}, size = { width: "200", height: "50"}) {
/*
    {
      "name": "cell 1 in page 2",
      "id": "e758d716-f7cb-4e73-9c18-15c1c8e3e831",
      "views": []
    }
*/

     var cell = {
       "name": cellName,
       "id": cellUUID,
       "position": position,
       "size": size,
       "views": []
     }

     $.ajax({
             type: "GET",
             url: "sendCellToServer",
             data: {
     			cell: JSON.stringify(cell),
     			XHR: "1"
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

function refreshDraggable(sendToServer = false) {
    $(".yafu-draggable").each(function() {
      draggable = $(this).draggable({
          containment: "document",
          snap: true,
          grid: [ 10, 10 ],
          stack: ".yafu-draggable",
//          handle: "div,slider",
          stop: function( event, ui ) {
            sendCellToServer($(this).attr("ui-uuid"), 'Cell', $(this).position(), {width: $(this).width(), height: $(this).height()});
          }
      }).resizable({
          minWidth: 200,
          minHeight: 50,
          grid: [ 10, 10 ],
          helper: "ui-resizable-helper",
          stop: function( event, ui ) {
            sendCellToServer(ui.element.attr("ui-uuid"), 'Cell', ui.position, ui.size);
          }
      });

      $(this).click(function() {
        var topZ = 0;
        $('.yafu-draggable').each(function(){
          var thisZ = parseInt($(this).css('zIndex'), 10);
          if (thisZ > topZ){
            topZ = thisZ;
          }
        });
        console.log(topZ);
        $(this).css('zIndex', topZ+1);
      });

      $(this).addClass("rounded-corners");

      if (sendToServer) {
          sendCellToServer($(this).attr("ui-uuid"), 'Cell', $(this).position(), {width: $(this).width(), height: $(this).height()});
      }
    });
}


// prepare the form when the DOM is ready
$(document).ready(function() {

  $( document ).tooltip();

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

  sliderDialog = new SliderDialog();
  readingDialog = new ReadingDialog();

  $( "#newSliderDialog" ).dialog({
    autoOpen: false,
  });

  $( "#newReadingDialog" ).dialog({
    autoOpen: false,
  });

  document.oncontextmenu=RightMouseDown;
    document.onmousedown = mouseDown;

    function mouseDown(e) {
        if (e.which==3) {//righClick
            mainDialog.dialog( "open" );
        }
    }

    function RightMouseDown() {
      return false;
    }

    initDialogs();

    getConfiguration();

    getContentFromServer("getUIContent");

    playWithCanvas();



});

function playWithCanvas() {
    var pixel;
    var posX;
    var posY;
    var dirX;
    var dirY;
    var maxSteps;
    var step;
    var context;

    var htmlCanvas = document.getElementById('backgroundCanvas');

    initialize();

    function initialize() {
      window.addEventListener('resize', resizeCanvas, false);
      resizeCanvas();
    }

    function redraw() {
      context.clearRect(0, 0, htmlCanvas.width, htmlCanvas.height);

      context.fillStyle="#007700";
      context.fillRect(posX, posY, 1, 1);
      //context.putImageData( pixel, posX, posY );

      check();
      setTimeout(redraw, 30);
    }

    function check() {
      step++;
      if (step > maxSteps) {
        step = 1;
        maxSteps = Math.floor(Math.random() * 50) + 10;
        dirX = Math.floor(Math.random() * 5) - 2;
        dirY = Math.floor(Math.random() * 5) - 2;
      }

      posX = posX + dirX;
      posY = posY + dirY;

      if (posX > htmlCanvas.width - 1) {
        dirX = -dirX;
        posX = htmlCanvas.width - 1;
      }
      if (posX < 0) {
        dirX = -dirX;
        posX = 0;
      }
      if (posY > htmlCanvas.height - 1) {
        dirY = -dirY;
        posY = htmlCanvas.height - 1;
      }
      if (posY < 0) {
        dirY = -dirY;
        posY = 0;
      }

    }

    function resizeCanvas() {
      context = htmlCanvas.getContext('2d');
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight;

      posX = htmlCanvas.width / 2;
      posY = htmlCanvas.height / 2;
      dirX = Math.floor(Math.random() * 5) - 2;
      dirY = Math.floor(Math.random() * 5) - 2;
      maxSteps = Math.floor(Math.random() * 50) + 10;
      step = 1;

      pixel = context.createImageData(1,1); // only do this once per page
      var d  = pixel.data;                        // only do this once per page
      d[0]   = 0;
      d[1]   = 127;
      d[2]   = 0;
      d[3]   = 255;

      redraw();
    }

}

var fhemToken = null;

function getFhemToken() {
    console.log("Start getFhemToken()");

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

    console.log("End getFhemToken()");
}

// Ajax activity indicator bound to ajax start/stop document events
$(document).ajaxStart(function(){
  $('#ajaxBusy').show();
}).ajaxStop(function(){
  $('#ajaxBusy').hide();
});



