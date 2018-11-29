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

    });

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
      stopGauge(_this);
    });

    startGauge(this);
  }

  inform(deviceSetter, value) {
    var mySetter = this.cell.device + '-' + this.cell.setter;

    if (mySetter == deviceSetter) {
      for (var v in this.values) {
        if (this.values[v] == value) {
          this.myGauge.slider("value", v);
          this.handle.text( value );
        }
      }
    }

  }

}

function startGauge(gauge) {
    gauge.canvas = document.getElementById(gauge.cell.id);
    gauge.ctx = gauge.canvas.getContext("2d");

    var radiusX = gauge.canvas.width / 2;
    var radiusY = gauge.canvas.height / 2;
    gauge.ctx.translate(radiusX, radiusY);
    radiusX = radiusX * 0.90;
    radiusY = radiusY * 0.90;
    gauge.radius = Math.min(radiusX, radiusY);

    drawGauge(gauge.ctx, gauge.radius);
}

function stopGauge(gauge) {

}

function drawGauge(ctx, radius) {


    var width = radius * 0.07;
    ctx.beginPath();
    ctx.strokeStyle='#ccc';
    ctx.lineWidth = width;
    ctx.lineCap = "butt";
    for (var i=0; i <= 180; i+=15) {
      var pos = Math.radians(i);
      ctx.moveTo(0,0);
      ctx.rotate(-pos);
      ctx.moveTo(radius * 0.5, 0);
      ctx.lineTo(radius * 0.9, 0);
      ctx.stroke();
      ctx.rotate(+pos);
    }
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