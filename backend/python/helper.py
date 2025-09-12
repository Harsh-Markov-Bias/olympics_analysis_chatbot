import numpy as np
import preprocessor
import pandas as pd
from flask import jsonify

df = pd.read_csv('/Users/harshpratapsingh/Documents/ML-Projects/olympics-eda-chatbot/backend/python/data/athlete_events.csv')
region_df = pd.read_csv('/Users/harshpratapsingh/Documents/ML-Projects/olympics-eda-chatbot/backend/python/data/noc_regions.csv')

df = preprocessor.preprocess(df,region_df)

def get_height_vs_weight(selected_medal, selected_sports):
    print(f'The select sports is {selected_sports}')
    df_sport = df.drop_duplicates(subset=['Name','region'])
    df_sport  = df_sport.dropna(subset=['Medal','Height','Weight', 'Sex'])
    if selected_medal:
        df_sport = df_sport[df_sport['Medal'] == selected_medal]
    # Filter sports if any selected, else take all
    if selected_sports and len(selected_sports) > 0:
        df_sport = df_sport[df_sport['Sport'].isin(selected_sports)]
    
    data = df_sport[['Name','Weight', 'Height', 'Medal', 'Sex']]
    print(data)
    
    return data.to_dict(orient='records')


def get_medal_v_age_dist(selected_medal,selected_sports):

    df_athlete = df.dropna(subset=['Medal', 'Age'])
    df_athlete = df_athlete.drop_duplicates(subset=['Name', 'region'])

    # If empty sports list, use all famous_sports
    if not selected_sports:
        selected_sports = [
            'Basketball', 'Judo', 'Football', 'Tug-Of-War', 'Athletics',
            'Swimming', 'Badminton', 'Sailing', 'Gymnastics',
            'Art Competitions', 'Handball', 'Weightlifting', 'Wrestling',
            'Water Polo', 'Hockey', 'Rowing', 'Fencing',
            'Shooting', 'Boxing', 'Taekwondo', 'Cycling', 'Diving', 'Canoeing',
            'Tennis', 'Golf', 'Softball', 'Archery', 'Volleyball',
            'Synchronized Swimming', 'Table Tennis', 'Baseball',
            'Rhythmic Gymnastics', 'Rugby Sevens', 'Beach Volleyball',
            'Triathlon', 'Rugby', 'Polo', 'Ice Hockey'
        ]

    result = []
    for sport in selected_sports:
        ath_df = df_athlete[df_athlete['Sport'] == sport]
        ages = ath_df[ath_df['Medal'] == selected_medal]['Age'].dropna().tolist()
        if len(ages) >= 2:
            result.append({'sport': sport, 'ages': ages})

    return result

def get_medal_vs_age_distribution():
    
    df_athlete = df.dropna(subset=['Medal','Age'])
    df_athlete = df_athlete.drop_duplicates(subset=['Name', 'region'])

    overAll = df_athlete['Age'].to_list()
    gold = df_athlete[df_athlete['Medal'] == 'Gold']['Age'].dropna().to_list()
    silver = df_athlete[df_athlete['Medal'] == 'Silver']['Age'].dropna().to_list()
    bronze = df_athlete[df_athlete['Medal'] == 'Bronze']['Age'].dropna().to_list()

    return jsonify({
        'OverAll':overAll,
        'Gold':gold,
        'Silver':silver,
        'Bronze': bronze
    })

def get_country_top_athelete(country):
    temp_df = df.dropna(subset='Medal')
    temp_df = temp_df[temp_df['region']==country]

    top_athlete = temp_df['Name'].value_counts().reset_index().head(10)
    merged = top_athlete.merge(temp_df, on='Name', how='left')[['Name','count','Sport']].drop_duplicates('Name')
    merged.rename(columns={
        'count': 'Medals',
    }, inplace=True)

    merged = merged.reset_index(drop=True)
    merged.index = merged.index + 1
    return merged

def get_country_sport_tally_heatmap(country):
    df_temp = df.dropna(subset='Medal')
    df_temp.drop_duplicates(subset=['Team','NOC','Games','Year','Season','City', 'Sport', 'Event','Medal'], inplace=True)
    new_df = df_temp[df_temp['region'] == country]
    pivot = new_df.pivot_table(index='Sport',columns='Year', values='Medal', aggfunc='count').fillna(0)
    pivot = pivot.reindex(sorted(pivot.columns), axis=1)
    response = {
            'z': pivot.values.tolist(),
            'x': list(pivot.columns),
            'y': list(pivot.index)
        }
    return response

def sport_list():
    sport_list = df['Sport'].unique().tolist()
    sport_list.sort()
    sport_list.insert(0, 'OverAll')
    return sport_list

