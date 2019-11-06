import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import Producer from './Producer';
export default class RtpObserver extends EnhancedEventEmitter {
    protected readonly _internal: any;
    protected readonly _channel: Channel;
    protected _closed: boolean;
    protected _paused: boolean;
    protected readonly _getProducerById: (producerId: string) => Producer;
    /**
     * @private
     * @interface
     * @emits routerclose
     * @emits @close
     */
    constructor({ internal, channel, getProducerById }: {
        internal: any;
        channel: Channel;
        getProducerById: (producerId: string) => Producer;
    });
    /**
     * RtpObserver id.
     */
    get id(): string;
    /**
     * Whether the RtpObserver is closed.
     */
    get closed(): boolean;
    /**
     * Whether the RtpObserver is paused.
     */
    get paused(): boolean;
    /**
     * Close the RtpObserver.
     */
    close(): void;
    /**
     * Router was closed.
     *
     * @private
     */
    routerClosed(): void;
    /**
     * Pause the RtpObserver.
     */
    pause(): Promise<void>;
    /**
     * Resume the RtpObserver.
     */
    resume(): Promise<void>;
    /**
     * Add a Producer to the RtpObserver.
     */
    addProducer({ producerId }: {
        producerId: string;
    }): Promise<void>;
    /**
     * Remove a Producer from the RtpObserver.
     */
    removeProducer({ producerId }: {
        producerId: string;
    }): Promise<void>;
}
//# sourceMappingURL=RtpObserver.d.ts.map