import pandas as pd
import sys
import os
import argparse
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import helper, preprocessor
import plotly.express as px
import matplotlib.pyplot as plt
import seaborn as sns
from plotly.figure_factory import create_distplot


def main():
    parser = argparse.ArgumentParser(description= 'Olympics Medal Lookup')
    parser.add_argument('--country', required=True, help='Country name')
    parser.add_argument('--medal', required=True, help='Medal type (gold, silver, bronze)')
    parser.add_argument('--year', required=True, help='year (YYYY)')

    args = parser.parse_args()

    medal_counts =  helper.fetch_medals_country_year(args.country.title(), args.medal.capitalize(), args.year)
    # print(f'medal counts are {medal_counts}')

    print(f"{args.country} won {medal_counts} {args.medal} medal(s) in {args.year}.")

if __name__ == '__main__':
    main()