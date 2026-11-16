# Pubblicazione di BeBeans

Come BeBeans arriva da GitHub a Firebase, e cosa va configurato a mano una volta sola. Nato con la fase 0 della [migrazione](migrazione.md).

## Come funziona

| Quando | Cosa parte | File |
| --- | --- | --- |
| Push su un ramo diverso da `main`, richiesta di unione | Test: modulo condiviso e funzioni, regole di Firestore nell'emulatore, funzioni nell'emulatore | `.github/workflows/test.yml` |
| Push su `main` | Gli stessi test; se sono verdi, prima il **server** (regole di Firestore e Cloud Functions, solo con `PUBBLICA_SERVER = true`), poi il **sito** (Firebase Hosting, app.bebeans.it) | `.github/workflows/firebase-hosting.yml` |

Se un test fallisce non si pubblica nulla. Il sito parte dopo il server, così una versione nuova dell'app trova già le funzioni di cui ha bisogno.

Finché la variabile `PUBBLICA_SERVER` è spenta, da GitHub si pubblica solo il sito, come prima della migrazione.

## Da fare una volta sola (Marco, con l'account proprietario)

### 1. Prima pubblicazione delle funzioni dal tuo computer

La prima pubblicazione attiva le API di Google che servono alle funzioni (Cloud Functions, Cloud Build, Artifact Registry, Cloud Run, Eventarc, Pub/Sub). Conviene farla con l'account proprietario, che ha il permesso di attivarle:

```bash
cd functions && npm ci && cd ..
```

```bash
npx firebase-tools@15.34.2 deploy --only functions --project duty-scheduler-bdd9e
```

Alla domanda sulla pulizia delle immagini vecchie (*cleanup policy*) rispondere con il valore proposto (1 giorno). Poi aprire app.bebeans.it come genitore, **⚙️ Setup › 📱 Questo dispositivo › ☁️ Collegamento al server › Prova**: deve comparire «risponde ✓ (europe-west1, oggi a Roma è il …)».

### 2. Ruoli dell'account `github-deploy`

In Google Cloud Console › IAM, all'account di servizio `github-deploy` (la cui chiave JSON è il segreto `FIREBASE_SERVICE_ACCOUNT` su GitHub), oltre ad «Amministratore Firebase Hosting» che ha già:

| Ruolo | Perché | Da quando |
| --- | --- | --- |
| Amministratore Cloud Functions (`roles/cloudfunctions.admin`) | pubblicare le funzioni | fase 0 |
| Utente account di servizio (`roles/iam.serviceAccountUser`) | far girare le funzioni con l'account di servizio predefinito di Compute (`106420224624-compute@developer.gserviceaccount.com`) | fase 0 |
| Amministratore regole Firebase (`roles/firebaserules.admin`) | pubblicare `firestore.rules` | fase 0 |
| Amministratore Artifact Registry (`roles/artifactregistry.admin`) | mantenere la pulizia automatica delle immagini delle funzioni | fase 0 |
| Consumatore Service Usage (`roles/serviceusage.serviceUsageConsumer`) | controllare che le API siano attive | fase 0 |
| Amministratore Cloud Scheduler (`roles/cloudscheduler.admin`) | lavori a orario (chiusura di mezzanotte) | fase 1 |
| Visualizzatore Cloud Datastore (`roles/datastore.viewer`) | lettura del rapporto giornaliero `admin/reports/{giorno}` dalla procedura delle 7 | fase 1 |

### 3. Accendere la pubblicazione del server

Su GitHub: **Settings › Secrets and variables › Actions › Variables › New repository variable**, nome `PUBBLICA_SERVER`, valore `true`.

Da quel momento ogni push su `main` pubblica anche regole e funzioni. **Attenzione:** le regole pubblicate sono quelle di `firestore.rules` nel repository; da qui in poi non si incollano più a mano in Console Firebase (una modifica fatta solo in Console verrebbe sovrascritta).

## Prove in locale

```bash
cd functions && npm test
```

```bash
cd tests && npm ci && npm test && npm run test:functions
```

Servono Node 22 e Java 11 o più recente (per l'emulatore). Dettagli in [`tests/README.md`](../tests/README.md).
