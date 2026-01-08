import { Bell, BellOff, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './Header.module.css';

interface HeaderProps {
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

export function Header({ notificationsEnabled, onToggleNotifications }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.logo}>
          <motion.div
            className={styles.logoIcon}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Sparkles size={20} />
          </motion.div>
          <span className={styles.logoText}>
            flow<span className={styles.logoAccent}>state</span>
          </span>
        </div>

        <div className={styles.actions}>
          <motion.button
            className={`${styles.notificationToggle} ${notificationsEnabled ? styles.active : ''}`}
            onClick={onToggleNotifications}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? (
              <Bell size={18} />
            ) : (
              <BellOff size={18} />
            )}
            <span className={styles.notificationLabel}>
              {notificationsEnabled ? 'On' : 'Off'}
            </span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
