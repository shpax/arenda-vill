'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Created by max on 19.03.16.
 */

var gulp = require('gulp'),
    download = require('gulp-download'),
    rename = require('gulp-rename'),
    fs = require('fs'),
    querystring = require('querystring'),
    http = require('http');

var settings;
var configfile = 'ovoconfig.json';

gulp.task('default', ['init', 'watch-all'], function () {
    console.log("Files downloaded! Use 'watch-all' task to auto update");
});

gulp.task('watch-all', ['init'], function () {
    gulp.watch('*/*.html', ['push-all']);
    gulp.watch('*/*.js', ['push-all']);
    gulp.watch('*/*.css', ['push-all']);

    gulp.watch('main.css', ['push-all']);
    gulp.watch('main.js', ['push-all']);
});

gulp.task('download-all', ['init'], function () {
    var _settings = settings;
    var use_common = _settings.use_common;
    var page_urls = _settings.page_urls;
    var snippet_ids = _settings.snippet_ids;

    // downloading main js and css

    if (use_common) ['css', 'js'].forEach(function (extention) {
        download(get_req(extention)).pipe(rename('main.' + extention)).pipe(gulp.dest("."));
    });

    // downloading all pages, from settings.page_urls
    if (page_urls) page_urls.forEach(function (pageUrl) {
        ['css', 'js', 'html'].forEach(function (extention) {
            download(get_req(extention, pageUrl)).pipe(rename((pageUrl == '/' ? 'main' : pageUrl) + '.' + extention)).pipe(gulp.dest((pageUrl == '/' ? 'main' : pageUrl) + "/"));
        });
    });

    if (snippet_ids) snippet_ids.forEach(function (snippet_id) {
        ['css', 'js', 'html'].forEach(function (extention) {
            download(get_req(extention, snippet_id, true)).pipe(rename('snippet_' + snippet_id + '.' + extention)).pipe(gulp.dest('snippets/' + snippet_id + '/'));
        });
    });
});

gulp.task('push-all', ['init'], function () {
    var _settings2 = settings;
    var use_common = _settings2.use_common;
    var page_urls = _settings2.page_urls;
    var snippet_ids = _settings2.snippet_ids;

    //push main js and css

    if (use_common) ['css', 'js'].forEach(function (extention) {
        var filename = compiled('main.' + extention);
        if (fs.existsSync(filename)) {
            console.log("sending file " + filename);
            var data = fs.readFileSync(filename, 'utf-8');
            postToServer(data, extention);
        } else console.log("file " + filename + " not found");
    });

    //push page html, css and js
    if (page_urls) page_urls.forEach(function (pageUrl) {
        ['css', 'js', 'html'].forEach(function (extention) {
            var filename = (pageUrl == '/' ? 'main' : pageUrl) + '/' + (pageUrl == '/' ? 'main' : pageUrl) + '.' + extention;

            filename = compiled(filename);

            if (fs.existsSync(filename)) {
                console.log("sending file " + filename);
                var data = fs.readFileSync(filename, 'utf-8');
                postToServer(data, extention, pageUrl);
            } else console.log("file " + filename + " not found");
        });
    });

    if (snippet_ids) snippet_ids.forEach(function (snippet_id) {
        ['css', 'js', 'html'].forEach(function (extention) {
            var filename = 'snippets/' + snippet_id + '/snippet_' + snippet_id + '.' + extention;

            filename = compiled(filename);

            if (fs.existsSync(filename)) {
                console.log("sending file " + filename);
                var data = fs.readFileSync(filename, 'utf-8');
                postToServer(data, extention, snippet_id, true);
            } else console.log("file " + filename + " not found");
        });
    });
});

gulp.task('init', function () {
    if (!fs.existsSync(configfile)) throw new Error("no config file");
    if (settings == undefined) {
        settings = JSON.parse(fs.readFileSync(configfile, 'utf-8'));
        console.log(settings);
    }
});

function get_req(what, page_url, get_snippet_bool) {
    var str = 'http://api.ovobox.com/get_site_content?';

    str += ["phone=" + settings.phone, "password=" + settings.password, "domain=" + settings.domain, "what=" + what].join('&');

    if (page_url && !get_snippet_bool) str += "&page_url=" + encodeURIComponent(page_url);

    if (get_snippet_bool && page_url) str += "&snippet_id=" + page_url;

    return str;
}

function postToServer(data, what, pageUrl, post_snippet_bool) {
    if (!data || data == '') return;
    // Build the post string from an object
    var post_data = querystring.stringify(_defineProperty({
        'phone': settings.phone,
        'password': settings.password,
        'domain': settings.domain,
        'what': what,
        'data': data
    }, post_snippet_bool ? 'snippet_id' : 'page_url', pageUrl));

    // An object of options to indicate where to post to
    var post_options = {
        host: 'api.ovobox.com',
        port: '80',
        path: '/put_site_content',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(post_data)
        }
    };

    // Set up the request
    var post_req = http.request(post_options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            console.log('Error: ' + chunk);
        });
    });

    // post the data
    post_req.write(post_data);
    post_req.end();
}

// returns filename if there is no compiled variant
function compiled(filename) {
    var _settings3 = settings;
    var compile_suffix = _settings3.compile_suffix;

    var compiled = filename.replace(/\.(.+)$/, compile_suffix + '.$1');
    try {
        fs.accessSync(compiled);
        return compiled;
    } catch (e) {
        return filename;
    }
}

//# sourceMappingURL=gulpfile-compiled.js.map