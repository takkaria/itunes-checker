#!/usr/bin/env node

'use strict'

const path = require('path')
const userhome = require('userhome')
const fs = require('fs')
const itunes = require('itunes-library-stream')
const async = require('async')
const mdls = require('./mdls')

// Options
const argv = require('yargs').argv

const libraryPath = argv.libpath ||
		path.resolve(userhome(), 'Music/iTunes/iTunes Music Library.xml')
const inputFiles = argv._

if (inputFiles.length === 0) {
	console.error('ERROR: No files provided to check')
	return
}

function debug(str) {
	if (argv.debug)
		console.log(str);
}

function getFileData(file, done) {
	fs.access(file, fs.constants.R_OK, err => {
		if (err) {
			console.error('ERROR: file "' + file + '" not readable')
			done()
		} else {
			mdls(file, done)
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

	if (input.Title === track.Name) {
		debug('match name')
		matchFactor += 10
	}

	if (input.Album === track.Album) {
		debug('match album')
		matchFactor += 5
	}

	if (input.Authors[0] === track.Artist) {
		debug('match artist')
		matchFactor += 5
	}

	if (input.Size === track.Size) {
		debug('match size')
		matchFactor += 20
	}

	if (Math.floor(input.DurationSeconds * 1000) === track['Total Time']) {
		debug('match time')
		matchFactor += 10
	}

	return matchFactor
}

function showMatch(factor, input, track) {
	console.log('MATCH: factor ' + factor + '\n' +
			'Input: ' +
			input.AlternateNames[0] +
			'\niTunes track: ' +
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

				if (matchFactor > 0) {
					debug('total factor ' + matchFactor)
					debug('Are ' +
							input.AlternateNames[0] +
							' and ' +
							track.Location +
							' the same track?')
				}

				if (matchFactor >= 15) {
					showMatch(matchFactor, input, track)
				}
			}
		})
		.on('end', () => {
			console.log('FINISHED.')
		})
}

processInputFiles(inputFiles, checkForDuplicates)
