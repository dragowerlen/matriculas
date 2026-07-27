/**
 * ============================================================
 * telefone-utils.js
 * ------------------------------------------------------------
 * Versão para o NAVEGADOR (JavaScript puro) das mesmas funções
 * que existiam em Telefones.gs e Paises.gs no Apps Script.
 * Mantém o MESMO comportamento: normaliza telefone, adiciona o
 * 9º dígito em celulares brasileiros, gera o link do WhatsApp,
 * e calcula FUSO / PAÍS / REGIÃO a partir do número.
 * ============================================================
 */

const TEL_CONFIG = {
  DDI_BRASIL: "55",
  FUSO_REFERENCIA_TZ: "America/Sao_Paulo"
};

const PAISES = {
  "55": { pais: "Brasil", regiao: "América do Sul", tz: "America/Sao_Paulo" },
  "1": { pais: "EUA/Canadá", regiao: "América do Norte", tz: "America/New_York", tamanhoDDD: 3 },
  "52": { pais: "México", regiao: "América do Norte", tz: "America/Mexico_City" },
  "54": { pais: "Argentina", regiao: "América do Sul", tz: "America/Argentina/Buenos_Aires" },
  "56": { pais: "Chile", regiao: "América do Sul", tz: "America/Santiago" },
  "57": { pais: "Colômbia", regiao: "América do Sul", tz: "America/Bogota" },
  "51": { pais: "Peru", regiao: "América do Sul", tz: "America/Lima" },
  "58": { pais: "Venezuela", regiao: "América do Sul", tz: "America/Caracas" },
  "591": { pais: "Bolívia", regiao: "América do Sul", tz: "America/La_Paz" },
  "593": { pais: "Equador", regiao: "América do Sul", tz: "America/Guayaquil" },
  "595": { pais: "Paraguai", regiao: "América do Sul", tz: "America/Asuncion" },
  "598": { pais: "Uruguai", regiao: "América do Sul", tz: "America/Montevideo" },
  "351": { pais: "Portugal", regiao: "Europa", tz: "Europe/Lisbon" },
  "353": { pais: "Irlanda", regiao: "Europa", tz: "Europe/Dublin" },
  "44": { pais: "Reino Unido", regiao: "Europa", tz: "Europe/London" },
  "34": { pais: "Espanha", regiao: "Europa", tz: "Europe/Madrid" },
  "33": { pais: "França", regiao: "Europa", tz: "Europe/Paris" },
  "39": { pais: "Itália", regiao: "Europa", tz: "Europe/Rome" },
  "41": { pais: "Suíça", regiao: "Europa", tz: "Europe/Zurich" },
  "49": { pais: "Alemanha", regiao: "Europa", tz: "Europe/Berlin" },
  "31": { pais: "Holanda", regiao: "Europa", tz: "Europe/Amsterdam", tamanhoDDD: 1 },
  "32": { pais: "Bélgica", regiao: "Europa", tz: "Europe/Brussels" },
  "352": { pais: "Luxemburgo", regiao: "Europa", tz: "Europe/Luxembourg" },
  "43": { pais: "Áustria", regiao: "Europa", tz: "Europe/Vienna" },
  "45": { pais: "Dinamarca", regiao: "Europa", tz: "Europe/Copenhagen" },
  "46": { pais: "Suécia", regiao: "Europa", tz: "Europe/Stockholm" },
  "47": { pais: "Noruega", regiao: "Europa", tz: "Europe/Oslo" },
  "48": { pais: "Polônia", regiao: "Europa", tz: "Europe/Warsaw" },
  "358": { pais: "Finlândia", regiao: "Europa", tz: "Europe/Helsinki" },
  "244": { pais: "Angola", regiao: "África", tz: "Africa/Luanda" },
  "258": { pais: "Moçambique", regiao: "África", tz: "Africa/Maputo" },
  "238": { pais: "Cabo Verde", regiao: "África", tz: "Atlantic/Cape_Verde" },
  "245": { pais: "Guiné-Bissau", regiao: "África", tz: "Africa/Bissau" },
  "239": { pais: "São Tomé e Príncipe", regiao: "África", tz: "Africa/Sao_Tome" },
  "27": { pais: "África do Sul", regiao: "África", tz: "Africa/Johannesburg" },
  "81": { pais: "Japão", regiao: "Ásia", tz: "Asia/Tokyo" },
  "82": { pais: "Coreia do Sul", regiao: "Ásia", tz: "Asia/Seoul" },
  "86": { pais: "China", regiao: "Ásia", tz: "Asia/Shanghai" },
  "670": { pais: "Timor-Leste", regiao: "Ásia", tz: "Asia/Dili" },
  "61": { pais: "Austrália", regiao: "Oceania", tz: "Australia/Sydney" },
  "64": { pais: "Nova Zelândia", regiao: "Oceania", tz: "Pacific/Auckland" },
  "971": { pais: "Emirados Árabes Unidos", regiao: "Oriente Médio", tz: "Asia/Dubai" },
  "972": { pais: "Israel", regiao: "Oriente Médio", tz: "Asia/Jerusalem" },
  "966": { pais: "Arábia Saudita", regiao: "Oriente Médio", tz: "Asia/Riyadh" },
  "974": { pais: "Catar", regiao: "Oriente Médio", tz: "Asia/Qatar" },
  "965": { pais: "Kuwait", regiao: "Oriente Médio", tz: "Asia/Kuwait" },
  "961": { pais: "Líbano", regiao: "Oriente Médio", tz: "Asia/Beirut" },
  "507": { pais: "Panamá", regiao: "América Central", tz: "America/Panama" },
  "506": { pais: "Costa Rica", regiao: "América Central", tz: "America/Costa_Rica" },
  "53": { pais: "Cuba", regiao: "América Central", tz: "America/Havana" },
  "594": { pais: "Guiana Francesa", regiao: "América do Sul", tz: "America/Cayenne" },
  "592": { pais: "Guiana", regiao: "América do Sul", tz: "America/Guyana" },
  "597": { pais: "Suriname", regiao: "América do Sul", tz: "America/Paramaribo" },
  "420": { pais: "República Checa", regiao: "Europa", tz: "Europe/Prague" },
  "36": { pais: "Hungria", regiao: "Europa", tz: "Europe/Budapest" },
  "40": { pais: "Romênia", regiao: "Europa", tz: "Europe/Bucharest" },
  "30": { pais: "Grécia", regiao: "Europa", tz: "Europe/Athens" },
  "357": { pais: "Chipre", regiao: "Europa", tz: "Asia/Nicosia" },
  "356": { pais: "Malta", regiao: "Europa", tz: "Europe/Malta" },
  "354": { pais: "Islândia", regiao: "Europa", tz: "Atlantic/Reykjavik" },
  "7": { pais: "Rússia", regiao: "Europa", tz: "Europe/Moscow" },
  "90": { pais: "Turquia", regiao: "Europa/Ásia", tz: "Europe/Istanbul" },
  "212": { pais: "Marrocos", regiao: "África", tz: "Africa/Casablanca" },
  "20": { pais: "Egito", regiao: "África", tz: "Africa/Cairo" },

  // --- Ásia ---
  "91": { pais: "Índia", regiao: "Ásia", tz: "Asia/Kolkata" },
  "92": { pais: "Paquistão", regiao: "Ásia", tz: "Asia/Karachi" },
  "880": { pais: "Bangladesh", regiao: "Ásia", tz: "Asia/Dhaka" },
  "94": { pais: "Sri Lanka", regiao: "Ásia", tz: "Asia/Colombo" },
  "977": { pais: "Nepal", regiao: "Ásia", tz: "Asia/Kathmandu" },
  "63": { pais: "Filipinas", regiao: "Ásia", tz: "Asia/Manila" },
  "62": { pais: "Indonésia", regiao: "Ásia", tz: "Asia/Jakarta" },
  "60": { pais: "Malásia", regiao: "Ásia", tz: "Asia/Kuala_Lumpur" },
  "65": { pais: "Singapura", regiao: "Ásia", tz: "Asia/Singapore" },
  "66": { pais: "Tailândia", regiao: "Ásia", tz: "Asia/Bangkok" },
  "84": { pais: "Vietnã", regiao: "Ásia", tz: "Asia/Ho_Chi_Minh" },
  "886": { pais: "Taiwan", regiao: "Ásia", tz: "Asia/Taipei" },
  "852": { pais: "Hong Kong", regiao: "Ásia", tz: "Asia/Hong_Kong" },
  "853": { pais: "Macau", regiao: "Ásia", tz: "Asia/Macau" },

  // --- África ---
  "234": { pais: "Nigéria", regiao: "África", tz: "Africa/Lagos" },
  "254": { pais: "Quênia", regiao: "África", tz: "Africa/Nairobi" },
  "233": { pais: "Gana", regiao: "África", tz: "Africa/Accra" },
  "225": { pais: "Costa do Marfim", regiao: "África", tz: "Africa/Abidjan" },
  "221": { pais: "Senegal", regiao: "África", tz: "Africa/Dakar" },
  "216": { pais: "Tunísia", regiao: "África", tz: "Africa/Tunis" },
  "213": { pais: "Argélia", regiao: "África", tz: "Africa/Algiers" },
  "218": { pais: "Líbia", regiao: "África", tz: "Africa/Tripoli" },
  "251": { pais: "Etiópia", regiao: "África", tz: "Africa/Addis_Ababa" },

  // --- Europa (Leste/adicionais) ---
  "385": { pais: "Croácia", regiao: "Europa", tz: "Europe/Zagreb" },
  "386": { pais: "Eslovênia", regiao: "Europa", tz: "Europe/Ljubljana" },
  "421": { pais: "Eslováquia", regiao: "Europa", tz: "Europe/Bratislava" },
  "381": { pais: "Sérvia", regiao: "Europa", tz: "Europe/Belgrade" },
  "387": { pais: "Bósnia e Herzegovina", regiao: "Europa", tz: "Europe/Sarajevo" },
  "359": { pais: "Bulgária", regiao: "Europa", tz: "Europe/Sofia" },
  "380": { pais: "Ucrânia", regiao: "Europa", tz: "Europe/Kyiv" },
  "375": { pais: "Belarus", regiao: "Europa", tz: "Europe/Minsk" },
  "370": { pais: "Lituânia", regiao: "Europa", tz: "Europe/Vilnius" },
  "371": { pais: "Letônia", regiao: "Europa", tz: "Europe/Riga" },
  "372": { pais: "Estônia", regiao: "Europa", tz: "Europe/Tallinn" },

  // --- Oriente Médio (adicionais) ---
  "962": { pais: "Jordânia", regiao: "Oriente Médio", tz: "Asia/Amman" },
  "964": { pais: "Iraque", regiao: "Oriente Médio", tz: "Asia/Baghdad" },
  "98": { pais: "Irã", regiao: "Oriente Médio", tz: "Asia/Tehran" },
  "963": { pais: "Síria", regiao: "Oriente Médio", tz: "Asia/Damascus" },
  "973": { pais: "Bahrein", regiao: "Oriente Médio", tz: "Asia/Bahrain" },
  "968": { pais: "Omã", regiao: "Oriente Médio", tz: "Asia/Muscat" },

  // --- América Central/Caribe (fora do padrão NANP +1) ---
  "502": { pais: "Guatemala", regiao: "América Central", tz: "America/Guatemala" },
  "504": { pais: "Honduras", regiao: "América Central", tz: "America/Tegucigalpa" },
  "503": { pais: "El Salvador", regiao: "América Central", tz: "America/El_Salvador" },
  "505": { pais: "Nicarágua", regiao: "América Central", tz: "America/Managua" },
  "501": { pais: "Belize", regiao: "América Central", tz: "America/Belize" },
  "509": { pais: "Haiti", regiao: "América Central", tz: "America/Port-au-Prince" }
};

