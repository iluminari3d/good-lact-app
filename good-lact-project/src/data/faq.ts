export interface FaqItem { q: string; a: string }
export interface FaqCategory { category: string; items: FaqItem[] }

export const FAQ_DATA: FaqCategory[] = [
  {
    category: "L'Intolleranza al Lattosio: Le Basi",
    items: [
      {
        q: "Cos'è esattamente l'intolleranza al lattosio?",
        a: "Si verifica quando l'intestino tenue non produce una quantità sufficiente di lattasi, l'enzima fondamentale per digerire il lattosio (il principale zucchero del latte e dei suoi derivati). Il lattosio non digerito arriva nell'intestino crasso dove fermenta, causando gonfiore, crampi, meteorismo e altri fastidi gastrointestinali."
      },
      {
        q: "L'intolleranza al lattosio è uguale all'allergia al latte?",
        a: "Assolutamente no, ed è una distinzione vitale. L'intolleranza coinvolge l'apparato digerente e riguarda uno zucchero. L'allergia al latte è una risposta anomala del sistema immunitario alle proteine del latte (come caseina o siero) e può scatenare reazioni gravi o anafilattiche. Le compresse di lattasi sono del tutto inutili in caso di allergia."
      },
      {
        q: "Tutti i formaggi contengono lattosio?",
        a: "No. I formaggi a pasta dura stagionati a lungo (come Parmigiano Reggiano, Grana Padano o Pecorino molto stagionato) sono naturalmente privi di lattosio o ne contengono tracce irrilevanti, perché viene consumato dai batteri durante la stagionatura."
      }
    ]
  },
  {
    category: "Gli Enzimi di Lattasi (Le Compresse)",
    items: [
      {
        q: "Cosa significa la sigla FCC sulle confezioni di lattasi?",
        a: "FCC sta per \"Food Chemicals Codex\". È l'unità di misura internazionale che indica il livello di attività e il potere digestivo dell'enzima lattasi. Più alto è il valore FCC, maggiore è la quantità di lattosio che la singola compressa o capsula è in grado di scomporre."
      },
      {
        q: "Quando è il momento esatto per assumere l'integratore?",
        a: "Il momento perfetto è in concomitanza con il primissimo boccone o sorso del pasto contenente lattosio (o al massimo 5-10 minuti prima). L'enzima deve trovarsi fisicamente nello stomaco per \"accogliere\" il cibo e iniziare a scindere lo zucchero."
      },
      {
        q: "Cosa succede se assumo troppe unità FCC? Posso andare in sovradosaggio?",
        a: "L'enzima lattasi agisce esclusivamente sul lattosio e non viene assorbito o metabolizzato dal resto dell'organismo. Le quantità in eccesso vengono semplicemente eliminate senza causare danni. Nel dubbio, è preferibile abbondare leggermente piuttosto che rischiare una copertura enzimatica insufficiente."
      },
      {
        q: "Perché a volte sto male anche se ho preso la pillola?",
        a: "I motivi possono essere diversi: la dose di FCC era troppo bassa rispetto all'effettiva quantità di lattosio ingerito, il pasto è durato a lungo (se mangi per più di 30-45 minuti, spesso è necessaria una seconda compressa), oppure il cibo conteneva elevate quantità di \"lattosio nascosto\" (spesso usato come addensante in salumi, salse, snack o come eccipiente nei farmaci)."
      }
    ]
  },
  {
    category: "I Formaggi Naturalmente Senza Lattosio",
    items: [
      {
        q: "Perché alcuni formaggi normali non contengono lattosio?",
        a: "Il miracolo avviene grazie alla fermentazione e alla stagionatura. Durante la produzione del formaggio, vengono aggiunti dei batteri lattici che si nutrono del lattosio, trasformandolo in acido lattico. Più il formaggio è stagionato (e quindi a pasta dura), meno lattosio conterrà, arrivando a livelli prossimi allo zero (inferiori a 0,1g o 0,01g su 100g), che sono tollerati dalla stragrande maggioranza delle persone intolleranti."
      },
      {
        q: "Quali sono i formaggi naturalmente privi di lattosio che posso mangiare senza prendere l'integratore?",
        a: "La lista è molto più lunga di quanto si pensi! Tra i più noti e sicuri troviamo:\n\n• I grandi stagionati: Parmigiano Reggiano (dai 24 mesi in su la sicurezza è pressoché totale), Grana Padano e Pecorino molto stagionato.\n• A pasta filata e semi-dura: Il Provolone (come il classico Auricchio, sia dolce che piccante), il Caciocavallo e la Scamorza (comprese le produzioni pugliesi del Caseificio Montrone).\n• Gli erborinati: Il Gorgonzola.\n• Oltre confine: Emmentaler, Gruyère, Fontina, Brie e Camembert."
      }
    ]
  },
  {
    category: "Come Funziona la Stima",
    items: [
      {
        q: "Come fa l'app a sapere cosa c'è nel mio piatto?",
        a: "Descrivi il piatto o lo fotografi: l'analisi riconosce gli ingredienti che possono contenere lattosio, compresi quelli che non si vedono ma sono tipici della ricetta (ad esempio il burro nel risotto o la panna nella carbonara). I grammi sono una stima: puoi sempre correggerli o escludere un ingrediente."
      },
      {
        q: "Su cosa si basa il calcolo della dose di lattasi?",
        a: "Sul lattosio stimato nel pasto, moltiplicato per 1.000 FCC per grammo. È una stima prudenziale e non un dato clinico certo: le fonti che abbiamo consultato indicano da circa 200 FCC per grammo (valore di laboratorio o di un produttore) fino a 1.000-1.500 (stima pratica di un portale informativo, coerente con i 5.000-15.000 FCC a pasto che molte persone dichiarano), e nessuna è uno studio dose-risposta. Gli alimenti con lattosio trascurabile (come i formaggi stagionati o il gorgonzola) contano 0. Mezza compressa è la dose minima che proponiamo, anche quando il calcolo ne darebbe molto meno. Se hai sintomi con la dose consigliata, segnalali nel diario e parlane con il medico.",
      },
      {
        q: "Cosa significano Certo, Probabile e Possibile?",
        a: "Certo: l'ingrediente è nominato o chiaramente visibile. Probabile: è tipico di quella ricetta ma non si vede. Possibile: alcune ricette lo usano e altre no. Gli ingredienti certi e probabili entrano nella dose consigliata; quelli possibili entrano solo nella dose prudente."
      },
      {
        q: "Perché a volte l'app consiglia la dose prudente?",
        a: "Quando buona parte del lattosio dipende da ingredienti incerti, la stima ha una confidenza bassa. In quel caso l'app ti propone direttamente la dose prudente, perché una compressa in più non fa male mentre una in meno può lasciarti scoperto."
      },
      {
        q: "Posso fidarmi al 100% del risultato?",
        a: "No: la quantità di burro o di panna in un piatto non si può conoscere con certezza, soprattutto fuori casa. Per questo l'app mostra un intervallo e un livello di confidenza. Il risultato è un aiuto pratico e non sostituisce il parere del medico."
      }
    ]
  },
  {
    category: "Etichette e Lattosio Nascosto",
    items: [
      {
        q: "Che cosa devo cercare sulle etichette?",
        a: "Cerca latte, lattosio, siero di latte, latte scremato in polvere, panna, burro, yogurt, formaggio, caseinato, lattoalbumina e proteine del latte. In Italia il latte è un allergene da dichiarare in evidenza (di solito in grassetto o maiuscolo) nell'elenco degli ingredienti. Con lo scanner di etichette puoi farti aiutare, ma controlla sempre di aver fotografato l'etichetta intera."
      },
      {
        q: "Cosa significa \"senza lattosio\" in etichetta?",
        a: "In Italia indica meno di 0,1 g di lattosio ogni 100 g di prodotto. \"A ridotto contenuto di lattosio\" indica meno di 0,5 g/100 g (per latte e latti fermentati). Un prodotto \"senza lattosio\" può comunque contenere proteine del latte: va bene per l'intolleranza al lattosio, ma non per l'allergia al latte."
      },
      {
        q: "\"Può contenere tracce di latte\" è un problema?",
        a: "È un'avvertenza precauzionale sulla possibile contaminazione in produzione: la quantità non si può conoscere. Per chi reagisce anche a piccole quantità è un rischio possibile, per gli altri di solito è trascurabile. La lattasi non protegge dalle tracce nello stesso modo in cui lavora sul lattosio dei pasti."
      },
      {
        q: "Il lattosio può essere nei farmaci?",
        a: "Sì: il lattosio è un eccipiente molto usato in compresse e capsule, anche di farmaci e integratori comuni, di solito in quantità piccole. Se sei molto sensibile, controlla il foglio illustrativo (la voce \"eccipienti\") o chiedi al farmacista se esiste una versione senza lattosio."
      }
    ]
  },
  {
    category: "Mangiare Fuori Casa",
    items: [
      {
        q: "Cosa chiedere al ristorante?",
        a: "Chiedi se nel piatto ci sono burro, panna, latte o formaggi (anche nel soffritto, nei risotti e nei sughi), se per cucinarlo vengono usate padelle o utensili in comune con piatti al latte e se la frittura è fatta in una friggitrice condivisa. La modalità Ristorante ha frasi pronte in cinque lingue da mostrare al personale."
      },
      {
        q: "Perché le salse dei fast food contano?",
        a: "Le salse industriali, quelle cremose o rosa e le salse al formaggio possono contenere latte, siero o lattosio anche se non sembra. L'app le considera come probabili nei panini, burger e street food, ma puoi sempre escluderle dal piatto se sai che non ci sono."
      },
      {
        q: "La pillola mi protegge dalla contaminazione?",
        a: "No, non in modo affidabile: la lattasi scompone il lattosio, ma non si può dimensionare su una contaminazione di cui non conosci la quantità. Se stai male anche con una dose alta, il diario sintomi e il report ti aiutano a parlarne con il medico."
      }
    ]
  },
  {
    category: "Quando Parlarne con il Medico",
    items: [
      {
        q: "Quando non basta l'app?",
        a: "Se hai sintomi forti o diversi da quelli digestivi (orticaria, gonfiore di labbra o gola, difficoltà a respirare: in questo caso chiama subito il 112), se stai male spesso nonostante la dose, o se hai perso peso senza motivo. Il medico può verificare che si tratti davvero di intolleranza al lattosio e non di allergia o altre condizioni."
      }
    ]
  }
];
