//
// Yet Another FHEM UI - Sliders
//

class YafuGauge {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    this.values = cell.values.split(',');
    if (this.values[0] == 'slider') {
      var vMin  = parseFloat(this.values[1]);
      var vStep = parseFloat(this.values[2]);
      var vMax  = parseFloat(this.values[3]);

      this.values = new Array();
      for (var i = vMin ; i <= vMax; i += vStep) {
        this.values.push(i);
      }
    }

    var myContent = '\
        <canvas ui-uuid="' + this.cell.id + '" id="' + this.cell.id + '" width="150" height="150" styl="background-color:#000000"></canvas>\
        <div label-id="' + this.cell.id + '" class="editable" style="position: absolute; top: 0px; left: 100px">' + this.cell.name + '</div>\
        <button id="button-close-' + this.cell.id + '" class="hideable" style="position: absolute; top: 0px; right: 0px; width: 18px; height: 18px;">x</button>\
    ';

    var cellElement = document.createElement("div");
    cellElement.setAttribute("class", "editable gauge-wrapper");
    cellElement.setAttribute("draggable-id", this.cell.id);
    cellElement.innerHTML = myContent;

    document.getElementById("uicontainer").appendChild(cellElement);

    if (typeof this.cell.labelPosition == 'undefined') {
      this.cell.labelPosition = {top: 0, left: 100};
    }
    $("div[label-id=" + this.cell.id + "]").css({top: this.cell.labelPosition.top, left: this.cell.labelPosition.left});

    if (typeof this.cell.position == 'undefined') {
      this.cell.position = {top: 50, left: 10};
    }
    if (typeof this.cell.size == 'undefined') {
      this.cell.size = {width: 150, height: 150};
    }
    $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});
    var canvas = document.getElementById(_this.cell.id);
    canvas.width = this.cell.size.width;
    canvas.height = this.cell.size.height;

    $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: true,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".gauge-wrapper",
      create: function( event, ui ) {
        if (sendToServer) {
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          _this.cell.values = _this.values.join();
          sendCellToServer(_this.cell);
        }
      },
      drag: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("div[label-id=" + _this.cell.id + "]").text(myLeft + ' , ' + myTop);
      },
      stop: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("div[label-id=" + _this.cell.id + "]").text(_this.cell.name);
        _this.cell.position = $(this).position();
        _this.cell.size = { width: $(this).width(), height: $(this).height() };
        _this.cell.values = _this.values.join();
        sendCellToServer(_this.cell);
      }
    }).resizable({
        minWidth: 30,
        minHeight: 30,
        grid: [ gridSize, gridSize ],
        helper: "ui-resizable-helper",
        resize: function( event, ui ) {
          $("div[label-id=" + _this.cell.id + "]").text(ui.size.width + ' x ' + ui.size.height);
        },
        stop: function( event, ui ) {
          $("div[label-id=" + _this.cell.id + "]").text(_this.cell.name);
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          _this.cell.values = _this.values.join();
          sendCellToServer(_this.cell);

          stopGauge(_this);
          var canvas = document.getElementById(_this.cell.id);
          canvas.width = ui.size.width;
          canvas.height = ui.size.height;
          startGauge(_this);
        }
    });

    $("div[label-id=" + this.cell.id + "]").draggable({
      stop: function( event, ui ) {
        _this.cell.labelPosition = $(this).position();
        sendCellToServer(_this.cell);
      }
    });

    this.handle = $( "#" + this.customHandleId );

    this.myGauge = $("div[ui-uuid=" + this.cell.id + "]");

    getDeviceReading(this.cell.device, this.cell.setter, function(data) {
      var response = JSON.parse(data);
      var value = response.Results[0].Readings[_this.cell.setter].Value;
      var index = -1;
      for (var i in _this.values) {
        if (_this.values[i] == value) {
          index = i;
        }
      }
      if (index != -1) {
        _this.readingAngle = mapNumber(index, 0, _this.values.length - 1, 0, 240) + 150;
        _this.readingValue = _this.values[index];
        drawGauge(_this);
      }


    });

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
      stopGauge(_this);
    });

    this.readingAngle = null;
    startGauge(this);
  }

  inform(deviceSetter, value) {
    var mySetter = this.cell.device + '-' + this.cell.setter;

    if (mySetter == deviceSetter) {
      var index = -1;
      for (var i in this.values) {
        if (this.values[i] == value) {
          index = i;
        }
      }
      if (index != -1) {
        this.readingAngle = mapNumber(index, 0, this.values.length - 1, 0, 240) + 150;
        this.readingValue = this.values[index];
        drawGauge(this);
      }
    }

  }

}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function startGauge(gauge) {
    gauge.canvas = document.getElementById(gauge.cell.id);
    gauge.context = gauge.canvas.getContext("2d");

    var radiusX = gauge.canvas.width / 2;
    var radiusY = gauge.canvas.height / 2;
    gauge.drag = false;

    gauge.canvas.addEventListener ("mouseout", function(evt) {
        if (config.mode == 'edit') {
          return;
        }
        gauge.helperAngle = null;
        gauge.drag = false;
        drawGauge(gauge);
    }, false);

    gauge.canvas.addEventListener ("mousedown", function(evt) {
        if (config.mode == 'edit') {
          return;
        }
        gauge.drag = true;
    }, false);

    gauge.canvas.addEventListener ("mouseup", function(evt) {
        if (config.mode == 'edit') {
          return;
        }
        if (!gauge.drag) {
          return;
        }

        gauge.drag = false;

        mouseToValue(gauge, evt);
        drawGauge(gauge);

        f = gauge.helperAngle;

        var angle = f + 150;
        if (f <= 30) {
          angle += 360;
        }
        var index = Math.round(mapNumber(angle, 300, 540, 0, gauge.values.length - 1));
        gauge.helperValue = gauge.values[index];

        var device = gauge.cell.device;
        var setter = gauge.cell.setter;
        var value = gauge.helperValue;
        var cmd = 'set ' + device + ' ' + setter + ' ' + value;
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

    }, false);

    gauge.canvas.addEventListener('mousemove', function(evt) {
        if (config.mode == 'edit') {
          return;
        }

        if (!gauge.drag) {
          return;
        }

        mouseToValue(gauge, evt);
        drawGauge(gauge);

      }, false);

    gauge.context.translate(radiusX, radiusY);
    radiusX = radiusX * 0.90;
    radiusY = radiusY * 0.90;
    gauge.radius = Math.min(radiusX, radiusY);

    drawGauge(gauge);
}

