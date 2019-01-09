'use strict';

const { sprintf } = require(`sprintf-js`)
    , EventEmitter = require(`eventemitter3`)
    , Discord = require(`discord.js`)
    , BotHelper = require(`./bot-helper`)
    , ConfigProvider = require(`./config/provider`)
    , ConfigParameter = require(`./config/parameter`)
    , HelpCommand = require(`./command/help-command`)
    , ConfigCommand = require(`./command/config-command`)
    , UpvoteCommand = require(`./command/upvote-command`)
    , messages = require(`./messages`)
;

const commandEmitter = new EventEmitter();

module.exports = class {

    /**
     * Registers available commands
     */
    static register() {
        commandEmitter.removeAllListeners();

        const commands = [ HelpCommand, ConfigCommand, UpvoteCommand ];
        commands.forEach((command) => {
            command.register(commandEmitter);
        });
    }

    /**
     * @param {string}          commandName
     * @param {Array}           params
     * @param {Discord.Message} message
     */
    static run(commandName, params, message) {
        const messageAuthorId = BotHelper.getAuthorId(message);
        if (0 === commandEmitter.listenerCount(commandName)) {
            BotHelper.sendMessage(
                message
                , sprintf(
                    messages.unsupportedCommand
                    , messageAuthorId
                    , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
                    , commandName
                )
            );
            return;
        }
        try {
            commandEmitter.emit(commandName, params, message);
        } catch (err) {
            console.error(err);

            BotHelper.sendMessage(
                message
                , sprintf(messages.systemError, messageAuthorId)
            );
        }
    }

};
