import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { SctpStreamParameters } from './SctpParameters';
export interface DataProducerOptions {
    /**
     * DataProducer id (just for Router.pipeToRouter() method).
     */
    id?: string;
    /**
     * SCTP parameters defining how the endpoint is sending the data.
     */
    sctpStreamParameters: SctpStreamParameters;
    /**
     * A label which can be used to distinguish this DataChannel from others.
     */
    label?: string;
    /**
     * Name of the sub-protocol used by this DataChannel.
     */
    protocol?: string;
    /**
     * Custom application data.
     */
    appData?: any;
}
export interface DataProducerStat {
    type: string;
    timestamp: number;
    label: string;
    protocol: string;
    messagesReceived: number;
    bytesReceived: number;
}
export default class DataProducer extends EnhancedEventEmitter {
    private _internal;
    private _data;
    private _channel;
    private _closed;
    private _appData?;
    private _observer;
    /**
     * @private
     * @emits transportclose
     * @emits @close
     */
    constructor({ internal, data, channel, appData }: {
        internal: any;
        data: any;
        channel: Channel;
        appData: object;
    });
    /**
     * DataProducer id.
     */
    readonly id: string;
    /**
     * Whether the DataProducer is closed.
     */
    readonly closed: boolean;
    /**
     * SCTP stream parameters.
     */
    readonly sctpStreamParameters: SctpStreamParameters;
    /**
     * DataChannel label.
     */
    readonly label: string;
    /**
     * DataChannel protocol.
     */
    readonly protocol: string;
    /**
     * App custom data.
     */
    /**
    * Invalid setter.
    */
    appData: object;
    /**
     * Observer.
     *
     * @emits close
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the DataProducer.
     */
    close(): void;
    /**
     * Transport was closed.
     *
     * @private
     */
    transportClosed(): void;
    /**
     * Dump DataProducer.
     */
    dump(): Promise<any>;
    /**
     * Get DataProducer stats.
     */
    getStats(): Promise<DataProducerStat[]>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=DataProducer.d.ts.map