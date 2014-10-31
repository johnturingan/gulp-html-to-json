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

function indName (dirname, splitter) {

    splitter = splitter || '/';
    var n = dirname.split('.');
    var nArr = n.pop();
    nArr = n.pop().split(splitter);

    return nArr.pop();
}

function replaceFilename (path, fname) {
    var filename = path.replace(/^.*(\\|\/|\:)/, '');
    var nFname = path.replace(filename, fname);
     return gutil.replaceExtension(nFname, '.json');
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



module.exports = function(params) {
    var params = params || {};
    function include(file, callback) {

        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            throw new gutil.PluginError('gulp-html-to-json', 'stream not supported');
        }

        if (file.isBuffer()) {

            var outputJson = {};

            htmltojsonController(String(file.contents), file.path, outputJson);

            params.filename || (params.filename = indName(file.path, "\\"));
            params.useAsVariable || (params.useAsVariable = false);

            //file.path = gutil.replaceExtension(file.path, '.json');
            file.path = replaceFilename(file.path, params.filename)

            var exVars = (params.useAsVariable) ? "var " + params.filename + "=" : ""
            file.contents = new Buffer(exVars + JSON.stringify(outputJson));
        }

        callback(null, file);
    }



    return es.map(include)
}
