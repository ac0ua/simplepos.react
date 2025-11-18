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
  FormControlLabel,
  Autocomplete
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  AcUnit as AcUnitIcon
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

  const handleSave = async () => {
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
      setLocalCategories(Array.isArray(data) && data.length ? data : finalCategories);
      refreshCategories();
      onClose();
    } catch (error) {
      console.error('Save categories error:', error);
      toast.error(error.message || 'Failed to save categories');
    }
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
    >
      <DialogTitle
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

      <DialogContent sx={{ p: 0, bgcolor: theme.palette.background.default }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Categories
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Reset to defaults">
                <IconButton
                  size="small"
                  onClick={handleResetDefaults}
                  sx={{ color: theme.palette.primary.main }}
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddCategory}
                sx={{ fontWeight: 'bold' }}
              >
                Add Category
              </Button>
            </Box>
          </Box>

          <Divider sx={{ borderColor: theme.palette.divider, mb: 2 }} />

          {localCategories.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No categories defined. Click "Add Category" to create your first one.
            </Typography>
          ) : (
            <List dense>
              {localCategories.map((cat, index) => {
                const isAll = cat.id === 'all';
                const IconPreviewComponent =
                  ICON_COMPONENT_MAP[cat.icon || 'apps'] || CategoryIcon;
                return (
                  <ListItem
                    key={index}
                    ref={(el) => {
                      itemRefs.current[index] = el || undefined;
                    }}
                    sx={{
                      mb: 1.5,
                      borderRadius: 0,
                      bgcolor: theme.palette.background.paper,
                      border: `1px solid ${
                        highlightIndex === index
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                      boxShadow:
                        highlightIndex === index
                          ? theme.shadows[6]
                          : theme.shadows[1],
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        backgroundColor: cat.color || theme.palette.primary.main,
                        opacity: 0.9
                      },
                      transition: 'all 0.25s ease-out',
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                      }}
                    >
                      {/* Row 1: Name (slug/ID is automatic) */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          label="Name"
                          value={cat.name || ''}
                          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                          fullWidth
                          sx={{
                            flex: 1,
                            minWidth: 180,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 0
                            }
                          }}
                          disabled={isAll}
                          helperText={
                            isAll
                              ? 'System category for showing all products. Name cannot be edited.'
                              : 'ID auto-generated from this name.'
                          }
                        />
                      </Box>

                      {/* Row 2: Icon picker + preview + color */}
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Autocomplete
                          size="small"
                          options={ICON_OPTIONS}
                          getOptionLabel={(option) => option.label}
                          value={
                            ICON_OPTIONS.find((opt) => opt.value === (cat.icon || 'apps')) ||
                            ICON_OPTIONS[0]
                          }
                          onChange={(event, newValue) =>
                            handleFieldChange(index, 'icon', newValue ? newValue.value : 'apps')
                          }
                          disabled={isAll}
                          sx={{
                            flex: 1,
                            minWidth: 220,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 0
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Icon"
                            />
                          )}
                        />
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: 1,
                            bgcolor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <IconPreviewComponent
                            sx={{ fontSize: 22, color: cat.color || theme.palette.primary.main }}
                          />
                        </Box>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            minWidth: 150
                          }}
                        >
                          <Box
                            component="input"
                            type="color"
                            value={cat.color || '#ff9800'}
                            onChange={(e) => handleFieldChange(index, 'color', e.target.value)}
                            sx={{
                              width: 36,
                              height: 28,
                              p: 0,
                              borderRadius: 1,
                              border: `1px solid ${theme.palette.divider}`,
                              bgcolor: 'transparent',
                              cursor: 'pointer'
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Category color
                          </Typography>
                        </Box>
                      </Box>

                      {/* Row 3: Visibility + actions */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={cat.visible !== false}
                              onChange={(e) =>
                                handleFieldChange(index, 'visible', e.target.checked)
                              }
                              color="warning"
                              disabled={isAll}
                            />
                          }
                          label={
                            isAll
                              ? 'Always shown (system category)'
                              : cat.visible !== false
                              ? 'Show'
                              : 'Hide'
                          }
                          sx={{
                            ml: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: '0.8rem',
                              color: theme.palette.text.secondary
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="Move up">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveCategory(index, -1)}
                                disabled={index === 0}
                                sx={{
                                  color:
                                    index === 0
                                      ? theme.palette.action.disabled
                                      : theme.palette.text.secondary
                                }}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move down">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveCategory(index, 1)}
                                disabled={index === localCategories.length - 1}
                                sx={{
                                  color:
                                    index === localCategories.length - 1
                                      ? theme.palette.action.disabled
                                      : theme.palette.text.secondary
                                }}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={isAll ? 'Cannot delete All Products' : 'Delete category'}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteCategory(index)}
                                disabled={isAll}
                                sx={{
                                  color: isAll
                                    ? theme.palette.action.disabled
                                    : theme.palette.error.main
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          bgcolor: theme.palette.background.paper,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty}
          sx={{ fontWeight: 'bold' }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoriesEditor;
