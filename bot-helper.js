'use strict';

const chrono = require(`chrono-node`)
    , sprintf = require(`sprintf-js`).sprintf
    , DiscordMessage = require(`discord.js`).Message
    , { ChainAdapter, ChainConstant, ChainTool } = require(`chain-tools-js`)
    , messages = require(`./messages`)
    , ConfigParameter = require(`./config/parameter`)
    , ConfigProvider = require(`./config/provider`)
    , ConfigValidator = require(`./config/validator`)
    , ConfigValuePreFormatter = require(`./config/value-pre-formatter`)
    , ConfigValuePostFormatter = require(`./config/value-post-formatter`)
    , tool = require(`./tool`)
;

module.exports = class BotHelper {

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
                        ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
                        command
                    ));

                    return false;
                }
                BotHelper.handleConfigCommand(params, message);
                break;
            case `upvote`:
                BotHelper.handleUpvoteCommand(params, message);
                break;
            default:
                message.channel.send(sprintf(
                    messages.unsupportedCommand,
                    message.author.id,
                    ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
                    command
                ));
        }
    }

    static handleHelpCommand(message) {
        message.channel.send(sprintf(
            messages.info,
            message.author.id,
            ConfigProvider.get(ConfigParameter.USERNAME),
            ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
        ))
    }

    static handleConfigCommand(params, message) {
        if (params.length === 0) {
            message.channel.send(sprintf(
                messages.configInfo,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
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
            , parameterValue = ConfigValuePreFormatter.run(parameterName, params.splice(1))
        ;

        let errors = [];
        if (null === parameterValue) {
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

        ConfigProvider.set(parameterName, ConfigValuePostFormatter.run(parameterName, parameterValue));
        message.channel.send(sprintf(
            messages.configParameterValueChanged,
            message.author.id,
            parameterName,
            JSON.stringify(ConfigProvider.get(parameterName))
        ));
    }

    static async handleUpvoteCommand(params, message) {
        if (params.length < 1 || !params[0]) {
            console.error(`Failed to receive post URL.`, params);
            message.channel.send(sprintf(
                messages.upvotePostUrlError,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));

            return
        }
        const postParams = tool.parsePostUrl(params[0]);
        if (postParams.length < 2 || !postParams.author || !postParams.permlink) {
            console.error(`Failed to parse post URL`, postParams);
            message.channel.send(sprintf(
                messages.upvotePostNotFound,
                message.author.id,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));

            return
        }

        const minVp = ConfigProvider.get(ConfigParameter.MIN_VP)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
        ;
        if (minVp) {
            let account = null;
            try {
                account = await wekuAdapter.apiGetAccount(voterUsername);
            } catch (err) {
                console.error(err);
                message.channel.send(sprintf(messages.systemError, message.author.id));

                return;
            }

            const accountVp = ChainTool.calculateAccountVotingPower(account);
            if (accountVp < minVp) {
                message.channel.send(sprintf(
                    messages.upvoteVpTooLow
                    , message.author.id
                    , voterUsername
                    , accountVp
                    , minVp
                ));

                return;
            }
        }

        let postContent = null;
        try {
            postContent = await wekuAdapter.apiGetContent(
                postParams.author
                , postParams.permlink
            );
        } catch (err) {
            console.error(err);
            message.channel.send(sprintf(messages.systemError, message.author.id));

            return;
        }
        if (0 === postContent.id) {
            message.channel.send(sprintf(messages.upvotePostNotFound, message.author.id));

            return;
        }
        if (
            `active_votes` in postContent
            && postContent.active_votes.length > 0
            && tool.isArrayContainsProperty(postContent.active_votes, `voter`, voterUsername)
        ) {
            message.channel.send(sprintf(
                messages.upvotePostVotedAlready,
                message.author.id,
                voterUsername
            ));

            return;
        }

        const minPostAge = ConfigProvider.get(ConfigParameter.MIN_POST_AGE)
            , maxPostAge = ConfigProvider.get(ConfigParameter.MAX_POST_AGE)
            , creationDateKey = `created`
        ;
        if (creationDateKey in postContent && (minPostAge || maxPostAge)) {
            const postCreatedDate = chrono.parseDate(postContent[creationDateKey]);
            if (minPostAge) {
                const minPostDate = chrono.parseDate(minPostAge);
                if (postCreatedDate > minPostDate) {
                    message.channel.send(sprintf(
                        messages.upvotePostTooEarly,
                        message.author.id,
                        minPostAge,
                        maxPostAge
                    ));

                    return;
                }
            }
            if (maxPostAge) {
                const maxPostDate = chrono.parseDate(maxPostAge);
                if (postCreatedDate < maxPostDate) {
                    message.channel.send(sprintf(
                        messages.upvotePostTooLate,
                        message.author.id,
                        minPostAge,
                        maxPostAge
                    ));

                    return;
                }
            }
        }

        wekuAdapter.broadcastVote(
            postParams.author,
            postParams.permlink,
            voterUsername,
            ConfigProvider.get(ConfigParameter.POSTING_KEY),
            ConfigProvider.get(ConfigParameter.WEIGHT) * 100
        ).then((result) => {
            message.channel.send(sprintf(
                messages.upvoteSuccess
                , message.author.id
                , voterUsername
            ));
        }).catch((err) => {
            console.error(err);

            message.channel.send(sprintf(messages.systemError, message.author.id));
        });
    }

    /**
     * Checks user permission to perform command.
     * @param {string}         command Name of command to check.
     * @param {DiscordMessage} message Message object in which command was received.
     *
     * @return {boolean} Whether user has permission to perform command or not.
     */
    static checkUserPermission(command, message) {
        let admins = ConfigProvider.get(ConfigParameter.ADMIN_LIST);
        if (null === admins) {
            return true;
        } else {
            return admins.includes(message.author.id);
        }
    }

};
