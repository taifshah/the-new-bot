'use strict';

const { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , CommandEventError = require(`../command-event-error`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
    , ConfigValidator = require(`../config/validator`)
    , ConfigValuePreFormatter = require(`../config/value-pre-formatter`)
    , ConfigValuePostFormatter = require(`../config/value-post-formatter`)
;

const _parseParams = Symbol('parseParams');

module.exports = class extends require(`./abstract-command`) {

    /**
     * @returns {string}
     */
    static getName() {
        return `config`;
    }

    /**
     * {@inheritdoc}
     */
    static getPreMethods() {
        return [
            `securityCheck`
            , `infoMessage`
            , `retrieveParameter`
            , `validation`
        ];
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static securityCheck(params, message) {
        const commandName = this.getName();
        if (BotHelper.checkUserPermission(commandName, message)) {
            return;
        }

        const errorMessage = sprintf(
            messages.permissionDenied,
            BotHelper.getAuthorId(message),
            ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
            commandName
        );
        throw new CommandEventError(errorMessage);
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static infoMessage(params, message) {
        if (params.length === 0) {
            throw new CommandEventError(sprintf(
                messages.configInfo,
                BotHelper.getAuthorId(message),
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static retrieveParameter(params, message) {
        if (params.length === 1) {
            throw new CommandEventError(sprintf(
                messages.configParameterValue,
                BotHelper.getAuthorId(message),
                params[0],
                JSON.stringify(ConfigProvider.get(params[0]))
            ));
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static validation(params, message) {
        const { paramName, paramValue } = this[_parseParams](params);

        let errors = [];
        if (null === paramValue) {
            errors = [sprintf(`Config parameter "%s" cannot be changed.`, paramName)];
        } else {
            errors = ConfigValidator.validate(paramName, paramValue);
        }

        if (errors.length) {
            throw new CommandEventError(sprintf(
                messages.configParameterValueError,
                BotHelper.getAuthorId(message),
                paramName,
                JSON.stringify(errors)
            ));
        }
    }

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     */
    static run(params, message) {
        const { paramName, paramValue } = this[_parseParams](params);

        ConfigProvider.set(
            paramName
            , ConfigValuePostFormatter.run(paramName, paramValue)
        );
        BotHelper.sendMessage(
            message
            , sprintf(
                messages.configParameterValueChanged
                , BotHelper.getAuthorId(message)
                , paramName
                , JSON.stringify(ConfigProvider.get(paramName))
            )
        );
    }

    // private
    static [_parseParams](params) {
        let paramsCopy = [...params];
        return {
            paramName: paramsCopy[0]
            , paramValue: ConfigValuePreFormatter.run(
                paramsCopy[0]
                , paramsCopy.splice(1)
            )
        }
    }

};
