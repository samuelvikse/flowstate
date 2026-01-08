import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Folder,
  FileText,
  Trash2,
  Pin,
  ChevronRight,
  X,
  Edit3
} from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { Note } from '../types';
import styles from './NotesPage.module.css';

const folderColors = [
  '#8b5cf6',
  '#06d6a0',
  '#f472b6',
  '#38bdf8',
  '#fb923c',
  '#22c55e'
];

export function NotesPage() {
  const {
    notes,
    folders,
    selectedNoteId,
    selectedFolderId,
    addNote,
    updateNote,
    deleteNote,
    selectNote,
    addFolder,
    deleteFolder,
    selectFolder
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(folderColors[0]);
  const [_editingNote, _setEditingNote] = useState<Note | null>(null);

  const selectedNote = notes.find(note => note.id === selectedNoteId);

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (selectedFolderId) {
      filtered = filtered.filter(note => note.folderId === selectedFolderId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      );
    }

    // Sort: pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, selectedFolderId, searchQuery]);

  const handleCreateNote = () => {
    addNote({
      title: 'Untitled Note',
      content: '',
      folderId: selectedFolderId || undefined,
      isPinned: false
    });
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder({
      name: newFolderName,
      color: newFolderColor
    });
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    updateNote(id, updates);
  };

  const getNotePreview = (content: string) => {
    const stripped = content.replace(/[#*_~`]/g, '').trim();
    return stripped.substring(0, 100) + (stripped.length > 100 ? '...' : '');
  };

  const getFolderNoteCount = (folderId: string) => {
    return notes.filter(note => note.folderId === folderId).length;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notes</h1>
          <p className={styles.subtitle}>Organize your thoughts</p>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="secondary"
            icon={<Folder size={18} />}
            onClick={() => setShowNewFolderModal(true)}
          >
            New Folder
          </Button>
          <Button
            icon={<Plus size={18} />}
            onClick={handleCreateNote}
          >
            New Note
          </Button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <Card className={styles.sidebar} padding="none">
          <div className={styles.sidebarHeader}>
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className={styles.foldersSection}>
            <button
              className={`${styles.folderItem} ${selectedFolderId === null ? styles.active : ''}`}
              onClick={() => selectFolder(null)}
            >
              <FileText size={16} />
              <span className={styles.folderName}>All Notes</span>
              <span className={styles.folderCount}>{notes.length}</span>
            </button>

            {folders.map((folder) => (
              <div key={folder.id} className={styles.folderItemWrapper}>
                <button
                  className={`${styles.folderItem} ${selectedFolderId === folder.id ? styles.active : ''}`}
                  onClick={() => selectFolder(folder.id)}
                >
                  <Folder size={16} style={{ color: folder.color }} />
                  <span className={styles.folderName}>{folder.name}</span>
                  <span className={styles.folderCount}>{getFolderNoteCount(folder.id)}</span>
                </button>
                <button
                  className={styles.folderDelete}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className={styles.notesList}>
            <div className={styles.notesListHeader}>
              <span>Notes</span>
              <span className={styles.notesCount}>{filteredNotes.length}</span>
            </div>

            {filteredNotes.length === 0 ? (
              <div className={styles.emptyNotes}>
                <FileText size={32} />
                <p>No notes yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCreateNote}
                >
                  Create your first note
                </Button>
              </div>
            ) : (
              <div className={styles.notesListContent}>
                {filteredNotes.map((note) => (
                  <motion.button
                    key={note.id}
                    className={`${styles.noteItem} ${selectedNoteId === note.id ? styles.active : ''}`}
                    onClick={() => selectNote(note.id)}
                    whileHover={{ x: 4 }}
                  >
                    <div className={styles.noteItemContent}>
                      <div className={styles.noteItemHeader}>
                        {note.isPinned && <Pin size={12} className={styles.pinnedIcon} />}
                        <span className={styles.noteItemTitle}>{note.title || 'Untitled'}</span>
                      </div>
                      <span className={styles.noteItemPreview}>
                        {getNotePreview(note.content) || 'No content'}
                      </span>
                      <span className={styles.noteItemDate}>
                        {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <ChevronRight size={16} className={styles.noteItemChevron} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Note Editor */}
        <Card className={styles.editor} padding="none">
          {selectedNote ? (
            <div className={styles.editorContent}>
              <div className={styles.editorHeader}>
                <input
                  type="text"
                  className={styles.editorTitle}
                  value={selectedNote.title}
                  onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                  placeholder="Note title..."
                />
                <div className={styles.editorActions}>
                  <button
                    className={`${styles.editorAction} ${selectedNote.isPinned ? styles.active : ''}`}
                    onClick={() => handleUpdateNote(selectedNote.id, { isPinned: !selectedNote.isPinned })}
                    title={selectedNote.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin size={18} />
                  </button>
                  <button
                    className={styles.editorAction}
                    onClick={() => {
                      deleteNote(selectedNote.id);
                      selectNote(null);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className={styles.editorMeta}>
                <span>Last edited: {format(new Date(selectedNote.updatedAt), 'MMMM d, yyyy at h:mm a')}</span>
                {selectedNote.folderId && (
                  <span className={styles.editorFolder}>
                    <Folder size={12} />
                    {folders.find(f => f.id === selectedNote.folderId)?.name}
                  </span>
                )}
              </div>

              <textarea
                className={styles.editorTextarea}
                value={selectedNote.content}
                onChange={(e) => handleUpdateNote(selectedNote.id, { content: e.target.value })}
                placeholder="Start writing..."
              />

              <div className={styles.editorFooter}>
                <select
                  className={styles.folderSelect}
                  value={selectedNote.folderId || ''}
                  onChange={(e) => handleUpdateNote(selectedNote.id, {
                    folderId: e.target.value || undefined
                  })}
                >
                  <option value="">No folder</option>
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className={styles.noNoteSelected}>
              <Edit3 size={48} />
              <h3>Select a note</h3>
              <p>Choose a note from the sidebar or create a new one</p>
              <Button onClick={handleCreateNote}>
                Create Note
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewFolderModal(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>New Folder</h3>
                <button className={styles.modalClose} onClick={() => setShowNewFolderModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <div className={styles.modalContent}>
                <Input
                  label="Folder Name"
                  placeholder="e.g., Work, Personal, Ideas"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />

                <div className={styles.colorPicker}>
                  <label className={styles.colorLabel}>Color</label>
                  <div className={styles.colorOptions}>
                    {folderColors.map((color) => (
                      <button
                        key={color}
                        className={`${styles.colorOption} ${newFolderColor === color ? styles.selected : ''}`}
                        style={{ background: color }}
                        onClick={() => setNewFolderColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <Button variant="ghost" onClick={() => setShowNewFolderModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                  Create Folder
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
