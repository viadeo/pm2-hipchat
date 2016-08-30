'use strict';

var os = require('os');
var pm2 = require('pm2');
var pmx = require('pmx');
var hipchat = require('node-hipchat');

// Get the configuration from PM2
var conf = pmx.initModule();

// Set the events that will trigger the color red
var redEvents = ['stop', 'exit', 'delete', 'error', 'kill', 'exception', 'restart overlimit', 'suppressed'];
var greenEvents = ['online'];

// create the message queue
var messages = [];

var HC = new hipchat(conf.api_key);

// Function to send event to Hipchat
function send(message) {
  var name = message.name;
  var event = message.event;
  var description = message.description;
  // If a api_key is not set, we do not want to continue and nofify the user that it needs to be set
  if (!conf.api_key) {
    return console.error('There is no hipchat API key set, please set the API key: \'pm2 set pm2-hipchat:api_key YOUR_API_KEY\'');
  }
  if (!conf.room) {
    return console.error('There is no hipchat room set, please set the room key: \'pm2 set pm2-hipchat:room ROOM_ID\'');
  }
  // The default color for events should be yellow
  var color = 'yellow';
  // If the event is listed in redEvents, set the color to red
  if (redEvents.indexOf(event) > -1) {
    color = 'red';
  }
  // If the event is listed in greenEvents, set the color to green
  if (greenEvents.indexOf(event) > -1) {
    color = 'green';
  }
  // Options for the post request
  var options = {
    room: conf.room,
    from: 'MrRobot',
    message: description,
    color: color,
    notify: !!conf.notify
  };
  // Finally, make the post message to the Hipchat
  HC.postMessage(options, function(data) {
    // Message has been sent!
  });
}
// Function to process the message queue
function processQueue() {
  // If we have a message in the message queue, removed it from the queue and send it to HipChat
  if (messages.length > 0) {
    send(messages.shift());
  }
  // Wait 1 seconds and then process the next message in the queue
  setTimeout(function() {
    processQueue();
  }, 1000);
}

// Start listening on the PM2 BUS
pm2.launchBus(function(err, bus) {
  // Listen for process logs
  if (conf.log) {
    bus.on('log:out', function(data) {
      if (data.process.name !== 'pm2-hipchat') {
        messages.push({
          name: data.process.name,
          event: 'log',
          description: JSON.stringify(data.data)
        });
      }
    });
  }
  // Listen for process errors
  if (conf.error) {
    bus.on('log:err', function(data) {
      if (data.process.name !== 'pm2-hipchat') {
        messages.push({
          name: data.process.name,
          event: 'error',
          description: JSON.stringify(data.data)
        });
      }
    });
  }
  // Listen for PM2 kill
  if (conf.kill) {
    bus.on('pm2:kill', function(data) {
      messages.push({
        name: 'PM2',
        event: 'kill',
        description: data.msg
      });
    });
  }
  // Listen for process exceptions
  if (conf.exception) {
    bus.on('process:exception', function(data) {
      if (data.process.name !== 'pm2-hipchat') {
        messages.push({
          name: data.process.name,
          event: 'exception',
          description:  '<strong>Hostname:</strong> ' + os.hostname() +
                        '<br/><strong>Environnement:</strong> ' + process.env.NODE_ENV +
                        '<br/><strong>Process:</strong> ' + data.process.name + '-' + data.process.pm_id  +
                        '<br/><strong>Message:</strong><br/>The following event has occured on the PM2 process ' + data.process.name + ': <strong>exception</strong>' +
                        '<br/><strong>Exception:</strong><br/>' + JSON.stringify(data.data)
        });
      }
    });
  }
  // Listen for PM2 events
  bus.on('process:event', function(data) {
    if (conf[data.event]) {
      if (data.process.name !== 'pm2-hipchat') {
        messages.push({
          name: data.process.name + '-' + data.process.pm_id,
          event: data.event,
          description:  '<strong>Hostname:</strong> ' + os.hostname() +
                        '<br/><strong>Environnement:</strong> ' + process.env.NODE_ENV +
                        '<br/><strong>Process:</strong> ' + data.process.name + '-' + data.process.pm_id  +
                        '<br/><strong>Message:</strong><br/>The following event has occured on the PM2 process ' + data.process.name + ': <strong>' + data.event + '</strong>'
        });
      }
    }
  });
  // Start the message processing
  processQueue();
});
