var FW_serverGenerated;
var FW_serverFirstMsg = (new Date()).getTime()/1000;
var FW_serverLastMsg = FW_serverFirstMsg;
var FW_urlParams={};
var FW_docReady = false, FW_longpollType, FW_csrfToken, FW_csrfOk=true;

FW_longpollType = "websocket";
//FW_longpollType = 1;

var FW_widgets = {
  select:            { createFn:FW_createSelect    },
  selectnumbers:     { createFn:FW_createSelectNumbers, },
  slider:            { createFn:FW_createSlider    },
  time:              { createFn:FW_createTime      },
  noArg:             { createFn:FW_createNoArg     },
  multiple:          { createFn:FW_createMultiple  },
  "multiple-strict": { createFn:FW_createMultiple, second:true  },
  textField:         { createFn:FW_createTextField },
  textFieldNL:       { createFn:FW_createTextField, second:true },
  "textField-long":  { createFn:FW_createTextField, second:true },
  "textFieldNL-long":{ createFn:FW_createTextField, second:true }
};

function
FW_errmsg(txt, timeout)
{
  console.log("ERRMSG:"+txt+"<");
  var errmsg = document.getElementById("errmsg");
  if(!errmsg) {
    if(txt == "")
      return;
    errmsg = document.createElement('div');
    errmsg.setAttribute("id","errmsg");
    document.body.appendChild(errmsg);
  }
  if(txt == "") {
    document.body.removeChild(errmsg);
    return;
  }
  errmsg.innerHTML = txt;
  if(timeout)
    setTimeout("FW_errmsg('')", timeout);
}

/*************** select **************/
function
FW_createSelect(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length < 2 || vArr[0] != "select" || (params && params.length))
    return undefined;
  var newEl = document.createElement('select');
  var vHash = {};
  for(var j=1; j < vArr.length; j++) {
    var o = document.createElement('option');
    o.text = o.value = vArr[j].replace(/#/g," ");
    vHash[vArr[j]] = 1;
    newEl.options[j-1] = o;
  }
  if(currVal)
    $(newEl).val(currVal);
  if(elName)
    $(newEl).attr('name', elName);
  if(cmd)
    $(newEl).change(function(arg) { cmd($(newEl).val()) });
  newEl.setValueFn = function(arg) { if(vHash[arg]) $(newEl).val(arg); };
  return newEl;
}

/*************** selectNumbers **************/
// Syntax: selectnumbers,<min value>,<step|step of exponent>,<max value>,<number of digits after decimal point>,lin|log10

function
FW_createSelectNumbers(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length < 6 || vArr[0] != "selectnumbers" || (params && params.length))
    return undefined;

  var min = parseFloat(vArr[1]);
  var stp = parseFloat(vArr[2]);
  var max = parseFloat(vArr[3]);
  var dp  = parseFloat(vArr[4]); // decimal points
  var fun = vArr[5]; // function

  if(currVal != undefined)
    currVal = currVal.replace(/[^\d.\-]/g, "");
    currVal = (currVal==undefined || currVal=="") ?  min : parseFloat(currVal);
  if(max==min)
    return undefined;
  if(!(fun == "lin" || fun == "log10"))
    return undefined;

  if(currVal < min)
    currVal = min;
  if(currVal > max)
    currVal = max;

  var newEl = document.createElement('select');
  var vHash = {};
  var k = 0;
  var v = 0;
  if (fun == "lin") {
    for(var j=min; j <= max; j+=stp) {
      var o = document.createElement('option');
      o.text = o.value = j.toFixed(dp);
      vHash[j.toString()] = 1;
      newEl.options[k] = o;
      k++;
    }
  } else if (fun == "log10") {
    if(min <= 0 || max <= 0)
      return undefined;
    for(var j=Math.log10(min); j <= Math.log10(max)+stp; j+=stp) {
      var o = document.createElement('option');
      var w = Math.pow(10, j)
      if (w > max)
        w = max;
      if (v == w.toFixed(dp))
        continue;
      v = w.toFixed(dp);
      o.text = o.value = v;
      vHash[v] = 1;
      newEl.options[k] = o;
      k++;
    }
  }
  if(currVal)
    $(newEl).val(currVal.toFixed(dp));
  if(elName)
    $(newEl).attr('name', elName);
  if(cmd)
    $(newEl).change(function(arg) { cmd($(newEl).val()) });
  newEl.setValueFn = function(arg) { if(vHash[arg]) $(newEl).val(arg); };
  return newEl;
}

