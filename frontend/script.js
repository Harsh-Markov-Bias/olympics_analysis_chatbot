const yearSelect = document.getElementById('yearSelect');
const countrySelect = document.getElementById('countrySelect');
const titleEl = document.getElementById('title');
const resultsEl = document.getElementById('results');

function buildTable(data) {
    
  if (!data || data.length === 0) {
    return '<p>Sorry! No Awards for this selection.</p>';
  }
  const columns = ['Country', 'Gold', 'Silver', 'Bronze', 'Total'];  // fixed order
  let table = '<table><thead><tr>';
  
  columns.forEach(col => {
    table += `<th>${col}</th>`;
  });
  table += '</tr></thead><tbody>';

  data.forEach(row => {
    table += '<tr>';
    columns.forEach(col => {
      table += `<td>${row[col]}</td>`;
    });
    table += '</tr>';
  });

  table += '</tbody></table>';
  return table;
}
// New function to populate years and countries dynamically
async function populateDropdowns() {
  try {
    const response = await fetch('/api/years_countries');
    const data = await response.json();
    console.log(data)
    // Clear existing options if any
    yearSelect.innerHTML = '';
    countrySelect.innerHTML = '';

    data.years.forEach(y => yearSelect.add(new Option(y, y)));
    data.countries.forEach(c => countrySelect.add(new Option(c, c)));
  } catch (error) {
    console.error('Error loading dropdown data:', error);
  }
}

populateDropdowns();         // drop down for countries and years lists

async function fetchMedalTally() {
  const selectedYear = yearSelect.value;
  const selectedCountry = countrySelect.value;

  // Update title like Streamlit
  if (selectedYear === 'OverAll' && selectedCountry === 'OverAll') {
    titleEl.textContent = 'Over-all Tally.';
  } else if (selectedYear !== 'OverAll' && selectedCountry === 'OverAll') {
    titleEl.textContent = `Medal Tally of ${selectedYear}-Olympics.`;
  } else if (selectedYear === 'OverAll' && selectedCountry !== 'OverAll') {
    titleEl.textContent = `Over All Medal Tally Of ${selectedCountry} in Olympics.`;
  } else {
    titleEl.textContent = `${selectedCountry}'s Medal Tally for ${selectedYear}-Olympics.`;
  }

  try {
    const response = await fetch('/api/medal_tally', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        year: selectedYear,
        country: selectedCountry
      })
    });
    const data = await response.json();
    // console.log(data)
    resultsEl.innerHTML = buildTable(data.medal_tally);
  } catch (error) {
    resultsEl.innerHTML = '<p>Error fetching data.</p>';
    console.error(error);
  }
}

// Renders the Olympic stats summary panel and clears previous content
function renderStatsAndClear(titleText, resultsId) {
    const html = `
      <h2>Key Olympics Statistics</h2>
      <div class="stats-row">
        <div class="stats-col"><h3>Editions</h3><div class="stat" id="stat-editions"></div></div>
        <div class="stats-col"><h3>City</h3><div class="stat" id="stat-cities"></div></div>
        <div class="stats-col"><h3>Sport</h3><div class="stat" id="stat-sports"></div></div>
      </div>
      <div class="stats-row">
        <div class="stats-col"><h3>Event</h3><div class="stat" id="stat-events"></div></div>
        <div class="stats-col"><h3>Athlete</h3><div class="stat" id="stat-athletes"></div></div>
        <div class="stats-col"><h3>Country</h3><div class="stat" id="stat-nations"></div></div>
      </div>
    `;
  
    document.getElementById('title').textContent = titleText;
    const resultsDiv = document.getElementById(resultsId);
    resultsDiv.innerHTML = html;
}
  
  // Fetches and populates the stats numbers
async function fillStats() {
    try {
    const response = await fetch('/api/overall_stats');
    const stats = await response.json();
    document.getElementById('stat-editions').textContent = stats.editions;
    document.getElementById('stat-cities').textContent = stats.cities;
    document.getElementById('stat-sports').textContent = stats.sports;
    document.getElementById('stat-events').textContent = stats.events;
    document.getElementById('stat-athletes').textContent = stats.athletes;
    document.getElementById('stat-nations').textContent = stats.nations;
    } catch (error) {
    console.error('Error fetching stats:', error);
    }
}

