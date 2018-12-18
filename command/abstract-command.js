'use strict';

const EventEmitter = require(`events`)
    , CommandHelper = require(`../command-helper`)
;

module.exports = class AbstractCommand {

    static getName() {
        throw new Error(`Command should has a name.`);
    }

    /**
     * Provides list of possible names for command
     * @returns {string[]}
     */
    static getAliases() {
        return [];
    }

    /**
     * Provides list of methods which should be called before command's run
     * @returns {string[]}
     */
    static getPreMethods() {
        return [];
    }

    /**
     * Provides list of methods which should be called after command's run
     * @returns {string[]}
     */
    static getPostMethods() {
        return [];
    }

    static run(params, message) {
        throw new Error(`Command should do something.`);
    }

    /**
     * @param {EventEmitter} emitter
     */
    static register(emitter) {
        const instance = this
            , possibleEvents = [...[instance.getName()], ...instance.getAliases()]
        ;

        possibleEvents.forEach((eventName) => {
            instance.getPreMethods().forEach((methodName) => {
                emitter.on(
                    CommandHelper.buildPreEventName(eventName)
                    , instance[methodName]
                    , instance
                );
            });
            emitter.on(eventName, instance.run, instance);
            instance.getPostMethods().forEach((methodName) => {
                emitter.on(
                    CommandHelper.buildPostEventName(eventName)
                    , instance[methodName]
                    , instance
                );
            });
        });
    }

};
