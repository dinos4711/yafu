//
// Yet Another FHEM UI - TimerButton
//

class YafuTimerButton {
    constructor(cell, sendToServer = false) {
        var thisYafuTimerButton = this;

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
                    sendRemoveCellToServer(thisYafuTimerButton.cell.id);
                    $("div[draggable-id=" + thisYafuTimerButton.cell.id + "]").remove();
                });
                timerButtonContextMenuDialog.dialog( "open");
            }
        });

        $("div[draggable-id=" + this.cell.id + "]").draggable({
          containment: "document",
          snap: false,
          snapTolerance: 5,
          grid: [ gridSize, gridSize ],
          stack: ".timer-button-wrapper",
          create: function( event, ui ) {
            if (sendToServer) {
              thisYafuTimerButton.cell.position = ui.position;
              thisYafuTimerButton.cell.size = ui.size;
              sendCellToServer(thisYafuTimerButton.cell);
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

            if (thisYafuTimerButton.cell.withLabel) {
                $("div[label-id=" + thisYafuTimerButton.cell.id + "]").text(thisYafuTimerButton.cell.name);
            }
            $("#infoBox").text("");
            thisYafuTimerButton.cell.position = $(this).position();
            thisYafuTimerButton.cell.size = { width: $(this).width(), height: $(this).height() };
            sendCellToServer(thisYafuTimerButton.cell);
          }
        });

        if (cell.withLabel) {
            $("div[label-id=" + this.cell.id + "]").draggable({
                stop: function( event, ui ) {
                    thisYafuTimerButton.cell.labelPosition = $(this).position();
                    sendCellToServer(thisYafuTimerButton.cell);
                }
            });
        }

        this.myButton = $("div[ui-uuid=" + this.cell.id + "]");
        this.myButton.on("click", function() {
            if (config.mode != 'edit') {
                new TimersDialog(thisYafuTimerButton.cell);
            }
        });
    }

    inform(deviceSetter, value) {

    }
}

class TimersDialog {
    constructor(cell) {
        var thisTimersDialog = this;
        this.cell = cell;

        var myContent = '\
          <table id="timers" class="ui-widget ui-widget-content">\
            <thead>\
              <tr class="ui-widget-header ">\
                <th>Date/Time</th>\
                <th>Command</th>\
                <th>Actions</th>\
              </tr>\
            </thead>\
            <tbody id="timers-tbody">\
              <tr>\
                <td>Please wait ...</td>\
                <td>Please wait ...</td>\
                <td>Please wait ...</td>\
              </tr>\
            </tbody>\
          </table>\
        ';

        var cellElement = document.createElement("div");
        cellElement.setAttribute("id", "timers-container");
        cellElement.setAttribute("class", "ui-widget");
        cellElement.setAttribute("title", "Timers for " + this.cell.name);

        cellElement.innerHTML = myContent;
        document.getElementById("uicontainer").appendChild(cellElement);

        var dialog = $( "#timers-container" ).dialog({
            modal: true,
            width: 650,
            height: 350,
            create: function() {
                thisTimersDialog.getTimerData();
            },
            buttons: [
                {
                    id: "timersDialogButtonAdd",
                    text: "Add",
                    click: function() {
                        dialog.dialog( "close" );
                        new AddNewTimerDialog(thisTimersDialog.cell);
                    }
                },
                {
                    id: "timersDialogButtonOk",
                    text: "Ok",
                    click: function() {
                        dialog.dialog( "close" );
                    }
                }
              ],

            close: function() {
                dialog.dialog( "destroy" );
                var nodeToDelete = document.getElementById("timers-container")
                nodeToDelete.parentNode.removeChild(nodeToDelete);
            }
        });

        $("#timersDialogButtonAdd").button("option", "disabled", true);
        $("#timersDialogButtonOk").button("option", "disabled", true);
    }

    getTimerData() {
        var thisTimersDialog = this;

        $.ajax({
            type: "GET",
            url: "getTimers",
            data: {
                deviceName: thisTimersDialog.cell.device,
                XHR: "1"
            },
            success: function(data) {
                thisTimersDialog.updateTimersTable(data);
            }

        });
    }

    updateTimersTable(data) {
        var thisTimersDialog = this;

        this.timers = JSON.parse(data);

        var myContent = '';
        for (var i in this.timers) {
            var m = moment(this.timers[i].Internals.TRIGGERTIME_FMT, "YYYY-MM-DD HH:mm:ss"); // 2018-12-10 23:20:35
            myContent += '\
                  <tr>\
                    <td>' + m.format('DD.MM.YYYY HH:mm:ss') + '</td>\
                    <td>' + this.timers[i].Internals.COMMAND + '</td>\
                    <td><button id="' + this.timers[i].Name + '">Delete</button></td>\
                  </tr>\
            ';

        }
        document.getElementById("timers-tbody").innerHTML = myContent;

        for (var i in this.timers) {
            var timerName = this.timers[i].Name;
            $("#" + timerName).on("click", function() {
                var fhemCommand = "delete " + timerName;
                sendCommandToFhem(fhemCommand);
                thisTimersDialog.getTimerData();
            });
        }

        $("#timersDialogButtonAdd").button("option", "disabled", false);
        $("#timersDialogButtonOk").button("option", "disabled", false);
    }

}