// Fetches data and renders one Plotly chart inside containerId
async function showOverallAnalysis(xlabel, ylabel, containerId, chartTitle) {
    try {
        const url = `/api/nations_overtime?col=${encodeURIComponent(xlabel)}&ylabel=${encodeURIComponent(ylabel)}`;
        const resp = await fetch(url);

        const text = await resp.text();
        console.log('Raw API response for', containerId, ':', text);
        const nationsData = JSON.parse(text);

        if (!Array.isArray(nationsData)) {
        throw new Error('Expected array but got ' + nationsData);
        }

        const x = []
        const y = []
        nationsData.forEach(row => {  // Use 'nationsData' here, not 'data'
        x.push(row['Year']);
        y.push(row['count']);
        });

        const trace = {
        x,
        y,
        mode: 'lines+markers',
        type: 'scatter',
        name: ylabel
        };

        const layout = {
        title: chartTitle,
        xaxis: { title: xlabel },
        yaxis: { title: ylabel }
        };

        Plotly.newPlot(containerId, [trace], layout);
    } catch (error) {
        console.error(`Error loading chart ${containerId}:`, error);
        const container = document.getElementById(containerId);
        if (container) container.innerHTML = '<p>Error loading chart.</p>';
    }
}

async function showEventsHeatmap() {
    try {
        const resp = await fetch('/api/events_heatmap');
        const data = await resp.json();
        if (!data.z) throw new Error('Heatmap data missing.');
        Plotly.newPlot('events-heatmap', [{
        z: data.z,
        x: data.x,
        y: data.y,
        type: 'heatmap',
        colorscale: 'Viridis',
        zmin: 0,
        hovertemplate:
            'Year: %{x}<br>' +
            'Sport: %{y}<br>' +
            'Events: %{z}<extra></extra>'
        }], {
        title: 'Events in Olympics (1896-2016)',
        xaxis: {title: 'Year'},
        yaxis: {title: 'Sport'}
        });
    } catch (err) {
        console.error('Error loading events heatmap:', err);
        document.getElementById('events-heatmap').innerHTML = "<p>Could not load heatmap.</p>";
    }
}

async function showMenVsWomenChart() {
    try {
        const resp = await fetch('/api/men_women');
        const data = await resp.json();

        if (!Array.isArray(data)) throw new Error('Expected array');

        const x = data.map(row => row['Year']);
        const menY = data.map(row => row['Men']);
        const womenY = data.map(row => row['Women']);

        const traces = [
        {
            x,
            y: menY,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'Men'
        },
        {
            x,
            y: womenY,
            mode: 'lines+markers',
            type: 'scatter',
            name: 'Women'
        }
        ];

        const layout = {
        title: 'Men vs Women Participation',
        xaxis: { title: 'Year' },
        yaxis: { title: 'Count' }
        };

        Plotly.newPlot('men-vs-women-chart', traces, layout);
    } catch (error) {
        console.error('Error loading men vs women chart:', error);
        const container = document.getElementById('men-vs-women-chart');
        if (container) container.innerHTML = '<p>Error loading chart.</p>';
    }
}

async function populateSportDropdown() {
    try{
        const resp = await fetch('/api/sport_list')
        const sports = await resp.json()
        if (!Array.isArray(sports)) throw new Error('Invalid athlete data')
        
        const div = document.getElementById('select_sport');
        let html = `<label for="select_sport">Select the Sport Category:</label>
                    <select id="select_sport">`;
        sports.forEach(sport => {
        html += `<option value="${sport}">${sport}</option>`;
        });
        html += `</select>`;
        div.innerHTML = html;

        document.getElementById('select_sport').addEventListener('change', async (e) => {
        await showMostSuccessful(e.target.value);
        });

        // Show initial table for "OverAll"
        await showMostSuccessful('OverAll');
    }catch(error){
        console.error('Error loading most successful athletes:', error)
        const tableDiv = document.getElementById('select_sport');
        tableDiv.innerHTML = "<p>Could not load select_sport.</p>";
    }
}

