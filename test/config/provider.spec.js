'use strict';

const faker = require(`faker`)
    , { sprintf } = require(`sprintf-js`)
    , fs = require(`fs`)
    , ConfigProvider = require(`../../config/provider`)
    , ConfigParameter = require(`../../config/parameter`)
    , baseDir = process.env.NODE_PATH
    , baseConfig = require(baseDir + `/config.json`)
    , runtimeDir = baseDir + `/test/runtime`
    , runtimeConfigFile = sprintf(`%s/%s`, runtimeDir, baseConfig[ConfigParameter.RUNTIME_CONFIG_FILE])
;

describe(`ConfigProvider`, () => {

    beforeEach(function() {
        ConfigProvider.setRuntimeDir(runtimeDir);
        ConfigProvider.reset();
        delete require.cache[require.resolve(runtimeConfigFile)]
    });

    describe(`get`, () => {

        it(`should return null for non existing parameter`, () => {
            const randomParameterName = faker.random.alphaNumeric(8)
                , randomParameter = ConfigProvider.get(randomParameterName)
            ;

            should.equal(randomParameter, null);
        });

        it(`should return existing parameter`, () => {
            const weight = ConfigProvider.get(ConfigParameter.WEIGHT);

            should.exist(weight);
        });

        it(`should read config parameters from runtime file`, () => {
            // given
            let weightNewValue = null
                , newConfig = {}
            ;
            do {
                weightNewValue = faker.random.number({min: 0.01, max: 100});
            } while (Number(baseConfig[ConfigParameter.WEIGHT]) === weightNewValue);

            newConfig[ConfigParameter.WEIGHT] = weightNewValue;
            fs.writeFileSync(runtimeConfigFile, JSON.stringify(newConfig));

            // when
            const currentWeight = ConfigProvider.get(ConfigParameter.WEIGHT);

            // then
            should.equal(currentWeight, weightNewValue);
        });

    });

    describe(`set`, () => {

        it(`should update runtime config file`, () => {
            // given
            fs.writeFileSync(runtimeConfigFile, JSON.stringify({}));

            const paramName = ConfigParameter.WEIGHT;
            let paramNewValue = null;
            do {
                paramNewValue = faker.random.number({min: 0.01, max: 100});
            } while (ConfigProvider.get(paramName) === paramNewValue);

            // when
            ConfigProvider.set(paramName, paramNewValue);

            // then
            should.equal(
                ConfigProvider.get(paramName)
                , paramNewValue
                , `ConfigProvider should return new value of parameter`
            );

            // check runtime file
            setTimeout(() => {
                const runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigFile, `utf8`));
                should.have.property(runtimeConfig, paramName, `Runtime config file should have updated parameter key.`);
                should.equal(
                    runtimeConfig[paramName]
                    , paramNewValue
                    , `Runtime config file should contain new value of updated parameter.`
                );
            }, 500); // wait until file be updated
        });

    });

});