/*************** noArg **************/
function
FW_createNoArg(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length != 1 || vArr[0] != "noArg" || (params && params.length))
    return undefined;
  var newEl = $('<div style="display:none">').get(0);
  if(elName)
    $(newEl).append('<input type="hidden" name="'+elName+ '" value="">');
  return(newEl);
}

/*************** slider **************/
function
FW_createSlider(elName, devName, vArr, currVal, set, params, cmd)
{
  // min, step, max, float
  if(vArr.length < 4 || vArr.length > 5 || vArr[0] != "slider" ||
     (params && params.length))
    return undefined;

  var min = parseFloat(vArr[1]);
  var stp = parseFloat(vArr[2]);
  var max = parseFloat(vArr[3]);
  var flt = (vArr.length == 5 && vArr[4] == "1");
  var dp = 0; // decimal points for float
  if(flt) {
    var s = ""+stp;
    if(s.indexOf(".") >= 0)
      dp = s.substr(s.indexOf(".")+1).length;
  }
  if(currVal != undefined)
    currVal = currVal.replace(/[^\d.\-]/g, "");
  currVal = (currVal==undefined || currVal=="") ?  min : parseFloat(currVal);
  if(max==min)
    return undefined;
  if(currVal < min || currVal > max)
    currVal = min;

  var newEl = $('<div style="display:inline-block" tabindex="0">').get(0);
  var slider = $('<div class="slider" id="slider.'+devName+'">').get(0);
  $(newEl).append(slider);

  var sh = $('<div class="handle">'+currVal+'</div>').get(0);
  $(slider).append(sh);
  if(elName)
    $(newEl).append('<input type="hidden" name="'+elName+
                        '" value="'+currVal+'">');

  var lastX=-1, offX=0, maxX=0, val=currVal;

  newEl.activateFn = function() {
    if(currVal < min || currVal > max)
      return;
    if(!slider.offsetWidth)
      return setTimeout(newEl.activateFn, 1);
    maxX = slider.offsetWidth-sh.offsetWidth;
    offX = (currVal-min)*maxX/(max-min);
    var strVal = (flt ? currVal.toFixed(dp) : ""+parseInt(currVal));
    sh.innerHTML = strVal;
    sh.setAttribute('style', 'left:'+offX+'px;');
    if(elName)
      slider.nextSibling.setAttribute('value', strVal);
  }

  $(newEl).keydown(function(e){
         if(e.keyCode == 37) currVal -= stp;
    else if(e.keyCode == 39) currVal += stp;
    else return;

    if(currVal < min) currVal = min;
    if(currVal > max) currVal = max;
    offX = (currVal-min)*maxX/(max-min);
    var strVal = (flt ? currVal.toFixed(dp) : ""+parseInt(currVal));
    sh.innerHTML = strVal;
    sh.setAttribute('style', 'left:'+offX+'px;');
    if(cmd)
      cmd(strVal);
    if(elName)
      slider.nextSibling.setAttribute('value', strVal);
  });

  function
  touchFn(e, fn)
  {
    e.preventDefault(); // Prevents Safari from scrolling!
    if(e.touches == null || e.touches.length == 0)
      return;
    e.clientX = e.touches[0].clientX;
    fn(e);
  }

  function
  mouseDown(e)
  {
    var oldFn1 = document.onmousemove, oldFn2 = document.onmouseup,
        oldFn3 = document.ontouchmove, oldFn4 = document.ontouchend;

    e.stopPropagation();  // Dashboard fix
    lastX = e.clientX;  // Does not work on IE8

    function
    mouseMove(e)
    {
      e.stopPropagation();  // Dashboard fix

      if(maxX == 0) // Forum #35846
        maxX = slider.offsetWidth-sh.offsetWidth;
      var diff = e.clientX-lastX; lastX = e.clientX;
      offX += diff;
      if(offX < 0) offX = 0;
      if(offX > maxX) offX = maxX;
      val = offX/maxX * (max-min);
      val = flt ? (Math.floor(val/stp)*stp+min).toFixed(dp) :
                  (Math.floor(Math.floor(val/stp)*stp)+min);
      sh.innerHTML = val;
      sh.setAttribute('style', 'left:'+offX+'px;');
    }
    document.onmousemove = mouseMove;
    document.ontouchmove = function(e) { touchFn(e, mouseMove); }

    document.onmouseup = document.ontouchend = function(e)
    {
      e.stopPropagation();  // Dashboard fix
      document.onmousemove = oldFn1; document.onmouseup  = oldFn2;
      document.ontouchmove = oldFn3; document.ontouchend = oldFn4;
      if(cmd)
        cmd(val);
      if(elName)
        slider.nextSibling.setAttribute('value', val);
    };
  };

  sh.onselectstart = function() { return false; }
  sh.onmousedown = mouseDown;
  sh.ontouchstart = function(e) { touchFn(e, mouseDown); }

  newEl.setValueFn = function(arg) {
    var res = arg.match(/[\d.\-]+/); // extract first number
    currVal = (res ? parseFloat(res[0]) : min);
    if(currVal < min || currVal > max)
      currVal = min;
    newEl.activateFn();
  };
  return newEl;
}

