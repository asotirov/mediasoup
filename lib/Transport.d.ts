import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import Producer, { ProducerOptions } from './Producer';
import Consumer, { ConsumerOptions } from './Consumer';
import DataProducer, { DataProducerOptions } from './DataProducer';
import DataConsumer, { DataConsumerOptions } from './DataConsumer';
import { RtpCapabilities } from './RtpParametersAndCapabilities';
export interface TransportListenIp {
    /**
     * Listening IPv4 or IPv6.
     */
    ip: string;
    /**
     * Announced IPv4 or IPv6 (useful when running mediasoup behind NAT with
     * private IP).
     */
    announcedIp?: string;
}
/**
 * Transport protocol.
 */
export declare type TransportProtocol = 'udp' | 'tcp';
export interface TransportTuple {
    localIp: string;
    localPort: number;
    remoteIp?: string;
    remotePort?: number;
    protocol: TransportProtocol;
}
export interface TransportSctpParameters {
    /**
     * Must always equal 5000
     */
    port: number;
    /**
     * Initially requested number of outgoing SCTP streams.
     */
    OS: number;
    /**
     * Maximum number of incoming SCTP streams.
     */
    MIS: number;
    /**
    Maximum allowed size for SCTP messages.*/
    maxMessageSize: number;
}
/**
 * Both OS and MIS are part of the SCTP INIT+ACK handshake. OS refers to the
 * initial number of outgoing SCTP streams that the server side transport creates
 * (to be used by DataConsumers), while MIS refers to the maximum number of
 * incoming SCTP streams that the server side transport can receive (to be used
 * by DataProducers). So, if the server side transport will just be used to
 * create data producers (but no data consumers), OS can be low (~1). However,
 * if data consumers are desired on the server side transport, OS must have a
 * proper value and such a proper value depends on whether the remote endpoint
 * supports  SCTP_ADD_STREAMS extension or not.
 *
 * libwebrtc (Chrome, Safari, etc) does not enable SCTP_ADD_STREAMS so, if data
 * consumers are required,  OS should be 1024 (the maximum number of DataChannels
 * that libwebrtc enables).
 *
 * Firefox does enable SCTP_ADD_STREAMS so, if data consumers are required, OS
 * can be lower (16 for instance). The mediasoup transport will allocate and
 * announce more outgoing SCTM streams when needed.
 *
 * mediasoup-client provides specific per browser/version OS and MIS values via
 * the device.sctpCapabilities getter.
 */
export interface TransportNumSctpStreams {
    /**
     * Initially requested number of outgoing SCTP streams (from 1 to 65535).
     * Default 1024.
     */
    OS: number;
    /**
     * Maximum number of incoming SCTP streams (from 1 to 65535). Default 1024.
     */
    MIS: number;
}
export declare type SctpState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';
export default class Transport extends EnhancedEventEmitter {
    protected _internal: any;
    protected _data: any;
    protected _channel: Channel;
    protected _closed: boolean;
    private _appData?;
    protected _getRouterRtpCapabilities: () => RtpCapabilities;
    protected _getProducerById: (producerId: string) => Producer;
    protected _getDataProducerById: (dataProducerId: string) => DataProducer;
    protected _producers: Map<string, Producer>;
    protected _consumers: Map<string, Consumer>;
    protected _dataProducers: Map<string, DataProducer>;
    protected _dataConsumers: Map<string, DataConsumer>;
    private _cnameForProducers?;
    private _sctpStreamIds?;
    private _nextSctpStreamId;
    protected _observer: EnhancedEventEmitter;
    /**
     * @private
     * @interface
     * @emits routerclose
     * @emits @close
     * @emits @newproducer
     * @emits @producerclose
     * @emits @newdataproducer
     * @emits @dataproducerclose
     */
    constructor({ internal, data, channel, appData, getRouterRtpCapabilities, getProducerById, getDataProducerById }: {
        internal: any;
        data: any;
        channel: Channel;
        appData: object;
        getRouterRtpCapabilities: () => RtpCapabilities;
        getProducerById: (producerId: string) => Producer;
        getDataProducerById: (dataProducerId: string) => DataProducer;
    });
    /**
     * Transport id.
     */
    readonly id: string;
    /**
     * Whether the Transport is closed.
     */
    readonly closed: boolean;
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
     * @emits {producer: Producer} newproducer
     * @emits {consumer: Consumer} newconsumer
     * @emits {producer: DataProducer} newdataproducer
     * @emits {consumer: DataConsumer} newdataconsumer
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the Transport.
     */
    close(): void;
    /**
     * Router was closed.
     *
     * @private
     * @virtual
     */
    routerClosed(): void;
    /**
     * Dump Transport.
     */
    dump(): Promise<any>;
    /**
     * Get Transport stats.
     *
     * @abstract
     */
    getStats(): Promise<any>;
    /**
     * Provide the Transport remote parameters.
     *
     * @abstract
     */
    connect(params: any): Promise<void>;
    /**
     * Set maximum incoming bitrate for receiving media.
     */
    setMaxIncomingBitrate(bitrate: number): Promise<void>;
    /**
     * Create a Producer.
     */
    produce({ id, kind, rtpParameters, paused, appData }: ProducerOptions): Promise<Producer>;
    /**
     * Create a Consumer.
     *
     * @virtual
     */
    consume({ producerId, rtpCapabilities, paused, preferredLayers, appData }: ConsumerOptions): Promise<Consumer>;
    /**
     * Create a DataProducer.
     */
    produceData({ id, sctpStreamParameters, label, protocol, appData }: DataProducerOptions): Promise<DataProducer>;
    /**
     * Create a DataConsumer.
     */
    consumeData({ dataProducerId, appData }: DataConsumerOptions): Promise<DataConsumer>;
    private _getNextSctpStreamId;
}
//# sourceMappingURL=Transport.d.ts.map