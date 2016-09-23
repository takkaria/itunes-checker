'use strict';

const path = require('path')
const exec = require('child_process').exec

module.exports = function mdls(file, ready) {
  file = path.resolve(file).replace(/[\ \(\)\&]/g, match => '\\' + match)

  exec('mdls ' + file, function(err, raw_data) {
    if (err) {
      ready(err)
    }

    ready(null, deserialize(raw_data))
  })
}

function parseRaw(rawData) {
  let rawLines = rawData.split('\n') // only targets osx
  let lines = []

  let inArray = false
  let currLine

  for (let line of rawLines) {
    line = line.trim()

    if (line != '') {
      if (inArray === false) {
        // Switch into array-collection mode with a (
        if (line.endsWith('(')) {
          currLine = line
          inArray = true
        } else {
          lines.push(line)
        }
      } else {
        currLine += line

        // A final ) on its own is the end of an array
        if (line === ')') {
          lines.push(currLine)
          currLine = ''
          inArray = false
        }
      }
    }
  }

  return lines
}

function deserialize(rawData) {
  const lines = parseRaw(rawData)
  let data = {}

  for (let line of lines) {
    const kv = line.split('=')
    const key = kv[0].trim().replace('kMDItem', '')
    const forceString = (key === 'MediaTypes') ? true : false

    // Parsing this value correctly will require making a much better parser
    // One day...
    if (key === 'WhereFroms') {
      continue
    }

    let value = kv[1].trim()

    if (value === '(null)') {
      value = null
    } else if (value[0] === '(' && value[value.length - 1] === ')') {
      value = value.slice(1, -1).split(',').map(to_js_type(key, forceString))
    } else {
      value = to_js_type(key, forceString)(value)
    }

    data[key] = value
  }

  return data
}

function to_js_type(key, forceString) {
  return function(value) {
    if (value[0] === '"' && value[value.length - 1] === '"') {
      return value.slice(1, -1)
    }

    if (forceString) {
      return value;
    }

    var as_num = +value
    if (!isNaN(as_num)) {
      return as_num
    }

    var as_date = new Date(value)
    if (isNaN(as_date.getTime())) {
      bad_value(key, value)
    }

    return as_date
  }
}

function bad_value(key, value) {
  throw new Error('invalid value: ' + value + ' for key: ' + key)
}
