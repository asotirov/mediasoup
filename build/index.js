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
const Logger_1 = require("./Logger");
const EnhancedEventEmitter_1 = require("./EnhancedEventEmitter");
const Worker_1 = require("./Worker");
const utils = require("./utils");
const supportedRtpCapabilities_1 = require("./supportedRtpCapabilities");
/**
 * Expose mediasoup version.
 */
exports.version = '3.2.5';
/**
 * Expose parseScalabilityMode() function and ScalabilityMode interface.
 */
var scalabilityModes_1 = require("./scalabilityModes");
exports.parseScalabilityMode = scalabilityModes_1.parse;
const logger = new Logger_1.default();
const observer = new EnhancedEventEmitter_1.default();
exports.observer = observer;
/**
 * Create a Worker.
 */
function createWorker({ logLevel = 'error', logTags, rtcMinPort = 10000, rtcMaxPort = 59999, dtlsCertificateFile, dtlsPrivateKeyFile } = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.debug('createWorker()');
        const worker = new Worker_1.default({
            logLevel,
            logTags,
            rtcMinPort,
            rtcMaxPort,
            dtlsCertificateFile,
            dtlsPrivateKeyFile
        });
        return new Promise((resolve, reject) => {
            worker.on('@success', () => {
                // Emit observer event.
                observer.safeEmit('newworker', worker);
                resolve(worker);
            });
            worker.on('@failure', reject);
        });
    });
}
exports.createWorker = createWorker;
/**
 * Get a cloned copy of the mediasoup supported RTP capabilities.
 */
function getSupportedRtpCapabilities() {
    return utils.clone(supportedRtpCapabilities_1.default);
}
exports.getSupportedRtpCapabilities = getSupportedRtpCapabilities;
