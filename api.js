// Express App for API Calls
const cors = require('cors');
const express = require('express');
const {json} = require('express');
const app = express();

app.use(json());
app.use(cors());

app.listen(5000,()=>{
    console.log('API SERVER RUNNING @ http://localhost:5000')
});