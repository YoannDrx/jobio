"""
Phase 1 — Créer les redirections email OVH
hello@domain → yoann.andrieux@gmail.com

Prérequis:
  pip install ovh
  Configurer ~/.ovh.conf ou les variables d'environnement:
    OVH_ENDPOINT, OVH_APPLICATION_KEY, OVH_APPLICATION_SECRET, OVH_CONSUMER_KEY

Usage:
  python scripts/ovh-create-redirections.py
"""

import ovh

client = ovh.Client()

TARGET_EMAIL = "yoann.andrieux@gmail.com"

redirections = [
    ("homego.app", "hello"),
    ("hyrun.app", "hello"),
    ("moodday.app", "hello"),
    ("mycryptopilot.app", "hello"),
    ("eggscuseme.app", "hello"),  # Fonctionnera après migration DNS Cloudflare → OVH
]

for domain, local_part in redirections:
    source = f"{local_part}@{domain}"
    print(f"Création redirection: {source} → {TARGET_EMAIL} ... ", end="")
    try:
        result = client.post(
            f"/email/domain/{domain}/redirection",
            _from=source,
            to=TARGET_EMAIL,
            localCopy=False,
        )
        print(f"OK (id: {result.get('id', 'N/A')})")
    except ovh.exceptions.ResourceConflictError:
        print("EXISTE DEJA")
    except Exception as e:
        print(f"ERREUR: {e}")

print("\nTerminé. Vérification:")
for domain, local_part in redirections:
    try:
        redirects = client.get(f"/email/domain/{domain}/redirection")
        print(f"  {domain}: {len(redirects)} redirection(s)")
    except Exception as e:
        print(f"  {domain}: erreur de vérification ({e})")
