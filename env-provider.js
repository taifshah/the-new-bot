'use strict';

module.exports = class EnvProvider {
    /**
     * Returns name of current environment
     * @return {string}
     */
    static getEnv() {
        const envPropName = `NODE_ENV`
            , defaultEnv = `dev`
        ;

        if (envPropName in process.env) {
            return process.env[envPropName];
        } else {
            return defaultEnv;
        }
    }
};
