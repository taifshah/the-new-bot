let urlParse = require(`url-parse`)
;

function parsePostUrl(url) {
    let parsed = urlParse(url.toLowerCase())
        , parts = parsed.pathname.split(`/`)
        , queryParams = parseQueryParams(parsed.query)
        , authorIndex = 0
    ;
    if (`author` in queryParams && `permlink` in queryParams) {
        return {
            author: queryParams[`author`]
            , permlink: queryParams[`permlink`]
        };
    }

    for (let i in parts) {
        if (parts[i].length === 0) {
            continue;
        }
        if (parts[i][0] === `@`) {
            authorIndex = i * 1;
            break;
        }
    }
    if (authorIndex === 0) {
        return {};
    }

    return {
        author: parts[authorIndex].slice(1),
        permlink: parts[authorIndex + 1]
    };
}

function parseQueryParams(queryString) {
    if (queryString[0] === `?`) {
        queryString = queryString.slice(1);
    }
    let queryParts = queryString.split(`&`)
        , queryParams = {}
    ;

    for (let i in queryParts) {
        let [key, val] = queryParts[i].split(`=`);
        queryParams[key] = decodeURIComponent(val);
    }

    return queryParams;
}

function isArrayContainsProperty(objects, propertyName, propertyValue) {
    let result = false;
    for (let i in objects) {
        if (objects[i][propertyName] === propertyValue) {
            result = true;
            break;
        }
    }

    return result;
}

module.exports = {
    parsePostUrl: parsePostUrl
    , isArrayContainsProperty: isArrayContainsProperty
};
