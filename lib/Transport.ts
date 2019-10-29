import * as uuidv4 from 'uuid/v4';
import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import * as utils from './utils';
import * as ortc from './ortc';
import Channel from './Channel';
import Producer, { ProducerOptions } from './Producer';
import Consumer, { ConsumerOptions } from './Consumer';
import DataProducer, { DataProducerOptions } from './DataProducer';
import DataConsumer, { DataConsumerOptions } from './DataConsumer';
import { RtpCapabilities, SctpStreamParameters } from './types';

export interface TransportListenIp
{
	/**
	 * Listening IPv4 or IPv6.
	 */
	ip: string;

	/**
	 * Announced IPv4 or IPv6 (useful when running mediasoup behind NAT with
	 * private IP).
	 */
	announcedIp?: string;
}

export interface TransportTuple
{
	localIp: string;
	localPort: number;
	remoteIp?: string;
	remotePort?: number;
	protocol: 'udp' | 'tcp';
}

export interface TransportSctpParameters
{
	/**
	 * Must always equal 5000
	 */
	port: number;

	/**
	 * Initially requested number of outgoing SCTP streams.
	 */
	OS: number;

	/**
	 * Maximum number of incoming SCTP streams.
	 */
	MIS: number;

	/**
	Maximum allowed size for SCTP messages.*/
	maxMessageSize: number;
}

/**
 * Both OS and MIS are part of the SCTP INIT+ACK handshake. OS refers to the
 * initial number of outgoing SCTP streams that the server side transport creates
 * (to be used by DataConsumers), while MIS refers to the maximum number of
 * incoming SCTP streams that the server side transport can receive (to be used
 * by DataProducers). So, if the server side transport will just be used to
 * create data producers (but no data consumers), OS can be low (~1). However,
 * if data consumers are desired on the server side transport, OS must have a
 * proper value and such a proper value depends on whether the remote endpoint
 * supports  SCTP_ADD_STREAMS extension or not.
 *
 * libwebrtc (Chrome, Safari, etc) does not enable SCTP_ADD_STREAMS so, if data
 * consumers are required,  OS should be 1024 (the maximum number of DataChannels
 * that libwebrtc enables).
 *
 * Firefox does enable SCTP_ADD_STREAMS so, if data consumers are required, OS
 * can be lower (16 for instance). The mediasoup transport will allocate and
 * announce more outgoing SCTM streams when needed.
 *
 * mediasoup-client provides specific per browser/version OS and MIS values via
 * the device.sctpCapabilities getter.
 */
export interface TransportNumSctpStreams
{
	/**
	 * Initially requested number of outgoing SCTP streams (from 1 to 65535).
	 * Default 1024.
	 */
	OS: number;

	/**
	 * Maximum number of incoming SCTP streams (from 1 to 65535). Default 1024.
	 */
	MIS: number;
}

export type SctpState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';

const logger = new Logger('Transport');

export default class Transport extends EnhancedEventEmitter
{
	protected _internal: any;
	protected _data: any;
	protected _channel: Channel;
	protected _closed = false;
	private _appData?: object;
	protected _getRouterRtpCapabilities: () => RtpCapabilities;
	protected _getProducerById: (producerId: string) => Producer;
	protected _getDataProducerById: (dataProducerId: string) => DataProducer;
	protected _producers: Map<string, Producer> = new Map();
	protected _consumers: Map<string, Consumer> = new Map();
	protected _dataProducers: Map<string, DataProducer> = new Map();
	protected _dataConsumers: Map<string, DataConsumer> = new Map();
	private _cnameForProducers?: string;
	private _sctpStreamIds?: Buffer;
	private _nextSctpStreamId = 0;
	protected _observer = new EnhancedEventEmitter();

