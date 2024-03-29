// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var axios = require("axios")
var cors = require('cors')
app.use(cors())

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
app.get('/places/:text', async function (req, res) {
    console.log("query", req.params.text)
    try {
        const response = await axios({
            method: "get",
            url: `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${req.params.text}&key=AIzaSyBhO12JgxDXzbZG7gXRBwEN7FCJy1ThYjE`
        });
        res.json(response.data);
    } catch (error) {
        console.log(error);
        res.json(error);
    }

});


// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);