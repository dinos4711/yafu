//
// Yet Another FHEM UI - Switch
//

class YafuSwitch {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    var myContent = '\
        <input type="checkbox" id="' + this.cell.id + '" >\
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
    }).resizable({
        grid: [ gridSize, gridSize ],
        resize: function( event, ui ) {
          $("#infoBox").text(ui.size.width + ' x ' + ui.size.height);
        },
        stop: function( event, ui ) {
          $("div[label-id=" + _this.cell.id + "]").text(_this.cell.name);
          $("#infoBox").text("");
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          sendCellToServer(_this.cell);
        }
    });

    $("div[label-id=" + this.cell.id + "]").draggable({
      stop: function( event, ui ) {
        _this.cell.labelPosition = $(this).position();
        sendCellToServer(_this.cell);
      }
    });

    this.mySwitch = $("div[ui-uuid=" + this.cell.id + "]");

    this.mySwitch = new DG.OnOffSwitch({
        el: '#' + _this.cell.id,
        textOn:'AN',
        textOff:'AUS',
        listener:function(name, checked){
            if (config.mode == 'edit') {
                return;
            }
            var state = checked ? 'on' : 'off';

            console.log("Listener " + _this.cell.device + " -> " + state + " (" + _this.myReading + ")");

            if (state != _this.myReading) {
                console.log("User switched " + state);
                var cmd = 'set ' + _this.cell.device + ' ' + state;
                sendCommandToFhem(cmd);
            }
        }
    });

    this.myReading = this.mySwitch.getValue() ? "on" : "off";
    console.log("Initially " + this.cell.device + " -> " + this.myReading);

    getDeviceReading(this.cell.device, 'state', function(response, yafuSwitch) {
        var value = response.Results[0].Readings['state'].Value;
        console.log("First update " + _this.cell.device + " -> " + value);

        if (value != _this.myReading) {
            _this.myReading = value;
            if (value == 'on') {
                if (!_this.mySwitch.getValue()) {
                    _this.mySwitch.check();
                }

            } else {
                if (_this.mySwitch.getValue()) {
                    _this.mySwitch.uncheck();
                }
            }
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

  inform(deviceReading, value) {
    var myReading = this.cell.device + '-state';

    if (myReading == deviceReading) {
      // TODO: change the button state
      console.log("Update " + this.cell.device + " -> " + value);
//      $('#' + this.cell.id).prop("checked", value == 'on');
      if (value == 'on') {
            if (!this.mySwitch.getValue()) {
                this.mySwitch.check();
            }

        } else {
            if (this.mySwitch.getValue()) {
                this.mySwitch.uncheck();
            }
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
      buttons: {
        Ok: function() {
          var foundDevice = _this.jsonDevices.find(function(element) {
            return element.deviceName == _this.selectedDevice;
          });

          $( this ).dialog( "close" );

          _this.addNewSwitch();
        }
      }
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