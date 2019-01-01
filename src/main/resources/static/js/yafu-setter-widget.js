//
// Yet Another FHEM UI - Setter widget
//

var SetterMode = {
    "NoValue": 0,
    "SelectValue": 1,
    "EnterValue": 2,
    "RGBValue": 3,
    "HUEValue": 4,
};
Object.freeze(SetterMode);

(function ( $ ) {

    $.widget( "yafu.setterWidget", {

        // Default options.
        options: {
            values: "colorpicker,RGB",
            width: 400,
            height: 20,
            fillColorValue: "#aa6900",
            fillColorVirtualValue: "#00ff00",
        },

        _create: function() {
            var _this = this;

            this.id = this.element[0].id;

            var valuesString = this.options.values;

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

            this.valueMode = SetterMode.SelectValue;

            if (values.length == 0) {
                this.valueMode = SetterMode.NoValue;
            }
            if (values.length == 1) {
                if (values[0] == 'noArg') {
                    this.valueMode = SetterMode.NoValue;
                    this.selectedValue = '';
                }
                if (values[0] == '') {
                    this.valueMode = SetterMode.EnterValue;
                }
            }

            if (values[0] == 'colorpicker') {
                if (values[1] == 'RGB') {
                    this.valueMode = SetterMode.RGBValue;
                }
                if (values[1] == 'HUE') {
                    this.valueMode = SetterMode.HUEValue;
                }
            }

            var valueNodeContent;
            switch (this.valueMode) {
                case SetterMode.NoValue:
                    valueNodeContent = '<div id="' + this.id + '"></div>'; // place holder
                    this.selectedValue = '';
                    break;
                case SetterMode.SelectValue:
                    valueNodeContent = '\
                        <div id="' + this.id + '">\
                        </div>\
                    ';
                    break;
                case SetterMode.EnterValue:
                    valueNodeContent = '<input type="text" name="time" id="' + this.id + '" class="text ui-widget-content ui-corner-all" style="width: ' + this.options.width + 'px">';
                    break;
                case SetterMode.RGBValue:
                    valueNodeContent = '<input type="color" name="color" id="' + this.id + '" style="width: ' + this.options.width + 'px"/>';
                    break;
                case SetterMode.HUEValue:
                    valueNodeContent = '<input id="' + this.id + '" type="range" min="0" max="360" step="1" class="hue-range"/>';
                    break;
            }

            this.element.replaceWith( valueNodeContent );

            switch (this.valueMode) {
                case SetterMode.EnterValue:
                case SetterMode.RGBValue:
                case SetterMode.HUEValue:
                    var element = document.getElementById(this.id);
                    element.oninput = function (e) {
                        _this.value = e.target.value.replace("#", "");
                        _this._trigger( "valueChanged", null, { value: _this.value });
                    }
                    break;
                case SetterMode.SelectValue:
                    this.sliderWidget = $( "#" + this.id).sliderWidget({
                        fillColorValue: this.options.fillColorValue,
                        fillColorVirtualValue: this.options.fillColorVirtualValue,
                        values: values.join(),
                        device: _this.options.device,
                        setter: _this.options.setter,
                        virtualValueChanged: function( event, data ) {
                            _this._trigger( "virtualValueChanged", null, { value: data.value });
                        },
                        valueChanged: function( event, data ) {
                            _this.value = data.value;
                            _this._trigger( "valueChanged", null, { value: _this.value });
                        },

                    });
                    break;
            }

        },

        setValue: function(value) {
            console.log(value);
            this.value = value;
            switch (this.valueMode) {
                case SetterMode.SelectValue:
                    this.sliderWidget.sliderWidget("setValue", value);
                    break;
            }
        },

        getValue: function() {
            return this.value;
        }

    });

}( jQuery ));