const DDD_BRASIL = {
  "11": { estado: "SP", cidade: "São Paulo", tz: "America/Sao_Paulo" }, "12": { estado: "SP", cidade: "São José dos Campos", tz: "America/Sao_Paulo" },
  "13": { estado: "SP", cidade: "Santos", tz: "America/Sao_Paulo" }, "14": { estado: "SP", cidade: "Bauru", tz: "America/Sao_Paulo" },
  "15": { estado: "SP", cidade: "Sorocaba", tz: "America/Sao_Paulo" }, "16": { estado: "SP", cidade: "Ribeirão Preto", tz: "America/Sao_Paulo" },
  "17": { estado: "SP", cidade: "São José do Rio Preto", tz: "America/Sao_Paulo" }, "18": { estado: "SP", cidade: "Presidente Prudente", tz: "America/Sao_Paulo" },
  "19": { estado: "SP", cidade: "Campinas", tz: "America/Sao_Paulo" }, "21": { estado: "RJ", cidade: "Rio de Janeiro", tz: "America/Sao_Paulo" },
  "22": { estado: "RJ", cidade: "Campos dos Goytacazes", tz: "America/Sao_Paulo" }, "24": { estado: "RJ", cidade: "Volta Redonda", tz: "America/Sao_Paulo" },
  "27": { estado: "ES", cidade: "Vitória", tz: "America/Sao_Paulo" }, "28": { estado: "ES", cidade: "Cachoeiro de Itapemirim", tz: "America/Sao_Paulo" },
  "31": { estado: "MG", cidade: "Belo Horizonte", tz: "America/Sao_Paulo" }, "32": { estado: "MG", cidade: "Juiz de Fora", tz: "America/Sao_Paulo" },
  "33": { estado: "MG", cidade: "Governador Valadares", tz: "America/Sao_Paulo" }, "34": { estado: "MG", cidade: "Uberlândia", tz: "America/Sao_Paulo" },
  "35": { estado: "MG", cidade: "Poços de Caldas", tz: "America/Sao_Paulo" }, "37": { estado: "MG", cidade: "Divinópolis", tz: "America/Sao_Paulo" },
  "38": { estado: "MG", cidade: "Montes Claros", tz: "America/Sao_Paulo" }, "41": { estado: "PR", cidade: "Curitiba", tz: "America/Sao_Paulo" },
  "42": { estado: "PR", cidade: "Ponta Grossa", tz: "America/Sao_Paulo" }, "43": { estado: "PR", cidade: "Londrina", tz: "America/Sao_Paulo" },
  "44": { estado: "PR", cidade: "Maringá", tz: "America/Sao_Paulo" }, "45": { estado: "PR", cidade: "Cascavel", tz: "America/Sao_Paulo" },
  "46": { estado: "PR", cidade: "Pato Branco", tz: "America/Sao_Paulo" }, "47": { estado: "SC", cidade: "Joinville", tz: "America/Sao_Paulo" },
  "48": { estado: "SC", cidade: "Florianópolis", tz: "America/Sao_Paulo" }, "49": { estado: "SC", cidade: "Chapecó", tz: "America/Sao_Paulo" },
  "51": { estado: "RS", cidade: "Porto Alegre", tz: "America/Sao_Paulo" }, "53": { estado: "RS", cidade: "Pelotas", tz: "America/Sao_Paulo" },
  "54": { estado: "RS", cidade: "Caxias do Sul", tz: "America/Sao_Paulo" }, "55": { estado: "RS", cidade: "Santa Maria", tz: "America/Sao_Paulo" },
  "61": { estado: "DF", cidade: "Brasília", tz: "America/Sao_Paulo" }, "62": { estado: "GO", cidade: "Goiânia", tz: "America/Sao_Paulo" },
  "64": { estado: "GO", cidade: "Rio Verde", tz: "America/Sao_Paulo" }, "63": { estado: "TO", cidade: "Palmas", tz: "America/Sao_Paulo" },
  "65": { estado: "MT", cidade: "Cuiabá", tz: "America/Cuiaba" }, "66": { estado: "MT", cidade: "Rondonópolis", tz: "America/Cuiaba" },
  "67": { estado: "MS", cidade: "Campo Grande", tz: "America/Campo_Grande" }, "68": { estado: "AC", cidade: "Rio Branco", tz: "America/Rio_Branco" },
  "69": { estado: "RO", cidade: "Porto Velho", tz: "America/Porto_Velho" }, "71": { estado: "BA", cidade: "Salvador", tz: "America/Sao_Paulo" },
  "73": { estado: "BA", cidade: "Ilhéus", tz: "America/Sao_Paulo" }, "74": { estado: "BA", cidade: "Juazeiro", tz: "America/Sao_Paulo" },
  "75": { estado: "BA", cidade: "Feira de Santana", tz: "America/Sao_Paulo" }, "77": { estado: "BA", cidade: "Barreiras", tz: "America/Sao_Paulo" },
  "79": { estado: "SE", cidade: "Aracaju", tz: "America/Sao_Paulo" }, "81": { estado: "PE", cidade: "Recife", tz: "America/Sao_Paulo" },
  "87": { estado: "PE", cidade: "Petrolina", tz: "America/Sao_Paulo" }, "82": { estado: "AL", cidade: "Maceió", tz: "America/Sao_Paulo" },
  "83": { estado: "PB", cidade: "João Pessoa", tz: "America/Sao_Paulo" }, "84": { estado: "RN", cidade: "Natal", tz: "America/Sao_Paulo" },
  "85": { estado: "CE", cidade: "Fortaleza", tz: "America/Sao_Paulo" }, "88": { estado: "CE", cidade: "Juazeiro do Norte", tz: "America/Sao_Paulo" },
  "86": { estado: "PI", cidade: "Teresina", tz: "America/Sao_Paulo" }, "89": { estado: "PI", cidade: "Picos", tz: "America/Sao_Paulo" },
  "91": { estado: "PA", cidade: "Belém", tz: "America/Sao_Paulo" }, "93": { estado: "PA", cidade: "Santarém", tz: "America/Sao_Paulo" },
  "94": { estado: "PA", cidade: "Marabá", tz: "America/Sao_Paulo" }, "92": { estado: "AM", cidade: "Manaus", tz: "America/Manaus" },
  "97": { estado: "AM", cidade: "Coari", tz: "America/Manaus" }, "95": { estado: "RR", cidade: "Boa Vista", tz: "America/Boa_Vista" },
  "96": { estado: "AP", cidade: "Macapá", tz: "America/Sao_Paulo" }, "98": { estado: "MA", cidade: "São Luís", tz: "America/Sao_Paulo" },
  "99": { estado: "MA", cidade: "Imperatriz", tz: "America/Sao_Paulo" }
};

