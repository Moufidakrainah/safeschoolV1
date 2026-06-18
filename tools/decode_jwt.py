import sys, base64, json
part = sys.stdin.read().strip()
part += '=' * (4 - len(part) % 4)
decoded = base64.urlsafe_b64decode(part)
print(json.dumps(json.loads(decoded), indent=2))
