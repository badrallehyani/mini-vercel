from requests import get, post
import json

response = post("http://localhost:3000/api/hello", json={"name": "Badr"})

if response.headers.get('Content-Type') == 'application/json':
    print(json.dumps(response.json(), indent=2))
else:
    print(response.text)