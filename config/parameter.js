'use strict';

/**
 * Contains list of available config parameters
 * @typedef {Object} ConfigParameter
 * @property {String} WEIGHT               Weight of vote
 * @property {String} MIN_VP               Minimum value of VP when bot will perform vote.
 *                                             If VP less this value, bot will stop voting.
 * @property {String} MIN_POST_AGE         Minimum age of post to receive vote
 * @property {String} MAX_POST_AGE         Maximum age of post to receive vote
 * @property {String} USERNAME             Username of account which will vote for Post
 * @property {String} POSTING_KEY          Wif for account which will vote for Post (from username account)
 * @property {String} BOT_TOKEN            Token of Discord bot for login
 * @property {String} COMMAND_PREFIX       A character which indicates that message is a command
 * @property {String} ADMIN_LIST           List of bot administrators
 * @property {String} RUNTIME_CONFIG_FILE  Name of runtime config file
 */
let ConfigParameter = {}
    , parameterList = {
        weight: `WEIGHT`
        , minVp: `MIN_VP`
        , minPostAge: `MIN_POST_AGE`
        , maxPostAge: `MAX_POST_AGE`
        , username: `USERNAME`
        , postingKey: `POSTING_KEY`
        , botToken: `BOT_TOKEN`
        , commandPrefix: `COMMAND_PREFIX`
        , adminList: `ADMIN_LIST`
        , runtimeConfigFile: `RUNTIME_CONFIG_FILE`
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
