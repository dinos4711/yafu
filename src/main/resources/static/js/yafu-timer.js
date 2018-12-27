//
// Yet Another FHEM UI - TimerButton
//

class YafuTimerButton {
    constructor(cell, sendToServer = false) {
        var thisYafuTimerButton = this;

        this.cell = cell;

        var myContent = '\
            <div ui-uuid="' + this.cell.id + '" >\
                <i class="far fa-clock fa-2x"></i>\
            </div>\
        ';
        if (cell.withLabel) {
            myContent += '<div label-id="' + this.cell.id + '" class="editable" style="position: absolute; top: 0px; left: 100px">' + this.cell.name + ':' + this.cell.setter + '</div>';
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

        $("div[draggable-id=" + this.cell.id + "]").contextMenu({
            selector: 'div',
            events: {
               show : function(options){
                    return config.mode == 'edit';
               },
            },
            callback: function(key, options) {
                if (key == 'delete') {
                    sendRemoveCellToServer(thisYafuTimerButton.cell.id);
                    $("div[draggable-id=" + thisYafuTimerButton.cell.id + "]").remove();
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
                $("div[label-id=" + thisYafuTimerButton.cell.id + "]").text(thisYafuTimerButton.cell.name + ':' + thisYafuTimerButton.cell.setter);
            }
            $("#infoBox").text("");
            thisYafuTimerButton.cell.position = $(this).position();
            thisYafuTimerButton.cell.size = { width: $(this).width(), height: $(this).height() };
            sendCellToServer(thisYafuTimerButton.cell);
          }
        });

        if (cell.withLabel) {
            this.myLabel = $("div[label-id=" + this.cell.id + "]").draggable({
                stop: function( event, ui ) {
                    thisYafuTimerButton.cell.labelPosition = $(this).position();
                    sendCellToServer(thisYafuTimerButton.cell);
                }
            });
        }

        this.myButton = $("div[ui-uuid=" + this.cell.id + "]");
        this.myButton.on("click", function() {
            if (config.mode != 'edit') {
                new AddNewTimerDialog(thisYafuTimerButton.cell);
            }
        });
    }

    setEnabled(enabled) {
        var cursor = enabled ? 'pointer' : 'move';

        this.myButton.on("mouseover", function() {
          $(this).css('cursor', cursor);
        });

        if (this.cell.withLabel) {
            this.myLabel.on("mouseover", function() {
              $(this).css('cursor', cursor);
            });
        }
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
        cellElement.setAttribute("title", "Timers for " + this.cell.name + ':' + this.cell.setter);

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
                    text: "Add timer",
                    icon: "ui-icon-clock",
                    click: function() {
                        dialog.dialog( "close" );
                        new AddNewTimerDialog(thisTimersDialog.cell);
                    }
                },
                {
                    id: "timersDialogButtonOk",
                    text: "Ok",
                    icon: "ui-icon-check",
                    click: function() {
                        dialog.dialog( "close" );
                    }
                }
              ],
            open: function() {
                $("#timersDialogButtonOk").focus();
            },
            close: function() {
                dialog.dialog( "destroy" );
                var nodeToDelete = document.getElementById("timers-container")
                nodeToDelete.parentNode.removeChild(nodeToDelete);
            }
        });

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

    }

}

class AddNewTimerDialog {
    constructor(cell) {
        this.cell = cell;
        var thisAddNewTimerDialog = this;

      var myContent = '\
        <p>Select a value and enter a relative time</p>\
        <table>\
            <tr>\
                <td><label for="addNewTimerDialogSelectSetterValue">Value to set</label></td>\
                <td>\
                    <div id="addNewTimerDialogSelectSetterValue">\
                    Please wait ...\
                    </div>\
                </td>\
                <td>\
                    <label id="addNewTimerDialogSelectSetterValueLogger" style="width: 50px"></label>\
                </td>\
            </tr>\
            <tr>\
                <td><label for="addNewTimerDialogMinutesSelector">Time from now</label></td>\
                <td><div id="addNewTimerDialogHoursSelector"></div><div id="addNewTimerDialogMinutesSelector"></div></td>\
                <td></td>\
            </tr>\
        </table>';

        var cellElement = document.createElement("div");
        cellElement.id="newTimerDialog";
        cellElement.title="New Timer for " + cell.name + ":" + cell.setter;
        cellElement.innerHTML = myContent;
        document.getElementById("uicontainer").appendChild(cellElement);

        var hoursSelector = $( "#addNewTimerDialogHoursSelector" ).timeSelector({
            minValue: 0,
            maxValue: 23,
            width: 100,
            height: 100,
            text: "Hours"
        });
        var minutesSelector = $( "#addNewTimerDialogMinutesSelector" ).timeSelector({
            minValue: 0,
            maxValue: 59,
            width: 100,
            height: 100,
            text: "Minutes"
        });

        var dialog = $( "#newTimerDialog" ).dialog({
            modal: true,
            width: 650,
            height: 350,
            buttons: [
                {
                    text: "Timers",
                    icon: "ui-icon-clock",
                    click: function() {
                        dialog.dialog( "close" );
                        new TimersDialog(thisAddNewTimerDialog.cell);
                    }
                },
                {
                    text: "Cancel",
                    icon: "ui-icon-cancel",
                    click: function() {
                        dialog.dialog( "close" );
                    }
                },
                {
                    id: "newTimerDialogButtonOk",
                    text: "Ok",
                    icon: "ui-icon-check",
                    click: function() {
                        var hours = hoursSelector.timeSelector("getValue");
                        var minutes = minutesSelector.timeSelector("getValue");

                        var time = "%2B" + ("00" + hours).substr(-2, 2) + ":" + ("00" + minutes).substr(-2, 2) + ":00";
                        console.log(time);

                        var value = thisAddNewTimerDialog.setterElement.setterWidget("getValue");

                        var somethingUnique = uuidv4().replace(/-/g, "_");
                        var fhemCommand = 'define yafu_' + thisAddNewTimerDialog.cell.device + '_' + somethingUnique + ' at ' + time +
                            ' set ' + thisAddNewTimerDialog.cell.device + ' ' + thisAddNewTimerDialog.cell.setter + ' ' + value;

                        sendCommandToFhem(fhemCommand);

                        dialog.dialog( "close" );
                    }
                }
            ],
            open: function() {
                $("#newTimerDialogButtonOk").focus();
            },
            close: function() {
                dialog.dialog( "destroy" );
                var nodeToDelete = document.getElementById("newTimerDialog")
                nodeToDelete.parentNode.removeChild(nodeToDelete);
            }
        });

        this.updateValues();

    }