function mouseToValue(gauge, evt) {
  var mousePos = getMousePos(gauge.canvas, evt);
  var xRelCenter =   (mousePos.x - gauge.canvas.width  / 2);
  var yRelCenter = - (mousePos.y - gauge.canvas.height / 2);
  var f = Math.degrees(Math.atan((yRelCenter) / (xRelCenter)));

  var signX = Math.sign(xRelCenter);
  var signY = Math.sign(yRelCenter);
  if (signX == -1) {
    f = 180 + f;
  } else if (signY == -1) {
    f = 360 + f;
  }

  f = 360 - f;

  if (f > 30 && f < 150) {
    var diff1 = f - 30;
    var diff2 = 150 - f;
    if (diff1 > diff2) {
      f = 150;
    } else {
      f = 30;
    }
  }

  if (f <= 30 || f >= 150) {
      gauge.helperAngle = f;

      var angle = f + 150;
      if (f <= 30) {
        angle += 360;
      }
      var index = Math.round(mapNumber(angle, 300, 540, 0, gauge.values.length - 1));
      gauge.helperValue = gauge.values[index];
  }

}

function stopGauge(gauge) {

}

function drawGauge(gauge) {

    var width = gauge.radius * 0.03;

    // Store the current transformation matrix
    gauge.context.save();
    // Use the identity matrix while clearing the canvas
    gauge.context.setTransform(1, 0, 0, 1, 0, 0);
    gauge.context.clearRect(0, 0, gauge.canvas.width, gauge.canvas.height);
    // Restore the transform
    gauge.context.restore();

    gauge.context.strokeStyle='#666666';
    gauge.context.lineWidth = width;
    gauge.context.lineCap = "butt";
    for (var i=0; i < gauge.values.length; i++) {
      var angle = mapNumber(i, 0, gauge.values.length - 1, -30, 210);
      var pos = Math.radians(angle);

      drawSmallPiePiece(gauge.context, pos, gauge.radius * 0.6, gauge.radius * 0.9, '#666666', 2);
    }

    if (typeof gauge.readingAngle != undefined && gauge.readingAngle != null && !gauge.drag) {
      drawHandAndValue(gauge, gauge.readingAngle, toPossibleInteger(gauge.readingValue), '#F59B00', width);
    }

    if (gauge.helperAngle != null && gauge.drag) {
      drawHandAndValue(gauge, gauge.helperAngle, toPossibleInteger(gauge.helperValue), '#ffffff', width);
    }

}

function drawSmallPiePiece(context, angle, minRadius, maxRadius, color, th) {
    context.save();

    context.beginPath();
    context.rotate(-angle);
    context.strokeStyle=color;
    context.fillStyle=color;
    context.lineWidth = 1;
    context.rotate(-Math.radians(th / 2));
    context.moveTo(minRadius, 0);
    context.lineTo(maxRadius, 0);
    context.arc(0, 0, maxRadius, 0, Math.radians(th));
    context.rotate(Math.radians(th));
    context.lineTo(minRadius, 0);
    context.fill();

    context.restore();
}

