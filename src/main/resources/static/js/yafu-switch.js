//
// Yet Another FHEM UI - Switch
//

class YafuSwitch {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    var myContent = '\
        <div class="icon" id="' + this.cell.id + '"></div>\
       	<div label-id="' + this.cell.id + '" class="editable" style="position: absolute; top: 0px; left: 100px">' + this.cell.name + '</div>\
    ';

    var cellElement = document.createElement("div");
    cellElement.setAttribute("class", "editable toggle switch-wrapper");
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
      this.cell.size = {width: 400, height: 20};
    }
    $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});

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

    $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: false,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".switch-wrapper",
      create: function( event, ui ) {
        if (sendToServer) {
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          sendCellToServer(_this.cell);
        }
      },
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

        $("div[label-id=" + _this.cell.id + "]").text(_this.cell.name);
        $("#infoBox").text("");
        _this.cell.position = $(this).position();
        _this.cell.size = { width: $(this).width(), height: $(this).height() };
        sendCellToServer(_this.cell);
      }
    });

    this.myLabel = $("div[label-id=" + this.cell.id + "]").draggable({
      stop: function( event, ui ) {
        _this.cell.labelPosition = $(this).position();
        sendCellToServer(_this.cell);
      }
    });

    this.mySwitch = $("#" + this.cell.id).famultibutton({
		offColor: '#2A2A2A',
		offBackgroundColor: '#808080',
		onColor: '#2A2A2A',
		onBackgroundColor: '#aa6900',

        mode: 'toggle',
        toggleOn: function() {
            if (config.mode == 'edit') {
                _this.mySwitch.setOff();
                return;
            }
            var cmd = 'set ' + _this.cell.device + ' on';
            sendCommandToFhem(cmd);
        },
        toggleOff: function() {
            if (config.mode == 'edit') {
                _this.mySwitch.setOn();
                return;
            }
            var cmd = 'set ' + _this.cell.device + ' off';
            sendCommandToFhem(cmd);
        },
    });

    getDeviceReading(this.cell.device, 'state', function(response, yafuSwitch) {
        var value = response.Results[0].Readings['state'].Value;
        if (value == 'on') {
          _this.mySwitch.setOn();
        }
        if (value == 'off') {
          _this.mySwitch.setOff();
        }
    }, this);

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
    });
  }

  setEnabled(enabled) {
      var cursor = enabled ? 'pointer' : 'move';
      this.mySwitch.on("mouseover", function() {
        $(this).css('cursor', cursor);
      });
      this.myLabel.on("mouseover", function() {
        $(this).css('cursor', cursor);
      });
  }

  inform(deviceReading, value) {
    var myReading = this.cell.device + '-state';

    if (myReading == deviceReading) {
        if (value == 'on') {
          this.mySwitch.setOn();
        }
        if (value == 'off') {
          this.mySwitch.setOff();
        }

    }

    this.myReading = value;

  }

}

class AddNewSwitchDialog {

  constructor() {
    var dialogContent = '\
      <p>Select a device</p>\
      <table>\
          <tr>\
              <td><label for="switchDialogSelectDevice">Device</label></td>\
              <td>\
                  <select id="switchDialogSelectDevice">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
      </table>';

    var divElement = document.createElement("div");
    divElement.id="switchDialog";
    divElement.title="New Switch";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var _this = this;

    this.dialog = $( "#switchDialog" ).dialog({
      width: 650,
      height: 350,
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

              $( this ).dialog( "close" );

              _this.addNewSwitch();
            }
          }
      ]
    });

    $( "#switchDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedDevice = data.item.element.attr("fhem-device");
        _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");
      }
    });

  }

  addNewSwitch() {
    var cell = {
        type: "Switch",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y }
    };
    var yafuSwitch = new YafuSwitch(cell, true);
    allCells.push(yafuSwitch);

  }

  updateNewSwitchDialog(devicesString) {
    this.jsonDevices = JSON.parse(devicesString);

    var selectDeviceDOM = document.getElementById("switchDialogSelectDevice");
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
    $( "#switchDialogSelectDevice" ).selectmenu( "refresh" );

  }

  open() {
    this.dialog.dialog( "open" );
    var _this = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithSwitches",
    			XHR: "1"
    		},
    		success: function(data) {
    		    _this.updateNewSwitchDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }

}
