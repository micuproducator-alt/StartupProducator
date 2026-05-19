// A comprehensive dataset of Romanian locations.
// Optimized for route matching and hierarchy selection.

export interface LocationHierarchy {
  [county: string]: {
    [city: string]: string[];
  };
}

export const getCounties = () => Object.keys(ROMANIAN_DATA).sort();

export const getCities = (county: string) => {
  if (!county || !ROMANIAN_DATA[county]) return [];
  return Object.keys(ROMANIAN_DATA[county]).sort();
};

export const getVillages = (county: string, city: string) => {
  if (
    !county ||
    !city ||
    !ROMANIAN_DATA[county] ||
    !ROMANIAN_DATA[county][city]
  )
    return [];
  return ROMANIAN_DATA[county][city].sort();
};

export const ROMANIAN_DATA: LocationHierarchy = {
  Alba: {
    "Alba Iulia": ["Alba Iulia", "Bărăbanț", "Micești", "Oarda", "Păclișa"],
    Aiud: [
      "Aiud",
      "Aiudul de Sus",
      "Ciumbrud",
      "Gâmbaș",
      "Gârbova de Jos",
      "Gârbova de Sus",
      "Măgina",
      "Păgida",
      "Sâncrai",
    ],
    Blaj: [
      "Blaj",
      "Deleni-Obârșie",
      "Flitești",
      "Izvoarele",
      "Mănărade",
      "Petrisat",
      "Spătac",
      "Tiur",
      "Veza",
    ],
    Sebeș: ["Sebeș", "Lancrăm", "Petrești", "Răhău"],
    Abrud: ["Abrud", "Abrud-Sat", "Gura Cornei", "Soharu"],
    "Baia de Arieș": [
      "Baia de Arieș",
      "Brăzești",
      "Cioara de Sus",
      "Muncelu",
      "Sartăș",
      "Simulești",
    ],
    Câmpeni: [
      "Câmpeni",
      "Boncești",
      "Borlești",
      "Botești",
      "Certege",
      "Coasta Vâscului",
      "Dănduț",
      "Dealu Bistrii",
      "Dealu Capsei",
    ],
    Cugir: [
      "Cugir",
      "Bocșitura",
      "Bucuru",
      "Călene",
      "Fețeni",
      "Goașele",
      "Mugești",
      "Vinerea",
    ],
    "Ocna Mureș": [
      "Ocna Mureș",
      "Cisteiu de Mureș",
      "Micoșlaca",
      "Războieni-Cetate",
      "Uioara de Jos",
      "Uioara de Sus",
    ],
    Teiuș: ["Teiuș", "Beldiu", "Căpud", "Coșlariu Nou", "Pețelca"],
    Zlatna: [
      "Zlatna",
      "Botești",
      "Galați",
      "Izvoru Ampoiului",
      "Pătrângeni",
      "Pirita",
      "Presaca Ampoiului",
      "Suseni",
      "Trâmpoiele",
      "Vâltori",
    ],
    "Comuna Albac": [
      "Albac",
      "Bărăști",
      "Budăiești",
      "Cionești",
      "Costești",
      "Dealu Lămășoi",
      "Deve",
      "După Pleșe",
      "Fața",
      "Pleșești",
      "Potionci",
      "Rogoz",
      "Roșești",
      "Rusești",
      "Sohodol",
      "Tamborești",
    ],
    "Comuna Almașu Mare": [
      "Almașu Mare",
      "Almașu de Mijloc",
      "Brădet",
      "Cheile Cibului",
      "Cib",
      "Glod",
      "Nădăștia",
    ],
    "Comuna Arieșeni": [
      "Arieșeni",
      "Avrămești",
      "Bubești",
      "Casa de Piatră",
      "Cobleș",
      "Dealu Bajului",
      "Fața Cristesei",
      "Fața Lăpușului",
      "Galbena",
      "Hodobana",
      "Izlaz",
      "Păntești",
      "Pătrăhăiți",
      "Poienița",
      "Ravicești",
      "Sturu",
      "Ștei-Arieșeni",
      "Vanvucești",
    ],
  },
  Arad: {
    Arad: ["Arad"],
    "Chișineu-Criș": ["Chișineu-Criș", "Nădab"],
    Curtici: ["Curtici"],
    Ineu: ["Ineu", "Mocrea"],
    Lipova: ["Lipova", "Radna", "Șoimoș"],
    Nădlac: ["Nădlac"],
    Pâncota: ["Pâncota", "Măderat"],
    Pecica: ["Pecica", "Bodrogu Vechi", "Sederhat", "Turnu"],
    Sântana: ["Sântana", "Caporal Alexa"],
    Sebiș: ["Sebiș", "Donceni", "Prunișor", "Sălăjeni"],
    "Comuna Vladimirescu": ["Vladimirescu", "Cicir", "Horia", "Mândruloc"],
  },
  Argeș: {
    Pitești: ["Pitești"],
    Câmpulung: ["Câmpulung"],
    "Curtea de Argeș": ["Curtea de Argeș", "Noapteș"],
    Mioveni: ["Mioveni", "Clucereasa", "Colibași", "Făgetu", "Racovița"],
    Costești: [
      "Costești",
      "Broșteni",
      "Lăceni",
      "Pârvu Roșu",
      "Podu Broșteni",
      "Smei",
      "Stârci",
    ],
    Ștefănești: [
      "Ștefănești",
      "Enculești",
      "Golești",
      "Izvorani",
      "Ștefăneștii Noi",
      "Valea Mare-Podgoria",
      "Viișoara",
      "Zăvoi",
    ],
    Topoloveni: [
      "Topoloveni",
      "Boțârcani",
      "Crintești",
      "Gorănești",
      "Țigănești",
    ],
  },
  Bacău: {
    Bacău: ["Bacău"],
    Moinești: ["Moinești", "Găzărie"],
    Onești: ["Onești", "Borzești", "Slobozia"],
    Buhuși: ["Buhuși", "Marginea", "Runcu"],
    Comănești: ["Comănești", "Podei", "Vermești"],
  },
  Bihor: {
    Oradea: ["Oradea"],
    Beiuș: ["Beiuș", "Delani"],
    Marghita: ["Marghita", "Cheț", "Ghenetea"],
    Salonta: ["Salonta"],
  },
  "Bistrița-Năsăud": {
    Bistrița: [
      "Bistrița",
      "Ghinda",
      "Sărata",
      "Sigmir",
      "Slătinița",
      "Unirea",
      "Viișoara",
    ],
    Năsăud: ["Năsăud", "Liviu Rebreanu", "Lușca"],
    Beclean: ["Beclean", "Coldău", "Figa", "Rusu de Jos"],
  },
  Botoșani: {
    Botoșani: ["Botoșani"],
    Dorohoi: ["Dorohoi", "Dealu Mare", "Loturi Enescu", "Progresul"],
    Săveni: ["Săveni", "Bodeasa", "Bozieni"],
  },
  Brașov: {
    Brașov: ["Brașov", "Poiana Brașov"],
    Codlea: ["Codlea"],
    Făgăraș: ["Făgăraș"],
    Predeal: ["Predeal", "Pârâul Rece"],
    Râșnov: ["Râșnov"],
    Săcele: ["Săcele"],
    Zărnești: ["Zărnești", "Tohanu Nou"],
  },
  Brăila: {
    Brăila: ["Brăila"],
    Ianca: ["Ianca", "Berlești", "Plopu"],
  },
  București: {
    "Sector 1": [
      "București",
      "Aviației",
      "Băneasa",
      "Bucureștii Noi",
      "Pajura",
      "Pipera",
    ],
    "Sector 2": [
      "București",
      "Colentina",
      "Iancului",
      "Obor",
      "Pantelimon",
      "Tei",
    ],
    "Sector 3": ["București", "Dristor", "Titan", "Unirii", "Vitan"],
    "Sector 4": [
      "București",
      "Berceni",
      "Giurgiului",
      "Olteniței",
      "Tineretului",
    ],
    "Sector 5": ["București", "13 Septembrie", "Cotroceni", "Rahova"],
    "Sector 6": ["București", "Crângași", "Drumul Taberei", "Militari"],
  },
  Buzău: {
    Buzău: ["Buzău"],
    "Râmnicu Sărat": ["Râmnicu Sărat"],
    Nehoiu: ["Nehoiu"],
  },
  "Caraș-Severin": {
    Reșița: ["Reșița"],
    Caransebeș: ["Caransebeș"],
    Oravița: ["Oravița"],
  },
  Călărași: {
    Călărași: ["Călărași"],
    Oltenița: ["Oltenița"],
  },
  Cluj: {
    "Cluj-Napoca": ["Cluj-Napoca", "Apahida", "Baciu", "Florești"],
    Dej: ["Dej"],
    Turda: ["Turda"],
    Gherla: ["Gherla"],
    Huedin: ["Huedin"],
  },
  Constanța: {
    Constanța: ["Constanța", "Mamaia"],
    Mangalia: ["Mangalia", "Neptun", "Olimp", "Vama Veche"],
    Năvodari: ["Năvodari", "Mamaia-Sat"],
  },
  Covasna: {
    "Sfântu Gheorghe": ["Sfântu Gheorghe"],
    "Târgu Secuiesc": ["Târgu Secuiesc"],
  },
  Dâmbovița: {
    Târgoviște: ["Târgoviște"],
    Moreni: ["Moreni"],
    Pucioasa: ["Pucioasa"],
  },
  Dolj: {
    Craiova: ["Craiova"],
    Băilești: ["Băilești"],
    Calafat: ["Calafat"],
  },
  Galați: {
    Galați: ["Galați"],
    Tecuci: ["Tecuci"],
  },
  Giurgiu: {
    Giurgiu: ["Giurgiu"],
  },
  Gorj: {
    "Târgu Jiu": ["Târgu Jiu"],
    Motru: ["Motru"],
  },
  Harghita: {
    "Miercurea Ciuc": ["Miercurea Ciuc"],
    "Odorheiu Secuiesc": ["Odorheiu Secuiesc"],
  },
  Hunedoara: {
    Deva: ["Deva"],
    Hunedoara: ["Hunedoara"],
    Petroșani: ["Petroșani"],
  },
  Ialomița: {
    Slobozia: ["Slobozia"],
    Urziceni: ["Urziceni"],
  },
  Iași: {
    Iași: ["Iași"],
    Pașcani: ["Pașcani"],
  },
  Ilfov: {
    Buftea: ["Buftea"],
    Otopeni: ["Otopeni"],
    Voluntari: ["Voluntari", "Pipera"],
    Bragadiru: ["Bragadiru"],
    Chiajna: ["Chiajna", "Roșu", "Dudu"],
    "Comuna Snagov": ["Snagov", "Ghermănești"],
  },
  Maramureș: {
    "Baia Mare": ["Baia Mare"],
    "Sighetu Marmației": ["Sighetu Marmației"],
  },
  Mehedinți: {
    "Drobeta-Turnu Severin": ["Drobeta-Turnu Severin"],
  },
  Mureș: {
    "Târgu Mureș": ["Târgu Mureș"],
    Sighișoara: ["Sighișoara"],
    Reghin: ["Reghin"],
  },
  Neamț: {
    "Piatra Neamț": ["Piatra Neamț"],
    Roman: ["Roman"],
  },
  Olt: {
    Slatina: ["Slatina"],
    Caracal: ["Caracal"],
  },
  Prahova: {
    Ploiești: ["Ploiești"],
    Câmpina: ["Câmpina"],
    Sinaia: ["Sinaia"],
  },
  "Satu Mare": {
    "Satu Mare": ["Satu Mare"],
    Carei: ["Carei"],
  },
  Sălaj: {
    Zalău: ["Zalău"],
  },
  Sibiu: {
    Sibiu: ["Sibiu"],
    Mediaș: ["Mediaș"],
  },
  Suceava: {
    Suceava: ["Suceava"],
    "Vatra Dornei": ["Vatra Dornei"],
    Rădăuți: ["Rădăuți"],
  },
  Teleorman: {
    Alexandria: ["Alexandria"],
  },
  Timiș: {
    Timișoara: ["Timișoara"],
    Lugoj: ["Lugoj"],
  },
  Tulcea: {
    Tulcea: ["Tulcea"],
  },
  Vaslui: {
    Vaslui: ["Vaslui"],
    Bârlad: ["Bârlad"],
    Huși: ["Huși"],
  },
  Vâlcea: {
    "Râmnicu Vâlcea": ["Râmnicu Vâlcea"],
    Drăgășani: ["Drăgășani"],
  },
  Vrancea: {
    Focșani: ["Focșani"],
    Adjud: ["Adjud"],
  },
};
