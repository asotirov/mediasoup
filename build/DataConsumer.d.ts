import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { SctpStreamParameters } from './types';
export interface DataConsumerOptions {
    /**
     * The id of the DataProducer to consume.
     */
    dataProducerId: string;
    /**
     * Custom application data.
     */
    appData?: any;
}
export interface DataConsumerStat {
    type: string;
    timestamp: number;
    label: string;
    protocol: string;
    messagesSent: number;
    bytesSent: number;
}
export default class DataConsumer extends EnhancedEventEmitter {
    private _internal;
    private _data;
    private _channel;
    private _closed;
    private _appData?;
    private _observer;
    /**
     * @private
     * @emits transportclose
     * @emits dataproducerclose
     * @emits @close
     * @emits @dataproducerclose
     */
    constructor({ internal, data, channel, appData }: {
        internal: any;
        data: any;
        channel: Channel;
        appData: object;
    });
    /**
     * DataConsumer id.
     */
    readonly id: string;
    /**
     * Associated DataProducer id.
     */
    readonly dataProducerId: string;
    /**
     * Whether the DataConsumer is closed.
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
     * Close the DataConsumer.
     */
    close(): void;
    /**
     * Transport was closed.
     *
     * @private
     */
    transportClosed(): void;
    /**
     * Dump DataConsumer.
     */
    dump(): Promise<any>;
    /**
     * Get DataConsumer stats.
     */
    getStats(): Promise<DataConsumerStat[]>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=DataConsumer.d.ts.map