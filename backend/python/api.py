from flask import Flask, request, jsonify
import helper, chatbot_fulfillment

app = Flask(__name__)


@app.route('/webhook/dialogflow', methods=['POST'])
def dialogueflow_webhook():
    
    req = request.get_json(force=True)

    print("\n=== Incoming Request ===")
    print("Full JSON:\n", req)
    
    session = req['session']
    intent = req['queryResult']['intent']['displayName']
    parameters = req['queryResult']['parameters']
    contexts = req['queryResult'].get('outputContexts', [])

    print("\n--- Intent & Parameters ---")
    print("Intent:", intent)
    print("Parameters:", parameters)
    print("Output Contexts:")
    
    intent_handler_dict = {
        'GetMedalCount': chatbot_fulfillment.country_medal_by_year_medal_type,
        'medalcount-followup': chatbot_fulfillment.country_medal_by_year_medal_type,
        'BestAthleteBySportAndCountry': chatbot_fulfillment.country_Player_by_year_medal_type
        
    }
    return intent_handler_dict[intent](session,parameters,contexts)
    

@app.route('/api/height_weight_medalists', methods=['POST'])
def height_vs_weight():
    try:
        req = request.get_json()
        print('The req is ',req)
        selected_medal = req.get('selected_medal')
        selected_sports=req.get('selected_sports',[])
        print(f'The app route selected sport {selected_sports}')
        result = helper.get_height_vs_weight(selected_medal, selected_sports)
        return result
    except Exception as err:
        print('Error in /api/heightVsWeight', err)
        return jsonify({'error':'Internal Server Issue'}),500

@app.route('/api/sportMedalAgeDist', methods=['POST'])
def sport_medal_age_dist():
    try:
        req = request.get_json()
        selected_medal = req.get('selected_medal')
        selected_sports = req.get('selected_sports',[])
        result = helper.get_medal_v_age_dist(selected_medal,selected_sports)
        return jsonify(result)
    except Exception as err:
        print('Error in /api/sportMedalAgeDist', err)
        return jsonify({'error':'Internal Server Erro'}), 500



@app.route('/api/medalVsAgeDistribution')
def medal_vs_age_distribution():
    try:
        medal_v_age = helper.get_medal_vs_age_distribution()
        return medal_v_age                                      # Already jsonified in helper
    except Exception as error:
        print('Error in /api/medalVsAgeDistribution', error)
        return jsonify({'error':'Internal Server Erro'}), 500

@app.route('/api/countryTopAthelete/<country>')
def country_top_athelete(country):
    try:
        top_atheletes = helper.get_country_top_athelete(country)
        result  = top_atheletes.reset_index().to_dict(orient='records')
        return jsonify(result)
    except Exception as e:
        print('Error in /api/countryTopAthelete/<country>', e)
        return jsonify({'error':'Internal Server Error'}), 500

@app.route('/api/countrySportTallyHeatmap/<country>') # by default it should take in GET as method
def country_sport_tally_heatmap(country):
    try:
        country_sport_heatmap = helper.get_country_sport_tally_heatmap(country)
        return jsonify(country_sport_heatmap)
    except Exception as error:
        print('Error in the /api/country_sportTally_heatmap/<country> ', error)
        return jsonify({'error':'Internal Server Error'}), 500


@app.route('/api/showCountryWiseMedalTally/<country>', methods=['GET'])
def analyse_country_data(country):
    try:
        analysis_df = helper.country_analysis(country)
        analysis_df_json = analysis_df.to_dict(orient='records')
        return jsonify(analysis_df_json)
    except Exception as e:
        print('Error in /api/showCountryWiseMedalTally:', e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/country_list', methods=['GET'])
def get_country_list():
    _,country_list = helper.country_year_list()
    country_list.pop(0)
    return jsonify(country_list)

@app.route('/api/most_successful/<sport>', methods=['GET'])
def api_most_successful(sport):
    try:
        result_df = helper.most_successful_player(sport)
        # Convert DataFrame to dict for JSON response
        result_json = result_df.reset_index().to_dict(orient='records')
        return jsonify(result_json)
    except Exception as e:
        print('Error in /api/most_successful:', e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/sport_list', methods=['GET'])
def sport_list():
    try:
        sports_list = helper.sport_list()
        return jsonify(sports_list)
    except Exception as e:
        print('Error in /api/sport_list', e)
        return jsonify({'error': 'Internal server error'}), 500



@app.route('/api/successful_player', methods=['GET'])
def successful_player():
    try:
        resonse = helper.most_successful_player() 
        return jsonify(resonse)
    except Exception as e:
        print('Error in /api/events_heatmap:', e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/events_heatmap', methods=['GET'])
def events_heatmap():
    try:
        resonse = helper.sport_event_heatmap() 
        return jsonify(resonse)
    except Exception as e:
        print('Error in /api/events_heatmap:', e)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/men_women', methods=['GET'])
def api_men_women():
    try:
        result = helper.men_women()
        return jsonify(result.to_dict(orient='records'))
    except Exception as e:
        print('Error in /api/men_women:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/nations_overtime', methods=['GET'])
def api_data_overtime():
    ylabel = request.args.get('ylabel')
    
    # Basic validation
    if not ylabel:
        return jsonify({'error': 'Missing col or ylabel parameter'}), 400
    
    try:
        result = helper.data_overtime( ylabel)
        return jsonify(result.to_dict(orient='records'))
    except Exception as e:
        print('Error in /api/nations_overtime:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/years_countries', methods=['GET'])
def years_and_countries():
    try:
        years, countries = helper.country_year_list()
        # print("Returning years and countries:", years, countries)
        response = {'years': years, 'countries': countries}
        # print("API /api/years_countries response:", response)  # DEBUG LOG
        return jsonify(response)
    except Exception as e:
        # Log error to console
        print('Error in /api/years_countries:', e)
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/medal_tally', methods=['POST'])
def api_medal_tally():
    try:
        data = request.get_json()
        year = data.get('year')
        country = data.get('country')
        # print(f"Received year: {year}, country: {country}")  # Debug
        # print(f"year type: {type(year)}, value: {year}")
        # print(f"country type: {type(country)}, value: {country}")
        medal_tally = helper.fetch_medal_tally(year, country)
        # print('api_medal_tally', medal_tally)
        # Convert DataFrame to JSON serializable list
        # result = medal_tally.to_dict(orient='records')
        # print("Medal tally result:", medal_tally)  # Debug
        # print("Type of medal_tally:", type(medal_tally))
        return jsonify({"medal_tally": medal_tally})
    except Exception as e:
        print("Error in /api/medal_tally:", e)
        return jsonify({"error": "Internal server error"}), 500

@app.route('/api/overall_stats', methods=['GET'])
def api_overall_stats():
    stats = helper.olympic_stats()

    return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5001)
