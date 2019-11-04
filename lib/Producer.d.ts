import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { MediaKind, RtpParameters } from './RtpParameters';
export interface ProducerOptions {
    /**
     * Producer id (just for Router.pipeToRouter() method).
     */
    id?: string;
    /**
     * Media kind ('audio' or 'video').
     */
    kind: MediaKind;
    /**
     * RTP parameters defining what the endpoint is sending.
     */
    rtpParameters: RtpParameters;
    /**
     * Whether the producer must start in paused mode. Default false.
     */
    paused?: boolean;
    /**
     * Custom application data.
     */
    appData?: any;
}
export interface ProducerStat {
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
    packetCount: number;
    byteCount: number;
    bitrate: number;
    roundTripTime?: number;
    jitter: number;
    bitrateByLayer?: any;
}
/**
 * Producer type.
 */
export declare type ProducerType = 'simple' | 'simulcast' | 'svc';
export default class Producer extends EnhancedEventEmitter {
    private readonly _internal;
    private readonly _data;
    private readonly _channel;
    private _closed;
    private readonly _appData?;
    private _paused;
    private _score;
    private readonly _observer;
    /**
     * @private
     * @emits transportclose
     * @emits {Array<Object>} score
     * @emits {Object} videoorientationchange
     * @emits @close
     */
    constructor({ internal, data, channel, appData, paused }: {
        internal: any;
        data: any;
        channel: Channel;
        appData?: any;
        paused: boolean;
    });
    /**
     * Producer id.
     */
    readonly id: string;
    /**
     * Whether the Producer is closed.
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
     * Producer type.
     */
    readonly type: ProducerType;
    /**
     * Consumable RTP parameters.
     *
     * @private
     */
    readonly consumableRtpParameters: RtpParameters;
    /**
     * Whether the Producer is paused.
     */
    readonly paused: boolean;
    /**
     * Producer score list.
     */
    readonly score: any[];
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
     * @emits {Array<Object>} score
     * @emits {Object} videoorientationchange
     */
    readonly observer: EnhancedEventEmitter;
    /**
     * Close the Producer.
     */
    close(): void;
    /**
     * Transport was closed.
     *
     * @private
     */
    transportClosed(): void;
    /**
     * Dump Producer.
     */
    dump(): Promise<any>;
    /**
     * Get Producer stats.
     */
    getStats(): Promise<ProducerStat[]>;
    /**
     * Pause the Producer.
     */
    pause(): Promise<void>;
    /**
     * Resume the Producer.
     */
    resume(): Promise<void>;
    private _handleWorkerNotifications;
}
//# sourceMappingURL=Producer.d.ts.map