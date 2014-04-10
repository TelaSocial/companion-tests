//modules
var nom = require('nom'),
    cheerio = require('nom/node_modules/cheerio'),
    zpad = require('zpad'),
    stdio = require('stdio'),
    fs = require('fs');

//config
var HTML_URL = "http://papers.softwarelivre.org/papers_ng/public/new_grid?day=7".slice(0,-1),
    CACHE_PATH = 'cache/newgrid-',
    DAYS = [7,8,9,10],
    // DAYS = [7],
    // ONLINE = false;
    ONLINE = true;

//command line options
var options = stdio.getopt({
    'output': {key: 'o', description: 'Output file to write with the resulting JSON', args: 1},
    'help': {key: 'h', description: 'Help'}
});
if (options.help){
    options.printHelp();
    process.exit(0);
}

//global vars
var schedule = {
        days: {}
    },
    remainingDays = DAYS.length;

//helpers
function finished(){
    if (options.output){
        console.log('Writing ' + options.output + '…');
        fs.writeFileSync(options.output, JSON.stringify(schedule, null, '  '));
    }else{
        console.log(JSON.stringify(schedule));
    }
}
function getColumn(element){
    var className = element.attr('class'),
        columnMatches = className.match(/grid-col-([^\s]*)/),
        column = columnMatches ? Number(columnMatches[1]) : -1;
    return column;
}
function URLLoaded(day, err, $) {
    console.log(
        'Day '+
        day +
        ' loaded.'
    );

    var hourElements = $('#hours .hour'),
        roomLineElements = $('#rooms .room-line'),
        roomHeaderElements = roomLineElements.find('.room-header'),
        hours = {},
        rooms = [],
        sessions = [];
    hourElements.each(function(){
        var column = getColumn(this),
            label = this.text().trim(); // '9:00'
        hours['col-' + column] = {
            label: label
        };
    });
    roomHeaderElements.each(function(){
        rooms.push({
            name: this.find('.name').first().text().trim(),
            chairs: this.find('.chairs').first().text().trim()
        });
    });
    roomLineElements.each(function(index){
        var slots = this.find('.slot-list .slot'),
            room = rooms[index];
        slots.each(function(){
            var className = this.attr('class'),
                //slot empty grid-col-11 grid-width-60
                column = getColumn(this),
                widthMatches = className.match(/grid-width-([^\s]*)/),
                zoneMatches = className.match(/zone-([^\s]*)/),
                width = widthMatches ? Number(widthMatches[1]) : -1,
                duration = width / 60, // hours
                zone = zoneMatches ? Number(zoneMatches[1]) : -1,
                area = this.find('.area').first().text().trim(),
                title = this.find('.title').first().text().trim(),
                author = this.find('.author').first().text().trim(),
                isEmpty = this.hasClass('empty');
            if (!isEmpty){
                sessions.push({
                    title: title,
                    author: author,
                    area: area,
                    day: day,
                    start: (column !== -1) ? hours['col-' + column].label : '',
                    zone: zone,
                    duration: duration,
                    room: room
                });
            }
        });
    });
    schedule.days['day-' + day] = sessions;
    remainingDays -= 1;
    if (remainingDays === 0){
        finished();
    }
}


//main
console.log(
    'Processing '+
    (ONLINE ? 'online' : 'cached') +
    ' html files…'
);
DAYS.forEach(function getURL(day){
    if (ONLINE){
        nom(HTML_URL + day, URLLoaded.bind(null, day));
    } else{
        URLLoaded(
            day,
            null,
            cheerio.load(
                fs.readFileSync(CACHE_PATH + zpad(day) + '.html')
            )
        );
    }
});
