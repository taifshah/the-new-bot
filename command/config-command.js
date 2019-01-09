'use strict';

const { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
    , ConfigValidator = require(`../config/validator`)
    , ConfigValuePreFormatter = require(`../config/value-pre-formatter`)
    , ConfigValuePostFormatter = require(`../config/value-post-formatter`)
;

const _parseParams = Symbol('parseParams');

module.exports = class extends require(`./abstract-command`) {

    /**
     * @inheritDoc
     */
    static getName() {
        return `config`;
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     *
     * @return {string|null} Access denied message, or null - has access
     */
    static securityCheck(params, message) {
        const commandName = this.getName();
        if (BotHelper.checkUserPermission(commandName, message)) {
            return null;
        }

        return sprintf(
            messages.permissionDenied,
            BotHelper.getAuthorId(message),
            ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
            commandName
        );
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     *
     * @return {string|null} Detailed information about command, or null - another case
     */
    static infoMessageCase(params, message) {
        if (params.length === 0) {
            return sprintf(
                messages.configInfo,
                BotHelper.getAuthorId(message),
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            );
        } else {
            return null;
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     *
     * @return {string|null} Current config parameter, or null - another case
     */
    static retrieveParameterValueCase(params, message) {
        if (params.length === 1) {
            return sprintf(
                messages.configParameterValue,
                BotHelper.getAuthorId(message),
                params[0],
                JSON.stringify(ConfigProvider.get(params[0]))
            );
        } else {
            return null;
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     *
     * @return {string|null} Validation fail message, or null - validation success
     */
    static performValidation(params, message) {
        const { paramName, paramValue } = this[_parseParams](params);

        let errors = [];
        if (null === paramValue) {
            errors = [sprintf(`Config parameter "%s" cannot be changed.`, paramName)];
        } else {
            errors = ConfigValidator.validate(paramName, paramValue);
        }

        if (errors.length) {
            return sprintf(
                messages.configParameterValueError,
                BotHelper.getAuthorId(message),
                paramName,
                JSON.stringify(errors)
            );
        } else {
            return null;
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     *
     * @return {string} Config Parameter was changed message
     */
    static changeParamValueCase(params, message) {
        const { paramName, paramValue } = this[_parseParams](params);

        ConfigProvider.set(
            paramName
            , ConfigValuePostFormatter.run(paramName, paramValue)
        );
        return sprintf(
            messages.configParameterValueChanged
            , BotHelper.getAuthorId(message)
            , paramName
            , JSON.stringify(ConfigProvider.get(paramName))
        );
    }

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     */
    static run(params, message) {
        let userMessage = this.securityCheck(params, message);
        if (null === userMessage) {
            userMessage = this.infoMessageCase(params, message);
        }
        if (null === userMessage) {
            userMessage = this.retrieveParameterValueCase(params, message);
        }
        if (null === userMessage) {
            userMessage = this.performValidation(params, message);
        }
        if (null === userMessage) {
            userMessage = this.changeParamValueCase(params, message);
        }

        BotHelper.sendMessage(message, userMessage);
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