/*************** TIME **************/
function
FW_createTime(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length != 1 || vArr[0] != "time" || (params && params.length))
    return undefined;
  var open="-", closed="+";

  var newEl = document.createElement('div');
  $(newEl).append('<input type="text" size="5">');
  $(newEl).append('<input type="button" value="'+closed+'">');

  var inp = $(newEl).find("[type=text]");
  var btn = $(newEl).find("[type=button]");
  currVal = (currVal ? currVal : "12:00")
            .replace(/[^\d]*(\d\d):(\d\d).*/g,"$1:$2");
  $(inp).val(currVal)
  if(elName)
    $(inp).attr("name", elName);

  var hh, mm;   // the slider elements
  newEl.setValueFn = function(arg) {
    arg = arg.replace(/[^\d]*(\d\d):(\d\d).*/g,"$1:$2");
    $(inp).val(arg);
    var hhmm = arg.split(":");
    if(hhmm.length == 2 && hh && mm) {
      hh.setValueFn(hhmm[0]);
      mm.setValueFn(hhmm[1]);
    }
  };

  $(btn).click(function(){      // Open/Close the slider view
    var v = $(inp).val();

    if($(btn).val() == open) {
      $(btn).val(closed);
      $(newEl).find(".timeSlider").remove();
      hh = mm = undefined;
      if(cmd)
        cmd(v);
      return;
    }

    $(btn).val(open);
    if(v.indexOf(":") < 0) {
      v = "12:00";
      $(inp).val(v);
    }
    var hhmm = v.split(":");

    function
    tSet(idx, arg)
    {
      if((""+arg).length < 2)
        arg = '0'+arg;
      hhmm[idx] = arg;
      $(inp).val(hhmm.join(":"));
    }

    $(newEl).append('<div class="timeSlider">');
    var ts = $(newEl).find(".timeSlider");

    hh = FW_createSlider(undefined, devName+"HH", ["slider", 0, 1, 23],
                hhmm[0], undefined, params, function(arg) { tSet(0, arg) });
    mm = FW_createSlider(undefined, devName+"MM", ["slider", 0, 5, 55],
                hhmm[1], undefined, params, function(arg) { tSet(1, arg) });
    $(ts).append("<br>"); $(ts).append(hh); hh.activateFn();
    $(ts).append("<br>"); $(ts).append(mm); mm.activateFn();
  });

  return newEl;
}