async function showMostSuccessful(sport) {
    try {
        const resp = await fetch(`/api/most_successful/${encodeURIComponent(sport)}`)
        const data = await resp.json()

        if (!Array.isArray(data)) throw new Error('Invalid athlete data')

        const div = document.getElementById('most-successful-table')
        let html = `<h2>Most Successful Athletes — ${sport}</h2>
                <table border="1" cellspacing="0" cellpadding="5">
                    <thead>
                    <tr>
                        <th>#</th><th>Name</th><th>Medals</th><th>Region</th>
                    </tr>
                    </thead>
                    <tbody>`;
        data.forEach((row, i)=>{
            html += `<tr>
                    <td>${i + 1}</td>
                    <td>${row.Name}</td>
                    <td>${row.Medals}</td>
                    <td>${row.Country}</td>
                </tr>`;
        })
        html += `</tbody></table>`;
        div.innerHTML = html;

    } catch (error) {
        console.error('Error loading most successful athletes:', error);
        const tableDiv = document.getElementById('most-successful-table');
        tableDiv.innerHTML = "<p>Could not load most successful athletes.</p>";
    }
}


  
  // Main wrapper function that renders stats + multiple charts
async function renderAllCharts() {
renderStatsAndClear("Overall Analysis", 'results');
await fillStats();

const charts = [
    { xlabel: 'Year', ylabel: 'region', containerId: 'nations-chart', title: 'Participating Nations in Olympics (1896-2016)' },
    { xlabel: 'Year', ylabel: 'Event', containerId: 'events-chart', title: 'Events in Olympics (1896-2016)' },
    { xlabel: 'Year', ylabel: 'Name', containerId: 'players-chart', title: 'Participating Players in Olympics (1896-2016)' }
];

const resultsDiv = document.getElementById('results');

// Create containers for all charts
charts.forEach(chart => {
    const div = document.createElement('div');
    div.id = chart.containerId;
    div.style.width = '100%';
    div.style.height = '400px';
    div.style.marginTop = '40px';
    resultsDiv.appendChild(div);
});

const menVsWomenDiv = document.createElement('div');
    menVsWomenDiv.id = 'men-vs-women-chart';
    menVsWomenDiv.style.width = '100%';
    menVsWomenDiv.style.height = '400px';
    menVsWomenDiv.style.marginTop = '40px';
    resultsDiv.appendChild(menVsWomenDiv);

    const heatmapDiv = document.createElement('div');
    heatmapDiv.id = 'events-heatmap';
    heatmapDiv.style.width = '100%';
    heatmapDiv.style.height = '800px';
    heatmapDiv.style.marginTop = '40px';
    resultsDiv.appendChild(heatmapDiv);

    const tableDiv = document.createElement('div');
    tableDiv.id = 'most-successful-table';
    tableDiv.style.marginTop = '40px';
    resultsDiv.appendChild(tableDiv);

    const sportSelectDiv = document.createElement('div')
    sportSelectDiv.id = 'select_sport'
    sportSelectDiv.style.marginTop = '40px';
    resultsDiv.appendChild(sportSelectDiv);


    // Render charts sequentially
    for (const chart of charts) {
        await showOverallAnalysis(chart.xlabel, chart.ylabel, chart.containerId, chart.title);
    }
    await showMenVsWomenChart();
    await showEventsHeatmap();
    await populateSportDropdown()
}
  
  // Attach the event listener to button
document.getElementById('overall-analysis-btn').addEventListener('click', renderAllCharts);
  

// Wire up event listener on the "Overall Analysis" button

document.addEventListener('DOMContentLoaded', () => {
    populateDropdowns();
    document.getElementById('overall-analysis-btn').addEventListener('click', async ()=>{
        
        const ylabel_list = ['region', 'Event', 'Name'];
        const container_id_list = ['nations-chart', 'events-chart', 'players-chart'];
        const chart_title_list = [
        'Participating Nations in Olympics (1896-2016)',
        'Events in Olympics (1896-2016)',
        'Participating Players in Olympics (1896-2016)'
        ];
    
        // Clear previous results and render stats panel
        renderStatsAndClear("Overall Analysis", 'results');
        await fillStats();
    
        const resultsDiv = document.getElementById('results');
    
        // Create chart containers dynamically once
        container_id_list.forEach(id => {
        const div = document.createElement('div');
        div.id = id;
        div.style.width = '100%';
        div.style.height = '400px';
        div.style.marginTop = '40px';
        resultsDiv.appendChild(div);
        });
    
        // Loop over chart configs and render each chart
        for (let i = 0; i < ylabel_list.length; i++) {
        await showOverallAnalysis(
            'Year',
            ylabel_list[i],
            container_id_list[i],
            chart_title_list[i]
        );
        }
        
    })
})

// country wise Analysis

