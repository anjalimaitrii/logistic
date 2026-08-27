// Shared African location data used across all forms.
//
// Countries and provinces are administrative; the city lists are not. They are
// the places a truck is actually dispatched to, so they carry border posts, mine
// townships and farm blocks that no general gazetteer lists — the two datasets
// checked file Kalumbila as a hill and Lumwana as a stream, and neither has
// Kasumbalesa at all.
//
// Still not exhaustive, and it never will be: a new crossing or mine has to be
// bookable the day it opens. Anything missing is added from the booking form and
// stored in the Location collection, which is read alongside this file.

export const AFRICAN_COUNTRIES = [
  "Zambia", "Zimbabwe", "DRC (Congo)", "Malawi", "Tanzania", "Mozambique", "Botswana",
  "Namibia", "South Africa", "Angola",
];

export const AFRICAN_STATES: Record<string, string[]> = {
  "Zambia": [
    "Central Province", "Copperbelt Province", "Eastern Province", "Luapula Province",
    "Lusaka Province", "Muchinga Province", "Northern Province", "North-Western Province",
    "Southern Province", "Western Province",
  ],
  "Zimbabwe": [
    "Harare Metropolitan", "Bulawayo Metropolitan", "Manicaland", "Mashonaland Central",
    "Mashonaland East", "Mashonaland West", "Masvingo", "Matabeleland North",
    "Matabeleland South", "Midlands",
  ],
  "DRC (Congo)": [
    "Haut-Katanga", "Lualaba", "Haut-Lomami", "Tanganyika",
  ],
  "Malawi": [
    "Northern Region", "Central Region", "Southern Region",
  ],
  "Tanzania": [
    "Dar es Salaam Region", "Mbeya Region", "Katavi", "Rukwa", "Dodoma Region",
    "Arusha Region",
  ],
  "Mozambique": [
    "Maputo Province", "Sofala", "Tete Province", "Zambezia", "Nampula",
  ],
  "Botswana": [
    "South-East", "North-East", "Central", "Kgatleng", "North-West District",
  ],
  "Namibia": [
    "Khomas", "Erongo", "Kavango East", "Zambezi",
  ],
  "South Africa": [
    "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Western Cape",
  ],
  "Angola": [
    "Luanda Province", "Huíla", "Huambo Province", "Cuando Cubango",
  ],
};

