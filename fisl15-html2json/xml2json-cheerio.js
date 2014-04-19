'use strict';

//modules
var nom = require('nom'),
    cheerio = require('nom/node_modules/cheerio'),
    stdio = require('stdio'),
    fs = require('fs');

//config
var HTML_URL = 'http://papers.softwarelivre.org/papers_ng/public/fast_grid?event_id=4',
    CACHE_FILE = 'cache/fastgrid.xml',
    ONLINE = false;

//command line options
var options = stdio.getopt({
    'output': {key: 'o', description: 'Output file to write with the resulting JSON', args: 1},
    'help': {key: 'h', description: 'Help'}
});
if (options.help){
    options.printHelp();
    process.exit(0);
}

var schedule = {};

function finished(){
    if (options.output){
        console.log('Writing ' + options.output + '…');
        fs.writeFileSync(options.output, JSON.stringify(schedule, null, '  '));
    }else{
        console.log(JSON.stringify(schedule));
    }
}


var onURLLoaded = function(err, $) {
    console.log('XML loaded');
    var slotElements = $('slot'),
        peopleElements = $('person'),
        roomElements = $('room'),
        areaElements = $('area'),
        zoneElements = $('zone'),
        sessions = [],
        people = {},
        presenters = {},
        rooms = {},
        areas = {},
        zones = {};

    //zones
    zoneElements.each(function(){
        var zone = $(this),
            zoneId = zone.attr('id'),
            name = zone.find('name').first().text().trim();
        zones[zoneId] = {
            name: name
        };
    });

    //areas
    areaElements.each(function(){
        var area = $(this),
            areaId = area.attr('id'),
            name = area.find('name').first().text().trim(),
            description = area.find('descr').first().text().trim(),
            zoneId = area.find('zone').first().text().trim();
        areas[areaId] = {
            name: name,
            description: description,
            zoneId: zoneId
        };
    });

    //rooms
    roomElements.each(function(){
        var room = $(this),
            roomId = room.attr('id'),
            name = room.find('name').first().text().trim(),
            capacity = room.find('capacity').first().text().trim();
            // translation = room.find('translation').first().text().trim(),
            // position = room.find('position').first().text().trim(),
            // venue = room.find('venue').first().text().trim();
        rooms[roomId] = {
            name: name,
            capacity: capacity
        };
    });

    //people
    peopleElements.each(function(){
        var person = $(this),
            personId = person.attr('id'),
            name = person.attr('name'),
            presentersId = person.attr('candidate'),
            isMain = person.attr('main'),
            presenter = {};
        people[personId] = {
            name: name
        };
        presenter.id = personId;
        presenter.isMain = isMain;
        if (presenters[presentersId] === undefined){
            presenters[presentersId] = [];
        }
        presenters[presentersId].push(presenter);
    });

    //sessions
    slotElements.each(function(){
        var slot = $(this),
            slotId  = slot.attr('id'),
            title = slot.attr('title'),
            abstract = slot.attr('abstract'),
            authorId = slot.attr('candidate'),
            startDay = slot.attr('date'),
            startHour = slot.attr('hour'),
            startMinute = slot.attr('minute'),
            durationColspan = slot.attr('colspan'),
            level = slot.attr('level'),
            roomId = slot.attr('room'),
            zoneId = slot.attr('zone'),
            areaId = slot.attr('area');

        sessions.push({
            id: slotId,
            title: title,
            abstract: abstract,
            presentersId: authorId,
            level: level,
            start: startDay +
                    'T' +
                    startHour +
                    ':' +
                    startMinute +
                    ':00-03:00',
            duration: durationColspan * 20, //minutes
            roomId: roomId,
            zoneId: zoneId,
            areaId: areaId
        });

        sessions.sort(function(a, b){
            return a.start > b.start ? 1 : -1;
        });
    });


    schedule = {
        sessions: sessions,
        areas: areas,
        rooms: rooms,
        presenters: presenters,
        people: people
    };
    // console.log(JSON.stringify(zones, null, '  '));
    // console.log(JSON.stringify(areas, null, '  '));
    console.log(areaElements.length);
    // console.log(JSON.stringify(rooms, null, '  '));
    // console.log(roomElements.length);
    // console.log(JSON.stringify(presenters, null, '  '));
    // console.log(JSON.stringify(people, null, '  '));
    // console.log(JSON.stringify(sessions, null, '  '));
    // console.log(slotElements.length, 'sessions');
    finished();

};

//main
console.log(
    'Processing '+
    (ONLINE ? 'online' : 'cached') +
    ' xml files…'
);

if (ONLINE){
    nom(HTML_URL, onURLLoaded);
} else{
    var filecontents = fs.readFileSync(CACHE_FILE);
    var $ = cheerio.load(filecontents, {
            xmlMode: true
    });
    onURLLoaded(null, $);
}