// Tabela de EUA/Canadá (NANP) — igual à do Apps Script, resumida aqui.
const NANP_DDD = {
  "339":{pais:"EUA",estado:"Massachusetts",cidade:"Boston (região)",tz:"America/New_York"},"351":{pais:"EUA",estado:"Massachusetts",cidade:"Lowell",tz:"America/New_York"},
  "413":{pais:"EUA",estado:"Massachusetts",cidade:"Springfield",tz:"America/New_York"},"508":{pais:"EUA",estado:"Massachusetts",cidade:"Framingham",tz:"America/New_York"},
  "617":{pais:"EUA",estado:"Massachusetts",cidade:"Boston",tz:"America/New_York"},"774":{pais:"EUA",estado:"Massachusetts",cidade:"Framingham",tz:"America/New_York"},
  "781":{pais:"EUA",estado:"Massachusetts",cidade:"Boston (região)",tz:"America/New_York"},"857":{pais:"EUA",estado:"Massachusetts",cidade:"Boston",tz:"America/New_York"},
  "978":{pais:"EUA",estado:"Massachusetts",cidade:"Lowell",tz:"America/New_York"},"239":{pais:"EUA",estado:"Flórida",cidade:"Fort Myers",tz:"America/New_York"},
  "305":{pais:"EUA",estado:"Flórida",cidade:"Miami",tz:"America/New_York"},"321":{pais:"EUA",estado:"Flórida",cidade:"Orlando",tz:"America/New_York"},
  "352":{pais:"EUA",estado:"Flórida",cidade:"Gainesville",tz:"America/New_York"},"386":{pais:"EUA",estado:"Flórida",cidade:"Daytona Beach",tz:"America/New_York"},
  "407":{pais:"EUA",estado:"Flórida",cidade:"Orlando",tz:"America/New_York"},"689":{pais:"EUA",estado:"Flórida",cidade:"Orlando",tz:"America/New_York"},
  "561":{pais:"EUA",estado:"Flórida",cidade:"West Palm Beach",tz:"America/New_York"},"727":{pais:"EUA",estado:"Flórida",cidade:"St. Petersburg",tz:"America/New_York"},
  "754":{pais:"EUA",estado:"Flórida",cidade:"Fort Lauderdale",tz:"America/New_York"},"772":{pais:"EUA",estado:"Flórida",cidade:"Port St. Lucie",tz:"America/New_York"},
  "786":{pais:"EUA",estado:"Flórida",cidade:"Miami",tz:"America/New_York"},"813":{pais:"EUA",estado:"Flórida",cidade:"Tampa",tz:"America/New_York"},
  "850":{pais:"EUA",estado:"Flórida",cidade:"Tallahassee",tz:"America/New_York"},"863":{pais:"EUA",estado:"Flórida",cidade:"Lakeland",tz:"America/New_York"},
  "904":{pais:"EUA",estado:"Flórida",cidade:"Jacksonville",tz:"America/New_York"},"941":{pais:"EUA",estado:"Flórida",cidade:"Sarasota",tz:"America/New_York"},
  "954":{pais:"EUA",estado:"Flórida",cidade:"Fort Lauderdale",tz:"America/New_York"},"201":{pais:"EUA",estado:"Nova Jersey",cidade:"Jersey City",tz:"America/New_York"},
  "551":{pais:"EUA",estado:"Nova Jersey",cidade:"Jersey City",tz:"America/New_York"},"609":{pais:"EUA",estado:"Nova Jersey",cidade:"Trenton",tz:"America/New_York"},
  "732":{pais:"EUA",estado:"Nova Jersey",cidade:"New Brunswick",tz:"America/New_York"},"848":{pais:"EUA",estado:"Nova Jersey",cidade:"New Brunswick",tz:"America/New_York"},
  "856":{pais:"EUA",estado:"Nova Jersey",cidade:"Camden",tz:"America/New_York"},"862":{pais:"EUA",estado:"Nova Jersey",cidade:"Newark",tz:"America/New_York"},
  "908":{pais:"EUA",estado:"Nova Jersey",cidade:"Elizabeth",tz:"America/New_York"},"973":{pais:"EUA",estado:"Nova Jersey",cidade:"Newark",tz:"America/New_York"},
  "212":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},"315":{pais:"EUA",estado:"Nova York",cidade:"Syracuse",tz:"America/New_York"},
  "347":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},"516":{pais:"EUA",estado:"Nova York",cidade:"Long Island",tz:"America/New_York"},
  "518":{pais:"EUA",estado:"Nova York",cidade:"Albany",tz:"America/New_York"},"585":{pais:"EUA",estado:"Nova York",cidade:"Rochester",tz:"America/New_York"},
  "607":{pais:"EUA",estado:"Nova York",cidade:"Binghamton",tz:"America/New_York"},"631":{pais:"EUA",estado:"Nova York",cidade:"Long Island",tz:"America/New_York"},
  "646":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},"716":{pais:"EUA",estado:"Nova York",cidade:"Buffalo",tz:"America/New_York"},
  "718":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},"845":{pais:"EUA",estado:"Nova York",cidade:"Poughkeepsie",tz:"America/New_York"},
  "914":{pais:"EUA",estado:"Nova York",cidade:"Westchester",tz:"America/New_York"},"917":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},
  "929":{pais:"EUA",estado:"Nova York",cidade:"Nova York",tz:"America/New_York"},"203":{pais:"EUA",estado:"Connecticut",cidade:"New Haven",tz:"America/New_York"},
  "475":{pais:"EUA",estado:"Connecticut",cidade:"New Haven",tz:"America/New_York"},"860":{pais:"EUA",estado:"Connecticut",cidade:"Hartford",tz:"America/New_York"},
  "214":{pais:"EUA",estado:"Texas",cidade:"Dallas",tz:"America/Chicago"},"281":{pais:"EUA",estado:"Texas",cidade:"Houston",tz:"America/Chicago"},
  "409":{pais:"EUA",estado:"Texas",cidade:"Beaumont",tz:"America/Chicago"},"432":{pais:"EUA",estado:"Texas",cidade:"Midland",tz:"America/Chicago"},
  "469":{pais:"EUA",estado:"Texas",cidade:"Dallas",tz:"America/Chicago"},"512":{pais:"EUA",estado:"Texas",cidade:"Austin",tz:"America/Chicago"},
  "713":{pais:"EUA",estado:"Texas",cidade:"Houston",tz:"America/Chicago"},"832":{pais:"EUA",estado:"Texas",cidade:"Houston",tz:"America/Chicago"},
  "915":{pais:"EUA",estado:"Texas",cidade:"El Paso",tz:"America/Denver"},"936":{pais:"EUA",estado:"Texas",cidade:"Huntsville",tz:"America/Chicago"},
  "940":{pais:"EUA",estado:"Texas",cidade:"Denton",tz:"America/Chicago"},"945":{pais:"EUA",estado:"Texas",cidade:"Dallas",tz:"America/Chicago"},
  "956":{pais:"EUA",estado:"Texas",cidade:"Laredo",tz:"America/Chicago"},"972":{pais:"EUA",estado:"Texas",cidade:"Dallas",tz:"America/Chicago"},
  "979":{pais:"EUA",estado:"Texas",cidade:"College Station",tz:"America/Chicago"},"213":{pais:"EUA",estado:"Califórnia",cidade:"Los Angeles",tz:"America/Los_Angeles"},
  "310":{pais:"EUA",estado:"Califórnia",cidade:"Los Angeles",tz:"America/Los_Angeles"},"323":{pais:"EUA",estado:"Califórnia",cidade:"Los Angeles",tz:"America/Los_Angeles"},
  "408":{pais:"EUA",estado:"Califórnia",cidade:"San Jose",tz:"America/Los_Angeles"},"415":{pais:"EUA",estado:"Califórnia",cidade:"São Francisco",tz:"America/Los_Angeles"},
  "510":{pais:"EUA",estado:"Califórnia",cidade:"Oakland",tz:"America/Los_Angeles"},"619":{pais:"EUA",estado:"Califórnia",cidade:"San Diego",tz:"America/Los_Angeles"},
  "650":{pais:"EUA",estado:"Califórnia",cidade:"Palo Alto",tz:"America/Los_Angeles"},"714":{pais:"EUA",estado:"Califórnia",cidade:"Anaheim",tz:"America/Los_Angeles"},
  "818":{pais:"EUA",estado:"Califórnia",cidade:"Burbank",tz:"America/Los_Angeles"},"858":{pais:"EUA",estado:"Califórnia",cidade:"San Diego",tz:"America/Los_Angeles"},
  "916":{pais:"EUA",estado:"Califórnia",cidade:"Sacramento",tz:"America/Los_Angeles"},"925":{pais:"EUA",estado:"Califórnia",cidade:"Concord",tz:"America/Los_Angeles"},
  "949":{pais:"EUA",estado:"Califórnia",cidade:"Irvine",tz:"America/Los_Angeles"},"202":{pais:"EUA",estado:"Distrito de Columbia",cidade:"Washington",tz:"America/New_York"},
  "207":{pais:"EUA",estado:"Maine",cidade:"Portland",tz:"America/New_York"},"215":{pais:"EUA",estado:"Pensilvânia",cidade:"Filadélfia",tz:"America/New_York"},
  "225":{pais:"EUA",estado:"Luisiana",cidade:"Baton Rouge",tz:"America/Chicago"},"240":{pais:"EUA",estado:"Maryland",cidade:"Silver Spring",tz:"America/New_York"},
  "267":{pais:"EUA",estado:"Pensilvânia",cidade:"Filadélfia",tz:"America/New_York"},"412":{pais:"EUA",estado:"Pensilvânia",cidade:"Pittsburgh",tz:"America/New_York"},
  "425":{pais:"EUA",estado:"Washington",cidade:"Bellevue",tz:"America/Los_Angeles"},"484":{pais:"EUA",estado:"Pensilvânia",cidade:"Allentown",tz:"America/New_York"},
  "502":{pais:"EUA",estado:"Kentucky",cidade:"Louisville",tz:"America/New_York"},"504":{pais:"EUA",estado:"Luisiana",cidade:"Nova Orleans",tz:"America/Chicago"},
  "603":{pais:"EUA",estado:"New Hampshire",cidade:"Manchester",tz:"America/New_York"},"610":{pais:"EUA",estado:"Pensilvânia",cidade:"Allentown",tz:"America/New_York"},
  "612":{pais:"EUA",estado:"Minnesota",cidade:"Minneapolis",tz:"America/Chicago"},"656":{pais:"EUA",estado:"Flórida",cidade:"Fort Myers",tz:"America/New_York"},
  "704":{pais:"EUA",estado:"Carolina do Norte",cidade:"Charlotte",tz:"America/New_York"},"717":{pais:"EUA",estado:"Pensilvânia",cidade:"Harrisburg",tz:"America/New_York"},
  "737":{pais:"EUA",estado:"Texas",cidade:"Austin",tz:"America/Chicago"},"810":{pais:"EUA",estado:"Michigan",cidade:"Flint",tz:"America/New_York"},
  "853":{pais:"EUA",estado:"Nova Jersey",cidade:"Newark",tz:"America/New_York"},"854":{pais:"EUA",estado:"Carolina do Sul",cidade:"Charleston",tz:"America/New_York"},
  "865":{pais:"EUA",estado:"Tennessee",cidade:"Knoxville",tz:"America/New_York"},"910":{pais:"EUA",estado:"Carolina do Norte",cidade:"Fayetteville",tz:"America/New_York"},
  "913":{pais:"EUA",estado:"Kansas",cidade:"Kansas City (KS)",tz:"America/Chicago"},"928":{pais:"EUA",estado:"Arizona",cidade:"Flagstaff",tz:"America/Phoenix"},
  "980":{pais:"EUA",estado:"Carolina do Norte",cidade:"Charlotte",tz:"America/New_York"},"843":{pais:"EUA",estado:"Carolina do Sul",cidade:"Charleston",tz:"America/New_York"},
  "404":{pais:"EUA",estado:"Geórgia",cidade:"Atlanta",tz:"America/New_York"},"678":{pais:"EUA",estado:"Geórgia",cidade:"Atlanta",tz:"America/New_York"},
  "770":{pais:"EUA",estado:"Geórgia",cidade:"Atlanta",tz:"America/New_York"},"416":{pais:"Canadá",estado:"Ontário",cidade:"Toronto",tz:"America/Toronto"},
  "437":{pais:"Canadá",estado:"Ontário",cidade:"Toronto",tz:"America/Toronto"},"647":{pais:"Canadá",estado:"Ontário",cidade:"Toronto",tz:"America/Toronto"},
  "905":{pais:"Canadá",estado:"Ontário",cidade:"Toronto (região)",tz:"America/Toronto"},"613":{pais:"Canadá",estado:"Ontário",cidade:"Ottawa",tz:"America/Toronto"},
  "514":{pais:"Canadá",estado:"Quebec",cidade:"Montreal",tz:"America/Toronto"},"438":{pais:"Canadá",estado:"Quebec",cidade:"Montreal",tz:"America/Toronto"},
  "604":{pais:"Canadá",estado:"Colúmbia Britânica",cidade:"Vancouver",tz:"America/Vancouver"},"403":{pais:"Canadá",estado:"Alberta",cidade:"Calgary",tz:"America/Edmonton"},
  "780":{pais:"Canadá",estado:"Alberta",cidade:"Edmonton",tz:"America/Edmonton"},

  // Territórios e países do Caribe que também usam DDI +1 — sem essas
  // entradas, cairiam incorretamente como "EUA/Canadá" genérico.
  "787":{pais:"Porto Rico (EUA)",estado:"Porto Rico",cidade:"San Juan",tz:"America/Puerto_Rico"},
  "939":{pais:"Porto Rico (EUA)",estado:"Porto Rico",cidade:"San Juan",tz:"America/Puerto_Rico"},
  "340":{pais:"Ilhas Virgens Americanas (EUA)",estado:"Ilhas Virgens Americanas",cidade:"Charlotte Amalie",tz:"America/Puerto_Rico"},
  "671":{pais:"Guam (EUA)",estado:"Guam",cidade:"Hagåtña",tz:"Pacific/Guam"},
  "809":{pais:"República Dominicana",estado:"República Dominicana",cidade:"Santo Domingo",tz:"America/Santo_Domingo"},
  "829":{pais:"República Dominicana",estado:"República Dominicana",cidade:"Santo Domingo",tz:"America/Santo_Domingo"},
  "849":{pais:"República Dominicana",estado:"República Dominicana",cidade:"Santo Domingo",tz:"America/Santo_Domingo"},
  "876":{pais:"Jamaica",estado:"Jamaica",cidade:"Kingston",tz:"America/Jamaica"},
  "658":{pais:"Jamaica",estado:"Jamaica",cidade:"Kingston",tz:"America/Jamaica"},
  "242":{pais:"Bahamas",estado:"Bahamas",cidade:"Nassau",tz:"America/Nassau"},
  "246":{pais:"Barbados",estado:"Barbados",cidade:"Bridgetown",tz:"America/Barbados"},
  "868":{pais:"Trinidad e Tobago",estado:"Trinidad e Tobago",cidade:"Port of Spain",tz:"America/Port_of_Spain"},
  "441":{pais:"Bermudas",estado:"Bermudas",cidade:"Hamilton",tz:"Atlantic/Bermuda"},
  "345":{pais:"Ilhas Cayman",estado:"Ilhas Cayman",cidade:"George Town",tz:"America/Cayman"},
  "758":{pais:"Santa Lúcia",estado:"Santa Lúcia",cidade:"Castries",tz:"America/St_Lucia"},
  "473":{pais:"Granada",estado:"Granada",cidade:"St. George's",tz:"America/Grenada"},
  "649":{pais:"Ilhas Turks e Caicos",estado:"Ilhas Turks e Caicos",cidade:"Cockburn Town",tz:"America/Grand_Turk"},
  "284":{pais:"Ilhas Virgens Britânicas",estado:"Ilhas Virgens Britânicas",cidade:"Road Town",tz:"America/Tortola"},
  "268":{pais:"Antígua e Barbuda",estado:"Antígua e Barbuda",cidade:"St. John's",tz:"America/Antigua"},
  "869":{pais:"São Cristóvão e Nevis",estado:"São Cristóvão e Nevis",cidade:"Basseterre",tz:"America/St_Kitts"},
  "784":{pais:"São Vicente e Granadinas",estado:"São Vicente e Granadinas",cidade:"Kingstown",tz:"America/St_Vincent"},
  "767":{pais:"Dominica",estado:"Dominica",cidade:"Roseau",tz:"America/Dominica"},
  "721":{pais:"Sint Maarten",estado:"Sint Maarten",cidade:"Philipsburg",tz:"America/Lower_Princes"},
  "264":{pais:"Anguilla",estado:"Anguilla",cidade:"The Valley",tz:"America/Anguilla"},
  "664":{pais:"Montserrat",estado:"Montserrat",cidade:"Brades",tz:"America/Montserrat"}
};

