import requests
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

api_base = "https://api.banidb.com/v2"

endpoints = [
    "/raags",
    "/raag",
    "/shabads?raag=Asa",
    "/shabads?raag=1",
    "/search/ਰਾਗ?searchtype=1",
    "/search/ਆਸਾ?searchtype=1",
    "/search/Asa?searchtype=1"
]

for ep in endpoints:
    url = f"{api_base}{ep}"
    print(f"Testing: {url}")
    try:
        res = requests.get(url)
        print(f"  Status: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, dict):
                print(f"  Keys: {list(data.keys())}")
                if 'verses' in data:
                    print(f"  Verses count: {len(data['verses'])}")
                if 'rows' in data:
                    print(f"  Rows count: {len(data['rows'])}")
            elif isinstance(data, list):
                print(f"  List count: {len(data)}")
        else:
            print(f"  Error: {res.text[:100]}")
    except Exception as e:
        print(f"  Failed: {e}")
