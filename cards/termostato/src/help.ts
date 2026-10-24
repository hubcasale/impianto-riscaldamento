// Spiegazioni delle preferenze: si aprono toccando la "i" accanto a ogni voce (sul tablet non c'è il passaggio del mouse).
export interface HelpText {
  title: string;
  what: string;
  when: string;
  suggested?: string;
}

export const HELP: Record<string, HelpText> = {
  block_temperature: {
    title: "Temperature",
    what: "Le temperature che il termostato usa: l'antigelo quando nessuno è in fascia, i limiti dell'obiettivo e il valore da cui si parte.",
    when: "Cambiale se l'antigelo ti sembra troppo basso o se vuoi evitare obiettivi troppo alti o troppo bassi dai pulsanti + e −.",
  },
  antigelo: {
    title: "Temperatura antigelo",
    what: "La temperatura a cui il termostato si porta fuori dal programma, a timer finito e a casa vuota.",
    when: "Protegge tubi e muri dal gelo senza scaldare la casa.",
    suggested: "5 °C. Sali a 7-8 °C se hai muri o tubi esposti.",
  },
  min_target: {
    title: "Obiettivo minimo",
    what: "Il valore più basso che puoi scegliere con − o nel timer.",
    when: "Evita di scendere per sbaglio sotto una temperatura che non vuoi.",
    suggested: "10 °C.",
  },
  max_target: {
    title: "Obiettivo massimo",
    what: "Il valore più alto che puoi scegliere con + o nel timer.",
    when: "Evita sprechi se il tablet viene toccato per sbaglio.",
    suggested: "23 °C.",
  },
  default_target: {
    title: "Obiettivo predefinito",
    what: "La temperatura usata quando passi da Spento a Manuale o avvii un timer senza sceglierne una.",
    when: "È il valore di comfort di tutti i giorni.",
    suggested: "20,5 °C.",
  },
  frost_keep_heat: {
    title: "Fuori programma resta acceso all'antigelo",
    what: "Acceso: fuori fascia il termostato resta in modalità riscaldamento ma con l'obiettivo all'antigelo, così protegge dal gelo. Spento: il termostato viene spento del tutto.",
    when: "Lascialo acceso se vuoi la protezione dal gelo anche d'inverno a casa vuota.",
    suggested: "Acceso.",
  },
  block_timer: {
    title: "Timer",
    what: "Il timer scalda alla temperatura scelta per un tempo e poi torna al programma, oppure all'antigelo se il programma è spento.",
    when: "Per una serata fuori programma o per scaldare prima di rientrare.",
  },
  timer_max_hours: {
    title: "Durata massima del timer",
    what: "Il timer non può durare più di questo. Vale anche come sicurezza: se qualcuno scalda a mano a casa vuota, dopo questo tempo il termostato torna all'antigelo.",
    when: "Riduci il valore se vuoi più sicurezza contro le dimenticanze.",
    suggested: "6 ore.",
  },
  block_away: {
    title: "Casa vuota",
    what: "Quando nessuno è in casa il termostato va all'antigelo e il programma non lo scalda. Al rientro il programma riprende.",
    when: "Per non scaldare una casa vuota. Si può sempre scaldare a mano, anche a casa vuota.",
  },
  away_setback: {
    title: "Abbassa a casa vuota",
    what: "Porta il termostato all'antigelo dopo il tempo indicato dall'uscita di tutti. Serve il sensore «Casa vuota» tra i collegamenti.",
    when: "Spegnilo per il periodo in cui tieni la casa calda anche da vuota.",
    suggested: "Acceso.",
  },
  away_minutes: {
    title: "Minuti di casa vuota",
    what: "Quanto deve restare vuota la casa prima di abbassare. Evita che un'uscita breve spenga il riscaldamento.",
    when: "Allungalo se esci spesso per commissioni brevi.",
    suggested: "30 minuti.",
  },
  block_notify: {
    title: "Annunci vocali",
    what: "Il termostato annuncia a voce quello che fa: inizio e fine del timer, cambi del programma, casa vuota e rientro.",
    when: "Utile con Alexa. Lascia il servizio vuoto per non avere annunci.",
  },
  notify_enabled: {
    title: "Annunci attivi",
    what: "Interruttore generale degli annunci.",
    when: "Spegnilo di notte o per gli ospiti.",
    suggested: "Acceso.",
  },
  notify_service: {
    title: "Servizio di annuncio",
    what: "Il servizio di Home Assistant che pronuncia il messaggio, scritto come notify.nome.",
    when: "Con l'integrazione Alexa Media Player è notify.alexa_media.",
  },
  notify_targets: {
    title: "Altoparlanti",
    what: "Quali altoparlanti pronunciano gli annunci. Se non ne scegli nessuno decide il servizio.",
    when: "Scegli le stanze dove vuoi sentire gli annunci.",
  },
  block_links: {
    title: "Collegamenti",
    what: "Le entità di Home Assistant che il termostato usa: il termostato da comandare, un sensore di temperatura e gli indicatori di casa vuota e ospiti.",
    when: "Di solito si impostano una volta sola.",
  },
  climate: {
    title: "Termostato",
    what: "Il termostato che viene comandato (climate). È l'unico collegamento obbligatorio.",
    when: "Cambialo solo se sostituisci il termostato.",
  },
  temperature_sensor: {
    title: "Sensore di temperatura",
    what: "Un sensore ambiente da mostrare al posto di quello del termostato.",
    when: "Utile se hai una sonda più precisa in un'altra stanza. Facoltativo.",
  },
  away_entity: {
    title: "Casa vuota",
    what: "Un'entità accesa quando nessuno è in casa (per esempio il sensore della caldaia «nessuno in casa»).",
    when: "Serve all'abbassamento a casa vuota. Facoltativo.",
  },
  guests_entity: {
    title: "Ospiti",
    what: "Un'entità accesa quando ci sono ospiti: con gli ospiti la casa non è considerata vuota.",
    when: "Per chi non ha un telefono tracciato. Facoltativo.",
  },
};
