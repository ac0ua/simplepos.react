# 📋 Order ID Nomenclature System

## Format Specification

### Structure
```
#{TYPE}-{MMDD}-{COUNT}
```

### Components

**1. Type Prefix** (1 character)
- `K` = Kiosk Order (payment pending)
- `P` = Paid Order (payment completed)

**2. Date** (4 digits: MMDD)
- `MM` = Two-digit month with leading zeros (01-12)
- `DD` = Two-digit day with leading zeros (01-31)

**3. Order Count** (5 digits: 00001-99999)
- Sequential or random number
- Always 5 digits with leading zeros
- Range: 00001 to 99999

---

## Examples

### Kiosk Orders (Payment Pending)
```
#K-1109-00001  → Kiosk order on Nov 9, order #1
#K-0101-00221  → Kiosk order on Jan 1, order #221
#K-1225-12345  → Kiosk order on Dec 25, order #12345
```

### Paid Orders (Payment Completed)
```
#P-1110-00011  → Paid order on Nov 10, order #11
#P-0131-23412  → Paid order on Jan 31, order #23412
#P-0704-00001  → Paid order on Jul 4, order #1
```

---

## Display Format

### With Hash Symbol
When displaying to users, always include the `#` prefix:
```
Order #K-1109-00001
Order #P-1110-00011
```

### Without Hash Symbol
When storing in database or using in code:
```
K-1109-00001
P-1110-00011
```

---

## Implementation

### Generation Function
```javascript
const generateOrderId = (orderType) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const orderCount = Math.floor(1 + Math.random() * 99999).toString().padStart(5, '0');
  
  const type = orderType === 'kiosk' ? 'K' : 'P';
  return `${type}-${month}${day}-${orderCount}`;
};
```

### Usage Examples
```javascript
// Kiosk order (no payment yet)
const kioskOrderId = generateOrderId('kiosk');
// Returns: "K-1110-00003"

// Paid order (payment completed)
const paidOrderId = generateOrderId('paid');
// Returns: "P-1110-00011"
```

---

## Order Types

### Kiosk Orders (K)
- Created when customer uses "Kiosk Order" button
- Payment status: `pending`
- Order status: `kiosk`
- Appears in Active Orders with brown background
- Shows "Payment Pending" chip
- Button: "Accept Payment"

**Example Flow**:
1. Customer creates order → `#K-1110-00001`
2. Goes to Active Orders (brown background)
3. Staff accepts payment
4. Order becomes active (dark background)
5. Staff fulfills order
6. Order moves to history

### Paid Orders (P)
- Created when using "Finalize Order" button with payment
- Created when using "Direct Payment" button
- Payment status: `paid`
- Order status: `active`
- Appears in Active Orders with dark background
- No payment pending chip
- Button: "Complete"

**Example Flow**:
1. Customer pays immediately → `#P-1110-00011`
2. Goes to Active Orders (dark background)
3. Staff fulfills order
4. Order moves to history

---

## Date Formatting

### Month Codes
```
01 = January    07 = July
02 = February   08 = August
03 = March      09 = September
04 = April      10 = October
05 = May        11 = November
06 = June       12 = December
```

### Day Codes
```
01-09 = Days 1-9 with leading zero
10-31 = Days 10-31
```

### Examples by Date
```
January 1   → 0101
February 14 → 0214
July 4      → 0704
November 9  → 1109
December 25 → 1225
```

---

## Order Count Range

### Valid Range
- **Minimum**: 00001
- **Maximum**: 99999
- **Total**: 99,999 possible orders per day per type

### Formatting
Always pad with leading zeros to 5 digits:
```
1     → 00001
42    → 00042
999   → 00999
12345 → 12345
```

---

## Complete Examples

### November 10, 2025

**Kiosk Orders**:
```
#K-1110-00001  → First kiosk order
#K-1110-00002  → Second kiosk order
#K-1110-00003  → Third kiosk order
```

**Paid Orders**:
```
#P-1110-00001  → First paid order
#P-1110-00011  → Eleventh paid order
#P-1110-00100  → One hundredth paid order
```

### Different Dates

**New Year's Day**:
```
#K-0101-00001  → Kiosk order on Jan 1
#P-0101-00001  → Paid order on Jan 1
```

**Independence Day**:
```
#K-0704-00050  → Kiosk order on Jul 4
#P-0704-00075  → Paid order on Jul 4
```

**Christmas**:
```
#K-1225-12345  → Kiosk order on Dec 25
#P-1225-67890  → Paid order on Dec 25
```

---

## Database Storage

### Order Table Fields
```javascript
{
  orderNumber: "K-1110-00001",  // Without # symbol
  orderType: "kiosk",           // or "paid"
  paymentStatus: "pending",     // or "paid"
  orderStatus: "kiosk",         // or "active" or "completed"
  createdAt: "2025-11-10T...",
  // ... other fields
}
```

---

## Display in UI

### Active Orders
```
┌─────────────────────────────────────┐
│ 💰 danny    [💰 Payment Pending]   │
│                                     │
│ ✓ Synced          #K-1110-00003    │ ← With # symbol
└─────────────────────────────────────┘
```

### Toast Notifications
```
✓ Kiosk Order #K-1110-00003 created! Waiting for payment.
✓ Order #P-1110-00011 paid! Change: $15.14
✓ Order #K-1110-00003 completed and moved to history!
```

### Receipts
```
Order Number: #K-1110-00003
Order Number: #P-1110-00011
```

---

## Benefits

### Easy Identification
- **Type**: Instantly know if payment is pending (K) or completed (P)
- **Date**: Know when order was created
- **Sequence**: Track order volume

### Sorting
Orders naturally sort by:
1. Type (K before P alphabetically)
2. Date (chronological)
3. Count (sequential)

### Uniqueness
Combination of type, date, and count ensures uniqueness:
- Same count can exist for different types
- Same count can exist for different dates
- 99,999 orders per type per day

---

## Migration Notes

### Old System
Previously used simple kiosk numbers:
```
#1234
#5678
```

### New System
Now uses full nomenclature:
```
#K-1110-00001
#P-1110-00011
```

### Backward Compatibility
Old orders may still show simple numbers in database.
New orders will use full nomenclature going forward.

---

## Status

✅ **IMPLEMENTED**

All order creation points now use the new nomenclature:
- ✅ Kiosk Order button
- ✅ Finalize Order button
- ✅ Direct Payment button
- ✅ Active Orders display
- ✅ Toast notifications

**Version**: 1.3.0  
**Date**: November 10, 2025
