'use strict';

const { sprintf } = require(`sprintf-js`)
    , chrono = require(`chrono-node`)
    , Discord = require(`discord.js`)
    , { ChainTool, ChainAdapter, ChainConstant } = require(`chain-tools-js`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , CommandEventError = require(`../command-event-error`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
    , tool = require(`../tool`)
;

// private methods name
const _parsePostParams = Symbol('parsePostParams');

module.exports = class extends require(`./abstract-command`) {

    /**
     * @returns {string}
     */
    static getName() {
        return `upvote`;
    }

    /**
     * Provides list of possible names for command
     * @returns {string[]}
     */
    static getAliases() {
        return [`vote`];
    }

    /**
     * Provides list of methods which should be called before command's run
     * @returns {string[]}
     */
    static getPreMethods() {
        return [
            `validatePostUrl`
            , `validateVp`
            , `validatePost`
        ];
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static validatePostUrl(params, message) {
        if (params.length < 1 || !params[0]) {
            console.error(`Failed to receive post URL.`, params);

            throw new CommandEventError(sprintf(
                messages.upvotePostUrlError
                , BotHelper.getAuthorId(message)
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
        }
        const postParams = this[_parsePostParams](params);
        if (null === postParams) {
            console.error(`Failed to parse post URL`, params, postParams);

            throw new CommandEventError(sprintf(
                messages.upvotePostNotFound
                , BotHelper.getAuthorId(message)
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static async validateVp(params, message) {
        const minVp = ConfigProvider.get(ConfigParameter.MIN_VP)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
        ;
        if (null === minVp) {
            return;
        }

        let account = null;
        try {
            account = await wekuAdapter.apiGetAccount(voterUsername);
        } catch (err) {
            console.error(err);
            throw new CommandEventError(sprintf(
                messages.systemError
                , BotHelper.getAuthorId(message)
            ));
        }

        const accountVp = ChainTool.calculateAccountVotingPower(account);
        if (accountVp < minVp) {
            throw new CommandEventError(sprintf(
                messages.upvoteVpTooLow
                , BotHelper.getAuthorId(message)
                , voterUsername
                , accountVp
                , minVp
            ));
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     */
    static async validatePost(params, message) {
        const postParams = this[_parsePostParams](params)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
        ;
        let postContent = null;
        try {
            postContent = await wekuAdapter.apiGetContent(
                postParams.author
                , postParams.permlink
            );
        } catch (err) {
            console.error(err);
            throw new CommandEventError(sprintf(
                messages.systemError
                , BotHelper.getAuthorId(message))
            );
        }
        // check is Post exists
        if (0 === postContent.id) {
            throw new CommandEventError(sprintf(
                messages.upvotePostNotFound
                , BotHelper.getAuthorId(message)
            ));
        }
        // check previous votes
        if (
            `active_votes` in postContent
            && postContent.active_votes.length > 0
            && tool.isArrayContainsProperty(postContent.active_votes, `voter`, voterUsername)
        ) {
            throw new CommandEventError(sprintf(
                messages.upvotePostVotedAlready,
                BotHelper.getAuthorId(message),
                voterUsername
            ));
        }
        // check Post age
        const minPostAge = ConfigProvider.get(ConfigParameter.MIN_POST_AGE)
            , maxPostAge = ConfigProvider.get(ConfigParameter.MAX_POST_AGE)
            , creationDateKey = `created`
        ;
        if (creationDateKey in postContent && (minPostAge || maxPostAge)) {
            const postCreatedDate = chrono.parseDate(postContent[creationDateKey]);
            if (minPostAge) {
                const minPostDate = chrono.parseDate(minPostAge);
                if (postCreatedDate > minPostDate) {
                    throw new CommandEventError(sprintf(
                        messages.upvotePostTooEarly,
                        BotHelper.getAuthorId(message),
                        minPostAge,
                        maxPostAge
                    ));
                }
            }
            if (maxPostAge) {
                const maxPostDate = chrono.parseDate(maxPostAge);
                if (postCreatedDate < maxPostDate) {
                    throw new CommandEventError(sprintf(
                        messages.upvotePostTooLate,
                        BotHelper.getAuthorId(message),
                        minPostAge,
                        maxPostAge
                    ));
                }
            }
        }
    }

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     */
    static run(params, message) {
        const wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
            , postParams = this[_parsePostParams](params)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
        ;
        wekuAdapter.broadcastVote(
            postParams.author,
            postParams.permlink,
            voterUsername,
            ConfigProvider.get(ConfigParameter.POSTING_KEY),
            ConfigProvider.get(ConfigParameter.WEIGHT) * 100
        ).then((result) => {
            BotHelper.sendMessage(
                message
                , sprintf(
                    messages.upvoteSuccess
                    , BotHelper.getAuthorId(message)
                    , voterUsername
                )
            );
        }).catch((err) => {
            console.error(err);

            BotHelper.sendMessage(
                message
                , sprintf(messages.systemError, BotHelper.getAuthorId(message))
            );
        });
    }

    // private

    /**
     * Parses input params and retrieves Post params
     * @param {Array} params
     * @returns {Object|null}
     */
    static [_parsePostParams](params) {
        return ChainTool.parsePostUrl(params[0]);
    }

};
