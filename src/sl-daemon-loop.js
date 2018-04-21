const net = require('net');
const { exec } = require('child_process');
const fs = require('fs');
const runInterval = 10;
const notifyTitle = 'sl-daemon received a message'
const port = 1337;
const host = '127.0.0.1';
const logFile = 'logFile.dat';

/*
Writes important events into the daemons log file
*/
function log(eventData) {
  const dateString = new Date().toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '');
  const logEntry = `${dateString}: ${eventData}\n`;
  fs.appendFileSync(logFile, logEntry);
}

/*
If for some reason the parent aborts the daemon starting process, this process
will be terminated.
*/
process.on('message', (data) => {
	if(data.terminate) {
		process.exit();
	}
})


//Creates a TCP server to listen a port
const server = net.createServer(socket => {
	socket.on('data', (data) => {
		const execString = `notify-send -t 20 \"${notifyTitle}\" \"${data.toString().substring(0, data.toString().length - 2)}\"`;
		exec(execString);
		log("received message.");
	});
});

//Makes the TCP server to listen 127.0.0.1:1337
server.listen(port);

//When the TCP server is completely setup sends daemon pid to parent.
process.send({start: process.pid})
