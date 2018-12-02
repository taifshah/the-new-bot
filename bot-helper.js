'use strict';

let sprintf = require(`sprintf-js`).sprintf
    , Message = require(`discord.js`).Message
    , messages = require(`./messages`)
    , ConfigProvider = require(`./config/provider`)
    , ConfigValidator = require(`./config/validator`)
    , ConfigValuePreformatter = require(`./config/value-preformatter`)
    , Adapter = require(`./adapter`).Adapter
    , tool = require(`./tool`)
;

module.exports = class BotHelper {

    static updateVotingPowerStatus(bot, username) {
        Adapter.instance().processAccountInfo(username, function (account) {
            bot.user.setActivity(sprintf(`VP - %s%%.`, tool.calculateVotingPower(account)), { type: `WATCHING` });
        });
    }

    static handleBotCommand(command, params, message) {
        switch (command) {
            case `help`:
            case `info`:
                BotHelper.handleHelpCommand(message);
                break;
            case `config`:
                if (false === BotHelper.checkUserPermission(command, message)) {
                    message.channel.send(sprintf(
                        messages.permissionDenied,
                        message.author.id,
                        ConfigProvider.get(`commandPrefix`),
                        command
                    ));

                    return false;
                }
                BotHelper.handleConfigCommand(params, message);
                break;
            case `upvote`:
                BotHelper.handleUpvoteCommand(message, params);
                break;
            default:
                message.channel.send(sprintf(
                    messages.unsupportedCommand,
                    message.author.id,
                    ConfigProvider.get(`commandPrefix`),
                    command
                ));
        }
    }

    static handleHelpCommand(message) {
        message.channel.send(sprintf(
            messages.info,
            message.author.id,
            ConfigProvider.get(`username`),
            ConfigProvider.get(`commandPrefix`)
        ))
    }

    static handleConfigCommand(params, message) {
        if (params.length === 0) {
            message.channel.send(sprintf(
                messages.configInfo,
                message.author.id,
                ConfigProvider.get(`commandPrefix`)
            ));

            return;
        }
        if (params.length === 1) {
            message.channel.send(sprintf(
                messages.configParameterValue,
                message.author.id,
                params[0],
                JSON.stringify(ConfigProvider.get(params[0]))
            ));

            return;
        }

        const parameterName = params[0]
            , parameterValue = ConfigValuePreformatter.run(parameterName, params.splice(1))
        ;

        let errors = [];
        if (undefined === parameterValue) {
            errors = [sprintf(`Config parameter "%s" cannot be changed.`, parameterName)];
        } else {
            errors = ConfigValidator.validate(parameterName, parameterValue);
        }

        if (errors.length) {
            message.channel.send(sprintf(
                messages.configParameterValueError,
                message.author.id,
                parameterName,
                JSON.stringify(errors)
            ));

            return;
        }

        ConfigProvider.set(parameterName, parameterValue);
        message.channel.send(sprintf(
            messages.configParameterValueChanged,
            message.author.id,
            parameterName,
            JSON.stringify(ConfigProvider.get(parameterName))
        ));
    }

    static handleUpvoteCommand(message, params) {
        if (params.length < 1 || !params[0]) {
            console.error(`Failed to receive post URL.`, params);
            message.channel.send(sprintf(
                messages.upvotePostUrlError,
                message.author.id,
                ConfigProvider.get(`commandPrefix`)
            ));

            return
        }
        let postParams = tool.parsePostUrl(params[0]);
        if (postParams.length < 2 || !postParams.author || !postParams.permlink) {
            console.error(`Failed to parse post URL`, postParams);
            message.channel.send(sprintf(
                messages.upvotePostNotFound,
                message.author.id,
                ConfigProvider.get(`commandPrefix`)
            ));

            return
        }

        Adapter.instance().processGetContent(
            postParams.author,
            postParams.permlink,
            function (result) {
                let voterUsername = ConfigProvider.get(`username`);

                if (
                    `active_votes` in result
                    && result.active_votes.length > 0
                    && tool.isArrayContainsProperty(result.active_votes, `voter`, voterUsername)
                ) {
                    message.channel.send(sprintf(
                        messages.upvotePostVotedAlready,
                        message.author.id,
                        voterUsername
                    ));

                    return;
                }
                Adapter.instance().processVote(
                    ConfigProvider.get(`postingKey`),
                    voterUsername,
                    postParams.author,
                    postParams.permlink,
                    ConfigProvider.get(`weight`) * 100,
                    function () {
                        message.channel.send(sprintf(messages.upvoteSuccess, message.author.id, voterUsername));
                    },
                    function () {
                        message.channel.send(sprintf(messages.systemError, message.author.id));
                    }
                );
            },
            function (result) {
                if (result && result.id === 0) {
                    message.channel.send(sprintf(messages.upvotePostNotFound, message.author.id));
                } else {
                    message.channel.send(sprintf(messages.systemError, message.author.id));
                }
            }
        );
    }

    /**
     * Checks user permission to perform command.
     * @param {string} command Name of command to check.
     * @param {Message} message Message object in which command was received.
     *
     * @return {boolean} Whether user has permission to perform command or not.
     */
    static checkUserPermission(command, message) {
        let admins = ConfigProvider.get(`adminList`);
        if (undefined === admins) {
            return true;
        } else {
            return admins.includes(message.author.id);
        }
    }
};
