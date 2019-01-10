'use strict';

/**
 * Contains list of available config parameters
 * @typedef {Object} ConfigParameter
 * @property {string} WEIGHT               Weight of vote
 * @property {string} MIN_VP               Minimum value of VP when bot will perform vote.
 *                                             If VP less this value, bot will stop voting.
 * @property {string} VOTE_INTERVAL        Interval in which bot will vote only one time (in seconds).
 * @property {string} MIN_POST_AGE         Minimum age of post to receive vote
 * @property {string} MAX_POST_AGE         Maximum age of post to receive vote
 * @property {string} USERNAME             Username of account which will vote for Post
 * @property {string} POSTING_KEY          Wif for account which will vote for Post (from username account)
 * @property {string} BOT_TOKEN            Token of Discord bot for login
 * @property {string} COMMAND_PREFIX       A character which indicates that message is a command
 * @property {string} ADMIN_LIST           List of bot administrators
 * @property {string} RUNTIME_CONFIG_FILE  Name of runtime config file
 * @property {string} ERROR_TRACKER_DSN    Credentials for access to Error Tracking Tool
 * @property {string} UPVOTE_SUCCESS_COMMENT Comment message which will be add to Upvoted post/comment
 * @property {string} DISCORD_USER_MENTION_PATTERN Pattern, using which you can mention user in Discord message
 */
let ConfigParameter = {}
    , parameterList = {
        weight: `WEIGHT`
        , minVp: `MIN_VP`
        , voteInterval: `VOTE_INTERVAL`
        , minPostAge: `MIN_POST_AGE`
        , maxPostAge: `MAX_POST_AGE`
        , username: `USERNAME`
        , postingKey: `POSTING_KEY`
        , botToken: `BOT_TOKEN`
        , commandPrefix: `COMMAND_PREFIX`
        , adminList: `ADMIN_LIST`
        , runtimeConfigFile: `RUNTIME_CONFIG_FILE`
        , errorTrackerDsn: `ERROR_TRACKER_DSN`
        , upvoteSuccessComment: `UPVOTE_SUCCESS_COMMENT`
        , discordUserMentionPattern: `DISCORD_USER_MENTION_PATTERN`
    }
;

for (let propValue in parameterList) {
    Object.defineProperty(
        ConfigParameter,
        parameterList[propValue],
        {
            value: propValue,
            writable: false,
            enumerable: true
        }
    );
}

module.exports = ConfigParameter;
