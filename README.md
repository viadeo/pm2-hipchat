# pm2-hipchat

This module started as fork of pm2-slack module for sending events & logs from your PM2 processes to HipChat.

## Install

To install and setup pm2-hipchat, run the following commands:

```
pm2 install pm2-hipchat
pm2 set pm2-hipchat:api_key YOUR_API_KEY
pm2 set pm2-hipchat:room ROOM_ID
```

## Configure

The following events can be subscribed to:

- log - All standard out logs from your processes. Default: false
- error - All error logs from your processes. Default: true
- kill - Event fired when PM2 is killed. Default: true
- exception - Any exceptions from your processes. Default: true
- restart - Event fired when a process is restarted. Default: false
- delete - Event fired when a process is removed from PM2. Default: false
- stop - Event fired when a process is stopped. Default: false
- restart overlimit - Event fired when a process is reaches the max amount of times it can restart. Default: true
- exit - Event fired when a process is exited. Default: false
- start -  Event fired when a process is started. Default: false
- online - Event fired when a process is online. Default: false

You can simply turn these on and off by setting them to true or false using the PM2 set command.

```
pm2 set pm2-hipchat:log true
pm2 set pm2-hipchat:error false
```

Turn on visual notifications:

```
pm2 set pm2-hipchat:notify true
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.

## Release History

- 0.0.1 Initial Release
