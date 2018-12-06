'use strict';

const fsReadFilePromise = require(`fs-readfile-promise`)
    , fs = require(`fs`)
    , configPath = `./config.json`
    , encoding = `utf8`
;

if (false === fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({}));
}

Promise.all([
    fsReadFilePromise(`./config.json.dist`, encoding)
    , fsReadFilePromise(configPath, encoding)
]).then(values => {
    let distConfig = JSON.parse(values[0])
        , config = JSON.parse(values[1])
        , wasChanged = false
    ;

    for (let parameterName in distConfig) {
        if (false === (parameterName in config)) {
            config[parameterName] = distConfig[parameterName] in process.env
                ? process.env[distConfig[parameterName]]
                : distConfig[parameterName]
            ;
            wasChanged = true;
        }
    }
    if (false === wasChanged) {
        console.info(`Config Deploy: No new parameters added - skipped.`);

        return;
    }

    fs.writeFile(
        configPath,
        JSON.stringify(config),
        encoding,
        function (err) {
            if (err) {
                console.error(err);
            } else {
                console.info(`Config Deploy: deployed.`)
            }
        }
    );
});
