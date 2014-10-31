# [gulp](http://gulpjs.com)-html-to-json

>Makes inclusion of files easy and fast.
Compile html files and wrap it all in a single json file.
Enables you to include only the files you want.

Install :traffic_light:
-------

```bash
$ npm install gulp-html-to-json --save
```


## Pipe :neckbeard:

Like any other gulp plugin, transformed source files will flow onward to the destination of your choice.

In your gulpfile.js

**`/gulpfile.js`**

```javascript
var gulp = require('gulp');
var htmltojson = require('html-to-json');

gulp.task('markdown', function(){
        gulp.src('path/to/your/**/*.tpl')
            .pipe(htmltojson({
                filename: "filenameyouwant"
            }))
            .pipe(gulp.dest('.'))


```

As of now, there are two options that you can use:
-- filename : filename of the json file
-- useAsVariable : default false. If true, it will output your file as a javascript variable. Otherwise, json file

Sample outpus if useAsVariable = false;

```javascript
{
    "key.name" : "<div>your html content</div>"
}

```
output file is filename.json


Sample outpus if useAsVariable = true;

```javascript
var filename = {
    "key.name" : "<div>your html content</div>"
}

```
output file is filaname.js

## Usage

In the file where you want want to compile you html, add a comment similar to this:

```javascript
//= key.name : relative/path/to/file.html
```

where key.name is the name want to associate with the html content in your json object.

If you use * as your key name like this :

```javascript
//= * : relative/path/to/file.html
```

It will automatically use the filename of your html as its key name.

If you want to use glob similar to commonly used in GruntJS, you may also to that like this:

```javascript
//= * : relative/path/to/**/*.html
```

Suggested key name is * so the it will use the filename as the keyname.

First sample code output:

```json
{
    "key.name" : "<div>your html content</div>"
}
```

Second sample code output:

```json
{
    "file" : "<div>your html content</div>"
}
```

Third sample will look into all hmtl content inside the directory and output it like this:

```json
{
    "file" : "<div>your html content</div>"
    "file2" : "<div>your html content 2</div>"
}
```

