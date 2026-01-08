import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Bell,
  Mail,
  Lock,
  Smartphone,
  Moon,
  Sun,
  CheckCircle2,
  Loader2,
  LogOut,
  Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  initGmailAuth,
  connectGmail,
  disconnectGmail,
  isGmailConnected
} from '../lib/gmail';
import type { ThemeName } from '../types';
import styles from './SettingsPage.module.css';

const themes: { id: ThemeName; name: string; isDark: boolean; colors: string[] }[] = [
  // Dark themes
  { id: 'aurora', name: 'Aurora', isDark: true, colors: ['#8b5cf6', '#06d6a0', '#f472b6'] },
  { id: 'ocean', name: 'Ocean', isDark: true, colors: ['#38bdf8', '#22d3ee', '#818cf8'] },
  { id: 'forest', name: 'Forest', isDark: true, colors: ['#22c55e', '#4ade80', '#a3e635'] },
  { id: 'ember', name: 'Ember', isDark: true, colors: ['#fb923c', '#fbbf24', '#f87171'] },
  { id: 'sakura', name: 'Sakura', isDark: true, colors: ['#f472b6', '#fb7185', '#c084fc'] },
  { id: 'midnight', name: 'Midnight', isDark: true, colors: ['#3b82f6', '#6366f1', '#8b5cf6'] },
  { id: 'neon', name: 'Neon', isDark: true, colors: ['#22d3ee', '#4ade80', '#f472b6'] },
  { id: 'rose', name: 'Rose', isDark: true, colors: ['#fb7185', '#f472b6', '#fda4af'] },
  // Light themes
  { id: 'frost', name: 'Frost', isDark: false, colors: ['#7c3aed', '#0891b2', '#db2777'] },
  { id: 'ivory', name: 'Ivory', isDark: false, colors: ['#b45309', '#059669', '#be185d'] },
  { id: 'cotton', name: 'Cotton', isDark: false, colors: ['#3b82f6', '#6366f1', '#8b5cf6'] },
  { id: 'mint', name: 'Mint', isDark: false, colors: ['#10b981', '#14b8a6', '#22d3ee'] },
  { id: 'lavender', name: 'Lavender', isDark: false, colors: ['#a855f7', '#c084fc', '#e879f9'] },
  { id: 'seafoam', name: 'Seafoam', isDark: false, colors: ['#0d9488', '#14b8a6', '#06b6d4'] }
];

export function SettingsPage() {
  const {
    theme,
    setTheme,
    notificationsEnabled,
    notificationSettings,
    setNotificationsEnabled,
    updateNotificationSettings,
    isGirlfriendMode,
    setGirlfriendMode
  } = useStore();

  const [girlfriendPassword, setGirlfriendPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [_showSuccess, setShowSuccess] = useState(false);

  // Gmail connection state
  const [gmailConnected, setGmailConnected] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailError, setGmailError] = useState<string | null>(null);

  // Check Gmail connection on mount
  useEffect(() => {
    const checkGmailConnection = async () => {
      try {
        await initGmailAuth();
        setGmailConnected(isGmailConnected());
      } catch (error) {
        console.error('Failed to check Gmail connection:', error);
      }
    };
    checkGmailConnection();
  }, []);

  const handleConnectGmail = async () => {
    setIsConnectingGmail(true);
    setGmailError(null);
    try {
      await initGmailAuth();
      await connectGmail();
      setGmailConnected(true);
    } catch (error) {
      console.error('Gmail connection failed:', error);
      setGmailError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnectingGmail(false);
    }
  };

  const handleDisconnectGmail = () => {
    disconnectGmail();
    setGmailConnected(false);
  };

  const handleThemeChange = (newTheme: ThemeName) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme === 'aurora' ? '' : newTheme);
  };

  const handleGirlfriendLogin = () => {
    if (girlfriendPassword === 'mamma123') {
      setGirlfriendMode(true);
      setPasswordError('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
      }
    }
  };

  // currentTheme available for future use
