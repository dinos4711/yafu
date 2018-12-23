//
// Yet Another FHEM UI - Menu
//

class YafuMenu {
  constructor(menu, sendToServer = false) {
    var _this = this;

    this.menu = menu;

    var myContent = '';
    for (var i in menu.entries) {
      var linkLocation = location.protocol + '//' + location.host + location.pathname + "?page=" + menu.entries[i].name;
      var classValue;
      if (menu.entries[i].name == getPageName()) {
        classValue = "editable round-link current";
      } else {
        classValue = "editable round-link";
      }
      myContent += '<div id="menu-' + i + '" link="' + linkLocation + '" class="' + classValue + '">' + menu.entries[i].name +'</div>';
    }

    var menuElement = document.createElement("div");
    menuElement.setAttribute("class", "editable menu-wrapper");
    menuElement.setAttribute("draggable-id", "page-menu");
    menuElement.innerHTML = myContent;

    document.getElementById("uicontainer").appendChild(menuElement);

    for (var i in menu.entries) {
      if (typeof menu.entries[i].left != 'undefined') {
        $('#menu-' + i).css({left: menu.entries[i].left});
      }
      if (typeof menu.entries[i].top != 'undefined') {
        $('#menu-' + i).css({top: menu.entries[i].top});
      }

      if (menu.entries[i].hidden && config.mode == 'view') {
        $('#menu-' + i).hide();
        $('#menu-' + i).addClass('hideable');
      } else {
        $('#menu-' + i).show();
        $('#menu-' + i).removeClass('hideable');
      }

      $('#menu-' + i).draggable({
        containment: "document",
        drag: function( event, ui ) {
          var myTop  = Math.round(parseFloat($(this).css("top"))  / gridSize) * gridSize;
          var myLeft = Math.round(parseFloat($(this).css("left")) / gridSize) * gridSize;
          $(this).css({top: myTop, left: myLeft});

          $("#infoBox").text(myLeft + ' , ' + myTop);
        },
        stop: function( event, ui ) {
          var myTop  = Math.round(parseFloat($(this).css("top"))  / gridSize) * gridSize;
          var myLeft = Math.round(parseFloat($(this).css("left")) / gridSize) * gridSize;
          $(this).css({top: myTop, left: myLeft});

          var index = $(this).attr("id").split("-")[1];
          _this.menu.entries[index].left = myLeft;
          _this.menu.entries[index].top = myTop;
          setTimeout(adjustMenuEntriesPositionsAndWidths, 100, _this);
          sendMenuToServer(_this.menu);

          $("#infoBox").text("");

        }
      });

      if (menu.entries[i].name != getPageName()) {
        $('#menu-' + i).on("click", function() {
          location.href = $(this).attr("link");
        });
        $('#menu-' + i).on("mouseover", function() {
          $(this).css('cursor','pointer');
        });
      }

//      $('#menu-' + i).contextmenu(function() {
//        var index = $(this).attr("id").split("-")[1];
//        console.log(index);
//        console.log(_this.menu.entries[index].name);
//        if (config.mode == 'edit') {
//          var hidden;
//          if (_this.menu.entries[index].hidden) {
//            $('#menu_menuEntryHideShow').text("Show");
//            hidden = true;
//          } else {
//            $('#menu_menuEntryHideShow').text("Hide");
//            hidden = false;
//          }
//
//          $('#menu_menuEntryHideShow').click(function() {
//            menuEntryContextMenuDialog.dialog( "close");
//            hidden = !hidden;
//            _this.menu.entries[index].hidden = hidden;
//
//            if (hidden) {
//              $('#menu-' + index).addClass('hideable');
//            } else {
//              $('#menu-' + index).removeClass('hideable');
//            }
//
//            sendMenuToServer(_this.menu);
//            $('#menu_menuEntryHideShow').unbind("click");
//          });
//          menuEntryContextMenuDialog.dialog( "open");
//        }
//      });
//
//      if (this.menu.entries[i].hidden && config.mode == 'view') {
//        $('#menu-' + i).hide();
//      } else {
//        $('#menu-' + i).show();
//      }

      $('#menu-' + i).contextMenu({
          selector: 'div',
          events: {
             show : function(options){
                  return config.mode == 'edit';
             },
          },
          callback: function(key, options) {
              if (key == 'hide-show') {
                  console.log(i);
                  console.log(this);
                  console.log(options);
              }
          },
          items: {
              "hide-show": {name: "Delete", icon: "delete"},
              "delete": {name: "Delete", icon: "delete"},
          }
      });

    }

    if (typeof this.menu.position == 'undefined') {
      this.menu.position = {top: 50, left: 10};
    }
    if (typeof this.menu.size == 'undefined') {
      this.menu.size = {width: 100, height: 300};
    }
    $("div[draggable-id=page-menu]").css({top: this.menu.position.top, left: this.menu.position.left, width: this.menu.size.width, height: this.menu.size.height});
    $("div[draggable-id=page-menu]").css('z-index', 100);

    $("div[draggable-id=page-menu]").draggable({
      containment: "document",
      snap: false,
      snapTolerance: 5,
      grid: [ gridSize, gridSize ],
      create: function( event, ui ) {
        if (sendToServer) {
          sendMenuToServer(_this.menu);
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

        $("#infoBox").text("");
        _this.menu.position = $(this).position();
        _this.menu.size = { width: $(this).width(), height: $(this).height() };
        sendMenuToServer(_this.menu);
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
          $("#infoBox").text("");
          _this.menu.position = $(this).position();
          _this.menu.size = { width: $(this).width(), height: $(this).height() };
          setTimeout(adjustMenuEntriesPositionsAndWidths, 100, _this);
          sendMenuToServer(_this.menu);

        }
    });

    setTimeout(adjustMenuEntriesPositionsAndWidths, 100, this);
  }

  openSettings() {

  }

}

function adjustMenuEntriesPositionsAndWidths(gauge) {
    for (var i in gauge.menu.entries) {
        var myWidth = $('#menu-' + i).parent().width() - 20;
        $('#menu-' + i).css({width: myWidth, left: 14});
    }
}

function sendRemoveMenuToServer() {
     $.ajax({
         type: "GET",
         url: "sendRemoveMenuToServer",
         data: {
            XHR: "1"
        },
        contentType: "application/json; charset=utf-8",
        error: function(data) {
            $.toast({
                     heading: 'Error',
                     text: JSON.stringify(cell),
                     loader: false,
                     hideAfter: 1000,
                     showHideTransition: 'slide',
                     icon: 'error'
                 });
        }

     });

}

function sendMenuToServer(menu) {
     $.ajax({
         type: "GET",
         url: "sendMenuToServer",
         data: {
            menu: JSON.stringify(menu),
            XHR: "1"
        },
        contentType: "application/json; charset=utf-8",
        error: function(data) {
            $.toast({
                     heading: 'Error',
                     text: JSON.stringify(cell),
                     loader: false,
                     hideAfter: 1000,
                     showHideTransition: 'slide',
                     icon: 'error'
                 });
        }

     });

}

function createMenuEntryContextMenuDialog(data) {
    var element = document.createElement("div");
    element.innerHTML = data;
    document.body.appendChild(element);

    menuEntryContextMenuDialog = $( "#menuEntryContextMenuDialog" ).dialog({
      autoOpen: false,
      modal: true
    });
    $("#menuEntryContextMenuDialog").css('z-index', 9999);
    $( "#menuEntryContextMenu" ).menu();
}

$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "menuEntryContextMenuDialog.html",
        cache: false,
        success: function(data) {
            createMenuEntryContextMenuDialog(data);
        }
    });
});