
    function callCalendar() { 

        var startDate = new Date(2014,2,15,18,30,0,0,0); // beware: month 0 = january, 11 = december
        var endDate = new Date(2014,2,15,19,30,0,0,0);
        var title = "My nice event";
        var location = "Home";
        var notes = "Some notes about this event.";
        var success = function(message) { alert("Success: " + JSON.stringify(message)); };
        var error = function(message) { alert("Error: " + message); };

        window.plugins.calendar.createEventInteractively(title,location,notes,startDate,endDate,success,error);

    }

    $(document).ready(function () { 

        var slots = jsonall[0].slot; 
        var dayRange = "2013-07-04";
        gridMaker.start(slots, dayRange);

     }); 

var gridMaker = {

  evento: null, 
  chunkHourSpace:60,
  ratioForHeight:1.6,
  descricao : new Array(),
  gridCols: 0, 
  gridBuffer: null, 
  local : new Array(),

  fixScaleHeight : function (dd) {  
  return parseInt(dd*this.ratioForHeight);
  },

  start : function (slots, currentDay) {

        var eventsByHours = [];
        var eventsByColumn = [];
        var hours = [];
        var columns = [];

        for(var key in slots) {
          var item = slots[key];        
          if(item.date == currentDay ) {
        
             var fullDate = item.date.split('-'); 
             var da = parseFloat(fullDate[2]);
             var mo = parseFloat(fullDate[1]);
             var ye = parseFloat(fullDate[0]);        
             var ho = parseFloat(item.hour);
             var mi = parseFloat(item.minute);
             var c20 = parseFloat(item.colspan)*20;

             var aDate = new Date(parseInt(ye),parseInt(mo+1),parseInt(da));
             aDate.setHours(ho);
             aDate.setMinutes(mi);
             item.getTimeBegin=aDate.getTime();
             var bDate = new Date(aDate.getTime() + c20*60000);
             item.getTimeEnd =bDate.getTime();

             var key=""+item.getTimeBegin;
             if(!eventsByHours[key]) {
                eventsByHours[key] = [];
                hours.push(key);
             }
             eventsByHours[key].push(item);
             hours.push(key);
 
             var key=""+item.getTimeEnd;
             if(!eventsByHours[key]) {
               eventsByHours[key] = [];
               hours.push(key);
             }
             eventsByHours[key].push(item);

             var roomKey = ""+item.room;
             if(!eventsByColumn[roomKey]) {
               eventsByColumn[roomKey]=[];
               columns.push(roomKey);
             }
             eventsByColumn[roomKey].push(item);

             item.type ='event';
             item.descricao = item.title;
             var begin  = parseInt(item.getTimeBegin)/60000;
             var end  = parseInt(item.getTimeEnd)/60000;

             item.cellMap=mapCell({type:'event', value:item, 'begin':begin, 'end':end });

           }
        };

        //console.log(JSON.stringify(hours));
        hours.sort();
        columns.sort();


        var hoursByIndex=[];
        var hC=0;
        var compressHours = [];
        var oldHour = -1;
        for (var h in hours) {
          var curr = hours[h];
          if(oldHour!=curr) {
             oldHour = curr;
             hoursByIndex[curr]=hC;
             compressHours[hC]=curr; 
             hC++;
          }
        }


        var columnsByIndex=[];
        var hC=0;
        var compressColumns = [];
        var old = -1;
        for (var h in columns) {
          var curr = columns[h];
          if(old!=curr) {
             old = curr;
             columnsByIndex[curr]=hC;
             compressColumns[hC]=curr; 
             hC++;
          }
        }

        var buffer = [];

        for(var i in  compressHours) {
            for(var j in compressColumns) {
                      var delta  = parseInt(compressHours[parseInt(i+1)]-compressHours[i])/60000;

              buffer[parseInt(j)+parseInt(i*(compressColumns.length))]=mapCell({type:'none', value:delta});
            }
        }
        alert(buffer.length); 

        for(var key in slots) {
          var item = slots[key];        
          if(item.date == currentDay ) {
              var indexForHours = hoursByIndex[item.getTimeBegin];
              var indexForColumn = columnsByIndex[item.room];

              for (k in compressHours) {
                var curr = compressHours[k];
                if (curr >= item.getTimeBegin && curr < item.getTimeEnd) {
                   buffer[parseInt(indexForColumn)+parseInt(k*(compressColumns.length))]=item.cellMap;;
                }
              }

          }
        }

        this.gridBuffer = buffer;
        this.generateDivs();

  }, 

  generateDivs: function () { 

    var buffer = this.gridBuffer; 
    var cols   = 17;

    var container=document.createElement('div');
    var cName = 'container_'+Math.random();
    container.setAttribute('id', cName);
    document.getElementById('container').appendChild(container);
    cssWidth = parseInt(parseInt(document.getElementById(cName).offsetWidth-50)/cols);
    var uniqueClassName = 'inner'+parseInt(Math.random()*1000);

try{ 
    if(buffer.length>cols+1) { 
      grid(buffer, cols+1, cName, uniqueClassName);
    } 
} catch(i) { }
    var proposedHeight=0;
    var these = this;
    $('.'+uniqueClassName).each(function() { 
      var probeElement = charToElement[$(this).attr('id')];

      if(probeElement)  { 

                if(probeElement.type=='event') { 
                    var el = probeElement.value;
                    $(this).html('<div class="innerInnerCell">'+doFilter(el.descricao)+'</div>');
                    $(this).addClass('inner');
                    var delta = probeElement.end-probeElement.begin;

                    var addStyle='';
                    if(probeElement.flag) { 
                        delta=delta+these.chunkHourSpace;
                        addStyle+='background:rgb(0,0,70);color:white';
                        //marcio
                    } 
                    var dateTodayNow = new Date();
                    var thresholdHourNow = dateTodayNow.getHours()*60+dateTodayNow.getMinutes();
                    if(probeElement.flagToday) {
                       if(probeElement.begin<thresholdHourNow) { 
                           addStyle='background:rgb(0,0,200);color:white ! important;';
                        }
                        if(probeElement.end<thresholdHourNow) { 
                           addStyle='background:rgb(0,70,0);color:white';
                        } 
                    }

                    if(el.descricao.indexOf('(*)')>-1) { 
                        addStyle='background:-moz-linear-gradient( -90deg, rgb(150,30,30), rgb(60,30,30), rgb(60,30,30));';
                    } 
 
                    //if(delta==0) { delta=200 } 
                    $(this).attr("style",';width:'+cssWidth+'px;height:'+these.fixScaleHeight(delta)+'px;');
                    $(this).find('div').attr("style",addStyle);
                } 

                if(probeElement.type == 'none') { 
                    var delta = probeElement.value;
                    if(probeElement.flag) { 
                        delta=these.chunkHourSpace;
                    } 
                    $(this).addClass('innerNone');
                    $(this).attr("style",'width:'+cssWidth+'px;height:'+these.fixScaleHeight(delta)+'px;');
                    $(this).html('');
                } 

                if(probeElement.type == 'slices') { 
                    var hour = probeElement.value;
                    var delta = probeElement.height;
                    if(!delta) { delta=these.chunkHourSpace; } 
                    $(this).addClass('innerHour');
                    var localWidth='50px';
                    var hourSliceId = 'hourSlice_'+Math.random(); 
                    var strHH = ''+Math.floor(parseInt(hour)/60);
                    var strMM = ''+parseInt(hour)%60; 
                    if(strMM<10) { strMM+='0'; } 
                    var strProposal = strHH+':'+strMM;

                    if(probeElement.flag) { 
                        strProposal='';
                        delta=these.chunkHourSpace;
                    } 
                    $(this).attr("style",'width:'+localWidth+';height:'+these.fixScaleHeight(delta)+'px;');
                    $(this).html('<div id="'+hourSliceId+'" class="innerInnerHour" style="display:inline-block;padding:0px"><div>'+strProposal+'</div></div>');
                    // This -20 is due to the padding and the 4 is for borders? 
                    var elWidth = document.getElementById(hourSliceId).offsetWidth; 
                } 

                if(probeElement.type == 'header') { 
                    var room = probeElement.value;
                    $(this).addClass('innerHeader');
                    $(this).attr("style",'width:'+cssWidth+'px;');
                    $(this).html('<div class="innerInnerHeader">'+room+'</div>');
                } 

                if(probeElement.type == 'corner') { 
                    var localWidth='50px';
                    var room = probeElement.value;
                    $(this).attr("style",'width:'+localWidth+';');
                    $(this).html('<div class="innerInnerCorner" style="-moz-transform-orifin:0px 0px; -moz-transform:rotate(-90deg)"> </div>');
                } 

      } 
    });
  //window.parent.parent.setHeight('middle',$('getElementById('container')').height());
  },

  init : function (eventData) {
    this.evento=eventData;
  } 

} // end of grade


