const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const port = 8080

// Parse JSON bodies (as sent by API clients)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const { connection } = require('./connector')



app.get('/totalRecovered', async (req, res) => {
  try { 
    const result = await connection.aggregate([

      {$group:{_id:"total","recovered":{$sum:"$recovered"}}},      
    ]) 
    res.status(200).json({
      data: result[0]
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})

app.get('/totalActive', async (req, res) => {
  try { 
    const result = await connection.aggregate([
      {
        $group: {
          _id: "total",
          totalInfected: { $sum: "$infected" },
          totalRecovered: { $sum: "$recovered" }
        }
     },
     {
        $addFields:{
          active: { $subtract: ["$totalInfected", "$totalRecovered"] }
        }
     }
    ])// infected-recovered
    res.status(200).json({
      data: result[0]
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})


app.get('/totalDeath', async (req, res) => {
  try { 
    const result = await connection.aggregate([

      {$group:{_id:"total","death":{$sum:"$death"}}},      
    ]) 
    res.status(200).json({
      data: result[0]
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
});

app.get('/hotspotStates', async (req, res) => {
  try { 
    const result = await connection.aggregate([
      {$project:{_id:0, "state":"$state", "rate":{$round:[{$divide:[{$subtract:["$infected","$recovered"]},"$infected"]},5]}}}
    ,{$match: {rate: { $gt: 0.1 }}}
  ])
    
    res.status(200).json({
      data: result
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})

app.get('/healthyStates', async (req, res) => {
  try { 
    const result = await connection.aggregate([

      {$project:{_id:0, "state":"$state", "morality":{$round:[{$divide:["$death","$infected"]},5]}}},
      {$match: {morality: { $lt: 0.005 }}}
    ]) 
    res.status(200).json({
      data: result
    })
  } catch (e) {
    res.status(500).json({
      status: 'Failed',
      message: e.message
    })
  }
})

app.listen(port, () => console.log(`App listening on port ${port}!`))

module.exports = app;