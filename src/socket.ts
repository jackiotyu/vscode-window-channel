import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { PIPE_FILE, CHANNEL_ACTIVE, ChannelMessage } from './constants';
import { exec } from 'child_process';
import output from './output';

export function registerChannel() {
    let fileExist = false;
    try {
        if (fs.statSync(PIPE_FILE)) {
            fileExist = true;
            return Promise.resolve();
        }
    } catch {}
    if (fileExist) {
        return Promise.resolve();
    }

    const scriptPath = path.resolve(__dirname, 'socketSingleton.js');
    return new Promise((resolve, reject) => {
        let childProcess = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
            if(error) {
                reject(error);
                return output.appendLine('server process error: ' + error.message);
            };
            output.appendLine('server stdout:' + stdout);
            output.appendLine('server stderr:' + stderr);
            resolve(stdout);
        });
        childProcess.stdout?.pipe(process.stdout);
        childProcess.stderr?.pipe(process.stderr);
        setTimeout(resolve, 300);
    });

}
