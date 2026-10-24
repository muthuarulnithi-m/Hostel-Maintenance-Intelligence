import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Grid } from '@mui/material';
import {
  BarChartOutlined, PeopleOutlined,
  ReportProblemOutlined, HomeWorkOutlined,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';

// Admin reports page redirects to warden analytics (shared data)
function AdminReportsPage() {
  const navigate = useNavigate();
  return (
    <Box>
      <PageHeader
        title="Reports"
        subtitle="System-wide analytics and reporting."
      />
      <Grid container spacing={2.5}>
        {[
          {
            title:   'Complaint Analytics',
            desc:    'Status distribution, category breakdown, monthly trends, resolution time, staff workload.',
            icon:    <BarChartOutlined sx={{ fontSize:32, color:'#4F46E5' }} />,
            color:   '#EEF2FF',
            action:  () => navigate('/admin/analytics'),
            label:   'View Analytics',
          },
          {
            title:   'User Overview',
            desc:    'See all registered students, staff, wardens, and admins in the system.',
            icon:    <PeopleOutlined sx={{ fontSize:32, color:'#0D9488' }} />,
            color:   '#F0FDFA',
            action:  () => navigate('/admin/users'),
            label:   'View Users',
          },
          {
            title:   'Complaint Management',
            desc:    'Browse, filter, and manage all complaints in the hostel system.',
            icon:    <ReportProblemOutlined sx={{ fontSize:32, color:'#D97706' }} />,
            color:   '#FFFBEB',
            action:  () => navigate('/admin/complaints'),
            label:   'View Complaints',
          },
          {
            title:   'Hostel Structure',
            desc:    'Overview of hostels, blocks, rooms, and student assignments.',
            icon:    <HomeWorkOutlined sx={{ fontSize:32, color:'#DC2626' }} />,
            color:   '#FEF2F2',
            action:  () => navigate('/admin/hostel'),
            label:   'View Hostel',
          },
        ].map(item => (
          <Grid xs={12} sm={6} key={item.title}>
            <Card sx={{ height:'100%', transition:'transform 0.2s', '&:hover':{ transform:'translateY(-2px)', boxShadow:'0 8px 24px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ p:3 }}>
                <Box sx={{ width:56, height:56, borderRadius:2, bgcolor:item.color, display:'flex', alignItems:'center', justifyContent:'center', mb:2 }}>
                  {item.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight:700, mb:0.75 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" sx={{ color:'text.secondary', mb:2.5, lineHeight:1.6 }}>
                  {item.desc}
                </Typography>
                <Button variant="outlined" onClick={item.action} size="small">
                  {item.label} →
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default AdminReportsPage;
