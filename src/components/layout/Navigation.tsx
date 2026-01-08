import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  ShoppingCart,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Settings
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { TabId } from '../../types';
import styles from './Navigation.module.css';

export const APP_VERSION = 'v1.01';

const allTabs: { id: TabId; label: string; icon: typeof ShoppingCart; restricted?: boolean }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
  { id: 'mail', label: 'Mail', icon: Mail, restricted: true },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'todos', label: 'To-Do', icon: CheckSquare },
  { id: 'notes', label: 'Notes', icon: FileText, restricted: true },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Smooth spring animation config
const springConfig = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

interface NavigationProps {
  mobile?: boolean;
}

export function Navigation({ mobile = false }: NavigationProps) {
  const { activeTab, setActiveTab, isGirlfriendMode } = useStore();

  // Filter tabs based on girlfriend mode
  const tabs = useMemo(() => {
    if (isGirlfriendMode) {
      return allTabs.filter(tab => !tab.restricted);
    }
    return allTabs;
  }, [isGirlfriendMode]);

  if (mobile) {
    return (
      <nav className={styles.mobileNav}>
        <div className={styles.mobileNavContent}>
          {tabs.slice(0, 5).map((tab) => (
            <motion.button
              key={tab.id}
              className={`${styles.mobileNavItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
              whileTap={{ scale: 0.92 }}
              transition={springConfig}
            >
              <motion.div
                animate={{
                  scale: activeTab === tab.id ? 1.1 : 1,
                  y: activeTab === tab.id ? -2 : 0,
                }}
                transition={springConfig}
              >
                <tab.icon size={22} />
              </motion.div>
              <span className={styles.mobileNavLabel}>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  className={styles.mobileActiveIndicator}
                  layoutId="mobileActiveTab"
                  transition={springConfig}
                />
              )}
            </motion.button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        {tabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.03,
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            whileHover={{
              x: 4,
              transition: { duration: 0.2, ease: 'easeOut' },
            }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Active side indicator */}
            {activeTab === tab.id && (
              <motion.div
                className={styles.activeIndicator}
                layoutId="activeIndicator"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={springConfig}
              />
            )}
            <motion.div
              className={styles.iconWrapper}
              animate={{
                scale: activeTab === tab.id ? 1.08 : 1,
              }}
              transition={springConfig}
            >
              <tab.icon size={20} />
            </motion.div>
            <span className={styles.tooltip}>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      <div className={styles.sidebarFooter}>
        <span className={styles.version}>{APP_VERSION}</span>
      </div>
    </nav>
  );
}
