import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ThemeName,
  TabId,
  User,
  ShoppingList,
  ShoppingItem,
  Email,
  MailFilter,
  CalendarEvent,
  Todo,
  TodoStatus,
  Note,
  Folder,
  NotificationSettings,
  JumboProduct
} from '../types';
import type { Language } from '../lib/translations';

interface AppStore {
  // Theme & Language
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // Navigation
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // User
  user: User | null;
  isGirlfriendMode: boolean;
  setUser: (user: User | null) => void;
  setGirlfriendMode: (isGirlfriend: boolean) => void;

  // Shopping
  shoppingLists: ShoppingList[];
  selectedShoppingListId: string | null;
  jumboProducts: JumboProduct[];
  addShoppingList: (list: Omit<ShoppingList, 'id'>) => void;
  updateShoppingList: (id: string, updates: Partial<ShoppingList>) => void;
  deleteShoppingList: (id: string) => void;
  selectShoppingList: (id: string | null) => void;
  addShoppingItem: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
  updateShoppingItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  removeShoppingItem: (listId: string, itemId: string) => void;
  toggleShoppingItem: (listId: string, itemId: string) => void;
  setJumboProducts: (products: JumboProduct[]) => void;

  // Mail
  emails: Email[];
  mailFilter: MailFilter;
  selectedEmailId: string | null;
  setEmails: (emails: Email[]) => void;
  addEmail: (email: Email) => void;
  setMailFilter: (filter: MailFilter) => void;
  selectEmail: (id: string | null) => void;
  markEmailAsRead: (id: string) => void;
  toggleEmailStar: (id: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  selectedDate: Date;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  setSelectedDate: (date: Date) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;

  // Todos
  todos: Todo[];
  activeTodoTimer: string | null;
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  moveTodo: (id: string, status: TodoStatus, targetIndex?: number) => void;
  reorderTodos: (todos: Todo[]) => void;
  startTodoTimer: (id: string) => void;
  stopTodoTimer: (id: string) => void;

  // Notes
  notes: Note[];
  folders: Folder[];
  selectedNoteId: string | null;
  selectedFolderId: string | null;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  selectNote: (id: string | null) => void;
  addFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  selectFolder: (id: string | null) => void;

  // Notifications
  notificationsEnabled: boolean;
  notificationSettings: NotificationSettings;
  setNotificationsEnabled: (enabled: boolean) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Theme & Language
      theme: 'aurora',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme === 'aurora' ? '' : theme);
        set({ theme });
      },
      language: 'nl',
      setLanguage: (language) => set({ language }),

      // Navigation
      activeTab: 'home',
      setActiveTab: (activeTab) => set({ activeTab }),

      // User
      user: null,
      isGirlfriendMode: false,
      setUser: (user) => set({ user }),
      setGirlfriendMode: (isGirlfriendMode) => set({ isGirlfriendMode }),

      // Shopping
      shoppingLists: [],
      selectedShoppingListId: null,
      jumboProducts: [],
      addShoppingList: (list) => set((state) => ({
        shoppingLists: [...state.shoppingLists, { ...list, id: generateId() }]
      })),
      updateShoppingList: (id, updates) => set((state) => ({
        shoppingLists: state.shoppingLists.map((list) =>
          list.id === id ? { ...list, ...updates } : list
        )
      })),
      deleteShoppingList: (id) => set((state) => ({
        shoppingLists: state.shoppingLists.filter((list) => list.id !== id),
        selectedShoppingListId: state.selectedShoppingListId === id ? null : state.selectedShoppingListId
      })),
      selectShoppingList: (id) => set({ selectedShoppingListId: id }),
      addShoppingItem: (listId, item) => set((state) => ({
        shoppingLists: state.shoppingLists.map((list) =>
          list.id === listId
            ? { ...list, items: [...list.items, { ...item, id: generateId() }] }
            : list
        )
      })),
      updateShoppingItem: (listId, itemId, updates) => set((state) => ({
        shoppingLists: state.shoppingLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? { ...item, ...updates } : item
                )
              }
            : list
        )
      })),
      removeShoppingItem: (listId, itemId) => set((state) => ({
        shoppingLists: state.shoppingLists.map((list) =>
          list.id === listId
            ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
            : list
        )
      })),
      toggleShoppingItem: (listId, itemId) => set((state) => ({
        shoppingLists: state.shoppingLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item.id === itemId ? { ...item, checked: !item.checked } : item
                )
              }
            : list
        )
      })),
      setJumboProducts: (products) => set({ jumboProducts: products }),

      // Mail
      emails: [],
      mailFilter: 'all',
      selectedEmailId: null,
      setEmails: (emails) => set({ emails }),
      addEmail: (email) => set((state) => ({
        emails: [email, ...state.emails]
      })),
      setMailFilter: (mailFilter) => set({ mailFilter }),
      selectEmail: (id) => set({ selectedEmailId: id }),
      markEmailAsRead: (id) => set((state) => ({
        emails: state.emails.map((email) =>
          email.id === id ? { ...email, isRead: true } : email
        )
      })),
      toggleEmailStar: (id) => set((state) => ({
        emails: state.emails.map((email) =>
          email.id === id ? { ...email, isStarred: !email.isStarred } : email
        )
      })),

      // Calendar
      calendarEvents: [],
      selectedDate: new Date(),
      addCalendarEvent: (event) => set((state) => ({
        calendarEvents: [...state.calendarEvents, { ...event, id: generateId() }]
      })),
      updateCalendarEvent: (id, updates) => set((state) => ({
        calendarEvents: state.calendarEvents.map((event) =>
          event.id === id ? { ...event, ...updates } : event
        )
      })),
      deleteCalendarEvent: (id) => set((state) => ({
        calendarEvents: state.calendarEvents.filter((event) => event.id !== id)
      })),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setCalendarEvents: (events) => set({ calendarEvents: events }),

      // Todos
      todos: [],
      activeTodoTimer: null,
      addTodo: (todo) => {
        const todos = get().todos;
        const order = todos.filter(t => t.status === todo.status).length;
        set((state) => ({
          todos: [...state.todos, {
            ...todo,
            id: generateId(),
            createdAt: new Date(),
            updatedAt: new Date(),
            order
          }]
        }));
      },
      updateTodo: (id, updates) => set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, ...updates, updatedAt: new Date() } : todo
        )
      })),
      deleteTodo: (id) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
        activeTodoTimer: state.activeTodoTimer === id ? null : state.activeTodoTimer
      })),
      moveTodo: (id, status, targetIndex?: number) => set((state) => {
        const todo = state.todos.find(t => t.id === id);
        if (!todo) return state;

        // Get all todos in the target status
        const targetTodos = state.todos
          .filter(t => t.status === status && t.id !== id)
          .sort((a, b) => a.order - b.order);

        // Calculate new order
        let newOrder: number;
        if (targetIndex !== undefined && targetIndex >= 0 && targetIndex < targetTodos.length) {
          // Insert at specific position
          newOrder = targetIndex;
        } else {
          // Add at the end
          newOrder = targetTodos.length;
        }

        // Update orders for all affected todos
        const updatedTodos = state.todos.map(t => {
          if (t.id === id) {
            return { ...t, status, order: newOrder, updatedAt: new Date() };
          }
          if (t.status === status && t.id !== id) {
            const currentIndex = targetTodos.findIndex(tt => tt.id === t.id);
            if (currentIndex >= newOrder) {
              return { ...t, order: currentIndex + 1 };
            }
          }
          return t;
        });

        return { todos: updatedTodos };
      }),
      reorderTodos: (todos) => set({ todos }),
      startTodoTimer: (id) => set((state) => ({
        activeTodoTimer: id,
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, timerStarted: new Date() } : todo
        )
      })),
      stopTodoTimer: (id) => set((state) => ({
        activeTodoTimer: null,
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, timerEnded: new Date() } : todo
        )
      })),

      // Notes
      notes: [],
      folders: [],
      selectedNoteId: null,
      selectedFolderId: null,
      addNote: (note) => set((state) => ({
        notes: [...state.notes, {
          ...note,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      })),
      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
        )
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId
      })),
      selectNote: (id) => set({ selectedNoteId: id }),
      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, { ...folder, id: generateId(), createdAt: new Date() }]
      })),
      updateFolder: (id, updates) => set((state) => ({
        folders: state.folders.map((folder) =>
          folder.id === id ? { ...folder, ...updates } : folder
        )
      })),
      deleteFolder: (id) => set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        notes: state.notes.map((note) =>
          note.folderId === id ? { ...note, folderId: undefined } : note
        ),
        selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId
      })),
      selectFolder: (id) => set({ selectedFolderId: id }),

      // Notifications
      notificationsEnabled: true,
      notificationSettings: {
        enabled: true,
        todoTimers: true,
        calendarReminders: true,
        shoppingListUpdates: true,
        emailNotifications: true,
        reminderMinutes: 15
      },
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings }
      }))
    }),
    {
      name: 'flowstate-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        shoppingLists: state.shoppingLists,
        todos: state.todos,
        notes: state.notes,
        folders: state.folders,
        notificationsEnabled: state.notificationsEnabled,
        notificationSettings: state.notificationSettings,
        isGirlfriendMode: state.isGirlfriendMode
      })
    }
  )
);
