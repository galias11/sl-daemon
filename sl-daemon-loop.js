const net = require('net');
const { exec } = require('child_process');
const runInterval = 10;
const notifyTitle = 'sl-daemon received a message'
const port = 1337;
const host = '127.0.0.1';

//Creates a TCP server to listen a port
const server = net.createServer(socket => {
	socket.on('data', (data) => {
		const execString = `notify-send -t 20 \"${notifyTitle}\" \"${data.toString().substring(0, data.toString().length - 2)}\"`;
		exec(execString);
	});
});

//Makes the TCP server to listen 127.0.0.1:1337
server.listen(port, host);

//When the TCP server is completely setup sends daemon pid to parent.
process.send({start: process.pid})
