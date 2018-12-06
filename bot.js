'use strict';

let Discord = require(`discord.js`)
    , BotHelper = require(`./bot-helper`)
    , ConfigParameter = require(`./config/parameter`)
    , ConfigProvider = require(`./config/provider`)
    , bot = new Discord.Client()
;

bot.on(`ready`, () => {
    console.info(`Bot has started`);

    const username = ConfigProvider.get(ConfigParameter.USERNAME);

    BotHelper.updateVotingPowerStatus(bot, username);
    setInterval(
        function() {
            BotHelper.updateVotingPowerStatus(bot, username);
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
    if (message.content[0] !== ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)) {
        return; // ignore not command messages
    }

    let parts = message.content.substr(1).trim().split(` `)
        , command = parts[0]
        , params = parts.splice(1)
    ;

    BotHelper.handleBotCommand(command, params, message);
});

bot.login(ConfigProvider.get(ConfigParameter.BOT_TOKEN));
