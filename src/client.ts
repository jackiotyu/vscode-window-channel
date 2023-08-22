import * as net from 'net';
import { EventEmitter } from 'events';
import { PIPE_FILE, ChannelMessage } from './constants';

interface IChannelClient {
    on(eventName: 'message', listener: (data: Buffer) => void): this;
    once(eventName: 'message', listener: (data: Buffer) => void): this;
}

export class ChannelClient extends EventEmitter implements IChannelClient {
    private client?: net.Socket;
    constructor() {
        super({
            captureRejections: true,
        });
        this.setMaxListeners(10);
        try {
            this.client = net.connect(PIPE_FILE);
            this.client.on('connect', () => {
                console.log('connected.');
                this.emit('connect');
            });
            this.client.on('end', () => {
                console.log('disconnected');
                this.emit('disconnect');
            });
            this.client.on('data', (data) => {
                this.emit('message', data);
            });
            this.client.on('error', (err) => {
                console.error(err);
                this.emit('error', err);
            });
            this.client.on('close', (hadError) => {
                this.emit('close', hadError);
            });
        } catch (error) {
            this.emit('error', error);
        }
    }
    send(msg: ChannelMessage) {
        this.client?.write(JSON.stringify(msg));
    }
    close() {
        this.client?.destroy();
    }
}
