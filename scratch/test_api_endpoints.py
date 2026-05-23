import requests
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

api_base = "https://api.banidb.com/v2"

def test_endpoint(path):
    url = f"{api_base}{path}"
    print(f"\n--- Testing Endpoint: {url} ---")
    try:
        res = requests.get(url, headers={'Accept': 'application/json'})
        print(f"Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, list):
                print(f"List returned. Count: {len(data)}")
                print(json.dumps(data[:5], indent=2, ensure_ascii=False))
            elif isinstance(data, dict):
                print(f"Object returned. Keys: {list(data.keys())}")
                # Print a small portion
                snippet = {k: data[k] for k in list(data.keys())[:5]}
                print(json.dumps(snippet, indent=2, ensure_ascii=False))
            else:
                print(str(data)[:200])
        else:
            print(f"Error: {res.text[:100]}")
    except Exception as e:
        print(f"Request failed: {e}")

# Test different common banidb endpoints
test_endpoint("/ragas")
test_endpoint("/writers")
test_endpoint("/ragas/1") # Test single raag detail
test_endpoint("/search?raag=1") # Test search query param
test_endpoint("/search?raag=Asa") # Test search query param string
