'use strict';

const { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , { ChainAdapter, ChainConstant, ChainTool } = require(`chain-tools-js`)
    , ConfigParameter = require(`./config/parameter`)
    , ConfigProvider = require(`./config/provider`)
;

module.exports = class BotHelper {

    /**
     * Updates bot's status with current VP info
     * @param {Discord.Client} bot
     * @param username
     * @returns {Promise<void>}
     */
    static async updateVotingPowerStatus(bot, username) {
        try {
            const wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
                , account = await wekuAdapter.apiGetAccount(username)
            ;
            bot.user.setActivity(
                sprintf(`VP - %s%%.`, ChainTool.calculateAccountVotingPower(account))
                , { type: `WATCHING` }
            );
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * Checks user permission to perform command.
     * @param {string}          command Name of command to check.
     * @param {Discord.Message} message Message object in which command was received.
     *
     * @return {boolean} Whether user has permission to perform command or not.
     */
    static checkUserPermission(command, message) {
        let admins = ConfigProvider.get(ConfigParameter.ADMIN_LIST);
        if (null === admins) {
            return true;
        } else {
            return admins.includes(this.getAuthorId(message));
        }
    }

    /**
     * Retrieves ID of author of message
     * @param {Discord.Message} message
     * @returns {string}
     */
    static getAuthorId(message) {
        return message.author.id;
    }

    /**
     * Sends given test to user chennel
     * @param {Discord.Message} message
     * @param {string}         text
     */
    static sendMessage(message, text) {
        message.channel.send(text);
    }

};
