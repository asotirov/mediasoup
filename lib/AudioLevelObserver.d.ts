import RtpObserver from './RtpObserver';
export interface AudioLevelObserverOptions {
    /**
     * Maximum number of entries in the 'volumes”' event. Default 1.
     */
    maxEntries?: number;
    /**
     * Minimum average volume (in dBvo from -127 to 0) for entries in the
     * 'volumes' event.	Default -80.
     */
    threshold?: number;
    /**
     * Interval in ms for checking audio volumes. Default 1000.
     */
    interval?: number;
}
export default class AudioLevelObserver extends RtpObserver {
    /**
     * @private
     * @emits {volumes: Array<Object<producer: Producer, volume: Number>>} volumes
     * @emits silence
     */
    constructor(params: any);
    private _handleWorkerNotifications;
}
//# sourceMappingURL=AudioLevelObserver.d.ts.map