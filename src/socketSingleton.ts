import * as net from 'net';
import * as fs from 'fs';

import { PIPE_FILE, ChannelMessage } from './constants';

let connections: net.Socket[] = [];
let channelPids = [process.pid];

function removeSocket(connection: net.Socket) {
    let index = connections.findIndex((i) => i === connection);
    connections.splice(index, 1);
    console.log(`disconnect ${index}, remain ${connections.length}`);
}
process.stdout.write('start');
const server = net.createServer((connection) => {
    connections.push(connection);
    console.log(`socket connected. total ${connections.length}`);
    connection.on('data', (data) => {
        let message: ChannelMessage | void = undefined;
        try {
            message = JSON.parse(data.toString());
        } catch {}
        if (!message) {
            return;
        }
        console.log(`server receive: ${message.pid}, data: ${message.data}`);
        console.log(`sockets ${connections.length}`);

        if (message.data === 'close') {
            if (connections.length === 1) {
                connection.write(JSON.stringify({ pid: message.pid, data: 'server-close' }));
            }
            connection.write(JSON.stringify({ pid: message.pid, data: 'close' }));
        } else {
            // 广播事件
            connections.forEach((socket) => {
                try {
                    socket.write(data);
                } catch {}
            });
        }
        // console.log(`send: ${data}`);
        console.log(`channelPids: ${channelPids.toString()}`);
    });
    connection.once('error', (err) => {
        console.error(err.message);
        removeSocket(connection);
    });
    connection.once('close', () => {
        removeSocket(connection);
    });
    const pidMsg: ChannelMessage = { pid: process.pid, data: 'server-pid' };
    process.nextTick(() => {
        connection.write(JSON.stringify(pidMsg));
    });
});
server.listen(PIPE_FILE);
process.stdout.write(server.address()?.toString() || '');

process.on('beforeExit', () => {
    try {
        fs.unlinkSync(PIPE_FILE);
    } catch (error) {}
    try {
        server.close();
    } catch {}
});
