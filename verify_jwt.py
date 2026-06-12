import sys, base64, json, hmac, hashlib

token = sys.argv[1]
secret = sys.argv[2]

parts = token.split('.')
header_b64, payload_b64, signature_b64 = parts[0], parts[1], parts[2]

# Recalcule la signature avec le secret
message = f"{header_b64}.{payload_b64}".encode()
expected = hmac.new(secret.encode(), message, hashlib.sha256).digest()
expected_b64 = base64.urlsafe_b64encode(expected).rstrip(b'=').decode()

print("\n=== VÉRIFICATION SIGNATURE JWT ===")
print(f"Signature reçue    : {signature_b64}")
print(f"Signature calculée : {expected_b64}")

if expected_b64 == signature_b64:
    print("\n✅ Signature VALIDE — token authentique")
else:
    print("\n❌ Signature INVALIDE — token falsifié ou mauvais secret")

# Maintenant falsifie le payload et montre que ça échoue
def pad(s):
    return s + '=' * (4 - len(s) % 4)

payload = json.loads(base64.urlsafe_b64decode(pad(payload_b64)))
print(f"\n=== PAYLOAD ORIGINAL ===")
print(json.dumps(payload, indent=2))

# Tente de devenir admin
payload['role'] = 'admin'
fake_payload = base64.urlsafe_b64encode(
    json.dumps(payload).encode()
).rstrip(b'=').decode()

fake_message = f"{header_b64}.{fake_payload}".encode()
fake_expected = hmac.new(secret.encode(), fake_message, hashlib.sha256).digest()
fake_expected_b64 = base64.urlsafe_b64encode(fake_expected).rstrip(b'=').decode()

print(f"\n=== TENTATIVE FALSIFICATION (role → admin) ===")
print(f"Nouveau payload    : {fake_payload}")
print(f"Ancienne signature : {signature_b64}")
print(f"Nouvelle signature : {fake_expected_b64}")
print(f"\n❌ Les signatures sont différentes — impossible de falsifier sans le secret !")
