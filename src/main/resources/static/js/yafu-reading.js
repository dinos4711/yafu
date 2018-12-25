//
// Yet Another FHEM UI - Reading
//

class YafuReading {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    var myContent = '\
        <div ui-uuid="' + this.cell.id + '" title="' + this.cell.name + ' : ' + this.cell.reading + '" yafu-inform="' + this.cell.device + '-' + this.cell.reading + '" style="text-align: center;">\
          ?\
        </div>\
        <div icon-id="' + this.cell.id + '" class="reading-wrapper">\
          <i class="' + this.cell.icon + '"></i>\
        </div>\
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
      this.cell.size = {width: 50, height: 20};
    }
    $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});
    $("div[draggable-id=" + this.cell.id + "]").css('z-index', 100);

    $("div[draggable-id=" + this.cell.id + "]").contextMenu({
        selector: 'div',
        events: {
           show : function(options){
                return config.mode == 'edit';
           },
        },
        callback: function(key, options) {
            if (key == 'delete') {
                sendRemoveCellToServer(_this.cell.id);
                $("div[draggable-id=" + _this.cell.id + "]").remove();
            }
        },
        items: {
            "delete": {name: "Delete", icon: "delete"},
        }
    });

    $("div[ui-uuid=" + _this.cell.id + "]").tooltip();

    if (this.cell.iconPosition) {
      $("div[icon-id=" + this.cell.id + "]").css({top: this.cell.iconPosition.top, left: this.cell.iconPosition.left});
    }

    $("div[icon-id=" + _this.cell.id + "]").draggable({
      drag: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("#infoBox").text(myLeft + ' , ' + myTop);
      },
      stop: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("#infoBox").text("");
        _this.cell.iconPosition = $(this).position();
        sendCellToServer(_this.cell);
      }
    });

    this.myDraggable = $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: false,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".reading-wrapper",
      create: function( event, ui ) {
        if (sendToServer) {
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          sendCellToServer(_this.cell);
        }
      },
      start: function( event, ui ) {
        $("div[ui-uuid=" + _this.cell.id + "]").tooltip('destroy');
      },
      drag: function( event, ui ) {
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("#infoBox").text(myLeft + ' , ' + myTop);
      },
      stop: function( event, ui ) {
        $("div[ui-uuid=" + _this.cell.id + "]").tooltip();
        var myTop  = Math.round(parseFloat($(this).position().top)  / gridSize) * gridSize;
        var myLeft = Math.round(parseFloat($(this).position().left) / gridSize) * gridSize;
        $(this).css({top: myTop, left: myLeft});

        $("div[ui-uuid=" + _this.cell.id + "]").text(_this.lastReading);
        $("#infoBox").text("");
        _this.cell.position = $(this).position();
        _this.cell.size = { width: $(this).width(), height: $(this).height() };
        sendCellToServer(_this.cell);
      }
    });

    getDeviceReading(this.cell.device, this.cell.reading, function(response, yafuReading) {
      var value = response.Results[0].Readings[yafuReading.cell.reading].Value;
      yafuReading.lastReading = toPossibleInteger(value);
      $("div[ui-uuid=" + yafuReading.cell.id + "]").text(yafuReading.lastReading);
    }, this);

  }

  openSettings() {

  }

  setEnabled(enabled) {
      var cursor = enabled ? 'default' : 'move';
      this.myDraggable.on("mouseover", function() {
        $(this).css('cursor', cursor);
      });
  }

  inform(deviceReading, value) {
    var myReading = this.cell.device + '-' + this.cell.reading;

    if (myReading == deviceReading) {
      this.lastReading = toPossibleInteger(value);
      $("div[ui-uuid=" + this.cell.id + "]").text(this.lastReading);
    }

  }

}

class AddNewReadingDialog {
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
            <tr>\
                <td><label for="readingDialogSelectIcon">Icon</label></td>\
                <td>\
                    <input id="readingDialogSelectIcon" class="form-control icp icp-auto" value="" type="text"/>\
                </td>\
            </tr>\
        </table>\
        ';

      var divElement = document.createElement("div");
      divElement.id="addNewReadingDialog";
      divElement.title="New Reading";
      divElement.innerHTML = dialogContent;
      document.body.appendChild(divElement);

      var _this = this;

      $('#readingDialogSelectIcon').iconpicker();
      $('#readingDialogSelectIcon').on('iconpickerSelected', function(event){
        _this.selectedIcon = event.iconpickerValue;
      });

      this.dialog = $( "#addNewReadingDialog" ).dialog({
        width: 650,
        height: 450,
        modal: true,
        autoOpen: false,
        buttons: [
            {
              text: "Ok",
              icon: "ui-icon-check",
              click: function() {
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
         ]
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
        reading: this.selectedReading,
        icon: this.selectedIcon,
        position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y }
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
