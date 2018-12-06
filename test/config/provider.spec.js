'use strict';

const faker = require(`faker`)
    , ConfigProvider = require(`../../config/provider`)
    , ConfigParameter = require(`../../config/parameter`)
;

describe(`ConfigProvider`, () => {

    describe(`get`, () => {

        it(`should return null for non existing parameter`, () => {
            const randomParameterName = faker.random.alphaNumeric(8)
                , randomParameter = ConfigProvider.get(randomParameterName)
            ;

            should.not.exist(randomParameter);
        });

        it(`should return "weight" parameter`, () => {
            const weight = ConfigProvider.get(ConfigParameter.WEIGHT);

            weight.should.not.be.a(`null`);
        });

    });

});
