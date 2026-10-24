# Impianto riscaldamento

Un'unica integrazione per Home Assistant che raccoglie le parti "intelligenti" dell'impianto di riscaldamento di casa:

- **Stufa a pellet**: dice in che stato è guardando la potenza assorbita da una presa smart, con programma settimanale, timer, accensione e spegnimento dall'interruttore della stufa, grafici e notifiche.
- **Termostato riscaldamento**: comanda un termostato ambiente esistente (`climate.*`) con modalità manuale, timer, programma settimanale con temperature, antigelo e casa vuota, annunci vocali.

Ognuna ha la **sua scheda Lovelace** (`custom:stufa-pellet-card` e `custom:termostato-card`) e le **sue preferenze**, modificabili dalla scheda o dal menu *Configura*. Si possono aggiungere più voci dello stesso tipo (due stufe, due termostati).

Nasce dall'unione dei due repository `stufa-pellet-monitor` e `termostato-riscaldamento` (ora archiviati). Il codice è lo stesso: cambia il contenitore, e con la migrazione automatica nulla va perso (impostazioni, programmi, nomi delle entità, storico).

La scheda panoramica dell'impianto (boiler, caldaia, stufa e termostato in un'unica scheda) sta in [impianto-riscaldamento-dashboard](https://github.com/hubcasale/impianto-riscaldamento-dashboard) e usa le due schede di questa integrazione.

## Installazione

**HACS** → Integrazioni → menu ⋮ → *Repository personalizzati* → `https://github.com/hubcasale/impianto-riscaldamento`, categoria *Integrazione* → installa → riavvia Home Assistant.

**A mano**: copia `custom_components/impianto_riscaldamento` nella cartella `custom_components` e riavvia.

Poi *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Impianto riscaldamento* e scegli che cosa aggiungere:

- **Stufa a pellet**: sensore di potenza (obbligatorio, in W), interruttore di accensione della stufa (facoltativo: programma, timer e pulsante agiscono su questo), interruttore della presa (facoltativo, solo stato), contatore di energia (facoltativo).
- **Termostato riscaldamento**: il termostato (obbligatorio), un sensore di temperatura, l'entità «casa vuota» e quella degli ospiti (facoltativi).

## Se usi già le due integrazioni separate (`stufa_pellet` e `termostato_riscaldamento`)

La migrazione è automatica e **mantiene gli id delle entità** (quindi grafici, storico, dashboard e automazioni), il dispositivo con la sua area, le impostazioni e il programma salvato. In ordine:

1. In HACS installa **Impianto riscaldamento**. **Non riavviare ancora.**
2. In HACS rimuovi (*Elimina*) le due integrazioni vecchie, *Stufa a pellet monitor* e *Termostato riscaldamento*. Le voci di configurazione restano in Home Assistant: servono alla migrazione.
3. Riavvia Home Assistant.
4. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → Impianto riscaldamento*: compare la voce **«Importa le integrazioni precedenti»**. Confermala: ogni voce vecchia diventa una voce nuova e quella vecchia viene rimossa.
5. Se la dashboard non mostra le schede, svuota la cache del browser (sul tablet con Fully Kiosk: *Cancella cache*).

Le due vecchie integrazioni non possono restare installate insieme alla nuova (definiscono le stesse schede).

I comandi interni e i nomi delle schede sono rimasti uguali (`stufa_pellet/*`, `termostato_riscaldamento/*`, `custom:stufa-pellet-card`, `custom:termostato-card`): le dashboard e la scheda panoramica non vanno cambiate.

## Stufa a pellet

### Come riconosce lo stato

| Stato | Quando |
|---|---|
| **Spenta** | potenza sotto la soglia (predefinita 5 W) |
| **Accensione** | potenza oltre la soglia dell'accenditore (predefinita 250 W) |
| **Spegnimento** | potenza nella fascia della ventola in raffreddamento (predefinita 126–129 W) e, se attivo, interruttore della stufa spento |
| **In funzione** | tutto il resto |
| **Non disponibile** | il sensore di potenza non risponde |

Un nuovo stato deve durare qualche secondo (conferma) prima di essere accettato, così i picchi non fanno rimbalzare lo stato.

### Che cosa crea

Un dispositivo «Stufa a pellet» con `sensor.stufa_a_pellet_stato` (spenta / accensione / accesa / spegnimento / non_disponibile), accensioni e ore in funzione di oggi, ultima accensione e ultimo spegnimento, energia di oggi (se c'è un contatore), `binary_sensor` in funzione e azioni bloccate. Con l'interruttore della stufa anche il modo (programma / manuale / fuori_programma / timer), il prossimo evento e `switch.stufa_a_pellet_programmazione`.

### La scheda

```yaml
type: custom:stufa-pellet-card
# facoltativi
title: Stufa a pellet
entry_id: ...   # solo se hai più stufe
compact: true   # versione compatta, per metterla accanto ad altre schede
```

Pulsanti: **Stato**, **Grafici** (potenza con le soglie, 6 e 24 ore, 3 e 7 giorni), **Programma** (più fasce al giorno con vista della settimana), **Timer**, interruttore acceso/spento e **ingranaggio** con sensori, soglie, comportamento, notifiche e colore delle ceramiche (il pulsante *Suggerisci le soglie dallo storico* le ricava dagli ultimi 14 giorni).

La fascia agisce **solo ai cambi**: alle ore indicate accende o spegne l'interruttore, poi non insiste; se accendi o spegni a mano il programma riprende alla fascia successiva.

## Termostato riscaldamento

- **Manuale**: scegli l'obiettivo con + e −, il termostato lo mantiene.
- **Timer**: scalda alla temperatura scelta per un tempo, poi torna al programma (se attivo) o all'antigelo.
- **Programma settimanale**: più fasce al giorno, ognuna con giorni, inizio, fine e **temperatura**; fuori fascia va all'antigelo. Dove due fasce si sovrappongono vale la temperatura più alta.
- **Spento**: nessun programma, il termostato resta all'antigelo (o si spegne, a scelta).

Con la **casa vuota** il termostato va all'antigelo dopo il tempo scelto e il programma non lo scalda; al rientro il programma riprende. Si può sempre scaldare a mano, anche a casa vuota.

Le azioni partono **solo ai cambi**; fra un cambio e l'altro il termostato resta libero di essere cambiato a mano.

### Che cosa crea

Un dispositivo «Termostato riscaldamento» con il sensore della modalità (programma / fuori_programma / manuale / timer / spento) e i suoi attributi, il prossimo evento, `switch` programmazione e `binary_sensor` «sta scaldando» e «casa vuota».

### La scheda

```yaml
type: custom:termostato-card
# facoltativi
title: Termostato ambiente
entry_id: ...   # solo se hai più termostati
embedded: true  # senza cornice, per metterla dentro un'altra scheda
```

Quadrante con l'ago, + e −, modalità Programma / Manuale / Timer / Spento, programma settimanale e preferenze in cinque blocchi (Temperature, Timer, Casa vuota, Annunci vocali, Collegamenti), ciascuno con la sua spiegazione. Con un servizio `notify.*` (per esempio `notify.alexa_media`) annuncia a voce inizio e fine del timer, i cambi del programma, la casa vuota e il rientro.

Le schede sono pensate per il tocco (tablet): nessun suggerimento al passaggio del mouse, pulsanti da almeno 44 px.

## Sviluppo

```bash
npm run install:cards   # installa le dipendenze delle due schede
npm run build           # genera i bundle in custom_components/impianto_riscaldamento/frontend (da committare)
npm test                # test della logica delle schede
pip install pytest-homeassistant-custom-component home-assistant-frontend
python -m pytest -q tests   # logica e prove dentro un Home Assistant vero, compresa la migrazione
```

Struttura: `custom_components/impianto_riscaldamento/` contiene la parte comune (configurazione, migrazione, schede servite) e due sottopacchetti, `stufa/` e `termostato/`, ognuno con controller, logica, programma e piattaforme. Le schede, in TypeScript, stanno in `cards/stufa` e `cards/termostato` (ognuna con `dev/index.html` per provarla con un Home Assistant simulato dopo `npm run build:dev`).

Licenza MIT.
