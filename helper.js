let sprintf = require(`sprintf-js`).sprintf
    , messages = require(`./messages`)
    , config = require(`./config`)
    , Adapter = require(`./adapter`).Adapter
    , tool = require(`./tool`)
;

function updateVotingPowerStatus(bot, username) {
    Adapter.instance().processAccountInfo(username, function(account) {
        bot.user.setActivity(sprintf(`VP - %s%%.`, tool.calculateVotingPower(account)), { type: `WATCHING` });
    });
}

function handleBotCommand(command, params, message) {
    switch (command) {
        case `help`:
        case `info`:
            handleHelpCommand(message);
            break;
        case `upvote`:
            handleUpvoteCommand(message, params);
            break;
        default:
            console.info(sprintf(`Unsupported "%s" command received.`, command));
    }
}

function handleHelpCommand(message) {
    message.channel.send(sprintf(messages.info, message.author.id, config.username, config.commandPrefix))
}

function handleUpvoteCommand(message, params) {
    if (params.length < 1 || !params[0]) {
        console.error(`Failed to receive post URL.`, params);
        message.channel.send(sprintf(messages.upvotePostUrlError, message.author.id, config.commandPrefix));

        return
    }
    let postParams = tool.parsePostUrl(params[0]);
    if (postParams.length < 2 || !postParams.author || !postParams.permlink) {
        console.error(`Failed to parse post URL`, postParams);
        message.channel.send(sprintf(messages.upvotePostNotFound, message.author.id, config.commandPrefix));

        return
    }

    Adapter.instance().processGetContent(
        postParams.author,
        postParams.permlink,
        function (result) {
            if (
                `active_votes` in result
                && result.active_votes.length > 0
                && tool.isArrayContainsProperty(result.active_votes, `voter`, config.username)
            ) {
                message.channel.send(sprintf(messages.upvotePostVotedAlready, message.author.id, config.username));

                return;
            }
            Adapter.instance().processVote(
                config.postingKey,
                config.username,
                postParams.author,
                postParams.permlink,
                config.weight * 100,
                function () {
                    message.channel.send(sprintf(messages.upvoteSuccess, message.author.id, config.username));
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

module.exports = {
    updateVotingPowerStatus: updateVotingPowerStatus
    , handleBotCommand: handleBotCommand
};
