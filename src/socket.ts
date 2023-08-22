import * as net from 'net';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { PIPE_FILE, CHANNEL_ACTIVE, ChannelMessage } from './constants';
import output from './output';

export function registerChannel(context: vscode.ExtensionContext) {
    let existChannel = context.globalState.get(CHANNEL_ACTIVE);
    if (existChannel) {
        return;
    }
    try {
        if(fs.statSync(PIPE_FILE).isFile()) {return;}
    } catch {}
    // try {
    //     fs.unlinkSync(PIPE_FILE);
    // } catch (error) {}

    let channelPids = [process.pid];
    let connections: net.Socket[] = [];
    const server = net.createServer((connection) => {
        console.log('socket connected.');
        connection.on('close', () => console.log('disconnected.'));
        connection.on('data', (data) => {
            let message: ChannelMessage | void = undefined;
            try {
                message = JSON.parse(data.toString());
            } catch {}

            if (!message) {
                return;
            }
            output.appendLine(`server receive: ${message.pid}, data: ${message.data}`);
            // connection.write(data);
            // 广播事件
            output.appendLine(`sockets ${connections.length}`);
            connections.forEach(socket => {
                try {
                    socket.write(data);
                } catch {}
            });
            // console.log(`send: ${data}`);
            output.appendLine(`channelPids: ${channelPids.toString()}`);
        });
        connection.on('error', (err) => console.error(err.message));
    });
    server.on('connection', (socket) => {
        connections.push(socket);
    });
    server.listen(PIPE_FILE);
    console.log(server.address(), 'address');
    context.globalState.update(CHANNEL_ACTIVE, true);
    context.subscriptions.push({
        dispose() {
            server.close();
            context.globalState.update(CHANNEL_ACTIVE, false);
            try {
                fs.unlinkSync(PIPE_FILE);
            } catch (error) {}
        },
    });
}