/*************** MULTIPLE **************/
function
FW_createMultiple(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length < 2 || (vArr[0]!="multiple" && vArr[0]!="multiple-strict") ||
     (params && params.length))
    return undefined;

  var newEl = $('<input type="text" size="30" readonly>').get(0);
  if(currVal)
    $(newEl).val(currVal);
  if(elName)
    $(newEl).attr("name", elName);
  newEl.setValueFn = function(arg){ $(newEl).val(arg) };

  for(var i1=1; i1<vArr.length; i1++)
    vArr[i1] = vArr[i1].replace(/#/g, " ");

  $(newEl).focus(function(){
    var sel = $(newEl).val().split(","), selObj={};
    for(var i1=0; i1<sel.length; i1++)
      selObj[sel[i1]] = 1;

    var table = "";
    for(var i1=1; i1<vArr.length; i1++) {
      var v = vArr[i1];
      table += '<tr>'+ // funny stuff for ios6 style, forum #23561
        '<td><div class="checkbox">'+
           '<input name="'+v+'" id="multiple_'+v+'" type="checkbox"'+
              (selObj[v] ? " checked" : "")+'/>'+'</div></td>'+
        '<td><label for="multiple_'+v+'">'+v+'</label></td></tr>';
      delete(selObj[v]);
    }

    var selArr=[];
    for(var i1 in selObj)
      selArr.push(i1);

    var strict = (vArr[0] == "multiple-strict");
    $('body').append(
      '<div id="multidlg" style="display:none">'+
        '<table>'+table+'</table>'+(!strict ? '<input id="md_freeText" '+
              'value="'+selArr.join(',')+'"/>' : '')+
      '</div>');

    $('#multidlg').dialog(
      { modal:true, closeOnEscape:false, maxHeight:$(window).height()*3/4,
        buttons:[
        { text:"Cancel", click:function(){ $('#multidlg').remove(); }},
        { text:"OK", click:function(){
          var res=[];
          if($("#md_freeText").val())
            res.push($("#md_freeText").val());
          $("#multidlg table input").each(function(){
            if($(this).prop("checked"))
              res.push($(this).attr("name"));
          });
          $('#multidlg').remove();
          $(newEl).val(res.join(","));
          if(cmd)
            cmd(res.join(","));
        }}]});
  });
  return newEl;
}

/*************** TEXTFIELD **************/
function
FW_createTextField(elName, devName, vArr, currVal, set, params, cmd)
{
  if(vArr.length != 1 ||
     (vArr[0] != "textField" &&
      vArr[0] != "textFieldNL" &&
      vArr[0] != "textField-long" &&
      vArr[0] != "textFieldNL-long") ||
     (params && params.length))
    return undefined;

  var is_long = (vArr[0].indexOf("long") > 0);

  var newEl = $("<div style='display:inline-block'>").get(0);
  if(set && set != "state" && vArr[0].indexOf("NL") < 0)
    $(newEl).append(set+":");
  $(newEl).append('<input type="text" size="30">');
  var inp = $(newEl).find("input").get(0);
  if(elName)
    $(inp).attr('name', elName);
  if(currVal != undefined)
    $(inp).val(currVal);

  function addBlur() { if(cmd) $(inp).blur(function() { cmd($(inp).val()) }); };

  newEl.setValueFn = function(arg){ $(inp).val(arg) };
  addBlur();

  var myFunc = function(){

    $(inp).unbind("blur");
    $('body').append(
      '<div id="editdlg" style="display:none">'+
        '<textarea id="td_longText" rows="25" cols="60" style="width:99%"/>'+
      '</div>');

    var txt = $(inp).val();
    txt = txt.replace(/\u2424/g, '\n');
    $("#td_longText").val(txt);

    var cm;
    if(typeof AddCodeMirror == 'function') {
      AddCodeMirror($("#td_longText"), function(pcm) {cm = pcm;});
    }

    $('#editdlg').dialog(
      { modal:true, closeOnEscape:true, width:$(window).width()*3/4,
        height:$(window).height()*3/4,
        close:function(){ $('#editdlg').remove(); },
        buttons:[
        { text:"Cancel", click:function(){
          $(this).dialog('close');
          addBlur();
        }},
        { text:"OK", click:function(){
          if(cm)
            $("#td_longText").val(cm.getValue());
          var res=$("#td_longText").val();
          res = res.replace(/\n/g, '\u2424' );
          $(this).dialog('close');
          $(inp).val(res);
          addBlur();
        }}]
      });
  };

  if(is_long)
    $(newEl).click(myFunc);

  return newEl;
}

