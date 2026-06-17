// Shared African location data used across all forms

export const AFRICAN_COUNTRIES = [
  "Zambia", "Zimbabwe", "DRC (Congo)", "Malawi",
  "Tanzania", "Mozambique", "Botswana", "Namibia",
  "South Africa", "Angola",
];

export const AFRICAN_STATES: Record<string, string[]> = {
  "Zambia": [
    "Central Province", "Copperbelt Province", "Eastern Province",
    "Luapula Province", "Lusaka Province", "Muchinga Province",
    "Northern Province", "North-Western Province", "Southern Province", "Western Province",
  ],
  "Zimbabwe": [
    "Harare Metropolitan", "Bulawayo Metropolitan", "Manicaland",
    "Mashonaland Central", "Mashonaland East", "Mashonaland West",
    "Masvingo", "Matabeleland North", "Matabeleland South", "Midlands",
  ],
  "DRC (Congo)": ["Haut-Katanga", "Lualaba", "Haut-Lomami", "Tanganyika"],
  "Malawi": ["Northern Region", "Central Region", "Southern Region"],
  "Tanzania": ["Dar es Salaam Region", "Mbeya Region", "Katavi", "Rukwa", "Dodoma Region"],
  "Mozambique": ["Maputo Province", "Sofala", "Tete Province", "Zambezia"],
  "Botswana": ["South-East", "North-East", "Central", "Kgatleng"],
  "Namibia": ["Khomas", "Erongo", "Kavango East", "Zambezi"],
  "South Africa": ["Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Western Cape"],
  "Angola": ["Luanda Province", "Huíla", "Huambo Province", "Cuando Cubango"],
};

export const AFRICAN_CITIES: Record<string, string[]> = {
  "Zambia": [
    "Lusaka", "Kafue", "Chongwe",
    "Ndola", "Kitwe", "Chingola", "Mufulira", "Luanshya", "Chililabombwe", "Kalulushi",
    "Livingstone", "Mazabuka", "Choma", "Monze", "Kalomo", "Siavonga",
    "Kabwe", "Kapiri Mposhi", "Mkushi", "Mumbwa", "Serenje",
    "Chipata", "Petauke", "Lundazi", "Katete", "Chadiza",
    "Kasama", "Mbala", "Mpulungu", "Luwingu",
    "Mansa", "Kawambwa", "Nchelenge", "Samfya",
    "Chinsali", "Isoka", "Mpika", "Nakonde",
    "Solwezi", "Mwinilunga", "Kasempa", "Kabompo", "Chavuma",
    "Mongu", "Kaoma", "Senanga", "Sesheke", "Lukulu",
  ],
  "Zimbabwe": ["Harare", "Bulawayo", "Mutare", "Gweru", "Masvingo", "Chinhoyi"],
  "DRC (Congo)": ["Lubumbashi", "Kolwezi", "Likasi", "Kipushi"],
  "Malawi": ["Lilongwe", "Blantyre", "Mzuzu", "Zomba"],
  "Tanzania": ["Dar es Salaam", "Mbeya", "Dodoma", "Arusha", "Tunduma"],
  "Mozambique": ["Maputo", "Beira", "Tete", "Nacala"],
  "Botswana": ["Gaborone", "Francistown", "Maun"],
  "Namibia": ["Windhoek", "Walvis Bay", "Rundu"],
  "South Africa": ["Johannesburg", "Durban", "Pretoria", "Cape Town", "Musina"],
  "Angola": ["Luanda", "Lubango", "Huambo"],
};

// Flat list of all cities (for search/simple dropdowns)
export const ALL_AFRICAN_CITIES = Object.values(AFRICAN_CITIES).flat();

// city → state lookup (per country)
export const CITY_TO_STATE: Record<string, Record<string, string>> = {
  "Zambia": {
    "Lusaka": "Lusaka Province", "Kafue": "Lusaka Province", "Chongwe": "Lusaka Province",
    "Ndola": "Copperbelt Province", "Kitwe": "Copperbelt Province", "Chingola": "Copperbelt Province",
    "Mufulira": "Copperbelt Province", "Luanshya": "Copperbelt Province",
    "Chililabombwe": "Copperbelt Province", "Kalulushi": "Copperbelt Province",
    "Livingstone": "Southern Province", "Mazabuka": "Southern Province", "Choma": "Southern Province",
    "Monze": "Southern Province", "Kalomo": "Southern Province", "Siavonga": "Southern Province",
    "Kabwe": "Central Province", "Kapiri Mposhi": "Central Province", "Mkushi": "Central Province",
    "Mumbwa": "Central Province", "Serenje": "Central Province",
    "Chipata": "Eastern Province", "Petauke": "Eastern Province", "Lundazi": "Eastern Province",
    "Katete": "Eastern Province", "Chadiza": "Eastern Province",
    "Kasama": "Northern Province", "Mbala": "Northern Province",
    "Mpulungu": "Northern Province", "Luwingu": "Northern Province",
    "Mansa": "Luapula Province", "Kawambwa": "Luapula Province",
    "Nchelenge": "Luapula Province", "Samfya": "Luapula Province",
    "Chinsali": "Muchinga Province", "Isoka": "Muchinga Province",
    "Mpika": "Muchinga Province", "Nakonde": "Muchinga Province",
    "Solwezi": "North-Western Province", "Mwinilunga": "North-Western Province",
    "Kasempa": "North-Western Province", "Kabompo": "North-Western Province", "Chavuma": "North-Western Province",
    "Mongu": "Western Province", "Kaoma": "Western Province", "Senanga": "Western Province",
    "Sesheke": "Western Province", "Lukulu": "Western Province",
  },
  "Zimbabwe": {
    "Harare": "Harare Metropolitan", "Bulawayo": "Bulawayo Metropolitan",
    "Mutare": "Manicaland", "Gweru": "Midlands",
    "Masvingo": "Masvingo", "Chinhoyi": "Mashonaland West",
  },
  "DRC (Congo)": {
    "Lubumbashi": "Haut-Katanga", "Likasi": "Haut-Katanga", "Kipushi": "Haut-Katanga",
    "Kolwezi": "Lualaba",
  },
  "Malawi": {
    "Lilongwe": "Central Region", "Zomba": "Southern Region",
    "Blantyre": "Southern Region", "Mzuzu": "Northern Region",
  },
  "Tanzania": {
    "Dar es Salaam": "Dar es Salaam Region", "Mbeya": "Mbeya Region",
    "Tunduma": "Mbeya Region", "Dodoma": "Dodoma Region", "Arusha": "Dodoma Region",
  },
  "Mozambique": {
    "Maputo": "Maputo Province", "Beira": "Sofala",
    "Tete": "Tete Province", "Nacala": "Zambezia",
  },
  "Botswana": {
    "Gaborone": "South-East", "Francistown": "North-East", "Maun": "Central",
  },
  "Namibia": {
    "Windhoek": "Khomas", "Walvis Bay": "Erongo", "Rundu": "Kavango East",
  },
  "South Africa": {
    "Johannesburg": "Gauteng", "Pretoria": "Gauteng",
    "Durban": "KwaZulu-Natal", "Cape Town": "Western Cape", "Musina": "Limpopo",
  },
  "Angola": {
    "Luanda": "Luanda Province", "Lubango": "Huíla", "Huambo": "Huambo Province",
  },
};
