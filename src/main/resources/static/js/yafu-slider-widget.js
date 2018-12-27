//
// Yet Another FHEM UI - Slider widget
//

(function ( $ ) {

    $.widget( "yafu.sliderWidget", {

        // Default options.
        options: {
            values: "eco,comfort,boost,auto,off,5.0,5.5,6.0,6.5,7.0,7.5,8.0,8.5,9.0,9.5,10.0,10.5,11.0,11.5,12.0,12.5,13.0,13.5,14.0,14.5,15.0,15.5,16.0,16.5,17.0,17.5,18.0,18.5,19.0,19.5,20.0,20.5,21.0,21.5,22.0,22.5,23.0,23.5,24.0,24.5,25.0,25.5,26.0,26.5,27.0,27.5,28.0,28.5,29.0,29.5,30.0,on",
            width: 400,
            height: 25,
            fillColorValue: "#aa6900",
            fillColorVirtualValue: "#00ff00"
        },

        _create: function() {
            var _this = this;

            this.id = this.element[0].id;

            var valuesString = this.options.values;

            this.values = valuesString.split(',');

            var myContent = '\
                <canvas id="' + this.id + '" width="' + this.options.width + '" height="' + this.options.height + '"></canvas>\
                ';
            this.element.replaceWith( myContent );

            this.canvas = document.getElementById(this.id);
            this.context = this.canvas.getContext("2d");

            $('#' + this.id).css({width: _this.options.width, height: _this.options.height});

            this.canvas.addEventListener ("mousedown", function(evt) {
                _this._mousedown(evt, false);
            }, false);

            this.canvas.addEventListener ("touchstart", function(evt) { // like mousedown
                _this._mousedown(evt, true);
            }, false);

            this.canvas.addEventListener('mousemove', function(evt) {
                _this._mousemove(evt, false);
              }, false);

            this.canvas.addEventListener('touchmove', function(evt) {
                _this._mousemove(evt, true);
              }, false);

            this.canvas.addEventListener ("mouseup", function(evt) {
                _this._mouseup(evt, false);
            }, false);

            this.canvas.addEventListener ("touchend", function(evt) { // like mouseup
                _this._mouseup(evt, true);
            }, false);

            this.canvas.addEventListener ("mouseout", function(evt) {
                _this._mouseout(evt, false);
            }, false);

            this.helperRadius = 3 * this.canvas.height / 8;
            this.xOffset = 4 * this.helperRadius / 3;
            this.setValue(this.values[0]);
            this.helperPosition = null;
            this.helperValue = null;

            this._draw();
        },

        _mousedown: function (evt, isTouch) {
            if (evt.button == 2) {
              return;
            }

            this.drag = true;
        },

        _mousemove: function (evt, isTouch) {

            if (evt.button == 2) {
              return;
            }

            if (!this.drag) {
              return;
            }

            if (!this._mouseToValue(evt, isTouch)) {
              this.helperPosition = null;
              this.drag = false;
            }

            this._draw();
        },

        _mouseup: function (evt, isTouch) {

            if (evt.button == 2) {
              return;
            }

            if (!this._mouseToValue(evt, isTouch)) {
              this.helperPosition = null;
              this.drag = false;
              this._draw();
              return;
            }

            this.setValue(this.helperValue);
            this._trigger( "valueChanged", null, { value: this.helperValue });

            this.drag = false;
            this.helperPosition = null;
            this.helperValue = null;

            this._draw();
        },

        _mouseout: function (evt, isTouch) {
            this.drag = false;
            this.helperPosition = null;
            this.helperValue = null;

            this._draw();
        },

        _getMousePos: function (evt, isTouch) {
            var rect = this.canvas.getBoundingClientRect();

            if (isTouch) {
                return {
                      x: evt.changedTouches[0].clientX - rect.left,
                      y: evt.changedTouches[0].clientY - rect.top
                    };
            } else {
                return {
                      x: evt.clientX - rect.left,
                      y: evt.clientY - rect.top
                    };
            }
        },

        _mouseToValue: function (evt, isTouch) {
            var mousePos = this._getMousePos(evt, isTouch);

            this.helperPosition = mousePos.x;

            var selectedIndex = Math.round(
                mapNumber(mousePos.x, this.xOffset, this.canvas.width - this.xOffset, 0, this.values.length - 1)
            );

            if (selectedIndex < 0) {
                selectedIndex = 0;
            }
            if (selectedIndex > this.values.length - 1) {
                selectedIndex = this.values.length - 1;
            }

            this.helperValue = this.values[selectedIndex];
            this.helperPosition = Math.round(mapNumber(selectedIndex, 0, this.values.length - 1, this.xOffset, this.canvas.width - this.xOffset));

            this._trigger( "virtualValueChanged", null, { value: this.helperValue });

            return true;
        },

        _valueToPosition: function(value) {
            var index;
            for (var i in this.values) {
                if (this.values[i] == value) {
                    index = i;
                    break;
                }
            }

            var position = Math.round(mapNumber(index, 0, this.values.length - 1, this.xOffset, this.canvas.width - this.xOffset));
            return position;
        },

        _draw: function() {
            var ctx = this.context;

            // Store the current transformation matrix
            ctx.save();
            // Use the identity matrix while clearing the canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Restore the transform
            ctx.restore();

            ctx.beginPath();
            ctx.strokeStyle='#808080';
            ctx.fillStyle='#808080';
            ctx.lineCap = "round";
            ctx.lineWidth = this.canvas.height;
            ctx.moveTo(this.canvas.height / 2,                     this.canvas.height / 2);
            ctx.lineTo(this.canvas.width - this.canvas.height / 2, this.canvas.height / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.strokeStyle='#383838';
            ctx.lineCap = "round";
            ctx.lineWidth = 5;
            ctx.moveTo(this.xOffset, this.canvas.height / 2);
            ctx.lineTo(this.canvas.width - this.xOffset, this.canvas.height / 2);
            ctx.stroke();

            if (this.helperPosition != null) {
                this._drawValue(this.helperPosition, '#383838', this.options.fillColorVirtualValue);
            } else if (this.value != null) {
                this._drawValue(this.valuePosition, '#383838', this.options.fillColorValue);
            }
        },

        _drawValue: function(position, color, fillColor) {
            var ctx = this.context;

            ctx.beginPath();
            ctx.fillStyle = fillColor;
            ctx.arc(position, this.canvas.height / 2, this.helperRadius, 0, 2 * Math.PI);
            ctx.fill();

            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.arc(position, this.canvas.height / 2, this.helperRadius, 0, 2 * Math.PI);
            ctx.stroke();
        },

        setValue: function(value) {
            this.value = value;
            this.valuePosition = this._valueToPosition(value);

            this._draw();
        },

        getValue: function() {
            return this.value;
        }

    });

}( jQuery ));

