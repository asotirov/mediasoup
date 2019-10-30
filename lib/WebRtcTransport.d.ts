import EnhancedEventEmitter from './EnhancedEventEmitter';
import Transport, { TransportListenIp, TransportProtocol, TransportTuple, TransportSctpParameters, TransportNumSctpStreams, SctpState } from './Transport';
export interface WebRtcTransportOptions {
    /**
     * Listening IP address or addresses in order of preference (first one is the
     * preferred one).
     */
    listenIps: TransportListenIp[] | string[];
    /**
     * Listen in UDP. Default true.
     */
    enableUdp?: boolean;
    /**
     * Listen in TCP. Default false.
     */
    enableTcp?: boolean;
    /**
     * Prefer UDP. Default false.
     */
    preferUdp?: boolean;
    /**
     * Prefer TCP. Default false.
     */
    preferTcp?: boolean;
    /**
     * Initial available outgoing bitrate (in bps). Default 600000.
     */
    initialAvailableOutgoingBitrate?: number;
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
export interface IceParameters {
    usernameFragment: string;
    password: string;
    iceLite?: boolean;
}
export interface IceCandidate {
    foundation: string;
    priority: number;
    ip: string;
    protocol: TransportProtocol;
    port: number;
    type: 'host';
    tcpType: 'passive' | undefined;
}
export interface DtlsParameters {
    role?: DtlsRole;
    fingerprints: DtlsFingerprints;
}
/**
 * Map of DTLS algorithms (as defined in the "Hash function Textual Names"
 * registry initially specified in RFC 4572 Section 8) and their corresponding
 * certificate fingerprint values (in lowercase hex string as expressed
 * utilizing the syntax of "fingerprint" in RFC 4572 Section 5).
 */
export interface DtlsFingerprints {
    'sha-1'?: string;
    'sha-224'?: string;
    'sha-256'?: string;
    'sha-384'?: string;
    'sha-512'?: string;
}
export declare type IceState = 'new' | 'connected' | 'completed' | 'disconnected' | 'closed';
export declare type DtlsRole = 'auto' | 'client' | 'server';
export declare type DtlsState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';
export interface WebRtcTransportStat {
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
    iceRole: string;
    iceState: IceState;
    iceSelectedTuple?: TransportTuple;
    dtlsState: DtlsState;
}
export default class WebRtcTransport extends Transport {
    /**
     * @private
     * @emits {iceState: string} icestatechange
     * @emits {iceSelectedTuple: Object} iceselectedtuplechange
     * @emits {dtlsState: string} dtlsstatechange
     * @emits {sctpState: string} sctpstatechange
     */
    constructor(params: any);
    /**
     * ICE role.
     */
    readonly iceRole: 'controlled';
    /**
     * ICE parameters.
     */
    readonly iceParameters: IceParameters;
    /**
     * ICE candidates.
     */
    readonly iceCandidates: IceCandidate[];
    /**
     * ICE state.
     */
    readonly iceState: IceState;
    /**
     * ICE selected tuple.
     */
    readonly iceSelectedTuple: TransportTuple | undefined;
    /**
     * DTLS parameters.
     */
    readonly dtlsParameters: DtlsParameters;
    /**
     * DTLS state.
     */
    readonly dtlsState: DtlsState;
    /**
     * Remote certificate in PEM format.
     */
    readonly dtlsRemoteCert: string | undefined;
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
     * @emits {iceState: string} icestatechange
     * @emits {iceSelectedTuple: Object} iceselectedtuplechange
     * @emits {dtlsState: string} dtlsstatechange
     * @emits {sctpState: string} sctpstatechange
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the WebRtcTransport.
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
     * Get WebRtcTransport stats.
     *
     * @override
     */
    getStats(): Promise<WebRtcTransportStat[]>;
    /**
     * Provide the WebRtcTransport remote parameters.
     *
     * @override
     */
    connect({ dtlsParameters }: {
        dtlsParameters: DtlsParameters;
    }): Promise<void>;
    /**
     * Restart ICE.
     */
    restartIce(): Promise<IceParameters>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=WebRtcTransport.d.ts.map