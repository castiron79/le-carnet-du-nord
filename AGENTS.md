# Projektregler för Le Carnet du Nord

Vid varje ändring av appen eller Home Assistant-paketet ska agenten, inom samma
godkända arbetsflöde:

1. höja versionsnumret i `home-assistant-addon/config.yaml`;
2. lägga till en daterad post för exakt samma version i både projektets
   `CHANGELOG.md` och `home-assistant-addon/CHANGELOG.md`, som visas av Green;
3. köra bygg-, test- och releasekontroller;
4. committa och skicka den validerade versionen direkt till `main` på
   `castiron79/le-carnet-du-nord` när användaren har godkänt publiceringen;
5. verifiera GitHub-versionen efter push och rapportera committen ärligt.

Använd inte GitHub Desktop eller manuell filkopiering som normal publiceringsväg.
Om en aktiv skrivanslutning till GitHub saknas ska publiceringen stoppas med ett
tydligt fel; säg aldrig att en lokal ändring är publicerad.

Receptinnehåll publiceras separat till det privata `le-carnet-recipes` och får
inte blandas in i kodrepot.