async function populateCountryDropdown() {
    try{
        const resp = await fetch('/api/country_list')
        const countries = await resp.json()

        const div = document.getElementById('country-select-div')
        let html = `<label for="country-select">Select the Country:</label>
                <select id="country-select">`

        countries.forEach(c => {
            html += `<option value="${c}">${c}</option>`
        })
        html += `</select>`
        div.innerHTML = html

        document.getElementById('country-select').addEventListener('change', async (e) => {
            const selectedCountry = e.target.value;
            await showCountryWiseMedalTally(selectedCountry);
            await showCountrySportHeatmap(selectedCountry)
            await mostSuccessfulCountryAthelete(selectedCountry)
          });
          
        const initialCountry = document.getElementById('country-select').value;
        console.log('Initial country:', initialCountry);
        await showCountryWiseMedalTally(initialCountry);
        await showCountrySportHeatmap(initialCountry)
        await mostSuccessfulCountryAthelete(initialCountry)

    }catch(error){
        console.error('Error loading country-select-div:', error);
        const countryDiv = document.getElementById('country-select-div');
        countryDiv.innerHTML = "<p>Could not load country-select-div.</p>";
    }
}

async function showCountryWiseMedalTally(country) {
    try{
        const resp = await fetch(`/api/showCountryWiseMedalTally/${encodeURIComponent(country)}`)
        const countryData = await resp.json()

        const div = document.getElementById('country_analysis')
        if (!Array.isArray(countryData) || countryData.length === 0) {
            div.innerHTML = `<h2>Sorry! No Medals found since 1896 for ${country}.</h2>`;
            return;
          }
        
        const x = countryData.map(d => d.Year)
        const y = countryData.map(d => d.Medal)

        const trace = {
            x,
            y,
            mode : 'lines+markers',
            type: 'scatter',
            name: 'Medal',
            line: { shape: 'linear' }
        }
        const layout = {
            title: `OverAll Medal Tally of ${country}`,
            xaxis: {title:'Year'},
            yaxis: {title:'Medals'}
        }
        Plotly.newPlot(div.id, [trace], layout )
        
    }catch(error){
        console.error('Error loading country-select-div:', error);
        const countryDiv = document.getElementById('country_analysis');
        countryDiv.innerHTML = "<p>Could not load country_analysis.</p>";
    }
}

async function showCountrySportHeatmap(country) {
    try{
        const resp = await fetch(`/api/countrySportTallyHeatmap/${encodeURIComponent(country)}`)
        const data = await resp.json()

        console.log('Received heatmap data:', data);

        if (!data || !data.z || !Array.isArray(data.z) || data.z.length === 0) {
            throw new Error('Heatmap data missing.');
          }
        
        Plotly.newPlot('country_sport_heatmap', [{
        z: data.z,
        x: data.x,
        y: data.y,
        type: 'heatmap',
        colorscale: 'Viridis',
        zmin: 0,
        hovertemplate:
            'Year: %{x}<br>' +
            'Sport: %{y}<br>' +
            'Medal: %{z}<extra></extra>'
        }], {
        title: `${country} excels in the following sports`,
        xaxis: {title: 'Year'},
        yaxis: {title: ''}
        });


    }catch(error){
        console.error('Error loading country_sport_heatmap:', error);
        const countryDiv = document.getElementById('country_sport_heatmap');
        countryDiv.innerHTML = "<p>Could not load country_sport_heatmap.</p>";
    }
}

async function mostSuccessfulCountryAthelete(country){
    try{
        const resp = await fetch(`/api/countryTopAthelete/${encodeURIComponent(country)}`)
        const data = await resp.json()

        if (!Array.isArray(data)) throw new Error('Invalid athlete data')

            const div = document.getElementById('country_top_athelete')
            let html = `<h2>Most Successful Athletes — ${country}</h2>
                    <table border="1" cellspacing="0" cellpadding="5">
                        <thead>
                        <tr>
                            <th>#</th><th>Name</th><th>Medals</th><th>Sport</th>
                        </tr>
                        </thead>
                        <tbody>`;
            data.forEach((row, i)=>{
                html += `<tr>
                        <td>${i + 1}</td>
                        <td>${row.Name}</td>
                        <td>${row.Medals}</td>
                        <td>${row.Sport}</td>
                    </tr>`;
            })
            html += `</tbody></table>`;
            div.innerHTML = html;
        
    }catch(error){
        console.error('Error loading country_top_athelete:', error);
        const countryDiv = document.getElementById('country_top_athelete');
        countryDiv.innerHTML = "<p>Could not load country_top_athelete.</p>";
    }
}