function somenteNumeros(v){ return v === null || v === undefined ? "" : String(v).replace(/\D/g, ""); }

function pareceNumeroLocalBrasileiro(digitos, exigirNono){
  const ddd = digitos.substring(0, 2);
  if(!DDD_BRASIL[ddd]) return false;
  if(exigirNono && digitos.charAt(2) !== "9") return false;
  return true;
}

function normalizarTelefone(valorOriginal){
  const contemMais = String(valorOriginal).indexOf("+") !== -1;
  let digitos = somenteNumeros(valorOriginal);
  if(digitos === "") return "";

  const temPrefixo00 = !contemMais && digitos.length > 3 && digitos.startsWith("00") && digitos.charAt(2) !== "0";
  if(temPrefixo00) digitos = digitos.substring(2);

  const jaTemDDIExplicito = contemMais || temPrefixo00;

  if(!jaTemDDIExplicito){
    while(digitos.startsWith("0")) digitos = digitos.substring(1);
  }
  if(digitos === "") return "";

  let comDDI;
  if(jaTemDDIExplicito){
    comDDI = digitos;
  } else if(digitos.startsWith(TEL_CONFIG.DDI_BRASIL) && (digitos.length === 12 || digitos.length === 13)){
    comDDI = digitos;
  } else if(digitos.length === 11 && pareceNumeroLocalBrasileiro(digitos, true)){
    comDDI = TEL_CONFIG.DDI_BRASIL + digitos;
  } else if(digitos.length === 10 && pareceNumeroLocalBrasileiro(digitos, false)){
    comDDI = TEL_CONFIG.DDI_BRASIL + digitos;
  } else {
    comDDI = digitos;
  }

  comDDI = ajustarNonoDigito(comDDI);
  return "+" + comDDI;
}

