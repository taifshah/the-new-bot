'use strict';

const sprintf = require(`sprintf-js`).sprintf
    , fs = require(`fs`)
;

let runtimeConfig = {}
    , configLoaded = false
    , runtimeConfigDir = __dirname + `/..`
;

module.exports = class ConfigProvider {
    /**
     * Returns current value of config parameter
     * @param {string} name Name of config parameter.
     * @return {*|null} Value of config parameter or null if parameter doesn't exists.
     */
    static get(name) {
        ConfigProvider.load();

        if (name in runtimeConfig) {
            return runtimeConfig[name];
        } else {
            return null;
        }
    }

    /**
     * Changes value of config parameter
     * @param {string} name  Name of config parameter.
     * @param {*}      value New value for config parameter.
     */
    static set(name, value) {
        if (false === (name in runtimeConfig)) {
            return;
        }
        if (null === value || undefined === value) {
            delete runtimeConfig[name];
        } else {
            runtimeConfig[name] = value;
        }
        ConfigProvider.dump();
    }

    /**
     * Loads actual configs from default file and runtime one
     */
    static load() {
        if (configLoaded) {
            return;
        }
        const config = require(ConfigProvider.getConfigPath(false))
            , runtimeConfigPath = ConfigProvider.getConfigPath()
        ;

        if (fs.existsSync(runtimeConfigPath)) {
            runtimeConfig = require(runtimeConfigPath);
        }

        runtimeConfig = {...config, ...runtimeConfig};

        configLoaded = true;
    }

    /**
     * Resets current config values
     */
    static reset() {
        runtimeConfig = {};
        configLoaded = false;
    }

    /**
     * Stores current config parameters to file
     */
    static dump() {
        fs.writeFile(
            ConfigProvider.getConfigPath(),
            JSON.stringify(runtimeConfig),
            `utf8`,
            function (err) {
                if (err) {
                    console.error(err);
                }
            }
        );
    }

    /**
     * Changes runtime directory where config files should be located
     * @param {string} dir Path to directory.
     */
    static setRuntimeDir(dir) {
        runtimeConfigDir = dir;
    }

    /**
     * Provides path to config file
     * @param {boolean} runtime Specifies which config file path returns, runtime or not.
     * @return {string} Path to config file.
     */
    static getConfigPath(runtime = true) {
        const configPath = __dirname + `/../config.json`;
        if (runtime) {
            const config = require(configPath);

            return sprintf(`%s/%s`, runtimeConfigDir, config.runtimeConfigFile);
        } else {
            return configPath;
        }
    }
};
