import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { LoginGate } from './components/auth/LoginGate';
import { HomePage } from './pages/HomePage';
import { ShoppingPage } from './pages/ShoppingPage';
import { MailPage } from './pages/MailPage';
import { CalendarPage } from './pages/CalendarPage';
import { TodosPage } from './pages/TodosPage';
import { NotesPage } from './pages/NotesPage';
import { SettingsPage } from './pages/SettingsPage';
import { useStore } from './store/useStore';

// Tabs that are restricted in girlfriend mode
const RESTRICTED_TABS = ['mail', 'notes'];

function App() {
  const { activeTab, theme, isGirlfriendMode, setActiveTab } = useStore();

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'aurora' ? '' : theme);
  }, [theme]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // We'll ask permission when user enables notifications in settings
    }
  }, []);

  // Redirect to home if trying to access restricted pages in girlfriend mode
  useEffect(() => {
    if (isGirlfriendMode && RESTRICTED_TABS.includes(activeTab)) {
      setActiveTab('home');
    }
  }, [isGirlfriendMode, activeTab, setActiveTab]);

  const renderPage = () => {
    // Extra safety: don't render restricted pages in girlfriend mode
    if (isGirlfriendMode && RESTRICTED_TABS.includes(activeTab)) {
      return <HomePage />;
    }

    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'shopping':
        return <ShoppingPage />;
      case 'mail':
        return <MailPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'todos':
        return <TodosPage />;
      case 'notes':
        return <NotesPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <LoginGate>
      <Layout>
        {renderPage()}
      </Layout>
    </LoginGate>
  );
}

export default App;