const MODE_NO_VALUE     = 0;
const MODE_SELECT_VALUE = 1;
const MODE_ENTER_VALUE  = 2;
const MODE_RGB_VALUE    = 3;
const MODE_HUE_VALUE    = 4;

class AddNewTimerDialog {
    constructor(cell) {
        this.cell = cell;
        var thisAddNewTimerDialog = this;

      var myContent = '\
        <p>Select a setter, a value and enter a relative time</p>\
        <table>\
            <tr>\
                <td><label for="addNewTimerDialogSelectSetter">Setter</label></td>\
                <td>\
                    <select id="addNewTimerDialogSelectSetter">\
                        <option>Please wait ...</option>\
                    </select>\
                </td>\
            </tr>\
            <tr>\
                <td><label for="addNewTimerDialogSelectSetterValue">Value</label></td>\
                <td>\
                    <select id="addNewTimerDialogSelectSetterValue">\
                        <option>Please wait ...</option>\
                    </select>\
                </td>\
            </tr>\
            <tr>\
                <td><label for="addNewTimerDialogSelectSetterValue">Time</label></td>\
                <td><input type="text" name="time" id="addNewTimerDialogTime" class="text ui-widget-content ui-corner-all"></td>\
            </tr>\
        </table>';

        var cellElement = document.createElement("div");
        cellElement.id="newTimerDialog";
        cellElement.title="New Timer for " + cell.name;
        cellElement.innerHTML = myContent;
        document.getElementById("uicontainer").appendChild(cellElement);

        var dialog = $( "#newTimerDialog" ).dialog({
            modal: true,
            width: 650,
            height: 350,
            buttons: {
                Cancel: function() {
                    dialog.dialog( "close" );

                },
                Ok: function() {
                    var time = $( "#addNewTimerDialogTime" ).val().replace(/\+/g, "%2B");
                    var value;
                    switch (thisAddNewTimerDialog.valueMode) {
                        case MODE_NO_VALUE:
                            value = '';
                            break;
                        case MODE_SELECT_VALUE:
                            value = thisAddNewTimerDialog.selectedValue;
                            break;
                        case MODE_ENTER_VALUE:
                            value = $( "#addNewTimerDialogSelectSetterValue" ).val();
                            break;
                        case MODE_RGB_VALUE:
                            value = $( "#addNewTimerDialogSelectSetterValue" ).val();
                            value = value.replace("#", "");
                            break;
                        case MODE_HUE_VALUE:
                            value = $( "#addNewTimerDialogSelectSetterValue" ).val();
                            break;
                    }
                    var somethingUnique = uuidv4().replace(/-/g, "_");
                    var fhemCommand = 'define yafu_' + thisAddNewTimerDialog.cell.device + '_' + somethingUnique + ' at ' + time +
                        ' set ' + thisAddNewTimerDialog.cell.device + ' ' + thisAddNewTimerDialog.selectedSetter + ' ' + value;

                    sendCommandToFhem(fhemCommand);

                    dialog.dialog( "close" );
                }
            },
            close: function() {
                dialog.dialog( "destroy" );
                var nodeToDelete = document.getElementById("newTimerDialog")
                nodeToDelete.parentNode.removeChild(nodeToDelete);
            }
        });

        $( "#addNewTimerDialogSelectSetter" ).selectmenu({
            width: 450,
            create: function() {
                thisAddNewTimerDialog.getSetters();
            },
            change: function( event, data ) {
                thisAddNewTimerDialog.selectedSetter = data.item.element.attr("setter");
                thisAddNewTimerDialog.updateValues();

            }
        });

        $( "#addNewTimerDialogSelectSetterValue" ).selectmenu({
            width: 450,
            change: function( event, data ) {
                thisAddNewTimerDialog.selectedValue = data.item.element.attr("value");
            }
        });


    }

    getSetters() {

        var thisAddNewTimerDialog = this;

        $.ajax({
            type: "GET",
            url: "getDeviceSetters",
            data: {
                device: this.cell.device,
                XHR: "1"
            },
            success: function(data) {
                thisAddNewTimerDialog.updateSetters(data);
            }

        });
    }

    updateSetters(data) {
        var thisAddNewTimerDialog = this;

        this.setters = JSON.parse(data);

        var setters = this.setters;

        var selectSetterDOM = document.getElementById("addNewTimerDialogSelectSetter");
        selectSetterDOM.innerHTML = "";

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

        $( "#addNewTimerDialogSelectSetter" ).selectmenu( "refresh" );

        this.updateValues();
    }

