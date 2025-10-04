import numpy as np
import chatbot_helper
import pandas as pd
from flask import jsonify


session_country_Player_by_year_medal_type = {}
def country_Player_by_year_medal_type(session,parameters,contexts):
    # for ctx in contexts:
    #     print(f" - {ctx['name'].split('/')[-1]}:", ctx.get('parameters', {}))
    
    # saved_params = session_country_Player_by_year_medal_type.get(session, {})
    
    merged_params = {key: val for key, val in parameters.items() if val not in ("", [], None)}
    # merged_params = saved_params.copy()
    # merged_params.update(new_param)

    # session_country_Player_by_year_medal_type[session] = merged_params

    year_param = merged_params.get('date-period')
    medal_param = merged_params.get('medal_type')
    country_param = merged_params.get('geo-country')
    number_params = merged_params.get('number')
    sport_params = merged_params.get('sport')

    try:
        if not (year_param or medal_param or country_param or number_params or sport_params):
            response_text = "Please provide any info to get the result."
        else:
            year = int(year_param.get('startDate')[:4]) if year_param else 'all'
            medal_type = medal_param.title() if medal_param else 'all'
            country = country_param.title() if country_param else 'all'
            number = int(number_params) if number_params else 1
            sport = sport_params.title() if sport_params else 'all'

            print('This is before', year, medal_type, country, number, sport)

            result = chatbot_helper.get_country_player_by_year_medal_type(year, medal_type, country, number, sport)

            print(f'result', result)
            if result.shape[0] <= 0:
                response_text = f"Sorry, No such Athlete found."
            else:
                response_text = "Top player(s):\n" + "\n".join(
                f"{row['Name']}, ({row['region']}, {row['Sport']}, Medals: {row['Medal']})"
                for _, row in result.iterrows()
                )
        response_json = {
            'fulfillmentText': response_text,
            'outputContexts': [
                {
                    'name': f"{session}/contexts/medalcount-followup",
                    'lifespanCount': 5,
                    'parameters': merged_params
                }
            ]
        }

        print("\n=== Response JSON ===")
        print(response_json)

        return jsonify(response_json)


    except Exception as error:
        print('Error in /webhook/dialogflow', error)
        return jsonify({'error': 'Internal Server Issue'}), 500


session_country_medal_by_year_medal_type = {}
def country_medal_by_year_medal_type(session,parameters,contexts):
    

    # for ctx in contexts:
    #     print(f" - {ctx['name'].split('/')[-1]}:", ctx.get('parameters', {}))

    # get existing parameters for this session
    saved_params = session_country_medal_by_year_medal_type.get(session, {})

    # filter out empty values from incoming parameters
    new_params = {k: v for k, v in parameters.items() if v not in ("", [], None)}

    # merge: update saved_params only if new values exist
    merged_params = saved_params.copy()
    merged_params.update(new_params)

    # save back
    session_country_medal_by_year_medal_type[session] = merged_params
        

    # print("\n--- Merged Parameters ---")
    # print(merged_params)
    
    year_param = merged_params.get('date-period')
    medal_param = merged_params.get('medal_type')
    country_param = merged_params.get('geo-country')

    try:
        if not (year_param and medal_param and country_param):
            response_text = "Please provide the country, medal type, and year to get the medal count."
        else:
            year = int(year_param['startDate'][:4])
            medal_type = medal_param.title()
            country = country_param.title()
            # print(year, medal_type, country )
            
            result = chatbot_helper.get_country_medal_by_year_medal_type(year, medal_type, country)
            # print(f'result', result)
            if result <= 0:
                response_text = f"Sorry, {country} could not win any {medal_type} medals in {year}."
            else:
                response_text = f"{country} won {result} {medal_type} medal(s) in {year}."
        response_json = {
            'fulfillmentText': response_text,
            'outputContexts': [
                {
                    'name': f"{session}/contexts/medalcount-followup",
                    'lifespanCount': 5,
                    'parameters': merged_params
                }
            ]
        }

        # print("\n=== Response JSON ===")
        # print(response_json)

        return jsonify(response_json)

    except Exception as error:
        print('Error in /webhook/dialogflow', error)
        return jsonify({'error': 'Internal Server Issue'}), 500