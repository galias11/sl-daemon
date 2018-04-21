const { fork } = require('child_process');
const fs = require('fs');
const ps = require('ps-node');

const START = 'START';
const STOP = 'STOP';
const STATUS = 'STATUS';
const RESTART = 'RESTART';
const running = 'R'
const stopped = 'S';
const pidFile = 'pidFile.dat';
const logFile = 'logFile.dat';

//Bash colors
const requestFormat = '\x1b[33m\x1b[1m';
const infoFormat = '\x1b[36m\x1b[1m';
const errorFormat = '\x1b[31m\x1b[1m';
const successFormat = '\x1b[32m\x1b[1m';
const formatClose = '\x1b[0m';

//Messages


/*
Checks daemon status to decide wether it is running or not.
To achieve this, pidFile is checked.
If file doesn't exist or the saved pid is not running it returns "stopeed"
If file exist and the saved pid is running it return "running"
*/
function checkStatus(callback) {
  fs.readFile(pidFile, 'utf-8', (err, data) => {
    if(err) {
      callback(stopped);
    } else {
      ps.lookup({ pid: parseInt(data) }, (err, resultList) => {
        if(err) {
          console.log(err);
        }
        if(resultList.length) {
          callback(running, resultList[0].pid);
        } else {
          callback(stopped);
        }
      })
    }
  })
}

/*
Starts daemon (If it's not already running)
This process forks the actual process creating a child process.
After that it keeps listening for its child to confirm its PID.
When pid is received, pidfile is written with child process pid and the current
process is terminated.
*/
function daemonStart() {
  checkStatus((status) => {
    if(status === stopped) {
      const forked = fork('sl-daemon-loop.js');
      forked.on('message', (data) => {
        if(data.start) {
          console.log(`${infoFormat}Started sl-daemon with PID:${formatClose} `, data.start);
          fs.writeFile(pidFile, data.start, function(err) {
            if(err) {
              return console.log(err);
            }
            process.exit();
          })
        }
      });
    } else {
      console.log(`${errorFormat}sl-daemon is already running.${formatClose}`);
    }
  });
}

/*
If daemon is running, the daemon process is stopped
*/
function daemonStop() {
  checkStatus((status, pid) => {
    if(status === running) {
      process.kill(pid);
      console.log(`${infoFormat}sl-daemon has been stopped.${formatClose}`);
    } else {
      console.log(`${errorFormat}sl-daemon is not running.${formatClose}`);
    }
  });
}

/*
If the daemon is running, it is stopped and then restarted again.
Otherwise, the daemon is started.
*/
function daemonRestart() {
  checkStatus((status, pid) => {
    if(status === running) {
      daemonStop();
      daemonStart();
    } else {
      daemonStart();
    }
  })
}

/*
Checks the daemon status and prints through stdout
*/
function daemonStatus() {
  checkStatus((status, pid) => {
    switch(status){
      case running:
        console.log(`${infoFormat}sl-daemon is running with pid${formatClose}: ${pid}`);
        break;
      case stopped:
        console.log(`${errorFormat}sl-daemon is stopped...${formatClose}`);
        break;
      default:
        break;
    }
    process.exit();
  })
}


/*
Decides what command will be executed by checking the call arguments
*/
const option = process.argv[2].toUpperCase();

switch(option) {
  case START:
    daemonStart();
    break;
  case STOP:
    daemonStop();
    break;
  case STATUS:
    daemonStatus();
    break;
  case RESTART:
    daemonRestart();
    break;
  default:
    console.log(`${errorFormat}Invalid command${formatClose} -- USAGE: node sl-daemon-controller.js {START | STOP | STATUS | RESTART}`);
    break;
}