    updateValues() {
        var thisAddNewTimerDialog = this;

        var setterName = this.selectedSetter;

        var foundSetter = this.setters.find(function(element) {
            return typeof element[setterName] != 'undefined';
        });
        var valuesString = foundSetter[setterName];

        var values = valuesString.split(',');
        if (values[0] == 'slider') {
          var vMin  = parseFloat(values[1]);
          var vStep = parseFloat(values[2]);
          var vMax  = parseFloat(values[3]);

          values = new Array();
          for (var i = vMin ; i <= vMax; i += vStep) {
            values.push(i);
          }
        }

        this.valueMode = MODE_SELECT_VALUE;

        if (values.length == 0) {
            this.valueMode = MODE_NO_VALUE;
        }
        if (values.length == 1) {
            if (values[0] == 'noArg') {
                this.valueMode = MODE_NO_VALUE;
                this.selectedValue = '';
            }
            if (values[0] == '') {
                this.valueMode = MODE_ENTER_VALUE;
            }
        }

        if (values[0] == 'colorpicker') {
            if (values[1] == 'RGB') {
                this.valueMode = MODE_RGB_VALUE;
            }
            if (values[1] == 'HUE') {
                this.valueMode = MODE_HUE_VALUE;
            }
        }

        console.log(this.valueMode);

//            <tr>\
//                <td><label for="addNewTimerDialogSelectSetterValue">Value</label></td>\
//                <td>\
//                    <select id="addNewTimerDialogSelectSetterValue">\
//                        <option>Please wait ...</option>\
//                    </select>\
//                </td>\
//            </tr>\

        var addNewTimerDialogSelectSetterValue = document.getElementById("addNewTimerDialogSelectSetterValue")
        var tdNode = addNewTimerDialogSelectSetterValue.parentNode;
        var trNode = tdNode.parentNode;
        trNode.removeChild(tdNode);

        var valueNodeContent;
        switch (this.valueMode) {
            case MODE_NO_VALUE:
                valueNodeContent = '<div id="addNewTimerDialogSelectSetterValue"></div>'; // place holder
                this.selectedValue = '';
                break;
            case MODE_SELECT_VALUE:
                valueNodeContent = '\
                    <select id="addNewTimerDialogSelectSetterValue">\
                        <option>Please wait ...</option>\
                    </select>\
                ';
                break;
            case MODE_ENTER_VALUE:
                valueNodeContent = '<input type="text" name="time" id="addNewTimerDialogSelectSetterValue" class="text ui-widget-content ui-corner-all">';
                break;
            case MODE_RGB_VALUE:
                valueNodeContent = '<input type="color" name="color" id="addNewTimerDialogSelectSetterValue" />';
                break;
            case MODE_HUE_VALUE:
                valueNodeContent = '<input id="addNewTimerDialogSelectSetterValue" type="range" min="0" max="360" step="1" class="hue-range"/>';
                break;
        }

        tdNode = document.createElement("td");
        tdNode.innerHTML = valueNodeContent;
        trNode.appendChild(tdNode);

        if (this.valueMode == MODE_SELECT_VALUE) {
            var selectValuesDOM = document.getElementById("addNewTimerDialogSelectSetterValue");
            selectValuesDOM.innerHTML = "";
            var isFirst = 1;
            for (var i in values) {
                var optionDiv = document.createElement("option");
                optionDiv.innerHTML = values[i];
                optionDiv.setAttribute("value", values[i]);
                selectValuesDOM.appendChild(optionDiv);
                if (isFirst == 1) {
                    isFirst = 0;
                    this.selectedValue = values[i];
                }
            }
            $( "#addNewTimerDialogSelectSetterValue" ).selectmenu({
                width: 450,
                change: function( event, data ) {
                    thisAddNewTimerDialog.selectedValue = data.item.element.attr("value");
                }
            });
        }

    }
}

class AddNewTimerButtonDialog {

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
    divElement.id="addNewTimerButtonDialog";
    divElement.title="New TimerButton";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var thisTimerButtonDialog = this;

    this.dialog = $( "#addNewTimerButtonDialog" ).dialog({
      width: 650,
      height: 350,
      modal: true,
      autoOpen: false,
      buttons: {
        Ok: function() {
          var withLabel = document.getElementById("timerButtonDialogWithLabel").checked;
          $( this ).dialog( "close" );
          thisTimerButtonDialog.addNewTimerButton(withLabel);
        }
      }
    });

    $( "#timerButtonDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        thisTimerButtonDialog.selectedDevice = data.item.element.attr("fhem-device");
        thisTimerButtonDialog.selectedDeviceName = data.item.element.attr("fhem-deviceName");
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
    var thisTimerButtonDialog = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithTimerButtons",
    			XHR: "1"
    		},
    		success: function(data) {
    		    thisTimerButtonDialog.updateNewTimerButtonDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }

}