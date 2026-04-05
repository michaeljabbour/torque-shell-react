import React, { useState, useRef, useEffect, useCallback } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function Layout({ children, navItems = [], branding = {}, user, userProfile, onLogout, token }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchTimer = useRef(null);
  const searchRef = useRef(null);

  // Board picker state
  const [boardPickerOpen, setBoardPickerOpen] = useState(false);
  const [boards, setBoards] = useState([]);
  const boardPickerRef = useRef(null);

  const handleAvatarClick = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNavigate = (path) => { handleMenuClose(); navigate(path); };
  const handleSignOut = () => { handleMenuClose(); localStorage.clear(); if (onLogout) onLogout(); window.location.reload(); };

  // Close dropdowns on outside click
  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (boardPickerRef.current && !boardPickerRef.current.contains(e.target)) setBoardPickerOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Load boards for picker
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const wsRes = await fetch('/api/workspaces', { headers });
        const workspaces = await wsRes.json();
        const all = [];
        for (const ws of (Array.isArray(workspaces) ? workspaces : workspaces.data || [])) {
          const bRes = await fetch(`/api/workspaces/${ws.id}/boards`, { headers });
          const bds = await bRes.json();
          for (const b of (Array.isArray(bds) ? bds : bds.data || [])) {
            all.push({ ...b, wsName: ws.name, wsId: ws.id });
          }
        }
        setBoards(all);
      } catch {}
    })();
  }, [token]);

  // Search typeahead
  const doSearch = useCallback(async (q) => {
    if (!q.trim() || !token) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSearchResults((Array.isArray(data) ? data : data.data || []).slice(0, 6));
    } catch { setSearchResults([]); }
  }, [token]);

  const onSearchChange = (val) => {
    setSearchQuery(val);
    setSearchOpen(true);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 200);
  };

  // Sort nav items by order field, filter by roles
  const userRole = user?.role || 'user';
  const sortedNavItems = [...navItems]
    .filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(userRole) || item.roles.includes('*');
    })
    .sort((a, b) => (a.order || 50) - (b.order || 50));

  const displayName = userProfile?.display_name || user?.name;
  const avatarSrc = userProfile?.avatar_url || user?.avatar_url || undefined;
  const initials = getInitials(displayName);
  const avatarBg = stringToColor(displayName || 'User');

  // Group boards by workspace for picker
  const boardsByWs = {};
  boards.forEach(b => {
    if (!boardsByWs[b.wsName]) boardsByWs[b.wsName] = [];
    boardsByWs[b.wsName].push(b);
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ gap: 0.5 }}>
          <Typography
            variant="subtitle2"
            onClick={() => navigate('/')}
            sx={{ color: 'primary.main', cursor: 'pointer', letterSpacing: '-0.02em', fontWeight: 700, mr: 1.5 }}
          >
            {branding.name || branding.title || 'Torque'}
          </Typography>

          {/* Nav items */}
          {sortedNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                size="small"
                sx={{ color: isActive ? 'primary.main' : 'text.secondary', bgcolor: isActive ? 'action.selected' : 'transparent', fontSize: 12, textTransform: 'none', minWidth: 'auto', px: 1.5 }}
              >
                {item.label}
              </Button>
            );
          })}

          {/* Board picker */}
          <Box ref={boardPickerRef} sx={{ position: 'relative' }}>
            <Button size="small" onClick={() => setBoardPickerOpen(!boardPickerOpen)} sx={{ fontSize: 12, textTransform: 'none', color: 'text.secondary', minWidth: 'auto', px: 1.5 }}>
              <DashboardIcon sx={{ fontSize: 14, mr: 0.5 }} /> Boards ▾
            </Button>
            {boardPickerOpen && (
              <Paper sx={{ position: 'absolute', top: '100%', left: 0, mt: 0.5, minWidth: 240, maxHeight: 340, overflowY: 'auto', zIndex: 1300, boxShadow: 4, p: 0.5 }}>
                {Object.entries(boardsByWs).map(([wsName, wBoards]) => (
                  <Box key={wsName}>
                    <Typography variant="overline" sx={{ px: 1, py: 0.5, display: 'block', color: 'text.disabled', fontSize: 9 }}>{wsName}</Typography>
                    {wBoards.map(b => (
                      <MenuItem key={b.id} onClick={() => { navigate(`/boards/${b.id}`); setBoardPickerOpen(false); }} dense sx={{ fontSize: 12, borderRadius: 0.5 }}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Box>
                ))}
                {boards.length === 0 && <Typography variant="body2" sx={{ p: 1, color: 'text.secondary', textAlign: 'center' }}>No boards</Typography>}
              </Paper>
            )}
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Search bar with typeahead */}
          <Box ref={searchRef} sx={{ position: 'relative', width: 220 }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { navigate(`/search/${encodeURIComponent(searchQuery)}`); setSearchOpen(false); } if (e.key === 'Escape') setSearchOpen(false); }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment>,
                  sx: { fontSize: 12, height: 32 },
                },
              }}
              fullWidth
            />
            {searchOpen && searchQuery.trim() && (
              <Paper sx={{ position: 'absolute', top: '100%', right: 0, left: 0, mt: 0.5, zIndex: 1300, boxShadow: 4, p: 0.5 }}>
                {searchResults.length === 0 && <Typography variant="body2" sx={{ p: 1, color: 'text.secondary', textAlign: 'center', fontSize: 11 }}>No results</Typography>}
                {searchResults.map((r, i) => (
                  <MenuItem key={r.id || i} onClick={() => { if (r.board_id) navigate(`/boards/${r.board_id}`); else navigate(`/search/${encodeURIComponent(searchQuery)}`); setSearchOpen(false); setSearchQuery(''); }} dense sx={{ fontSize: 11, borderRadius: 0.5 }}>
                    <ListItemText primary={r.title || r.name} secondary={r.type || 'card'} slotProps={{ primary: { sx: { fontSize: 12, fontWeight: 500 } }, secondary: { sx: { fontSize: 9 } } }} />
                    <Chip size="small" label={r.type || 'card'} sx={{ height: 16, fontSize: 9 }} />
                  </MenuItem>
                ))}
                {searchResults.length > 0 && (
                  <MenuItem onClick={() => { navigate(`/search/${encodeURIComponent(searchQuery)}`); setSearchOpen(false); }} dense sx={{ justifyContent: 'center', color: 'primary.main', fontSize: 11 }}>
                    View all results
                  </MenuItem>
                )}
              </Paper>
            )}
          </Box>

          {/* User avatar + menu */}
          <Box sx={{ ml: 1 }}>
            <IconButton onClick={handleAvatarClick} size="small" sx={{ p: 0.5 }}>
              <Avatar src={avatarSrc} sx={{ width: 28, height: 28, bgcolor: avatarBg, fontSize: 12, fontWeight: 600 }}>{initials}</Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose} onClick={handleMenuClose} slotProps={{ paper: { sx: { width: 200, mt: 1 } } }} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" noWrap>{displayName || 'User'}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>{user?.email || ''}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => handleNavigate('/profile')}><ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon><ListItemText>Profile</ListItemText></MenuItem>
              <MenuItem onClick={() => handleNavigate('/settings')}><ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon><ListItemText>Settings</ListItemText></MenuItem>
              <Divider />
              <MenuItem onClick={handleSignOut}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon><ListItemText>Sign out</ListItemText></MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, width: '100%' }}>
        {children}
      </Box>
    </Box>
  );
}
