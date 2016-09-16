"use strict";


var fs      = require("fs"),
    path    = require("path"),
    es      = require("event-stream"),
    gUtil   = require("gulp-util"),
    marked  = require('marked'),
    glob    = require('glob'),
    frontMatter = require('front-matter'),

    _DIRECTIVE_REGEX = /^(.*=\s*([\w\.\*\/-]+)\s*:\s*([\w\.\*\/-]+\.html?\s*))$/gm,
    _IS_HIDDEN_REGEX = /(^|.\/)\.+[^\/\.]/g
;

/**
 *
 * @param file
 * @returns {HTMLElement}
 * @private
 */
function _parse(file){

    if (fs.existsSync(file)) {
        var bufferContents = fs.readFileSync(file),
            parsed = frontMatter(bufferContents.toString().replace(/\s+/g, ' '));

        return parsed.body;

    } else {
        throw new gUtil.PluginError('gulp-html-to-json', 'File not found: ' + fullPath);
    }

}

/**
 *
 * @param dirname
 * @param p
 * @return {*}
 */
function indName (dirname, p) {

    if (typeof p.filename !== 'undefined') {

        return p.filename;
    }

    var n = dirname.split('.');

    n.pop();

    var nLast = n.pop(), nArr = [];

    if (nLast.indexOf('/') >= 0) {

        nArr = nLast.split('/')
    } else {

        nArr = nLast.split('\\')
    }

    return nArr.pop();
}

/**
 *
 * @param path
 * @param fname
 * @param useAsVariable
 * @returns {*}
 */
function replaceFilename (path, fname, useAsVariable) {

    var uvar = useAsVariable || false;

    var filename = path.replace(/^.*(\\|\/|\:)/, '');
    var nFname = path.replace(filename, fname);
    var ext = (uvar) ? ".js" : '.json';
    return gUtil.replaceExtension(nFname,  ext);
}

/**
 * Control HTML to JSON
 * @param fileContents
 * @param filePath
 * @param output
 * @param p
 */
function htmlToJsonController (fileContents, filePath, output, p) {

    var matches;

    while (matches = _DIRECTIVE_REGEX.exec(fileContents)) {
        var relPath     = path.dirname(filePath),
            fullPath    = path.join(relPath,  matches[3].replace(/['"]/g, '')).trim(),
            jsonVar     = matches[2],
            extension   = matches[3].split('.').pop();

        try {

            if (typeof p.baseDir != 'undefined' || typeof p.overrideDir != 'undefined') {

                var flPath = fullPath.replace(p.baseDir, p.overrideDir);

                if (fs.existsSync(flPath)) {
                    fullPath = flPath;
                }
            }

            var files = glob.sync(fullPath, {mark:true});

            files.forEach(function(value){

                var _inc = _parse(value);

                if (_inc.length > 0) {
                    var ind = (jsonVar.trim() == '*') ? indName(value) : jsonVar;
                    output[ind] = _inc;
                }
            })

        } catch (err) {
            console.log(err)
        }

    }
}

/**
 * Make Angular Template
 * @param params
 * @param json
 * @returns {string}
 */
function angularTemplate (params, json) {

    var prefix = (params.prefix != "") ? params.prefix + "." : "";

    var tpl = 'angular.module("'+ prefix +  params.filename +'",["ng"]).run(["$templateCache",';

    tpl += 'function($templateCache) {';

    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            tpl += '$templateCache.put("'+ key +'",';
            tpl += JSON.stringify(json[key]);
            tpl += ');'
        }
    }

    tpl += '}])';

    return tpl;
}

/**
 * Module Exports htmlToJson
 * @param params
 * @returns {*}
 */
module.exports = function(params) {

    params = params || {};

    function htmToJson(file, callback) {

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            throw new gUtil.PluginError('gulp-html-to-json', 'stream not supported');
        }

        if (file.isBuffer()) {

            var outputJson = {};

            htmlToJsonController(String(file.contents), file.path, outputJson, params);

            params.filename = indName(file.path, params);
            params.prefix || (params.prefix = "");
            params.useAsVariable || (params.useAsVariable = false);
            params.isAngularTemplate || (params.isAngularTemplate = false);

            if(params.isAngularTemplate) {
                var output = angularTemplate(params, outputJson);
                file.path = replaceFilename(file.path, params.filename, params.useAsVariable);
                file.contents = new Buffer(output);

            } else {
                file.path = replaceFilename(file.path, params.filename, params.useAsVariable);

                var exVars = (params.useAsVariable) ? "var " + params.filename + "=" : "";
                file.contents = new Buffer(exVars + JSON.stringify(outputJson));
            }
        }

        callback(null, file);
    }

    return es.map(htmToJson)
};
