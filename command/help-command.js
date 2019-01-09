'use strict';

const { sprintf } = require(`sprintf-js`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
;

module.exports = class extends require(`./abstract-command`) {

    /**
     * @inheritDoc
     */
    static getName() {
        return `help`;
    }

    /**
     * @inheritDoc
     */
    static getAliases() {
        return [`info`];
    }

    /**
     * @inheritDoc
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
