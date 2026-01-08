import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Calendar,
  Trash2,
  Check,
  ShoppingBag,
  ChevronRight,
  Euro,
  Tag,
  ExternalLink,
  Globe,
  Link
} from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { searchJumboProducts, jumboCategories, getSaleProducts, type JumboProduct } from '../lib/jumbo';
import { getTranslation } from '../lib/translations';
import styles from './ShoppingPage.module.css';

export function ShoppingPage() {
  const {
    shoppingLists,
    selectedShoppingListId,
    addShoppingList,
    selectShoppingList,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    deleteShoppingList,
    language,
    setLanguage
  } = useStore();

  const t = getTranslation(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDate, setNewListDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [jumboUrl, setJumboUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  const selectedList = shoppingLists.find(list => list.id === selectedShoppingListId);

  const filteredProducts = useMemo(() => {
    // Special "sale" category shows all products on sale
    if (selectedCategory === 'sale') {
      const saleProducts = getSaleProducts();
      if (productSearchQuery) {
        const searchTerm = productSearchQuery.toLowerCase();
        return saleProducts.filter(p =>
          p.name.toLowerCase().includes(searchTerm)
        );
      }
      return saleProducts;
    }
    return searchJumboProducts(
      productSearchQuery,
      selectedCategory === 'all' ? undefined : selectedCategory
    );
  }, [productSearchQuery, selectedCategory]);

  const total = useMemo(() => {
    if (!selectedList) return 0;
    return selectedList.items
      .filter(item => !item.checked)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedList]);

  const checkedTotal = useMemo(() => {
    if (!selectedList) return 0;
    return selectedList.items
      .filter(item => item.checked)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedList]);

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    addShoppingList({
      name: newListName,
      date: new Date(newListDate),
      items: [],
      createdBy: 'user',
      sharedWith: []
    });
    setNewListName('');
    setNewListDate(format(new Date(), 'yyyy-MM-dd'));
    setShowNewListModal(false);
  };

  const handleAddProduct = (product: JumboProduct) => {
    if (!selectedShoppingListId) return;
    addShoppingItem(selectedShoppingListId, {
      name: product.name,
      price: product.isOnSale && product.salePrice ? product.salePrice : product.price,
      quantity: 1,
      category: product.category,
      checked: false,
      addedBy: 'user',
      addedAt: new Date()
    });
    setShowProductSearch(false);
    setProductSearchQuery('');
    setSelectedCategory('all');
  };

  const handleAddCustomItem = () => {
    if (!selectedShoppingListId || !newItemName.trim()) return;
    addShoppingItem(selectedShoppingListId, {
      name: newItemName,
      price: parseFloat(newItemPrice) || 0,
      quantity: 1,
      category: 'Other',
      checked: false,
      addedBy: 'user',
      addedAt: new Date()
    });
    setNewItemName('');
    setNewItemPrice('');
    setShowProductSearch(false);
  };

  const handleAddFromUrl = () => {
    if (!selectedShoppingListId || !jumboUrl.trim()) return;

    // Parse Jumbo URL to extract product name
    // Example URL: https://www.jumbo.com/producten/jumbo-halfvolle-melk-1l-123456
    const jumboUrlPattern = /jumbo\.com\/(producten|zoeken)/i;

    if (!jumboUrlPattern.test(jumboUrl)) {
      setUrlError(t.invalidUrl);
      return;
    }

    // Extract product name from URL path
    const urlParts = jumboUrl.split('/');
    const productSlug = urlParts[urlParts.length - 1]?.split('?')[0] || '';

    // Convert slug to readable name
    const productName = productSlug
      .replace(/-\d+$/, '') // Remove trailing product ID
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (productName) {
      addShoppingItem(selectedShoppingListId, {
        name: productName,
        price: 0, // Price unknown from URL
        quantity: 1,
        category: 'Other',
        checked: false,
        addedBy: 'user',
        addedAt: new Date()
      });
      setJumboUrl('');
      setUrlError('');
      setShowProductSearch(false);
    }
  };

  const formatListDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return t.today;
    if (isTomorrow(d)) return t.tomorrow;
    return format(d, 'EEE, MMM d');
  };

  const translateCategory = (category: string) => {
    return t.categories[category as keyof typeof t.categories] || category;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'nl' ? 'en' : 'nl');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t.shoppingLists}</h1>
          <p className={styles.subtitle}>{t.planYourGroceries}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.languageToggle}
            onClick={toggleLanguage}
            title={language === 'nl' ? 'Switch to English' : 'Schakel naar Nederlands'}
          >
            <Globe size={16} />
            <span>{language === 'nl' ? 'NL' : 'EN'}</span>
          </button>
          <Button
            icon={<Plus size={18} />}
            onClick={() => setShowNewListModal(true)}
          >
            {t.newList}
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Lists sidebar */}
        <Card className={styles.listsPanel} padding="none">
          <div className={styles.listsPanelHeader}>
            <Input
              placeholder={t.searchLists}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className={styles.listsList}>
            {shoppingLists.length === 0 ? (
              <div className={styles.emptyState}>
                <ShoppingBag size={32} />
                <p>{t.noShoppingLists}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNewListModal(true)}
                >
                  {t.createFirstList}
                </Button>
              </div>
            ) : (
              shoppingLists
                .filter(list =>
                  list.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((list) => (
                  <motion.button
                    key={list.id}
                    className={`${styles.listItem} ${selectedShoppingListId === list.id ? styles.active : ''}`}
                    onClick={() => selectShoppingList(list.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={styles.listItemContent}>
                      <span className={styles.listItemName}>{list.name}</span>
                      <span className={styles.listItemMeta}>
                        <Calendar size={12} />
                        {formatListDate(list.date)}
                      </span>
                    </div>
                    <div className={styles.listItemRight}>
                      <span className={styles.listItemCount}>
                        {list.items.filter(i => !i.checked).length} {t.items}
                      </span>
                      <ChevronRight size={16} />
                    </div>
                  </motion.button>
                ))
            )}
          </div>
        </Card>

        {/* Main content */}
        <div className={styles.mainContent}>
          {selectedList ? (
            <>
              <Card className={styles.listHeader}>
                <div className={styles.listHeaderTop}>
                  <div>
                    <h2 className={styles.listTitle}>{selectedList.name}</h2>
                    <p className={styles.listDate}>
                      <Calendar size={14} />
                      {format(new Date(selectedList.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className={styles.listActions}>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      onClick={() => {
                        deleteShoppingList(selectedList.id);
                        selectShoppingList(null);
                      }}
                    >
                      {t.delete}
                    </Button>
                  </div>
                </div>

                <div className={styles.totalBar}>
                  <div className={styles.totalItem}>
                    <span className={styles.totalLabel}>{t.toBuy}</span>
                    <span className={styles.totalValue}>
                      <Euro size={16} />
                      {total.toFixed(2)}
                    </span>
                  </div>
                  <div className={styles.totalDivider} />
                  <div className={styles.totalItem}>
                    <span className={styles.totalLabel}>{t.inCart}</span>
                    <span className={`${styles.totalValue} ${styles.checked}`}>
                      <Euro size={16} />
                      {checkedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Card>

              <Button
                variant="secondary"
                fullWidth
                icon={<Plus size={18} />}
                onClick={() => setShowProductSearch(true)}
                className={styles.addItemButton}
              >
                {t.addItem}
              </Button>

              <div className={styles.itemsList}>
                <AnimatePresence>
                  {selectedList.items
                    .sort((a, b) => Number(a.checked) - Number(b.checked))
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`${styles.itemCard} ${item.checked ? styles.itemChecked : ''}`}
                      >
                        <button
                          className={styles.itemCheckbox}
                          onClick={() => toggleShoppingItem(selectedList.id, item.id)}
                        >
                          {item.checked && <Check size={14} />}
                        </button>
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          <span className={styles.itemCategory}>{translateCategory(item.category)}</span>
                        </div>
                        <div className={styles.itemPrice}>
                          <Euro size={14} />
                          {(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button
                          className={styles.itemDelete}
                          onClick={() => removeShoppingItem(selectedList.id, item.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                </AnimatePresence>

                {selectedList.items.length === 0 && (
                  <div className={styles.emptyItems}>
                    <ShoppingBag size={40} />
                    <p>{t.noItemsInList}</p>
                    <Button
                      variant="secondary"
                      onClick={() => setShowProductSearch(true)}
                    >
                      {t.addFirstItem}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Card className={styles.noListSelected}>
              <ShoppingBag size={48} />
              <h3>{t.selectShoppingList}</h3>
              <p>{t.chooseFromSidebar}</p>
            </Card>
          )}
        </div>
      </div>

      {/* New List Modal */}
      <AnimatePresence>
        {showNewListModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewListModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>{t.newShoppingList}</h3>
              <div className={styles.modalContent}>
                <Input
                  label={t.listName}
                  placeholder={t.listNamePlaceholder}
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <Input
                  label={t.shoppingDate}
                  type="date"
                  value={newListDate}
                  onChange={(e) => setNewListDate(e.target.value)}
                />
              </div>
              <div className={styles.modalActions}>
                <Button variant="ghost" onClick={() => setShowNewListModal(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={handleCreateList}>{t.createList}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Search Modal */}
      <AnimatePresence>
        {showProductSearch && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProductSearch(false)}
          >
            <motion.div
              className={`${styles.modal} ${styles.productModal}`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>{t.addProductFromJumbo}</h3>

              <Input
                placeholder={t.searchJumboProducts}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                icon={<Search size={16} />}
              />

              <div className={styles.categoryFilter}>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.categorySelect}
                >
                  <option value="all">{t.allCategories}</option>
                  <option value="sale" className={styles.saleOption}>{t.saleItems}</option>
                  {jumboCategories.map((cat) => (
                    <option key={cat} value={cat}>{translateCategory(cat)}</option>
                  ))}
                </select>
              </div>

              <div className={styles.productList}>
                {filteredProducts.length === 0 ? (
                  <div className={styles.noProducts}>
                    <Search size={24} />
                    <p>{t.noProductsFound}</p>
                  </div>
                ) : (
                  filteredProducts.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className={`${styles.productItem} ${product.isOnSale ? styles.onSale : ''}`}
                    >
                      <motion.button
                        className={styles.productClickArea}
                        onClick={() => handleAddProduct(product)}
                        whileHover={{ backgroundColor: 'var(--bg-card-hover)' }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={styles.productInfo}>
                          <div className={styles.productNameRow}>
                            <span className={styles.productName}>{product.name}</span>
                            {product.isOnSale && (
                              <span className={styles.saleBadge}>
                                <Tag size={10} />
                                {t.sale}
                              </span>
                            )}
                          </div>
                          <span className={styles.productCategory}>{translateCategory(product.category)}</span>
                          {product.unitPrice && (
                            <span className={styles.unitPrice}>{product.unitPrice}</span>
                          )}
                        </div>
                        <div className={styles.productPriceCol}>
                          {product.isOnSale && product.salePrice ? (
                            <>
                              <span className={styles.originalPrice}>
                                <Euro size={12} />
                                {product.price.toFixed(2)}
                              </span>
                              <span className={styles.salePrice}>
                                <Euro size={14} />
                                {product.salePrice.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className={styles.productPrice}>
                              <Euro size={14} />
                              {product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </motion.button>
                      <a
                        href={`https://www.jumbo.com/zoeken?searchTerms=${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.jumboLink}
                        onClick={(e) => e.stopPropagation()}
                        title="View on Jumbo.com"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.customItem}>
                <p className={styles.customItemLabel}>{t.orAddCustomItem}</p>
                <div className={styles.customItemInputs}>
                  <Input
                    placeholder={t.itemName}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                  <Input
                    placeholder={t.price}
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    icon={<Euro size={14} />}
                  />
                  <Button onClick={handleAddCustomItem} disabled={!newItemName.trim()}>
                    {t.add}
                  </Button>
                </div>
              </div>

              <div className={styles.urlItem}>
                <p className={styles.customItemLabel}>{t.orAddFromJumboUrl}</p>
                <div className={styles.customItemInputs}>
                  <Input
                    placeholder={t.jumboUrlPlaceholder}
                    value={jumboUrl}
                    onChange={(e) => {
                      setJumboUrl(e.target.value);
                      setUrlError('');
                    }}
                    icon={<Link size={14} />}
                    error={urlError}
                  />
                  <Button onClick={handleAddFromUrl} disabled={!jumboUrl.trim()}>
                    {t.addFromUrl}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
