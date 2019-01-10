'use strict';

const faker = require(`faker`)
    , sandbox = require(`sinon`).createSandbox()
    , Discord = require(`discord.js`)
    , ConfigProvider = require(`../../config/provider`)
    , ConfigParameter = require(`../../config/parameter`)
    , CommandHandler = require(`../../command-handler`)
    , OwnerCommand = require(`../../command/owner-command`)
;

describe(`OwnerCommand`, () => {

    before(() => {
        CommandHandler.register();
    });

    afterEach(() => {
        // completely restore all fakes created through the sandbox
        sandbox.restore();
    });

    it(`should print message with admins`, () => {
        // given
        const params = []
            , userId = faker.random.number()
            , adminList = ConfigProvider.get(ConfigParameter.ADMIN_LIST)
        ;
        let { stubMessage, mockChannel } = mockDiscordMessage(
            userId
            , (messageText) => {
                messageText.should.have.string(userId);
                adminList.forEach((item) => {
                    messageText.should.have.string(item);
                })
            }
        );

        // when
        runCommand(params, stubMessage);

        // then
        mockChannel.verify();
    });

});

/**
 * @param {number} userId
 * @param {function} sendMessageFunc
 *
 * @return {{stubMessage: *, mockChannel: *}}
 */
function mockDiscordMessage(userId, sendMessageFunc) {
    let stubMessage = sandbox.createStubInstance(Discord.Message)
        , stubUser = sandbox.createStubInstance(Discord.User)
        , stubGuild = sandbox.createStubInstance(Discord.Guild)
        , mockChannel = sandbox.mock(Discord.TextChannel.prototype)
    ;
    stubUser.id = userId;
    stubMessage.author = stubUser;

    mockChannel.expects(`send`).once().callsFake(sendMessageFunc);
    stubMessage.channel = new Discord.TextChannel(stubGuild, {});

    return {
        stubMessage: stubMessage
        , mockChannel: mockChannel
    }
}

/**
 * @param {Array}          params
 * @param {Discord.Message} message
 */
function runCommand(params, message) {
    CommandHandler.run(OwnerCommand.getName(), params, message);
}