export const AFRICAN_CITIES: Record<string, string[]> = {
  "Zambia": [
    // Central Province
    "Kabwe", "Kapiri Mposhi", "Mkushi", "Mumbwa", "Serenje", "Chisamba", "Chibombo",
    "Nampundwe", "Shibuyunji", "Chitambo", "Luano", "Ngabwe",
    // Copperbelt Province
    "Ndola", "Kitwe", "Chingola", "Mufulira", "Luanshya", "Chililabombwe", "Kalulushi",
    "Kasumbalesa", "Chambishi", "Mokambo", "Mpongwe", "Lufwanyama", "Masaiti",
    // Eastern Province
    "Chipata", "Petauke", "Lundazi", "Katete", "Chadiza", "Mwami Border Post",
    "Chanida Border Post", "Nyimba", "Sinda", "Vubwi", "Mfuwe", "Chipangali", "Kasenengwa",
    "Lumezi", "Chasefu", "Lusangazi", "Kacholola", "Chama",
    // Luapula Province
    "Mansa", "Kawambwa", "Nchelenge", "Samfya", "Chembe", "Chiengi", "Kashikishi", "Mwense",
    "Mwansabombwe", "Chipili", "Milenge", "Lunga", "Mununga", "Mbereshi",
    // Lusaka Province
    "Lusaka", "Kafue", "Chongwe", "Chilanga", "Luangwa", "Rufunsa",
    // Muchinga Province
    "Chinsali", "Isoka", "Mpika", "Nakonde", "Mafinga", "Shiwang'andu", "Kanchibiya",
    "Lavushimanda",
    // Northern Province
    "Kasama", "Mbala", "Mpulungu", "Luwingu", "Kasesya", "Kaputa", "Mporokoso", "Mungwi",
    "Senga Hill", "Lunte", "Nsama", "Chilubi", "Nsumbu",
    // North-Western Province
    "Solwezi", "Mwinilunga", "Kasempa", "Kabompo", "Chavuma", "Kalumbila", "Lumwana", "Jimbe",
    "Kambimba", "Mufumbwe", "Zambezi", "Ikelenge", "Manyinga", "Kalengwa",
    // Southern Province
    "Livingstone", "Mazabuka", "Choma", "Monze", "Kalomo", "Siavonga", "Chirundu",
    "Itezhi-Tezhi", "Kazungula", "Maamba", "Sinazongwe", "Zimba", "Pemba", "Namwala",
    "Chikankata", "Gwembe", "Batoka", "Chisekesi", "Magoye", "Mapatizya",
    // Western Province
    "Mongu", "Kaoma", "Senanga", "Sesheke", "Lukulu", "Sikongo", "Sinjembela", "Kalabo",
    "Shangombo", "Sioma", "Mwandi", "Mulobezi", "Luampa", "Nkeyema", "Limulunga", "Nalolo",
    "Mitete", "Nangweshi",
  ],
  "Zimbabwe": [
    // Harare Metropolitan
    "Harare",
    // Bulawayo Metropolitan
    "Bulawayo",
    // Manicaland
    "Mutare",
    // Mashonaland Central
    "Bindura", "Mvurwi",
    // Mashonaland East
    "Nyamapanda", "Marondera",
    // Mashonaland West
    "Chinhoyi",
    // Masvingo
    "Masvingo",
    // Matabeleland North
    "Victoria Falls", "Hwange",
    // Matabeleland South
    "Beitbridge", "Plumtree", "Gwanda",
    // Midlands
    "Gweru",
  ],
  "DRC (Congo)": [
    // Haut-Katanga
    "Lubumbashi", "Likasi", "Kipushi",
    // Lualaba
    "Kolwezi",
    // Haut-Lomami
    "Kamina", "Bukama",
    // Tanganyika
    "Kalemie", "Manono",
  ],
  "Malawi": [
    // Northern Region
    "Mzuzu",
    // Central Region
    "Lilongwe",
    // Southern Region
    "Blantyre", "Zomba",
  ],
  "Tanzania": [
    // Dar es Salaam Region
    "Dar es Salaam",
    // Mbeya Region
    "Mbeya", "Tunduma",
    // Katavi
    "Mpanda", "Karema",
    // Rukwa
    "Sumbawanga", "Kasesya",
    // Dodoma Region
    "Dodoma",
    // Arusha Region
    "Arusha",
  ],
  "Mozambique": [
    // Maputo Province
    "Maputo",
    // Sofala
    "Beira",
    // Tete Province
    "Tete",
    // Zambezia
    "Quelimane",
    // Nampula
    "Nacala",
  ],
  "Botswana": [
    // South-East
    "Gaborone",
    // North-East
    "Francistown",
    // Central
    "Serowe", "Palapye", "Martin's Drift",
    // Kgatleng
    "Mochudi", "Pilane",
    // North-West District
    "Maun",
  ],
  "Namibia": [
    // Khomas
    "Windhoek",
    // Erongo
    "Walvis Bay",
    // Kavango East
    "Rundu",
    // Zambezi
    "Katima Mulilo", "Ngoma",
  ],
  "South Africa": [
    // Gauteng
    "Johannesburg", "Pretoria",
    // KwaZulu-Natal
    "Durban",
    // Limpopo
    "Musina",
    // Mpumalanga
    "eMalahleni (Witbank)", "Komatipoort",
    // Western Cape
    "Cape Town",
  ],
  "Angola": [
    // Luanda Province
    "Luanda",
    // Huíla
    "Lubango",
    // Huambo Province
    "Huambo",
    // Cuando Cubango
    "Menongue", "Calai",
  ],
};

// Flat list of all cities (for search/simple dropdowns)
export const ALL_AFRICAN_CITIES = Object.values(AFRICAN_CITIES).flat();

