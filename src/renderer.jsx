import React from 'react';
import MuiStack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import MuiTextField from '@mui/material/TextField';
import MuiButton from '@mui/material/Button';
import MuiAlert from '@mui/material/Alert';
import MuiCard from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';

function StackAdapter({ children, ...props }) {
  return <MuiStack {...props}>{children}</MuiStack>;
}

function GridAdapter({ columns, spacing, children, sx: sxProp, ...props }) {
  return (
    <Box
      sx={{ display: 'grid', gridTemplateColumns: columns, gap: spacing, ...sxProp }}
      {...props}
    >
      {children}
    </Box>
  );
}

function DividerAdapter(props) {
  return <MuiDivider {...props} />;
}

function TextAdapter({ content, variant, ...props }) {
  return (
    <Typography variant={variant} {...props}>
      {content}
    </Typography>
  );
}

function TextFieldAdapter({ onChange, name, ...props }) {
  const handleChange = (e) => {
    if (onChange) onChange(name || e.target.name, e.target.value);
  };
  return (
    <MuiTextField
      name={name}
      variant="outlined"
      fullWidth
      size="small"
      {...props}
      onChange={handleChange}
    />
  );
}

function ButtonAdapter({ label, fullWidth, ...props }) {
  return (
    <MuiButton fullWidth={fullWidth} {...props}>
      {label}
    </MuiButton>
  );
}

function AlertAdapter({ content, severity, ...props }) {
  return (
    <MuiAlert severity={severity} {...props}>
      {content}
    </MuiAlert>
  );
}

function FormAdapter({ onSubmit, children, ...props }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };
  return (
    <Box component="form" onSubmit={handleSubmit} noValidate {...props}>
      {children}
    </Box>
  );
}

function CardAdapter({ title, children, ...props }) {
  return (
    <MuiCard {...props}>
      <CardContent>
        {title && <Typography variant="h6">{title}</Typography>}
        {children}
      </CardContent>
    </MuiCard>
  );
}

function BadgeAdapter({ text, color, ...props }) {
  return (
    <Chip
      label={text}
      sx={{ backgroundColor: color ? `${color}22` : undefined }}
      {...props}
    />
  );
}

function SpinnerAdapter({ size: sizeProp, ...props }) {
  const sizeMap = { small: 20, large: 48 };
  const size = sizeMap[sizeProp] ?? 32;
  return <CircularProgress size={size} {...props} />;
}

/* ---------------------------------------------------------------------------
 * Kanban components
 * --------------------------------------------------------------------------- */

// @dnd-kit imports for kanban drag-and-drop
import { DndContext, DragOverlay, closestCorners, PointerSensor, KeyboardSensor, useSensor, useSensors, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS as DndCSS } from '@dnd-kit/utilities';

