'use strict';

const { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
;

module.exports = class extends require(`./abstract-command`) {

    /**
     * @returns {string}
     */
    static getName() {
        return `help`;
    }

    /**
     * @returns {string[]}
     */
    static getAliases() {
        return [`info`];
    }

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     */
    static run(params, message) {
        BotHelper.sendMessage(
            message
            , sprintf(
                messages.info
                , BotHelper.getAuthorId(message)
                , ConfigProvider.get(ConfigParameter.USERNAME)
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            )
        );
    }

};
