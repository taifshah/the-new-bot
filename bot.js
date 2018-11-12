"use strict";

let Discord = require(`discord.js`)
    , helper = require(`./helper`)
    , config = require(`./config`)
    , bot = new Discord.Client()
;

bot.on(`ready`, () => {
    console.info('Bot has started');

    helper.updateVotingPowerStatus(bot, config.username);
    setInterval(function() {
        helper.updateVotingPowerStatus(bot, config.username);
        },
        1000 * 60 // every 1 minute
    );
});

bot.on(`message`, message => {
    if (message.author.bot) {
        return; // ignore messages from bots
    }
    if (!message.content) {
        return; // maybe will be useful
    }
    if (message.content[0] !== config.commandPrefix) {
        return; // ignore not command messages
    }

    let parts = message.content.substr(1).split(` `)
        , command = parts[0]
        , params = parts.splice(1)
    ;

    helper.handleBotCommand(command, params, message);
});

bot.login(config.botToken);
