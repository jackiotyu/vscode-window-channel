export const PIPE_FILE =
    process.platform === 'win32' ? '\\\\.\\pipe\\vscode-ext-window-channel-1' : '/tmp/vscode-ext-window-channel.sock';

export const CHANNEL_ACTIVE = 'channel-active-2';

export interface ChannelMessage {
    pid: number;
    data: any;
}