// returns unicode characters so we have a lot of possible table values

var charToElement = new Array();
var gridCharUsed=32000;

function mapCell(storeElement) { 
  var proposalUTFChar = getUnicodeCharacter(gridCharUsed++);
  charToElement[proposalUTFChar]=storeElement;
  return proposalUTFChar;
} 

// if you want a cloud crazy wrap spans 
// style="float:left

function doFilter(str) { 
    //return str; 
    $('#temp').html(str);
    var str = $('#temp').text();
    var fontSize = INNER_FONT_SIZE;
    var s = str.split(' ');
    htmlMarkup = '';
    var gg = 255;
    for (var i=0;i<s.length;i++) { 
        var el = s[i];
        if(gg>50) { 
           gg-=30;
        } 
        var elMark = '<span style=";color:rgb('+gg+','+gg+','+gg+');margin-right:3px;font-size:'+fontSize+'px">'+el+'</span>';
        fontSize-=1;
        htmlMarkup+=elMark;
    }
    return htmlMarkup; 
} 
/* http://tools.ietf.org/html/rfc5545 
   This will go up to the minutes */

function durationToMinutes(strDuration) { 
    // example P15DT5H0M20S 
  var countMin = 0;
  if(strDuration.indexOf('P') > -1 ) { 
    strDuration=strDuration.split('P')[1];
    if(strDuration.indexOf('D') > -1 ) { 
      var splitter = strDuration.split('D');
      strDuration=splitter[1];
      countMin += parseInt(splitter[0])*60*24;
    } 
    if(strDuration.indexOf('T') > -1) { 
      strDuration=strDuration.split('T')[1];
      if(strDuration.indexOf('H') > -1 ) {
        var splitter=strDuration.split('H');
        strDuration=splitter[1];
        countMin += parseInt(splitter[0])*60;
      }
      if(strDuration.indexOf('M') > -1 ) {
        var splitter=strDuration.split('M');
        strDuration=splitter[1];
        countMin += parseInt(splitter[0]);
      }
    } 
  } 
  return countMin;
} 

