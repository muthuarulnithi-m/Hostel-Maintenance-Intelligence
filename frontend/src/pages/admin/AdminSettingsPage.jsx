import React from 'react';
import { Box, Card, CardContent, Typography, Alert, Divider, Chip } from '@mui/material';
import {
  SettingsOutlined, SecurityOutlined,
  StorageOutlined, InfoOutlined,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';

function AdminSettingsPage() {
  const systemInfo = [
    { label: 'Application',   value: 'Hostel Maintenance Intelligence System' },
    { label: 'Frontend',      value: 'React + Vite + MUI' },
    { label: 'Backend',       value: 'FastAPI + PostgreSQL' },
    { label: 'Auth',          value: 'JWT (HS256, 60 min expiry)' },
    { label: 'API Base URL',  value: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000' },
    { label: 'Environment',   value: import.meta.env.MODE || 'development' },
  ];

  return (
    <Box>
      <PageHeader
        title="System Settings"
        subtitle="System configuration and information."
      />

      <Alert severity="info" sx={{ mb:3, borderRadius:2 }} icon={<InfoOutlined />}>
        System settings are managed through the backend configuration file.
        Contact the system administrator to change server-side settings.
      </Alert>

      <Grid container spacing={2.5}>
        {/* System Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
                <StorageOutlined sx={{ color:'#4F46E5' }} />
                <Typography variant="h6" sx={{ fontWeight:600 }}>System Information</Typography>
              </Box>
              {systemInfo.map((item, i) => (
                <Box key={item.label}>
                  {i > 0 && <Divider sx={{ my:1.25 }} />}
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:2 }}>
                    <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight:600, textAlign:'right', maxWidth:220, wordBreak:'break-all' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Security info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:2 }}>
                <SecurityOutlined sx={{ color:'#10B981' }} />
                <Typography variant="h6" sx={{ fontWeight:600 }}>Security Configuration</Typography>
              </Box>
              {[
                { label:'Auth Method',     value:'JWT Bearer Token' },
                { label:'Token Algorithm', value:'HS256' },
                { label:'Token Expiry',    value:'60 minutes' },
                { label:'Password Hash',   value:'bcrypt' },
                { label:'Role System',     value:'STUDENT / STAFF / WARDEN / ADMIN' },
                { label:'CORS',            value:'Backend configured' },
              ].map((item, i) => (
                <Box key={item.label}>
                  {i > 0 && <Divider sx={{ my:1.25 }} />}
                  <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:2 }}>
                    <Typography variant="caption" sx={{ color:'text.secondary', fontWeight:500 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight:600, textAlign:'right' }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// Need Grid imported
import { Grid } from '@mui/material';

export default AdminSettingsPage;