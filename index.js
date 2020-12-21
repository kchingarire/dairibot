const express = require('express')
var request = require('request');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
// load in JSON from a file named data.json
var images     = require('./images');

// Hello World
const app = express()
const Dairibord = require('./routes/dairibord');
const port = 5334




mongoose.connect('mongodb://localhost/dairibot');
mongoose.Promise = global.Promise;

var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(bodyParser.json());

//allowing requests from outside of the domain 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,Accept");
  next();
});

app.use('/api/incoming-webhook', Dairibord);

/*app.post('/api/incoming-webhook', (req, res) => res.send(
    [{
      "text": "Look, Reply from Webhook!",
      "type": "image",
      "files":[{
        "name":"ad1.jpg",
        "file":images.dataAgeLogo
    }]
    }]
)) */
app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
