import requests
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

api_base = "https://api.banidb.com/v2"

def search_shabad(query):
    # Search type 1 is Gurmukhi (Full Word)
    url = f"{api_base}/search/{query}?searchtype=1"
    try:
        response = requests.get(url, headers={'Accept': 'application/json'})
        if response.status_code == 200:
            data = response.json()
            print(f"--- Search Results for: {query} ---")
            if 'verses' in data and data['verses']:
                for verse in data['verses'][:5]:
                    print(f"Shabad ID: {verse.get('shabadId')}")
                    print(f"Verse ID: {verse.get('verseId')}")
                    print(f"Gurmukhi: {verse.get('verse', {}).get('unicode')}")
                    print(f"Writer: {verse.get('writer', {}).get('english')} / {verse.get('writer', {}).get('unicode')}")
                    print(f"Raag: {verse.get('raag', {}).get('english')}")
                    print(f"Page: {verse.get('pageNo')}")
                    print("-" * 40)
            else:
                print("No verses found.")
        else:
            print(f"API returned status code: {response.status_code}")
    except Exception as e:
        print(f"Error searching: {e}")

# Search for Waheguru Gurmantar
search_shabad("ਵਾਹਿਗੁਰੂ")
