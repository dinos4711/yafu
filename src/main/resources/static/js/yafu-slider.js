//
// Yet Another FHEM UI - Slider
//

class YafuSlider {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    this.customHandleId = 'custom-handle-' + this.cell.id;

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

    for (var i = 0; i < this.values.length; i++) {
      this.values[i] = toPossibleInteger(this.values[i]);
    }

    var myContent = '\
        <div id="' + this.cell.id + 'xxx" ui-uuid="' + this.cell.id + '" yafu-inform="' + this.cell.device + '-' + this.cell.setter + '">\
          <div id="' + this.customHandleId + '" class="ui-slider-handle yafu-slider-handle"></div>\
        </div>\
        <div label-id="' + this.cell.id + '" class="editable" style="position: absolute; top: 0px; left: 100px">' + this.cell.name + '</div>\
        <button id="button-close-' + this.cell.id + '" class="hideable" style="position: absolute; top: 0px; right: 0px; width: 18px; height: 18px;">x</button>\
    ';

    var cellElement = document.createElement("div");
    cellElement.setAttribute("class", "editable slider-wrapper");
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

    this.myDraggable = $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: false,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".slider-wrapper",
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
        _this.cell.values = _this.values.join();
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
          _this.cell.values = _this.values.join();
          sendCellToServer(_this.cell);
        }
    });

    this.myLabel = $("div[label-id=" + this.cell.id + "]").draggable({
      stop: function( event, ui ) {
        _this.cell.labelPosition = $(this).position();
        sendCellToServer(_this.cell);
      }
    });

    this.handle = $( "#" + this.customHandleId );

    this.mySlider = $("div[ui-uuid=" + this.cell.id + "]");

//    this.mySlider = this.mySlider.setterWidget({
//        values: _this.cell.values
//    });
//
    this.mySlider = this.mySlider.slider({
      min : 0,
      max : _this.values.length - 1,
      create: function() {
                _this.handle.text( _this.values[$( this ).slider( "value" )] );
              },
      slide: function( event, ui ) {
                _this.handle.text( _this.values[ui.value] );
              },
      change: function( event, ui ) {
                _this.handle.text( _this.values[ui.value] );
              },
      stop: function( event, ui ) {
        var element = $("div[ui-uuid=" + _this.cell.id + "]")[0];

        var inform = element.getAttribute('yafu-inform').split('-');

        var device = inform[0];
        var setter = inform[1];

        var value = _this.values[ui.value];
        var cmd = 'set ' + device + ' ' + setter + ' ' + value;
        sendCommandToFhem(cmd);
      }
    });

    getDeviceReading(this.cell.device, this.cell.setter, function(response, yafuSlider) {
      var value = response.Results[0].Readings[yafuSlider.cell.setter].Value;
      var index = -1;
      for (var i in yafuSlider.values) {
        if (yafuSlider.values[i] == value) {
          index = i;
        }
      }
      if (index != -1) {
        yafuSlider.mySlider.slider("value", index);
      }
    }, this);

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
    });

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
  }

  setEnabled(enabled) {
      this.myDraggable.on("mouseover", function() {
        $(this).css('cursor', enabled ? 'default' : 'move');
      });
      this.myLabel.on("mouseover", function() {
        $(this).css('cursor', enabled ? 'default' : 'move');
      });
  }

  inform(deviceSetter, value) {
    var mySetter = this.cell.device + '-' + this.cell.setter;

    if (mySetter == deviceSetter) {
      var found = 0;
      for (var v in this.values) {
        if (this.values[v] == value) {
          this.mySlider.slider("value", v);
          this.handle.text( this.values[v] );
          found = 1;
        }
      }
      if (!found) {
        for (var v in this.values) {
          if (parseInt(this.values[v]) == parseInt(value)) {
            this.mySlider.slider("value", v);
            this.handle.text( this.values[v] );
            found = 1;
          }
        }
      }
      if (!found) {
        console.log("Could not map " + value + " to a value from the slider.");
      }
    }

  }

}

class AddNewSliderDialog {

  constructor() {
    var dialogContent = '\
      <p>Select a device and a device setter</p>\
      <table>\
          <tr>\
              <td><label for="sliderDialogSelectDevice">Device</label></td>\
              <td>\
                  <select id="sliderDialogSelectDevice">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
          <tr>\
              <td><label for="sliderDialogSelectSetter">Setter</label></td>\
              <td>\
                  <select id="sliderDialogSelectSetter">\
                      <option>Please wait ...</option>\
                  </select>\
              </td>\
          </tr>\
      </table>';

    var divElement = document.createElement("div");
    divElement.id="addNewSliderDialog";
    divElement.title="New Slider";
    divElement.innerHTML = dialogContent;
    document.body.appendChild(divElement);

    var _this = this;

    this.dialog = $( "#addNewSliderDialog" ).dialog({
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
              var foundSetter = foundDevice.setters.find(function(element) {
                return typeof element[_this.selectedSetter] != 'undefined';
              });
              var values = foundSetter[_this.selectedSetter];

              $( this ).dialog( "close" );

              _this.addNewSlider(values);
            }
          }
      ]
    });

    $( "#sliderDialogSelectDevice" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedDevice = data.item.element.attr("fhem-device");
        _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");

        var selectSetterDOM = document.getElementById("sliderDialogSelectSetter");
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
        $( "#sliderDialogSelectSetter" ).selectmenu( "refresh" );

      }
    });

    $( "#sliderDialogSelectSetter" ).selectmenu({
      width: 450,
      change: function( event, data ) {
        _this.selectedSetter = data.item.element.attr("setter");
      }
    });
  }

  addNewSlider(valuesString) {
    var cell = {
        type: "Slider",
        id: uuidv4(),
        name: this.selectedDeviceName,
        device: this.selectedDevice,
        setter: this.selectedSetter,
        values: valuesString,
        position: { left: mainDialog.mouse.x, top: mainDialog.mouse.y }
    };
    var slider = new YafuSlider(cell, true);
    allCells.push(slider);

  }

  updateNewSliderDialog(devicesString) {
    this.jsonDevices = JSON.parse(devicesString);

    var selectDeviceDOM = document.getElementById("sliderDialogSelectDevice");
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
    $( "#sliderDialogSelectDevice" ).selectmenu( "refresh" );

    var selectSetterDOM = document.getElementById("sliderDialogSelectSetter");
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
    $( "#sliderDialogSelectSetter" ).selectmenu( "refresh" );
  }

  open() {
    this.dialog.dialog( "open" );
    var _this = this;

    return $.ajax({
            type: "GET",
            url: "getContentFromServer",
            data: {
    			cmd: "getDevicesWithSliders",
    			XHR: "1"
    		},
    		success: function(data) {
    		    _this.updateNewSliderDialog(data);
    		}

        });
  }

  close() {
    this.dialog.dialog( "close" );
  }

}