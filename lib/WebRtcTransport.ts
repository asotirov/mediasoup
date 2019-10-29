import Logger from './Logger';
import EnhancedEventEmitter from './EnhancedEventEmitter';
import Transport, {
	TransportListenIp,
	TransportTuple,
	TransportSctpParameters,
	TransportNumSctpStreams,
	SctpState
} from './Transport';

export interface WebRtcTransportOptions
{
	/**
	 * Listening IP address or addresses in order of preference (first one is the
	 * preferred one).
	 */
	listenIps: TransportListenIp[] | string[];

	/**
	 * Listen in UDP. Default true.
	 */
	enableUdp?: boolean;

	/**
	 * Listen in TCP. Default false.
	 */
	enableTcp?: boolean;

	/**
	 * Prefer UDP. Default false.
	 */
	preferUdp?: boolean;

	/**
	 * Prefer TCP. Default false.
	 */
	preferTcp?: boolean;

	/**
	 * Initial available outgoing bitrate (in bps). Default 600000.
	 */
	initialAvailableOutgoingBitrate?: number;

	/**
	 * Create a SCTP association. Default false.
	 */
	enableSctp?: boolean;

	/**
	 * SCTP streams number.
	 */
	numSctpStreams?: TransportNumSctpStreams;

	/**
	 * Maximum size of data that can be passed to DataProducer's send() method.
	 * Default 262144.
	 */
	maxSctpMessageSize?: number;

	/**
	 * Custom application data.
	 */
	appData?: object;
}

export interface IceParameters
{
	usernameFragment: string;
	password: string;
	iceLite?: boolean;
}

export interface IceCandidate
{
	foundation: string;
	priority: number;
	ip: string;
	protocol: 'udp' | 'tcp';
	port: number;
	type: 'host';
	tcpType: 'passive' | undefined;
}

export interface DtlsParameters
{
	role?: DtlsRole;
	fingerprints: DtlsFingerprints;
}

/**
 * Map of DTLS algorithms (as defined in the "Hash function Textual Names"
 * registry initially specified in RFC 4572 Section 8) and their corresponding
 * certificate fingerprint values (in lowercase hex string as expressed
 * utilizing the syntax of "fingerprint" in RFC 4572 Section 5).
 */
export interface DtlsFingerprints
{
	'sha-1'?: string;
	'sha-224'?: string;
	'sha-256'?: string;
	'sha-384'?: string;
	'sha-512'?: string;
}

export type IceState = 'new' | 'connected' | 'completed' | 'disconnected' | 'closed';

export type DtlsRole = 'auto' | 'client' | 'server';

export type DtlsState = 'new' | 'connecting' | 'connected' | 'failed' | 'closed';

const logger = new Logger('WebRtcTransport');

export default class WebRtcTransport extends Transport
{
	/**
	 * @private
	 *
	 * @emits {iceState: string} icestatechange
	 * @emits {iceSelectedTuple: Object} iceselectedtuplechange
	 * @emits {dtlsState: string} dtlsstatechange
	 * @emits {sctpState: string} sctpstatechange
	 */
	constructor(params: any)
	{
		super(params);

		logger.debug('constructor()');

		const { data } = params as any;

		// WebRtcTransport data.
		// - .iceRole
		// - .iceParameters
		//   - .usernameFragment
		//   - .password
		//   - .iceLite
		// - .iceCandidates []
		//   - .foundation
		//   - .priority
		//   - .ip
		//   - .port
		//   - .type
		//   - .protocol
		//   - .tcpType
		// - .iceState
		// - .iceSelectedTuple
		//   - .localIp
		//   - .localPort
		//   - .remoteIp
		//   - .remotePort
		//   - .protocol
		// - .dtlsParameters
		//   - .role
		//   - .fingerprints
		//     - .sha-1
		//     - .sha-224
		//     - .sha-256
		//     - .sha-384
		//     - .sha-512
		// - .dtlsState
		// - .dtlsRemoteCert
		// - .sctpParameters
		//   - .port
		//   - .OS
		//   - .MIS
		//   - .maxMessageSize
		// - .sctpState
		this._data =
		{
			iceRole          : data.iceRole,
			iceParameters    : data.iceParameters,
			iceCandidates    : data.iceCandidates,
			iceState         : data.iceState,
			iceSelectedTuple : data.iceSelectedTuple,
			dtlsParameters   : data.dtlsParameters,
			dtlsState        : data.dtlsState,
			dtlsRemoteCert   : data.dtlsRemoteCert,
			sctpParameters   : data.sctpParameters,
			sctpState        : data.sctpState
		};

		this._handleWorkerNotifications();
	}

	/**
	 * ICE role.
	 */
	get iceRole(): 'controlled'
	{
		return this._data.iceRole;
	}

	/**
	 * ICE parameters.
	 */
	get iceParameters(): IceParameters
	{
		return this._data.iceParameters;
	}

	/**
	 * ICE candidates.
	 */
	get iceCandidates(): IceCandidate[]
	{
		return this._data.iceCandidates;
	}

