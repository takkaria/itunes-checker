# itunes-checker
Find out if you already have given audio files in your iTunes library using fuzzy matching.  OS X only (depends on Spotlight metadata).  Doesn't have a very sophisticated algorithm.

To install:

`$ npm install -g itunes-checker`

Run it like so:

`$ itunes-checker <filename list>`

It will print out stuff like:

```
$ itunes-checker *.mp3
MATCH: factor 30
Input: /Users/test/Downloads/01 - 20th Century Boy.mp3
iTunes track: file:///Users/test/Music/iTunes/iTunes%20Music/T.%20Rex/Greatest/01%2020th%20Century%20Boy.mp3

MATCH: factor 30
Input: /Users/test/Downloads/03 - Temptation.mp3
iTunes track: file:///Users/test/Music/iTunes/iTunes%20Music/New%20Order/Substance/03%20Temptation.mp3

FINISHED.
```