function KanbanBoardAdapter({ onCardMove, onListReorder, children, ...props }) {
  const [activeDragId, setActiveDragId] = React.useState(null);
  const [activeDragData, setActiveDragData] = React.useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Provide board-level callbacks to children via context-like props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, {
      _boardOnCardMove: onCardMove,
      _boardOnListReorder: onListReorder,
    });
  });

  const handleDragStart = (e) => {
    setActiveDragId(e.active.id);
    setActiveDragData(e.active.data.current);
  };

  const handleDragOver = (e) => {
    const { active, over } = e;
    if (!over || !active || active.id === over.id) return;
    // Cross-list movement handled here if needed
  };

  const handleDragEnd = (e) => {
    setActiveDragId(null);
    setActiveDragData(null);
    const { active, over } = e;
    if (!over || !active) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    if (activeData?.type === 'card' && onCardMove) {
      const fromListId = activeData.listId;
      const toListId = overData?.listId || overData?.sortable?.containerId || fromListId;
      if (fromListId !== toListId || active.id !== over.id) {
        onCardMove(active.id, fromListId, toListId, 0);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexDirection: 'row', overflowX: 'auto', gap: 1.5, p: 1, minHeight: 200 }} {...props}>
        {enhancedChildren}
      </Box>
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeDragId && activeDragData ? (
          <MuiCard sx={{ opacity: 0.9, boxShadow: 4, transform: 'rotate(2deg)', cursor: 'grabbing', maxWidth: 280 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" fontWeight={500}>{activeDragData.title || activeDragId}</Typography>
            </CardContent>
          </MuiCard>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanListAdapter({
  listId,
  title,
  onAddCard,
  onRenameList,
  children,
  _boardOnCardMove,
  _boardOnListReorder,
  ...props
}) {
  const [addingCard, setAddingCard] = React.useState(false);
  const [newCardName, setNewCardName] = React.useState('');

  // Collect card IDs for SortableContext
  const cardIds = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map(child => child.props?.cardId)
    .filter(Boolean);

  const handleAddCard = () => {
    if (newCardName.trim() && onAddCard) onAddCard(listId, newCardName.trim());
    setNewCardName(''); setAddingCard(false);
  };

  // Pass listId to card children
  const enhancedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child, { _parentListId: listId });
  });

  return (
    <Box sx={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', borderRadius: 1.5, overflow: 'hidden', border: 1, borderColor: 'divider' }} {...props}>
      <Box sx={{ px: 1.5, py: 1, fontWeight: 600, borderBottom: 2, borderColor: /done/i.test(title || '') ? 'success.main' : 'primary.main' }}>
        <InlineEditAdapter value={title} variant="subtitle1" onSave={(name) => onRenameList && onRenameList(listId, name)} />
      </Box>
      <SortableContext id={listId} items={cardIds} strategy={verticalListSortingStrategy}>
        <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1, display: 'flex', flexDirection: 'column', gap: 0.75, minHeight: 40 }}>
          {enhancedChildren}
        </Box>
      </SortableContext>
      <Box sx={{ px: 1, pb: 1 }}>
        {addingCard ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <MuiTextField autoFocus size="small" placeholder="Card title..." value={newCardName} onChange={(e) => setNewCardName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddCard(); if (e.key === 'Escape') { setNewCardName(''); setAddingCard(false); } }} fullWidth />
          </Box>
        ) : (
          <MuiButton size="small" fullWidth onClick={() => setAddingCard(true)} sx={{ textTransform: 'none' }}>+ Add card</MuiButton>
        )}
      </Box>
    </Box>
  );
}

function KanbanCardAdapter({
  cardId,
  title,
  labels,
  memberCount,
  commentCount,
  hasChecklist,
  checklistDone,
  checklistTotal,
  dueDate,
  dueDone,
  dueOverdue,
  dueSoon,
  priority,
  members,
  onClick,
  children,
  _parentListId,
  ...props
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardId,
    data: { type: 'card', cardId, listId: _parentListId, title },
  });
  const style = {
    transform: DndCSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MuiCard
        onClick={onClick}
        variant="outlined"
        sx={{ cursor: onClick ? 'pointer' : 'grab', '&:hover': { borderColor: 'primary.main', boxShadow: 1 }, transition: 'all 0.15s', position: 'relative' }}
        {...props}
      >
        {/* Priority indicator */}
        {(priority === 'urgent' || priority === 'high') && (
          <Box sx={{ position: 'absolute', top: 0, left: 8, right: 8, height: 2, borderRadius: '0 0 2px 2px', bgcolor: priority === 'urgent' ? 'error.main' : 'warning.main', opacity: 0.7 }} />
        )}
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          {/* Labels */}
          {Array.isArray(labels) && labels.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
              {labels.map((lbl, i) => (
                <Chip key={i} size="small" label={lbl.name || ''} sx={{ height: 18, fontSize: 10, fontWeight: 600, bgcolor: (lbl.color || '#888') + '20', color: lbl.color || '#888', border: 'none' }} />
              ))}
            </Box>
          )}

          <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>{title}</Typography>

          {/* Meta badges */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {dueDate && (
              <Chip size="small" label={dueDate} color={dueOverdue ? 'error' : dueSoon ? 'warning' : dueDone ? 'success' : 'default'} sx={{ height: 20, fontSize: 10 }} icon={<IconAdapter name="calendar" size={10} />} />
            )}
            {checklistTotal > 0 && (
              <Typography variant="caption" color={checklistDone === checklistTotal ? 'success.main' : 'text.secondary'} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <IconAdapter name="check" size={10} /> {checklistDone}/{checklistTotal}
              </Typography>
            )}
            {commentCount > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                <IconAdapter name="message" size={10} /> {commentCount}
              </Typography>
            )}
            {memberCount > 0 && (
              <Box sx={{ ml: 'auto' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                  <IconAdapter name="user" size={10} /> {memberCount}
                </Typography>
              </Box>
            )}
          </Box>
          {children}
        </CardContent>
      </MuiCard>
    </div>
  );
}

