'use strict';

const Validator = require(`better-validator`);

module.exports = class ConfigValidator {
    /**
     * Validates received config parameter name and value
     * @param {string} name  Name of config parameter.
     * @param {*}      value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validate(name, value) {
        switch (name) {
            case `weight`:
                return ConfigValidator.validateWeight(value);
            default:
                return [];
        }
    }

    /**
     * Validates "weight" config parameter
     * @param {*} value New value for config parameter.
     *
     * @return {Array} List of errors, empty if all fine.
     */
    static validateWeight(value) {
        const validator = new Validator();

        validator(value).isNumber().isInRange(0.01, 100);

        return validator.run();
    }
};
