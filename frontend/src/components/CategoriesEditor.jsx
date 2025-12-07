import React, { useEffect, useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  Typography,
  Divider,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Category as CategoryIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Apps as AppsIcon,
  Label as LabelIcon,
  Store as StoreIcon,
  Storefront as StorefrontIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalMall as LocalMallIcon,
  LocalOffer as LocalOfferIcon,
  PointOfSale as PointOfSaleIcon,
  Inventory2 as Inventory2Icon,
  Restaurant as RestaurantIcon,
  Fastfood as FastfoodIcon,
  LocalCafe as LocalCafeIcon,
  LocalDrink as LocalDrinkIcon,
  LocalBar as LocalBarIcon,
  Icecream as IcecreamIcon,
  BakeryDining as BakeryDiningIcon,
  RamenDining as RamenDiningIcon,
  LocalPizza as LocalPizzaIcon,
  Liquor as LiquorIcon,
  DirectionsCar as DirectionsCarIcon,
  TwoWheeler as TwoWheelerIcon,
  LocalGasStation as LocalGasStationIcon,
  LocalShipping as LocalShippingIcon,
  Build as BuildIcon,
  Handyman as HandymanIcon,
  Construction as ConstructionIcon,
  MiscellaneousServices as MiscServicesIcon,
  HealthAndSafety as HealthIcon,
  LocalPharmacy as PharmacyIcon,
  MedicalServices as MedicalServicesIcon,
  Spa as SpaIcon,
  FitnessCenter as FitnessIcon,
  PhoneIphone as PhoneIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Headphones as HeadphonesIcon,
  Devices as DevicesIcon,
  Home as HomeIcon,
  Chair as ChairIcon,
  Bed as BedIcon,
  Lightbulb as LightbulbIcon,
  Checkroom as CheckroomIcon,
  DryCleaning as DryCleaningIcon,
  SportsEsports as EsportsIcon,
  MusicNote as MusicNoteIcon,
  Movie as MovieIconComponent,
  AcUnit as AcUnitIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useStoreContext } from '../contexts/StoreContext';
import useStore from '../store/useStore';
import { API_URL, IS_PHP_BACKEND } from '../config/api';

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: 'apps', visible: true, color: '#ff9800' },
  { id: 'beverages', name: 'Beverages', icon: 'local_drink', visible: true, color: '#0ea5e9' },
  { id: 'snacks', name: 'Snacks', icon: 'fastfood', visible: true, color: '#f97316' },
  { id: 'automotive', name: 'Automotive', icon: 'directions_car', visible: true, color: '#6b7280' },
  { id: 'frozen', name: 'Frozen', icon: 'ac_unit', visible: true, color: '#22c55e' },
  { id: 'fuel', name: 'Fuel', icon: 'local_gas_station', visible: true, color: '#eab308' }
];

