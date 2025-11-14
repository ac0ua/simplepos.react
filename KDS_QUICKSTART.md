# KDS Quick Start Guide

## What is KDS?

A **Kitchen Display System (KDS)** shows kitchen staff what items need to be prepared, organized by category. It's like a digital ticket system that updates in real-time.

## How to Access

1. Start your SimplePOS server (if not already running)
2. Open a web browser
3. Go to: `http://localhost:5173/kds/{your-store-guid}/{your-label}`

**Example URL:**
```
http://localhost:5173/kds/6c24c729-3edc-4ada-be8f-96d34b4d8dd3/happydays
```

## Main Screen

You'll see cards for each product category:

- **Red cards with numbers** = Items that need to be prepared
- **Green cards with checkmarks** = All items in that category are done
- Click **VIEW** to see the items in that category

## Marking Items as Prepared

1. Click on a category card
2. You'll see a list of items like "2x Spring Rolls"
3. Use the **- / +** buttons to choose how many to mark (default is 1)
4. Click **MARK X DONE** to mark them as prepared
5. The item moves to the "Prepared" tab

## Tips

- The screen refreshes automatically every 5 seconds
- You can mark items in batches (e.g., mark 3 burgers at once)
- Click "Back to Categories" to return to the main view
- Switch between "To Prepare" and "Prepared" tabs to see progress

## Starting Mid-Shift

Don't worry! The system works even if you start it in the middle of a shift:

- All current active orders will show up
- Items start as "pending" (not prepared)
- Just start marking items as you prepare them
- The counts will update automatically

## Troubleshooting

**No items showing?**
- Make sure you have active orders in the POS system
- Check that products have categories assigned

**Counts not updating?**
- Refresh the page (F5)
- Check your internet connection

**Wrong URL?**
- Get your store GUID and label from your store setup
- Make sure the server is running on port 5173

## Example Workflow

1. **Morning Setup**: Open KDS on a kitchen display screen
2. **New Order Arrives**: Category cards update with new item counts
3. **Start Cooking**: Click on "Main Courses" to see what needs cooking
4. **Mark Progress**: As burgers finish, mark them done (e.g., "MARK 2 DONE")
5. **Check Status**: Return to main screen to see what else needs attention
6. **All Done**: When a category is complete, it shows green with a checkmark

## For Multiple Stations

You can open the same KDS URL on multiple screens:
- One for the grill station
- One for the fryer station
- One for the prep station

All screens will show the same data and update in real-time!

## Need Help?

See the full documentation in `KDS_SYSTEM.md` for detailed information about:
- API endpoints
- Database schema
- Advanced features
- Integration details
