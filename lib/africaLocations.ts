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
