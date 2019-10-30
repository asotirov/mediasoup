"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const process = require("process");
const path = require("path");
const child_process_1 = require("child_process");
const uuidv4 = require("uuid/v4");
const Logger_1 = require("./Logger");
const EnhancedEventEmitter_1 = require("./EnhancedEventEmitter");
const ortc = require("./ortc");
const Channel_1 = require("./Channel");
const Router_1 = require("./Router");
// If env MEDIASOUP_WORKER_BIN is given, use it as worker binary.
// Otherwise if env MEDIASOUP_BUILDTYPE is 'Debug' use the Debug binary.
// Otherwise use the Release binary.
let workerBin = process.env.MEDIASOUP_WORKER_BIN
    ? process.env.MEDIASOUP_WORKER_BIN
    : process.env.MEDIASOUP_BUILDTYPE === 'Debug'
        ? path.join(__dirname, '..', 'worker', 'out', 'Debug', 'mediasoup-worker')
        : path.join(__dirname, '..', 'worker', 'out', 'Release', 'mediasoup-worker');
const logger = new Logger_1.default('Worker');
class Worker extends EnhancedEventEmitter_1.default {
    /**
     * @private
     * @emits died
     * @emits @succeed
     * @emits @settingserror
     * @emits @failure
     */
    constructor({ logLevel, logTags, rtcMinPort, rtcMaxPort, dtlsCertificateFile, dtlsPrivateKeyFile }) {
        super();
        this._closed = false;
        this._routers = new Set();
        this._observer = new EnhancedEventEmitter_1.default();
        logger.debug('constructor()');
        let workerArgs = [];
        if (process.env.MEDIASOUP_USE_VALGRIND) {
            const mediasoupBin = workerBin;
            workerBin = process.env.MEDIASOUP_VALGRIND_BIN || 'valgrind';
            if (process.env.MEDIASOUP_VALGRIND_OPTIONS)
                workerArgs = workerArgs.concat(process.env.MEDIASOUP_VALGRIND_OPTIONS.split(/\s+/));
            workerArgs.push(mediasoupBin);
        }
        if (typeof logLevel === 'string' && logLevel)
            workerArgs.push(`--logLevel=${logLevel}`);
        for (const logTag of (Array.isArray(logTags) ? logTags : [])) {
            if (typeof logTag === 'string' && logTag)
                workerArgs.push(`--logTag=${logTag}`);
        }
        if (typeof rtcMinPort === 'number' || !Number.isNaN(parseInt(rtcMinPort)))
            workerArgs.push(`--rtcMinPort=${rtcMinPort}`);
        if (typeof rtcMaxPort === 'number' || !Number.isNaN(parseInt(rtcMaxPort)))
            workerArgs.push(`--rtcMaxPort=${rtcMaxPort}`);
        if (typeof dtlsCertificateFile === 'string' && dtlsCertificateFile)
            workerArgs.push(`--dtlsCertificateFile=${dtlsCertificateFile}`);
        if (typeof dtlsPrivateKeyFile === 'string' && dtlsPrivateKeyFile)
            workerArgs.push(`--dtlsPrivateKeyFile=${dtlsPrivateKeyFile}`);
        logger.debug('spawning worker process: %s %s', workerBin, workerArgs.join(' '));
        // mediasoup-worker child process.
        this._child = child_process_1.spawn(
        // command
        workerBin, 
        // args
        workerArgs, 
        // options
        {
            env: {
                MEDIASOUP_VERSION: '3.3.0-pre1'
            },
            detached: false,
            // fd 0 (stdin)   : Just ignore it.
            // fd 1 (stdout)  : Pipe it for 3rd libraries that log their own stuff.
            // fd 2 (stderr)  : Same as stdout.
            // fd 3 (channel) : Producer Channel fd.
            // fd 4 (channel) : Consumer Channel fd.
            stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe']
        });
        this._workerLogger = new Logger_1.default(`worker[pid:${this._child.pid}]`);
        // Worker process identifier (PID).
        this._pid = this._child.pid;
        // Channel instance.
        this._channel = new Channel_1.default({
            producerSocket: this._child.stdio[3],
            consumerSocket: this._child.stdio[4],
            pid: this._pid
        });
        let spawnDone = false;
        // Listen for 'ready' notification.
        this._channel.once(String(this._pid), (event) => {
            if (!spawnDone && event === 'running') {
                spawnDone = true;
                logger.debug('worker process running [pid:%s]', this._pid);
                this.emit('@success');
            }
        });
        this._child.on('exit', (code, signal) => {
            this._child = undefined;
            this.close();
            if (!spawnDone) {
                spawnDone = true;
                if (code === 42) {
                    logger.error('worker process failed due to wrong settings [pid:%s]', this._pid);
                    this.emit('@failure', new TypeError('wrong settings'));
                }
                else {
                    logger.error('worker process failed unexpectedly [pid:%s, code:%s, signal:%s]', this._pid, code, signal);
                    this.emit('@failure', new Error(`[pid:${this._pid}, code:${code}, signal:${signal}]`));
                }
            }
            else {
                logger.error('worker process died unexpectedly [pid:%s, code:%s, signal:%s]', this._pid, code, signal);
                this.safeEmit('died', new Error(`[pid:${this._pid}, code:${code}, signal:${signal}]`));
            }
        });
        this._child.on('error', (error) => {
            this._child = undefined;
            this.close();
            if (!spawnDone) {
                spawnDone = true;
                logger.error('worker process failed [pid:%s]: %s', this._pid, error.message);
                this.emit('@failure', error);
            }
            else {
                logger.error('worker process error [pid:%s]: %s', this._pid, error.message);
                this.safeEmit('died', error);
            }
        });
        // Be ready for 3rd party worker libraries logging to stdout.
        this._child.stdout.on('data', (buffer) => {
            for (const line of buffer.toString('utf8').split('\n')) {
                if (line)
                    this._workerLogger.debug(`(stdout) ${line}`);
            }
        });
        // In case of a worker bug, mediasoup will log to stderr.
        this._child.stderr.on('data', (buffer) => {
            for (const line of buffer.toString('utf8').split('\n')) {
                if (line)
                    this._workerLogger.error(`(stderr) ${line}`);
            }
        });
    }
    /**
     * Worker process identifier (PID).
     */
    get pid() {
        return this._pid;
    }
    /**
     * Whether the Worker is closed.
     */
    get closed() {
        return this._closed;
    }
    /**
     * Observer.
     *
     * @emits close
     * @emits {router: Router} newrouter
     */
    get observer() {
        return this._observer;
    }
    /**
     * Close the Worker.
     */
    close() {
        if (this._closed)
            return;
        logger.debug('close()');
        this._closed = true;
        // Kill the worker process.
        if (this._child) {
            // Remove event listeners but leave a fake 'error' hander to avoid
            // propagation.
            this._child.removeAllListeners('exit');
            this._child.removeAllListeners('error');
            this._child.on('error', () => { });
            this._child.kill('SIGTERM');
            this._child = undefined;
        }
        // Close the Channel instance.
        this._channel.close();
        // Close every Router.
        for (const router of this._routers) {
            router.workerClosed();
        }
        this._routers.clear();
        // Emit observer event.
        this._observer.safeEmit('close');
    }
    /**
     * Dump Worker.
     */
    dump() {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug('dump()');
            return this._channel.request('worker.dump');
        });
    }
    /**
     * Update settings.
     */
    updateSettings({ logLevel, logTags } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug('updateSettings()');
            const reqData = { logLevel, logTags };
            yield this._channel.request('worker.updateSettings', undefined, reqData);
        });
    }
    /**
     * Create a Router.
     */
    createRouter({ mediaCodecs } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug('createRouter()');
            // This may throw.
            const rtpCapabilities = ortc.generateRouterRtpCapabilities(mediaCodecs);
            const internal = { routerId: uuidv4() };
            yield this._channel.request('worker.createRouter', internal);
            const data = { rtpCapabilities };
            const router = new Router_1.default({
                internal,
                data,
                channel: this._channel
            });
            this._routers.add(router);
            router.on('@close', () => this._routers.delete(router));
            // Emit observer event.
            this._observer.safeEmit('newrouter', router);
            return router;
        });
    }
}
exports.default = Worker;