function CardModalAdapter({ open, onClose, title, children, ...props }) {
  return (
    <Dialog open={!!open} onClose={onClose} maxWidth="sm" fullWidth {...props}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton size="small" onClick={onClose} aria-label="close">
          &#10005;
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}

function InlineEditAdapter({ value, onSave, variant = 'body1', ...props }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  // Keep draft in sync when value prop changes while not editing
  React.useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value && onSave) onSave(draft);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <MuiTextField
        autoFocus
        size="small"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        fullWidth
        {...props}
      />
    );
  }

  return (
    <Typography
      variant={variant}
      onClick={() => setEditing(true)}
      sx={{
        cursor: 'pointer',
        borderBottom: '1px dashed',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
        borderRadius: 0.5,
        px: 0.5,
        py: 0.25,
        minHeight: '1.5em',
        display: 'inline-block',
      }}
      {...props}
    >
      {value || '\u00A0Click to edit'}
    </Typography>
  );
}

function ReactNodeAdapter({ __node, ...props }) {
  if (!__node) return null;
  return React.isValidElement(__node) ? React.cloneElement(__node, props) : __node;
}

/* ---------------------------------------------------------------------------
 * Rich display components
 * --------------------------------------------------------------------------- */

function nameToColor(str) {
  if (!str) return '#666';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
}

function nameToInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function AvatarAdapter({ name, color, src, size, online, sx: sxProp, ...props }) {
  const dim = size === 'small' ? 28 : 36;
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', ...sxProp }} {...props}>
      <Box
        sx={{
          width: dim, height: dim, borderRadius: '50%',
          bgcolor: color || nameToColor(name),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: dim * 0.38, fontWeight: 600, color: '#fff',
          overflow: 'hidden',
        }}
      >
        {src ? <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : nameToInitials(name)}
      </Box>
      {online && (
        <Box sx={{
          position: 'absolute', bottom: 0, right: 0,
          width: 10, height: 10, borderRadius: '50%',
          bgcolor: '#34d399', border: '2px solid', borderColor: 'background.paper',
        }} />
      )}
    </Box>
  );
}

function AvatarStackAdapter({ members = [], max = 3, ...props }) {
  const visible = members.slice(0, max);
  const overflow = members.length - max;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', ...props.sx }}>
      {visible.map((m, i) => (
        <Box key={i} sx={{ ml: i > 0 ? '-8px' : 0, zIndex: max - i }}>
          <AvatarAdapter name={m.name} color={m.color} src={m.src} size="small" online={m.online} />
        </Box>
      ))}
      {overflow > 0 && (
        <Chip label={`+${overflow}`} size="small" sx={{ ml: 0.5, height: 24, fontSize: 11 }} />
      )}
    </Box>
  );
}

function ProgressBarAdapter({ value = 0, max = 100, label, color, sx: sxProp, ...props }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const barColor = color || (pct === 100 ? 'success.main' : 'primary.main');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sxProp }} {...props}>
      {label && <Typography variant="caption" sx={{ minWidth: 40, color: 'text.secondary' }}>{label}</Typography>}
      <Box sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: barColor, borderRadius: 1, transition: 'width 0.3s' }} />
      </Box>
      <Typography variant="caption" sx={{ minWidth: 32, textAlign: 'right', color: 'text.secondary' }}>{`${pct}%`}</Typography>
    </Box>
  );
}

