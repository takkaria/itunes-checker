#!/usr/bin/env node

'use strict'

const path = require('path')
const userhome = require('userhome')
const fs = require('fs')
const itunes = require('itunes-library-stream')
const async = require('async')
const chalk = require('chalk')
const mdls = require('./mdls')

// Options
const argv = require('yargs')
		.alias('d', 'debug')
		.boolean('debug')
		.argv

const libraryPath = argv.libpath ||
		path.resolve(userhome(), 'Music/iTunes/iTunes Music Library.xml')
const inputFiles = argv._
const debugMode = argv.debug ? true : false
const lowestMatch = debugMode ? 1 : 15

if (inputFiles.length === 0) {
	console.error('ERROR: No files provided to check')
	return
}

function debug(str) {
	if (debugMode)
		console.log(str);
}

const normalizeMd = (filename, data) => ({
	filename:     filename,
	title:        data['Title'],
	album:        data['Album'],
	artist:       data['Authors'] ? data['Authors'][0] : null,
	size:         data['Size'],
	milliseconds: Math.floor(data['DurationSeconds'] * 1000)
})

function getFileData(file, done) {
	fs.access(file, fs.constants.R_OK, err => {
		if (err) {
			console.error('ERROR: file "' + file + '" not readable')
			done()
		} else {
			mdls(file, (err, data) => {
				if (err) {
					console.error('ERROR: ', err)
					done()
				} else {
					done(null, normalizeMd(file, data))
				}
			})
		}
	})
}

function processInputFiles(files, done) {
	async.map(files, getFileData, (err, list) => {
		let anyFiles = list.reduce(
				(prev, curr) => prev + (curr ? 1 : 0),
				0)

		if (!anyFiles) {
			console.error('ERROR: no input files readable')
			console.log(list)
			process.exit(1)
		}

		done(err, list)
	})
}

function getMatch(input, track) {
	let matchFactor = 0

	if (input.title === track.Name) {
		debug('match name')
		matchFactor += 10
	}

	if (input.album === track.Album) {
		debug('match album')
		matchFactor += 5
	}

	if (input.artist === track.Artist) {
		debug('match artist')
		matchFactor += 5
	}

	if (input.size === track.Size) {
		debug('match size')
		matchFactor += 20
	}

	if (input.milliseconds === track['Total Time']) {
		debug('match time')
		matchFactor += 10
	}

	return matchFactor
}

function showMatch(factor, input, track) {
	console.log(chalk.green('MATCH:') + ' factor ' + factor + '\n' +
			chalk.yellow('Input: ') +
			input.filename +
			chalk.yellow('\niTunes track: ') +
			track.Location +
			'\n')

//	console.log('input:', input)
//	console.log('track:', track)
}

function checkForDuplicates(err, files) {
	let nFiles = files.length

	fs.createReadStream(libraryPath)
		.pipe(itunes.createTrackStream())
		.on('data', track => {
			for (let i = 0; i < nFiles; i++) {
				let input = files[i]
				let matchFactor = getMatch(input, track)

				if (matchFactor >= lowestMatch) {
					showMatch(matchFactor, input, track)
				}
			}
		})
		.on('end', () => {
			console.log('FINISHED.')
		})
}

processInputFiles(inputFiles, checkForDuplicates)
