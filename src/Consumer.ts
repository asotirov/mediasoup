import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Channel from './Channel';
import { ProducerType } from './Producer';
import {
	MediaKind,
	RtpCapabilities,
	RtpParameters
} from './RtpParametersAndCapabilities';

export interface ConsumerOptions
{
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
	appData?: object;
}

export interface ConsumerLayers
{
	/**
	 * The spatial layer index (from 0 to N).
	 */
	spatialLayer: number;

	/**
	 * The temporal layer index (from 0 to N).
	 */
	temporalLayer?: number;
}

export interface ConsumerStat
{
	// Common to all RtpStreams.
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

const logger = new Logger('Consumer');

export default class Consumer extends EnhancedEventEmitter
{
	private _internal: any;
	private _data: any;
	private _channel: Channel;
	private _closed = false;
	private _appData?: object;
	private _paused = false;
	private _producerPaused = false;
	private _score: { consumer: number; producerScore: number } | null;
	private _currentLayers: object | null = null;
	private _observer = new EnhancedEventEmitter();

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
	constructor(
		{
			internal,
			data,
			channel,
			appData,
			paused,
			producerPaused,
			score = { consumer: 10, producerScore: 10 }
		}:
		{
			internal: any;
			data: any;
			channel: Channel;
			appData?: object;
			paused: boolean;
			producerPaused: boolean;
			score?: { consumer: number; producerScore: number };
		})
	{
		super(logger);

		logger.debug('constructor()');

		// Internal data.
		// - .routerId
		// - .transportId
		// - .consumerId
		// - .producerId
		this._internal = internal;

		// Consumer data.
		// - .kind
		// - .rtpParameters
		// - .type
		this._data = data;

		// Channel instance.
		this._channel = channel;

		// App custom data.
		this._appData = appData;

		// Paused flag.
		this._paused = paused;

		// Producer paused flag.
		this._producerPaused = producerPaused;

		// Score with score and producerScore keys.
		this._score = score;

		this._handleWorkerNotifications();
	}

	/**
	 * Consumer id.
	 */
	get id(): string
	{
		return this._internal.consumerId;
	}

	/**
	 * Associated Producer id.
	 */
	get producerId(): string
	{
		return this._internal.producerId;
	}

	/**
	 * Whether the Consumer is closed.
	 */
	get closed(): boolean
	{
		return this._closed;
	}

	/**
	 * Media kind.
	 */
	get kind(): MediaKind
	{
		return this._data.kind;
	}

	/**
	 * RTP parameters.
	 */
	get rtpParameters(): RtpParameters
	{
		return this._data.rtpParameters;
	}

	/**
	 * Associated Producer type.
	 */
	get type(): ProducerType
	{
		return this._data.type;
	}

	/**
	 * Whether the Consumer is paused.
	 */
	get paused(): boolean
	{
		return this._paused;
	}

	/**
	 * Whether the associate Producer  is paused.
	 */
	get producerPaused(): boolean
	{
		return this._producerPaused;
	}

	/**
	 * Consumer score with consumer and producerScore keys.
	 */
	get score(): { consumer: number; producerScore: number } | null
	{
		return this._score;
	}

	/**
	 * Current video layers.
	 */
	get currentLayers(): object | null
	{
		return this._currentLayers;
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
	set appData(appData) // eslint-disable-line no-unused-vars
	{
		throw new Error('cannot override appData object');
	}

	/**
	 * Observer.
	 *
	 * @emits close
	 * @emits pause
	 * @emits resume
	 * @emits {consumer: number; producerScore: number} score
	 * @emits {spatialLayer: number; temporalLayer: number} | {null} layerschange
	 */
	get observer(): EnhancedEventEmitter
	{
		return this._observer;
	}

	/**
	 * Close the Consumer.
	 */
	close(): void
	{
		if (this._closed)
			return;

		logger.debug('close()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.consumerId);

		this._channel.request('consumer.close', this._internal)
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

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.consumerId);

		this.safeEmit('transportclose');

		// Emit observer event.
		this._observer.safeEmit('close');
	}

	/**
	 * Dump Consumer.
	 */
	async dump(): Promise<any>
	{
		logger.debug('dump()');

		return this._channel.request('consumer.dump', this._internal);
	}

	/**
	 * Get Consumer stats.
	 */
	async getStats(): Promise<ConsumerStat[]>
	{
		logger.debug('getStats()');

		return this._channel.request('consumer.getStats', this._internal);
	}

	/**
	 * Pause the Consumer.
	 */
	async pause(): Promise<void>
	{
		logger.debug('pause()');

		const wasPaused = this._paused || this._producerPaused;

		await this._channel.request('consumer.pause', this._internal);

		this._paused = true;

		// Emit observer event.
		if (!wasPaused)
			this._observer.safeEmit('pause');
	}

	/**
	 * Resume the Consumer.
	 */
	async resume(): Promise<void>
	{
		logger.debug('resume()');

		const wasPaused = this._paused || this._producerPaused;

		await this._channel.request('consumer.resume', this._internal);

		this._paused = false;

		// Emit observer event.
		if (wasPaused && !this._producerPaused)
			this._observer.safeEmit('resume');
	}

	/**
	 * Set preferred video layers.
	 */
	async setPreferredLayers(
		{
			spatialLayer,
			temporalLayer
		}:
		{
			spatialLayer: number;
			temporalLayer?: number;
		}
	): Promise<void>
	{
		logger.debug('setPreferredLayers()');

		const reqData = { spatialLayer, temporalLayer };

		await this._channel.request(
			'consumer.setPreferredLayers', this._internal, reqData);
	}

	/**
	 * Request a key frame to the Producer.
	 */
	async requestKeyFrame(): Promise<void>
	{
		logger.debug('requestKeyFrame()');

		await this._channel.request('consumer.requestKeyFrame', this._internal);
	}

	private _handleWorkerNotifications(): void
	{
		this._channel.on(this._internal.consumerId, (event: string, data?: any) =>
		{
			switch (event)
			{
				case 'producerclose':
				{
					if (this._closed)
						break;

					this._closed = true;

					// Remove notification subscriptions.
					this._channel.removeAllListeners(this._internal.consumerId);

					this.emit('@producerclose');
					this.safeEmit('producerclose');

					// Emit observer event.
					this._observer.safeEmit('close');

					break;
				}

				case 'producerpause':
				{
					if (this._producerPaused)
						break;

					const wasPaused = this._paused || this._producerPaused;

					this._producerPaused = true;

					this.safeEmit('producerpause');

					// Emit observer event.
					if (!wasPaused)
						this._observer.safeEmit('pause');

					break;
				}

				case 'producerresume':
				{
					if (!this._producerPaused)
						break;

					const wasPaused = this._paused || this._producerPaused;

					this._producerPaused = false;

					this.safeEmit('producerresume');

					// Emit observer event.
					if (wasPaused && !this._paused)
						this._observer.safeEmit('resume');

					break;
				}

				case 'score':
				{
					const score = data;

					this._score = score;

					this.safeEmit('score', score);

					// Emit observer event.
					this._observer.safeEmit('score', score);

					break;
				}

				case 'layerschange':
				{
					const layers = data;

					this._currentLayers = layers;

					this.safeEmit('layerschange', layers);

					// Emit observer event.
					this._observer.safeEmit('layerschange', layers);

					break;
				}

				default:
				{
					logger.error('ignoring unknown event "%s"', event);
				}
			}
		});
	}
}
