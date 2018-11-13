const gulp = require("gulp");
const pipe = require('gulp-pipe');
const through = require('through2');
const path = require('path');

const builder = require('nuance-gulp-build');

const Options = {
    none: 0,
    bump: 1,
    build: 2,
    pack: 4,
    push: 8
};

function exceptionHandler(ex) {
    console.error(ex);
}

function parseBool(v) {
    return (v || "false").toString().toLowerCase() == "true";
}

var configuration = null;
var env = "debug_local";
console.log("enviroment = ", env)
// if (process.env["build_env"] == "debug_local") {
    configuration = builder.environments["file"](require('./buildinfo.json'))();
//}
//else {
//    console.log(`using ${env} as environment`);
//    configuration = builder.environments[env]();
//}

function parseAllowedOptions(strOptions) {
    var allowedOptions = Options.none;

    for (var i = 0; i < strOptions.length; i++) {
        allowedOptions |= Options[strOptions[i]];
    }

    return allowedOptions;
}

const projects = function (options) {
    return gulp.src('./.buildconfig.json').pipe(through.obj(function (item, enc, done) {
        json = require(item.path);
        for (k in json.buildProjects) {
            var p = json.buildProjects[k];

            // this would change for bitbucket/gitlab
            p.configuration = configuration;

            var allowedOptions = parseAllowedOptions(p.options);

            var skip = ((allowedOptions & options) != options);

            if (!skip) {
                console.log("Processing [" + p.source_path + "]...");
                p.project = k;
                p.source_folder = path.dirname(p.source_path);
                p.file = path.resolve(p.source_path);
                p.source_path = p.file;
                this.push(p);
            }
            else {
                console.log("Skipping [" + p.source_path + "]...");
            }
        }
        done();
    }))
};

gulp.task("bump", () => projects(Options.bump).pipe(builder.bump()));

gulp.task('build', () => projects(Options.build).pipe(builder.build()));

gulp.task('pack', () => projects(Options.pack).pipe(builder.pack()));

gulp.task('push', () => projects(Options.push).pipe(builder.push()));

gulp.task('version', async () => await builder.version(configuration, 'VERSION.txt').catch(exceptionHandler));