function ajustarNonoDigito(numeroSemMais){
  if(numeroSemMais.startsWith(TEL_CONFIG.DDI_BRASIL) && numeroSemMais.length === 12){
    // Só adiciona o 9º dígito se for celular (prefixo local 6, 7, 8 ou 9).
    // Telefones fixos (prefixo local 2, 3, 4 ou 5) continuam com 8 dígitos —
    // adicionar o 9 neles estaria errado.
    const primeiroDigitoLocal = numeroSemMais.charAt(4);
    if(["6", "7", "8", "9"].includes(primeiroDigitoLocal)){
      numeroSemMais = numeroSemMais.substring(0,4) + "9" + numeroSemMais.substring(4);
    }
  }
  return numeroSemMais;
}

function ehTelefoneBrasil(numero){
  numero = normalizarTelefone(numero);
  return numero.startsWith("+" + TEL_CONFIG.DDI_BRASIL);
}

function obterDDD(numero){
  numero = normalizarTelefone(numero);
  if(!ehTelefoneBrasil(numero)) return "";
  const digitos = numero.substring(1);
  return digitos.substring(2,4);
}

function obterDDIInternacional(numeroOriginal){
  const numero = normalizarTelefone(numeroOriginal);
  const digitos = numero.substring(1);
  if(ehTelefoneBrasil(numero)) return TEL_CONFIG.DDI_BRASIL;
  for(let tamanho = 4; tamanho >= 1; tamanho--){
    const ddi = digitos.substring(0, tamanho);
    if(PAISES[ddi]) return ddi;
  }
  return "";
}

