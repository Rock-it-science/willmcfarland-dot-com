//Libraries
require('http');
require('dotenv').config();
var path = require('path');

const PythonShell = require('python-shell').PythonShell;

//Express
var express = require('express');
const app = express();
const { table } = require('console');
var router = express.Router();

// Functions
function startScript(req, res, next){
    
    // First load-in
    if(app.get('pyshell') == null){
        req.pyshell = new PythonShell('./routes/my_script.py');
        console.log('started python program');

        // Set global app var
        try{
            app.set('pyshell', req.pyshell);
        } catch(e){
            console.log('Error setting pyshell app global: ' + e);
        }
    }
    // Not first load-in (redirected from /guess)
    else{
        console.log('redirected');
        if(app.get('question') != null){
            var question = app.get('question');
            console.log('question set: ' + question);
            try {
                res.send('document.getElementById("question").innerHTML = "'+ question + '";');
            } catch(e){
                console.log('Could not send javascript: ' + e);
            }
        } else {
            console.log('question not set');
        }
    }
    res.end();
}

function input(req, res, next){
    // Try to get pyshell global
    try{
        req.pyshell = app.get('pyshell');
    } catch(e){
        console.log('Error getting pyshell');
    }

    // If pyshell has been set, send guess to python script
    if(req.pyshell != null){
        // Set listener for Python output (only set once)
        if(app.get('messageListener') == null){
            console.log('setting message listener');
            app.set('messageListener', true);
            req.pyshell.on('message', function (message) {
                // received a message sent from the Python script (a simple "print" statement)
                console.log('python script returned: ' + message);

                // Redirect back to home page
                try{
                    console.log('Setting question app var');
                    app.set('question', message);
                } catch(e){
                    console.log('Error setting question app  var: ' + e);
                }
                try{
                    console.log('Sending html');
                    res.sendFile(path.resolve('public/pokemon-guesser/pokemon-guesser.html'));
                } catch(e){
                    console.log('Error sending html: ' + e);
                }
            });
        }

        var guess = req.body.answer;
        console.log('sending to python script: ' + guess)
        req.pyshell.send(guess);
    } else {
        console.log('pyshell not defined')
    }
}

/*function end(req, res, next){
    // end the input stream and allow the process to exit
    req.pyshell.end(function (err,code,signal) {
        if (err) throw err;
    });
    res.send();
}*/

// On page load, start script and wait
router.get('/', startScript);

// On guess submit, input guess to python script
router.post('/guess', input);

module.exports = router;