import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Worker, { WorkerSettings } from './Worker';
import * as utils from './utils';
import supportedRtpCapabilities from './supportedRtpCapabilities';
import { RtpCapabilities } from './RtpParametersAndCapabilities';
import * as types from './types';

/**
 * Expose all types.
 */
export { types };

/**
 * Expose mediasoup version.
 */
export const version = '__MEDIASOUP_VERSION__';

/**
 * Expose parseScalabilityMode() function and ScalabilityMode interface.
 */
export { parse as parseScalabilityMode } from './scalabilityModes';

const logger = new Logger();
const observer = new EnhancedEventEmitter();

/**
 * Observer.
 *
 * @emits {worker: Worker} newworker
 */
export { observer };

/**
 * Create a Worker.
 */
export async function createWorker(
	{
		logLevel = 'error',
		logTags,
		rtcMinPort = 10000,
		rtcMaxPort = 59999,
		dtlsCertificateFile,
		dtlsPrivateKeyFile
	}: WorkerSettings = {}
): Promise<Worker>
{
	logger.debug('createWorker()');

	const worker = new Worker(
		{
			logLevel,
			logTags,
			rtcMinPort,
			rtcMaxPort,
			dtlsCertificateFile,
			dtlsPrivateKeyFile
		});

	return new Promise((resolve, reject) =>
	{
		worker.on('@success', () =>
		{
			// Emit observer event.
			observer.safeEmit('newworker', worker);

			resolve(worker);
		});

		worker.on('@failure', reject);
	});
}

/**
 * Get a cloned copy of the mediasoup supported RTP capabilities.
 */
export function getSupportedRtpCapabilities(): RtpCapabilities
{
	return utils.clone(supportedRtpCapabilities) as RtpCapabilities;
}