document.getElementById('btn-country-wise').addEventListener('click', async ()=>{
    document.getElementById('title').textContent = "Country-Wise Analysis";
    const resultsDiv = document.getElementById('results')
    resultsDiv.innerHTML=''
    
    const country_select_div = document.createElement('div')
    country_select_div.id = 'country-select-div'
    country_select_div.style.marginBottom = '20px'
    resultsDiv.appendChild(country_select_div)

    const country_analysis = document.createElement('div')
    country_analysis.id = 'country_analysis'
    country_analysis.style.marginBottom='20px'
    resultsDiv.appendChild(country_analysis)

    const country_sport_heatmap = document.createElement('div')
    country_sport_heatmap.id = 'country_sport_heatmap'
    country_sport_heatmap.style.marginBottom='50px'
    resultsDiv.appendChild(country_sport_heatmap)

    const country_top_athelete = document.createElement('div')
    country_top_athelete.id = 'country_top_athelete'
    country_top_athelete.style.marginBottom='20px'
    resultsDiv.appendChild(country_top_athelete)

    await populateCountryDropdown()
   
})

// 'Athlete-Wise Analysis'
function frequencyMap(arr) {
    const freq = {};
    arr.forEach(age => {
      if (age != null) {  // skip nulls
        freq[age] = (freq[age] || 0) + 1;
      }
    });
    // Convert to sorted arrays
    const ages = Object.keys(freq).map(Number).sort((a, b) => a - b);
    const counts = ages.map(age => freq[age]);
    return { ages, counts };
  }

async function medalAgeDistribution() {
    try{
        const resp = await fetch('/api/medalVsAgeDistribution')
        const data = await resp.json()
        console.log(data)
        if (!data || !data.OverAll || data.OverAll.length === 0) {
            document.getElementById('medal_age_distribution_div').innerHTML = 'No age data';
            return;
        }
        function freqTrace(ages, name, color) {
            const { ages: x, counts: y } = frequencyMap(ages);
            return {
                type: 'scatter',
                mode: 'lines+markers',
                x,
                y,
                name,
                line: { color }
            };
        }
        const traces = [
            freqTrace(data.OverAll, 'Overall', 'gray'),
            freqTrace(data.Gold, 'Gold', 'gold'),
            freqTrace(data.Silver, 'Silver', 'silver'),
            freqTrace(data.Bronze, 'Bronze', 'peru')
        ];

        const layout = {
            title: 'Medal vs Age Distribution (Line Plot)',
            width: document.getElementById('medal_age_distribution_div').clientWidth,
            height: 600,
            xaxis: { title: 'Age' },
            yaxis: { title: 'Number of Athletes' }
        };

        Plotly.newPlot('medal_age_distribution_div', traces, layout);

    }catch(error){
        console.error('Error loading medal_age_distribution_div:', error);
        const countryDiv = document.getElementById('medal_age_distribution_div');
        countryDiv.innerHTML = "<p>Could not load medal_age_distribution_div.</p>";
    }
}
// Famous sports list (same as backend default)
const famousSports = [
    'Basketball', 'Judo', 'Football', 'Tug-Of-War', 'Athletics',
    'Swimming', 'Badminton', 'Sailing', 'Gymnastics',
    'Art Competitions', 'Handball', 'Weightlifting', 'Wrestling',
    'Water Polo', 'Hockey', 'Rowing', 'Fencing',
    'Shooting', 'Boxing', 'Taekwondo', 'Cycling', 'Diving', 'Canoeing',
    'Tennis', 'Golf', 'Softball', 'Archery', 'Volleyball',
    'Synchronized Swimming', 'Table Tennis', 'Baseball',
    'Rhythmic Gymnastics', 'Rugby Sevens', 'Beach Volleyball',
    'Triathlon', 'Rugby', 'Polo', 'Ice Hockey'
  ];


