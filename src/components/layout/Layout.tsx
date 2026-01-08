import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { useStore } from '../../store/useStore';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { activeTab, notificationsEnabled, setNotificationsEnabled } = useStore();

  return (
    <div className={styles.layout}>
      <div className={styles.backgroundGlow} />

      <Header
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
      />

      <div className={styles.container}>
        <Navigation />

        <main className={styles.main}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className={styles.content}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <Navigation mobile />
    </div>
  );
}
