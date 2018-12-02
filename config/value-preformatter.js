'use strict';

module.exports = class ConfigValuePreformatter {
    /**
     * Formats received new config parameter value to working look
     * @param {string} name    Name of config parameter.
     * @param {Array}  options Array with options for new value of config parameter.
     *
     * @return {*|undefined} Working value of config parameter or undefined for non supported values
     */
    static run(name, options) {
        switch (name) {
            case `weight`:
                return Number(options[0]);
            default:
                return undefined;
        }
    }
};