void themes.find(t => t.id === theme);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize your experience</p>
      </div>

      <div className={styles.sections}>
        {/* Theme Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Palette size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              <p className={styles.sectionDescription}>Choose your color theme</p>
            </div>
          </div>

          <div className={styles.themeGrid}>
            {themes.map((t) => (
              <motion.button
                key={t.id}
                className={`${styles.themeCard} ${theme === t.id ? styles.active : ''}`}
                onClick={() => handleThemeChange(t.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={styles.themePreview}
                  style={{
                    background: t.isDark
                      ? `linear-gradient(135deg, ${t.colors[0]}20 0%, ${t.colors[1]}20 50%, ${t.colors[2]}20 100%)`
                      : `linear-gradient(135deg, ${t.colors[0]}15 0%, ${t.colors[1]}15 50%, ${t.colors[2]}15 100%)`,
                    borderColor: theme === t.id ? t.colors[0] : 'transparent'
                  }}
                >
                  <div className={styles.themeColors}>
                    {t.colors.map((color, i) => (
                      <span key={i} className={styles.themeColor} style={{ background: color }} />
                    ))}
                  </div>
                  {t.isDark ? <Moon size={14} /> : <Sun size={14} />}
                </div>
                <span className={styles.themeName}>{t.name}</span>
                {theme === t.id && (
                  <CheckCircle2 size={16} className={styles.themeCheck} />
                )}
              </motion.button>
            ))}
          </div>
        </Card>

        {/* Notifications Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              <p className={styles.sectionDescription}>Manage your notification preferences</p>
            </div>
          </div>

          <div className={styles.settingsList}>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Push Notifications</span>
                <span className={styles.settingDescription}>
                  Receive notifications on your device
                </span>
              </div>
              <button
                className={`${styles.toggle} ${notificationsEnabled ? styles.on : ''}`}
                onClick={() => {
                  if (!notificationsEnabled) {
                    handleRequestNotificationPermission();
                  } else {
                    setNotificationsEnabled(false);
                  }
                }}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Timer Alerts</span>
                <span className={styles.settingDescription}>
                  Get notified when task timers complete
                </span>
              </div>
              <button
                className={`${styles.toggle} ${notificationSettings.todoTimers ? styles.on : ''}`}
                onClick={() => updateNotificationSettings({ todoTimers: !notificationSettings.todoTimers })}
                disabled={!notificationsEnabled}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Calendar Reminders</span>
                <span className={styles.settingDescription}>
                  Get reminded before events
                </span>
              </div>
              <button
                className={`${styles.toggle} ${notificationSettings.calendarReminders ? styles.on : ''}`}
                onClick={() => updateNotificationSettings({ calendarReminders: !notificationSettings.calendarReminders })}
                disabled={!notificationsEnabled}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Shopping List Updates</span>
                <span className={styles.settingDescription}>
                  Get notified when items are added/changed
                </span>
              </div>
              <button
                className={`${styles.toggle} ${notificationSettings.shoppingListUpdates ? styles.on : ''}`}
                onClick={() => updateNotificationSettings({ shoppingListUpdates: !notificationSettings.shoppingListUpdates })}
                disabled={!notificationsEnabled}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>
        </Card>

        {/* Shared Access Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Lock size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Shared Access</h2>
              <p className={styles.sectionDescription}>Allow your girlfriend to access shopping lists & calendar</p>
            </div>
          </div>

          <div className={styles.sharedAccess}>
            {isGirlfriendMode ? (
              <div className={styles.accessGranted}>
                <CheckCircle2 size={24} />
                <div>
                  <span className={styles.accessTitle}>Shared access active</span>
                  <span className={styles.accessDescription}>
                    Shopping lists and calendar are now editable
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setGirlfriendMode(false)}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className={styles.accessForm}>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={girlfriendPassword}
                  onChange={(e) => {
                    setGirlfriendPassword(e.target.value);
                    setPasswordError('');
                  }}
                  error={passwordError}
                />
                <Button onClick={handleGirlfriendLogin}>
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Connections Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Mail size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Connected Accounts</h2>
              <p className={styles.sectionDescription}>Link your email and calendar accounts</p>
            </div>
          </div>

          <div className={styles.connectionsList}>
            <div className={styles.connectionItem}>
              <div className={styles.connectionIcon} style={{ background: '#ea4335' }}>
                <Mail size={18} />
              </div>
              <div className={styles.connectionInfo}>
                <span className={styles.connectionName}>Google (Gmail)</span>
                <span className={`${styles.connectionStatus} ${gmailConnected ? styles.connected : ''}`}>
                  {gmailConnected ? 'Connected' : 'Not connected'}
                </span>
                {gmailError && (
                  <span className={styles.connectionError}>{gmailError}</span>
                )}
              </div>
              {gmailConnected ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDisconnectGmail}
                  icon={<LogOut size={14} />}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConnectGmail}
                  disabled={isConnectingGmail}
                  icon={isConnectingGmail ? <Loader2 size={14} className={styles.spinning} /> : undefined}
                >
                  {isConnectingGmail ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </div>

            <div className={styles.connectionItem}>
              <div className={styles.connectionIcon} style={{ background: '#0078d4' }}>
                <Mail size={18} />
              </div>
              <div className={styles.connectionInfo}>
                <span className={styles.connectionName}>School Email (IMAP)</span>
                <span className={styles.connectionStatus}>Not connected</span>
                <span className={styles.connectionHint}>
                  Use IMAP settings from your school
                </span>
              </div>
              <Button variant="secondary" size="sm" disabled>
                Setup
              </Button>
            </div>
          </div>
        </Card>

        {/* Install App Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Smartphone size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Install App</h2>
              <p className={styles.sectionDescription}>Add Flowstate to your home screen</p>
            </div>
          </div>

          <div className={styles.installInfo}>
            <p>
              Flowstate can be installed as an app on your iPhone or Mac for quick access.
              It works offline and feels like a native app.
            </p>
            <div className={styles.installSteps}>
              <div className={styles.installStep}>
                <span className={styles.stepNumber}>1</span>
                <span>Tap the Share button in Safari</span>
              </div>
              <div className={styles.installStep}>
                <span className={styles.stepNumber}>2</span>
                <span>Select "Add to Home Screen"</span>
              </div>
              <div className={styles.installStep}>
                <span className={styles.stepNumber}>3</span>
                <span>Tap "Add" to install</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Security Section */}
        <Card className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shield size={20} />
            <div>
              <h2 className={styles.sectionTitle}>Account Security</h2>
              <p className={styles.sectionDescription}>Manage your session</p>
            </div>
          </div>

          <div className={styles.securityActions}>
            <Button
              variant="secondary"
              icon={<LogOut size={16} />}
              onClick={() => {
                if ((window as unknown as { flowstateLogout?: () => void }).flowstateLogout) {
                  (window as unknown as { flowstateLogout: () => void }).flowstateLogout();
                }
              }}
            >
              Sign Out of Flowstate
            </Button>
            <p className={styles.securityHint}>
              You will need to enter your password to access Flowstate again
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