def most_successful_player(selected_sport):
    temp_df = df.dropna(subset='Medal')
    if selected_sport!='OverAll':
        temp_df = temp_df[temp_df['Sport']==selected_sport]
    
    top_athlete = temp_df['Name'].value_counts().reset_index().head(10)
    merged = top_athlete.merge(temp_df, on='Name', how='left')[['Name','count','region']].drop_duplicates('Name')
    merged.rename(columns={
        'count': 'Medals',
        'region':'Country'
    }, inplace=True)

    merged = merged.reset_index(drop=True)
    merged.index = merged.index + 1
    return merged



def sport_event_heatmap():
    result = df.drop_duplicates(['Year', 'Sport', 'Event'])
    pivot = result.pivot_table(index='Sport', columns='Year', values='Event', aggfunc='count').fillna(0).astype(int)
    response = {
            'z': pivot.values.tolist(),
            'Year': list(pivot.columns),
            'Sport': list(pivot.index)
        }
    return response


def men_women():
    men= df[df['Sex'] == 'M'].groupby('Year').count()['Name'].reset_index()
    women = df[df['Sex']=='F'].groupby('Year').count()['Name'].reset_index()
    final = men.merge(women, on='Year')

    final.rename(columns={
        'Name_x':'Men',
        'Name_y':'Women'
    }, inplace=True)
    return final

def data_overtime( ylable):
    print(f'This is {ylable}')
    data_over_years = df.drop_duplicates(['Year', ylable])['Year'].value_counts().reset_index().sort_values('Year')
    # data_over_years.rename(columns={
    #     'Year':'Edition'
    # }, inplace=True)
    print(type(data_over_years))
    return data_over_years
    

def olympic_stats():
    stats = {
        "editions": df['Year'].nunique() - 1,
        "cities": df['City'].nunique(),
        "sports": df['Sport'].nunique(),
        "events": df['Event'].nunique(),
        "athletes": df['Name'].nunique(),
        "nations": df['region'].nunique()
    }
    return stats


def fetch_medal_tally(year, country):
    medal_df = df.drop_duplicates(subset=['Team','NOC', 'Games', 'Year', 'Season', 'City',	'Sport', 'Event', 'Medal'])
    
    flag=0
    temp_df = pd.DataFrame()
    if year=='OverAll' and country=='OverAll':
        temp_df = medal_df
        
    if year=='OverAll' and country!='OverAll':
        flag=1
        temp_df = medal_df[medal_df['region']==country]

    if year!='OverAll' and country=='OverAll':
        temp_df = medal_df[medal_df['Year']==int(year)]

    if year!='OverAll' and country!='OverAll':
        temp_df = medal_df[(medal_df['Year'] == int(year)) & (medal_df['region'] == country)]
    
    if temp_df.empty:
        return []
    
    temp_df = temp_df.rename(columns={
        'region': 'Country'
    })
    
    if flag == 1:
        x = temp_df.groupby('Year').sum()[['Gold', 'Silver', 'Bronze']].sort_values('Year')
    else:
        x =  temp_df.groupby('Country').sum()[['Gold','Silver','Bronze']].sort_values('Gold', ascending=False)
        
    # print(len(x))
    x['Total'] = x['Gold']+x['Silver']+x['Bronze']
    x = x.reset_index()
    x.index = x.index+1
    print('X is', x)
    # Convert resulting DataFrame to JSON-ready dict list
    result = x.to_dict(orient='records')  # List of dicts per row
    return result


def fetch_medals_country_year( country, medal_type, year):
    medal_df = df.drop_duplicates(subset=['Team','NOC', 'Games', 'Year', 'Season', 'City',	'Sport', 'Event', 'Medal'])
    
    temp_df = medal_df[
        (medal_df['region'] == country) &
        (medal_df['Year'] == int(year)) &
        (medal_df['Medal'] == medal_type)
    ]
    # print(temp_df.head())
    # print(f'the tempdf is {temp_df.shape[0]}')
    return temp_df.shape[0]

def country_year_list():

    years = df['Year'].unique().tolist()
    years.sort(reverse=True)
    years.insert(0,'OverAll')

    country = np.unique(df['region'].dropna().values).tolist()
    country.sort()
    country.insert(0,'OverAll')

    return years, country

def country_analysis(country):
    df.dropna(subset='Medal', inplace=True)
    df.drop_duplicates(subset=['Team','NOC','Games','Year','Season','City', 'Sport', 'Event','Medal'], inplace=True)
    new_df = df[df['region'] == country]
    final_df = new_df.groupby('Year').count()['Medal'].reset_index()
    return final_df