	/**
	 * ICE state.
	 */
	get iceState(): IceState
	{
		return this._data.iceState;
	}

	/**
	 * ICE selected tuple.
	 */
	get iceSelectedTuple(): TransportTuple | undefined
	{
		return this._data.iceSelectedTuple;
	}

	/**
	 * DTLS parameters.
	 */
	get dtlsParameters(): DtlsParameters
	{
		return this._data.dtlsParameters;
	}

	/**
	 * DTLS state.
	 */
	get dtlsState(): DtlsState
	{
		return this._data.dtlsState;
	}

	/**
	 * Remote certificate in PEM format.
	 */
	get dtlsRemoteCert(): string | undefined
	{
		return this._data.dtlsRemoteCert;
	}

	/**
	 * SCTP parameters.
	 */
	get sctpParameters(): TransportSctpParameters | undefined
	{
		return this._data.sctpParameters;
	}

	/**
	 * SCTP state.
	 */
	get sctpState(): SctpState
	{
		return this._data.sctpState;
	}

	/**
	 * Observer.
	 *
	 * @override
	 * @emits close
	 * @emits {producer: Producer} newproducer
	 * @emits {consumer: Consumer} newconsumer
	 * @emits {producer: DataProducer} newdataproducer
	 * @emits {consumer: DataConsumer} newdataconsumer
	 * @emits {iceState: string} icestatechange
	 * @emits {iceSelectedTuple: Object} iceselectedtuplechange
	 * @emits {dtlsState: string} dtlsstatechange
	 * @emits {sctpState: string} sctpstatechange
	 */
	get observer(): EnhancedEventEmitter
	{
		return this._observer;
	}

	/**
	 * Close the WebRtcTransport.
	 *
	 * @override
	 */
	close(): void
	{
		if (this._closed)
			return;

		this._data.iceState = 'closed';
		this._data.iceSelectedTuple = undefined;
		this._data.dtlsState = 'closed';

		if (this._data.sctpState)
			this._data.sctpState = 'closed';

		super.close();
	}

	/**
	 * Router was closed.
	 *
	 * @private
	 * @override
	 */
	routerClosed(): void
	{
		if (this._closed)
			return;

		this._data.iceState = 'closed';
		this._data.iceSelectedTuple = undefined;
		this._data.dtlsState = 'closed';

		if (this._data.sctpState)
			this._data.sctpState = 'closed';

		super.routerClosed();
	}

	/**
	 * Provide the WebRtcTransport remote parameters.
	 *
	 * @override
	 */
	async connect({ dtlsParameters }: { dtlsParameters: DtlsParameters }): Promise<void>
	{
		logger.debug('connect()');

		const reqData = { dtlsParameters };

		const data =
			await this._channel.request('transport.connect', this._internal, reqData);

		// Update data.
		this._data.dtlsParameters.role = data.dtlsLocalRole;
	}

	/**
	 * Set maximum incoming bitrate for receiving media.
	 */
	async setMaxIncomingBitrate(bitrate: number): Promise<void>
	{
		logger.debug('setMaxIncomingBitrate() [bitrate:%s]', bitrate);

		const reqData = { bitrate };

		await this._channel.request(
			'transport.setMaxIncomingBitrate', this._internal, reqData);
	}

	/**
	 * Restart ICE.
	 */
	async restartIce(): Promise<IceParameters>
	{
		logger.debug('restartIce()');

		const data =
			await this._channel.request('transport.restartIce', this._internal);

		const { iceParameters } = data;

		this._data.iceParameters = iceParameters;

		return iceParameters;
	}

	private _handleWorkerNotifications(): void
	{
		this._channel.on(this._internal.transportId, (event: string, data?: any) =>
		{
			switch (event)
			{
				case 'icestatechange':
				{
					const { iceState } = data;

					this._data.iceState = iceState;

					this.safeEmit('icestatechange', iceState);

					// Emit observer event.
					this._observer.safeEmit('icestatechange', iceState);

					break;
				}

				case 'iceselectedtuplechange':
				{
					const { iceSelectedTuple } = data;

					this._data.iceSelectedTuple = iceSelectedTuple;

					this.safeEmit('iceselectedtuplechange', iceSelectedTuple);

					// Emit observer event.
					this._observer.safeEmit('iceselectedtuplechange', iceSelectedTuple);

					break;
				}

				case 'dtlsstatechange':
				{
					const { dtlsState, dtlsRemoteCert } = data;

					this._data.dtlsState = dtlsState;

					if (dtlsState === 'connected')
						this._data.dtlsRemoteCert = dtlsRemoteCert;

					this.safeEmit('dtlsstatechange', dtlsState);

					// Emit observer event.
					this._observer.safeEmit('dtlsstatechange', dtlsState);

					break;
				}

				case 'sctpstatechange':
				{
					const { sctpState } = data;

					this._data.sctpState = sctpState;

					this.safeEmit('sctpstatechange', sctpState);

					// Emit observer event.
					this._observer.safeEmit('sctpstatechange', sctpState);

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
