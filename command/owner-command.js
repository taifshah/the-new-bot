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
        return `owner`;
    }

    /**
     * @inheritDoc
     */
    static run(params, message) {
        const adminMention = ConfigProvider.get(ConfigParameter.ADMIN_LIST)
            .map((item) => {
                return sprintf(
                    ConfigProvider.get(ConfigParameter.DISCORD_USER_MENTION_PATTERN)
                    , item
                );
            })
        ;
        BotHelper.sendMessage(
            message
            , sprintf(
                messages.ownerInfo
                , BotHelper.getAuthorId(message)
                , adminMention.join(`, `)
            )
        );
    }

};
