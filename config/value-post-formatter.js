'use strict';

const chrono = require(`chrono-node`)
    , moment = require(`moment`)
    , ConfigParameter = require(`./parameter`)
;

module.exports = class ConfigValuePostFormatter {
    /**
     * Formats received validated config parameter value to working look
     * @param {string} name  Name of config parameter.
     * @param {*}      value New value for config parameter.
     *
     * @return {*|null} Working value of config parameter or null for non supported values
     */
    static run(name, value) {
        switch (name) {
            case ConfigParameter.WEIGHT:
            case ConfigParameter.MIN_VP:
                return value;
            case ConfigParameter.MIN_POST_AGE:
            case ConfigParameter.MAX_POST_AGE:
                const parsedDate = chrono.parseDate(value);

                return moment(parsedDate).fromNow();
            default:
                return null;
        }
    }
};
