// Jumbo Supermarket Product Integration
// This uses sample data but can be connected to the SupermarktConnector API
// See: https://github.com/bartmachielsen/SupermarktConnector

export interface JumboProduct {
  id: string;
  name: string;
  price: number;
  unitPrice?: string;
  category: string;
  isOnSale?: boolean;
  salePrice?: number;
}

// Sample Jumbo products database
// In production, this would come from the Jumbo API via a backend
const jumboProductsDatabase: JumboProduct[] = [
  // Zuivel & Eieren (Dairy & Eggs)
  { id: 'j001', name: 'Jumbo Halfvolle Melk 1L', price: 1.29, category: 'Zuivel & Eieren', unitPrice: '€1.29/L' },
  { id: 'j002', name: 'Jumbo Volle Melk 1L', price: 1.35, category: 'Zuivel & Eieren', unitPrice: '€1.35/L' },
  { id: 'j003', name: 'Jumbo Karnemelk 1L', price: 1.19, category: 'Zuivel & Eieren', unitPrice: '€1.19/L' },
  { id: 'j004', name: 'Jumbo Scharreleieren 10 stuks', price: 2.99, category: 'Zuivel & Eieren', unitPrice: '€0.30/st' },
  { id: 'j005', name: 'Jumbo Vrije Uitloop Eieren 6 stuks', price: 2.49, category: 'Zuivel & Eieren', unitPrice: '€0.42/st' },
  { id: 'j006', name: 'Jumbo Griekse Yoghurt 500g', price: 1.89, category: 'Zuivel & Eieren', unitPrice: '€3.78/kg' },
  { id: 'j007', name: 'Jumbo Boter Ongezouten 250g', price: 2.79, category: 'Zuivel & Eieren', unitPrice: '€11.16/kg' },
  { id: 'j008', name: 'Jumbo Geraspte Kaas 200g', price: 2.49, category: 'Zuivel & Eieren', unitPrice: '€12.45/kg' },
  { id: 'j009', name: 'Jumbo Jonge Gouda Kaas', price: 4.99, category: 'Zuivel & Eieren', unitPrice: '€9.98/kg' },
  { id: 'j010', name: 'Jumbo Slagroom 250ml', price: 1.69, category: 'Zuivel & Eieren', unitPrice: '€6.76/L' },

  // Groente & Fruit (Fruits & Vegetables)
  { id: 'j011', name: 'Bananen 1kg', price: 1.79, category: 'Groente & Fruit', unitPrice: '€1.79/kg' },
  { id: 'j012', name: 'Appels Elstar 1kg', price: 2.49, category: 'Groente & Fruit', unitPrice: '€2.49/kg' },
  { id: 'j013', name: 'Sinaasappels 1.5kg', price: 2.99, category: 'Groente & Fruit', unitPrice: '€1.99/kg' },
  { id: 'j014', name: 'Aardbeien 400g', price: 3.49, category: 'Groente & Fruit', unitPrice: '€8.73/kg', isOnSale: true, salePrice: 2.99 },
  { id: 'j015', name: 'Blauwe Bessen 125g', price: 2.29, category: 'Groente & Fruit', unitPrice: '€18.32/kg' },
  { id: 'j016', name: 'Tomaten 500g', price: 1.99, category: 'Groente & Fruit', unitPrice: '€3.98/kg' },
  { id: 'j017', name: 'Komkommer', price: 0.89, category: 'Groente & Fruit', unitPrice: '€0.89/st' },
  { id: 'j018', name: 'Paprika Mix 3 stuks', price: 2.29, category: 'Groente & Fruit', unitPrice: '€0.76/st' },
  { id: 'j019', name: 'Ijsbergsla', price: 1.29, category: 'Groente & Fruit', unitPrice: '€1.29/st' },
  { id: 'j020', name: 'Wortelen 1kg', price: 1.49, category: 'Groente & Fruit', unitPrice: '€1.49/kg' },
  { id: 'j021', name: 'Uien 1kg', price: 1.29, category: 'Groente & Fruit', unitPrice: '€1.29/kg' },
  { id: 'j022', name: 'Aardappelen Vastkokend 2.5kg', price: 2.99, category: 'Groente & Fruit', unitPrice: '€1.20/kg' },
  { id: 'j023', name: 'Avocado 2 stuks', price: 2.49, category: 'Groente & Fruit', unitPrice: '€1.25/st' },
  { id: 'j024', name: 'Citroen 4 stuks', price: 1.49, category: 'Groente & Fruit', unitPrice: '€0.37/st' },

  // Vlees & Vis (Meat & Fish)
  { id: 'j025', name: 'Kipfilet 500g', price: 5.99, category: 'Vlees & Vis', unitPrice: '€11.98/kg' },
  { id: 'j026', name: 'Rundergehakt 500g', price: 4.99, category: 'Vlees & Vis', unitPrice: '€9.98/kg' },
  { id: 'j027', name: 'Varkenshaas 400g', price: 6.49, category: 'Vlees & Vis', unitPrice: '€16.23/kg' },
  { id: 'j028', name: 'Zalm Filet 250g', price: 5.99, category: 'Vlees & Vis', unitPrice: '€23.96/kg' },
  { id: 'j029', name: 'Garnalen 200g', price: 4.99, category: 'Vlees & Vis', unitPrice: '€24.95/kg' },
  { id: 'j030', name: 'Speklapjes 500g', price: 4.49, category: 'Vlees & Vis', unitPrice: '€8.98/kg' },

  // Brood & Gebak (Bread & Bakery)
  { id: 'j031', name: 'Jumbo Wit Brood', price: 1.49, category: 'Brood & Gebak', unitPrice: '€1.49/st' },
  { id: 'j032', name: 'Jumbo Volkoren Brood', price: 1.69, category: 'Brood & Gebak', unitPrice: '€1.69/st' },
  { id: 'j033', name: 'Croissants 4 stuks', price: 2.29, category: 'Brood & Gebak', unitPrice: '€0.57/st' },
  { id: 'j034', name: 'Pistolets 6 stuks', price: 1.79, category: 'Brood & Gebak', unitPrice: '€0.30/st' },
  { id: 'j035', name: 'Roomboter Cake', price: 2.99, category: 'Brood & Gebak', unitPrice: '€2.99/st' },

  // Dranken (Beverages)
  { id: 'j036', name: 'Coca-Cola 1.5L', price: 2.19, category: 'Dranken', unitPrice: '€1.46/L' },
  { id: 'j037', name: 'Spa Blauw 6x1.5L', price: 3.99, category: 'Dranken', unitPrice: '€0.44/L' },
  { id: 'j038', name: 'Jumbo Sinaasappelsap 1L', price: 1.49, category: 'Dranken', unitPrice: '€1.49/L' },
  { id: 'j039', name: 'Jumbo Appelsap 1L', price: 1.29, category: 'Dranken', unitPrice: '€1.29/L' },
  { id: 'j040', name: 'Douwe Egberts Koffie 500g', price: 6.99, category: 'Dranken', unitPrice: '€13.98/kg' },
  { id: 'j041', name: 'Pickwick Thee 20 zakjes', price: 2.49, category: 'Dranken', unitPrice: '€0.12/st' },
  { id: 'j042', name: 'Heineken 6x330ml', price: 6.49, category: 'Dranken', unitPrice: '€3.28/L' },
  { id: 'j043', name: 'Wijn Rood Huismerk 750ml', price: 3.99, category: 'Dranken', unitPrice: '€5.32/L' },

  // Snacks & Snoep (Snacks & Candy)
  { id: 'j044', name: 'Lay\'s Naturel Chips 225g', price: 2.49, category: 'Snacks & Snoep', unitPrice: '€11.07/kg' },
  { id: 'j045', name: 'Doritos Nacho Cheese 185g', price: 2.79, category: 'Snacks & Snoep', unitPrice: '€15.08/kg' },
  { id: 'j046', name: 'Jumbo Pinda\'s 300g', price: 1.99, category: 'Snacks & Snoep', unitPrice: '€6.63/kg' },
  { id: 'j047', name: 'Tony\'s Chocolonely 180g', price: 3.49, category: 'Snacks & Snoep', unitPrice: '€19.39/kg' },
  { id: 'j048', name: 'Haribo Goudbeertjes 300g', price: 2.29, category: 'Snacks & Snoep', unitPrice: '€7.63/kg' },
  { id: 'j049', name: 'Oreo Koekjes 154g', price: 1.99, category: 'Snacks & Snoep', unitPrice: '€12.92/kg' },

  // Pasta, Rijst & Wereldkeuken
  { id: 'j050', name: 'Jumbo Spaghetti 500g', price: 0.99, category: 'Pasta & Rijst', unitPrice: '€1.98/kg' },
  { id: 'j051', name: 'Jumbo Penne 500g', price: 0.99, category: 'Pasta & Rijst', unitPrice: '€1.98/kg' },
  { id: 'j052', name: 'Jumbo Witte Rijst 1kg', price: 1.79, category: 'Pasta & Rijst', unitPrice: '€1.79/kg' },
  { id: 'j053', name: 'Jumbo Basmati Rijst 1kg', price: 2.49, category: 'Pasta & Rijst', unitPrice: '€2.49/kg' },
  { id: 'j054', name: 'Bertolli Pastasaus 400g', price: 2.29, category: 'Pasta & Rijst', unitPrice: '€5.73/kg' },

  // Diepvries (Frozen)
  { id: 'j055', name: 'Jumbo Diepvriespizza', price: 2.99, category: 'Diepvries', unitPrice: '€2.99/st' },
  { id: 'j056', name: 'Jumbo Frites 2.5kg', price: 3.99, category: 'Diepvries', unitPrice: '€1.60/kg', isOnSale: true, salePrice: 2.99 },
  { id: 'j057', name: 'Ben & Jerry\'s Cookie Dough 465ml', price: 6.99, category: 'Diepvries', unitPrice: '€15.03/L' },
  { id: 'j058', name: 'Jumbo Groenten Mix 750g', price: 2.49, category: 'Diepvries', unitPrice: '€3.32/kg' },
  { id: 'j059', name: 'Jumbo Kipnuggets 500g', price: 3.99, category: 'Diepvries', unitPrice: '€7.98/kg' },

  // Huishouden (Household)
  { id: 'j060', name: 'Jumbo Toiletpapier 8 rollen', price: 3.99, category: 'Huishouden', unitPrice: '€0.50/rol' },
  { id: 'j061', name: 'Jumbo Keukenpapier 2 rollen', price: 2.49, category: 'Huishouden', unitPrice: '€1.25/rol' },
  { id: 'j062', name: 'Dreft Afwasmiddel 500ml', price: 2.29, category: 'Huishouden', unitPrice: '€4.58/L' },
  { id: 'j063', name: 'Robijn Wasmiddel 1.5L', price: 8.99, category: 'Huishouden', unitPrice: '€5.99/L' },
  { id: 'j064', name: 'Jumbo Vuilniszakken 20 stuks', price: 1.99, category: 'Huishouden', unitPrice: '€0.10/st' },
  { id: 'j065', name: 'Ajax Allesreiniger 1L', price: 2.49, category: 'Huishouden', unitPrice: '€2.49/L' },
];

