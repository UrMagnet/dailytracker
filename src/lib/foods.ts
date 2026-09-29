import type { Food, FoodCategory, FoodPortion } from './types'

/**
 * Indonesian food catalogue.
 *
 * Values are per 100 g (per 100 ml for drinks). Whole ingredients follow
 * Kemenkes TKPI / USDA composition tables. Warung, street-food and chain items
 * are marked `estimate: true` — recipes vary enormously (how much oil, how
 * sweet the kecap, how big the portion), so those numbers are a defensible
 * middle rather than a measurement. That flag is surfaced in the UI so nobody
 * mistakes an estimate for a weighed value.
 *
 * Every entry carries household portions, because the common case is eating
 * out with no scale in sight.
 */

type Extra = Partial<Pick<Food, 'sugar' | 'fiber' | 'sodium' | 'note' | 'estimate'>> & {
  portions?: FoodPortion[]
}

const f = (
  id: string,
  name: string,
  category: FoodCategory,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  extra: Extra = {},
): Food => ({ id, name, category, kcal, protein, carbs, fat, ...extra })

const p = (label: string, grams: number): FoodPortion => ({ label, grams })

export const FOOD_CATALOG: Food[] = [
  // ---- Karbohidrat ------------------------------------------------------
  f('nasi-putih', 'Nasi putih', 'karbo', 130, 2.7, 28, 0.3, {
    sugar: 0.1, fiber: 0.4, sodium: 1,
    portions: [p('1 centong', 100), p('1 piring', 200), p('½ piring', 100)],
  }),
  f('nasi-merah', 'Nasi merah', 'karbo', 111, 2.6, 23, 0.9, {
    fiber: 1.8, portions: [p('1 centong', 100), p('1 piring', 200)],
  }),
  f('nasi-goreng', 'Nasi goreng', 'karbo', 190, 5, 25, 7.5, {
    sugar: 1.5, sodium: 450, estimate: true,
    portions: [p('1 piring', 250), p('½ piring', 125)],
  }),
  f('nasi-uduk', 'Nasi uduk', 'karbo', 190, 3.5, 27, 7, {
    sodium: 300, estimate: true, portions: [p('1 porsi', 200)],
  }),
  f('lontong', 'Lontong / ketupat', 'karbo', 110, 2, 24, 0.2, {
    portions: [p('1 buah', 150)],
  }),
  f('mie-instan-goreng', 'Mie instan goreng', 'karbo', 447, 9, 60, 18, {
    sugar: 5, sodium: 1600,
    note: 'Per 100 g mi kering, termasuk bumbu. Satu bungkus ± 85 g.',
    portions: [p('1 bungkus', 85), p('2 bungkus', 170)],
  }),
  f('mie-instan-kuah', 'Mie instan kuah', 'karbo', 430, 9, 58, 17, {
    sodium: 1900, note: 'Per 100 g mi kering. Satu bungkus ± 70 g.',
    portions: [p('1 bungkus', 70)],
  }),
  f('mie-ayam', 'Mie ayam', 'karbo', 160, 8, 20, 5.5, {
    sodium: 600, estimate: true, portions: [p('1 mangkuk', 300)],
  }),
  f('bihun-goreng', 'Bihun goreng', 'karbo', 200, 4, 30, 7, {
    sodium: 400, estimate: true, portions: [p('1 porsi', 200)],
  }),
  f('kwetiau-goreng', 'Kwetiau goreng', 'karbo', 210, 7, 27, 8, {
    sodium: 550, estimate: true, portions: [p('1 porsi', 250)],
  }),
  f('bubur-ayam', 'Bubur ayam', 'karbo', 90, 4, 13, 2.5, {
    sodium: 400, estimate: true, portions: [p('1 mangkuk', 300)],
  }),
  f('roti-tawar', 'Roti tawar putih', 'karbo', 265, 9, 49, 3.2, {
    sugar: 5, fiber: 2.7, sodium: 490, portions: [p('1 lembar', 25), p('2 lembar', 50)],
  }),
  f('kentang-goreng', 'Kentang goreng', 'karbo', 312, 3.4, 41, 15, {
    sodium: 210, estimate: true, portions: [p('porsi kecil', 70), p('porsi sedang', 115)],
  }),
  f('singkong-rebus', 'Singkong rebus', 'karbo', 160, 1.4, 38, 0.3, {
    fiber: 1.8, portions: [p('1 potong', 100)],
  }),
  f('ubi-rebus', 'Ubi rebus', 'karbo', 86, 1.6, 20, 0.1, {
    sugar: 4.2, fiber: 3, portions: [p('1 buah sedang', 130)],
  }),
  f('jagung-rebus', 'Jagung rebus', 'karbo', 96, 3.4, 21, 1.5, {
    sugar: 4.5, fiber: 2.4, portions: [p('1 buah', 90)],
  }),

  // ---- Protein hewani ---------------------------------------------------
  f('dada-ayam-rebus', 'Dada ayam rebus/panggang (tanpa kulit)', 'protein-hewani', 165, 31, 0, 3.6, {
    sodium: 74, portions: [p('1 potong', 100)],
  }),
  f('dada-ayam-goreng', 'Dada ayam goreng tepung', 'protein-hewani', 290, 22, 12, 17, {
    sodium: 600, estimate: true, portions: [p('1 potong', 120)],
  }),
  f('paha-ayam-goreng', 'Paha ayam goreng', 'protein-hewani', 265, 24, 5, 17, {
    sodium: 450, estimate: true, portions: [p('1 potong', 110)],
  }),
  f('ayam-bakar', 'Ayam bakar', 'protein-hewani', 200, 27, 3, 8, {
    sugar: 2, sodium: 400, estimate: true, portions: [p('1 potong', 120)],
  }),
  f('ayam-geprek', 'Ayam geprek', 'protein-hewani', 280, 22, 14, 16, {
    sodium: 700, estimate: true, portions: [p('1 porsi', 150)],
  }),
  f('ayam-cepat-saji', 'Ayam goreng cepat saji (KFC/McD)', 'protein-hewani', 280, 21, 11, 17, {
    sodium: 700, estimate: true, portions: [p('1 potong', 120)],
  }),
  f('rendang', 'Rendang daging sapi', 'protein-hewani', 195, 15, 6, 12, {
    sugar: 2, sodium: 400, estimate: true, portions: [p('1 potong', 80)],
  }),
  f('daging-sapi', 'Daging sapi tumis/panggang', 'protein-hewani', 250, 26, 0, 15, {
    sodium: 60, portions: [p('1 potong', 80)],
  }),
  f('sate-ayam', 'Sate ayam + bumbu kacang', 'protein-hewani', 220, 18, 8, 13, {
    sugar: 4, sodium: 500, estimate: true, portions: [p('1 tusuk', 30), p('10 tusuk', 300)],
  }),
  f('bakso-sapi', 'Bakso sapi', 'protein-hewani', 170, 12, 10, 9, {
    sodium: 700, estimate: true, portions: [p('1 butir', 25), p('1 mangkuk', 200)],
  }),
  f('telur-rebus', 'Telur ayam rebus', 'protein-hewani', 155, 13, 1.1, 11, {
    sodium: 124, portions: [p('1 butir', 55), p('2 butir', 110)],
  }),
  f('telur-ceplok', 'Telur ceplok / mata sapi', 'protein-hewani', 196, 14, 0.8, 15, {
    sodium: 140, portions: [p('1 butir', 60)],
  }),
  f('telur-dadar', 'Telur dadar', 'protein-hewani', 210, 14, 1.5, 16, {
    sodium: 200, portions: [p('1 butir', 65)],
  }),
  f('ikan-nila-bakar', 'Ikan nila bakar/kukus', 'protein-hewani', 128, 26, 0, 3, {
    sodium: 56, portions: [p('1 ekor sedang', 150)],
  }),
  f('lele-goreng', 'Lele goreng', 'protein-hewani', 240, 22, 6, 14, {
    sodium: 300, estimate: true, portions: [p('1 ekor', 100)],
  }),
  f('ikan-kembung-goreng', 'Ikan kembung goreng', 'protein-hewani', 250, 25, 4, 15, {
    sodium: 320, estimate: true, portions: [p('1 ekor', 80)],
  }),
  f('udang-rebus', 'Udang rebus', 'protein-hewani', 99, 24, 0.2, 0.3, {
    sodium: 111, portions: [p('5 ekor', 60)],
  }),
  f('nugget-ayam', 'Nugget ayam goreng', 'protein-hewani', 290, 15, 16, 19, {
    sodium: 600, portions: [p('1 buah', 17), p('5 buah', 85)],
  }),
  f('sosis', 'Sosis ayam/sapi', 'protein-hewani', 260, 12, 8, 20, {
    sodium: 900, portions: [p('1 buah', 50)],
  }),

  // ---- Protein nabati ---------------------------------------------------
  f('tempe-kukus', 'Tempe kukus/rebus', 'protein-nabati', 193, 20, 8, 11, {
    fiber: 1.4, portions: [p('1 potong', 50)],
  }),
  f('tempe-goreng', 'Tempe goreng', 'protein-nabati', 280, 19, 12, 18, {
    sodium: 200, estimate: true, portions: [p('1 potong', 25), p('3 potong', 75)],
  }),
  f('tempe-bacem', 'Tempe bacem', 'protein-nabati', 250, 17, 16, 13, {
    sugar: 8, sodium: 350, estimate: true, portions: [p('1 potong', 40)],
  }),
  f('tempe-mendoan', 'Tempe mendoan', 'protein-nabati', 270, 12, 20, 16, {
    sodium: 300, estimate: true, portions: [p('1 lembar', 40)],
  }),
  f('tahu-rebus', 'Tahu putih rebus/kukus', 'protein-nabati', 76, 8, 1.9, 4.8, {
    portions: [p('1 potong', 50)],
  }),
  f('tahu-goreng', 'Tahu goreng', 'protein-nabati', 180, 11, 5, 13, {
    sodium: 180, estimate: true, portions: [p('1 potong', 30), p('3 potong', 90)],
  }),
  f('kacang-tanah', 'Kacang tanah goreng', 'protein-nabati', 570, 26, 16, 49, {
    fiber: 8, sodium: 400, portions: [p('1 genggam', 30)],
  }),

  // ---- Sayur ------------------------------------------------------------
  f('bayam-rebus', 'Bayam rebus', 'sayur', 23, 2.9, 3.6, 0.4, {
    fiber: 2.2, sodium: 70, portions: [p('1 mangkuk', 100)],
  }),
  f('kangkung-tumis', 'Kangkung tumis', 'sayur', 90, 3, 5, 6, {
    sodium: 300, estimate: true, portions: [p('1 porsi', 100)],
  }),
  f('capcay', 'Capcay', 'sayur', 80, 4, 7, 4, {
    sodium: 400, estimate: true, portions: [p('1 porsi', 200)],
  }),
  f('sayur-sop', 'Sayur sop', 'sayur', 40, 2, 5, 1.5, {
    sodium: 300, estimate: true, portions: [p('1 mangkuk', 200)],
  }),
  f('sayur-asem', 'Sayur asem', 'sayur', 35, 1.5, 6, 0.5, {
    sodium: 280, estimate: true, portions: [p('1 mangkuk', 200)],
  }),
  f('gado-gado', 'Gado-gado', 'sayur', 140, 6, 12, 8, {
    sugar: 5, sodium: 400, estimate: true, portions: [p('1 porsi', 300)],
  }),
  f('lalapan', 'Lalapan segar (timun, kol, selada)', 'sayur', 15, 0.7, 3, 0.1, {
    fiber: 1.2, portions: [p('1 porsi', 80)],
  }),
  f('terong-balado', 'Terong balado', 'sayur', 120, 1.5, 9, 9, {
    sugar: 3, sodium: 350, estimate: true, portions: [p('1 porsi', 100)],
  }),

  // ---- Buah -------------------------------------------------------------
  f('pisang', 'Pisang', 'buah', 89, 1.1, 23, 0.3, {
    sugar: 12, fiber: 2.6, portions: [p('1 buah sedang', 100)],
  }),
  f('apel', 'Apel', 'buah', 52, 0.3, 14, 0.2, {
    sugar: 10, fiber: 2.4, portions: [p('1 buah', 180)],
  }),
  f('jeruk', 'Jeruk', 'buah', 47, 0.9, 12, 0.1, {
    sugar: 9, fiber: 2.4, portions: [p('1 buah', 130)],
  }),
  f('semangka', 'Semangka', 'buah', 30, 0.6, 8, 0.2, {
    sugar: 6, fiber: 0.4, portions: [p('1 potong', 150)],
  }),
  f('mangga', 'Mangga', 'buah', 60, 0.8, 15, 0.4, {
    sugar: 14, fiber: 1.6, portions: [p('1 buah sedang', 200)],
  }),
  f('pepaya', 'Pepaya', 'buah', 43, 0.5, 11, 0.3, {
    sugar: 8, fiber: 1.7, portions: [p('1 potong', 150)],
  }),
  f('alpukat', 'Alpukat', 'buah', 160, 2, 9, 15, {
    fiber: 7, portions: [p('½ buah', 100)],
  }),

  // ---- Jajanan & gorengan ----------------------------------------------
  f('bakwan', 'Bakwan / bala-bala', 'jajanan', 280, 4, 30, 16, {
    sodium: 350, estimate: true, portions: [p('1 buah', 50)],
  }),
  f('tahu-isi', 'Tahu isi', 'jajanan', 250, 7, 22, 15, {
    sodium: 320, estimate: true, portions: [p('1 buah', 60)],
  }),
  f('pisang-goreng', 'Pisang goreng', 'jajanan', 250, 2, 35, 12, {
    sugar: 12, estimate: true, portions: [p('1 buah', 60)],
  }),
  f('martabak-manis', 'Martabak manis', 'jajanan', 350, 7, 45, 16, {
    sugar: 22, sodium: 250, estimate: true, portions: [p('1 potong', 80)],
  }),
  f('martabak-telur', 'Martabak telur', 'jajanan', 280, 12, 22, 16, {
    sodium: 500, estimate: true, portions: [p('1 potong', 90)],
  }),
  f('siomay', 'Siomay + bumbu kacang', 'jajanan', 180, 9, 18, 8, {
    sugar: 3, sodium: 500, estimate: true, portions: [p('1 porsi', 200)],
  }),
  f('batagor', 'Batagor', 'jajanan', 250, 9, 24, 13, {
    sugar: 3, sodium: 550, estimate: true, portions: [p('1 porsi', 180)],
  }),
  f('seblak', 'Seblak', 'jajanan', 150, 5, 18, 7, {
    sodium: 800, estimate: true, portions: [p('1 porsi', 250)],
  }),
  f('cilok', 'Cilok', 'jajanan', 200, 3, 35, 5, {
    sodium: 400, estimate: true, portions: [p('1 porsi', 100)],
  }),
  f('pempek', 'Pempek + cuko', 'jajanan', 220, 12, 25, 8, {
    sugar: 6, sodium: 600, estimate: true, portions: [p('1 buah', 100)],
  }),
  f('donat-gula', 'Donat gula', 'jajanan', 400, 6, 50, 20, {
    sugar: 20, sodium: 300, estimate: true, portions: [p('1 buah', 60)],
  }),
  f('roti-bakar', 'Roti bakar coklat keju', 'jajanan', 350, 8, 42, 17, {
    sugar: 18, sodium: 350, estimate: true, portions: [p('1 porsi', 120)],
  }),
  f('keripik-kentang', 'Keripik kentang', 'jajanan', 536, 6, 53, 34, {
    sodium: 500, portions: [p('1 bungkus kecil', 40)],
  }),
  f('burger', 'Burger', 'jajanan', 250, 13, 25, 11, {
    sugar: 5, sodium: 500, estimate: true, portions: [p('1 buah', 150)],
  }),
  f('pizza', 'Pizza', 'jajanan', 265, 11, 33, 10, {
    sugar: 4, sodium: 600, estimate: true, portions: [p('1 slice', 100)],
  }),

  // ---- Minuman ----------------------------------------------------------
  f('air-putih', 'Air putih', 'minuman', 0, 0, 0, 0, {
    sugar: 0, sodium: 0, portions: [p('1 gelas', 250)],
  }),
  f('teh-tawar', 'Teh tawar', 'minuman', 1, 0, 0.3, 0, {
    sugar: 0, portions: [p('1 gelas', 250)],
  }),
  f('es-teh-manis', 'Es teh manis', 'minuman', 40, 0, 10, 0, {
    sugar: 10, estimate: true, portions: [p('1 gelas', 250)],
  }),
  f('kopi-hitam', 'Kopi hitam tanpa gula', 'minuman', 2, 0.1, 0, 0, {
    sugar: 0, portions: [p('1 cangkir', 200)],
  }),
  f('kopi-susu-aren', 'Kopi susu gula aren', 'minuman', 90, 1.5, 15, 2.5, {
    sugar: 14, estimate: true, portions: [p('1 cup', 250)],
  }),
  f('susu-uht', 'Susu UHT full cream', 'minuman', 61, 3.2, 4.8, 3.3, {
    sugar: 4.8, sodium: 44, portions: [p('1 gelas', 200), p('1 kotak', 250)],
  }),
  f('milkshake', 'Milkshake (coklat/vanila/stroberi)', 'minuman', 120, 3, 19, 3.5, {
    sugar: 17, sodium: 60, estimate: true,
    note: 'Rasa apa pun jatuhnya mirip — yang membedakan terutama ukuran gelas.',
    portions: [p('gelas kecil', 250), p('gelas sedang', 350), p('gelas besar', 500)],
  }),
  f('boba', 'Boba milk tea', 'minuman', 90, 1, 18, 2, {
    sugar: 15, estimate: true,
    note: 'Dengan topping boba. Minta less sugar memangkas gula sekitar sepertiga.',
    portions: [p('1 cup regular', 500), p('1 cup large', 700)],
  }),
  f('soda', 'Minuman bersoda', 'minuman', 42, 0, 10.6, 0, {
    sugar: 10.6, sodium: 10, portions: [p('1 kaleng', 330), p('1 botol', 390)],
  }),
  f('jus-jeruk-kemasan', 'Jus jeruk kemasan', 'minuman', 45, 0.5, 10.4, 0.1, {
    sugar: 8.4, portions: [p('1 kotak', 250)],
  }),
  f('jus-alpukat', 'Jus alpukat (dengan susu & gula)', 'minuman', 130, 2, 14, 8, {
    sugar: 12, estimate: true, portions: [p('1 gelas', 300)],
  }),
  f('air-kelapa', 'Air kelapa', 'minuman', 19, 0.7, 3.7, 0.2, {
    sugar: 2.6, sodium: 105, portions: [p('1 gelas', 250)],
  }),
]

export const CATEGORY_LABEL: Record<FoodCategory, string> = {
  karbo: 'Karbohidrat',
  'protein-hewani': 'Protein hewani',
  'protein-nabati': 'Protein nabati',
  sayur: 'Sayur',
  buah: 'Buah',
  jajanan: 'Jajanan & gorengan',
  minuman: 'Minuman',
  lainnya: 'Lainnya',
}

export const CATEGORY_ORDER: FoodCategory[] = [
  'karbo',
  'protein-hewani',
  'protein-nabati',
  'sayur',
  'buah',
  'jajanan',
  'minuman',
  'lainnya',
]
