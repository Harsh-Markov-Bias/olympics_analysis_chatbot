const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(express.json());
  // Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));
// Proxy POST /api/medal_tally to Python API


app.post('/api/height_weight_medalists', async(req, res)=>{
  try{
    const { selected_sport, selected_medal } = req.body;
    console.log('Received body:', req.body);
    // Prepare request to Python backend API
    const pythonResp = await fetch('http://127.0.0.1:5000/api/height_weight_medalists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_medal,
        selected_sports: selected_sport
      })
    });

    if (!pythonResp.ok) {
      const errText = await pythonResp.text();
      console.error('Python API error:', errText);
      return res.status(pythonResp.status).send(errText);
    }

    // Forward JSON response from Python backend
    const data = await pythonResp.json();
    res.json(data);
  }catch(error){
    console.error('Error contacting python api /api/height_weight_medalists', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})



app.post('/api/sportMedalAgeDist', async(req, res)=>{
  try{
    const { selected_medal, selected_sports } = req.body;

    // Prepare request to Python backend API
    const pythonResp = await fetch('http://127.0.0.1:5000/api/sportMedalAgeDist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selected_medal,
        selected_sports
      })
    });

    if (!pythonResp.ok) {
      const errText = await pythonResp.text();
      console.error('Python API error:', errText);
      return res.status(pythonResp.status).send(errText);
    }

    // Forward JSON response from Python backend
    const data = await pythonResp.json();
    res.json(data);
  }catch(error){
    console.error('Error contacting python api /api/medal_age_by_sports', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})

app.get('/api/medalVsAgeDistribution', async(req, res)=>{
  try{
    const pythonResp = await fetch(`http://127.0.0.1:5000/api/medalVsAgeDistribution`)
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting python api /api/medalVsAgeDistribution', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})

app.get('/api/countryTopAthelete/:country', async(req, res)=>{
  try{
    const { country } = req.params
    const pythonResp = await fetch(`http://127.0.0.1:5000/api/countryTopAthelete/${encodeURIComponent(country)}`)
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting python api /api/countryTopAthelete/:country', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})

app.get('/api/countrySportTallyHeatmap/:country', async(req, res)=>{
  try{
    // console.log(req.params.country)
    const { country } = req.params
    // console.log(`This is it' ${country}`)
    const pythonResp = await fetch(`http://127.0.0.1:5000/api/countrySportTallyHeatmap/${encodeURIComponent(country)}`)
    const data = await pythonResp.json()
    // console.log(data)
    res.json(data)
  }catch(error){
    console.error('Error contacting python api /api/countrySportTallyHeatmap/:country ', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})


app.get('/api/showCountryWiseMedalTally/:country', async(req, res)=>{
  try{
    const { country } = req.params
    const pythonResp = await fetch(`http://127.0.0.1:5000/api/showCountryWiseMedalTally/${encodeURIComponent(country)}`)
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting python api /api/showCountryWiseMedalTally/:country ', error)
    res.status(500).json({error: 'Internal Server Error'})
  }
})

app.get('/api/country_list', async(req, res)=>{
  try{
    const pythonResp = await fetch('http://127.0.0.1:5000/api/country_list')
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting Python Api /api/country_list ', error)
    res.status(500).json({error:'Internal Server Error'})
  }
})

app.get('/api/sport_list', async(req, res)=>{
  try{
    const pythonResp = await fetch('http://127.0.0.1:5000/api/sport_list')
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting Python Api /api/sport_list', error)
    res.status(500).json({error:'Internal Server Error'})
  }
})

app.get('/api/most_successful/:sport', async(req, res)=>{
  try{
    const { sport } = req.params;
    const pythonResp = await fetch(`http://127.0.0.1:5000/api/most_successful/${encodeURIComponent(sport)}`)
    const data = await pythonResp.json()
    res.json(data)
  }catch(error){
    console.error('Error contacting Python Api /api/most_successful', error)
    res.status(500).json({error:'Internal Server Error'})
  }
})


app.get('/api/events_heatmap', async(req, res)=>{
  try{
    const pythonResp = await fetch('http://127.0.0.1:5000/api/events_heatmap');
    if (!pythonResp.ok) {
      throw new Error(`Python API error: ${pythonResp.statusText}`);
    }
    const data = await pythonResp.json();
    res.json(data);
  }catch(error){
    console.error('Error contacting Python API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/api/men_women', async(req, res)=>{
  try{
    const pythonResp = await fetch('http://127.0.0.1:5000/api/men_women');
    const data = await pythonResp.json();
    res.json(data);
  }catch(error){
    console.error('Error contacting Python API:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.get('/api/nations_overtime', async(req, res)=>{
  try {
    const { ylabel } = req.query;   // extract from incoming request
    const pythonUrl = `http://127.0.0.1:5000/api/nations_overtime?ylabel=${encodeURIComponent(ylabel)}`;
    const pythonResp = await fetch(pythonUrl);
    const data = await pythonResp.json();
    res.json(data);
  } catch (err) {
    console.error('Error contacting Python API:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/overall_stats', async (req, res) => {
  try {
    const pythonResp = await fetch('http://127.0.0.1:5000/api/overall_stats');
    const data = await pythonResp.json();
    res.json(data);
  } catch (err) {
    console.error('Error contacting Python API:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/medal_tally', async (req, res) => {
  try {
    const pythonResp = await fetch('http://127.0.0.1:5000/api/medal_tally', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body) 
    });
    const text = await pythonResp.text();
    // console.log('Raw response from Python API:', text);
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error('Error contacting Python API:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Proxy GET /api/years_countries to Python API and forward response
app.get('/api/years_countries', async (req, res) => {
  try {
    const pythonResp = await fetch('http://127.0.0.1:5000/api/years_countries');
    const data = await pythonResp.json();
    // console.log(data)
    res.json(data);
  } catch (err) {
    console.error('Error contacting Python API:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start node server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Node.js server running on port ${PORT}`));
