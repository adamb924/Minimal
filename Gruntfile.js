module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-postcss');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
grunt.loadNpmTasks('grunt-html');

  // Default task(s).
  grunt.registerTask('default', ['clean','jshint','uglify','postcss','htmllint','htmlmin']);

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
	clean: ["build"],
	  jshint: {
		all: ['Gruntfile.js', 'minimal.js' ]
	  },
	postcss: {
		options: {
		  map: false,
		  processors: [
			require('pixrem')(), // add fallbacks for rem units
			require('autoprefixer')(), // add vendor prefixes
			require('cssnano')() // minify the result
		  ]
		},
	dist: {
		files: {
			'build/minimal.css': 'minimal.css'
		}
	}
  },
	uglify: {
      build: {
		files: {
			'build/minimal.js': 'minimal.js',
		}
      }
    },
  htmllint: {
	  all: ["*.html"]
  },
  htmlmin: {
    dist: {
		options: {
        removeComments: true,
        collapseWhitespace: true
      },
      files: {
		'build/minimal.html' : 'minimal.html',
      }
    },
  },
  
  });
};