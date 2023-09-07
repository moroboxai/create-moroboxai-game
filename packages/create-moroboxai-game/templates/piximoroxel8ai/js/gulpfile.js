'use strict';

const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

// Webpack config for building the game
function gameWebpackConfig(name) {
    return {
        context: path.resolve(__dirname, name),
        entry: './game.js',
        mode: 'development',
        target: 'web',
        node: false,
        module: {
            rules: [{
                test: /\.tsx?$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        onlyCompileBundledFiles: true
                    }
                }],
                exclude: /node_modules/
            }]
        },
        output: {
            filename: "game.js",
            path: path.resolve(__dirname, "dist"),
            library: {
                type: 'umd'
            }
        },
        resolve: {
            extensions: ['.ts', '.js']
        }
    };
}

function buildGame(name, prod) {
    return () => gulp.src(`./${name}/game.ts`)
        .pipe(ts.createProject('tsconfig.json', {
            module: "ES6",
            target: "es6"
        })())
        .pipe(gulp.dest(`./${name}`));
}

function buildAgent(name) {
    return () => gulp.src(`./${name}/agent.ts`)
        .pipe(ts.createProject('tsconfig.json', {
            module: "ES6",
            target: "es6"
        })())
        .pipe(gulp.dest(`./${name}`));
}

const GAMES = ["piximoroxel8ai-sample", "pong"];

GAMES.forEach(name => {
    gulp.task(`build-${name}-game`, buildGame(name));
    gulp.task(`build-${name}-agent`, buildAgent(name));
    gulp.task(`build-${name}`, gulp.series(`build-${name}-game`, `build-${name}-agent`));
});

gulp.task('build', gulp.series(...GAMES.map(name => `build-${name}`)));