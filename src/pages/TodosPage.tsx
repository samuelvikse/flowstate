import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent, DragOverEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Timer,
  Play,
  Pause,
  Trash2,
  GripVertical,
  X,
  Clock
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Todo, TodoStatus } from '../types';
import styles from './TodosPage.module.css';

const columns: { id: TodoStatus; title: string; color: string }[] = [
  { id: 'do', title: 'To Do', color: 'var(--accent-tertiary)' },
  { id: 'doing', title: 'Doing', color: 'var(--accent-warning)' },
  { id: 'done', title: 'Done', color: 'var(--accent-success)' }
];

// Droppable column wrapper
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={styles.columnContent}
      style={{
        background: isOver ? 'var(--bg-glass)' : undefined,
        transition: 'background 0.2s ease'
      }}
    >
      {children}
    </div>
  );
}

interface TodoCardProps {
  todo: Todo;
  onDelete: () => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  isTimerActive: boolean;
}

function TodoCard({ todo, onDelete, onStartTimer, onStopTimer, isTimerActive }: TodoCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: todo.id });

  const [remainingTime, setRemainingTime] = useState<number | null>(null);

  useEffect(() => {
    if (!todo.timer || !todo.timerStarted || !isTimerActive) {
      setRemainingTime(null);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - new Date(todo.timerStarted!).getTime();
      const remaining = (todo.timer! * 60 * 1000) - elapsed;
      setRemainingTime(Math.max(0, remaining));

      if (remaining <= 0) {
        onStopTimer();
        // Trigger notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: `"${todo.title}" timer has finished.`,
            icon: '/flowstate-icon.png'
          });
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [todo.timer, todo.timerStarted, isTimerActive, onStopTimer, todo.title]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`${styles.todoCard} ${todo.status === 'done' ? styles.done : ''} ${isDragging ? styles.dragging : ''}`}
      layout
      {...attributes}
      {...listeners}
    >
      <div className={styles.todoCardHeader}>
        <div className={styles.dragHandle}>
          <GripVertical size={16} />
        </div>
        <span className={styles.todoTitle}>{todo.title}</span>
        <button className={styles.deleteButton} onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 size={14} />
        </button>
      </div>

      {todo.description && (
        <p className={styles.todoDescription}>{todo.description}</p>
      )}

      {todo.timer && (
        <div className={styles.timerSection}>
          {isTimerActive && remainingTime !== null ? (
            <div className={styles.timerActive}>
              <span className={styles.timerDisplay}>{formatTime(remainingTime)}</span>
              <button className={styles.timerButton} onClick={(e) => { e.stopPropagation(); onStopTimer(); }}>
                <Pause size={14} />
              </button>
            </div>
          ) : (
            <div className={styles.timerInactive}>
              <Clock size={14} />
              <span>{todo.timer} min</span>
              {todo.status === 'doing' && (
                <button className={styles.timerButton} onClick={(e) => { e.stopPropagation(); onStartTimer(); }}>
                  <Play size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export function TodosPage() {
  const {
    todos,
    addTodo,
    deleteTodo,
    moveTodo,
    activeTodoTimer,
    startTodoTimer,
    stopTodoTimer
  } = useStore();

  const [showNewTodoModal, setShowNewTodoModal] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    timer: ''
  });
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dropZoneActive, setDropZoneActive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const getTodosByStatus = (status: TodoStatus) => {
    return todos
      .filter(todo => todo.status === status)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setDropZoneActive(true);
      return;
    }
    setDropZoneActive(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    // If dropped in delete zone
    if (!over || dropZoneActive) {
      if (dropZoneActive) {
        deleteTodo(active.id as string);
      }
      setDropZoneActive(false);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTodo = todos.find(t => t.id === activeId);

    if (!activeTodo) {
      setDropZoneActive(false);
      return;
    }

    // Check if dropped on a column
    const targetColumn = columns.find(col => col.id === overId);
    if (targetColumn) {
      moveTodo(activeId, targetColumn.id);
      setDropZoneActive(false);
      return;
    }

    // Check if dropped on another todo
    const overTodo = todos.find(t => t.id === overId);
    if (overTodo) {
      // Get all todos in the target status, sorted by order
      const targetTodos = todos
        .filter(t => t.status === overTodo.status && t.id !== activeId)
        .sort((a, b) => a.order - b.order);

      // Find the index where we should insert
      const targetIndex = targetTodos.findIndex(t => t.id === overId);

      // Move the todo to the target status at the specific position
      moveTodo(activeId, overTodo.status, targetIndex >= 0 ? targetIndex : undefined);
    }

    setDropZoneActive(false);
  };

  const handleCreateTodo = () => {
    if (!newTodo.title.trim()) return;

    addTodo({
      title: newTodo.title,
      description: newTodo.description || undefined,
      status: 'do',
      timer: newTodo.timer ? parseInt(newTodo.timer) : undefined
    });

    setNewTodo({ title: '', description: '', timer: '' });
    setShowNewTodoModal(false);
  };

  const activeTodo = todos.find(t => t.id === activeDragId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>To-Do</h1>
          <p className={styles.subtitle}>Kanban board with timers</p>
        </div>
        <Button
          icon={<Plus size={18} />}
          onClick={() => setShowNewTodoModal(true)}
        >
          New Task
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {columns.map((column) => (
            <div key={column.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <div
                  className={styles.columnIndicator}
                  style={{ background: column.color }}
                />
                <h3 className={styles.columnTitle}>{column.title}</h3>
                <span className={styles.columnCount}>
                  {getTodosByStatus(column.id).length}
                </span>
              </div>

              <DroppableColumn id={column.id}>
                <SortableContext
                  items={getTodosByStatus(column.id).map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {getTodosByStatus(column.id).map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onDelete={() => deleteTodo(todo.id)}
                        onStartTimer={() => startTodoTimer(todo.id)}
                        onStopTimer={() => stopTodoTimer(todo.id)}
                        isTimerActive={activeTodoTimer === todo.id}
                      />
                    ))}
                  </AnimatePresence>

                  {getTodosByStatus(column.id).length === 0 && (
                    <div className={styles.emptyColumn}>
                      <p>Drop tasks here</p>
                    </div>
                  )}
                </SortableContext>
              </DroppableColumn>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <div className={`${styles.todoCard} ${styles.dragging}`}>
              <div className={styles.todoCardHeader}>
                <GripVertical size={16} />
                <span className={styles.todoTitle}>{activeTodo.title}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>

        {/* Delete Zone */}
        <AnimatePresence>
          {activeDragId && (
            <motion.div
              className={`${styles.deleteZone} ${dropZoneActive ? styles.active : ''}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              <Trash2 size={24} />
              <span>Drop here to delete</span>
            </motion.div>
          )}
        </AnimatePresence>
      </DndContext>

      {/* New Todo Modal */}
      <AnimatePresence>
        {showNewTodoModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewTodoModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>New Task</h3>
                <button className={styles.modalClose} onClick={() => setShowNewTodoModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalContent}>
                <Input
                  label="Task Title"
                  placeholder="What needs to be done?"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                />

                <Input
                  label="Description (optional)"
                  placeholder="Add more details..."
                  value={newTodo.description}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                />

                <Input
                  label="Timer (minutes, optional)"
                  type="number"
                  placeholder="e.g., 25"
                  value={newTodo.timer}
                  onChange={(e) => setNewTodo(prev => ({ ...prev, timer: e.target.value }))}
                  icon={<Timer size={16} />}
                />
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" onClick={() => setShowNewTodoModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTodo} disabled={!newTodo.title.trim()}>
                  Create Task
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