	/**
	 * @private
	 * @interface
	 * @emits routerclose
	 * @emits @close
	 * @emits @newproducer
	 * @emits @producerclose
	 * @emits @newdataproducer
	 * @emits @dataproducerclose
	 */
	constructor(
		{
			internal,
			data,
			channel,
			appData,
			getRouterRtpCapabilities,
			getProducerById,
			getDataProducerById
		}:
		{
			internal: any;
			data: any;
			channel: Channel;
			appData: object;
			getRouterRtpCapabilities: () => RtpCapabilities;
			getProducerById: (producerId: string) => Producer;
			getDataProducerById: (dataProducerId: string) => DataProducer;
		}
	)
	{
		super(logger);

		logger.debug('constructor()');

		// Internal data.
		// - .routerId
		// - .transportId
		this._internal = internal;

		// Transport specific data.
		this._data = data;

		// Channel instance.
		this._channel = channel;

		// App custom data.
		this._appData = appData;

		// Function that returns router RTP capabilities.
		this._getRouterRtpCapabilities = getRouterRtpCapabilities;

		// Function that gets any Producer in the Router.
		this._getProducerById = getProducerById;

		// Function that gets any DataProducer in the Router.
		this._getDataProducerById = getDataProducerById;
	}

	/**
	 * Transport id.
	 */
	get id(): string
	{
		return this._internal.transportId;
	}

