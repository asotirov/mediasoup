import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { SctpStreamParameters } from './types';

export interface DataProducerOptions
{
	/**
	 * DataProducer id (just for Router.pipeToRouter() method).
	 */
	id?: string;

	/**
	 * SCTP parameters defining how the endpoint is sending the data.
	 */
	sctpStreamParameters: SctpStreamParameters;

	/**
	 * A label which can be used to distinguish this DataChannel from others.
	 */
	label?: string;

	/**
	 * Name of the sub-protocol used by this DataChannel.
	 */
	protocol?: string;

	/**
	 * Custom application data.
	 */
	appData?: any;
}

const logger = new Logger('DataProducer');

export default class DataProducer extends EnhancedEventEmitter
{
	private _internal: any;
	private _data: any;
	private _channel: Channel;
	private _closed = false;
	private _appData?: object;
	private _observer = new EnhancedEventEmitter();

	/**
	 * @private
	 * @emits transportclose
	 * @emits @close
	 */
	constructor(
		{
			internal,
			data,
			channel,
			appData
		}:
		{
			internal: any;
			data: any;
			channel: Channel;
			appData: object;
		}
	)
	{
		super(logger);

		logger.debug('constructor()');

		// Internal data.
		// - .routerId
		// - .transportId
		// - .dataProducerId
		this._internal = internal;

		// DataProducer data.
		// - .sctpStreamParameters
		// - .label
		// - .protocol
		this._data = data;

		// Channel instance.
		this._channel = channel;

		// App custom data.
		// @type {Object}
		this._appData = appData;

		this._handleWorkerNotifications();
	}

	/**
	 * DataProducer id.
	 */
	get id(): string
	{
		return this._internal.dataProducerId;
	}

	/**
	 * Whether the DataProducer is closed.
	 */
	get closed(): boolean
	{
		return this._closed;
	}

	/**
	 * SCTP stream parameters.
	 */
	get sctpStreamParameters(): SctpStreamParameters
	{
		return this._data.sctpStreamParameters;
	}

	/**
	 * DataChannel label.
	 */
	get label(): string
	{
		return this._data.label;
	}

	/**
	 * DataChannel protocol.
	 */
	get protocol(): string
	{
		return this._data.protocol;
	}

	/**
	 * App custom data.
	 */
	get appData(): object
	{
		return this._appData;
	}

	/**
	 * Invalid setter.
	 */
	set appData(appData: object) // eslint-disable-line no-unused-vars
	{
		throw new Error('cannot override appData object');
	}

	/**
	 * Observer.
	 *
	 * @emits close
	 */
	get observer(): EnhancedEventEmitter
	{
		return this._observer;
	}

	/**
	 * Close the DataProducer.
	 */
	close(): void
	{
		if (this._closed)
			return;

		logger.debug('close()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.dataProducerId);

		this._channel.request('dataProducer.close', this._internal)
			.catch(() => {});

		this.emit('@close');

		// Emit observer event.
		this._observer.safeEmit('close');
	}

	/**
	 * Transport was closed.
	 *
	 * @private
	 */
	transportClosed(): void
	{
		if (this._closed)
			return;

		logger.debug('transportClosed()');

		this._closed = true;

		this.safeEmit('transportclose');

		// Emit observer event.
		this._observer.safeEmit('close');
	}

	/**
	 * Dump DataProducer.
	 */
	async dump(): Promise<any>
	{
		logger.debug('dump()');

		return this._channel.request('dataProducer.dump', this._internal);
	}

	/**
	 * Get DataProducer stats.
	 */
	async getStats(): Promise<object[]> // TODO: Proper stats interface.
	{
		logger.debug('getStats()');

		return this._channel.request('dataProducer.getStats', this._internal);
	}

	private _handleWorkerNotifications(): void
	{
		// No need to subscribe to any event.
	}
}