function eventsBySortedHours(values) {
   var array_with_keys = [];
   for (var i = 0; i < values.length; i++) {
    alert(value[i]);
     array_with_keys.push({ key: i, value: values[i] });
   }
   array_with_keys.sort(function(a, b) {
    if (parseInt(a.value) < parseInt(b.value)) { return -1; }
    if (parseInt(a.value) > parseInt(b.value)) { return  1; }
    return 0;
   });
   var keys = [];
   for (var i = 0; i < array_with_keys.length; i++) {
     keys.push(array_with_keys[i].key);
   }
   return keys;
}

function getUnicodeCharacter(cp) {
    if (cp >= 0 && cp <= 0xD7FF || cp >= 0xE000 && cp <= 0xFFFF) {
      return String.fromCharCode(cp);
    } else if (cp >= 0x10000 && cp <= 0x10FFFF) {
      cp -= 0x10000;
      var first = ((0xffc00 & cp) >> 10) + 0xD800
      var second = (0x3ff & cp) + 0xDC00;
      return String.fromCharCode(first) + String.fromCharCode(second);
    }
}

function strToMins(item) { 
  var currHour  = item.split(':'); 
  return parseInt(currHour[0])*60+parseInt(currHour[1]);
} 

var dateUtil =  {
 mos: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  getPtBrMonth: function () { 
    var ddd = new Date();
    return this.mos[ddd.getMonth()];
  }
}

INNER_FONT_SIZE = 16;

var util_roomNameReplacer = new Array(); 
util_roomNameReplacer[8]='40T';
util_roomNameReplacer[1]='41A';
util_roomNameReplacer[2]='41B';
util_roomNameReplacer[3]='41C';
util_roomNameReplacer[4]='41D';
util_roomNameReplacer[5]='41E';
util_roomNameReplacer[6]='41F';
util_roomNameReplacer[7]='40A';
util_roomNameReplacer[716]='P09';
util_roomNameReplacer[11]='P11';
util_roomNameReplacer[701]='701';
util_roomNameReplacer[702]='702';
util_roomNameReplacer[715]='710';
util_roomNameReplacer[723]='713';
util_roomNameReplacer[714]='714';
util_roomNameReplacer[722]='715';
util_roomNameReplacer[717]='F12';
util_roomNameReplacer[718]='F13';

var util_columnOrderReference = new Array();
util_columnOrderReference[0]='40T';
util_columnOrderReference[1]='41A';
util_columnOrderReference[2]='41B';
util_columnOrderReference[3]='41C';
util_columnOrderReference[4]='41D';
util_columnOrderReference[5]='41E';
util_columnOrderReference[6]='41F';
util_columnOrderReference[7]='40A';
util_columnOrderReference[8]='P09';
util_columnOrderReference[9]='P11';
util_columnOrderReference[10]='701';
util_columnOrderReference[11]='702';
util_columnOrderReference[12]='710';
util_columnOrderReference[13]='713';
util_columnOrderReference[14]='714';
util_columnOrderReference[15]='715';
util_columnOrderReference[16]='F12';
util_columnOrderReference[17]='F13';





