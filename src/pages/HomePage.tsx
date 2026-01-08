import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckSquare,
  ShoppingCart,
  Mail,
  Clock,
  MapPin,
  ChevronRight,
  Star
} from 'lucide-react';
import { format, isToday, isTomorrow, addDays, isAfter, startOfDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import {
  isGoogleCalendarConnected,
  fetchGoogleCalendarEvents,
  type ParsedCalendarEvent
} from '../lib/googleCalendar-functions';
import {
  isGmailConnected,
  fetchGmailMessages
} from '../lib/gmail-functions';
import type { Email } from '../types';
import styles from './HomePage.module.css';

export function HomePage() {
  const {
    calendarEvents,
    todos,
    shoppingLists,
    setActiveTab
  } = useStore();

  const [googleEvents, setGoogleEvents] = useState<ParsedCalendarEvent[]>([]);
  const [gmailEmails, setGmailEmails] = useState<Email[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);

  // Fetch Google Calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      if (isGoogleCalendarConnected()) {
        setIsLoadingCalendar(true);
        try {
          const now = new Date();
          const futureDate = addDays(now, 30);
          const events = await fetchGoogleCalendarEvents(now, futureDate);
          setGoogleEvents(events);
        } catch (error) {
          console.error('Failed to fetch calendar events:', error);
        } finally {
          setIsLoadingCalendar(false);
        }
      }
    };
    fetchEvents();
  }, []);

  // Fetch Gmail emails
  useEffect(() => {
    const fetchEmails = async () => {
      if (isGmailConnected()) {
        setIsLoadingEmails(true);
        try {
          const emails = await fetchGmailMessages(10, 'INBOX');
          setGmailEmails(emails);
        } catch (error) {
          console.error('Failed to fetch emails:', error);
        } finally {
          setIsLoadingEmails(false);
        }
      }
    };
    fetchEmails();
  }, []);

  // Get upcoming events (today and future)
  const upcomingEvents = useMemo(() => {
    const now = startOfDay(new Date());
    const allEvents = [
      ...calendarEvents.map(e => ({
        ...e,
        start: new Date(e.start),
        end: new Date(e.end),
        provider: e.provider as 'local' | 'google'
      })),
      ...googleEvents
    ];

    return allEvents
      .filter(event => isAfter(new Date(event.start), now) || isToday(new Date(event.start)))
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 10);
  }, [calendarEvents, googleEvents]);

  // Get active todos (doing status)
  const activeTodos = useMemo(() => {
    return todos
      .filter(todo => todo.status === 'doing')
      .sort((a, b) => a.order - b.order);
  }, [todos]);

  // Get today's shopping list
  const todayShoppingList = useMemo(() => {
    const today = startOfDay(new Date());
    return shoppingLists.find(list => {
      const listDate = startOfDay(new Date(list.date));
      return listDate.getTime() === today.getTime();
    });
  }, [shoppingLists]);

  // Get recent unread emails
  const recentEmails = useMemo(() => {
    return gmailEmails
      .filter(email => !email.isRead)
      .slice(0, 8);
  }, [gmailEmails]);

  const formatEventDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const formatEmailDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    return format(d, 'MMM d');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className={styles.grid}>
        {/* Upcoming Events */}
        <Card className={styles.widget}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <Calendar size={18} />
              <h3>Upcoming Events</h3>
            </div>
            <button
              className={styles.viewAllButton}
              onClick={() => setActiveTab('calendar')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.widgetContent}>
            {isLoadingCalendar ? (
              <div className={styles.loading}>Loading events...</div>
            ) : upcomingEvents.length > 0 ? (
              <div className={styles.scrollableList}>
                {upcomingEvents.map((event, index) => (
                  <motion.div
                    key={`${event.id}-${index}`}
                    className={styles.eventItem}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={`${styles.eventDot} ${event.provider === 'google' ? styles.google : ''}`} />
                    <div className={styles.eventInfo}>
                      <span className={styles.eventTitle}>{event.title}</span>
                      <div className={styles.eventMeta}>
                        <span className={styles.eventDate}>
                          {formatEventDate(new Date(event.start))}
                        </span>
                        {!event.allDay && (
                          <span className={styles.eventTime}>
                            <Clock size={10} />
                            {format(new Date(event.start), 'h:mm a')}
                          </span>
                        )}
                        {event.location && (
                          <span className={styles.eventLocation}>
                            <MapPin size={10} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Calendar size={24} />
                <p>No upcoming events</p>
              </div>
            )}
          </div>
        </Card>

        {/* New Emails */}
        <Card className={styles.widget}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <Mail size={18} />
              <h3>New Emails</h3>
            </div>
            <button
              className={styles.viewAllButton}
              onClick={() => setActiveTab('mail')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.widgetContent}>
            {isLoadingEmails ? (
              <div className={styles.loading}>Loading emails...</div>
            ) : recentEmails.length > 0 ? (
              <div className={styles.scrollableList}>
                {recentEmails.map((email, index) => (
                  <motion.div
                    key={email.id}
                    className={styles.emailItem}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setActiveTab('mail')}
                  >
                    <div className={styles.emailAvatar}>
                      {email.from.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.emailInfo}>
                      <div className={styles.emailHeader}>
                        <span className={styles.emailFrom}>{email.from}</span>
                        <span className={styles.emailDate}>{formatEmailDate(email.date)}</span>
                      </div>
                      <span className={styles.emailSubject}>{email.subject}</span>
                      <span className={styles.emailPreview}>{email.preview}</span>
                    </div>
                    {email.isStarred && <Star size={14} className={styles.emailStar} />}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Mail size={24} />
                <p>No new emails</p>
              </div>
            )}
          </div>
        </Card>

        {/* Shopping List */}
        <Card className={styles.widget}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <ShoppingCart size={18} />
              <h3>Today's Shopping</h3>
            </div>
            <button
              className={styles.viewAllButton}
              onClick={() => setActiveTab('shopping')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.widgetContent}>
            {todayShoppingList && todayShoppingList.items.length > 0 ? (
              <div className={styles.shoppingList}>
                {todayShoppingList.items.slice(0, 8).map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`${styles.shoppingItem} ${item.checked ? styles.checked : ''}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={styles.shoppingCheckbox} />
                    <span className={styles.shoppingName}>{item.name}</span>
                    <span className={styles.shoppingQuantity}>x{item.quantity}</span>
                  </motion.div>
                ))}
                {todayShoppingList.items.length > 8 && (
                  <div className={styles.moreItems}>
                    +{todayShoppingList.items.length - 8} more items
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <ShoppingCart size={24} />
                <p>No shopping list for today</p>
              </div>
            )}
          </div>
        </Card>

        {/* Active Tasks */}
        <Card className={styles.widget}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <CheckSquare size={18} />
              <h3>Active Tasks</h3>
            </div>
            <button
              className={styles.viewAllButton}
              onClick={() => setActiveTab('todos')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className={styles.widgetContent}>
            {activeTodos.length > 0 ? (
              <div className={styles.taskList}>
                {activeTodos.map((todo, index) => (
                  <motion.div
                    key={todo.id}
                    className={styles.taskItem}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className={styles.taskIndicator} />
                    <div className={styles.taskInfo}>
                      <span className={styles.taskTitle}>{todo.title}</span>
                      {todo.description && (
                        <span className={styles.taskDescription}>{todo.description}</span>
                      )}
                      {todo.timer && (
                        <span className={styles.taskTimer}>
                          <Clock size={10} />
                          {todo.timer} min
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <CheckSquare size={24} />
                <p>No active tasks</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
