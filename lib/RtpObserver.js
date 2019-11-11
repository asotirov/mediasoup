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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Logger_1 = __importDefault(require("./Logger"));
const EnhancedEventEmitter_1 = __importDefault(require("./EnhancedEventEmitter"));
const logger = new Logger_1.default('RtpObserver');
class RtpObserver extends EnhancedEventEmitter_1.default {
    /**
     * @private
     * @interface
     * @emits routerclose
     * @emits @close
     */
    constructor({ internal, channel, appData, getProducerById }) {
        super(logger);
        // Closed flag.
        this._closed = false;
        // Paused flag.
        this._paused = false;
        logger.debug('constructor()');
        this._internal = internal;
        this._channel = channel;
        this._appData = appData;
        this._getProducerById = getProducerById;
    }
    /**
     * RtpObserver id.
     */
    get id() {
        return this._internal.rtpObserverId;
    }
    /**
     * Whether the RtpObserver is closed.
     */
    get closed() {
        return this._closed;
    }
    /**
     * Whether the RtpObserver is paused.
     */
    get paused() {
        return this._paused;
    }
    /**
     * App custom data.
     */
    get appData() {
        return this._appData;
    }
    /**
     * Invalid setter.
     */
    set appData(appData) {
        throw new Error('cannot override appData object');
    }
    /**
     * Close the RtpObserver.
     */
    close() {
        if (this._closed)
            return;
        logger.debug('close()');
        this._closed = true;
        // Remove notification subscriptions.
        this._channel.removeAllListeners(this._internal.rtpObserverId);
        this._channel.request('rtpObserver.close', this._internal)
            .catch(() => { });
        this.emit('@close');
    }
    /**
     * Router was closed.
     *
     * @private
     */
    routerClosed() {
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
    pause() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._paused)
                return;
            logger.debug('pause()');
            yield this._channel.request('rtpObserver.pause', this._internal);
            this._paused = true;
        });
    }
    /**
     * Resume the RtpObserver.
     */
    resume() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._paused)
                return;
            logger.debug('resume()');
            yield this._channel.request('rtpObserver.resume', this._internal);
            this._paused = false;
        });
    }
    /**
     * Add a Producer to the RtpObserver.
     */
    addProducer({ producerId }) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug('addProducer()');
            const internal = Object.assign(Object.assign({}, this._internal), { producerId });
            yield this._channel.request('rtpObserver.addProducer', internal);
        });
    }
    /**
     * Remove a Producer from the RtpObserver.
     */
    removeProducer({ producerId }) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.debug('removeProducer()');
            const internal = Object.assign(Object.assign({}, this._internal), { producerId });
            yield this._channel.request('rtpObserver.removeProducer', internal);
        });
    }
}
exports.default = RtpObserver;
