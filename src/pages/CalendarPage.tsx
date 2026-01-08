import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Trash2,
  ShoppingCart,
  X,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  initCalendarAuth,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  isGoogleCalendarConnected,
  fetchGoogleCalendarEvents,
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  type ParsedCalendarEvent
} from '../lib/googleCalendar';
import styles from './CalendarPage.module.css';

export function CalendarPage() {
  const {
    calendarEvents,
    selectedDate,
    setSelectedDate,
    addCalendarEvent,
    deleteCalendarEvent,
    shoppingLists
  } = useStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    allDay: false
  });

  // Google Calendar state
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<ParsedCalendarEvent[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncToGoogle, setSyncToGoogle] = useState(true); // Option to sync to Google
  const [isDeletingEvent, setIsDeletingEvent] = useState<string | null>(null);

  // Check Google Calendar connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await initCalendarAuth();
        const connected = isGoogleCalendarConnected();
        setGoogleCalendarConnected(connected);
        if (connected) {
          await syncGoogleCalendar();
        }
      } catch (error) {
        console.error('Failed to check Google Calendar connection:', error);
      }
    };
    checkConnection();
  }, []);

  // Sync Google Calendar events
  const syncGoogleCalendar = async () => {
    if (!isGoogleCalendarConnected()) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Fetch events for 2 months (current and next)
      const timeMin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const timeMax = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0);

      const events = await fetchGoogleCalendarEvents(timeMin, timeMax);
      setGoogleEvents(events);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to sync Google Calendar:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Connect to Google Calendar
  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setSyncError(null);

    try {
      await initCalendarAuth();
      await connectGoogleCalendar();
      setGoogleCalendarConnected(true);
      await syncGoogleCalendar();
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
      setSyncError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar();
    setGoogleCalendarConnected(false);
    setGoogleEvents([]);
    setLastSynced(null);
  };

  // Resync when month changes
  useEffect(() => {
    if (googleCalendarConnected) {
      syncGoogleCalendar();
    }
  }, [currentMonth]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Get local events for a date
  const localEventsForDate = (date: Date) => {
    return calendarEvents.filter(event =>
      isSameDay(new Date(event.start), date)
    );
  };

  // Get Google Calendar events for a date
  const googleEventsForDate = (date: Date) => {
    return googleEvents.filter(event =>
      isSameDay(new Date(event.start), date)
    );
  };

  // Combined events for a date (local + google)
  // const eventsForDate = (date: Date) => {
  //   return [...localEventsForDate(date), ...googleEventsForDate(date)];
  // };

  const shoppingListsForDate = (date: Date) => {
    return shoppingLists.filter(list =>
      isSameDay(new Date(list.date), date)
    );
  };

  // All events for selected date
  const selectedDateLocalEvents = useMemo(() => {
    return localEventsForDate(selectedDate);
  }, [selectedDate, calendarEvents]);

  const selectedDateGoogleEvents = useMemo(() => {
    return googleEventsForDate(selectedDate);
  }, [selectedDate, googleEvents]);

  const selectedDateShoppingLists = useMemo(() => {
    return shoppingListsForDate(selectedDate);
  }, [selectedDate, shoppingLists]);

  const hasEventsOnSelectedDate = selectedDateLocalEvents.length > 0 || selectedDateGoogleEvents.length > 0;

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) return;

    const startDate = new Date(`${newEvent.date}T${newEvent.startTime}`);
    const endDate = new Date(`${newEvent.date}T${newEvent.endTime}`);

    setIsCreatingEvent(true);
    setSyncError(null);

    try {
      // If connected to Google Calendar and sync is enabled, create event there
      if (googleCalendarConnected && syncToGoogle) {
        const googleEvent = await createGoogleCalendarEvent({
          title: newEvent.title,
          description: newEvent.description || undefined,
          start: startDate,
          end: endDate,
          allDay: newEvent.allDay,
          location: newEvent.location || undefined,
        });

        // Add the Google event to our local Google events list
        setGoogleEvents(prev => [...prev, googleEvent]);
      } else {
        // Create as local event only
        addCalendarEvent({
          title: newEvent.title,
          description: newEvent.description,
          start: startDate,
          end: endDate,
          allDay: newEvent.allDay,
          location: newEvent.location,
          provider: 'local'
        });
      }

      setNewEvent({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        allDay: false
      });
      setShowEventModal(false);
    } catch (error) {
      console.error('Failed to create event:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to create event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // Delete Google Calendar event
  const handleDeleteGoogleEvent = async (eventId: string) => {
    setIsDeletingEvent(eventId);
    setSyncError(null);

    try {
      await deleteGoogleCalendarEvent(eventId);
      // Remove from local state
      setGoogleEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to delete event');
    } finally {
      setIsDeletingEvent(null);
    }
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendar</h1>
          <p className={styles.subtitle}>
            {googleCalendarConnected
              ? lastSynced
                ? `Synced ${format(lastSynced, 'h:mm a')}`
                : 'Google Calendar connected'
              : 'Connect Google Calendar to sync events'}
          </p>
        </div>
        <div className={styles.headerActions}>
          {googleCalendarConnected ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={isSyncing ? <Loader2 size={16} className={styles.spinning} /> : <RefreshCw size={16} />}
                onClick={syncGoogleCalendar}
                disabled={isSyncing}
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnectGoogle}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              icon={isConnecting ? <Loader2 size={16} className={styles.spinning} /> : <CalendarIcon size={16} />}
              onClick={handleConnectGoogle}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Google'}
            </Button>
          )}
          <Button
            icon={<Plus size={18} />}
            onClick={() => {
              setNewEvent(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
              setShowEventModal(true);
            }}
          >
            New Event
          </Button>
        </div>
      </div>

      {syncError && (
        <div className={styles.syncError}>
          {syncError}
        </div>
      )}

      <div className={styles.layout}>
        {/* Calendar Grid */}
        <Card className={styles.calendarCard} padding="none">
          <div className={styles.calendarHeader}>
            <div className={styles.calendarNav}>
              <Button variant="ghost" size="sm" icon={<ChevronLeft size={18} />} onClick={handlePrevMonth} />
              <h2 className={styles.monthTitle}>{format(currentMonth, 'MMMM yyyy')}</h2>
              <Button variant="ghost" size="sm" icon={<ChevronRight size={18} />} onClick={handleNextMonth} />
            </div>
            <Button variant="secondary" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          <div className={styles.calendarGrid}>
            <div className={styles.weekDays}>
              {weekDays.map(day => (
                <div key={day} className={styles.weekDay}>{day}</div>
              ))}
            </div>

            <div className={styles.days}>
              {calendarDays.map((day, index) => {
                const dayLocalEvents = localEventsForDate(day);
                const dayGoogleEvents = googleEventsForDate(day);
                const dayShoppingLists = shoppingListsForDate(day);
                const hasItems = dayLocalEvents.length > 0 || dayGoogleEvents.length > 0 || dayShoppingLists.length > 0;

                return (
                  <motion.button
                    key={index}
                    className={`${styles.day} ${!isSameMonth(day, currentMonth) ? styles.otherMonth : ''} ${isSameDay(day, selectedDate) ? styles.selected : ''} ${isToday(day) ? styles.today : ''}`}
                    onClick={() => setSelectedDate(day)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={styles.dayNumber}>{format(day, 'd')}</span>
                    {hasItems && (
                      <div className={styles.dayIndicators}>
                        {dayLocalEvents.length > 0 && <span className={styles.eventDot} />}
                        {dayGoogleEvents.length > 0 && <span className={`${styles.eventDot} ${styles.googleDot}`} />}
                        {dayShoppingLists.length > 0 && <span className={`${styles.eventDot} ${styles.shopping}`} />}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className={styles.calendarLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} />
              <span>Local</span>
            </div>
            {googleCalendarConnected && (
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.googleDot}`} />
                <span>Google</span>
              </div>
            )}
            <div className={styles.legendItem}>
              <span className={`${styles.legendDot} ${styles.shopping}`} />
              <span>Shopping</span>
            </div>
          </div>
        </Card>

        {/* Selected Day Detail */}
        <Card className={styles.dayDetail}>
          <div className={styles.dayDetailHeader}>
            <h3 className={styles.dayDetailTitle}>
              {format(selectedDate, 'EEEE')}
            </h3>
            <span className={styles.dayDetailDate}>
              {format(selectedDate, 'MMMM d, yyyy')}
            </span>
          </div>

          <div className={styles.eventsList}>
            {selectedDateShoppingLists.length > 0 && (
              <div className={styles.eventsSection}>
                <h4 className={styles.eventsSectionTitle}>
                  <ShoppingCart size={14} />
                  Shopping Lists
                </h4>
                {selectedDateShoppingLists.map(list => (
                  <div key={list.id} className={`${styles.eventItem} ${styles.shoppingItem}`}>
                    <div className={styles.eventItemContent}>
                      <span className={styles.eventItemTitle}>{list.name}</span>
                      <span className={styles.eventItemMeta}>
                        {list.items.length} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Google Calendar Events */}
            {selectedDateGoogleEvents.length > 0 && (
              <div className={styles.eventsSection}>
                <h4 className={styles.eventsSectionTitle}>
                  <CalendarIcon size={14} />
                  Google Calendar
                </h4>
                {selectedDateGoogleEvents.map(event => (
                  <motion.div
                    key={event.id}
                    className={styles.eventItem}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={`${styles.eventProvider} ${styles.google}`} />
                    <div className={styles.eventItemContent}>
                      <span className={styles.eventItemTitle}>{event.title}</span>
                      {!event.allDay && (
                        <span className={styles.eventItemMeta}>
                          <Clock size={12} />
                          {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                        </span>
                      )}
                      {event.allDay && (
                        <span className={styles.eventItemMeta}>
                          All day
                        </span>
                      )}
                      {event.location && (
                        <span className={styles.eventItemMeta}>
                          <MapPin size={12} />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.eventDelete}
                      onClick={() => handleDeleteGoogleEvent(event.id)}
                      disabled={isDeletingEvent === event.id}
                    >
                      {isDeletingEvent === event.id ? (
                        <Loader2 size={14} className={styles.spinning} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Local Events */}
            {selectedDateLocalEvents.length > 0 && (
              <div className={styles.eventsSection}>
                <h4 className={styles.eventsSectionTitle}>
                  <CalendarIcon size={14} />
                  Local Events
                </h4>
                {selectedDateLocalEvents.map(event => (
                  <motion.div
                    key={event.id}
                    className={styles.eventItem}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={`${styles.eventProvider} ${styles[event.provider]}`} />
                    <div className={styles.eventItemContent}>
                      <span className={styles.eventItemTitle}>{event.title}</span>
                      {!event.allDay && (
                        <span className={styles.eventItemMeta}>
                          <Clock size={12} />
                          {format(new Date(event.start), 'h:mm a')} - {format(new Date(event.end), 'h:mm a')}
                        </span>
                      )}
                      {event.location && (
                        <span className={styles.eventItemMeta}>
                          <MapPin size={12} />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <button
                      className={styles.eventDelete}
                      onClick={() => deleteCalendarEvent(event.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {!hasEventsOnSelectedDate && selectedDateShoppingLists.length === 0 && (
              <div className={styles.noEvents}>
                <CalendarIcon size={32} />
                <p>No events for this day</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNewEvent(prev => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
                    setShowEventModal(true);
                  }}
                >
                  Add Event
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* New Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>New Event</h3>
                <button className={styles.modalClose} onClick={() => setShowEventModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalContent}>
                <Input
                  label="Event Title"
                  placeholder="Meeting, appointment, etc."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                />

                <Input
                  label="Date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                />

                <div className={styles.timeInputs}>
                  <Input
                    label="Start Time"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                  <Input
                    label="End Time"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>

                <Input
                  label="Location (optional)"
                  placeholder="Where is this event?"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  icon={<MapPin size={16} />}
                />

                <Input
                  label="Description (optional)"
                  placeholder="Add more details..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                />

                {googleCalendarConnected && (
                  <label className={styles.syncCheckbox}>
                    <input
                      type="checkbox"
                      checked={syncToGoogle}
                      onChange={(e) => setSyncToGoogle(e.target.checked)}
                    />
                    <span>Sync to Google Calendar</span>
                  </label>
                )}
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" onClick={() => setShowEventModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateEvent}
                  disabled={!newEvent.title.trim() || isCreatingEvent}
                  icon={isCreatingEvent ? <Loader2 size={16} className={styles.spinning} /> : undefined}
                >
                  {isCreatingEvent ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
