import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  Alert, Skeleton, Grid, Divider, Chip,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  HomeWorkOutlined,
  ExpandMoreOutlined,
  MeetingRoomOutlined,
  LayersOutlined,
} from '@mui/icons-material';
import PageHeader  from '../../components/common/PageHeader';
import EmptyState  from '../../components/common/EmptyState';
import hostelApi   from '../../api/hostelApi';

function AdminHostelPage() {
  const [hostels, setHostels] = useState([]);
  const [blocks,  setBlocks]  = useState([]);
  const [rooms,   setRooms]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [h, b, r] = await Promise.all([
        hostelApi.getAll(),
        hostelApi.getBlocks(),
        hostelApi.getRooms(),
      ]);
      setHostels(h);
      setBlocks(b);
      setRooms(r);
    } catch {
      setError('Unable to load hostel data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <Box>
        <PageHeader title="Hostel Management" />
        <Card><CardContent>
          <Skeleton variant="rectangular" height={200} />
        </CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Hostel Management"
        subtitle="Overview of hostels, blocks, and rooms."
        action={
          <Button variant="outlined" size="small" onClick={fetchData}>
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          action={<Button size="small" color="inherit" onClick={fetchData}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Summary stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Hostels', value: hostels.length,                  icon: <HomeWorkOutlined />, color: '#4F46E5' },
          { label: 'Blocks',  value: blocks.length,                   icon: <LayersOutlined />,   color: '#0D9488' },
          { label: 'Rooms',   value: rooms.length,                    icon: <MeetingRoomOutlined />, color: '#D97706' },
          { label: 'Active Rooms', value: rooms.filter(r => r.is_active).length, icon: <MeetingRoomOutlined />, color: '#10B981' },
        ].map(item => (
          <Grid item xs={6} md={3} key={item.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: '20px !important' }}>
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: `${item.color}18`, mx: 'auto', mb: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: item.color,
                  }}
                >
                  {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: item.color, lineHeight: 1 }}>
                  {item.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hostel → Block → Room hierarchy */}
      {hostels.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HomeWorkOutlined sx={{ fontSize: 36 }} />}
            title="No hostels configured"
            description="Contact the administrator to set up the hostel structure."
          />
        </Card>
      ) : (
        hostels.map(hostel => {
          const hostelBlocks = blocks.filter(b => b.hostel_id === hostel.id);
          return (
            <Card key={hostel.id} sx={{ mb: 2 }}>
              <CardContent>
                {/* Hostel header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box
                    sx={{
                      width: 44, height: 44, borderRadius: 2,
                      background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <HomeWorkOutlined sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {hostel.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Code: {hostel.code} · {hostel.address || 'No address'}
                    </Typography>
                  </Box>
                  <Chip
                    label={hostel.is_active ? 'Active' : 'Inactive'}
                    size="small"
                    sx={{
                      bgcolor: hostel.is_active ? '#D1FAE5' : '#F1F5F9',
                      color:   hostel.is_active ? '#065F46' : '#64748B',
                      fontWeight: 600, fontSize: '0.6875rem',
                    }}
                  />
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                {/* Blocks */}
                {hostelBlocks.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                    No blocks configured for this hostel.
                  </Typography>
                ) : (
                  hostelBlocks.map(block => {
                    const blockRooms = rooms.filter(r => r.block_id === block.id);
                    return (
                      <Accordion
                        key={block.id}
                        disableGutters
                        elevation={0}
                        sx={{
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px !important',
                          mb: 1,
                          '&:before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <LayersOutlined sx={{ fontSize: 18, color: '#0D9488' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              Block {block.name}
                            </Typography>
                            <Chip
                              label={`${blockRooms.length} rooms`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.6rem', bgcolor: '#F0FDFA', color: '#0D9488', fontWeight: 600 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {blockRooms.length === 0 ? (
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                No rooms in this block.
                              </Typography>
                            ) : (
                              blockRooms.map(room => (
                                <Chip
                                  key={room.id}
                                  label={`Room ${room.room_number}`}
                                  size="small"
                                  icon={<MeetingRoomOutlined sx={{ fontSize: '14px !important' }} />}
                                  sx={{
                                    bgcolor: room.is_active ? '#EEF2FF' : '#F1F5F9',
                                    color:   room.is_active ? '#4F46E5' : '#94A3B8',
                                    fontWeight: 500, fontSize: '0.6875rem',
                                    '& .MuiChip-icon': { color: 'inherit' },
                                  }}
                                />
                              ))
                            )}
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </Box>
  );
}

export default AdminHostelPage;