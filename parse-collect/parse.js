    $(document).ready(function () { 

        var slots = jsonall[0].slot; 

        var dayRange = "2013-07-04";
        
        var eventsByHours = [];
        var hours = [];
        for(var key in slots) {
          var item = slots[key];        
          if(item.date == dayRange) {

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
             }
             eventsByHours[key].push(item);
             hours.push(key);
 
             var key=""+item.getTimeEnd;
              if(!eventsByHours[key]) {
                eventsByHours[key] = [];
              }
              eventsByHours[key].push(item);
              hours.push(key);
 
           }
        };

        //console.log(JSON.stringify(hours));
        hours.sort();

        for( item in hours) {
           var a = new Date();
           a.setTime(hours[item]);
           var ref = 'inner'+parseInt(Math.random()*1000);
           $('#container').append('<div>'+a.getHours()+':'+a.getMinutes()+'<div id="'+ref+'"></div></div>');
           var hourCurr = hours[item];
           for(key in eventsByHours[hourCurr]) {
              var currEl = eventsByHours[hourCurr][key];
              $("#"+ref).append("<p>"+currEl.title+"</p>");
           }
        }

     }); 