function StatCardAdapter({ value, label, color, sx: sxProp, children, ...props }) {
  return (
    <MuiCard sx={{ p: 2, textAlign: 'center', flex: 1, minWidth: 100, ...sxProp }} {...props}>
      {value !== undefined && <Typography variant="h4" sx={{ fontWeight: 700, color: color || 'text.primary' }}>{value}</Typography>}
      {label !== undefined && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>}
      {children}
    </MuiCard>
  );
}

/* ── New Adapters (Amplifier-inspired shell enrichment) ──────────────────── */

function IconAdapter({ name, size = 18, color, sx, ...props }) {
  const paths = {
    search: "M11 3a8 8 0 100 16 8 8 0 000-16zM21 21l-4.35-4.35", plus: "M12 5v14M5 12h14", check: "M20 6L9 17l-5-5", edit: "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z", trash: "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2", close: "M18 6L6 18M6 6l12 12", settings: "M12 15a3 3 0 100-6 3 3 0 000 6z", bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0", user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z", users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75", folder: "M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z", dashboard: "M3 12h4l3-9 4 18 3-9h4", board: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z", lock: "M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2zM7 11V7a5 5 0 0110 0v4", flag: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7", calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z", message: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z", tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01", alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01", clock: "M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2", link: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71", grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z", zap: "M13 2L3 14h9l-1 10 10-12h-9l1-10z", bar: "M18 20V10M12 20V4M6 20v-6",
  };
  const d = paths[name] || paths.search;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={sx} {...props}>
      <path d={d} />
    </svg>
  );
}

function ModalAdapter({ open = true, title, onClose, maxWidth = 500, children, ...props }) {
  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} PaperProps={{ sx: { maxWidth, width: '100%', bgcolor: 'background.paper', borderRadius: 2, ...props.sx } }}>
      {title && <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{title}<IconButton onClick={onClose} size="small"><IconAdapter name="close" size={16} /></IconButton></DialogTitle>}
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}

function TabBarAdapter({ tabs = [], activeTab, onTabChange, children, ...props }) {
  return (
    <Box {...props}>
      <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        {tabs.map(t => (
          <MuiButton key={t.key || t.label} onClick={() => onTabChange?.(t.key || t.label)} sx={{ textTransform: 'none', borderBottom: 2, borderColor: (activeTab || tabs[0]?.key) === (t.key || t.label) ? 'primary.main' : 'transparent', borderRadius: 0, color: (activeTab || tabs[0]?.key) === (t.key || t.label) ? 'text.primary' : 'text.secondary', minWidth: 'auto', px: 2 }}>
            {t.icon && <IconAdapter name={t.icon} size={14} style={{ marginRight: 4 }} />}{t.label}
          </MuiButton>
        ))}
      </Box>
      {children}
    </Box>
  );
}

function MiniBarAdapter({ data = [], colors = [], width = 240, height = 90, ...props }) {
  const max = Math.max(...data.map(d => d.v || d.value || 0), 1);
  const bw = Math.min(26, (width - data.length * 4) / data.length);
  const tw = data.length * (bw + 4) - 4;
  const ox = (width - tw) / 2;
  return (
    <svg width={width} height={height + 18} viewBox={`0 0 ${width} ${height + 18}`} {...props}>
      {data.map((d, i) => { const v = d.v || d.value || 0; const bh = (v / max) * height; const x = ox + i * (bw + 4); return (
        <g key={i}><rect x={x} y={height - bh} width={bw} height={bh} rx={3} fill={colors[i] || '#6C8EFF'} opacity={0.85} /><text x={x + bw / 2} y={height + 13} textAnchor="middle" fontSize="8" fill="currentColor" opacity={0.5}>{d.l || d.label || ''}</text></g>
      ); })}
    </svg>
  );
}

