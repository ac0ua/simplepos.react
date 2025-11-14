# Kitchen Display System (KDS)

## Overview

The Kitchen Display System (KDS) is a digital screen interface that displays active orders from the POS system in real-time. It helps kitchen staff track what items need to be prepared, organized by product category.

## Features

- **Category-based Organization**: Items are grouped by product category (Appetizers, Main Courses, Drinks, Desserts, etc.)
- **Real-time Updates**: Automatically refreshes every 5 seconds to show the latest orders
- **Item Tracking**: Shows pending items that need preparation and prepared items
- **Quantity Management**: Kitchen staff can mark items as prepared in batches
- **Visual Indicators**: Color-coded cards (red for pending, green for completed)
- **No Authentication Required**: KDS is a display-only interface accessible without login

## How to Access

The KDS interface is accessed via URL:

```
http://localhost:5173/kds/{storeGuid}/{label}
```

Example:
```
http://localhost:5173/kds/6c24c729-3edc-4ada-be8f-96d34b4d8dd3/happydays
```

## User Interface

### Main KDS Screen (Category View)

The main screen displays all product categories with:
- **Category Name**: Large, bold text showing the category
- **Pending Count**: Number in a circle showing items that need preparation
- **Status Indicator**: 
  - Red background with number = items pending
  - Green background with checkmark = all items prepared
- **VIEW Button**: Click to see detailed items in that category

### Category Detail View

When you click on a category, you see:

#### To Prepare Tab
- List of all pending items with quantities
- Each item shows: `{quantity}x {product name}`
- Controls for each item:
  - **- / + buttons**: Adjust how many to mark as done (default: 1)
  - **Counter**: Shows current quantity to mark
  - **MARK X DONE button**: Marks the specified quantity as prepared

#### Prepared Tab
- Shows items that have been marked as prepared
- Green background indicates completion
- Badge shows total count of prepared items

## Backend API Endpoints

### Get KDS Summary
```
GET /api/kds/:storeId/summary
```
Returns aggregated counts of pending and prepared items by category.

**Response:**
```json
{
  "success": true,
  "storeId": 1,
  "summary": [
    {
      "category": "Appetizers",
      "totalPending": 3,
      "totalPrepared": 2
    }
  ]
}
```

### Get Category Items
```
GET /api/kds/:storeId/category/:category
```
Returns detailed items for a specific category.

**Response:**
```json
{
  "success": true,
  "category": "Appetizers",
  "pendingItems": [
    {
      "productName": "Spring Rolls",
      "totalQuantity": 2,
      "orderItems": [...]
    }
  ],
  "preparedItems": [...]
}
```

### Mark Items as Prepared
```
POST /api/kds/:storeId/mark-prepared
```
Marks a specified quantity of an order item as prepared.

**Request Body:**
```json
{
  "orderItemId": 123,
  "quantity": 1
}
```

### Unprepare Items
```
POST /api/kds/:storeId/unprepare
```
Reduces the prepared quantity (undo preparation).

**Request Body:**
```json
{
  "orderItemId": 123,
  "quantity": 1
}
```

## Database Schema Changes

### OrderItem Model Updates

Two new fields were added to the `order_items` table:

1. **prep_status** (ENUM: 'pending', 'prepared')
   - Default: 'pending'
   - Indicates if all items in this order item are prepared

2. **prep_quantity** (INTEGER)
   - Default: 0
   - Tracks how many items have been marked as prepared
   - When `prep_quantity >= quantity`, the item is fully prepared

## Workflow

### Starting KDS Mid-Shift

The system handles mid-shift startup gracefully:

1. **Existing Orders**: All active orders (status: 'pending', 'active', 'processing') are displayed
2. **Default State**: All order items start with `prep_status = 'pending'` and `prep_quantity = 0`
3. **Incremental Marking**: Kitchen staff can mark items as prepared incrementally
4. **No Data Loss**: The system doesn't require a "reset" - it works with the current state

### Typical Kitchen Workflow

1. **View Categories**: Kitchen staff sees all categories with pending item counts
2. **Select Category**: Click on a category to see detailed items
3. **Prepare Items**: As items are cooked, staff marks them as prepared
4. **Batch Marking**: Can mark multiple items at once (e.g., "MARK 3 DONE")
5. **Monitor Progress**: Switch between "To Prepare" and "Prepared" tabs
6. **Return to Overview**: Click "Back to Categories" to see all categories

## Real-time Updates

The KDS automatically:
- Refreshes data every 5 seconds
- Updates when new orders are placed
- Reflects when items are marked as prepared
- Shows when orders are completed and removed from active status

## WebSocket Events

The system emits WebSocket events for real-time updates:

```javascript
// When an item is marked as prepared
io.emit('kds-update', {
  storeId: 1,
  action: 'item-prepared',
  orderItemId: 123,
  category: 'Appetizers',
  prepQuantity: 2,
  totalQuantity: 3
});
```

## Design Decisions

### Why Track prep_quantity Instead of Just Status?

This allows for:
- **Partial Preparation**: Mark 2 out of 5 items as done
- **Batch Cooking**: Prepare items in waves
- **Accurate Counts**: Show exactly how many are pending vs. prepared

### Why Aggregate by Product Name?

- **Efficiency**: Kitchen staff see "5x Burger" instead of 5 separate entries
- **Batch Cooking**: Makes it easier to prepare multiple of the same item
- **Clarity**: Reduces visual clutter on the display

### Why No Authentication?

- **Speed**: Kitchen staff need instant access
- **Display-Only**: KDS is typically on a dedicated screen in the kitchen
- **Read-Heavy**: The interface is primarily for viewing, not sensitive operations

## Future Enhancements

Potential improvements:
- Sound alerts for new orders
- Timer tracking for each item
- Priority indicators for rush orders
- Kitchen station routing (grill, fryer, etc.)
- Print ticket integration
- Order completion notifications to front-of-house

## Troubleshooting

### Items Not Showing Up

1. Check that orders have status: 'pending', 'active', or 'processing'
2. Verify products have a category assigned
3. Ensure the store ID matches

### Counts Not Updating

1. Check browser console for errors
2. Verify backend API is running
3. Check network connectivity
4. Refresh the page manually

### Database Migration

If starting fresh or the new fields don't exist:

```bash
# The fields will be automatically added when the server starts
# due to Sequelize's alter: true setting in development

# Or manually add them:
ALTER TABLE order_items 
ADD COLUMN prep_status ENUM('pending', 'prepared') DEFAULT 'pending' NOT NULL,
ADD COLUMN prep_quantity INT DEFAULT 0 NOT NULL;
```

## Testing

To test the KDS:

1. **Create Test Orders**: Use the POS interface to create orders with various products
2. **Access KDS**: Navigate to `/kds/{storeGuid}/{label}`
3. **Verify Categories**: Ensure all product categories appear
4. **Mark Items**: Test marking items as prepared
5. **Check Counts**: Verify counts decrease as items are marked done
6. **Test Refresh**: Wait 5 seconds and verify auto-refresh works

## Integration with Existing System

The KDS integrates seamlessly with:
- **POS Interface**: Orders created in POS appear in KDS
- **Kiosk Orders**: Self-service kiosk orders are included
- **Active Orders**: Only shows orders with active status
- **Order Completion**: Items disappear when orders are completed

## Performance Considerations

- **Polling Interval**: 5 seconds balances freshness with server load
- **Data Aggregation**: Backend aggregates data to reduce payload size
- **Indexed Queries**: Database queries use indexes on `store_id` and `status`
- **Caching**: Consider adding Redis caching for high-volume stores
