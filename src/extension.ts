import * as vscode from 'vscode';
import { registerChannel } from './socket';
import { ChannelClient } from './client';
import { CHANNEL_ACTIVE } from './constants';
import outputChannel from './output';

export function activate(context: vscode.ExtensionContext) {
    registerChannel(context);
    const client = new ChannelClient();
    client.on('message', (data) => {
        outputChannel.appendLine('receive: ' + data.toString());
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
    );
}

export function deactivate() {}