	/**
	 * Whether the Transport is closed.
	 */
	get closed(): boolean
	{
		return this._closed;
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
	 * @emits {producer: Producer} newproducer
	 * @emits {consumer: Consumer} newconsumer
	 * @emits {producer: DataProducer} newdataproducer
	 * @emits {consumer: DataConsumer} newdataconsumer
	 */
	get observer(): EnhancedEventEmitter
	{
		return this._observer;
	}

	/**
	 * Close the Transport.
	 */
	close(): void
	{
		if (this._closed)
			return;

		logger.debug('close()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.transportId);

		this._channel.request('transport.close', this._internal)
			.catch(() => {});

		// Close every Producer.
		for (const producer of this._producers.values())
		{
			producer.transportClosed();

			// Must tell the Router.
			this.emit('@producerclose', producer);
		}
		this._producers.clear();

		// Close every Consumer.
		for (const consumer of this._consumers.values())
		{
			consumer.transportClosed();
		}
		this._consumers.clear();

		// Close every DataProducer.
		for (const dataProducer of this._dataProducers.values())
		{
			dataProducer.transportClosed();

			// Must tell the Router.
			this.emit('@dataproducerclose', dataProducer);
		}
		this._dataProducers.clear();

		// Close every DataConsumer.
		for (const dataConsumer of this._dataConsumers.values())
		{
			dataConsumer.transportClosed();
		}
		this._dataConsumers.clear();

		this.emit('@close');

		// Emit observer event.
		this._observer.safeEmit('close');
	}

	/**
	 * Router was closed.
	 *
	 * @private
	 * @virtual
	 */
	routerClosed(): void
	{
		if (this._closed)
			return;

		logger.debug('routerClosed()');

		this._closed = true;

		// Remove notification subscriptions.
		this._channel.removeAllListeners(this._internal.transportId);

		// Close every Producer.
		for (const producer of this._producers.values())
		{
			producer.transportClosed();

			// NOTE: No need to tell the Router since it already knows (it has
			// been closed in fact).
		}
		this._producers.clear();

		// Close every Consumer.
		for (const consumer of this._consumers.values())
		{
			consumer.transportClosed();
		}
		this._consumers.clear();

		// Close every DataProducer.
		for (const dataProducer of this._dataProducers.values())
		{
			dataProducer.transportClosed();

			// NOTE: No need to tell the Router since it already knows (it has
			// been closed in fact).
		}
		this._dataProducers.clear();

		// Close every DataConsumer.
		for (const dataConsumer of this._dataConsumers.values())
		{
			dataConsumer.transportClosed();
		}
		this._dataConsumers.clear();

		this.safeEmit('routerclose');

		// Emit observer event.
		this._observer.safeEmit('close');
	}

	/**
	 * Dump Transport.
	 */
	async dump(): Promise<any>
	{
		logger.debug('dump()');

		return this._channel.request('transport.dump', this._internal);
	}

	/**
	 * Get Transport stats.
	 */
	async getStats(): Promise<object[]> // TODO: Proper stats interface.
	{
		logger.debug('getStats()');

		return this._channel.request('transport.getStats', this._internal);
	}

	/**
	 * Provide the Transport remote parameters.
	 *
	 * @abstract
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async connect(params: any): Promise<void>
	{
		// Should not happen.
		throw new Error('method not implemented in the subclass');
	}

	/**
	 * Create a Producer.
	 */
	async produce(
		{
			id = undefined,
			kind,
			rtpParameters,
			paused = false,
			appData = {}
		}: ProducerOptions
	): Promise<Producer>
	{
		logger.debug('produce()');

		if (id && this._producers.has(id))
			throw new TypeError(`a Producer with same id "${id}" already exists`);
		else if (![ 'audio', 'video' ].includes(kind))
			throw new TypeError(`invalid kind "${kind}"`);
		else if (typeof rtpParameters !== 'object')
			throw new TypeError('missing rtpParameters');
		else if (appData && typeof appData !== 'object')
			throw new TypeError('if given, appData must be an object');

		// If missing encodings, add one.
		if (!rtpParameters.encodings || !Array.isArray(rtpParameters.encodings))
			rtpParameters.encodings = [ {} ];

		// Don't do this in PipeTransports since there we must keep CNAME value in
		// each Producer.
		if (this.constructor.name !== 'PipeTransport')
		{
			// If CNAME is given and we don't have yet a CNAME for Producers in this
			// Transport, take it.
			if (!this._cnameForProducers && rtpParameters.rtcp && rtpParameters.rtcp.cname)
			{
				this._cnameForProducers = rtpParameters.rtcp.cname;
			}
			// Otherwise if we don't have yet a CNAME for Producers and the RTP parameters
			// do not include CNAME, create a random one.
			else if (!this._cnameForProducers)
			{
				this._cnameForProducers = uuidv4().substr(0, 8);
			}

			// Override Producer's CNAME.
			rtpParameters.rtcp = rtpParameters.rtcp || {};
			rtpParameters.rtcp.cname = this._cnameForProducers;
		}

		const routerRtpCapabilities = this._getRouterRtpCapabilities();

		// This may throw.
		const rtpMapping = ortc.getProducerRtpParametersMapping(
			rtpParameters, routerRtpCapabilities);

		// This may throw.
		const consumableRtpParameters = ortc.getConsumableRtpParameters(
			kind, rtpParameters, routerRtpCapabilities, rtpMapping);

		const internal = { ...this._internal, producerId: id || uuidv4() };
		const reqData = { kind, rtpParameters, rtpMapping, paused };

		const status =
			await this._channel.request('transport.produce', internal, reqData);

		const data =
		{
			kind,
			rtpParameters,
			type : status.type,
			consumableRtpParameters
		};

		const producer = new Producer(
			{
				internal,
				data,
				channel : this._channel,
				appData,
				paused
			});

		this._producers.set(producer.id, producer);
		producer.on('@close', () =>
		{
			this._producers.delete(producer.id);
			this.emit('@producerclose', producer);
		});

		this.emit('@newproducer', producer);

		// Emit observer event.
		this._observer.safeEmit('newproducer', producer);

		return producer;
	}

	/**
	 * Create a Consumer.
	 *
	 * @virtual
	 */
	async consume(
		{
			producerId,
			rtpCapabilities,
			paused = false,
			preferredLayers,
			appData = {}
		}: ConsumerOptions
	): Promise<Consumer>
	{
		logger.debug('consume()');

		if (!producerId || typeof producerId !== 'string')
			throw new TypeError('missing producerId');
		else if (typeof rtpCapabilities !== 'object')
			throw new TypeError('missing rtpCapabilities');
		else if (appData && typeof appData !== 'object')
			throw new TypeError('if given, appData must be an object');

		const producer = this._getProducerById(producerId);

		if (!producer)
			throw Error(`Producer with id "${producerId}" not found`);

		// This may throw.
		const rtpParameters = ortc.getConsumerRtpParameters(
			producer.consumableRtpParameters, rtpCapabilities);

		const internal = { ...this._internal, consumerId: uuidv4(), producerId };
		const reqData =
		{
			kind                   : producer.kind,
			rtpParameters,
			type                   : producer.type,
			consumableRtpEncodings : producer.consumableRtpParameters.encodings,
			paused,
			preferredLayers
		};

		const status =
			await this._channel.request('transport.consume', internal, reqData);

		const data = { kind: producer.kind, rtpParameters, type: producer.type };

		const consumer = new Consumer(
			{
				internal,
				data,
				channel        : this._channel,
				appData,
				paused         : status.paused,
				producerPaused : status.producerPaused,
				score          : status.score
			});

		this._consumers.set(consumer.id, consumer);
		consumer.on('@close', () => this._consumers.delete(consumer.id));
		consumer.on('@producerclose', () => this._consumers.delete(consumer.id));

		// Emit observer event.
		this._observer.safeEmit('newconsumer', consumer);

		return consumer;
	}

	/**
	 * Create a DataProducer.
	 */
	async produceData(
		{
			id = undefined,
			sctpStreamParameters,
			label = '',
			protocol = '',
			appData = {}
		}: DataProducerOptions
	): Promise<DataProducer>
	{
		logger.debug('produceData()');

		if (id && this._dataProducers.has(id))
			throw new TypeError(`a DataProducer with same id "${id}" already exists`);
		else if (typeof sctpStreamParameters !== 'object')
			throw new TypeError('missing sctpStreamParameters');
		else if (appData && typeof appData !== 'object')
			throw new TypeError('if given, appData must be an object');

		const internal = { ...this._internal, dataProducerId: id || uuidv4() };
		const reqData = { sctpStreamParameters, label, protocol };

		const data =
			await this._channel.request('transport.produceData', internal, reqData);

		const dataProducer = new DataProducer(
			{
				internal,
				data,
				channel : this._channel,
				appData
			});

		this._dataProducers.set(dataProducer.id, dataProducer);
		dataProducer.on('@close', () =>
		{
			this._dataProducers.delete(dataProducer.id);
			this.emit('@dataproducerclose', dataProducer);
		});

		this.emit('@newdataproducer', dataProducer);

		// Emit observer event.
		this._observer.safeEmit('newdataproducer', dataProducer);

		return dataProducer;
	}

	/**
	 * Create a DataConsumer.
	 */
	async consumeData(
		{
			dataProducerId,
			appData = {}
		}: DataConsumerOptions
	): Promise<DataConsumer>
	{
		logger.debug('consumeData()');

		if (!dataProducerId || typeof dataProducerId !== 'string')
			throw new TypeError('missing dataProducerId');
		else if (appData && typeof appData !== 'object')
			throw new TypeError('if given, appData must be an object');

		const dataProducer = this._getDataProducerById(dataProducerId);

		if (!dataProducer)
			throw Error(`DataProducer with id "${dataProducerId}" not found`);

		const sctpStreamParameters =
			utils.clone(dataProducer.sctpStreamParameters) as SctpStreamParameters;

		const { label, protocol } = dataProducer;

		// This may throw.
		const sctpStreamId = this._getNextSctpStreamId();

		this._sctpStreamIds[sctpStreamId] = 1;
		sctpStreamParameters.streamId = sctpStreamId;

		const internal = { ...this._internal, dataConsumerId: uuidv4(), dataProducerId };
		const reqData = { sctpStreamParameters, label, protocol };

		const data =
			await this._channel.request('transport.consumeData', internal, reqData);

		const dataConsumer = new DataConsumer(
			{
				internal,
				data,
				channel : this._channel,
				appData
			});

		this._dataConsumers.set(dataConsumer.id, dataConsumer);
		dataConsumer.on('@close', () =>
		{
			this._dataConsumers.delete(dataConsumer.id);

			this._sctpStreamIds[sctpStreamId] = 0;
		});
		dataConsumer.on('@dataproducerclose', () =>
		{
			this._dataConsumers.delete(dataConsumer.id);

			this._sctpStreamIds[sctpStreamId] = 0;
		});

		// Emit observer event.
		this._observer.safeEmit('newdataconsumer', dataConsumer);

		return dataConsumer;
	}

	private _getNextSctpStreamId(): number
	{
		if (
			!this._data.sctpParameters ||
			typeof this._data.sctpParameters.MIS !== 'number'
		)
		{
			throw new TypeError('missing data.sctpParameters.MIS');
		}

		const numStreams = this._data.sctpParameters.MIS;

		if (!this._sctpStreamIds)
			this._sctpStreamIds = Buffer.alloc(numStreams, 0);

		let sctpStreamId;

		for (let idx = 0; idx < this._sctpStreamIds.length; ++idx)
		{
			sctpStreamId = (this._nextSctpStreamId + idx) % this._sctpStreamIds.length;

			if (!this._sctpStreamIds[sctpStreamId])
			{
				this._nextSctpStreamId = sctpStreamId + 1;

				return sctpStreamId;
			}
		}

		throw new Error('no sctpStreamId available');
	}
}
