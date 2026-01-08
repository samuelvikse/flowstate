// Translations for the Flowstate app

export type Language = 'nl' | 'en';

export const translations = {
  nl: {
    // Shopping page
    shoppingLists: 'Boodschappenlijsten',
    planYourGroceries: 'Plan je boodschappen met Jumbo',
    newList: 'Nieuwe Lijst',
    searchLists: 'Zoek lijsten...',
    noShoppingLists: 'Nog geen boodschappenlijsten',
    createFirstList: 'Maak je eerste lijst',
    selectShoppingList: 'Selecteer een boodschappenlijst',
    chooseFromSidebar: 'Kies een lijst uit de zijbalk of maak een nieuwe',
    items: 'items',
    today: 'Vandaag',
    tomorrow: 'Morgen',
    delete: 'Verwijderen',
    toBuy: 'Te kopen',
    inCart: 'In winkelwagen',
    addItem: 'Item Toevoegen',
    noItemsInList: 'Nog geen items in deze lijst',
    addFirstItem: 'Voeg je eerste item toe',

    // New list modal
    newShoppingList: 'Nieuwe Boodschappenlijst',
    listName: 'Lijstnaam',
    listNamePlaceholder: 'bijv. Weekboodschappen',
    shoppingDate: 'Winkeldatum',
    cancel: 'Annuleren',
    createList: 'Lijst Maken',

    // Product search modal
    addProductFromJumbo: 'Product Toevoegen van Jumbo',
    searchJumboProducts: 'Zoek Jumbo producten...',
    allCategories: 'Alle Categorien',
    sale: 'Aanbieding',
    saleItems: 'Aanbiedingen',
    noProductsFound: 'Geen producten gevonden',
    orAddCustomItem: 'Of voeg een eigen item toe:',
    itemName: 'Itemnaam',
    price: 'Prijs',
    add: 'Toevoegen',
    orAddFromJumboUrl: 'Of plak een Jumbo product URL:',
    jumboUrlPlaceholder: 'https://www.jumbo.com/producten/...',
    addFromUrl: 'Van URL',
    invalidUrl: 'Ongeldige Jumbo URL',

    // Categories
    categories: {
      'Zuivel & Eieren': 'Zuivel & Eieren',
      'Groente & Fruit': 'Groente & Fruit',
      'Vlees & Vis': 'Vlees & Vis',
      'Brood & Gebak': 'Brood & Gebak',
      'Dranken': 'Dranken',
      'Snacks & Snoep': 'Snacks & Snoep',
      'Pasta & Rijst': 'Pasta & Rijst',
      'Diepvries': 'Diepvries',
      'Huishouden': 'Huishouden',
    },
  },
  en: {
    // Shopping page
    shoppingLists: 'Shopping Lists',
    planYourGroceries: 'Plan your groceries with Jumbo',
    newList: 'New List',
    searchLists: 'Search lists...',
    noShoppingLists: 'No shopping lists yet',
    createFirstList: 'Create your first list',
    selectShoppingList: 'Select a shopping list',
    chooseFromSidebar: 'Choose a list from the sidebar or create a new one',
    items: 'items',
    today: 'Today',
    tomorrow: 'Tomorrow',
    delete: 'Delete',
    toBuy: 'To buy',
    inCart: 'In cart',
    addItem: 'Add Item',
    noItemsInList: 'No items in this list yet',
    addFirstItem: 'Add your first item',

    // New list modal
    newShoppingList: 'New Shopping List',
    listName: 'List Name',
    listNamePlaceholder: 'e.g., Weekly groceries',
    shoppingDate: 'Shopping Date',
    cancel: 'Cancel',
    createList: 'Create List',

    // Product search modal
    addProductFromJumbo: 'Add Product from Jumbo',
    searchJumboProducts: 'Search Jumbo products...',
    allCategories: 'All Categories',
    sale: 'Sale',
    saleItems: 'Sale Items',
    noProductsFound: 'No products found',
    orAddCustomItem: 'Or add a custom item:',
    itemName: 'Item name',
    price: 'Price',
    add: 'Add',
    orAddFromJumboUrl: 'Or paste a Jumbo product URL:',
    jumboUrlPlaceholder: 'https://www.jumbo.com/producten/...',
    addFromUrl: 'From URL',
    invalidUrl: 'Invalid Jumbo URL',

    // Categories (translated)
    categories: {
      'Zuivel & Eieren': 'Dairy & Eggs',
      'Groente & Fruit': 'Fruits & Vegetables',
      'Vlees & Vis': 'Meat & Fish',
      'Brood & Gebak': 'Bread & Bakery',
      'Dranken': 'Beverages',
      'Snacks & Snoep': 'Snacks & Candy',
      'Pasta & Rijst': 'Pasta & Rice',
      'Diepvries': 'Frozen',
      'Huishouden': 'Household',
    },
  },
};

export const getTranslation = (lang: Language) => translations[lang];
