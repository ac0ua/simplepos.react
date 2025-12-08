import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Menu,
  MenuItem,
  Divider,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Backdrop
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as CartIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  FileDownload as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Insights as InsightsIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ErrorOutline as OutlierIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { IS_PHP_BACKEND } from '../config/api';

// Simple chart components using SVG
const BarChart = ({ data, dataKey, nameKey, color = '#f97306', height = 200 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: typeof height === 'number' ? height : 400 });
  
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height: h } = entry.contentRect;
          if (width > 0 && h > 0) {
            setDimensions({ width, height: h });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available</Typography>;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
  const chartHeight = dimensions.height;
  const chartWidth = dimensions.width;
  const barWidth = Math.max(20, Math.min(80, (chartWidth / data.length) - 10));
  
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: height === '100%' ? '100%' : height, position: 'relative', overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? ((item[dataKey] || 0) / maxValue) * (chartHeight - 60) : 0;
          const x = (index / data.length) * chartWidth + barWidth / 4;
          return (
            <g key={index}>
              <rect
                x={x}
                y={chartHeight - barHeight - 40}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={4}
                opacity={0.9}
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight - 10}
                textAnchor="middle"
                fontSize={Math.max(10, Math.min(14, chartWidth / data.length / 6))}
                fill="currentColor"
              >
                {String(item[nameKey] || '').substring(0, 8)}
              </text>
              <text
                x={x + barWidth / 2}
                y={chartHeight - barHeight - 45}
                textAnchor="middle"
                fontSize={Math.max(10, Math.min(14, chartWidth / data.length / 6))}
                fill="currentColor"
                fontWeight="bold"
              >
                {typeof item[dataKey] === 'number' ? item[dataKey].toLocaleString() : item[dataKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

const PieChart = ({ data, dataKey, nameKey, colors = ['#f97306', '#4caf50', '#2196f3', '#9c27b0', '#ff5722', '#607d8b'], height = 200 }) => {
  const containerRef = useRef(null);
  const [size, setSize] = useState(typeof height === 'number' ? height : 300);
  
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height: h } = entry.contentRect;
          if (width > 0 && h > 0) {
            setSize(Math.min(h, width * 0.5));
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available</Typography>;
  
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);
  if (total === 0) return <Typography color="text.secondary">No data available</Typography>;
  
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  let currentAngle = -90;
  
  const slices = data.map((item, index) => {
    const value = item[dataKey] || 0;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    
    return {
      path: pathData,
      color: colors[index % colors.length],
      name: item[nameKey],
      value,
      percentage: percentage.toFixed(1)
    };
  });
  
  return (
    <Box ref={containerRef} sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', height: height === '100%' ? '100%' : height }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => (
          <path
            key={index}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
      <Box sx={{ flex: 1, overflow: 'auto', maxHeight: '100%' }}>
        {slices.map((slice, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: slice.color, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {slice.name}: <strong>{slice.percentage}%</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const LineChart = ({ data, dataKey, nameKey, color = '#f97306', height = 200 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: typeof height === 'number' ? height : 400 });
  
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height: h } = entry.contentRect;
          if (width > 0 && h > 0) {
            setDimensions({ width, height: h });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available</Typography>;
  
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0));
  const minValue = Math.min(...data.map(d => d[dataKey] || 0));
  const range = maxValue - minValue || 1;
  
  const chartWidth = dimensions.width;
  const chartHeight = dimensions.height;
  const padding = 50;
  
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((item[dataKey] - minValue) / range) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: height === '100%' ? '100%' : height, overflow: 'hidden' }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + ratio * (chartHeight - padding * 2)}
            x2={chartWidth - padding}
            y2={padding + ratio * (chartHeight - padding * 2)}
            stroke="currentColor"
            strokeOpacity={0.1}
          />
        ))}
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        
        {/* Area fill */}
        <polygon
          points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`}
          fill={color}
          fillOpacity={0.15}
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
          const y = chartHeight - padding - ((item[dataKey] - minValue) / range) * (chartHeight - padding * 2);
          return (
            <g key={index}>
              <circle cx={x} cy={y} r={6} fill={color} />
              {index % Math.ceil(data.length / 8) === 0 && (
                <text x={x} y={chartHeight - 15} textAnchor="middle" fontSize="12" fill="currentColor">
                  {String(item[nameKey] || '').substring(0, 8)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

const BellCurveChart = ({ data, height = 200 }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: typeof height === 'number' ? height : 400 });
  
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const { width, height: h } = entry.contentRect;
          if (width > 0 && h > 0) {
            setDimensions({ width, height: h });
          }
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  
  if (!data || data.length === 0) return <Typography color="text.secondary">No data available</Typography>;
  
  const maxCount = Math.max(...data.map(d => d.count || 0));
  const chartWidth = dimensions.width;
  const chartHeight = dimensions.height;
  const padding = 50;
  
  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((item.count || 0) / (maxCount || 1)) * (chartHeight - padding * 2);
    return { x, y, item };
  });
  
  const pathData = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx1 = prev.x + (point.x - prev.x) / 3;
    const cpx2 = prev.x + (point.x - prev.x) * 2 / 3;
    return `${acc} C ${cpx1} ${prev.y} ${cpx2} ${point.y} ${point.x} ${point.y}`;
  }, '');
  
  return (
    <Box ref={containerRef} sx={{ width: '100%', height: height === '100%' ? '100%' : height }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Curve */}
        <path
          d={pathData}
          fill="none"
          stroke="#f97306"
          strokeWidth="3"
        />
        
        {/* Area */}
        <path
          d={`${pathData} L ${points[points.length - 1]?.x || 0} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
          fill="#f97306"
          fillOpacity={0.2}
        />
        
        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r={6} fill="#f97306" />
            <text x={point.x} y={chartHeight - 15} textAnchor="middle" fontSize="12" fill="currentColor">
              {point.item.range?.split('-')[0] || ''}
            </text>
          </g>
        ))}
      </svg>
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color = 'primary.main', onClick }) => (
  <Card 
    sx={{ 
      height: '100%', 
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 4 } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}15` }}>
          <Icon sx={{ color, fontSize: 24 }} />
        </Box>
        {trend && (
          <Chip
            size="small"
            icon={trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={`${trendValue > 0 ? '+' : ''}${trendValue}%`}
            sx={{
              bgcolor: trend === 'up' ? 'success.light' : 'error.light',
              color: trend === 'up' ? 'success.dark' : 'error.dark',
              fontWeight: 'bold',
              fontSize: '0.7rem'
            }}
          />
        )}
      </Box>
      <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary', mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Expandable Callout Component with item list
const CalloutWithItems = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color = 'warning', 
  items = [], 
  itemLabelKey = 'name',
  itemValueKey = 'value',
  itemValuePrefix = '',
  onItemClick,
  actionLabel = 'View',
  maxItems = 5
}) => {
  const [expanded, setExpanded] = useState(false);
  const displayItems = expanded ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;
  
  return (
    <Alert 
      severity={color} 
      variant="filled"
      icon={Icon ? <Icon /> : undefined}
      sx={{ mb: 2 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
          <Typography variant="h6" fontWeight="bold">{value}</Typography>
          {description && <Typography variant="caption">{description}</Typography>}
        </Box>
        {items.length > 0 && (
          <Button 
            size="small" 
            variant="outlined"
            sx={{ 
              color: 'inherit', 
              borderColor: 'rgba(255,255,255,0.5)',
              '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
            }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Hide' : 'Show Items'}
          </Button>
        )}
      </Box>
      
      {items.length > 0 && (expanded || items.length <= 3) && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', mb: 1 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {displayItems.map((item, index) => (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderRadius: 1,
                  px: 1.5,
                  py: 0.75
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {item[itemLabelKey]}
                  </Typography>
                  {item[itemValueKey] !== undefined && (
                    <Chip 
                      size="small" 
                      label={`${itemValuePrefix}${item[itemValueKey]}`}
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'inherit',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </Box>
                {onItemClick && (
                  <Button 
                    size="small" 
                    variant="text"
                    sx={{ 
                      color: 'inherit', 
                      minWidth: 'auto',
                      textDecoration: 'underline',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                    }}
                    onClick={() => onItemClick(item)}
                  >
                    {actionLabel}
                  </Button>
                )}
              </Box>
            ))}
            {hasMore && !expanded && (
              <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5 }}>
                +{items.length - maxItems} more items...
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Alert>
  );
};

// Clickable Chart Card with fullscreen modal
const ChartCard = ({ title, icon: Icon, children, height = 220 }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Paper 
        sx={{ 
          p: 2, 
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { 
            boxShadow: 6,
            transform: 'translateY(-2px)',
            '& .expand-icon': { opacity: 1 }
          }
        }}
        onClick={() => setOpen(true)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {Icon && <Icon color="primary" fontSize="small" />} {title}
          </Typography>
          <FullscreenIcon 
            className="expand-icon"
            sx={{ 
              fontSize: 18, 
              color: 'text.secondary',
              opacity: 0.3,
              transition: 'opacity 0.2s'
            }} 
          />
        </Box>
        <Box sx={{ height }}>
          {children}
        </Box>
      </Paper>
      
      {/* Fullscreen Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth={false}
        fullWidth
        fullScreen
        TransitionComponent={Fade}
        PaperProps={{
          sx: { 
            bgcolor: 'background.paper',
            m: 2,
            borderRadius: 2,
            maxHeight: 'calc(100vh - 32px)',
            maxWidth: 'calc(100vw - 32px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.5
        }}>
          <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {Icon && <Icon color="primary" fontSize="large" />} {title}
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="large">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            flex: 1, 
            width: '100%', 
            height: '100%',
            minHeight: 0,
            '& > *': { width: '100%', height: '100%' },
            '& svg': { width: '100%', height: '100%' }
          }}>
            {React.cloneElement(children, { height: '100%' })}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Compact Callout Card for side-by-side layout
const CalloutCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'warning.main',
  bgColor = 'warning.light',
  items = [], 
  itemLabelKey = 'name',
  itemValueKey = 'value',
  itemValuePrefix = '',
  onItemClick,
  actionLabel = 'Fix'
}) => {
  return (
    <Card sx={{ height: '100%', borderLeft: 4, borderColor: color }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {Icon && <Icon sx={{ color, fontSize: 20 }} />}
          <Typography variant="subtitle2" fontWeight="bold">{title}</Typography>
        </Box>
        <Typography variant="h5" fontWeight="bold" sx={{ color, mb: 1 }}>{value}</Typography>
        
        {items.length > 0 && (
          <Box sx={{ maxHeight: 180, overflow: 'auto' }}>
            {items.map((item, index) => (
              <Box 
                key={index}
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 0.5,
                  px: 1,
                  mb: 0.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  fontSize: '0.8rem'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {item[itemLabelKey]}
                  </Typography>
                  <Chip 
                    size="small" 
                    label={`${itemValuePrefix}${item[itemValueKey]}`}
                    sx={{ fontSize: '0.65rem', height: 18 }}
                  />
                </Box>
                {onItemClick && (
                  <Button 
                    size="small" 
                    sx={{ minWidth: 'auto', fontSize: '0.7rem', ml: 0.5 }}
                    onClick={(e) => { e.stopPropagation(); onItemClick(item); }}
                  >
                    {actionLabel}
                  </Button>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const InsightsDashboard = () => {
  const navigate = useNavigate();
  const { storeGuid, label } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exportAnchor, setExportAnchor] = useState(null);
  
  // Fetch insights data
  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = IS_PHP_BACKEND 
        ? '/analytics/insights.php'
        : '/analytics/insights';
      
      const response = await axios.get(endpoint, {
        params: { storeGuid, startDate, endDate }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError('Failed to load insights data. Please try again.');
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (storeGuid) {
      fetchInsights();
    }
  }, [storeGuid, startDate, endDate]);
  
  // Export functions
  const exportToCSV = () => {
    if (!data) return;
    
    const rows = [
      ['Insights Report', `${startDate} to ${endDate}`],
      [],
      ['Summary Statistics'],
      ['Total Orders', data.summary.totalOrders],
      ['Total Revenue', `$${data.summary.totalRevenue.toFixed(2)}`],
      ['Average Order Value', `$${data.summary.averageOrderValue.toFixed(2)}`],
      ['Min Order Value', `$${data.summary.minOrderValue.toFixed(2)}`],
      ['Max Order Value', `$${data.summary.maxOrderValue.toFixed(2)}`],
      [],
      ['Orders by Status'],
      ['Status', 'Count', 'Revenue'],
      ...data.ordersByStatus.map(s => [s.status, s.count, `$${s.revenue.toFixed(2)}`]),
      [],
      ['Top Products'],
      ['Product', 'Quantity Sold', 'Revenue'],
      ...data.topProducts.map(p => [p.name, p.quantity, `$${p.revenue.toFixed(2)}`]),
      [],
      ['Category Performance'],
      ['Category', 'Quantity', 'Revenue'],
      ...data.categoryStats.map(c => [c.category, c.quantity, `$${c.revenue.toFixed(2)}`]),
      [],
      ['Recent Orders'],
      ['Order ID', 'Customer', 'Total', 'Status', 'Payment', 'Items', 'Date'],
      ...data.recentOrders.map(o => [
        o.orderId, o.orderName || 'Guest', `$${o.total.toFixed(2)}`, 
        o.status, o.paymentMethod || 'N/A', o.totalItems, o.createdAt
      ])
    ];
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `insights_${startDate}_${endDate}.csv`;
    link.click();
    toast.success('CSV exported successfully!');
    setExportAnchor(null);
  };
  
  const exportToPDF = () => {
    if (!data) return;
    
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Insights Report - ${startDate} to ${endDate}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #f97306; border-bottom: 2px solid #f97306; padding-bottom: 10px; }
          h2 { color: #555; margin-top: 30px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
          .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #f97306; }
          .stat-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f97306; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .trend-up { color: #4caf50; }
          .trend-down { color: #f44336; }
          .callout { background: #fff3e0; border-left: 4px solid #f97306; padding: 15px; margin: 15px 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <h1>📊 Insights Report</h1>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        
        <h2>Summary Statistics</h2>
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-value">${data.summary.totalOrders}</div>
            <div class="stat-label">Total Orders</div>
            <div class="${data.summary.orderChange >= 0 ? 'trend-up' : 'trend-down'}">
              ${data.summary.orderChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.orderChange)}% vs prev period
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${data.summary.totalRevenue.toFixed(2)}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="${data.summary.revenueChange >= 0 ? 'trend-up' : 'trend-down'}">
              ${data.summary.revenueChange >= 0 ? '↑' : '↓'} ${Math.abs(data.summary.revenueChange)}% vs prev period
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">$${data.summary.averageOrderValue.toFixed(2)}</div>
            <div class="stat-label">Avg Order Value</div>
          </div>
        </div>
        
        <div class="callout">
          <strong>📈 Key Insight:</strong> 
          Min order: $${data.summary.minOrderValue.toFixed(2)} | 
          Max order: $${data.summary.maxOrderValue.toFixed(2)} | 
          Range: $${(data.summary.maxOrderValue - data.summary.minOrderValue).toFixed(2)}
        </div>
        
        <h2>Orders by Status</h2>
        <table>
          <tr><th>Status</th><th>Count</th><th>Revenue</th></tr>
          ${data.ordersByStatus.map(s => `<tr><td>${s.status}</td><td>${s.count}</td><td>$${s.revenue.toFixed(2)}</td></tr>`).join('')}
        </table>
        
        <h2>Top 10 Products</h2>
        <table>
          <tr><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr>
          ${data.topProducts.map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.revenue.toFixed(2)}</td></tr>`).join('')}
        </table>
        
        <h2>Category Performance</h2>
        <table>
          <tr><th>Category</th><th>Qty Sold</th><th>Revenue</th></tr>
          ${data.categoryStats.map(c => `<tr><td>${c.category}</td><td>${c.quantity}</td><td>$${c.revenue.toFixed(2)}</td></tr>`).join('')}
        </table>
        
        ${data.inventory.lowStockCount > 0 ? `
        <div class="callout" style="background: #ffebee; border-color: #f44336;">
          <strong>⚠️ Low Stock Alert:</strong> ${data.inventory.lowStockCount} items are running low on stock!
        </div>
        ` : ''}
        
        ${data.outliers.length > 0 ? `
        <h2>Order Outliers</h2>
        <table>
          <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Date</th></tr>
          ${data.outliers.slice(0, 10).map(o => `<tr><td>${o.orderId}</td><td>${o.orderName || 'Guest'}</td><td>$${o.total.toFixed(2)}</td><td>${o.createdAt}</td></tr>`).join('')}
        </table>
        ` : ''}
        
        <h2>Recent Orders (Last 50)</h2>
        <table>
          <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr>
          ${data.recentOrders.slice(0, 50).map(o => `<tr><td>${o.orderId}</td><td>${o.orderName || 'Guest'}</td><td>$${o.total.toFixed(2)}</td><td>${o.status}</td><td>${o.paymentMethod || 'N/A'}</td><td>${o.createdAt}</td></tr>`).join('')}
        </table>
        
        <p style="margin-top: 40px; color: #999; font-size: 12px;">
          Generated on ${new Date().toLocaleString()} | SimplePOS Insights
        </p>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    toast.success('PDF ready for printing!');
    setExportAnchor(null);
  };
  
  // Format currency
  const formatCurrency = (value) => `$${(value || 0).toFixed(2)}`;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: 3, py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate(`/${storeGuid}/${label}/order.html`)}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="caption" sx={{ color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                Analytics
              </Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InsightsIcon sx={{ color: 'primary.main' }} />
                Insights Dashboard
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <DatePicker
              label="Start Date"
              value={startDate ? new Date(startDate + 'T00:00:00') : null}
              onChange={(newValue) => {
                if (newValue) {
                  const formatted = newValue.toISOString().split('T')[0];
                  setStartDate(formatted);
                }
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate ? new Date(endDate + 'T00:00:00') : null}
              onChange={(newValue) => {
                if (newValue) {
                  const formatted = newValue.toISOString().split('T')[0];
                  setEndDate(formatted);
                }
              }}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchInsights}
              size="small"
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<ExportIcon />}
              onClick={(e) => setExportAnchor(e.currentTarget)}
              size="small"
            >
              Export
            </Button>
            <Menu
              anchorEl={exportAnchor}
              open={Boolean(exportAnchor)}
              onClose={() => setExportAnchor(null)}
            >
              <MenuItem onClick={exportToCSV}>
                <CsvIcon sx={{ mr: 1 }} /> Export as CSV
              </MenuItem>
              <MenuItem onClick={exportToPDF}>
                <PdfIcon sx={{ mr: 1 }} /> Export as PDF
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
      
      {error ? (
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      ) : data ? (
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* Summary Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Total Orders"
                value={data.summary.totalOrders}
                icon={CartIcon}
                trend={data.summary.orderChange >= 0 ? 'up' : 'down'}
                trendValue={data.summary.orderChange}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(data.summary.totalRevenue)}
                icon={MoneyIcon}
                trend={data.summary.revenueChange >= 0 ? 'up' : 'down'}
                trendValue={data.summary.revenueChange}
                color="success.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Avg Order"
                value={formatCurrency(data.summary.averageOrderValue)}
                icon={TrendingUpIcon}
                trend={data.summary.avgOrderChange >= 0 ? 'up' : 'down'}
                trendValue={data.summary.avgOrderChange}
                color="info.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Min Order"
                value={formatCurrency(data.summary.minOrderValue)}
                subtitle="Lowest sale"
                icon={TrendingDownIcon}
                color="warning.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Max Order"
                value={formatCurrency(data.summary.maxOrderValue)}
                subtitle="Highest sale"
                icon={StarIcon}
                color="secondary.main"
              />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <StatCard
                title="Low Stock"
                value={data.inventory.lowStockCount}
                subtitle={`${data.inventory.outOfStockCount} out of stock`}
                icon={WarningIcon}
                color={data.inventory.lowStockCount > 0 ? 'error.main' : 'success.main'}
              />
            </Grid>
          </Grid>
          
          {/* Callout Cards - Side by Side */}
          {(data.outliers.length > 0 || data.inventory.lowStockCount > 0 || data.inventory.outOfStockCount > 0) && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {data.outliers.length > 0 && (
                <Grid item xs={12} sm={6} md={4}>
                  <CalloutCard
                    title="Order Outliers"
                    value={`${data.outliers.length} unusual orders`}
                    icon={OutlierIcon}
                    color="warning.main"
                    items={data.outliers.map(o => ({
                      name: `#${o.orderId?.slice(-8) || 'N/A'} - ${o.orderName || 'Guest'}`,
                      value: `$${o.total.toFixed(2)}`,
                      orderId: o.orderId
                    }))}
                    itemLabelKey="name"
                    itemValueKey="value"
                    onItemClick={(item) => {
                      setActiveTab(4);
                      toast.success(`Viewing outlier order`);
                    }}
                    actionLabel="View"
                  />
                </Grid>
              )}
              
              {data.inventory.outOfStockCount > 0 && (
                <Grid item xs={12} sm={6} md={4}>
                  <CalloutCard
                    title="Out of Stock"
                    value={`${data.inventory.outOfStockCount} items`}
                    icon={WarningIcon}
                    color="error.main"
                    items={data.inventory.lowStockItems
                      .filter(item => item.stockQuantity <= 0)
                      .map(item => ({
                        name: item.name,
                        value: 0,
                        id: item.id
                      }))}
                    itemLabelKey="name"
                    itemValueKey="value"
                    itemValuePrefix="Stock: "
                    onItemClick={(item) => {
                      navigate(`/${storeGuid}/${label}/menu-builder`);
                      toast.success(`Navigate to restock: ${item.name}`);
                    }}
                    actionLabel="Restock"
                  />
                </Grid>
              )}
              
              {data.inventory.lowStockCount > 0 && (
                <Grid item xs={12} sm={6} md={4}>
                  <CalloutCard
                    title="Low Stock Alert"
                    value={`${data.inventory.lowStockCount} items`}
                    icon={InventoryIcon}
                    color="orange"
                    items={data.inventory.lowStockItems
                      .filter(item => item.stockQuantity > 0)
                      .map(item => ({
                        name: item.name,
                        value: item.stockQuantity,
                        id: item.id
                      }))}
                    itemLabelKey="name"
                    itemValueKey="value"
                    itemValuePrefix="Stock: "
                    onItemClick={(item) => {
                      navigate(`/${storeGuid}/${label}/menu-builder`);
                      toast.success(`Navigate to update: ${item.name}`);
                    }}
                    actionLabel="Update"
                  />
                </Grid>
              )}
            </Grid>
          )}
          
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab icon={<BarChartIcon />} label="Overview" />
              <Tab icon={<LineChartIcon />} label="Trends" />
              <Tab icon={<PieChartIcon />} label="Categories" />
              <Tab icon={<InventoryIcon />} label="Inventory" />
              <Tab icon={<OutlierIcon />} label="Outliers" />
              <Tab icon={<CsvIcon />} label="Data Table" />
            </Tabs>
          </Paper>
          
          {/* Tab Panels */}
          {activeTab === 0 && (
            <Grid container spacing={2}>
              {/* Row 1: 3 Charts */}
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Orders by Status" icon={PieChartIcon} height={180}>
                  <PieChart
                    data={data.ordersByStatus}
                    dataKey="count"
                    nameKey="status"
                    height={180}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Revenue by Payment" icon={MoneyIcon} height={180}>
                  <PieChart
                    data={data.ordersByPayment}
                    dataKey="revenue"
                    nameKey="paymentMethod"
                    colors={['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336']}
                    height={180}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Orders by Hour" icon={ScheduleIcon} height={180}>
                  <BarChart
                    data={data.hourlyDistribution.map(h => ({ ...h, hourLabel: `${h.hour}:00` }))}
                    dataKey="orders"
                    nameKey="hourLabel"
                    color="#9c27b0"
                    height={180}
                  />
                </ChartCard>
              </Grid>
              
              {/* Row 2: 3 Charts */}
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Top Selling Products" icon={StarIcon} height={180}>
                  <BarChart
                    data={data.topProducts.slice(0, 6)}
                    dataKey="quantity"
                    nameKey="name"
                    color="#4caf50"
                    height={180}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Lowest Selling Products" icon={StarBorderIcon} height={180}>
                  <BarChart
                    data={data.lowestProducts.slice(0, 6)}
                    dataKey="quantity"
                    nameKey="name"
                    color="#f44336"
                    height={180}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Revenue by Category" icon={CategoryIcon} height={180}>
                  <PieChart
                    data={data.categoryStats}
                    dataKey="revenue"
                    nameKey="category"
                    colors={['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4']}
                    height={180}
                  />
                </ChartCard>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 1 && (
            <Grid container spacing={2}>
              {/* Row 1: 3 Trend Charts */}
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Daily Revenue Trend" icon={LineChartIcon} height={200}>
                  <LineChart
                    data={data.dailyTrends}
                    dataKey="revenue"
                    nameKey="date"
                    color="#4caf50"
                    height={200}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Daily Order Count" icon={BarChartIcon} height={200}>
                  <BarChart
                    data={data.dailyTrends}
                    dataKey="orders"
                    nameKey="date"
                    color="#2196f3"
                    height={200}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Order Value Distribution" icon={InsightsIcon} height={200}>
                  <BellCurveChart data={data.orderValueDistribution} height={200} />
                </ChartCard>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 2 && (
            <Grid container spacing={2}>
              {/* Row 1: Category Charts */}
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Revenue by Category" icon={PieChartIcon} height={200}>
                  <PieChart
                    data={data.categoryStats}
                    dataKey="revenue"
                    nameKey="category"
                    height={200}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Units Sold by Category" icon={BarChartIcon} height={200}>
                  <BarChart
                    data={data.categoryStats}
                    dataKey="quantity"
                    nameKey="category"
                    color="#2196f3"
                    height={200}
                  />
                </ChartCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <ChartCard title="Orders by Category" icon={CartIcon} height={200}>
                  <BarChart
                    data={data.categoryStats}
                    dataKey="orderCount"
                    nameKey="category"
                    color="#ff9800"
                    height={200}
                  />
                </ChartCard>
              </Grid>
              
              {/* Category Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Category Performance Details
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Units Sold</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Revenue</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Orders</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>Avg/Order</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.categoryStats.map((cat, index) => (
                          <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CategoryIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                                {cat.category}
                              </Box>
                            </TableCell>
                            <TableCell align="right">{cat.quantity}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                              {formatCurrency(cat.revenue)}
                            </TableCell>
                            <TableCell align="right">{cat.orderCount}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(cat.orderCount > 0 ? cat.revenue / cat.orderCount : 0)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 3 && (
            <Grid container spacing={3}>
              {/* Inventory Summary */}
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Total Products"
                  value={data.inventory.totalProducts}
                  icon={InventoryIcon}
                  color="primary.main"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Low Stock Items"
                  value={data.inventory.lowStockCount}
                  icon={WarningIcon}
                  color="warning.main"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Out of Stock"
                  value={data.inventory.outOfStockCount}
                  icon={WarningIcon}
                  color="error.main"
                />
              </Grid>
              
              {/* Low Stock Items Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon color="warning" /> Low Stock Items
                  </Typography>
                  {data.inventory.lowStockItems.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Threshold</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.inventory.lowStockItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.category || 'N/A'}</TableCell>
                              <TableCell align="right" sx={{ 
                                color: item.stockQuantity <= 0 ? 'error.main' : 'warning.main',
                                fontWeight: 'bold'
                              }}>
                                {item.stockQuantity}
                              </TableCell>
                              <TableCell align="right">{item.threshold}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={item.stockQuantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                                  color={item.stockQuantity <= 0 ? 'error' : 'warning'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="success">All products are well stocked!</Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 4 && (
            <Grid container spacing={3}>
              {/* Outliers Summary */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <OutlierIcon color="warning" /> Order Outliers
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Orders that fall significantly outside the normal range (using IQR method)
                  </Typography>
                  {data.outliers.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.outliers.map((order, index) => (
                            <TableRow key={index}>
                              <TableCell>#{order.orderId}</TableCell>
                              <TableCell>{order.orderName || 'Guest'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                {formatCurrency(order.total)}
                              </TableCell>
                              <TableCell>
                                <Chip size="small" label={order.status} />
                              </TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={order.total > data.summary.averageOrderValue ? 'High Value' : 'Low Value'}
                                  color={order.total > data.summary.averageOrderValue ? 'success' : 'warning'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No significant outliers detected in this period.</Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 5 && (
            <Grid container spacing={3}>
              {/* Recent Orders Table */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CsvIcon color="primary" /> Order Data ({data.recentOrders.length} orders)
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ExportIcon />}
                      onClick={exportToCSV}
                    >
                      Export CSV
                    </Button>
                  </Box>
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Order ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Customer</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Total</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Payment</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Items</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Created</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Completed</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.recentOrders.map((order, index) => (
                          <TableRow key={index} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                            <TableCell>#{order.orderId}</TableCell>
                            <TableCell>{order.orderName || 'Guest'}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              {formatCurrency(order.total)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={order.status}
                                color={
                                  order.status === 'completed' ? 'success' :
                                  order.status === 'cancelled' ? 'error' :
                                  order.status === 'pending' ? 'warning' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              {order.paymentMethod || 'N/A'}
                            </TableCell>
                            <TableCell align="right">{order.totalItems}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(order.createdAt)}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{formatDate(order.completedAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Container>
      ) : null}
    </Box>
  );
};

export default InsightsDashboard;
