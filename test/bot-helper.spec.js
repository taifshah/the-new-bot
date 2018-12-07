'use strict';

const faker = require(`faker`)
    , sinon = require(`sinon`)
    , { sprintf } = require(`sprintf-js`)
    , fs = require(`fs`)
    , DiscordMessage = require(`discord.js`).Message
    , DiscordGuild = require(`discord.js`).Guild
    , DiscordTextChannel = require(`discord.js`).TextChannel
    , DiscordUser = require(`discord.js`).User
    , ConfigProvider = require(`../config/provider`)
    , ConfigParameter = require(`../config/parameter`)
    , BotHelper = require(`../bot-helper`)
    , messages = require(`../messages`)
    , baseDir = process.env.NODE_PATH
    , baseConfig = require(baseDir + `/config.json`)
    , runtimeDir = baseDir + `/test/runtime`
    , runtimeConfigFile = sprintf(
        `%s/%s`
        , runtimeDir
        , baseConfig[ConfigParameter.RUNTIME_CONFIG_FILE]
    )
;

describe(`BotHelper`, () => {

    beforeEach(function() {
        ConfigProvider.setRuntimeDir(runtimeDir);
        // ConfigProvider.reset();
        // delete require.cache[require.resolve(runtimeConfigFile)]
    });

    describe(`handleConfigCommand`, () => {

        it(`should return info about command on no params`, () => {
            // given
            const params = []
                , userId = faker.random.number()
            ;
            let stubMessage = sinon.createStubInstance(DiscordMessage)
                , stubUser = sinon.createStubInstance(DiscordUser)
                , stubGuild = sinon.createStubInstance(DiscordGuild)
                , mockChannel = sinon.mock(DiscordTextChannel.prototype)
            ;
            stubUser.id = userId;
            stubMessage.author = stubUser;

            mockChannel.expects(`send`).once().withExactArgs(sprintf(
                messages.configInfo
                , userId
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            ));
            stubMessage.channel = new DiscordTextChannel(stubGuild, {});

            // when
            BotHelper.handleConfigCommand(params, stubMessage);

            // then
            mockChannel.restore();
            mockChannel.verify();
        });

        it(`should return value of config parameter if only it name given`, () => {
            // given
            const configParamName = ConfigParameter.WEIGHT
                , params = [configParamName]
                , userId = faker.random.number()
            ;
            let stubMessage = sinon.createStubInstance(DiscordMessage)
                , stubUser = sinon.createStubInstance(DiscordUser)
                , stubGuild = sinon.createStubInstance(DiscordGuild)
                , mockChannel = sinon.mock(DiscordTextChannel.prototype)
            ;
            stubUser.id = userId;
            stubMessage.author = stubUser;

            mockChannel.expects(`send`).once().withExactArgs(sprintf(
                messages.configParameterValue
                , userId
                , configParamName
                , ConfigProvider.get(configParamName)
            ));
            stubMessage.channel = new DiscordTextChannel(stubGuild, {});

            // when
            BotHelper.handleConfigCommand(params, stubMessage);

            // then
            mockChannel.restore();
            mockChannel.verify();
        });

        it(`should change value of config parameter`, () => {
            // given
            const configParamName = ConfigParameter.WEIGHT
                , userId = faker.random.number()
            ;
            let newConfigParam = null;
            do {
                newConfigParam = faker.random.number({min: 0.01, max: 100});
            } while (Number(ConfigProvider.get(configParamName)) === newConfigParam);
            const params = [configParamName, newConfigParam];

            let stubMessage = sinon.createStubInstance(DiscordMessage)
                , stubUser = sinon.createStubInstance(DiscordUser)
                , stubGuild = sinon.createStubInstance(DiscordGuild)
                , mockChannel = sinon.mock(DiscordTextChannel.prototype)
            ;
            stubUser.id = userId;
            stubMessage.author = stubUser;

            mockChannel.expects(`send`).once().withExactArgs(sprintf(
                messages.configParameterValueChanged
                , userId
                , configParamName
                , newConfigParam
            ));
            stubMessage.channel = new DiscordTextChannel(stubGuild, {});

            // when
            BotHelper.handleConfigCommand(params, stubMessage);

            // then
            mockChannel.restore();
            mockChannel.verify();
            should.equal(
                ConfigProvider.get(configParamName)
                , newConfigParam
                , `Config parameter should be updated.`
            );
        });

        it(`should change "minVp" config parameter`, () => {
            // given
            const configParamName = ConfigParameter.MIN_VP
                , userId = faker.random.number()
            ;
            let newConfigParam = null;
            do {
                newConfigParam = faker.random.number({min: 1, max: 99});
            } while (Number(ConfigProvider.get(configParamName)) === newConfigParam);
            const params = [configParamName, newConfigParam];

            let stubMessage = sinon.createStubInstance(DiscordMessage)
                , stubUser = sinon.createStubInstance(DiscordUser)
                , stubGuild = sinon.createStubInstance(DiscordGuild)
                , mockChannel = sinon.mock(DiscordTextChannel.prototype)
            ;
            stubUser.id = userId;
            stubMessage.author = stubUser;

            mockChannel.expects(`send`).once().withExactArgs(sprintf(
                messages.configParameterValueChanged
                , userId
                , configParamName
                , newConfigParam
            ));
            stubMessage.channel = new DiscordTextChannel(stubGuild, {});

            // when
            BotHelper.handleConfigCommand(params, stubMessage);

            // then
            mockChannel.restore();
            mockChannel.verify();
            should.equal(
                ConfigProvider.get(configParamName)
                , newConfigParam
                , `Config parameter should be updated.`
            );
        });

    });

});