const ICON_OPTIONS = [
  // Generic
  { label: 'Apps / Grid', value: 'apps' },
  { label: 'Category', value: 'category' },
  { label: 'Label / Tag', value: 'label' },

  // Retail & commerce
  { label: 'Store', value: 'store' },
  { label: 'Storefront', value: 'storefront' },
  { label: 'Shopping Cart', value: 'shopping_cart' },
  { label: 'Shopping Bag', value: 'shopping_bag' },
  { label: 'Local Mall', value: 'local_mall' },
  { label: 'Offer / Sale', value: 'local_offer' },
  { label: 'Point of Sale', value: 'point_of_sale' },
  { label: 'Inventory / Boxes', value: 'inventory_2' },

  // Food & beverage
  { label: 'Restaurant', value: 'restaurant' },
  { label: 'Fast Food', value: 'fastfood' },
  { label: 'Cafe / Coffee', value: 'local_cafe' },
  { label: 'Beverages', value: 'local_drink' },
  { label: 'Bar / Drinks', value: 'local_bar' },
  { label: 'Ice Cream', value: 'icecream' },
  { label: 'Bakery', value: 'bakery_dining' },
  { label: 'Ramen / Noodles', value: 'ramen_dining' },
  { label: 'Pizza', value: 'local_pizza' },
  { label: 'Liquor / Bottles', value: 'liquor' },

  // Automotive & fuel
  { label: 'Automotive', value: 'directions_car' },
  { label: 'Motorcycle / Scooter', value: 'two_wheeler' },
  { label: 'Fuel / Gas', value: 'local_gas_station' },
  { label: 'Shipping / Delivery', value: 'local_shipping' },

  // Services & trades
  { label: 'Tools / Repair', value: 'build' },
  { label: 'Handyman', value: 'handyman' },
  { label: 'Construction', value: 'construction' },
  { label: 'Misc Services', value: 'miscellaneous_services' },

  // Health, beauty & fitness
  { label: 'Health & Safety', value: 'health_and_safety' },
  { label: 'Pharmacy', value: 'local_pharmacy' },
  { label: 'Medical', value: 'medical_services' },
  { label: 'Spa / Wellness', value: 'spa' },
  { label: 'Fitness / Gym', value: 'fitness_center' },

  // Technology & electronics
  { label: 'Phone / Mobile', value: 'phone_iphone' },
  { label: 'Computer / Laptop', value: 'computer' },
  { label: 'Memory / Storage', value: 'memory' },
  { label: 'Headphones / Audio', value: 'headphones' },
  { label: 'Devices / Gadgets', value: 'devices' },

  // Home, furniture & decor
  { label: 'Home / House', value: 'home' },
  { label: 'Chair / Furniture', value: 'chair' },
  { label: 'Bed / Mattress', value: 'bed' },
  { label: 'Lightbulb / Lighting', value: 'lightbulb' },

  // Apparel & fashion
  { label: 'Clothing / Rack', value: 'checkroom' },
  { label: 'Dry Cleaning', value: 'dry_cleaning' },

  // Entertainment & hobbies
  { label: 'Gaming / Esports', value: 'sports_esports' },
  { label: 'Music', value: 'music_note' },
  { label: 'Movies / Video', value: 'movie' },

  // Existing defaults for compatibility
  { label: 'Frozen', value: 'ac_unit' },
  { label: 'Fuel (Legacy)', value: 'local_gas_station' }
];

const slugifyCategoryName = (name) => {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'category'
  );
};

const ICON_COMPONENT_MAP = {
  apps: AppsIcon,
  category: CategoryIcon,
  label: LabelIcon,
  store: StoreIcon,
  storefront: StorefrontIcon,
  shopping_cart: ShoppingCartIcon,
  shopping_bag: ShoppingBagIcon,
  local_mall: LocalMallIcon,
  local_offer: LocalOfferIcon,
  point_of_sale: PointOfSaleIcon,
  inventory_2: Inventory2Icon,
  restaurant: RestaurantIcon,
  fastfood: FastfoodIcon,
  local_cafe: LocalCafeIcon,
  local_drink: LocalDrinkIcon,
  local_bar: LocalBarIcon,
  icecream: IcecreamIcon,
  bakery_dining: BakeryDiningIcon,
  ramen_dining: RamenDiningIcon,
  local_pizza: LocalPizzaIcon,
  liquor: LiquorIcon,
  directions_car: DirectionsCarIcon,
  two_wheeler: TwoWheelerIcon,
  ac_unit: AcUnitIcon,
  local_gas_station: LocalGasStationIcon,
  local_shipping: LocalShippingIcon,
  build: BuildIcon,
  handyman: HandymanIcon,
  construction: ConstructionIcon,
  miscellaneous_services: MiscServicesIcon,
  health_and_safety: HealthIcon,
  local_pharmacy: PharmacyIcon,
  medical_services: MedicalServicesIcon,
  spa: SpaIcon,
  fitness_center: FitnessIcon,
  phone_iphone: PhoneIcon,
  computer: ComputerIcon,
  memory: MemoryIcon,
  headphones: HeadphonesIcon,
  devices: DevicesIcon,
  home: HomeIcon,
  chair: ChairIcon,
  bed: BedIcon,
  lightbulb: LightbulbIcon,
  checkroom: CheckroomIcon,
  dry_cleaning: DryCleaningIcon,
  sports_esports: EsportsIcon,
  music_note: MusicNoteIcon,
  movie: MovieIconComponent
};