function formatarTelefoneBrasil(numeroOriginal){
  const numero = normalizarTelefone(numeroOriginal);
  const digitos = numero.substring(1);
  const ddi = digitos.substring(0,2);
  const ddd = digitos.substring(2,4);
  const numeroLocal = digitos.substring(4);
  // Celular tem 9 dígitos locais (5+4). Fixo tem 8 dígitos locais (4+4).
  const corte = numeroLocal.length === 9 ? 5 : 4;
  return "+" + ddi + " " + ddd + " " + numeroLocal.substring(0, corte) + "-" + numeroLocal.substring(corte);
}

function formatarTelefoneInternacional(numeroOriginal){
  const numero = normalizarTelefone(numeroOriginal);
  const digitos = numero.substring(1);
  const ddi = obterDDIInternacional(numero);
  if(ddi === "") return "+" + digitos;
  const tamanhoDDD = (PAISES[ddi] && PAISES[ddi].tamanhoDDD) || 2;
  const restante = digitos.substring(ddi.length);
  if(restante.length <= tamanhoDDD + 1) return "+" + ddi + " " + restante;
  const ddd = restante.substring(0, tamanhoDDD);
  const telefone = restante.substring(tamanhoDDD);
  if(telefone.length <= 4) return "+" + ddi + " " + ddd + " " + telefone;
  return "+" + ddi + " " + ddd + " " + telefone.substring(0, telefone.length - 4) + "-" + telefone.substring(telefone.length - 4);
}