function drawHandAndValue(gauge, angle, value, color, lineWidth) {
    var pos = Math.radians(angle);

    drawSmallPiePiece(gauge.context, -pos, gauge.radius * 0.59, gauge.radius * 0.91, color, 3);

    gauge.context.beginPath();
    gauge.context.fillStyle = color;
    gauge.context.textAlign = "center";
    gauge.context.textBaseline="middle";
    gauge.context.font = "" + (gauge.radius / 5) + "px Arial";

    gauge.context.fillText(value, 0, 0);
}


class GaugeDialog {

  constructor() {
    var dialogContent = '\
      <p>Select a device and a device setter</p>\
      <table>\
          <tr>\
              <td><label for="gaugeDialogSelectDevice">Device</label></td>\
              <td>\
                  <select id="gaugeDialogSelectDevice">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
          <tr>\
              <td><label for="gaugeDialogSelectSetter">Setter</label></td>\
              <td>\
                  <select id="gaugeDialogSelectSetter">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
      </table>';

    var divElement = document.createElement("div");
    divElement.id="gaugeDialog";
    divElement.title="New Gauge";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var _this = this;

    this.dialog = $( "#gaugeDialog" ).dialog({
      width: 650,
      height: 350,
      modal: true,
      autoOpen: false,
      buttons: {
        Ok: function() {
          var foundDevice = _this.jsonDevices.find(function(element) {
            return element.deviceName == _this.selectedDevice;
          });
          var foundSetter = foundDevice.setters.find(function(element) {
            return typeof element[_this.selectedSetter] != 'undefined';
          });
          var values = foundSetter[_this.selectedSetter];

          $( this ).dialog( "close" );

          _this.addNewGauge(values);
        }
      }
    });

    $( "#gaugeDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedDevice = data.item.element.attr("fhem-device");
        _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");

        var selectSetterDOM = document.getElementById("gaugeDialogSelectSetter");
        selectSetterDOM.innerHTML = "";

        var foundDevice = _this.jsonDevices.find(function(element) {
          return element.deviceName == _this.selectedDevice;
        });

        var setters = foundDevice.setters;
        var isFirst = 1;
        for (var i in setters) {
          for (var setterName in setters[i]) {
            var option = document.createElement("option");
            option.setAttribute("setter", setterName);
            option.innerHTML = setterName;

            selectSetterDOM.options.add(option);
            if (isFirst == 1) {
              isFirst = 0;
              _this.selectedSetter = setterName;
            }
          }
        }
        $( "#gaugeDialogSelectSetter" ).selectmenu( "refresh" );

      }
    });

    $( "#gaugeDialogSelectSetter" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedSetter = data.item.element.attr("setter");
      }
    });
  }

  addNewGauge(valuesString) {
    var cell = {
        type: "Gauge",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        setter: this.selectedSetter,
        values: valuesString
    };
    var gauge = new YafuGauge(cell, true);
    allCells.push(gauge);

  }

  updateNewGaugeDialog(devicesString) {
    this.jsonDevices = JSON.parse(devicesString);

    var selectDeviceDOM = document.getElementById("gaugeDialogSelectDevice");
    selectDeviceDOM.innerHTML = '';
    for (var i in this.jsonDevices) {
        var optionDiv = document.createElement("option");
        optionDiv.innerHTML = this.jsonDevices[i].displayName;
        optionDiv.setAttribute("fhem-device", this.jsonDevices[i].deviceName);
        optionDiv.setAttribute("fhem-deviceName", this.jsonDevices[i].displayName);
        selectDeviceDOM.appendChild(optionDiv);
    }
    this.selectedDevice = this.jsonDevices[0].deviceName;
    this.selectedDeviceName = this.jsonDevices[0].displayName;
    $( "#gaugeDialogSelectDevice" ).selectmenu( "refresh" );

    var selectSetterDOM = document.getElementById("gaugeDialogSelectSetter");
    selectSetterDOM.innerHTML = '';
    var setters = this.jsonDevices[0].setters;

    var isFirst = 1;
    for (var i in setters) {
      for (var setterName in setters[i]) {
        var optionDiv = document.createElement("option");
        optionDiv.innerHTML = setterName;
        optionDiv.setAttribute("setter", setterName);
        selectSetterDOM.appendChild(optionDiv);
        if (isFirst == 1) {
          isFirst = 0;
          this.selectedSetter = setterName;
        }
      }
    }
    $( "#gaugeDialogSelectSetter" ).selectmenu( "refresh" );
  }

  open() {
    this.dialog.dialog( "open" );
    var _this = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithGauges",
    			XHR: "1"
    		},
    		success: function(data) {
    		    _this.updateNewGaugeDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }

}