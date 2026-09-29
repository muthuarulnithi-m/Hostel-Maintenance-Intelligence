import React from 'react';
import {
  Box, Paper, Typography, Chip, Collapse,
} from '@mui/material';
import {
  AutoAwesomeOutlined,
  CategoryOutlined,
  PriorityHighOutlined,
} from '@mui/icons-material';
import { getConfidenceColor, SKILL_CATEGORY_MAP } from '../../utils/intelligence';
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '../../utils/formatters';

/**
 * ClassificationSuggestion
 * Shown on the New Complaint form as the student types.
 * Displays the AI-predicted category, priority, and confidence.
 *
 * Props:
 *   result    — return value from classifyComplaint(), or null
 *   onApply   — fn({ category, priority }) called when student accepts suggestion
 *   applied   — bool — whether suggestion was already applied
 */
function ClassificationSuggestion({ result, onApply, applied }) {
  if (!result) return null;

  const catConfig  = CATEGORY_CONFIG[result.category]  || CATEGORY_CONFIG.GENERAL;
  const priConfig  = PRIORITY_CONFIG[result.priority]   || PRIORITY_CONFIG.MEDIUM;
  const confColor  = getConfidenceColor(result.confidence);

  return (
    <Collapse in={!!result}>
      <Paper
        variant="outlined"
        sx={{
          mt: 1.5,
          p: 2,
          borderRadius: 2,
          borderColor: applied ? '#BBF7D0' : '#C7D2FE',
          bgcolor:     applied ? '#F0FDF4' : '#EEF2FF',
          transition:  'all 0.3s ease',
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <AutoAwesomeOutlined
            sx={{ fontSize: 16, color: applied ? '#10B981' : '#4F46E5' }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color:      applied ? '#065F46' : '#3730A3',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            {applied ? 'Intelligence Applied ✓' : 'Smart Classification'}
          </Typography>
          {/* Confidence badge */}
          <Chip
            label={`${result.confidence} confidence`}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.6rem',
              fontWeight: 700,
              bgcolor: `${confColor}18`,
              color:   confColor,
              ml: 'auto',
            }}
          />
        </Box>

        {/* Predictions */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>
          {/* Category */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryOutlined sx={{ fontSize: 14, color: catConfig.color }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Category:
            </Typography>
            <Chip
              label={catConfig.label}
              size="small"
              sx={{
                height: 20, fontSize: '0.6875rem', fontWeight: 600,
                bgcolor: catConfig.bg, color: catConfig.color,
              }}
            />
          </Box>

          {/* Priority */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PriorityHighOutlined sx={{ fontSize: 14, color: priConfig.color }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Priority:
            </Typography>
            <Chip
              label={priConfig.label}
              size="small"
              sx={{
                height: 20, fontSize: '0.6875rem', fontWeight: 600,
                bgcolor: priConfig.bg, color: priConfig.color,
              }}
            />
          </Box>
        </Box>

        {/* Matched keywords */}
        {result.matchedKeywords.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', mr: 0.5 }}>
              Detected keywords:
            </Typography>
            {result.matchedKeywords.slice(0, 5).map(kw => (
              <Chip
                key={kw}
                label={kw}
                size="small"
                sx={{
                  height: 16, fontSize: '0.6rem', mr: 0.5,
                  bgcolor: '#F1F5F9', color: '#475569',
                }}
              />
            ))}
          </Box>
        )}

        {/* Apply button — only show if not yet applied */}
        {!applied && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
              Detected from your description. Click to auto-fill the fields.
            </Typography>
            <Chip
              label="Apply Suggestion"
              onClick={() => onApply({ category: result.category, priority: result.priority })}
              size="small"
              sx={{
                bgcolor: '#4F46E5', color: '#fff',
                fontWeight: 600, fontSize: '0.6875rem',
                cursor: 'pointer', height: 24,
                '&:hover': { bgcolor: '#3730A3' },
              }}
            />
          </Box>
        )}

        {applied && (
          <Typography variant="caption" sx={{ color: '#065F46' }}>
            Category and priority have been auto-filled from the detected keywords.
            You can still change them manually.
          </Typography>
        )}
      </Paper>
    </Collapse>
  );
}

export default ClassificationSuggestion;