var NAME = 'gulp-html-to-json';
var fs      = require("fs"),
    path    = require("path"),
    es      = require("event-stream"),
    gutil   = require("gulp-util"),
    marked = require('marked'),
    frontmatter = require('front-matter');


DIRECTIVE_REGEX = /^(.*=\s*([\w\.\*\/-]+)\s*:\s*([\w\.\/-]+\.html?\s*))$/gm;
IS_HIDDEN_REGEX = /(^|.\/)\.+[^\/\.]/g;


function getFiles(dir, cb){
    var files = fs.readdirSync(dir);

    for(var i in files){
        if (!files.hasOwnProperty(i)) continue;
        var name = dir+'/'+files[i];
    var isHidden = IS_HIDDEN_REGEX.test(name);
    if (!isHidden) {
      if (fs.statSync(name).isDirectory()){
        getFiles(name, cb);
      } else {
        cb(name);
      }
    }
    }
}


function matchExtension(extension, params) {
    if (params.extensions) {
        if (Array.isArray(params.extensions)) {
            if (params.extensions.indexOf(extension) > -1) return true;
        } else if (typeof params.extensions == "string") {
            if (params.extensions == extension) return true;
        } else {
            throw new gutil.PluginError('gulp-html-to-json', 'extensions param only allows Array or String');
        }
    }else{
        return true;
    }
    return false;
}

function parse(file){

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

            var text = String(file.contents);
            var newText = text;
            var matches;
            var outputJson = {};

            while (matches = DIRECTIVE_REGEX.exec(text)) {
                var match       = matches[1],
                    relPath     = path.dirname(file.path ),
                    fullPath    = path.join(relPath,  matches[3].replace(/['"]/g, '')).trim(),
                    jsonVar     = matches[2],
                    body        = "",
                    extension   = matches[3].split('.').pop();

                var _inc = parse(fullPath);

                if (_inc.length > 0) {
                    var ind = (jsonVar.trim() == '*') ? indName(matches[3]) : jsonVar

                    outputJson[ind] = _inc;
                }
            }

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
