import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Worker, { WorkerSettings } from './Worker';
import * as utils from './utils';
import supportedRtpCapabilities from './supportedRtpCapabilities';

/**
 * Expose mediasoup version.
 *
 * @type {String}
 */
export { version } from '../package.json';

/**
 * Expose parseScalabilityMode function.
 *
 * @type {Function}
 */
export { parse as parseScalabilityMode } from './scalabilityModes';

const logger = new Logger();
const observer = new EnhancedEventEmitter();

/**
 * Observer.
 *
 * @type {EnhancedEventEmitter}
 *
 * @emits {worker: Worker} newworker
 */
export { observer };

/**
 * Create a Worker.
 *
 * @param {WorkerSettings} [settings]
 *
 * @async
 * @returns {Worker}
 * @throws {TypeError} if wrong settings.
 * @throws {Error} if unexpected error.
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
};

/**
 * Get a cloned copy of the mediasoup supported RTP capabilities.
 *
 * @return {RTCRtpCapabilities}
 */
export function getSupportedRtpCapabilities(): any // TODO: Interface
{
	return utils.clone(supportedRtpCapabilities);
};