// Handle Athlete Wise Analysis button click
document.getElementById('btn-Athlete-Wise').addEventListener('click', async () => {
    document.getElementById('title').textContent = 'Athlete Wise Analysis';
  
    const resultDiv = document.getElementById('results');
    resultDiv.innerHTML = '';
  
    // Overall medal age dist container and plot
    const overallDiv = document.createElement('div');
    overallDiv.id = 'medal_age_distribution_div';
    overallDiv.style.marginBottom = '50px';
    resultDiv.appendChild(overallDiv);
    overallDiv.style.width=100%
    
    await medalAgeDistribution();
  
    // Separator heading for interactive chart
    const interactiveTitle = document.createElement('h3');
    interactiveTitle.textContent = "Medal vs Age Distribution by Sport (Interactive)";
    resultDiv.appendChild(interactiveTitle);
  
    // Container for selectors and interactive chart
    const interactiveContainer = document.createElement('div');
    interactiveContainer.id = 'interactive_medal_age_dist';
    interactiveContainer.style.marginTop = '20px';
  
    // Use clean HTML without inline styles, relying on external CSS
    interactiveContainer.innerHTML = `
    
    <div id="sport_medal_age_dist_plot" style="margin-top:22px; width: 100%; height: 600px;"></div>
      <div class="form-row" style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
        <label for="medal-selector" style="min-width:100px; margin:0;">Select Medal:</label>
        <select id="medal-selector" style="width:140px; padding:6px 8px; font-size:1rem;">
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>
        
      </div>
      <div class="form-row" style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
        <label for="sports-selector" style="min-width:100px; margin:0;">Select Sports:</label>
        <select id="sports-selector" multiple size="8" style="width:250px; height:160px;"></select>
        
        <button id="clear-sports-selection" 
            style="padding:4px 10px; font-size:0.8rem; margin-left:8px; cursor:pointer; height:28px; width:100px;">Select All</button>
        
      </div>
     <h3>Height vs Weight Relation for Winning</h3>
    <div id="height_weight_plot" style="margin-top: 20px; width: 100%; height: 600px;"></div>
      
    `;
    resultDiv.appendChild(interactiveContainer);
  
    // Populate sports multi-select options
    const sportsSel = document.getElementById('sports-selector');
    famousSports.forEach(sport => {
      const option = document.createElement('option');
      option.value = sport;
      option.textContent = sport;
      sportsSel.appendChild(option);
    });
  
    // Select All/Clear buttons for sports
    // document.getElementById('select-all-sports').addEventListener('click', () => {
    //   Array.from(sportsSel.options).forEach(option => option.selected = true);
    //   sportsSel.dispatchEvent(new Event('change'));
    // });

    const hwContainer = document.createElement('div');
    hwContainer.id = 'height_weight_section';
    hwContainer.innerHTML = `
   
    <div id="height_weight_plot" style="margin-top: 20px; width: 800px; height: 600px;"></div>
    `;
    resultDiv.appendChild(hwContainer);
  
    document.getElementById('clear-sports-selection').addEventListener('click', () => {
      Array.from(sportsSel.options).forEach(option => option.selected = false);
      sportsSel.dispatchEvent(new Event('change'));
    });
  
    // Select All button for medals (sets medal dropdown to all - by selecting all options, can be used if you support multi-select)
    // document.getElementById('select-all-medals').addEventListener('click', () => {
    //   // Since medal select is single-select, set to empty or a default? Here we clear selection:
    //   const medalSelect = document.getElementById('medal-selector');
    //   medalSelect.value = '';
    //   medalSelect.dispatchEvent(new Event('change'));
    // });
  
    // Get medal and sports selects
    const medalSelect = document.getElementById('medal-selector');
    const sportsSelect = document.getElementById('sports-selector');
  
    // Add change event listeners for automatic chart update
    medalSelect.addEventListener('change',()=>{
        plotMedalAgeBySports()
        plotHeightWeightByFilters();

    } );
    sportsSelect.addEventListener('change', ()=>{
        plotMedalAgeBySports()
        plotHeightWeightByFilters();

    } );
  
    // Optional: Trigger initial plot if you want default selection
    plotMedalAgeBySports();
    plotHeightWeightByFilters()

  });
  
  async function plotHeightWeightByFilters() {
    const medalSelect = document.getElementById('medal-selector');
    const sportsSelect = document.getElementById('sports-selector');
  
    const selectedMedal = medalSelect.value;
    const selectedSports = Array.from(sportsSelect.selectedOptions).map(opt => opt.value);
  
    const plotDiv = document.getElementById('height_weight_plot');
    plotDiv.innerHTML = '';
  
    if (!selectedMedal) {
      plotDiv.innerHTML = '<p>Please select a medal to view the height vs weight plot.</p>';
      return;
    }
  
    const sportsToSend = selectedSports.length > 0 ? selectedSports : [];

    try {
        const resp = await fetch('/api/height_weight_medalists', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({selected_sport: sportsToSend, selected_medal: selectedMedal})
        });
        console.log('sportsToSend',sportsToSend)
        const data = await resp.json();
    
        if (!data || data.length === 0) {
          plotDiv.innerHTML = `<p>No data found for ${selectedMedal} medal and selected sports.</p>`;
          return;
        }
    
        
        const groups = {};
    
        data.forEach(d => {
          const key = `${d.Medal}_${d.Sex}`;
          if (!groups[key]) groups[key] = { x: [], y: [], text: [], marker: {} };
          groups[key].x.push(d.Weight);
          groups[key].y.push(d.Height);
          groups[key].text.push(`Name: ${d.Name} <br>Medal: ${d.Medal}<br>Sex: ${d.Sex === 'M' ? 'Male' : d.Sex === 'F' ? 'Female' : d.Sex}<br>Weight: ${d.Weight} Kg<br>Height: ${d.Height} CM`);
        });
    
        const symbolMap = { M: 'circle', F: 'square' };
        const medalColors = { 
            Gold: {M: '#FFD700', F: '#FFB13B'},
            Silver: { M: '#C0C0C0', F: '#88D1F0' },
            Bronze: { M: '#CD7F32', F: '#FC9866' }
        };
        const traces = Object.entries(groups).map(([key, grp]) => {
          const [medal, sex] = key.split('_');
          return {
            type: 'scatter',
            mode: 'markers',
            x: grp.x,
            y: grp.y,
            text: grp.text,
            hoverinfo: 'text',
            name: `${medal} - ${sex}`,
            marker: {
              color: medalColors[medal] || 'black',
              size: 12,
              symbol: symbolMap[sex] || 'circle',
              line: { width: 1, color: 'black' }
            }
          };
        });
    
        const layout = {
          title: `Height vs Weight of ${selectedMedal} Medalists`,
          xaxis: { title: 'Weight (kg)' },
          yaxis: { title: 'Height (cm)' },
          width: document.getElementById('height_weight_plot').clientWidth,
          height: 600,
          hovermode: 'closest'
        };
    
        Plotly.newPlot(plotDiv.id, traces, layout);
    
      } catch (err) {
        plotDiv.innerHTML = '<p>Error loading data.</p>';
        console.error(err);
      }

}

  // Function to fetch and plot medal age distribution by selected medal and sports
  async function plotMedalAgeBySports() {
    const medalSelect = document.getElementById('medal-selector');
    const sportsSelect = document.getElementById('sports-selector');
    const selectedMedal = medalSelect.value;
    const selectedSports = Array.from(sportsSelect.selectedOptions).map(opt => opt.value);
  
    const plotDiv = document.getElementById('sport_medal_age_dist_plot');
    plotDiv.innerHTML = '';
  
    if (!selectedMedal) {
      plotDiv.innerHTML = '<p>Please select a medal to view the chart.</p>';
      return;
    }
  
    // Use empty sports array to request all sports if none selected
    const sportsToSend = selectedSports.length > 0 ? selectedSports : [];
  
    try {
      const response = await fetch('/api/sportMedalAgeDist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_medal: selectedMedal, selected_sports: sportsToSend })
      });
  
      if (!response.ok) {
        plotDiv.innerHTML = `<p>Error fetching data: ${response.statusText}</p>`;
        return;
      }
  
      const ageData = await response.json();
  
      if (!ageData || ageData.length === 0) {
        plotDiv.innerHTML = `<p>No valid ${selectedMedal} medal age data available for selected sports.</p>`;
        return;
      }
  
      const traces = ageData.map(item => {
        const { ages, counts } = frequencyMap(item.ages);
        return {
          type: 'scatter',
          mode: 'lines+markers',
          x: ages,
          y: counts,
          name: item.sport,
        };
      });
  
      const layout = {
        title: `${selectedMedal} Medalist Age Distribution by Sport`,
        width: document.getElementById('sport_medal_age_dist_plot').clientWidth,
        height: 600,
        xaxis: { title: 'Age' },
        yaxis: { title: 'Number of Athletes' }
      };
  
      Plotly.newPlot(plotDiv.id, traces, layout);
    } catch (error) {
      console.error('Error loading interactive medal age distribution:', error);
      plotDiv.innerHTML = "<p>Error loading age distribution chart.</p>";
    }
  }