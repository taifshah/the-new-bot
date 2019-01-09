'use strict';

const { sprintf } = require(`sprintf-js`)
    , chrono = require(`chrono-node`)
    , moment = require(`moment`)
    , Discord = require(`discord.js`)
    , { ChainTool, ChainAdapter, ChainConstant } = require(`chain-tools-js`)
    , DisplayToUserException = require(`../exception/DisplayToUserException`)
    , messages = require(`../messages`)
    , BotHelper = require(`../bot-helper`)
    , ConfigParameter = require(`../config/parameter`)
    , ConfigProvider = require(`../config/provider`)
    , tool = require(`../tool`)
;

module.exports = class extends require(`./abstract-command`) {

    /**
     * @inheritDoc
     */
    static getName() {
        return `upvote`;
    }

    /**
     * @inheritDoc
     */
    static getAliases() {
        return [`vote`];
    }

    /**
     * @inheritDoc
     */
    static run(params, message) {
        return new Promise(resolve => resolve({ params: params, message: message }))
            .then(this.validatePostUrl)
            .then(this.validateVp)
            .then(this.validatePostInterval)
            .then(this.validatePost)
            .then(this.performVote)
            .then(this.addSuccessComment)
            .catch((err) => {
                if (err instanceof DisplayToUserException) {
                    BotHelper.sendMessage(message, err.message);
                } else {
                    console.error(err);
                    BotHelper.sendMessage(
                        message
                        , sprintf(messages.systemError, BotHelper.getAuthorId(message))
                    );
                }
            })
        ;
    }

    /**
     * @param {string[]} params
     * @param {Discord.Message} message
     *
     * @throws CommandEventError When received params is not valid URL
     */
    static async validatePostUrl({ params, message }) {
        if (params.length < 1 || !params[0]) {
            console.error(`Failed to receive post URL.`, params);

            throw new DisplayToUserException(sprintf(
                messages.upvotePostUrlError
                , BotHelper.getAuthorId(message)
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
        }
        const postParams = ChainTool.parsePostUrl(params[0]);
        if (null === postParams) {
            console.error(`Failed to parse post URL`, params, postParams);

            throw new DisplayToUserException(sprintf(
                messages.upvotePostNotFound
                , BotHelper.getAuthorId(message)
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
        }

        return { params: params, message: message, postParams: postParams };
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     * @param {Object} postParams
     */
    static async validateVp({ params, message, postParams }) {
        const minVp = ConfigProvider.get(ConfigParameter.MIN_VP)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
        ;
        if (false === Boolean(minVp)) {
            return { params: params, message: message, postParams: postParams };
        }

        let account = null;
        try {
            account = await wekuAdapter.apiGetAccount(voterUsername);
        } catch (err) {
            console.error(err);

            throw new DisplayToUserException(sprintf(
                messages.systemError
                , BotHelper.getAuthorId(message)
            ));
        }

        const accountVp = ChainTool.calculateAccountVotingPower(account);
        if (accountVp < minVp) {
            throw new DisplayToUserException(sprintf(
                messages.upvoteVpTooLow
                , BotHelper.getAuthorId(message)
                , voterUsername
                , accountVp
                , minVp
            ));
        }

        return {
            params: params
            , message: message
            , postParams: postParams
            , account: account
        };
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     * @param {Object} postParams
     * @param {Object} account Detail information about vote account
     */
    static async validatePostInterval({ params, message, postParams, account }) {
        const voteInterval = ConfigProvider.get(ConfigParameter.VOTE_INTERVAL)
            , lastPostKey = `last_post`
        ;
        if (
            false === Boolean(voteInterval)
            || false === (lastPostKey in account)
        ) {
            if (false === (lastPostKey in account)) {
                console.error(new Error(sprintf(
                    `Failed to receive last post "%s" from account info: %s`
                    , lastPostKey
                    , JSON.stringify(account)
                )));
            }
            return { params: params, message: message, postParams: postParams };
        }

        const lastPostDate = chrono.parseDate(account[lastPostKey])
            , timeDiff = (new Date().getTime() - lastPostDate.getTime()) / 1000
        ;
        if (timeDiff < voteInterval) {
            throw new DisplayToUserException(sprintf(
                messages.upvoteTooOften
                , BotHelper.getAuthorId(message)
                , moment.utc(lastPostDate).fromNow()
            ));
        }

        return {
            params: params
            , message: message
            , postParams: postParams
        };
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     * @param {Object} postParams
     * @param {string} postParams.author
     * @param {string} postParams.permlink
     */
    static async validatePost({ params, message, postParams }) {
        const voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
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

            throw new DisplayToUserException(sprintf(
                messages.systemError
                , BotHelper.getAuthorId(message)
            ));
        }
        // check is Post exists
        if (0 === postContent.id) {
            throw new DisplayToUserException(sprintf(
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
            throw new DisplayToUserException(sprintf(
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
                    throw new DisplayToUserException(sprintf(
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
                    throw new DisplayToUserException(sprintf(
                        messages.upvotePostTooLate,
                        BotHelper.getAuthorId(message),
                        minPostAge,
                        maxPostAge
                    ));
                }
            }
        }

        return { params: params, message: message, postParams: postParams };
    }

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     * @param {Object} postParams
     * @param {string} postParams.author
     * @param {string} postParams.permlink
     */
    static async performVote({ params, message, postParams }) {
        const wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
        ;
        try {
            await wekuAdapter.broadcastVote(
                voterUsername,
                ConfigProvider.get(ConfigParameter.POSTING_KEY),
                postParams.author,
                postParams.permlink,
                ConfigProvider.get(ConfigParameter.WEIGHT) * 100
            );
            BotHelper.sendMessage(
                message
                , sprintf(
                    messages.upvoteSuccess
                    , BotHelper.getAuthorId(message)
                    , voterUsername
                )
            );

            return { params: params, message: message, postParams: postParams };
        } catch (err) {
            console.error(err);

            throw new DisplayToUserException(sprintf(
                messages.systemError
                , BotHelper.getAuthorId(message)
            ));
        }
    }

    /**
     * @param {string[]}       params
     * @param {Discord.Message} message
     * @param {Object} postParams
     * @param {string} postParams.author
     * @param {string} postParams.permlink
     */
    static async addSuccessComment({ params, message, postParams }) {
        const wekuAdapter = ChainAdapter.factory(ChainConstant.WEKU)
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
        ;
        try {
            await wekuAdapter.broadcastComment(
                voterUsername
                , ConfigProvider.get(ConfigParameter.POSTING_KEY)
                , ConfigProvider.get(ConfigParameter.UPVOTE_SUCCESS_COMMENT)
                , { parent_author: postParams.author, parent_permlink: postParams.permlink }
            );
        } catch (err) {
            console.error(err);
        }
    }

};