const CategoriesEditor = ({ open, onClose }) => {
  const { categories, refreshCategories } = useStoreContext();
  const storeGuid = useStore((state) => state.storeGuid);
  const theme = useTheme();
  const [localCategories, setLocalCategories] = useState(DEFAULT_CATEGORIES);
  const [initialCategories, setInitialCategories] = useState(DEFAULT_CATEGORIES);
  const [pendingScrollIndex, setPendingScrollIndex] = useState(null);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [iconPickerOpenIndex, setIconPickerOpenIndex] = useState(null);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [editingNameIndex, setEditingNameIndex] = useState(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (open) {
      if (categories && categories.length) {
        const normalized = categories.map((cat) => ({
          ...cat,
          visible: cat.visible !== false
        }));
        setLocalCategories(normalized);
        setInitialCategories(normalized);
      } else {
        setLocalCategories(DEFAULT_CATEGORIES);
        setInitialCategories(DEFAULT_CATEGORIES);
      }
    }
  }, [open, categories]);

  useEffect(() => {
    if (!open) {
      setIconPickerOpenIndex(null);
      setIconSearchQuery('');
    }
  }, [open]);

  const handleFieldChange = (index, field, value) => {
    setLocalCategories((prev) =>
      prev.map((cat, i) => {
        if (i !== index) return cat;

        if (field === 'name') {
          const newName = value;
          let newId = cat.id;

          if (!newId && newName && newName.trim() && cat.id !== 'all') {
            const slug = slugifyCategoryName(newName);
            newId = slug === 'all' ? 'all-category' : slug;
          }

          return { ...cat, name: newName, id: newId };
        }

        // Guard against accidental edits to the reserved "all" ID
        if (field === 'id' && cat.id === 'all') {
          return cat;
        }

        return { ...cat, [field]: value };
      })
    );
  };

  const handleAddCategory = () => {
    setLocalCategories((prev) => {
      const next = [
        ...prev,
        { id: '', name: '', icon: 'category', visible: true, color: '#ff9800' }
      ];
      setPendingScrollIndex(prev.length);
      return next;
    });
  };

  const handleDeleteCategory = (index) => {
    const cat = localCategories[index];
    if (cat.id === 'all') {
      toast.error('The "All Products" category cannot be removed');
      return;
    }
    setLocalCategories((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCategory = (index, direction) => {
    setLocalCategories((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const handleResetDefaults = () => {
    setLocalCategories(DEFAULT_CATEGORIES);
  };

  const saveCategories = async (closeAfter = true) => {
    try {
      if (!localCategories.length) {
        toast.error('Please add at least one category');
        return;
      }

      const sanitized = localCategories
        .map((cat) => {
          const name = (cat.name || '').trim();
          let id = (cat.id || '').trim();

          if (cat.id === 'all' || name === 'All Products') {
            id = 'all';
          } else if (!id && name) {
            const slug = slugifyCategoryName(name);
            id = slug === 'all' ? 'all-category' : slug;
          }

          return {
            ...cat,
            id,
            name,
            icon: (cat.icon || 'apps').trim(),
            color: (cat.color || '').trim(),
            visible: cat.visible !== false
          };
        })
        .filter((cat) => cat.id && cat.name);

      if (!sanitized.length) {
        toast.error('Each category must have a name so an internal ID can be generated.');
        return;
      }

      const ids = sanitized.map((c) => c.id);
      const hasDuplicates = new Set(ids).size !== ids.length;
      if (hasDuplicates) {
        toast.error('Category names must be unique (internal IDs are based on the name).');
        return;
      }

      // Ensure "all" category exists and is first
      let allCategory = sanitized.find((c) => c.id === 'all');
      if (!allCategory) {
        allCategory = { id: 'all', name: 'All Products', icon: 'apps', visible: true, color: '#ff9800' };
        sanitized.unshift(allCategory);
      }

      const others = sanitized.filter((c) => c.id !== 'all');
      const finalCategories = [allCategory, ...others];

      let endpoint;
      let method;

      if (IS_PHP_BACKEND) {
        if (!storeGuid) {
          toast.error('Store GUID is missing. Please reload your store and try again.');
          return;
        }
        endpoint = `${API_URL}/products/categories-save.php`;
        method = 'POST';
      } else {
        if (!storeGuid) {
          toast.error('Store GUID is missing. Please reload your store and try again.');
          return;
        }
        endpoint = `${API_URL}/products/${storeGuid}/categories`;
        method = 'PUT';
      }

      const payload = IS_PHP_BACKEND
        ? { storeGuid, categories: finalCategories }
        : { categories: finalCategories };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data && data.error ? data.error : 'Failed to save categories';
        throw new Error(message);
      }

      toast.success('Categories saved');
      const nextCategories = Array.isArray(data) && data.length ? data : finalCategories;
      setLocalCategories(nextCategories);
      setInitialCategories(nextCategories);
      refreshCategories();
      if (closeAfter) {
        onClose();
      }
    } catch (error) {
      console.error('Save categories error:', error);
      toast.error(error.message || 'Failed to save categories');
    }
  };

  const handleNameEditCommit = async () => {
    await saveCategories(false);
    setEditingNameIndex(null);
  };

  const isDirty = JSON.stringify(initialCategories) !== JSON.stringify(localCategories);

  useEffect(() => {
    if (pendingScrollIndex == null) return;
    const el = itemRefs.current[pendingScrollIndex];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightIndex(pendingScrollIndex);
      setPendingScrollIndex(null);
      setTimeout(() => {
        setHighlightIndex((current) => (current === pendingScrollIndex ? null : current));
      }, 900);
    }
  }, [pendingScrollIndex, localCategories.length]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="categories-editor-title"
    >
      <DialogTitle
        id="categories-editor-title"
        component="h2"
        sx={{
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryIcon sx={{ color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Categories Editor
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create, rename, reorder, and remove product categories.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          bgcolor: alpha(theme.palette.background.default, 0.5)
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: '70vh'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              px: 0.5
            }}
          >
            <Typography 
              variant="overline" 
              component="h3" 
              sx={{ 
                color: theme.palette.text.secondary,
                fontWeight: 600,
                letterSpacing: 1.2
              }}
            >
              Categories
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Reset to defaults" arrow>
                <IconButton
                  size="small"
                  onClick={handleResetDefaults}
                  sx={{ 
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                  aria-label="Reset categories to defaults"
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 2
                }}
              >
                Add Category
              </Button>
            </Box>
          </Box>

          <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.6) }} />

          <Box
            sx={{
              position: 'relative',
              mt: 1,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              pr: 0.5,
              '&::-webkit-scrollbar': {
                width: 6
              },
              '&::-webkit-scrollbar-track': {
                bgcolor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(theme.palette.text.secondary, 0.2),
                borderRadius: 3,
                '&:hover': {
                  bgcolor: alpha(theme.palette.text.secondary, 0.3)
                }
              }
            }}
          >
            {localCategories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No categories defined. Click "Add Category" to create your first one.
              </Typography>
            ) : (
              <List disablePadding>
                {localCategories.map((cat, index) => {
                  const isAll = cat.id === 'all';
                  const IconPreviewComponent =
                    ICON_COMPONENT_MAP[cat.icon || 'apps'] || CategoryIcon;
                  const effectiveColor = cat.color || theme.palette.primary.main;
                  const isIconPickerOpen = iconPickerOpenIndex === index;
                  const searchValue = iconSearchQuery.trim().toLowerCase();
                  const filteredIconOptions =
                    !isIconPickerOpen || !searchValue
                      ? ICON_OPTIONS
                      : ICON_OPTIONS.filter(
                          (option) =>
                            option.label.toLowerCase().includes(searchValue) ||
                            option.value.toLowerCase().includes(searchValue)
                        );

                  return (
                    <ListItem
                      key={index}
                      ref={(el) => {
                        itemRefs.current[index] = el || undefined;
                      }}
                      sx={{
                        mb: 1.5,
                        px: 0,
                        alignItems: 'stretch'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          p: 2,
                          borderRadius: 2.5,
                          bgcolor: theme.palette.background.paper,
                          border: `1px solid ${
                            isIconPickerOpen ||
                            highlightIndex === index ||
                            editingNameIndex === index
                              ? theme.palette.primary.main
                              : alpha(theme.palette.divider, 0.8)
                          }`,
                          boxShadow:
                            isIconPickerOpen ||
                            highlightIndex === index ||
                            editingNameIndex === index
                              ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
                              : `0 1px 3px ${alpha(theme.palette.common.black, 0.04)}`,
                          overflow: 'hidden',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: alpha(effectiveColor, 0.5),
                            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.08)}`
                          }
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 2
                            }}
                          >
                            {/* Left side: Color + Icon + Name */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                minWidth: 0,
                                flex: 1
                              }}
                            >
                              {/* Color picker */}
                              <Tooltip title="Pick color" arrow placement="top">
                                <Box
                                  sx={{
                                    position: 'relative',
                                    width: 32,
                                    height: 32,
                                    borderRadius: 1.5,
                                    bgcolor: effectiveColor,
                                    border: `2px solid ${alpha(theme.palette.common.white, 0.9)}`,
                                    boxShadow: `0 0 0 1px ${alpha(effectiveColor, 0.3)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                    '&:hover': {
                                      transform: 'scale(1.05)',
                                      boxShadow: `0 0 0 1px ${alpha(effectiveColor, 0.5)}, 0 3px 8px ${alpha(theme.palette.common.black, 0.15)}`
                                    }
                                  }}
                                >
                                  <Box
                                    component="input"
                                    type="color"
                                    value={effectiveColor}
                                    onChange={(e) =>
                                      handleFieldChange(index, 'color', e.target.value)
                                    }
                                    onInput={(e) =>
                                      handleFieldChange(index, 'color', e.target.value)
                                    }
                                    sx={{
                                      position: 'absolute',
                                      inset: 0,
                                      width: '150%',
                                      height: '150%',
                                      opacity: 0,
                                      cursor: 'pointer'
                                    }}
                                    aria-label="Category color"
                                  />
                                </Box>
                              </Tooltip>

                              {/* Icon button */}
                              <Tooltip title="Change icon" arrow placement="top">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setIconPickerOpenIndex((current) =>
                                      current === index ? null : index
                                    );
                                    setIconSearchQuery('');
                                  }}
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1.5,
                                    bgcolor: alpha(effectiveColor, 0.1),
                                    border: `1px solid ${
                                      isIconPickerOpen
                                        ? theme.palette.primary.main
                                        : alpha(effectiveColor, 0.25)
                                    }`,
                                    transition: 'all 0.15s ease',
                                    flexShrink: 0,
                                    '&:hover': {
                                      bgcolor: alpha(effectiveColor, 0.18),
                                      borderColor: alpha(effectiveColor, 0.4)
                                    }
                                  }}
                                >
                                  <IconPreviewComponent
                                    sx={{ fontSize: 20, color: effectiveColor }}
                                  />
                                </IconButton>
                              </Tooltip>

                              {/* Name section */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                {editingNameIndex === index && !isAll ? (
                                  <TextField
                                    size="small"
                                    placeholder="Category name"
                                    value={cat.name || ''}
                                    autoFocus
                                    onChange={(e) =>
                                      handleFieldChange(index, 'name', e.target.value)
                                    }
                                    onBlur={handleNameEditCommit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleNameEditCommit();
                                      } else if (e.key === 'Escape') {
                                        setEditingNameIndex(null);
                                      }
                                    }}
                                    fullWidth
                                    sx={{
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 1.5
                                      }
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      minWidth: 0,
                                      cursor: isAll ? 'default' : 'pointer',
                                      borderRadius: 1.5,
                                      px: 1.5,
                                      py: 0.5,
                                      transition: 'background-color 0.15s ease',
                                      '&:hover': !isAll
                                        ? {
                                            backgroundColor: alpha(
                                              theme.palette.action.hover,
                                              0.5
                                            )
                                          }
                                        : undefined
                                    }}
                                    role={isAll ? undefined : 'button'}
                                    tabIndex={isAll ? undefined : 0}
                                    onClick={() => {
                                      if (!isAll) {
                                        setEditingNameIndex(index);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (isAll) return;
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setEditingNameIndex(index);
                                      }
                                    }}
                                  >
                                    <Typography
                                      variant="body1"
                                      noWrap
                                      sx={{
                                        fontWeight: 600,
                                        color: theme.palette.text.primary,
                                        fontSize: '0.95rem'
                                      }}
                                    >
                                      {cat.name ||
                                        (isAll
                                          ? 'All Products'
                                          : 'Untitled category')}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{ 
                                        color: alpha(theme.palette.text.secondary, 0.7),
                                        fontSize: '0.7rem'
                                      }}
                                    >
                                      {isAll
                                        ? 'System category'
                                        : 'Click to rename.'}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>

                            {/* Right side: Controls */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                flexShrink: 0
                              }}
                            >
                              {/* Visibility toggle */}
                              <Tooltip 
                                title={isAll ? 'Always visible' : (cat.visible !== false ? 'Visible' : 'Hidden')} 
                                arrow
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    bgcolor: alpha(theme.palette.background.default, 0.6),
                                    borderRadius: 1.5,
                                    px: 1,
                                    py: 0.25
                                  }}
                                >
                                  <Switch
                                    size="small"
                                    checked={cat.visible !== false}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        index,
                                        'visible',
                                        e.target.checked
                                      )
                                    }
                                    color="primary"
                                    disabled={isAll}
                                    sx={{
                                      '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: theme.palette.success.main
                                      },
                                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: theme.palette.success.main
                                      }
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: theme.palette.text.secondary,
                                      fontSize: '0.7rem',
                                      minWidth: isAll ? 'auto' : 32,
                                      ml: 0.25
                                    }}
                                  >
                                    {isAll
                                      ? 'Always shown'
                                      : cat.visible !== false
                                      ? 'Show'
                                      : 'Hide'}
                                  </Typography>
                                </Box>
                              </Tooltip>

                              {/* Reorder buttons */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  ml: 0.5
                                }}
                              >
                                <Tooltip title="Move up" arrow>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => moveCategory(index, -1)}
                                      disabled={index === 0}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        color:
                                          index === 0
                                            ? theme.palette.action.disabled
                                            : theme.palette.text.secondary,
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.action.hover, 0.8)
                                        }
                                      }}
                                      aria-label="Move category up"
                                    >
                                      <ArrowUpwardIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Move down" arrow>
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => moveCategory(index, 1)}
                                      disabled={index === localCategories.length - 1}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        color:
                                          index === localCategories.length - 1
                                            ? theme.palette.action.disabled
                                            : theme.palette.text.secondary,
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.action.hover, 0.8)
                                        }
                                      }}
                                      aria-label="Move category down"
                                    >
                                      <ArrowDownwardIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip
                                  title={
                                    isAll
                                      ? 'Cannot delete'
                                      : 'Delete'
                                  }
                                  arrow
                                >
                                  <span>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteCategory(index)}
                                      disabled={isAll}
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        color: isAll
                                          ? theme.palette.action.disabled
                                          : alpha(theme.palette.error.main, 0.7),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.error.main, 0.08),
                                          color: theme.palette.error.main
                                        }
                                      }}
                                      aria-label={
                                        isAll
                                          ? 'Cannot delete All Products category'
                                          : 'Delete category'
                                      }
                                    >
                                      <DeleteIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </Box>
                            </Box>
                          </Box>

                          {/* Icon picker panel */}
                          {isIconPickerOpen && (
                            <Box
                              sx={{
                                mt: 1.5,
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.background.default, 0.7),
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1.5
                              }}
                            >
                              <Box sx={{ position: 'relative' }}>
                                <SearchIcon
                                  sx={{
                                    position: 'absolute',
                                    left: 10,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: 16,
                                    color: theme.palette.text.secondary
                                  }}
                                />
                                <TextField
                                  size="small"
                                  placeholder="Search icons..."
                                  value={iconSearchQuery}
                                  onChange={(e) => setIconSearchQuery(e.target.value)}
                                  fullWidth
                                  InputProps={{
                                    sx: {
                                      pl: 4,
                                      borderRadius: 1.5,
                                      fontSize: '0.85rem',
                                      bgcolor: theme.palette.background.paper
                                    }
                                  }}
                                />
                              </Box>

                              <Box
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'repeat(auto-fill, minmax(36px, 1fr))',
                                  gap: 0.5,
                                  maxHeight: 160,
                                  overflowY: 'auto',
                                  pr: 0.5,
                                  '&::-webkit-scrollbar': {
                                    width: 4
                                  },
                                  '&::-webkit-scrollbar-thumb': {
                                    bgcolor: alpha(theme.palette.text.secondary, 0.2),
                                    borderRadius: 2
                                  }
                                }}
                              >
                                {filteredIconOptions.map((option) => {
                                  const OptionIcon =
                                    ICON_COMPONENT_MAP[option.value] || CategoryIcon;
                                  const selected = option.value === (cat.icon || 'apps');
                                  return (
                                    <Tooltip
                                      key={option.value}
                                      title={option.label}
                                      arrow
                                      placement="top"
                                    >
                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          handleFieldChange(index, 'icon', option.value)
                                        }
                                        sx={{
                                          width: 34,
                                          height: 34,
                                          borderRadius: 1,
                                          border: `1.5px solid ${
                                            selected
                                              ? effectiveColor
                                              : 'transparent'
                                          }`,
                                          bgcolor: selected
                                            ? alpha(effectiveColor, 0.12)
                                            : 'transparent',
                                          color: selected
                                            ? effectiveColor
                                            : theme.palette.text.secondary,
                                          transition: 'all 0.12s ease',
                                          '&:hover': {
                                            bgcolor: alpha(effectiveColor, 0.15),
                                            color: effectiveColor
                                          }
                                        }}
                                      >
                                        <OptionIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  );
                                })}
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          px: 2.5,
          py: 1.5,
          gap: 1
        }}
      >
        <Button 
          onClick={onClose} 
          color="inherit"
          sx={{ 
            textTransform: 'none',
            fontWeight: 500,
            px: 2.5
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => saveCategories(true)}
          disabled={!isDirty}
          sx={{ 
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            borderRadius: 2,
            boxShadow: isDirty ? 2 : 0,
            '&:hover': {
              boxShadow: isDirty ? 4 : 0
            }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoriesEditor;
