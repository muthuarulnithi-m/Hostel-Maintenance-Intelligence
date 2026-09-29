import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

/**
 * PageHeader
 * Consistent top section for every page.
 *
 * Props:
 *   title       (string)  — Main page title
 *   subtitle    (string)  — Optional description under the title
 *   action      (node)    — Optional button/element on the right
 *   breadcrumbs (array)   — [{ label, href? }] — optional breadcrumb trail
 */
function PageHeader({ title, subtitle, action, breadcrumbs }) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        alignItems: { sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
      }}
    >
      {/* Left side: title + optional breadcrumbs + optional subtitle */}
      <Box sx={{ flex: 1 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            separator={<NavigateNext sx={{ fontSize: 16 }} />}
            sx={{ mb: 0.5 }}
          >
            {breadcrumbs.map((crumb, i) =>
              crumb.href ? (
                <Link
                  key={i}
                  href={crumb.href}
                  underline="hover"
                  sx={{ fontSize: '0.75rem', color: 'text.disabled' }}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography
                  key={i}
                  sx={{ fontSize: '0.75rem', color: 'text.disabled' }}
                >
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* Right side: action button(s) */}
      {action && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          {action}
        </Box>
      )}
    </Box>
  );
}

export default PageHeader;