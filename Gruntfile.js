'use strict';

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            allFiles: ['gruntfile.js', 'lib/**/*.js', 'test/**/*.js'],
            options: {
                jshintrc: '.jshintrc',
            }
        },
        mochacli: {
            all: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                ui: 'tdd'
            }
        },
        'mocha_istanbul': {
            coveralls: {
                src: 'test/lib',
                options: {
                    coverage: true,
                    legend: true,
                    check: {
                        lines: 90,
                        statements: 90
                    },
                    root: './lib',
                    reportFormats: ['lcov']
                }
            }
        }
    })

    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(error) {
            if (error) {
                console.log(error)
                return done(error)
            }
            done()
        })
    })

    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-jshint')
    grunt.loadNpmTasks('grunt-mocha-cli')
    grunt.loadNpmTasks('grunt-istanbul')
    grunt.loadNpmTasks('grunt-istanbul-coverage')
    grunt.registerTask('coveralls', ['mocha_istanbul:coveralls'])
    // Configure tasks
    grunt.registerTask('default', ['test'])
    grunt.loadNpmTasks('grunt-mocha-istanbul')
    grunt.registerTask('test', ['mochacli', 'jshint', 'coveralls'])
}