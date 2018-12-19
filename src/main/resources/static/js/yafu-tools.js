//
// Yet Another FHEM UI - Tools
//

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

            this._getContent();

            console.log(this);
            console.log(this.options.contentCommand);
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
        }
    });

}( jQuery ));

//$(document).ready(function() {
//    $( "#deviceSelector" ).deviceSelector({
//        value: 20,
//        contentCommand: "getDevicesWithGauges",
//        selectionChanged: function(evt, data) {
//            console.log(data);
//        }
//    });
//});