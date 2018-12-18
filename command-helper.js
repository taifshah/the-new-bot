'use strict';

const { sprintf } = require(`sprintf-js`)
    , tool = require(`./tool`)
;

module.exports = class {

    /**
     * @param {string} commandName
     * @returns {string}
     */
    static buildPreEventName(commandName) {
        return sprintf(`pre%s`, tool.ucfirst(commandName));
    }

    /**
     * @param {string} commandName
     * @returns {string}
     */
    static buildPostEventName(commandName) {
        return sprintf(`post%s`, tool.ucfirst(commandName));
    }

};
