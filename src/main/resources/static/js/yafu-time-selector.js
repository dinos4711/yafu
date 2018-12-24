//
// Yet Another FHEM UI - Time selector
//

(function ( $ ) {

    $.widget( "yafu.timeSelector", {

        // Default options.
        options: {
            minValue: 0,
            maxValue: 59,
            width: 220,
            height: 220,
            text: ""
        },

        _create: function() {
            var _this = this;

            this.id = this.element[0].id;

            this.value = 0;
            this.helperAngle = -90;

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

            var width = this.canvas.width;
            var height = width / 2 * Math.cos(Math.radians(60));
            var radius;
            if (height > this.canvas.height) {
              this.radius = this.canvas.height / (1 + Math.cos(Math.radians(60)));
            } else {
              this.radius = width / 2;
            }

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
              this.helperAngle = null;
              this.drag = false;
            }

            this._draw();
        },

        _mouseup: function (evt, isTouch) {

            if (evt.button == 2) {
              return;
            }

            if (!this._mouseToValue(evt, isTouch)) {
              this.helperAngle = null;
              this.drag = false;
              this._draw();
              return;
            }

            this._draw();

            this.drag = false;
        },

        _mouseToValue: function (evt, isTouch) {
            var mousePos = this._getMousePos(evt, isTouch);
            var xRelCenter = mousePos.x - this.radius;
            var yRelCenter = mousePos.y - this.radius;

            var r = Math.sqrt(xRelCenter * xRelCenter + yRelCenter * yRelCenter);

            var f = Math.degrees(Math.atan((yRelCenter) / (xRelCenter)));

            var signX = Math.sign(xRelCenter);
            var signY = Math.sign(yRelCenter);
            if (signX == -1) {
                f = 180 + f;
            } else if (signY == -1) {
                f = 360 + f;
            }

            if (f > 270) {
                f -= 270;
            } else {
                f += 90;
            }

            this.value = Math.round(mapNumber(f, 0, 360, this.options.minValue, this.options.maxValue));
            this._trigger( "valueChanged", null, { value: this.value });

            this.helperAngle = mapNumber(this.value, this.options.minValue, this.options.maxValue, 0, 360) - 90;

            return true;
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

        _draw: function() {
            var ctx = this.context;

            // Store the current transformation matrix
            ctx.save();
            // Use the identity matrix while clearing the canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // Restore the transform
            ctx.restore();

            ctx.save();

            ctx.translate(this.radius, this.radius);
            ctx.strokeStyle='#808080';
            ctx.fillStyle='#808080';

            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 1.0, 0, 2 * Math.PI, false);
            ctx.arc(0, 0, this.radius * 0.7, 0, 2 * Math.PI, true);
            ctx.fill();

            ctx.textAlign = "center";
            ctx.textBaseline= "middle";

            if (this.options.text) {
                ctx.fillStyle='#808080';
                ctx.font = "" + (this.radius / 4) + "px Arial";
                ctx.fillText(this.options.text, 0, this.radius / 3);
            }

            ctx.fillStyle='#00ff00';
            ctx.font = "" + (this.radius / 2) + "px Arial";
            ctx.fillText(this.value, 0, 0);

            if (this.helperAngle != null) {
                var f = Math.radians(this.helperAngle);
                ctx.beginPath();

                ctx.rotate(f);
                ctx.arc(this.radius * 0.85, 0, this.radius * 0.15, 0, 2 * Math.PI, false);
                ctx.fill();
            }

            ctx.restore();
        },

        getValue: function() {
            return this.value;
        }

    });

}( jQuery ));

