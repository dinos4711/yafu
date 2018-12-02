//
// Yet Another FHEM UI - Clock
//

class YafuClock {
  constructor(cell, sendToServer = false) {
    var _this = this;

    this.cell = cell;

    var myContent = '\
        <canvas ui-uuid="' + this.cell.id + '" id="' + this.cell.id + '" width="150" height="150" styl="background-color:#000000"></canvas>\
        <button id="button-close-' + this.cell.id + '" class="hideable" style="position: absolute; top: 0px; right: 0px; width: 18px; height: 18px;">x</button>\
    ';

    var cellElement = document.createElement("div");
    cellElement.setAttribute("class", "editable clock-wrapper");
    cellElement.setAttribute("draggable-id", this.cell.id);
    cellElement.innerHTML = myContent;

    document.getElementById("uicontainer").appendChild(cellElement);

    if (typeof this.cell.position == 'undefined') {
      this.cell.position = {top: 50, left: 10};
    }
    if (typeof this.cell.size == 'undefined') {
      this.cell.size = {width: 150, height: 150};
    }
    $("div[draggable-id=" + this.cell.id + "]").css({top: this.cell.position.top, left: this.cell.position.left, width: this.cell.size.width, height: this.cell.size.height});
    var canvas = document.getElementById(_this.cell.id);
    canvas.width = this.cell.size.width;
    canvas.height = this.cell.size.height;

    $("div[draggable-id=" + this.cell.id + "]").draggable({
      containment: "document",
      snap: true,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      stack: ".clock-wrapper",
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

        $("div[ui-uuid=" + _this.cell.id + "]").text(_this.lastReading);
        $("#infoBox").text("");
        _this.cell.position = $(this).position();
        _this.cell.size = { width: $(this).width(), height: $(this).height() };
        sendCellToServer(_this.cell);
      }
    }).resizable({
        minWidth: 10,
        minHeight: 10,
        grid: [ gridSize, gridSize ],
        helper: "ui-resizable-helper",
        resize: function( event, ui ) {
          $("#infoBox").text(ui.size.width + ' x ' + ui.size.height);
        },
        stop: function( event, ui ) {
          $("div[ui-uuid=" + _this.cell.id + "]").text(_this.lastReading);
          $("#infoBox").text("");
          _this.cell.position = ui.position;
          _this.cell.size = ui.size;
          sendCellToServer(_this.cell);

          stopClock(_this);
          var canvas = document.getElementById(_this.cell.id);
          canvas.width = ui.size.width;
          canvas.height = ui.size.height;
          startClock(_this);
        }
    });

    $("button[id=button-close-" + this.cell.id + "]").button({
      icon: "ui-icon-close",
      showLabel: false
    }).on("click", function() {
      sendRemoveCellToServer(_this.cell.id);
      $("div[draggable-id=" + _this.cell.id + "]").remove();
      stopClock(_this);
    });

    startClock(this);
  }

  inform(deviceReading, value) {
    // dummy
  }
}

function startClock(clock) {
    clock.canvas = document.getElementById(clock.cell.id);
    clock.context = clock.canvas.getContext("2d");

    var radiusX = clock.canvas.width / 2;
    var radiusY = clock.canvas.height / 2;
    clock.context.translate(radiusX, radiusY);
    radiusX = radiusX * 0.90;
    radiusY = radiusY * 0.90;
    clock.radius = Math.min(radiusX, radiusY);

    clock.refreshIntervalId = setInterval(drawClock, 100, clock);
}

function stopClock(clock) {
    clearInterval(clock.refreshIntervalId);
}

function drawClock(clock) {
    drawFace(clock.context, clock.radius);
    drawNumbers(clock.context, clock.radius);
    drawTime(clock.context, clock.radius);
}

function drawFace(context, radius) {
    var grad;
    context.beginPath();
    context.arc(0, 0, radius, 0, 2*Math.PI);
    context.fillStyle = 'white';
    context.fill();
    grad = context.createRadialGradient(0,0,radius*0.95, 0,0,radius*1.05);
    grad.addColorStop(0, '#333');
    grad.addColorStop(0.5, 'white');
    grad.addColorStop(1, '#333');
    context.strokeStyle = grad;
    context.lineWidth = radius*0.1;
    context.stroke();
    context.beginPath();
    context.arc(0, 0, radius*0.1, 0, 2*Math.PI);
    context.fillStyle = '#333';
    context.fill();
  }

function drawNumbers(context, radius) {
    var ang;
    var num;
    context.font = radius*0.15 + "px arial";
    context.textBaseline="middle";
    context.textAlign="center";
    for(num = 1; num < 13; num++){
      ang = num * Math.PI / 6;
      context.rotate(ang);
      context.translate(0, -radius*0.85);
      context.rotate(-ang);
      context.fillText(num.toString(), 0, 0);
      context.rotate(ang);
      context.translate(0, radius*0.85);
      context.rotate(-ang);
    }
  }

function drawTime(context, radius){
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds() + now.getMilliseconds() / 1000;

    //hour
    hour=hour%12;
    hour=(hour*Math.PI/6)+
         (minute*Math.PI/(6*60))+
         (second*Math.PI/(360*60));
    drawHand(context, hour, radius*0.5, radius*0.07, "#000000");
    //minute
    minute=(minute*Math.PI/30)+(second*Math.PI/(30*60));
    drawHand(context, minute, radius*0.8, radius*0.07, "#000000");
    // second
    second=(second*Math.PI/30);
    drawHand(context, second, radius*0.9, radius*0.02, "#0000ff");
  }

function drawHand(context, pos, length, width, color) {
    context.beginPath();
    context.strokeStyle=color;
    context.lineWidth = width;
    context.lineCap = "round";
    context.moveTo(0,0);
    context.rotate(pos);
    context.lineTo(0, -length);
    context.stroke();
    context.rotate(-pos);
  }