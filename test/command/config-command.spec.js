'use strict';

const faker = require(`faker`)
    , sandbox = require(`sinon`).createSandbox()
    , { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , ConfigProvider = require(`../../config/provider`)
    , ConfigParameter = require(`../../config/parameter`)
    , CommandHandler = require(`../../command-handler`)
    , ConfigCommand = require(`../../command/config-command`)
    , messages = require(`../../messages`)
    , baseDir = process.env.NODE_PATH
    , runtimeDir = baseDir + `/test/runtime`
;

describe(`ConfigCommand`, () => {

    before(() => {
        CommandHandler.register();
    });

    beforeEach(() => {
        ConfigProvider.setRuntimeDir(runtimeDir);
    });

    afterEach(() => {
        // completely restore all fakes created through the sandbox
        sandbox.restore();
    });

    it(`should check permission of user to use "config" command`, async () => {
        // given
        const params = []
            , userId = faker.random.number()
        ;
        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.permissionDenied,
                userId,
                ConfigProvider.get(ConfigParameter.COMMAND_PREFIX),
                ConfigCommand.getName()
            )
        );

        // when
        await CommandHandler.run(ConfigCommand.getName(), params, stubMessage);

        // then
        mockChannel.verify();
    });

    it(`should return info about command on no params`, async () => {
        // given
        const params = []
            , userId = ConfigProvider.get(ConfigParameter.ADMIN_LIST)[0]
        ;
        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.configInfo
                , userId
                , ConfigProvider.get(ConfigParameter.COMMAND_PREFIX)
            )
        );

        // when
        await CommandHandler.run(ConfigCommand.getName(), params, stubMessage);

        // then
        mockChannel.verify();
    });

    it(`should return value of config parameter if only it name given`, async () => {
        // given
        const configParamName = ConfigParameter.WEIGHT
            , params = [configParamName]
            , userId = ConfigProvider.get(ConfigParameter.ADMIN_LIST)[0]
        ;
        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.configParameterValue
                , userId
                , configParamName
                , ConfigProvider.get(configParamName)
            )
        );

        // when
        await CommandHandler.run(ConfigCommand.getName(), params, stubMessage);

        // then
        mockChannel.verify();
    });

    it(`should change value of config parameter`, async () => {
        // given
        const configParamName = ConfigParameter.WEIGHT
            , userId = ConfigProvider.get(ConfigParameter.ADMIN_LIST)[0]
        ;
        let newConfigParam = null;
        do {
            newConfigParam = faker.random.number({min: 0.01, max: 100});
        } while (Number(ConfigProvider.get(configParamName)) === newConfigParam);
        const params = [configParamName, newConfigParam];

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.configParameterValueChanged
                , userId
                , configParamName
                , newConfigParam
            )
        );

        // when
        await CommandHandler.run(ConfigCommand.getName(), params, stubMessage);

        // then
        mockChannel.verify();
        should.equal(
            ConfigProvider.get(configParamName)
            , newConfigParam
            , `Config parameter should be updated.`
        );
    });

    it(`should change "minVp" config parameter`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , userId = ConfigProvider.get(ConfigParameter.ADMIN_LIST)[0]
        ;
        let newConfigParam = null;
        do {
            newConfigParam = faker.random.number({min: 1, max: 99});
        } while (Number(ConfigProvider.get(configParamName)) === newConfigParam);
        const params = [configParamName, newConfigParam];

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.configParameterValueChanged
                , userId
                , configParamName
                , newConfigParam
            )
        );

        // when
        await CommandHandler.run(ConfigCommand.getName(), params, stubMessage);

        // then
        mockChannel.verify();
        should.equal(
            ConfigProvider.get(configParamName)
            , newConfigParam
            , `Config parameter should be updated.`
        );
    });

});

function mockDiscordMessage(userId, messageText) {
    let stubMessage = sandbox.createStubInstance(Discord.Message)
        , stubUser = sandbox.createStubInstance(Discord.User)
        , stubGuild = sandbox.createStubInstance(Discord.Guild)
        , mockChannel = sandbox.mock(Discord.TextChannel.prototype)
    ;
    stubUser.id = userId;
    stubMessage.author = stubUser;

    mockChannel.expects(`send`).once().withExactArgs(messageText);
    stubMessage.channel = new Discord.TextChannel(stubGuild, {});

    return {
        stubMessage: stubMessage
        , mockChannel: mockChannel
    }
}
