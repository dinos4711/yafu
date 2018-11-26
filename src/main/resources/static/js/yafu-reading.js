
class YafuReading {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    var myContent = '\
        <div ui-uuid="' + this.cell.id + '" title="' + this.cell.name + ' : ' + this.cell.reading + '" yafu-inform="' + this.cell.device + '-' + this.cell.reading + '">\
          ?\
        </div>\
        <button id="button-close-' + this.cell.id + '" class="hideable" style="position: absolute; top: 0px; right: -18px; width: 18px; height: 18px;"></button>\
        <button id="button-settings-' + this.cell.id + '" class="hideable" style="position: absolute; top: 0px; right: 14px; width: 18px; height: 18px;"></button>\
    ';

    var cellElement = document.createElement("div");
    cellElement.setAttribute("class", "editable reading-wrapper");
    cellElement.setAttribute("draggable-id", this.cell.id);
    cellElement.innerHTML = myContent;

    document.getElementById("uicontainer").appendChild(cellElement);

    if (typeof this.cell.position == 'undefined') {
      this.cell.position = {top: 50, left: 10};
    }
    if (typeof this.cell.size == 'undefined') {
      this.cell.size = {width: 400, height: 20};
    }
    $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});

    $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: true,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".reading-wrapper",
      create: function( event, ui ) {
        if (sendToServer) {
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          _this.sendReadingToServer(_this.cell);
        }
      },
      drag: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("div[ui-uuid=" + _this.cell.id + "]").text(myLeft + ' , ' + myTop);
      },
      stop: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("div[ui-uuid=" + _this.cell.id + "]").text(_this.lastReading);
        _this.cell.position = $(this).position();
        _this.cell.size = { width: $(this).width(), height: $(this).height() };
        _this.sendReadingToServer(_this.cell);
      }
    }).resizable({
        minWidth: 10,
        minHeight: 10,
        grid: [ gridSize, gridSize ],
        resize: function( event, ui ) {
          $("div[ui-uuid=" + _this.cell.id + "]").text(ui.size.width + ' x ' + ui.size.height);
        },
        stop: function( event, ui ) {
          $("div[ui-uuid=" + _this.cell.id + "]").text(_this.lastReading);
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          _this.sendReadingToServer(_this.cell);
        }
    });

    getDeviceReading(this.cell.device, this.cell.reading, function(data) {
      var response = JSON.parse(data);
      var value = response.Results[0].Readings[_this.cell.reading].Value;
      _this.lastReading = value;
      $("div[ui-uuid=" + _this.cell.id + "]").text(value);
    });

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
    });

    $("button[id=button-settings-" + this.cell.id + "]").button({
      icon: "ui-icon-gear",
      showLabel: false
    }).on("click", function() {
      openSettings();
    });
  }

  openSettings() {

  }

  inform(deviceReading, value) {
    var myReading = this.cell.device + '-' + this.cell.reading;

    if (myReading == deviceReading) {
      $("div[ui-uuid=" + this.cell.id + "]").text(value);
      this.lastReading = value;
    }

  }

  sendReadingToServer(cell) {
  /*
      {
        "type": "Reading",
        "name": "Wohnbereich",
        "id": "e758d716-f7cb-4e73-9c18-15c1c8e3e831",
        "device": "WT_Wohnbereich",
        "reading": "desiredTemperature",
        "position": { left: "0", top: "0"},
        "size": { width: "200", height: "50"},
        "views": []
      }
  */

       $.ajax({
            type: "GET",
            url: "sendCellToServer",
            data: {
                cell: JSON.stringify(cell),
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

}

class ReadingDialog {
  constructor() {
      var dialogContent = '\
        <p>Select a device and a device reading</p>\
        <table>\
            <tr>\
                <td><label for="readingDialogSelectDevice">Device</label></td>\
                <td>\
                    <select id="readingDialogSelectDevice">\
                        <option>Please wait ...</option>\
                    </select>\
                </td>\
            </tr>\
            <tr>\
                <td><label for="readingDialogSelectReading">Reading</label></td>\
                <td>\
                    <select id="readingDialogSelectReading">\
                        <option>Please wait ...</option>\
                    </select>\
                </td>\
            </tr>\
        </table>';

      var divElement = document.createElement("div");
      divElement.id="readingDialog";
      divElement.title="New Reading";
      divElement.innerHTML = dialogContent;
      document.body.appendChild(divElement);

      var _this = this;

      this.dialog = $( "#readingDialog" ).dialog({
        width: 650,
        height: 350,
        modal: true,
        autoOpen: false,
        buttons: {
          Ok: function() {
            var foundDevice = _this.jsonDevices.find(function(element) {
              return element.deviceName == _this.selectedDevice;
            });
            var foundReading = foundDevice.readings.split(',').find(function(element) {
              return typeof element[_this.selectedReading] != 'undefined';
            });

            $( this ).dialog( "close" );

            _this.addNewReading();
          }
        }
      });

      $( "#readingDialogSelectDevice" ).selectmenu({
        width: 450,
        change: function( event, data ) {
          _this.selectedDevice = data.item.element.attr("fhem-device");
          _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");

          var selectReadingDOM = document.getElementById("readingDialogSelectReading");
          selectReadingDOM.innerHTML = "";

          var foundDevice = _this.jsonDevices.find(function(element) {
            return element.deviceName == _this.selectedDevice;
          });

          var readings = foundDevice.readings.split(',');
          var isFirst = 1;
          for (var i in readings) {
            var optionDiv = document.createElement("option");
            optionDiv.innerHTML = readings[i];
            optionDiv.setAttribute("reading", readings[i]);
            selectReadingDOM.options.add(optionDiv);
            if (isFirst == 1) {
              isFirst = 0;
              _this.selectedReading = readings[i];
            }
          }
          $( "#readingDialogSelectReading" ).selectmenu( "refresh" );

        }
      });

      $( "#readingDialogSelectReading" ).selectmenu({
        width: 450,
        change: function( event, data ) {
          _this.selectedReading = data.item.element.attr("reading");
        }
      });
    }

  addNewReading(foundDevice, foundReading) {
    var cell = {
        type: "Reading",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        reading: this.selectedReading
    };

    var reading = new YafuReading(cell, true);
    allCells.push(reading);

  }

  updateNewReadingDialog(devicesString) {
    this.jsonDevices = JSON.parse(devicesString);

    var selectDeviceDOM = document.getElementById("readingDialogSelectDevice");
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
    $( "#readingDialogSelectDevice" ).selectmenu( "refresh" );

    var selectReadingDOM = document.getElementById("readingDialogSelectReading");
    selectReadingDOM.innerHTML = '';
    var readings = this.jsonDevices[0].readings.split(',');

    var isFirst = 1;
    for (var i in readings) {
      var optionDiv = document.createElement("option");
      optionDiv.innerHTML = readings[i];
      optionDiv.setAttribute("reading", readings[i]);
      selectReadingDOM.appendChild(optionDiv);
      if (isFirst == 1) {
        isFirst = 0;
        this.selectedReading = readings[i];
      }
    }
    $( "#readingDialogSelectReading" ).selectmenu( "refresh" );
  }

  open() {
    this.dialog.dialog( "open" );
    var _this = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithReadings",
    			XHR: "1"
    		},
    		success: function(data) {
    		    _this.updateNewReadingDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }
}