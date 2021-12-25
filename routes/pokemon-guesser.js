//Libraries
require('http');
require('dotenv').config();

const { JSDOM } = require( "jsdom" );
const { window } = new JSDOM( "" );
const $ = require( "jquery" )( window );

const PythonShell = require('python-shell').PythonShell;

//Express
var express = require('express');
const { table } = require('console');
var router = express.Router();

//Run Python program
// Question and final guess to <p id='question'>
// Answer from <input id='answer'>
router.get('/', function(req, res, next){
    let pyshell = new PythonShell('./routes/my_script.py');
    //let pyshell = new PythonShell('./routes/pokemon-guesser/game_logic.py');

    $('#answer').on('submit', function(e){
        e.preventDefault();
        let answer = $('#answer').val();
        console.log(answer);
        pyshell.send(answer);
    });

    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
        res.type('js');
        res.send('document.getElementById("question").innerHTML = "' + message + '";');
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