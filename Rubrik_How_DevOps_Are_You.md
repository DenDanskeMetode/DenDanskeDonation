# Rubrik: How DevOps Are You?

Her er et **scoreskema** til brug i forbindelse med øvelsen *“How DevOps Are You?”*.  
Det er udformet så i både kan score jer selv og bruge resultatet som afsæt for refleksion i jeres miniprojekt og eksamensprojekt.

Strukturen baserer sig på **The Three Ways** og centrale DevOps-principper (flow, feedback, læring, automatisering, kultur, arkitektur).

---


**Formål:**  
At hjælpe jer med at vurdere, hvor jeres projekt eller jeres måde at arbejde på placerer sig i forhold til centrale DevOps-principper.

**Instruktion:**  
Score hvert område fra **1–5**, hvor:

*   **1 = Ikke DevOps**
*   **3 = Noget DevOps**
*   **5 = Højt DevOps-niveau**

Til sidst lægger I pointene sammen og diskuterer *hvorfor* I har scoret som I har, og *hvad der holder jer tilbage*.

***

## Del A: Flow (The First Way)

| Område                                  | 1 – Lav modenhed                                | 3 – Middel modenhed                                   | 5 – Høj modenhed                                                | Score |
| --------------------------------------- | ----------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- | ----- |
| **Synlighed af arbejde**                | Arbejde er ustruktureret; ingen visualisering   | Noget arbejde visualiseres, men ujævnt                | Alt arbejde er synligt; teamet styrer flow aktivt               | 5      |
| **Batch-størrelse**                     | Store leverancer; lange iterationer             | Varierende størrelser; noget arbejde i mindre batches | Små, hyppige leverancer; kontinuerlig udvikling                 | 4      |
| **WIP-limit & fokus**                   | Mange parallelle opgaver; hyppige kontekstskift | Noget fokus; WIP nogle steder i brug                  | Aktiv WIP-styring; teamet arbejder med ét fokus ad gangen       | 2      |
| **Automatisering af build/test/deploy** | Primært manuelt; ustabile processer             | Noget automatisering                                  | Høj grad af automatisering; pipeline er stabil og reproducérbar | 5      |
| **Arkitektur & autonomi**               | Tæt koblet; ændringer kræver koordinering       | Delvist modulært; noget selvstændighed                | Løst koblet; små teams kan deploye uden afhængigheder           | 1      |

***
Teamet har abrjeded tæt sammen på trods af at vi har været spredt over vidt forskellige domæner. Det er kommet til udtryk gennem vores møder på discord og entusiasme for de andres arbejdsopgaver.
Vores Automatisering har haft stort fokus lige fra starten.

## Del B: Feedback (The Second Way)

| Område                          | 1 – Lav modenhed                    | 3 – Middel modenhed                          | 5 – Høj modenhed                                                | Score |
| ------------------------------- | ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------- | ----- |
| **Hurtig feedback i udvikling** | Fejl findes sent; tests er manuelle | Automatiserede tests, men langsomme/ustabile | Hurtig og stabil automatiseret test-feedback                    | 5      |
| **Monitoring & telemetry**      | Minimal logging og overvågning      | Basis logging og metrics                     | Proaktiv overvågning; teamet reagerer hurtigt på signaler       | 1      |
| **Håndtering af fejl**          | Fejl opdages sent; brand-slukning   | Nogle processer for fejlhåndtering           | Fejl ses som læringsmuligheder; hurtig lokalisering og reaktion | 3      |
| **Andon cord mentalitet**       | Fejl ignoreres eller udskydes       | Nogle fejl stoppes og adresseres             | Fejl stoppes straks; teamet “swarm’er” problemet                | 2      |

***
Vi har internt haft meget tæt kommunikation, men pga deadline og specialisering i teamet har alle været opmærksom på større eller mindre fejl, men det har sjællent været mere end 1-2 personer som har været på kritisk bug-fixing.

## Del C: Continual Learning (The Third Way)

| Område                            | 1 – Lav modenhed                                         | 3 – Middel modenhed                      | 5 – Høj modenhed                                                           | Score |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ----- |
| **Forbedring af dagligt arbejde** | Tekniske problemer ignoreres; ingen tid til forbedringer | Nogle forbedringer, men ikke systematisk | Forbedringer er en del af sprint/iteration; teknisk gæld håndteres løbende | 2      |
| **Kultur & samarbejde**           | Siloer; mellemteam-konflikter                            | Rimeligt samarbejde; men stadig friktion | Høj-trust kultur; ingen blame; fælles mål                                  | 5      |
| **Deling af viden**               | Viden er individuel; ikke dokumenteret                   | Noget dokumentation                      | Læring opsamles, deles og bruges af hele teamet                            | 3      |
| **Eksperimenter & innovation**    | Lav risiko-appetit; ingen test af nye ideer              | Nogle eksperimenter                      | Hypotese-drevet arbejde; kontinuerlig eksperimentering                     | 5      |

***
Givet at projektet har omhandlet at bygge noget fra bunden har der været naturlig stor fokus på læring og ekspermentering samt vidensdeling om hvordan vores codebase udviklede sig. Specielt fordi vores system har været ret tætkoblet har det været nødvendigt sætte sig ind i resten af holdets beslutninger og systemts arkiteksur som helhed.

## Del D: Samlet score og refleksion

**Maks. point: 120  
Lavt niveau: 24–50  
Mellem niveau: 51–90  
Højt niveau: 91–120**


33 points ‼️🦍🍔🦞🤯😱
### Spørgsmål:

- *Hvor ser I jeres stærkeste DevOps-praksisser?*

    Fælles læring, continues deploy/delevery.
-  *Hvor er jeres største huller?*

    Vi har ikke haft noget monetorering.
    Der har ikke været optimesering af processer eller revurdering af approach. Diskution og valg af løsning er udelukende sket før inplementering.
- *Hvad forhindrer jer i at være mere DevOps? (teknologisk, organisatorisk, viden, processer, samarbejde)*

    Projektets natur (bygge fra bunde, tidspresset, AI-baseret)
- *Hvilke 2–3 forbedringer ville give størst effekt?*

    Monetorering, revurdering af løsninger efter inplementation.
    Vores system lider helt sikkert af stor teknisk gæld. Det er også meget tæt koblet.
- *Hvordan kan jeres vurdering bruges i eksamensprojektet?*

    Vi har størst af alt fundet ud af hvordan vi arbejder godt sammen, vores fælles arbejdsprocces har været fuldt på plads.
    Vi skal blive ved med at have stort fokus på CI/CD, det gør meget stor gavn.
    Monetorering og genvurderinger af løsninger efter inplementering ville nok være nice.

