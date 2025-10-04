import numpy as np
import preprocessor
import pandas as pd
from flask import jsonify



df = pd.read_csv('/Users/harshpratapsingh/Documents/ML-Projects/olympics-eda-chatbot/backend/python/data/athlete_events.csv')
region_df = pd.read_csv('/Users/harshpratapsingh/Documents/ML-Projects/olympics-eda-chatbot/backend/python/data/noc_regions.csv')

df = preprocessor.preprocess(df,region_df)

def get_country_player_by_year_medal_type(year='all', medal_type='all', country='all', number=1, sport='all'):
    df_temp = df.drop_duplicates(subset=['Team','NOC', 'Games', 'Year', 'Season', 'City','Sport', 'Event', 'Medal'])

    # Apply filters only if parameters are specified
    if country != 'all':
        df_temp = df_temp[df_temp['region'] == country]
    if year != 'all':
        df_temp = df_temp[df_temp['Year'] == int(year)]
    if medal_type != 'all':
        df_temp = df_temp[df_temp['Medal'].str.title() == medal_type.title()]
    if sport != 'all':
        df_temp = df_temp[df_temp['Sport'].str.title() == sport.title()]
    if df_temp.empty:
        return []
    player_counts = df_temp.groupby(['Name', 'Sport', 'region'])['Medal'].count().reset_index()
    player_counts = player_counts.sort_values('Medal', ascending=False)
    print('This is player count', player_counts)
    return player_counts.head(number)

    

def get_country_medal_by_year_medal_type(year, medal_type, country):
    df_temp = df.drop_duplicates(subset=['Team','NOC', 'Games', 'Year', 'Season', 'City','Sport', 'Event', 'Medal'])
    
    # Filter by country and year
    base_filter = (
        (df_temp['region'].str.lower() == country.lower()) &
        (df_temp['Year'] == int(year))
    )

    if medal_type.lower() == "all medals":
        # Count all medals (Gold + Silver + Bronze)
        filtered_df = df_temp.loc[base_filter & df_temp['Medal'].notna()]
    else:
        # Count only specific medal type
        filtered_df = df_temp.loc[base_filter & (df_temp['Medal'].str.lower() == medal_type.lower())]
    print('filtered df',filtered_df)
    print( filtered_df.shape[0])
    return filtered_df.shape[0]