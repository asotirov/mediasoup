"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const randomNumber = require("random-number");
const randomNumberGenerator = randomNumber.generator({
    min: 100000000,
    max: 999999999,
    integer: true
});
exports.generateRandomNumber = randomNumberGenerator;
/**
 * Clones the given object/array.
 */
function clone(obj) {
    if (typeof obj !== 'object')
        return {};
    return JSON.parse(JSON.stringify(obj));
}
exports.clone = clone;
