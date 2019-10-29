import EnhancedEventEmitter from './EnhancedEventEmitter';
import Transport, { TransportListenIp, TransportTuple, TransportSctpParameters, TransportNumSctpStreams, SctpState } from './Transport';
import Consumer, { ConsumerOptions } from './Consumer';
export interface PipeTransportOptions {
    /**
     * Listening IP address
     */
    listenIp: TransportListenIp | string;
    /**
     * Create a SCTP association. Default false.
     */
    enableSctp?: boolean;
    /**
     * SCTP streams number.
     */
    numSctpStreams?: TransportNumSctpStreams;
    /**
     * Maximum size of data that can be passed to DataProducer's send() method.
     * Default 262144.
     */
    maxSctpMessageSize?: number;
    /**
     * Custom application data.
     */
    appData?: object;
}
export default class PipeTransport extends Transport {
    /**
     * @private
     */
    constructor(params: any);
    /**
     * Transport tuple.
     */
    readonly tuple: TransportTuple;
    /**
     * SCTP parameters.
     */
    readonly sctpParameters: TransportSctpParameters | undefined;
    /**
     * SCTP state.
     */
    readonly sctpState: SctpState;
    /**
     * Observer.
     *
     * @override
     * @emits close
     * @emits {producer: Producer} newproducer
     * @emits {consumer: Consumer} newconsumer
     * @emits {producer: DataProducer} newdataproducer
     * @emits {consumer: DataConsumer} newdataconsumer
     * @emits {sctpState: string} sctpstatechange
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the PlainRtpTransport.
     *
     * @override
     */
    close(): void;
    /**
     * Router was closed.
     *
     * @private
     * @override
     */
    routerClosed(): void;
    /**
     * Provide the PipeTransport remote parameters.
     *
     * @override
     */
    connect({ ip, port }: {
        ip: string;
        port: number;
    }): Promise<void>;
    /**
     * Create a pipe Consumer.
     *
     * @override
     */
    consume({ producerId, appData }: ConsumerOptions): Promise<Consumer>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=PipeTransport.d.ts.map