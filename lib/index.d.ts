import EnhancedEventEmitter from './EnhancedEventEmitter';
import Worker, { WorkerSettings } from './Worker';
import { RtpCapabilities } from './RtpParametersAndCapabilities';
/**
 * Expose mediasoup version.
 */
export declare const version = "__MEDIASOUP_VERSION__";
/**
 * Expose parseScalabilityMode() function and ScalabilityMode interface.
 */
export { parse as parseScalabilityMode, ScalabilityMode } from './scalabilityModes';
declare const observer: EnhancedEventEmitter;
/**
 * Observer.
 *
 * @emits {worker: Worker} newworker
 */
export { observer };
/**
 * Create a Worker.
 */
export declare function createWorker({ logLevel, logTags, rtcMinPort, rtcMaxPort, dtlsCertificateFile, dtlsPrivateKeyFile }?: WorkerSettings): Promise<Worker>;
/**
 * Get a cloned copy of the mediasoup supported RTP capabilities.
 */
export declare function getSupportedRtpCapabilities(): RtpCapabilities;
//# sourceMappingURL=index.d.ts.map