// Categories available at Jumbo
export const jumboCategories = [
  'Zuivel & Eieren',
  'Groente & Fruit',
  'Vlees & Vis',
  'Brood & Gebak',
  'Dranken',
  'Snacks & Snoep',
  'Pasta & Rijst',
  'Diepvries',
  'Huishouden'
];

// Search products
export const searchJumboProducts = (query: string, category?: string): JumboProduct[] => {
  let results = jumboProductsDatabase;

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }

  if (query) {
    const searchTerm = query.toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.category.toLowerCase().includes(searchTerm)
    );
  }

  return results;
};

// Get products by category
export const getProductsByCategory = (category: string): JumboProduct[] => {
  return jumboProductsDatabase.filter(p => p.category === category);
};

// Get all products
export const getAllJumboProducts = (): JumboProduct[] => {
  return jumboProductsDatabase;
};

// Get products on sale
export const getSaleProducts = (): JumboProduct[] => {
  return jumboProductsDatabase.filter(p => p.isOnSale);
};

// Get product by ID
export const getProductById = (id: string): JumboProduct | undefined => {
  return jumboProductsDatabase.find(p => p.id === id);
};

/*
 * BACKEND INTEGRATION NOTES
 * ========================
 *
 * To get REAL Jumbo products, you'll need a backend server because:
 * 1. Jumbo doesn't have a public API - you need to use their mobile app API
 * 2. CORS prevents direct browser requests to Jumbo's servers
 *
 * Options:
 *
 * 1. Use SupermarktConnector (Python):
 *    https://github.com/bartmachielsen/SupermarktConnector
 *    - Run as a backend service
 *    - Create API endpoints your frontend can call
 *
 * 2. Use Apify Jumbo Scraper (Paid):
 *    https://apify.com/harvestedge/jumbo-supermarket-scraper
 *    - Cloud-based scraping service
 *    - Returns real-time product data
 *
 * 3. Build your own scraper:
 *    - Use Puppeteer/Playwright on a backend
 *    - Scrape Jumbo.com product pages
 *    - Cache results in a database
 *
 * Example backend endpoint you could create:
 *
 * GET /api/jumbo/search?q=melk&category=zuivel
 * GET /api/jumbo/products/:id
 * GET /api/jumbo/categories
 */