function formatarTelefone(valor){
  const numero = normalizarTelefone(valor);
  if(numero === "") return "";
  return ehTelefoneBrasil(numero) ? formatarTelefoneBrasil(numero) : formatarTelefoneInternacional(numero);
}

function gerarLinkWhatsapp(valor){
  const numero = normalizarTelefone(valor);
  if(numero === "") return "";
  return "https://wa.me/" + numero.substring(1);
}

function telefoneComparacao(valor){
  const numero = normalizarTelefone(valor);
  return numero === "" ? "" : numero.substring(1);
}

// Calcula o offset atual (em horas, com DST já considerado) de um fuso IANA
function obterOffsetHorasAtual(timeZone){
  const agora = new Date();
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone, timeZoneName: "shortOffset"
  }).formatToParts(agora);
  const tzParte = partes.find(p => p.type === "timeZoneName");
  if(!tzParte) return 0;
  // Formato: "GMT+1", "GMT-3", "GMT+5:30"
  const m = tzParte.value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if(!m) return 0;
  const sinal = m[1] === "-" ? -1 : 1;
  const horas = parseInt(m[2], 10);
  const minutos = m[3] ? parseInt(m[3], 10) : 0;
  return sinal * (horas + minutos / 60);
}

function calcularFusoRelativo(timeZone){
  return obterOffsetHorasAtual(timeZone) - obterOffsetHorasAtual(TEL_CONFIG.FUSO_REFERENCIA_TZ);
}

