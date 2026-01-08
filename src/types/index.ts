// Theme types
export type ThemeName = 'aurora' | 'ocean' | 'forest' | 'ember' | 'sakura' | 'frost' | 'ivory' | 'midnight' | 'neon' | 'rose' | 'cotton' | 'mint' | 'lavender' | 'seafoam';

export interface Theme {
  id: ThemeName;
  name: string;
  isDark: boolean;
  preview: string;
}

// Tab types
export type TabId = 'home' | 'shopping' | 'mail' | 'calendar' | 'todos' | 'notes' | 'settings';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  isGirlfriend?: boolean;
}

// Shopping types
export interface ShoppingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  checked: boolean;
  addedBy: string;
  addedAt: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  date: Date;
  items: ShoppingItem[];
  createdBy: string;
  sharedWith: string[];
}

export interface JumboProduct {
  id: string;
  name: string;
  price: number;
  unitPrice?: string;
  imageUrl: string;
  category: string;
  isOnSale?: boolean;
  salePrice?: number;
}

// Mail types
export type MailProvider = 'gmail' | 'outlook';
export type MailFilter = 'main' | 'school' | 'all';

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface Email {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  provider: MailProvider;
  labels: string[];
  hasAttachment: boolean;
  attachments?: EmailAttachment[];
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  provider: 'google' | 'outlook' | 'local';
  location?: string;
  attendees?: string[];
  isShoppingList?: boolean;
  shoppingListId?: string;
}

// Todo types
export type TodoStatus = 'do' | 'doing' | 'done';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  timer?: number; // in minutes
  timerStarted?: Date;
  timerEnded?: Date;
  createdAt: Date;
  updatedAt: Date;
  order: number;
}

// Notes types
export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  parentId?: string;
  createdAt: Date;
}

// Notification types
export interface NotificationSettings {
  enabled: boolean;
  todoTimers: boolean;
  calendarReminders: boolean;
  shoppingListUpdates: boolean;
  emailNotifications: boolean;
  reminderMinutes: number;
}

// App state
export interface AppState {
  theme: ThemeName;
  activeTab: TabId;
  user: User | null;
  notificationsEnabled: boolean;
  notificationSettings: NotificationSettings;
  isAuthenticated: boolean;
}
