# Docker Tests

Disse tests verificerer at vores Docker-images er bygget korrekt vha. [container-structure-test](https://github.com/GoogleContainerTools/container-structure-test).

## Hvad testes?

**Backend (`dendanskedonation-server`):**
- At `server.js` findes i containeren
- At `package.json` findes i containeren
- At `node_modules` er installeret
- At Node version 18 bruges
- At `server.js` er syntaktisk korrekt

**Frontend (`dendanskedonation-client`):**
- At `index.html` er bygget og klar
- At `static/` mappen med JS og CSS findes
- At `favicon.ico` findes
- At nginx binary er tilgængeligt

---

## Krav før du går i gang

- **Docker Desktop** er installeret og kører
- **WSL** er installeret med en Ubuntu-distribution
- **Docker Desktop WSL Integration** er slået til for Ubuntu:
  1. Åbn Docker Desktop
  2. Gå til Settings → Resources → WSL Integration
  3. Slå Ubuntu til
  4. Klik Apply & Restart

---

## Installation af container-structure-test

Åbn en Ubuntu WSL-terminal og kør:

```bash
curl -LO https://storage.googleapis.com/container-structure-test/latest/container-structure-test-linux-amd64
chmod +x container-structure-test-linux-amd64
sudo mv container-structure-test-linux-amd64 /usr/local/bin/container-structure-test
```

Tjek at det virkede:

```bash
container-structure-test version
```

Du skulle se noget i stil med `1.16.0`.

---

## Tilføj dig selv til docker-gruppen

Så du kan køre Docker uden sudo:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## Byg Docker images

Naviger til projektmappen i din WSL-terminal og byg images:

```bash
docker compose up -d --build
```

Begge containers skal have status **running** i Docker Desktop før du kører testene.

---

## Kør testene

**Vigtigt:** Brug den fulde sti til testfilerne, ikke den relative sti.

**Backend:**
```bash
container-structure-test test \
  --image dendanskedonation-server \
  --config /mnt/c/Users/<dit-brugernavn>/.../<sti-til-projekt>/tests/docker/backend.structure-test.yaml
```

**Frontend:**
```bash
container-structure-test test \
  --image dendanskedonation-client \
  --config /mnt/c/Users/<dit-brugernavn>/.../<sti-til-projekt>/tests/docker/frontend.structure-test.yaml
```

Erstat `<dit-brugernavn>` og `<sti-til-projekt>` med din egen sti. Du kan finde den ved at køre `pwd` i projektmappen.

---

## Forventet output

```
=====================================================
====================== RESULTS ======================
=====================================================
Passes:      5
Failures:    0
PASS
```
