module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            all: [
                "dist"
            ]
        },
        jasmine: {
            all: {
                src: "dist/<%= pkg.name %>_<%= pkg.version %>.js",
                options: {
                    specs: "spec/*_spec.js",
                    helpers: ["spec/*_helper.js",
                              "deps/*.js"]
                }
            }
        },
        concat: {
            dist: {
                src: [
                    "src/license.js",
                    "src/mysql.js",
                    "src/network_error_code.js",
                    "src/hasher.js",
                    "src/binary_utils.js",
                    "src/mysql_types.js",
                    "src/mysql_models.js",
                    "src/mysql_protocol.js",
                    "src/mysql_communication.js",
                    "src/mysql_client.js",
                    "src/chrome_socket.js",
                    "src/chrome_socket_2.js",
                    "src/query_divider.js",
                    "src/column_type.js"
                ],
                dest: "dist/<%= pkg.name %>_<%= pkg.version %>.js"
            }
        },
        uglify: {
            options: {
                banner: "/*! MySQL JavaScript Driver <%= pkg.version %> " +
                    "Copyright (c) <%= grunt.template.today('yyyy') %> Yoichiro Tanaka. " +
                    "Apache License Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0) */\n"
            },
            dist: {
                src: [
                    "src/mysql.js",
                    "src/network_error_code.js",
                    "src/hasher.js",
                    "src/binary_utils.js",
                    "src/mysql_types.js",
                    "src/mysql_models.js",
                    "src/mysql_protocol.js",
                    "src/mysql_communication.js",
                    "src/mysql_client.js",
                    "src/chrome_socket.js",
                    "src/chrome_socket_2.js",
                    "src/query_divider.js",
                    "src/column_type.js"
                ],
                dest: "dist/<%= pkg.name %>_<%= pkg.version %>.min.js"
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: ["deps/encoding.js",
                          "deps/encoding-indexes.js",
                          "deps/sha1.js",
                          "deps/forge.min.js"],
                    dest: "dist/lib/",
                    filter: "isFile"
                }]
            }
        },
        jshint: {
            files: [
                "Gruntfile.js",
                "package.json",
                "src/*.js"
            ]
        },
        watch: {
            files: ["src/*.js", "spec/*.js"],
            tasks: ["concat", "uglify", "jasmine", "jshint"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-jshint");

    grunt.registerTask("default", ["concat",
                                   "uglify",
                                   "jasmine",
                                   "copy"]);

};
