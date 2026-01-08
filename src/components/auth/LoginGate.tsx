import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useStore } from '../../store/useStore';
import styles from './LoginGate.module.css';

// Passwords for access
// Main user password (you) and girlfriend password
const MAIN_PASSWORD = 'Doffen58??';
const GIRLFRIEND_PASSWORD = 'mamma123';
const VALID_PASSWORDS = [MAIN_PASSWORD, GIRLFRIEND_PASSWORD];

interface LoginGateProps {
  children: React.ReactNode;
}

export function LoginGate({ children }: LoginGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setGirlfriendMode } = useStore();

  // Check if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem('flowstate_auth');
    const authExpiry = localStorage.getItem('flowstate_auth_expiry');
    const authMode = localStorage.getItem('flowstate_auth_mode');

    if (authToken && authExpiry) {
      const expiry = parseInt(authExpiry, 10);
      if (Date.now() < expiry) {
        setIsAuthenticated(true);
        // Restore girlfriend mode from storage
        setGirlfriendMode(authMode === 'girlfriend');
      } else {
        // Clear expired auth
        localStorage.removeItem('flowstate_auth');
        localStorage.removeItem('flowstate_auth_expiry');
        localStorage.removeItem('flowstate_auth_mode');
        setGirlfriendMode(false);
      }
    }
    setIsLoading(false);
  }, [setGirlfriendMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Simulate a small delay for security
    await new Promise(resolve => setTimeout(resolve, 500));

    if (VALID_PASSWORDS.includes(password)) {
      // Set auth token with 30 day expiry
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      const isGirlfriend = password === GIRLFRIEND_PASSWORD;
      localStorage.setItem('flowstate_auth', 'authenticated');
      localStorage.setItem('flowstate_auth_expiry', expiry.toString());
      localStorage.setItem('flowstate_auth_mode', isGirlfriend ? 'girlfriend' : 'main');
      setGirlfriendMode(isGirlfriend);
      setIsAuthenticated(true);
    } else {
      setError('Incorrect password');
    }
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('flowstate_auth');
    localStorage.removeItem('flowstate_auth_expiry');
    localStorage.removeItem('flowstate_auth_mode');
    setGirlfriendMode(false);
    setIsAuthenticated(false);
    setPassword('');
  };

  // Expose logout function globally for settings page
  useEffect(() => {
    (window as unknown as { flowstateLogout: () => void }).flowstateLogout = handleLogout;
    return () => {
      delete (window as unknown as { flowstateLogout?: () => void }).flowstateLogout;
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={32} className={styles.spinner} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlow} />

      <motion.div
        className={styles.loginCard}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.logoContainer}>
          <motion.div
            className={styles.logo}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Lock size={28} />
          </motion.div>
        </div>

        <h1 className={styles.title}>Flowstate</h1>
        <p className={styles.subtitle}>Enter your password to continue</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputWrapper}>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              error={error}
              autoFocus
            />
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !password}
            icon={isSubmitting ? <Loader2 size={18} className={styles.spinner} /> : undefined}
            className={styles.loginButton}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className={styles.hint}>
          Private access only
        </p>
      </motion.div>
    </div>
  );
}
