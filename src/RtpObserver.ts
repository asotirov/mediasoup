import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import Producer from './Producer';

const logger = new Logger('RtpObserver');

export default class RtpObserver extends EnhancedEventEmitter
{
	// Internal data.
	// - .routerId
	// - .rtpObserverId
	protected _internal: any;

	// Channel instance.
	protected _channel: Channel;

	// Closed flag.
	protected _closed = false;

	// Paused flag.
	protected _paused = false;

	// Method to retrieve a Producer.
	protected _getProducerById: (producerId: string) => Producer;

	/**
	 * @private
	 * @interface
	 * @emits routerclose
	 * @emits @close
	 */
	constructor(
		{
			internal,
			channel,
			getProducerById
		}:
		{
			internal: any;
			channel: Channel;
			getProducerById: (producerId: string) => Producer;
		}
	)
	{
		super(logger);

		logger.debug('constructor()');

		this._internal = internal;
		this._channel = channel;
		this._getProducerById = getProducerById;
	}

	/**
	 * RtpObserver id.
	 */
	get id(): string
	{
		return this._internal.rtpObserverId;
	}

	/**
	 * Whether the RtpObserver is closed.
	 */
	get closed(): boolean
	{
		return this._closed;
	}

	/**
	 * Whether the RtpObserver is paused.
	 */
	get paused(): boolean
	{
		return this._paused;
	}

	/**
	 * Close the RtpObserver.
	 */
	close(): void
	{
		if (this._closed)
			return;

		logger.debug('close()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.rtpObserverId);

		this._channel.request('rtpObserver.close', this._internal)
			.catch(() => {});

		this.emit('@close');
	}

	/**
	 * Router was closed.
	 *
	 * @private
	 */
	routerClosed(): void
	{
		if (this._closed)
			return;

		logger.debug('routerClosed()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.rtpObserverId);

		this.safeEmit('routerclose');
	}

	/**
	 * Pause the RtpObserver.
	 */
	async pause(): Promise<void>
	{
		if (this._paused)
			return;

		logger.debug('pause()');

		await this._channel.request('rtpObserver.pause', this._internal);

		this._paused = true;
	}

	/**
	 * Resume the RtpObserver.
	 */
	async resume(): Promise<void>
	{
		if (!this._paused)
			return;

		logger.debug('resume()');

		await this._channel.request('rtpObserver.resume', this._internal);

		this._paused = false;
	}

	/**
	 * Add a Producer to the RtpObserver.
	 */
	async addProducer({ producerId }: { producerId: string }): Promise<void>
	{
		logger.debug('addProducer()');

		const internal = { ...this._internal, producerId };

		await this._channel.request('rtpObserver.addProducer', internal);
	}

	/**
	 * Remove a Producer from the RtpObserver.
	 */
	async removeProducer({ producerId }: { producerId: string }): Promise<void>
	{
		logger.debug('removeProducer()');

		const internal = { ...this._internal, producerId };

		await this._channel.request('rtpObserver.removeProducer', internal);
	}
}
