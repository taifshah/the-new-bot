'use strict';

const { sprintf } = require(`sprintf-js`)
    , EventEmitter = require(`eventemitter3`)
    , Discord = require(`discord.js`)
    , BotHelper = require(`./bot-helper`)
    , ConfigProvider = require(`./config/provider`)
    , ConfigParameter = require(`./config/parameter`)
    , CommandHelper = require(`./command-helper`)
    , CommandEventError = require(`./command-event-error`)
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
    static async run(commandName, params, message) {
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
            await this.emitEvent(
                commandEmitter
                , CommandHelper.buildPreEventName(commandName)
                , params
                , message
            );
            await this.emitEvent(commandEmitter, commandName, params, message);
            await this.emitEvent(
                commandEmitter
                , CommandHelper.buildPostEventName(commandName)
                , params
                , message
            );
        } catch (err) {
            if (err instanceof CommandEventError) {
                BotHelper.sendMessage(message, err.message);
            } else {
                console.error(err);

                BotHelper.sendMessage(
                    message
                    , sprintf(messages.systemError, messageAuthorId)
                );
            }
        }
    }

    /**
     * Emits events in sync way (wait async one)
     * @param {EventEmitter} emitter
     * @param {string}       eventName
     * @param {Array}        params
     * @returns {Promise<void>}
     */
    static async emitEvent(emitter, eventName, ...params) {
        const events = emitter.listeners(eventName);
        if (0 === events.length) {
            return;
        }

        const commonContext = emitter._events[eventName].context;
        for (let i in events) {
            if (`AsyncFunction` === events[i].constructor.name) {
                await events[i].apply(
                    commonContext || emitter._events[eventName][i].context
                    , params
                );
            } else {
                events[i].apply(
                    commonContext || emitter._events[eventName][i].context
                    , params
                );
            }
        }
    }

};
