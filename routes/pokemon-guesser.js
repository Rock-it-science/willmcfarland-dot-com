//Libraries
require('http');
require('dotenv').config();
//const PythonShell = require('python-shell').PythonShell;

//Express
var express = require('express');
const { table } = require('console');
var router = express.Router();

//Run Python program
// Question and final guess to <p id='question'>
// Answer from <input id='answer'>
router.get('/', function(req, res, next){
    let pyshell = new PythonShell('my_script.py');

    // sends a message to the Python script via stdin
    pyshell.send('hello');

    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
    });

    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err) throw err;
            console.log('The exit code was: ' + code);
            console.log('The exit signal was: ' + signal);
            console.log('finished');
    });
});

module.exports = router;