function formatarFuso(offsetRelativo){
  if(offsetRelativo === 0) return "0";
  const sinal = offsetRelativo > 0 ? "+" : "-";
  const absoluto = Math.abs(offsetRelativo);
  const horas = Math.floor(absoluto);
  const minutos = Math.round((absoluto - horas) * 60);
  if(minutos === 0) return sinal + horas;
  return sinal + horas + ":" + (minutos < 10 ? "0" + minutos : minutos);
}

function obterFusoPaisRegiaoBrasil(numero){
  const ddd = obterDDD(numero);
  const info = DDD_BRASIL[ddd];
  if(!info){
    const relativo = calcularFusoRelativo("America/Sao_Paulo");
    return { fuso: formatarFuso(relativo), pais: "Brasil", regiao: "DDD " + ddd };
  }
  const relativo = calcularFusoRelativo(info.tz);
  return { fuso: formatarFuso(relativo), pais: "Brasil", regiao: info.cidade + "-" + info.estado };
}

function obterFusoPaisRegiaoEUACanada(numero){
  const digitos = numero.substring(1);
  const ddd = digitos.substring(1,4);
  const info = NANP_DDD[ddd];
  if(!info){
    const relativo = calcularFusoRelativo("America/New_York");
    return { fuso: formatarFuso(relativo), pais: "EUA/Canadá", regiao: "DDD " + ddd };
  }
  const relativo = calcularFusoRelativo(info.tz);
  return { fuso: formatarFuso(relativo), pais: info.pais, regiao: info.estado + "-" + info.cidade };
}

/**
 * Monta { fuso, pais, regiao } para qualquer número — mesma lógica
 * que existia no Apps Script (Paises.gs -> obterFusoPaisRegiao).
 */
function obterFusoPaisRegiao(numero){
  if(ehTelefoneBrasil(numero)) return obterFusoPaisRegiaoBrasil(numero);

  const numeroNormalizado = normalizarTelefone(numero);
  const ddi = obterDDIInternacional(numeroNormalizado);

  if(ddi === ""){
    return { fuso: "", pais: "NÃO IDENTIFICADO", regiao: "Verificar número" };
  }
  if(ddi === "1"){
    return obterFusoPaisRegiaoEUACanada(numeroNormalizado);
  }

  const pais = PAISES[ddi];
  if(!pais || !pais.tz){
    return { fuso: "", pais: pais ? pais.pais : "NÃO IDENTIFICADO", regiao: pais ? pais.regiao : "Verificar número" };
  }
  const relativo = calcularFusoRelativo(pais.tz);
  return { fuso: formatarFuso(relativo), pais: pais.pais, regiao: pais.regiao };
}

/**
 * Processa um telefone recém-digitado/colado: formata, calcula
 * WhatsApp, FUSO/PAÍS/REGIÃO — igual ao processarBlocoTelefones do
 * Apps Script, só que para 1 contato de cada vez.
 */
function processarTelefoneContato(telefoneOriginal){
  const telefoneFinal = formatarTelefone(telefoneOriginal);
  const fusoPaisRegiao = obterFusoPaisRegiao(telefoneFinal);
  return {
    telefone: telefoneFinal,
    link_whatsapp: gerarLinkWhatsapp(telefoneFinal),
    fuso: fusoPaisRegiao.fuso,
    pais: fusoPaisRegiao.pais,
    regiao: fusoPaisRegiao.regiao
  };
}
