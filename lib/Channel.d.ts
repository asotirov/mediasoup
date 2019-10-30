import EnhancedEventEmitter from './EnhancedEventEmitter';
export default class Channel extends EnhancedEventEmitter {
    private _workerLogger;
    private _closed;
    private _producerSocket;
    private _consumerSocket;
    private _nextId;
    private _sents;
    private _recvBuffer?;
    /**
     * @private
     */
    constructor({ producerSocket, consumerSocket, pid }: {
        producerSocket: any;
        consumerSocket: any;
        pid: number;
    });
    /**
     * @private
     */
    close(): void;
    /**
     * @private
     */
    request(method: string, internal?: object, data?: any): Promise<any>;
    private _processMessage;
}
//# sourceMappingURL=Channel.d.ts.map