function SparklineAdapter({ data = [], width = 220, height = 50, color = '#6C8EFF', ...props }) {
  if (data.length < 2) return null;
  const mx = Math.max(...data); const mn = Math.min(...data); const r = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - mn) / r) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...props}>
      <defs><linearGradient id="spark-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill="url(#spark-g)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChecklistAdapter({ title, items = [], onToggle, onAdd, onDelete, ...props }) {
  const [newItem, setNewItem] = React.useState('');
  const done = items.filter(i => i.checked || i.done).length;
  const pct = items.length ? Math.round(done / items.length * 100) : 0;
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5, ...props.sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography variant="subtitle2">{title}</Typography><Typography variant="caption" color="text.secondary">{done}/{items.length}</Typography></Box>
      <Box sx={{ height: 4, borderRadius: 2, bgcolor: 'action.hover', mb: 1, overflow: 'hidden' }}><Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 2, bgcolor: pct === 100 ? 'success.main' : 'primary.main', transition: 'width 0.3s' }} /></Box>
      {items.map((item, i) => (
        <Box key={item.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
          <Box onClick={() => onToggle?.(item.id || i, !item.checked)} sx={{ width: 16, height: 16, borderRadius: 0.5, border: 2, borderColor: item.checked ? 'primary.main' : 'divider', bgcolor: item.checked ? 'primary.main' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.checked && <IconAdapter name="check" size={10} color="#fff" />}</Box>
          <Typography variant="body2" sx={{ flex: 1, textDecoration: item.checked ? 'line-through' : 'none', color: item.checked ? 'text.disabled' : 'text.primary' }}>{item.name || item.text}</Typography>
          {onDelete && <IconButton size="small" onClick={() => onDelete(item.id || i)} sx={{ opacity: 0.3 }}><IconAdapter name="close" size={10} /></IconButton>}
        </Box>
      ))}
      {onAdd && <Box sx={{ display: 'flex', gap: 1, mt: 1 }}><MuiTextField size="small" placeholder="Add item..." value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); }}} sx={{ flex: 1 }} /><MuiButton size="small" onClick={() => { if (newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); }}} variant="contained">Add</MuiButton></Box>}
    </Box>
  );
}

function FilterDropdownAdapter({ label, options = [], selected = [], onChange, icon, ...props }) {
  const [open, setOpen] = React.useState(false);
  const toggle = (val) => { const s = new Set(selected); s.has(val) ? s.delete(val) : s.add(val); onChange?.([...s]); };
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }} {...props}>
      <MuiButton size="small" variant={selected.length ? 'contained' : 'outlined'} onClick={() => setOpen(!open)} sx={{ textTransform: 'none' }}>
        {icon && <IconAdapter name={icon} size={12} style={{ marginRight: 4 }} />}{label}{selected.length > 0 && ` (${selected.length})`}
      </MuiButton>
      {open && <Box sx={{ position: 'absolute', top: '100%', left: 0, mt: 0.5, minWidth: 180, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1, boxShadow: 3, zIndex: 50, p: 0.5 }}>
        {options.map(o => { const val = o.value || o.id || o; const lbl = o.label || o.name || o; const clr = o.color; const isSel = selected.includes(val); return (
          <Box key={val} onClick={() => toggle(val)} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 0.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
            {clr && <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: clr }} />}
            <Typography variant="body2" sx={{ flex: 1 }}>{lbl}</Typography>
            {isSel && <IconAdapter name="check" size={12} color="#6C8EFF" />}
          </Box>
        ); })}
      </Box>}
    </Box>
  );
}

function ThemeProviderAdapter({ mode = 'dark', children }) {
  // Theme is handled at the App level — this is a pass-through for descriptor compatibility
  return <>{children}</>;
}

