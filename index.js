var NAME = 'gulp-html-to-json';
var fs      = require("fs"),
    path    = require("path"),
    es      = require("event-stream"),
    gutil   = require("gulp-util"),
    marked  = require('marked'),
    glob    = require('glob'),
    frontmatter = require('front-matter');

_DIRECTIVE_REGEX = /^(.*=\s*([\w\.\*\/-]+)\s*:\s*([\w\.\*\/-]+\.html?\s*))$/gm;
_IS_HIDDEN_REGEX = /(^|.\/)\.+[^\/\.]/g;


function _parse(file){

    if (fs.existsSync(file)) {
        var bufferContents = fs.readFileSync(file);
        parsed = frontmatter(bufferContents.toString().replace(/\s+/g, ' '));

        return parsed.body;

    } else {
        throw new gutil.PluginError('gulp-html-to-json', 'File not found: ' + fullPath);
    }

}

function indName (dirname) {

    var n = dirname.split('.');
    n.pop();
    nLast = n.pop();
    var nArr = []
    if (nLast.indexOf('/') >= 0) {
        nArr = nLast.split('/')
    } else {
        nArr = nLast.split('\\')
    }

    return nArr.pop();
}

function replaceFilename (path, fname, useAsVariable) {

    var uvar = useAsVariable || false;

    var filename = path.replace(/^.*(\\|\/|\:)/, '');
    var nFname = path.replace(filename, fname);
    var ext = (uvar) ? ".js" : '.json';
     return gutil.replaceExtension(nFname,  ext);
}


function htmltojsonController (fileContents, filePath, output) {

    while (matches = _DIRECTIVE_REGEX.exec(fileContents)) {
        var relPath     = path.dirname(filePath),
            fullPath    = path.join(relPath,  matches[3].replace(/['"]/g, '')).trim(),
            jsonVar     = matches[2],
            extension   = matches[3].split('.').pop();

        try {
            var files = glob.sync(fullPath, {mark:true});

            files.forEach(function(value, index){

                var _inc = _parse(value);

                if (_inc.length > 0) {
                    var ind = (jsonVar.trim() == '*') ? indName(value) : jsonVar
                    output[ind] = _inc;
                }
            })

        } catch (err) {
            console.log(err)
        }

    }
}

function angularTemplate (params, json) {
    var prefix = (params.prefix != "") ? params.prefix + "." : "";
    var tpl = 'angular.module("'+ prefix +  params.filename +'",["ng"]).run(["$templateCache",';
    tpl += 'function($templateCache) {';

    for (var key in json) {
        if (json.hasOwnProperty(key)) {
            tpl += '$templateCache.put("'+ key +'",';
            tpl += JSON.stringify(json[key])
            tpl += ');'
        }
    }

    tpl += '}])';

    return tpl;
}


module.exports = function(params) {
    var params = params || {};
    function htmtojson(file, callback) {

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            throw new gutil.PluginError('gulp-html-to-json', 'stream not supported');
        }

        if (file.isBuffer()) {

            var outputJson = {};

            htmltojsonController(String(file.contents), file.path, outputJson);

            params.filename || (params.filename = indName(file.path));
            params.prefix || (params.prefix = "");
            params.useAsVariable || (params.useAsVariable = false);
            params.isAngularTemplate || (params.isAngularTemplate = false);

            if(params.isAngularTemplate) {
                var output = angularTemplate(params, outputJson);
                file.path = replaceFilename(file.path, params.filename, params.useAsVariable)
                file.contents = new Buffer(output);

            } else {
                file.path = replaceFilename(file.path, params.filename, params.useAsVariable)

                var exVars = (params.useAsVariable) ? "var " + params.filename + "=" : ""
                file.contents = new Buffer(exVars + JSON.stringify(outputJson));
            }
        }

        callback(null, file);
    }

    return es.map(htmtojson)
}
