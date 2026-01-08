import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Star,
  Paperclip,
  Search,
  RefreshCw,
  ChevronLeft,
  ExternalLink,
  Inbox,
  CheckCircle,
  AlertCircle,
  Loader2,
  LogOut,
  Trash2,
  Reply,
  Send,
  Plus,
  X,
  SendHorizontal,
  ShieldAlert,
  Trash,
  Download,
  FileText,
  Image,
  File,
  Eye
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useStore } from '../store/useStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  initGmailAuth,
  connectGmail,
  disconnectGmail,
  isGmailConnected,
  fetchGmailMessages,
  deleteGmailMessage,
  permanentlyDeleteGmailMessage,
  sendGmailMessage,
  replyToGmailMessage,
  downloadGmailAttachment,
  getGmailAttachmentPreview,
  toggleGmailStar,
  type GmailFolder,
  type EmailAttachment
} from '../lib/gmail';
import type { Email, MailFilter } from '../types';
import styles from './MailPage.module.css';

// No sample emails - Gmail only
const sampleEmails: Email[] = [];

export function MailPage() {
  const { mailFilter, setMailFilter, selectedEmailId, selectEmail } = useStore();
  const [gmailEmails, setGmailEmails] = useState<Email[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isDeletingEmail, setIsDeletingEmail] = useState(false);

  // Folder state
  const [activeFolder, setActiveFolder] = useState<GmailFolder>('INBOX');

  // Compose/Reply state
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [replyBody, setReplyBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isTogglingstar, setIsTogglingstar] = useState(false);

  // Attachment state for compose and reply
  const [composeAttachments, setComposeAttachments] = useState<{ filename: string; content: string; mimeType: string }[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<{ filename: string; content: string; mimeType: string }[]>([]);

  // Attachment preview state
  const [previewAttachment, setPreviewAttachment] = useState<{
    data: string;
    mimeType: string;
    filename: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Inline image preview thumbnails cache
  const [inlinePreviews, setInlinePreviews] = useState<Record<string, string>>({});

  // Check Gmail connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await initGmailAuth();
        const connected = isGmailConnected();
        setGmailConnected(connected);
        if (connected) {
          loadGmailEmails();
        }
      } catch (error) {
        console.error('Failed to initialize Gmail auth:', error);
      }
    };
    checkConnection();
  }, []);

  const loadGmailEmails = useCallback(async (folder: GmailFolder = activeFolder) => {
    setIsLoadingEmails(true);
    try {
      const emails = await fetchGmailMessages(20, folder);
      setGmailEmails(emails);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to load emails:', error);
      if (error instanceof Error && error.message.includes('reconnect')) {
        setGmailConnected(false);
      }
      setConnectionError(error instanceof Error ? error.message : 'Failed to load emails');
    } finally {
      setIsLoadingEmails(false);
    }
  }, [activeFolder]);

  // Reload emails when folder changes
  useEffect(() => {
    if (gmailConnected) {
      loadGmailEmails(activeFolder);
      selectEmail(null); // Clear selection when changing folders
    }
  }, [activeFolder, gmailConnected]);

  // Load inline previews for image attachments when email is selected
  useEffect(() => {
    const loadInlinePreviews = async () => {
      if (!selectedEmailId) return;

      const email = gmailEmails.find(e => e.id === selectedEmailId);
      if (!email?.attachments) return;

      const imageAttachments = email.attachments.filter(att =>
        att.mimeType.startsWith('image/')
      );

      for (const attachment of imageAttachments) {
        const cacheKey = `${email.id}-${attachment.id}`;
        if (inlinePreviews[cacheKey]) continue;

        try {
          const dataUrl = await getGmailAttachmentPreview(email.id, attachment);
          setInlinePreviews(prev => ({ ...prev, [cacheKey]: dataUrl }));
        } catch (error) {
          console.error('Failed to load inline preview:', error);
        }
      }
    };

    loadInlinePreviews();
  }, [selectedEmailId, gmailEmails]);

  const handleConnectGmail = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      await initGmailAuth();
      await connectGmail();
      setGmailConnected(true);
      await loadGmailEmails();
    } catch (error) {
      console.error('Gmail connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = () => {
    disconnectGmail();
    setGmailConnected(false);
    setGmailEmails([]);
  };

  const handleDeleteEmail = async (emailId: string) => {
    // Only allow deleting Gmail emails
    const email = gmailEmails.find(e => e.id === emailId);
    if (!email) return;

    setIsDeletingEmail(true);
    try {
      // If in TRASH folder, permanently delete. Otherwise, move to trash.
      if (activeFolder === 'TRASH') {
        await permanentlyDeleteGmailMessage(emailId);
      } else {
        await deleteGmailMessage(emailId);
      }
      // Remove from local state
      setGmailEmails(prev => prev.filter(e => e.id !== emailId));
      // Clear selection if this email was selected
      if (selectedEmailId === emailId) {
        selectEmail(null);
      }
    } catch (error) {
      console.error('Failed to delete email:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to delete email');
    } finally {
      setIsDeletingEmail(false);
    }
  };

  // Send new email
  const handleSendEmail = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      setSendError('Please fill in all fields');
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      await sendGmailMessage({
        to: composeData.to,
        subject: composeData.subject,
        body: composeData.body,
        attachments: composeAttachments.length > 0 ? composeAttachments : undefined,
      });
      setSendSuccess(true);
      setComposeData({ to: '', subject: '', body: '' });
      setComposeAttachments([]);
      setTimeout(() => {
        setShowComposeModal(false);
        setSendSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to send email:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  // Reply to email
  const handleSendReply = async () => {
    if (!replyBody.trim() || !selectedEmail) return;

    setIsSending(true);
    setSendError(null);

    try {
      await replyToGmailMessage(
        {
          id: selectedEmail.id,
          from: selectedEmail.from,
          fromEmail: selectedEmail.fromEmail,
          to: selectedEmail.to,
          subject: selectedEmail.subject,
          preview: selectedEmail.preview,
          body: selectedEmail.body,
          date: selectedEmail.date,
          isRead: selectedEmail.isRead,
          isStarred: selectedEmail.isStarred,
          provider: 'gmail',
          labels: selectedEmail.labels,
          hasAttachment: selectedEmail.hasAttachment,
          attachments: selectedEmail.attachments || [],
        },
        replyBody,
        replyAttachments.length > 0 ? replyAttachments : undefined
      );
      setSendSuccess(true);
      setReplyBody('');
      setReplyAttachments([]);
      setTimeout(() => {
        setShowReplyBox(false);
        setSendSuccess(false);
        loadGmailEmails(); // Refresh to show the sent reply
      }, 1500);
    } catch (error) {
      console.error('Failed to send reply:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send reply');
    } finally {
      setIsSending(false);
    }
  };

  // Handle attachment download
  const handleDownloadAttachment = async (messageId: string, attachment: EmailAttachment) => {
    setDownloadingAttachment(attachment.id);
    try {
      await downloadGmailAttachment(messageId, attachment);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to download attachment');
    } finally {
      setDownloadingAttachment(null);
    }
  };

  // Handle attachment preview
  const handlePreviewAttachment = async (messageId: string, attachment: EmailAttachment) => {
    // Check if it's a previewable type
    const previewableTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/html', 'text/css', 'text/javascript',
      'application/json'
    ];

    if (!previewableTypes.some(type => attachment.mimeType.startsWith(type.split('/')[0]) || attachment.mimeType === type)) {
      // If not previewable, just download
      handleDownloadAttachment(messageId, attachment);
      return;
    }

    setIsLoadingPreview(true);
    try {
      const dataUrl = await getGmailAttachmentPreview(messageId, attachment);
      setPreviewAttachment({
        data: dataUrl,
        mimeType: attachment.mimeType,
        filename: attachment.filename
      });
    } catch (error) {
      console.error('Failed to preview attachment:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to preview attachment');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Check if attachment is previewable
  const isPreviewable = (mimeType: string): boolean => {
    return mimeType.startsWith('image/') ||
           mimeType === 'application/pdf' ||
           mimeType.startsWith('text/') ||
           mimeType === 'application/json';
  };

  // Handle file attachment selection
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setAttachments: React.Dispatch<React.SetStateAction<{ filename: string; content: string; mimeType: string }[]>>
  ) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1]; // Remove data URL prefix
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            content: base64,
            mimeType: file.type || 'application/octet-stream',
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    e.target.value = '';
  };

  // Remove attachment
  const removeAttachment = (
    index: number,
    setAttachments: React.Dispatch<React.SetStateAction<{ filename: string; content: string; mimeType: string }[]>>
  ) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Toggle star on email
  const handleToggleStar = async (email: Email) => {
    if (email.provider !== 'gmail' || isTogglingstar) return;

    setIsTogglingstar(true);
    try {
      await toggleGmailStar(email.id, email.isStarred);
      // Update local state
      setGmailEmails(prev => prev.map(e =>
        e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
      ));
    } catch (error) {
      console.error('Failed to toggle star:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to toggle star');
    } finally {
      setIsTogglingstar(false);
    }
  };

  // Get icon for attachment type
  const getAttachmentIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image size={16} />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText size={16} />;
    return <File size={16} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render text with clickable links
  const renderTextWithLinks = (text: string) => {
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s<>[\]{}|\\^`"']+)/gi;
    const parts = text.split(urlPattern);

    return parts.map((part, index) => {
      if (urlPattern.test(part)) {
        // Reset lastIndex since test() advances it
        urlPattern.lastIndex = 0;
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.emailLink}
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Combine Gmail emails with sample Outlook emails
  const allEmails = useMemo(() => {
    return [...gmailEmails, ...sampleEmails];
  }, [gmailEmails]);

  const filteredEmails = useMemo(() => {
    let filtered = allEmails;

    if (mailFilter === 'main') {
      filtered = filtered.filter(e => e.provider === 'gmail');
    } else if (mailFilter === 'school') {
      filtered = filtered.filter(e => e.provider === 'outlook');
    }

    if (showStarredOnly) {
      filtered = filtered.filter(e => e.isStarred);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.subject.toLowerCase().includes(query) ||
        e.from.toLowerCase().includes(query) ||
        e.preview.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allEmails, mailFilter, searchQuery, showStarredOnly]);

  const selectedEmail = allEmails.find(e => e.id === selectedEmailId);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (gmailConnected) {
      await loadGmailEmails();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatEmailDate = (date: Date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  const filters: { id: MailFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'main', label: 'Gmail' },
    { id: 'school', label: 'School' }
  ];

  const folders: { id: GmailFolder; label: string; icon: React.ReactNode }[] = [
    { id: 'INBOX', label: 'Inbox', icon: <Inbox size={16} /> },
    { id: 'SENT', label: 'Sent', icon: <SendHorizontal size={16} /> },
    { id: 'SPAM', label: 'Spam', icon: <ShieldAlert size={16} /> },
    { id: 'TRASH', label: 'Trash', icon: <Trash size={16} /> }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mail</h1>
          <p className={styles.subtitle}>Gmail & Outlook unified</p>
        </div>
        {gmailConnected && (
          <Button
            icon={<Plus size={18} />}
            onClick={() => setShowComposeModal(true)}
          >
            Compose
          </Button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.filters}>
            {filters.map((filter) => (
              <motion.button
                key={filter.id}
                className={`${styles.filterButton} ${mailFilter === filter.id ? styles.active : ''}`}
                onClick={() => setMailFilter(filter.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {filter.label}
                {mailFilter === filter.id && (
                  <motion.div
                    className={styles.filterIndicator}
                    layoutId="mailFilter"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Gmail Folder tabs */}
          {gmailConnected && mailFilter !== 'school' && (
            <div className={styles.folderTabs}>
              {folders.map((folder) => (
                <motion.button
                  key={folder.id}
                  className={`${styles.folderTab} ${activeFolder === folder.id ? styles.active : ''}`}
                  onClick={() => setActiveFolder(folder.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {folder.icon}
                  {folder.label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <Button
            variant="ghost"
            icon={<Star size={18} className={showStarredOnly ? styles.starredActive : ''} />}
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`${styles.starFilterButton} ${showStarredOnly ? styles.active : ''}`}
            title={showStarredOnly ? 'Show all emails' : 'Show starred only'}
          />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search size={16} />}
            className={styles.searchInput}
          />
          <Button
            variant="ghost"
            icon={<RefreshCw size={18} className={isRefreshing ? styles.spinning : ''} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          />
        </div>
      </div>

      <div className={styles.layout}>
        {/* Email List */}
        <Card className={styles.emailList} padding="none">
          {isLoadingEmails ? (
            <div className={styles.emptyState}>
              <Loader2 size={40} className={styles.spinning} />
              <p>Loading emails...</p>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={40} />
              <p>No emails found</p>
              {!gmailConnected && mailFilter === 'main' && (
                <p className={styles.connectHint}>Connect Gmail to see your emails</p>
              )}
            </div>
          ) : (
            <div className={styles.emailListContent}>
              {filteredEmails.map((email) => (
                <motion.button
                  key={email.id}
                  className={`${styles.emailItem} ${!email.isRead ? styles.unread : ''} ${selectedEmailId === email.id ? styles.selected : ''}`}
                  onClick={() => selectEmail(email.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className={styles.emailItemLeft}>
                    <div className={`${styles.providerDot} ${styles[email.provider]}`} />
                    <div className={styles.emailItemContent}>
                      <div className={styles.emailItemHeader}>
                        <span className={styles.emailFrom}>{email.from}</span>
                        <span className={styles.emailDate}>{formatEmailDate(email.date)}</span>
                      </div>
                      <span className={styles.emailSubject}>{email.subject}</span>
                      <span className={styles.emailPreview}>{email.preview}</span>
                    </div>
                  </div>
                  <div className={styles.emailItemIcons}>
                    {email.isStarred && <Star size={14} className={styles.starred} />}
                    {email.hasAttachment && <Paperclip size={14} />}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </Card>

        {/* Email Detail */}
        <AnimatePresence mode="wait">
          {selectedEmail ? (
            <motion.div
              key={selectedEmail.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={styles.emailDetail}
            >
              <Card className={styles.emailDetailCard}>
                <div className={styles.emailDetailHeader}>
                  <button
                    className={styles.backButton}
                    onClick={() => selectEmail(null)}
                  >
                    <ChevronLeft size={20} />
                    <span>Back</span>
                  </button>
                  <div className={styles.emailDetailActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Star size={16} className={selectedEmail.isStarred ? styles.starredActive : ''} />}
                      onClick={() => handleToggleStar(selectedEmail)}
                      disabled={isTogglingstar || selectedEmail.provider !== 'gmail'}
                      className={selectedEmail.isStarred ? styles.starButton : ''}
                    />
                    <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />} />
                    {selectedEmail.provider === 'gmail' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={isDeletingEmail ? <Loader2 size={16} className={styles.spinning} /> : <Trash2 size={16} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmail(selectedEmail.id);
                        }}
                        disabled={isDeletingEmail}
                        className={styles.deleteButton}
                      />
                    )}
                  </div>
                </div>

                <div className={styles.emailDetailContent}>
                  <h2 className={styles.emailDetailSubject}>{selectedEmail.subject}</h2>

                  <div className={styles.emailDetailMeta}>
                    <div className={styles.emailDetailSender}>
                      <div className={styles.avatar}>
                        {selectedEmail.from.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className={styles.emailDetailFrom}>{selectedEmail.from}</span>
                        <span className={styles.emailDetailFromEmail}>{selectedEmail.fromEmail}</span>
                      </div>
                    </div>
                    <span className={styles.emailDetailDate}>
                      {format(new Date(selectedEmail.date), 'EEEE, MMMM d, yyyy at h:mm a')}
                    </span>
                  </div>

                  <div className={styles.emailDetailBody}>
                    <pre className={styles.emailBodyText}>{renderTextWithLinks(selectedEmail.body)}</pre>
                  </div>

                  {selectedEmail.hasAttachment && selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className={styles.attachments}>
                      <span className={styles.attachmentsLabel}>
                        <Paperclip size={14} />
                        {selectedEmail.attachments.length} Attachment{selectedEmail.attachments.length > 1 ? 's' : ''}
                      </span>
                      <div className={styles.attachmentsList}>
                        {selectedEmail.attachments.map((attachment) => {
                          const isImage = attachment.mimeType.startsWith('image/');
                          const cacheKey = `${selectedEmail.id}-${attachment.id}`;
                          const inlinePreview = inlinePreviews[cacheKey];

                          return (
                            <div
                              key={attachment.id}
                              className={`${styles.attachmentItem} ${isImage && inlinePreview ? styles.attachmentWithPreview : ''}`}
                              onClick={() => isImage && inlinePreview ? handlePreviewAttachment(selectedEmail.id, attachment) : undefined}
                            >
                              {isImage && inlinePreview ? (
                                <img
                                  src={inlinePreview}
                                  alt={attachment.filename}
                                  className={styles.attachmentThumbnail}
                                />
                              ) : (
                                <span className={styles.attachmentIcon}>
                                  {getAttachmentIcon(attachment.mimeType)}
                                </span>
                              )}
                              <div className={styles.attachmentInfo}>
                                <span className={styles.attachmentName}>{attachment.filename}</span>
                                <span className={styles.attachmentSize}>{formatFileSize(attachment.size)}</span>
                              </div>
                              <div className={styles.attachmentActions}>
                                {isPreviewable(attachment.mimeType) && !isImage && (
                                  <button
                                    className={styles.attachmentAction}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreviewAttachment(selectedEmail.id, attachment);
                                    }}
                                    disabled={isLoadingPreview}
                                    title="Preview"
                                  >
                                    {isLoadingPreview ? (
                                      <Loader2 size={16} className={styles.spinning} />
                                    ) : (
                                      <Eye size={16} />
                                    )}
                                  </button>
                                )}
                                <button
                                  className={styles.attachmentAction}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(selectedEmail.id, attachment);
                                  }}
                                  disabled={downloadingAttachment === attachment.id}
                                  title="Download"
                                >
                                  {downloadingAttachment === attachment.id ? (
                                    <Loader2 size={16} className={styles.spinning} />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reply section - only for Gmail */}
                  {selectedEmail.provider === 'gmail' && gmailConnected && (
                    <div className={styles.replySection}>
                      {!showReplyBox ? (
                        <Button
                          variant="secondary"
                          icon={<Reply size={16} />}
                          onClick={() => setShowReplyBox(true)}
                        >
                          Reply
                        </Button>
                      ) : (
                        <div className={styles.replyBox}>
                          <div className={styles.replyHeader}>
                            <span>Reply to {selectedEmail.from}</span>
                            <button
                              className={styles.replyClose}
                              onClick={() => {
                                setShowReplyBox(false);
                                setReplyBody('');
                                setReplyAttachments([]);
                                setSendError(null);
                              }}
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <textarea
                            className={styles.replyTextarea}
                            placeholder="Write your reply..."
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            rows={6}
                          />
                          {/* Reply attachment section */}
                          <div className={styles.replyAttachmentSection}>
                            <input
                              type="file"
                              id="reply-attachment"
                              multiple
                              onChange={(e) => handleFileSelect(e, setReplyAttachments)}
                              className={styles.fileInput}
                            />
                            <label htmlFor="reply-attachment" className={styles.attachButtonSmall}>
                              <Paperclip size={14} />
                              Attach
                            </label>
                            {replyAttachments.length > 0 && (
                              <div className={styles.attachmentPreviewList}>
                                {replyAttachments.map((att, index) => (
                                  <div key={index} className={styles.attachmentPreviewSmall}>
                                    <Paperclip size={12} />
                                    <span className={styles.attachmentPreviewName}>{att.filename}</span>
                                    <button
                                      type="button"
                                      className={styles.removeAttachmentSmall}
                                      onClick={() => removeAttachment(index, setReplyAttachments)}
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {sendError && (
                            <p className={styles.sendError}>
                              <AlertCircle size={14} />
                              {sendError}
                            </p>
                          )}
                          {sendSuccess && (
                            <p className={styles.sendSuccess}>
                              <CheckCircle size={14} />
                              Reply sent successfully!
                            </p>
                          )}
                          <div className={styles.replyActions}>
                            <Button
                              onClick={handleSendReply}
                              disabled={isSending || !replyBody.trim()}
                              icon={isSending ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                            >
                              {isSending ? 'Sending...' : 'Send Reply'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className={styles.noEmailSelected}>
              <Mail size={48} />
              <h3>Select an email</h3>
              <p>Choose an email from the list to read it</p>
            </Card>
          )}
        </AnimatePresence>
      </div>

      <Card className={styles.connectCard}>
        <div className={styles.connectContent}>
          <div>
            <h3>Connect your email accounts</h3>
            <p>Link your Gmail and Outlook to see real emails here</p>
            {connectionError && (
              <p className={styles.errorText}>
                <AlertCircle size={14} />
                {connectionError}
              </p>
            )}
          </div>
          <div className={styles.connectButtons}>
            {gmailConnected ? (
              <Button
                variant="secondary"
                icon={<CheckCircle size={16} />}
                onClick={handleDisconnectGmail}
                className={styles.connectedButton}
              >
                Gmail Connected
                <LogOut size={14} className={styles.disconnectIcon} />
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={isConnecting ? <Loader2 size={16} className={styles.spinning} /> : <Mail size={16} />}
                onClick={handleConnectGmail}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Gmail'}
              </Button>
            )}
            <Button variant="secondary" icon={<Mail size={16} />} disabled>
              Connect Outlook (Soon)
            </Button>
          </div>
        </div>
      </Card>

      {/* Compose Modal */}
      <AnimatePresence>
        {showComposeModal && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComposeModal(false)}
          >
            <motion.div
              className={styles.composeModal}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.composeHeader}>
                <h3 className={styles.composeTitle}>New Message</h3>
                <button
                  className={styles.composeClose}
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeData({ to: '', subject: '', body: '' });
                    setComposeAttachments([]);
                    setSendError(null);
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className={styles.composeContent}>
                <Input
                  label="To"
                  placeholder="recipient@example.com"
                  value={composeData.to}
                  onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
                />
                <Input
                  label="Subject"
                  placeholder="Email subject"
                  value={composeData.subject}
                  onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                />
                <div className={styles.composeBodyWrapper}>
                  <label className={styles.composeLabel}>Message</label>
                  <textarea
                    className={styles.composeTextarea}
                    placeholder="Write your message..."
                    value={composeData.body}
                    onChange={(e) => setComposeData(prev => ({ ...prev, body: e.target.value }))}
                    rows={10}
                  />
                </div>

                {/* Attachment section */}
                <div className={styles.attachmentSection}>
                  <input
                    type="file"
                    id="compose-attachment"
                    multiple
                    onChange={(e) => handleFileSelect(e, setComposeAttachments)}
                    className={styles.fileInput}
                  />
                  <label htmlFor="compose-attachment" className={styles.attachButton}>
                    <Paperclip size={16} />
                    Add Attachment
                  </label>
                  {composeAttachments.length > 0 && (
                    <div className={styles.attachmentPreviewList}>
                      {composeAttachments.map((att, index) => (
                        <div key={index} className={styles.attachmentPreview}>
                          <Paperclip size={14} />
                          <span className={styles.attachmentPreviewName}>{att.filename}</span>
                          <button
                            type="button"
                            className={styles.removeAttachment}
                            onClick={() => removeAttachment(index, setComposeAttachments)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {sendError && (
                  <p className={styles.sendError}>
                    <AlertCircle size={14} />
                    {sendError}
                  </p>
                )}
                {sendSuccess && (
                  <p className={styles.sendSuccess}>
                    <CheckCircle size={14} />
                    Email sent successfully!
                  </p>
                )}
              </div>

              <div className={styles.composeActions}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeData({ to: '', subject: '', body: '' });
                    setComposeAttachments([]);
                    setSendError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={isSending || !composeData.to || !composeData.subject || !composeData.body}
                  icon={isSending ? <Loader2 size={16} className={styles.spinning} /> : <Send size={16} />}
                >
                  {isSending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Preview Modal */}
      <AnimatePresence>
        {previewAttachment && (
          <motion.div
            className={styles.previewOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewAttachment(null)}
          >
            <motion.div
              className={styles.previewModal}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.previewHeader}>
                <h3 className={styles.previewTitle}>{previewAttachment.filename}</h3>
                <button
                  className={styles.previewClose}
                  onClick={() => setPreviewAttachment(null)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className={styles.previewContent}>
                {previewAttachment.mimeType.startsWith('image/') ? (
                  <img
                    src={previewAttachment.data}
                    alt={previewAttachment.filename}
                    className={styles.previewImage}
                  />
                ) : previewAttachment.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewAttachment.data}
                    className={styles.previewPdf}
                    title={previewAttachment.filename}
                  />
                ) : previewAttachment.mimeType.startsWith('text/') || previewAttachment.mimeType === 'application/json' ? (
                  <iframe
                    src={previewAttachment.data}
                    className={styles.previewText}
                    title={previewAttachment.filename}
                  />
                ) : (
                  <div className={styles.previewUnsupported}>
                    <File size={48} />
                    <p>Preview not available for this file type</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
