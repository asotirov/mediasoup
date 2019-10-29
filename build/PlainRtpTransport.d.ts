import EnhancedEventEmitter from './EnhancedEventEmitter';
import Transport, { TransportListenIp, TransportTuple, TransportSctpParameters, TransportNumSctpStreams, SctpState } from './Transport';
import Consumer, { ConsumerOptions } from './Consumer';
export interface PlainRtpTransportOptions {
    /**
     * Listening IP address
     */
    listenIp: TransportListenIp | string;
    /**
     * Use RTCP-mux (RTP and RTCP in the same port). Default true.
     */
    rtcpMux?: boolean;
    /**
     * Whether remote IP:port should be auto-detected based on first RTP/RTCP
     * packet received. If enabled, connect() method must not be called. This
     * option is ignored if multiSource is set. Default false.
     */
    comedia?: boolean;
    /**
     * Whether RTP/RTCP from different remote IPs:ports is allowed. If set, the
     * transport will just be valid for receiving media (consume() cannot be
     * called on it) and connect() must not be called. Default false.
     */
    multiSource?: boolean;
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
export default class PlainRtpTransport extends Transport {
    /**
     * @private
     * @emits {sctpState: string} sctpstatechange
     */
    constructor(params: any);
    /**
     * Transport tuple.
     */
    readonly tuple: TransportTuple;
    /**
     * Transport RTCP tuple.
     */
    readonly rtcpTuple: TransportTuple;
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
     * Provide the PlainRtpTransport remote parameters.
     *
     * @override
     */
    connect({ ip, port, rtcpPort }: {
        ip: string;
        port: number;
        rtcpPort?: number;
    }): Promise<void>;
    /**
     * Override Transport.consume() method to reject it if multiSource is set.
     *
     * @override
     */
    consume(params: ConsumerOptions): Promise<Consumer>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=PlainRtpTransport.d.ts.map