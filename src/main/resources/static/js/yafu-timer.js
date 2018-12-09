//
// Yet Another FHEM UI - TimerButton
//

class YafuTimerButton {
    constructor(cell, sendToServer = false) {
        var _this = this;

        this.cell = cell;

        var myContent = '\
            <div ui-uuid="' + this.cell.id + '" class="ui-button ui-widget ui-corner-all ui-button-icon-only" >\
                <span class="ui-icon ui-icon-gear"></span>Button\
            </div>\
        ';
        if (cell.withLabel) {
            myContent += '<div label-id="' + this.cell.id + '" class="editable" style="position: absolute; top: 0px; left: 100px">' + this.cell.name + '</div>';
        }

        var cellElement = document.createElement("div");
        cellElement.setAttribute("class", "editable timer-button-wrapper");
        cellElement.setAttribute("draggable-id", this.cell.id);
        cellElement.innerHTML = myContent;

        document.getElementById("uicontainer").appendChild(cellElement);

        if (typeof this.cell.labelPosition == 'undefined') {
          this.cell.labelPosition = {top: 0, left: 100};
        }
        if (cell.withLabel) {
            $("div[label-id=" + this.cell.id + "]").css({top: this.cell.labelPosition.top, left: this.cell.labelPosition.left});
        }
        if (typeof this.cell.position == 'undefined') {
          this.cell.position = {top: 50, left: 10};
        }
        if (typeof this.cell.size == 'undefined') {
          this.cell.size = {width: 50, height: 20};
        }
        $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});

        $("div[draggable-id=" + this.cell.id + "]").contextmenu(function() {
            if (config.mode == 'edit') {
                $('#menu_timerButtonDelete').click(function() {
                    timerButtonContextMenuDialog.dialog( "close");
                    sendRemoveCellToServer(_this.cell.id);
                    $("div[draggable-id=" + _this.cell.id + "]").remove();
                });
                timerButtonContextMenuDialog.dialog( "open");
            }
        });

        $("div[draggable-id=" + this.cell.id + "]").draggable({
          containment: "document",
          snap: false,
          snapTolerance: 5,
          grid: [ gridSize, gridSize ],
          stack: ".slider-wrapper",
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

            if (_this.cell.withLabel) {
                $("div[label-id=" + _this.cell.id + "]").text(_this.cell.name);
            }
            $("#infoBox").text("");
            _this.cell.position = $(this).position();
            _this.cell.size = { width: $(this).width(), height: $(this).height() };
            sendCellToServer(_this.cell);
          }
        });

        if (cell.withLabel) {
            $("div[label-id=" + this.cell.id + "]").draggable({
                stop: function( event, ui ) {
                    _this.cell.labelPosition = $(this).position();
                    sendCellToServer(_this.cell);
                }
            });
        }

        this.myButton = $("div[ui-uuid=" + this.cell.id + "]");
        this.myButton.on("click", function() {
            if (config.mode != 'edit') {
                console.log("Here we are");
            }
        });
    }

    inform(deviceSetter, value) {

    }
}

class TimerButtonDialog {

  constructor() {
    var dialogContent = '\
      <p>Select a device</p>\
      <table>\
          <tr>\
              <td><label for="timerButtonDialogSelectDevice">Device</label></td>\
              <td>\
                  <select id="timerButtonDialogSelectDevice">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
          <tr>\
              <td><label for="timerButtonDialogOnlyIntegers">With label</label></td>\
              <td>\
                  <input type="checkbox" name="checkbox-with-label" id="timerButtonDialogWithLabel">\
              </td>\
          </tr>\
      </table>';

    var divElement = document.createElement("div");
    divElement.id="timerButtonDialog";
    divElement.title="New TimerButton";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var _this = this;

    this.dialog = $( "#timerButtonDialog" ).dialog({
      width: 650,
      height: 350,
      modal: true,
      autoOpen: false,
      buttons: {
        Ok: function() {
          var withLabel = document.getElementById("timerButtonDialogWithLabel").checked;
          $( this ).dialog( "close" );
          _this.addNewTimerButton(withLabel);
        }
      }
    });

    $( "#timerButtonDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedDevice = data.item.element.attr("fhem-device");
        _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");
      }
    });

  }

  addNewTimerButton(withLabel) {
    var cell = {
        type: "TimerButton",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y },
        withLabel: withLabel
    };
    var timerButton = new YafuTimerButton(cell, true);
    allCells.push(timerButton);

  }

  updateNewTimerButtonDialog(devicesString) {
    this.jsonDevices = JSON.parse(devicesString);

    var selectDeviceDOM = document.getElementById("timerButtonDialogSelectDevice");
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
    $( "#timerButtonDialogSelectDevice" ).selectmenu( "refresh" );

  }

  open() {
    this.dialog.dialog( "open" );
    var _this = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithTimerButtons",
    			XHR: "1"
    		},
    		success: function(data) {
    		    _this.updateNewTimerButtonDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }

}