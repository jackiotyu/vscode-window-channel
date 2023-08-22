import * as vscode from 'vscode';
import { registerChannel } from './socket';
import { ChannelClient } from './client';
import { CHANNEL_ACTIVE, ChannelMessage } from './constants';
import output from './output';

export async function activate(context: vscode.ExtensionContext) {
    console.log('channel init start');
    try {
        await registerChannel();
        // process.kill()

        const client = new ChannelClient();
        let serverPid: number;
        client.on('message', (data) => {
            output.appendLine('receive: ' + data.toString());
            let { pid, data: msg }: ChannelMessage = JSON.parse(data);
            if(msg === 'server-pid') {
                serverPid = pid;
            }
            if(msg === 'close' && pid === process.pid) {
                client.close();
            }
            if(msg === 'server-close') {
                serverPid && process.kill(serverPid);
                output.appendLine('close server');
            }
        });
        client.on("error", error => {
            console.log('inner error', error);
            vscode.window.showErrorMessage(String(error));
        });
        context.subscriptions.push(
            vscode.commands.registerCommand('window-channel.send', async () => {
                let message = await vscode.window.showInputBox({
                    placeHolder: 'input message to send',
                    title: 'send window channel message',
                });
                if (!message) {
                    return;
                }
                client.send({
                    pid: process.pid,
                    data: message,
                });
            }),
            vscode.commands.registerCommand('window-channel.reset', () => {
                context.globalState.update(CHANNEL_ACTIVE, false);
            }),
            {
                dispose() {
                    client.send({ pid: process.pid, data: 'close' });
                    output.appendLine('close pid: ' + process.pid);
                }
            }
        );
    } catch (error) {
        console.log(error);
    }
    console.log('channel init end');
}

export function deactivate() {}
