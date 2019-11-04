import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { MediaKind, RtpCapabilities, RtpParameters } from './RtpParameters';
export interface ConsumerOptions {
    /**
     * The id of the Producer to consume.
     */
    producerId: string;
    /**
     * RTP capabilities of the consuming endpoint.
     */
    rtpCapabilities?: RtpCapabilities;
    /**
     * Whether the Consumer must start in paused mode. Default false.
     *
     * When creating a video Consumer, it's recommended to set paused to true,
     * then transmit the Consumer parameters to the consuming endpoint and, once
     * the consuming endpoint has created its local side Consumer, unpause the
     * server side Consumer using the resume() method. This is an optimization
     * to make it possible for the consuming endpoint to render the video as far
     * as possible. If the server side Consumer was created with paused: false,
     * mediasoup will immediately request a key frame to the remote Producer and
     * suych a key frame may reach the consuming endpoint even before it's ready
     * to consume it, generating “black” video until the device requests a keyframe
     * by itself.
     */
    paused?: boolean;
    /**
     * Preferred spatial and temporal layer for simulcast or SVC media sources.
     * If unset, the highest ones are selected.
     */
    preferredLayers?: ConsumerLayers;
    /**
     * Custom application data.
     */
    appData?: any;
}
export interface ConsumerLayers {
    /**
     * The spatial layer index (from 0 to N).
     */
    spatialLayer: number;
    /**
     * The temporal layer index (from 0 to N).
     */
    temporalLayer?: number;
}
export interface ConsumerStat {
    type: string;
    timestamp: number;
    ssrc: number;
    rtxSsrc?: number;
    rid?: string;
    kind: string;
    mimeType: string;
    packetsLost: number;
    fractionLost: number;
    packetsDiscarded: number;
    packetsRetransmitted: number;
    packetsRepaired: number;
    nackCount: number;
    nackPacketCount: number;
    pliCount: number;
    firCount: number;
    score: number;
}
/**
 * Consumer type.
 */
export declare type ConsumerType = 'simple' | 'simulcast' | 'svc' | 'pipe';
export default class Consumer extends EnhancedEventEmitter {
    private readonly _internal;
    private readonly _data;
    private readonly _channel;
    private _closed;
    private readonly _appData?;
    private _paused;
    private _producerPaused;
    private _score;
    private _currentLayers;
    private readonly _observer;
    /**
     * @private
     * @emits transportclose
     * @emits producerclose
     * @emits producerpause
     * @emits producerresume
     * @emits {consumer: number; producerScore: number} score
     * @emits {spatialLayer: number; temporalLayer: number|null} layerschange
     * @emits @close
     * @emits @producerclose
     */
    constructor({ internal, data, channel, appData, paused, producerPaused, score }: {
        internal: any;
        data: any;
        channel: Channel;
        appData?: any;
        paused: boolean;
        producerPaused: boolean;
        score?: {
            consumer: number;
            producerScore: number;
        };
    });
    /**
     * Consumer id.
     */
    readonly id: string;
    /**
     * Associated Producer id.
     */
    readonly producerId: string;
    /**
     * Whether the Consumer is closed.
     */
    readonly closed: boolean;
    /**
     * Media kind.
     */
    readonly kind: MediaKind;
    /**
     * RTP parameters.
     */
    readonly rtpParameters: RtpParameters;
    /**
     * Consumer type.
     */
    readonly type: ConsumerType;
    /**
     * Whether the Consumer is paused.
     */
    readonly paused: boolean;
    /**
     * Whether the associate Producer  is paused.
     */
    readonly producerPaused: boolean;
    /**
     * Consumer score with consumer and producerScore keys.
     */
    readonly score: {
        consumer: number;
        producerScore: number;
    } | null;
    /**
     * Current video layers.
     */
    readonly currentLayers: any | null;
    /**
     * App custom data.
     */
    /**
    * Invalid setter.
    */
    appData: any;
    /**
     * Observer.
     *
     * @emits close
     * @emits pause
     * @emits resume
     * @emits {consumer: number; producerScore: number} score
     * @emits {spatialLayer: number; temporalLayer: number} | {null} layerschange
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the Consumer.
     */
    close(): void;
    /**
     * Transport was closed.
     *
     * @private
     */
    transportClosed(): void;
    /**
     * Dump Consumer.
     */
    dump(): Promise<any>;
    /**
     * Get Consumer stats.
     */
    getStats(): Promise<ConsumerStat[]>;
    /**
     * Pause the Consumer.
     */
    pause(): Promise<void>;
    /**
     * Resume the Consumer.
     */
    resume(): Promise<void>;
    /**
     * Set preferred video layers.
     */
    setPreferredLayers({ spatialLayer, temporalLayer }: {
        spatialLayer: number;
        temporalLayer?: number;
    }): Promise<void>;
    /**
     * Request a key frame to the Producer.
     */
    requestKeyFrame(): Promise<void>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=Consumer.d.ts.map