/*************** LONGPOLL START **************/
var FW_pollConn;
var FW_longpollOffset = 0;
var FW_leaving;
var FW_lastDataTime=0;

function getAllElementsWithAttribute(attribute) {
  var matchingElements = [];
  var allElements = document.getElementsByTagName('*');
  for (var i = 0, n = allElements.length; i < n; i++) {
    if (allElements[i].getAttribute(attribute) !== null) {
      // Element exists with attribute. Add to array.
      matchingElements.push(allElements[i]);
    }
  }
  return matchingElements;
}

function inform(info) {
  for (var i in allCells) {
    var oneCell = allCells[i];
    oneCell.inform(info[0], info[1]);
  }
}

function FW_doUpdate(evt)
{
  var errstr = "Connection lost, trying a reconnect every 5 seconds.";
  var input="";
  var retryTime = 5000;
  var now = new Date()/1000;

  function
  setValue(d) // is Callable from eval below
  {
    inform(d);

    $("[informId='"+d[0]+"']").each(function(){
      if(this.setValueFn) {     // change the select/etc value
        this.setValueFn(d[1].replace(/\n/g, '\u2424'));

      } else {
        if(d[2].match(/\n/) && !d[2].match(/<.*>/)) // format multiline
          d[2] = '<html><pre>'+d[2]+'</pre></html>';

        var ma = /^<html>([\s\S]*)<\/html>$/.exec(d[2]);
        if(!d[0].match("-")) // not a reading
          $(this).html(d[2]);
        else if(ma)
          $(this).html(ma[1]);
        else
          $(this).text(d[2]);

        if(d[0].match(/-ts$/))  // timestamps
          $(this).addClass('changed');
        $(this).find("a").each(function() { FW_replaceLink(this) });
      }
    });
  }

  // iOS closes HTTP after 60s idle, websocket after 240s idle
  if(now-FW_lastDataTime > 59) {
    errstr="";
    retryTime = 100;
  }
  FW_lastDataTime = now;

  // Websocket starts with Android 4.4, and IE10
  if(typeof WebSocket == "function" && evt && evt.target instanceof WebSocket) {
    if(evt.type == 'close' && !FW_leaving) {
      FW_errmsg(errstr, retryTime-100);
      FW_pollConn.close();
      FW_pollConn = undefined;
      setTimeout(FW_longpoll, retryTime);
      return;
    }
    input = evt.data;
    FW_longpollOffset = 0;

  } else if(FW_pollConn != undefined) {
    if(FW_pollConn.readyState == 4 && !FW_leaving) {
      if(FW_pollConn.status == "400") {
        location.reload();
        return;
      }
      FW_errmsg(errstr, retryTime-100);
      setTimeout(FW_longpoll, retryTime);
      return;
    }

    if(FW_pollConn.readyState != 3)
      return;

    input = FW_pollConn.responseText;
  }

  var devs = new Array();
  if(!input || input.length <= FW_longpollOffset)
    return;

  FW_serverLastMsg = (new Date()).getTime()/1000;
  for(;;) {
    var nOff = input.indexOf("\n", FW_longpollOffset);
    if(nOff < 0)
      break;
    var l = input.substr(FW_longpollOffset, nOff-FW_longpollOffset);
    FW_longpollOffset = nOff+1;

//    console.log("Rcvd: "+(l.length>132 ? l.substring(0,132)+"...("+l.length+")":l));
//    console.log("Rcvd: "+l);
    if(!l.length)
      continue;
    if(l.indexOf("<")== 0) {  // HTML returned by proxy, if FHEM behind is dead
      FW_closeConn();
      FW_errmsg(errstr, retryTime-100);
      setTimeout(FW_longpoll, retryTime);
      return;
    }
    var d = JSON.parse(l);
    if(d.length != 3)
      continue;

    if( d[0].match(/^#FHEMWEB:/) ) {
      eval(d[1]);

    } else {
      setValue(d);
    }

    // updateLine is deprecated, use setValueFn
    for(var w in FW_widgets)
      if(FW_widgets[w].updateLine && !FW_widgets[w].second)
        FW_widgets[w].updateLine(d);

    devs.push(d);
  }

  // used for SVG to avoid double-reloads
  for(var w in FW_widgets)
    if(FW_widgets[w].updateDevs && !FW_widgets[w].second)
      FW_widgets[w].updateDevs(devs);

  // reset the connection to avoid memory problems
  if(FW_longpollOffset > 1024*1024 && FW_longpollOffset==input.length)
    FW_longpoll();
}

function
FW_closeConn()
{
  FW_leaving = 1;
  if(!FW_pollConn)
    return;
  if(typeof FW_pollConn.close ==  "function")
    FW_pollConn.close();
  else if(typeof FW_pollConn.abort ==  "function")
    FW_pollConn.abort();
  FW_pollConn = undefined;
}

function
FW_longpoll()
{
  FW_closeConn();

  FW_leaving = 0;
  FW_longpollOffset = 0;

  FW_serverGenerated = $("body").attr("generated");

  var since = "null";
  if(FW_serverGenerated)
    since = FW_serverLastMsg + (FW_serverGenerated-FW_serverFirstMsg);

  var filter = "";
  if(filter == "") {
    filter=".*";
//    filter="room=Mosquitto";
//    filter="PIR,DS18B20";
  }

//  var query = "?XHR=1"+
//              "&inform=type=status;filter="+filter+";since="+since+";fmt=JSON"+
//              '&fw_id='+$("body").attr('fw_id')+
//              "&timestamp="+new Date().getTime();
  var query = "?XHR=1"+
              "&inform=type=status;filter="+filter+";since="+since+";fmt=JSON"+
              '&fw_id=3683'+
              "&timestamp="+new Date().getTime();

  var url = config.fhemHost;
//  var loc = (""+location).replace(/\?.*/,"");
  var loc = (""+url).replace(/\?.*/,"");
  if(typeof WebSocket == "function" && FW_longpollType == "websocket") {
    console.log("Making WebSocket()");
    FW_pollConn = new WebSocket(loc.replace(/[#&?].*/,'')
                                   .replace(/^http/i, "ws")+query);
    FW_pollConn.onclose =
    FW_pollConn.onerror =
    FW_pollConn.onmessage = FW_doUpdate;
    FW_pollConn.onopen = function(){FW_wsPing(FW_pollConn);};

  } else {
    console.log("Making XMLHttpRequest()");
    FW_pollConn = new XMLHttpRequest();
    FW_pollConn.open("GET", url+query, true);
    FW_pollConn.setRequestHeader("Authorization", "Basic " + btoa(fhemUser + ":" + fhemPassword));
    if(FW_pollConn.overrideMimeType)    // Win 8.1, #66004
      FW_pollConn.overrideMimeType("application/json");
    FW_pollConn.onreadystatechange = FW_doUpdate;
    FW_pollConn.send(null);

  }

  console.log("Inform-channel opened ("+(FW_longpollType==1 ? "HTTP":FW_longpollType)+
                ") with filter "+filter);
}


function
FW_wsPing(conn) // idle websockets are closed by the browser after 55sec
{
  if(!conn || conn.readyState != conn.OPEN)
    return;
  conn.send("\n");
//  setTimeout(function(){FW_wsPing(conn);}, 30000);
}

/*************** LONGPOLL END **************/