// city → province lookup, per country. Every city above has an entry here, so
// picking one fills its province in.
export const CITY_TO_STATE: Record<string, Record<string, string>> = {
  "Zambia": {
    "Kabwe": "Central Province", "Kapiri Mposhi": "Central Province",
    "Mkushi": "Central Province", "Mumbwa": "Central Province", "Serenje": "Central Province",
    "Chisamba": "Central Province", "Chibombo": "Central Province",
    "Nampundwe": "Central Province", "Shibuyunji": "Central Province",
    "Chitambo": "Central Province", "Luano": "Central Province", "Ngabwe": "Central Province",
    "Ndola": "Copperbelt Province", "Kitwe": "Copperbelt Province",
    "Chingola": "Copperbelt Province", "Mufulira": "Copperbelt Province",
    "Luanshya": "Copperbelt Province", "Chililabombwe": "Copperbelt Province",
    "Kalulushi": "Copperbelt Province", "Kasumbalesa": "Copperbelt Province",
    "Chambishi": "Copperbelt Province", "Mokambo": "Copperbelt Province",
    "Mpongwe": "Copperbelt Province", "Lufwanyama": "Copperbelt Province",
    "Masaiti": "Copperbelt Province",
    "Chipata": "Eastern Province", "Petauke": "Eastern Province",
    "Lundazi": "Eastern Province", "Katete": "Eastern Province", "Chadiza": "Eastern Province",
    "Mwami Border Post": "Eastern Province", "Chanida Border Post": "Eastern Province",
    "Nyimba": "Eastern Province", "Sinda": "Eastern Province", "Vubwi": "Eastern Province",
    "Mfuwe": "Eastern Province", "Chipangali": "Eastern Province",
    "Kasenengwa": "Eastern Province", "Lumezi": "Eastern Province",
    "Chasefu": "Eastern Province", "Lusangazi": "Eastern Province",
    "Kacholola": "Eastern Province", "Chama": "Eastern Province",
    "Mansa": "Luapula Province", "Kawambwa": "Luapula Province",
    "Nchelenge": "Luapula Province", "Samfya": "Luapula Province",
    "Chembe": "Luapula Province", "Chiengi": "Luapula Province",
    "Kashikishi": "Luapula Province", "Mwense": "Luapula Province",
    "Mwansabombwe": "Luapula Province", "Chipili": "Luapula Province",
    "Milenge": "Luapula Province", "Lunga": "Luapula Province", "Mununga": "Luapula Province",
    "Mbereshi": "Luapula Province",
    "Lusaka": "Lusaka Province", "Kafue": "Lusaka Province", "Chongwe": "Lusaka Province",
    "Chilanga": "Lusaka Province", "Luangwa": "Lusaka Province", "Rufunsa": "Lusaka Province",
    "Chinsali": "Muchinga Province", "Isoka": "Muchinga Province",
    "Mpika": "Muchinga Province", "Nakonde": "Muchinga Province",
    "Mafinga": "Muchinga Province", "Shiwang'andu": "Muchinga Province",
    "Kanchibiya": "Muchinga Province", "Lavushimanda": "Muchinga Province",
    "Kasama": "Northern Province", "Mbala": "Northern Province",
    "Mpulungu": "Northern Province", "Luwingu": "Northern Province",
    "Kasesya": "Northern Province", "Kaputa": "Northern Province",
    "Mporokoso": "Northern Province", "Mungwi": "Northern Province",
    "Senga Hill": "Northern Province", "Lunte": "Northern Province",
    "Nsama": "Northern Province", "Chilubi": "Northern Province",
    "Nsumbu": "Northern Province",
    "Solwezi": "North-Western Province", "Mwinilunga": "North-Western Province",
    "Kasempa": "North-Western Province", "Kabompo": "North-Western Province",
    "Chavuma": "North-Western Province", "Kalumbila": "North-Western Province",
    "Lumwana": "North-Western Province", "Jimbe": "North-Western Province",
    "Kambimba": "North-Western Province", "Mufumbwe": "North-Western Province",
    "Zambezi": "North-Western Province", "Ikelenge": "North-Western Province",
    "Manyinga": "North-Western Province", "Kalengwa": "North-Western Province",
    "Livingstone": "Southern Province", "Mazabuka": "Southern Province",
    "Choma": "Southern Province", "Monze": "Southern Province", "Kalomo": "Southern Province",
    "Siavonga": "Southern Province", "Chirundu": "Southern Province",
    "Itezhi-Tezhi": "Southern Province", "Kazungula": "Southern Province",
    "Maamba": "Southern Province", "Sinazongwe": "Southern Province",
    "Zimba": "Southern Province", "Pemba": "Southern Province", "Namwala": "Southern Province",
    "Chikankata": "Southern Province", "Gwembe": "Southern Province",
    "Batoka": "Southern Province", "Chisekesi": "Southern Province",
    "Magoye": "Southern Province", "Mapatizya": "Southern Province",
    "Mongu": "Western Province", "Kaoma": "Western Province", "Senanga": "Western Province",
    "Sesheke": "Western Province", "Lukulu": "Western Province", "Sikongo": "Western Province",
    "Sinjembela": "Western Province", "Kalabo": "Western Province",
    "Shangombo": "Western Province", "Sioma": "Western Province", "Mwandi": "Western Province",
    "Mulobezi": "Western Province", "Luampa": "Western Province",
    "Nkeyema": "Western Province", "Limulunga": "Western Province",
    "Nalolo": "Western Province", "Mitete": "Western Province",
    "Nangweshi": "Western Province",
  },
  "Zimbabwe": {
    "Harare": "Harare Metropolitan",
    "Bulawayo": "Bulawayo Metropolitan",
    "Mutare": "Manicaland",
    "Bindura": "Mashonaland Central", "Mvurwi": "Mashonaland Central",
    "Nyamapanda": "Mashonaland East", "Marondera": "Mashonaland East",
    "Chinhoyi": "Mashonaland West",
    "Masvingo": "Masvingo",
    "Victoria Falls": "Matabeleland North", "Hwange": "Matabeleland North",
    "Beitbridge": "Matabeleland South", "Plumtree": "Matabeleland South",
    "Gwanda": "Matabeleland South",
    "Gweru": "Midlands",
  },
  "DRC (Congo)": {
    "Lubumbashi": "Haut-Katanga", "Likasi": "Haut-Katanga", "Kipushi": "Haut-Katanga",
    "Kolwezi": "Lualaba",
    "Kamina": "Haut-Lomami", "Bukama": "Haut-Lomami",
    "Kalemie": "Tanganyika", "Manono": "Tanganyika",
  },
  "Malawi": {
    "Mzuzu": "Northern Region",
    "Lilongwe": "Central Region",
    "Blantyre": "Southern Region", "Zomba": "Southern Region",
  },
  "Tanzania": {
    "Dar es Salaam": "Dar es Salaam Region",
    "Mbeya": "Mbeya Region", "Tunduma": "Mbeya Region",
    "Mpanda": "Katavi", "Karema": "Katavi",
    "Sumbawanga": "Rukwa", "Kasesya": "Rukwa",
    "Dodoma": "Dodoma Region",
    "Arusha": "Arusha Region",
  },
  "Mozambique": {
    "Maputo": "Maputo Province",
    "Beira": "Sofala",
    "Tete": "Tete Province",
    "Quelimane": "Zambezia",
    "Nacala": "Nampula",
  },
  "Botswana": {
    "Gaborone": "South-East",
    "Francistown": "North-East",
    "Serowe": "Central", "Palapye": "Central", "Martin's Drift": "Central",
    "Mochudi": "Kgatleng", "Pilane": "Kgatleng",
    "Maun": "North-West District",
  },
  "Namibia": {
    "Windhoek": "Khomas",
    "Walvis Bay": "Erongo",
    "Rundu": "Kavango East",
    "Katima Mulilo": "Zambezi", "Ngoma": "Zambezi",
  },
  "South Africa": {
    "Johannesburg": "Gauteng", "Pretoria": "Gauteng",
    "Durban": "KwaZulu-Natal",
    "Musina": "Limpopo",
    "eMalahleni (Witbank)": "Mpumalanga", "Komatipoort": "Mpumalanga",
    "Cape Town": "Western Cape",
  },
  "Angola": {
    "Luanda": "Luanda Province",
    "Lubango": "Huíla",
    "Huambo": "Huambo Province",
    "Menongue": "Cuando Cubango", "Calai": "Cuando Cubango",
  },
};