    updateValues() {
        var thisAddNewTimerDialog = this;

        var valuesString = this.cell.values;

        this.setterElement = $("#addNewTimerDialogSelectSetterValue").setterWidget({
            fillColorValue: "#00ff00",
            fillColorVirtualValue: "#00ff00",
            values: valuesString,
            valueChanged: function( event, data ) {
                console.log(data.value);
                $("#addNewTimerDialogSelectSetterValueLogger").text(data.value);
            }
        });

    }
}

class AddNewTimerButtonDialog {

  constructor() {
    var dialogContent = '\
      <p>Select a device and a device setter</p>\
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
              <td><label for="timerButtonDialogSelectSetter">Setter</label></td>\
              <td>\
                  <select id="timerButtonDialogSelectSetter">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
          <tr>\
              <td><label for="timerButtonDialogWithLabel">With label</label></td>\
              <td>\
                  <input type="checkbox" name="checkbox-with-label" id="timerButtonDialogWithLabel">\
              </td>\
          </tr>\
      </table>';

    var divElement = document.createElement("div");
    divElement.id="addNewTimerButtonDialog";
    divElement.title="New Timer Button";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var thisTimerButtonDialog = this;

    this.dialog = $( "#addNewTimerButtonDialog" ).dialog({
      width: 650,
      height: 350,
      modal: true,
      autoOpen: false,
      buttons: [
          {
            text: "Ok",
            icon: "ui-icon-check",
            click: function() {
              var foundDevice = thisTimerButtonDialog.jsonDevices.find(function(element) {
                return element.deviceName == thisTimerButtonDialog.selectedDevice;
              });
              var foundSetter = foundDevice.setters.find(function(element) {
                return typeof element[thisTimerButtonDialog.selectedSetter] != 'undefined';
              });
              var values = foundSetter[thisTimerButtonDialog.selectedSetter];
              var withLabel = document.getElementById("timerButtonDialogWithLabel").checked;
              $( this ).dialog( "close" );
              thisTimerButtonDialog.addNewTimerButton(values, withLabel);
            }
          }
      ]
    });

    $( "#timerButtonDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        thisTimerButtonDialog.selectedDevice = data.item.element.attr("fhem-device");
        thisTimerButtonDialog.selectedDeviceName = data.item.element.attr("fhem-deviceName");

        var selectSetterDOM = document.getElementById("timerButtonDialogSelectSetter");
        selectSetterDOM.innerHTML = "";

        var foundDevice = thisTimerButtonDialog.jsonDevices.find(function(element) {
          return element.deviceName == thisTimerButtonDialog.selectedDevice;
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
              thisTimerButtonDialog.selectedSetter = setterName;
            }
          }
        }
        $( "#timerButtonDialogSelectSetter" ).selectmenu( "refresh" );

      }
    });

    $( "#timerButtonDialogSelectSetter" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        thisTimerButtonDialog.selectedSetter = data.item.element.attr("setter");
      }
    });
  }

  addNewTimerButton(valuesString, withLabel) {
    var cell = {
        type: "TimerButton",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        setter: this.selectedSetter,
        values: valuesString,
        withLabel: withLabel,
        position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y }
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

    var selectSetterDOM = document.getElementById("timerButtonDialogSelectSetter");
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
    $( "#timerButtonDialogSelectSetter" ).selectmenu( "refresh" );
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