function WorkspaceCardAdapter({ name, emoji, color, boardCount, cardCount, memberCount, progress, onClick, children, ...props }) {
  return (
    <MuiCard variant="outlined" sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 } : {}, transition: 'all 0.15s' }} onClick={onClick} {...props}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          {emoji && <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: (color || '#6C8EFF') + '18', color: color || '#6C8EFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, border: 1, borderColor: (color || '#6C8EFF') + '30' }}>{emoji}</Box>}
          <Box sx={{ flex: 1 }}><Typography variant="subtitle1" fontWeight={600}>{name}</Typography><Typography variant="caption" color="text.secondary">{boardCount} boards · {cardCount} cards · {progress || 0}% done</Typography></Box>
          {memberCount > 0 && <Chip size="small" icon={<IconAdapter name="users" size={12} />} label={memberCount} variant="outlined" />}
        </Box>
        {children}
      </CardContent>
    </MuiCard>
  );
}

function BoardCardAdapter({ name, emoji, cardCount, doneCount, progress, onClick, children, ...props }) {
  return (
    <MuiCard variant="outlined" sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { borderColor: 'primary.main', transform: 'translateY(-2px)', boxShadow: 2 } : {}, transition: 'all 0.15s', position: 'relative', overflow: 'hidden' }} onClick={onClick} {...props}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: 'action.hover' }}><Box sx={{ width: `${progress || 0}%`, height: '100%', bgcolor: (progress || 0) === 100 ? 'success.main' : 'primary.main' }} /></Box>
      <CardContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>{emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}<Typography variant="subtitle2" fontWeight={600}>{name}</Typography></Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box><Typography variant="h6" fontWeight={700}>{cardCount || 0}</Typography><Typography variant="caption" color="text.secondary">cards</Typography></Box>
          <Box><Typography variant="h6" fontWeight={700} color="success.main">{doneCount || 0}</Typography><Typography variant="caption" color="text.secondary">done</Typography></Box>
          <Box sx={{ ml: 'auto', textAlign: 'right' }}><Typography variant="h6" fontWeight={700}>{progress || 0}<Typography component="span" variant="caption" color="text.secondary">%</Typography></Typography><Typography variant="caption" color="text.secondary">progress</Typography></Box>
        </Box>
        {children}
      </CardContent>
    </MuiCard>
  );
}

/* --------------------------------------------------------------------------- */

const componentMap = {
  stack: StackAdapter,
  grid: GridAdapter,
  divider: DividerAdapter,
  text: TextAdapter,
  'text-field': TextFieldAdapter,
  button: ButtonAdapter,
  alert: AlertAdapter,
  form: FormAdapter,
  card: CardAdapter,
  badge: BadgeAdapter,
  spinner: SpinnerAdapter,
  'kanban-board': KanbanBoardAdapter,
  'kanban-list': KanbanListAdapter,
  'kanban-card': KanbanCardAdapter,
  'card-modal': CardModalAdapter,
  'inline-edit': InlineEditAdapter,
  'react-node': ReactNodeAdapter,
  avatar: AvatarAdapter,
  'avatar-stack': AvatarStackAdapter,
  'progress-bar': ProgressBarAdapter,
  'stat-card': StatCardAdapter,
  icon: IconAdapter,
  modal: ModalAdapter,
  'tab-bar': TabBarAdapter,
  'mini-bar': MiniBarAdapter,
  sparkline: SparklineAdapter,
  checklist: ChecklistAdapter,
  'filter-dropdown': FilterDropdownAdapter,
  'theme-provider': ThemeProviderAdapter,
  'workspace-card': WorkspaceCardAdapter,
  'board-card': BoardCardAdapter,
};

export function renderDescriptor(descriptor, key) {
  if (!descriptor) return null;

  const Component = componentMap[descriptor.type];
  if (!Component) {
    return null;
  }

  // Support both descriptor.children (explicit) and descriptor.props.children (ui-kit pattern)
  const rawChildren = descriptor.children ?? descriptor.props?.children;

  // Extract children from props so they don't get double-passed as a prop AND as JSX children
  const { children: _propsChildren, ...restProps } = descriptor.props || {};

  const renderedChildren = Array.isArray(rawChildren)
    ? rawChildren.filter(Boolean).map((child, index) => renderDescriptor(child, index))
    : null;

  return (
    <Component key={key} {...restProps}>
      {renderedChildren}
    </Component>
  );
}
