/* Scelte fisse del server (docs/migrazione.md, «Decisioni già prese») */
export const REGIONE = 'europe-west1';        // vicina al database (eur3)
export const MAX_ISTANZE = 10;                // tetto alle copie in esecuzione: protegge il conto da errori in ciclo
