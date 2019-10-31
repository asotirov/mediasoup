import EnhancedEventEmitter from './EnhancedEventEmitter';
import Transport, { TransportListenIp, TransportTuple, TransportSctpParameters, TransportNumSctpStreams, SctpState } from './Transport';
import Consumer, { ConsumerOptions } from './Consumer';
export interface PipeTransportOptions {
    /**
     * Listening IP address.
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
    appData?: any;
}
export interface PipeTransportStat {
    type: string;
    transportId: string;
    timestamp: number;
    sctpState?: SctpState;
    bytesReceived: number;
    recvBitrate: number;
    bytesSent: number;
    sendBitrate: number;
    rtpBytesReceived: number;
    rtpRecvBitrate: number;
    rtpBytesSent: number;
    rtpSendBitrate: number;
    rtxBytesReceived: number;
    rtxRecvBitrate: number;
    rtxBytesSent: number;
    rtxSendBitrate: number;
    probationBytesReceived: number;
    probationRecvBitrate: number;
    probationBytesSent: number;
    probationSendBitrate: number;
    availableOutgoingBitrate?: number;
    availableIncomingBitrate?: number;
    maxIncomingBitrate?: number;
    tuple: TransportTuple;
}
export default class PipeTransport extends Transport {
    /**
     * @private
     * @emits {sctpState: SctpState} sctpstatechange
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
     * @emits {sctpState: SctpState} sctpstatechange
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
     * Get PipeTransport stats.
     *
     * @override
     */
    getStats(): Promise<PipeTransportStat[]>;
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