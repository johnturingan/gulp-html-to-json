var NAME = 'gulp-markdown-to-json';
var fs      = require("fs"),
    path    = require("path"),
    es      = require("event-stream"),
    gutil   = require("gulp-util");

DIRECTIVE_REGEX = /^(.*=\s*([\w\.\/-]+)\s*:\s*([\w\.\/-]+\.html?\s*))$/gm;
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

            while (matches = DIRECTIVE_REGEX.exec(text)) {
                var match       = matches[1],
                    relPath     = path.dirname( file.path ),
                    fullPath    = path.join(relPath,  matches[3].replace(/['"]/g, '')).trim(),
                    jsonVar     = matches[2],
                    extension   = matches[3].split('.').pop();

                    if (fs.existsSync(fullPath)) {
                        console.log("exist");
                    } else {
                        throw new gutil.PluginError('gulp-html-to-json', 'File not found: ' + fullPath);
                    }
            }
        }

        callback(null, file);
    }

    return es.map(include)
}
