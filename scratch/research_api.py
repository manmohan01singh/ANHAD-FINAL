import requests
import sys
sys.stdout.reconfigure(encoding='utf-8')

# We will test searchtype=1 (Gurmukhi Full Word) and searchtype=0 (First Letter)
# Sources: G (SGGS), B (Bhai Gurdas)

def test_api_search(query, searchtype, source):
    url = f"https://api.banidb.com/v2/search/{query}?searchtype={searchtype}&source={source}&page=1&results=20"
    print(f"Querying: {url}")
    try:
        res = requests.get(url, headers={'Accept': 'application/json'})
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            if 'verses' in data and data['verses']:
                for v in data['verses'][:3]:
                    print(f"  Shabad ID: {v.get('shabadId')}")
                    print(f"  Verse ID: {v.get('verseId')}")
                    print(f"  Gurmukhi: {v.get('verse', {}).get('unicode')}")
                    print(f"  Source: {v.get('source', {}).get('english')}")
                    print("-" * 30)
            else:
                print("  No verses found in response.")
        else:
            print(f"  Error body: {res.text[:100]}")
    except Exception as e:
        print(f"  Request failed: {e}")

# Test 1: First letter search for 'ਵਗ' with source B
test_api_search("ਵਗ", 0, "B")

# Test 2: First letter search for 'ਵਗਹ' with source B
test_api_search("ਵਗਹ", 0, "B")

# Test 3: First letter search for 'ਵ' with source B
test_api_search("ਵ", 0, "B")

# Test 4: First letter search on SGGS for 'ੴ'
test_api_search("ੴ", 0, "G")
