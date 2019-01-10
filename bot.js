'use strict';

const Discord = require(`discord.js`)
    , BotHelper = require(`./bot-helper`)
    , CommandHandler = require(`./command-handler`)
    , ConfigParameter = require(`./config/parameter`)
    , ConfigProvider = require(`./config/provider`)
    , bot = new Discord.Client()
    , Sentry = require('@sentry/node')
    , messages = require(`./messages`)
;

Sentry.init({ dsn: ConfigProvider.get(ConfigParameter.ERROR_TRACKER_DSN) });

bot.on(`error`, (err) => {
    console.error(
        new Date() + `: Discord client encountered an error`
        , err
    );
});

bot.on(`ready`, () => {
    console.info(`Bot has started`);

    CommandHandler.register();

    const username = ConfigProvider.get(ConfigParameter.USERNAME);

    BotHelper.updateVotingPowerStatus(bot, username);
    setInterval(
        () => {
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
    if (
        message.channel instanceof Discord.DMChannel
        && false === BotHelper.checkUserPermission(command, message)
    ) {
        // only admins can send DM messages
        BotHelper.sendMessage(message, messages.dmMessagesDeprecated);

        return;
    }

    CommandHandler.run(command, params, message);
});

bot.login(ConfigProvider.get(ConfigParameter.BOT_TOKEN));
