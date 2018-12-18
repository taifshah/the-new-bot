'use strict';

const faker = require(`faker`)
    , sandbox = require(`sinon`).createSandbox()
    , moment = require(`moment`)
    , chrono = require(`chrono-node`)
    , { sprintf } = require(`sprintf-js`)
    , Discord = require(`discord.js`)
    , { ChainAdapter, ChainConstant, ChainTool } = require(`chain-tools-js`)
    , ConfigProvider = require(`../../config/provider`)
    , ConfigParameter = require(`../../config/parameter`)
    , CommandHandler = require(`../../command-handler`)
    , UpvoteCommand = require(`../../command/upvote-command`)
    , messages = require(`../../messages`)
;

describe(`UpvoteCommand`, () => {

    /**
     * @param {Array}          params
     * @param {Discord.Message} message
     */
    async function runCommand(params, message) {
        await CommandHandler.run(UpvoteCommand.getName(), params, message);
    }

    before(() => {
        CommandHandler.register();
    });

    afterEach(() => {
        // completely restore all fakes created through the sandbox
        sandbox.restore();
    });

    it(`should not vote if power less then "minVp" config parameter`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , username = ConfigProvider.get(ConfigParameter.USERNAME)
            , account = {
                name: username
                , voting_power: (configParam - 30) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , params = [sprintf(`https://main.weku.io/category/@%s/first-post`, username)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.upvoteVpTooLow
                , userId
                , username
                , ChainTool.calculateAccountVotingPower(account)
                , configParam
            )
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(username)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`).never();
        mockAdapter.expects(`broadcastVote`).never();

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.callCount
            .should.be.equal(1, `Only one adapter should be created.`)
        ;
        spyAdapterFactory.calledOnceWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should handle if "apiGetAccount" will throw an error`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , username = ConfigProvider.get(ConfigParameter.USERNAME)
            , userId = faker.random.number()
            , params = [sprintf(`https://main.weku.io/category/@%s/first-post`, username)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(messages.systemError, userId)
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(username)
            .rejects()
        ;
        mockAdapter.expects(`apiGetContent`).never();
        mockAdapter.expects(`broadcastVote`).never();

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.callCount
            .should.be.equal(1, `Only one adapter should be created.`)
        ;
        spyAdapterFactory.calledOnceWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should not vote if post doesn't exists`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , username = ConfigProvider.get(ConfigParameter.USERNAME)
            , account = {
                name: username
                , voting_power: (configParam + 5) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , postAuthor = faker.internet.userName().toLowerCase()
            , postPermlink = faker.internet.userName().toLowerCase()
            , params = [sprintf(`https://main.weku.io/category/@%s/%s`, postAuthor, postPermlink)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.upvotePostNotFound
                , userId
            )
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(username)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`)
            .once()
            .withExactArgs(postAuthor, postPermlink)
            .resolves({ id: 0 })
        ;
        mockAdapter.expects(`broadcastVote`).never();

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.alwaysCalledWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should handle if "apiGetContent" thrown an error`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , username = ConfigProvider.get(ConfigParameter.USERNAME)
            , account = {
                name: username
                , voting_power: (configParam + 5) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , postAuthor = faker.internet.userName().toLowerCase()
            , postPermlink = faker.internet.userName().toLowerCase()
            , params = [sprintf(`https://main.weku.io/category/@%s/%s`, postAuthor, postPermlink)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(messages.systemError, userId)
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(username)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`)
            .once()
            .withExactArgs(postAuthor, postPermlink)
            .rejects()
        ;
        mockAdapter.expects(`broadcastVote`).never();

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.alwaysCalledWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should not vote if already voted for post before`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , account = {
                name: voterUsername
                , voting_power: (configParam + 5) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , postAuthor = faker.internet.userName().toLowerCase()
            , postPermlink = faker.internet.userName().toLowerCase()
            , params = [sprintf(`https://main.weku.io/category/@%s/%s`, postAuthor, postPermlink)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.upvotePostVotedAlready
                , userId
                , voterUsername
            )
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(voterUsername)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`)
            .once()
            .withExactArgs(postAuthor, postPermlink)
            .resolves({
                id: faker.random.number()
                , active_votes: [{ voter: voterUsername, weight: faker.random.number() }]
            })
        ;
        mockAdapter.expects(`broadcastVote`).never();

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.alwaysCalledWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should vote for post`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , voterWif = ConfigProvider.get(ConfigParameter.POSTING_KEY)
            , voteWeight = ConfigProvider.get(ConfigParameter.WEIGHT)
            , account = {
                name: voterUsername
                , voting_power: (configParam + 5) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , postAuthor = faker.internet.userName().toLowerCase()
            , postPermlink = faker.internet.userName().toLowerCase()
            , params = [sprintf(`https://main.weku.io/category/@%s/%s`, postAuthor, postPermlink)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(
                messages.upvoteSuccess
                , userId
                , voterUsername
            )
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(voterUsername)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`)
            .once()
            .withExactArgs(postAuthor, postPermlink)
            .resolves({ id: faker.random.number() })
        ;
        mockAdapter.expects(`broadcastVote`)
            .once()
            .withExactArgs(
                postAuthor
                , postPermlink
                , voterUsername
                , voterWif
                , voteWeight * 100
            )
            .resolves({ success: true })
        ;

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.alwaysCalledWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
    });

    it(`should handle when "broadcastVote" throw an error`, async () => {
        // given
        const configParamName = ConfigParameter.MIN_VP
            , configParam = faker.random.number({min: 60, max: 99})
            , voterUsername = ConfigProvider.get(ConfigParameter.USERNAME)
            , voterWif = ConfigProvider.get(ConfigParameter.POSTING_KEY)
            , voteWeight = ConfigProvider.get(ConfigParameter.WEIGHT)
            , account = {
                name: voterUsername
                , voting_power: (configParam + 5) * 100
                , last_vote_time: moment.utc(chrono.parseDate(`15 minutes ago`)).format(`YYYY-MM-DDTHH:mm:ss`)
            }
            , userId = faker.random.number()
            , postAuthor = faker.internet.userName().toLowerCase()
            , postPermlink = faker.internet.userName().toLowerCase()
            , params = [sprintf(`https://main.weku.io/category/@%s/%s`, postAuthor, postPermlink)]
        ;
        ConfigProvider.set(configParamName, configParam);

        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId,
            sprintf(messages.systemError, userId)
        );

        const spyAdapterFactory = sandbox.spy(ChainAdapter, `factory`)
            , mockAdapter = sandbox.mock(ChainAdapter.prototype)
        ;
        mockAdapter.expects(`apiGetAccount`)
            .once()
            .withExactArgs(voterUsername)
            .resolves(account)
        ;
        mockAdapter.expects(`apiGetContent`)
            .once()
            .withExactArgs(postAuthor, postPermlink)
            .resolves({ id: faker.random.number() })
        ;
        mockAdapter.expects(`broadcastVote`)
            .once()
            .withExactArgs(
                postAuthor
                , postPermlink
                , voterUsername
                , voterWif
                , voteWeight * 100
            )
            .rejects()
        ;

        // when
        await runCommand(params, stubMessage);

        // then
        spyAdapterFactory.alwaysCalledWithExactly(ChainConstant.WEKU)
            .should.be.equal(true, `Only WEKU adapter should be created.`)
        ;

        mockAdapter.verify();
        mockChannel.verify();
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
