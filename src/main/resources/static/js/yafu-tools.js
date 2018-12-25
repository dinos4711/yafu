//
// Yet Another FHEM UI - Tools
//

// Converts from degrees to radians.
Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

const mapNumber = (number, in_min, in_max, out_min, out_max) => {
  return (number - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
};

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

function toPossibleInteger(value) {
  var result = parseFloat(value);
  if (!isNaN(result)) {
    if (Number.isInteger(result)) {
      result = Math.floor(result);
    }
  } else {
    result = value;
  }

  return result;
}

(function ( $ ) {

    $.widget( "yafu.deviceSelector", {

        // Default options.
        options: {
            value: 0,
            contentCommand: "getDevicesWithReadings"
        },

        _create: function() {
            var _this = this;

            var myContent = '\
                <select id="selectDevice">\
                    <option>Please wait ...</option>\
                </select>';
            this.element.replaceWith( myContent );

            $( "#selectDevice" ).selectmenu({
                change: function( event, data ) {
                  _this.selectedDevice = data.item.element.attr("fhem-device");
                  _this.selectedDeviceName = data.item.element.attr("fhem-deviceName");

                  _this._trigger( "selectionChanged", event, {
                      selectedDevice: _this.selectedDevice,
                      selectedDeviceName: _this.selectedDeviceName
                  } );

                }

            });


        },

        _updateContent: function(devicesString) {
            console.log("Updating content");

            this.jsonDevices = JSON.parse(devicesString);

            var selectDeviceDOM = document.getElementById("selectDevice");
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
            $( "#selectDevice" ).selectmenu( "refresh" );

            this._trigger( "selectionChanged", null, {
                    selectedDevice: this.jsonDevices[0].deviceName,
                    selectedDeviceName: this.jsonDevices[0].displayName
                } );

        },

        _getContent: function() {
            var _this = this;
            console.log("Getting content");
            $.ajax({
                type: "GET",
                url: "getContentFromServer",
                data: {
                    cmd: _this.options.contentCommand,
                    XHR: "1"
                },
                success: function(data) {
                    _this._updateContent(data);
                }

            });
        },

        update: function() {
            this._getContent();
        }
    });

}( jQuery ));

//$(document).ready(function() {
//    var selector = $( "#deviceSelector" ).deviceSelector({
//        value: 20,
//        contentCommand: "getDevicesWithGauges",
//        selectionChanged: function(evt, data) {
//            console.log(data);
//        }
//    });
//
//    selector.deviceSelector("update");
//});