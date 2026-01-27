# EFBC Event Suite - Name Fields Update

## Summary of Changes

Updated the plugin to support multiple name field options for attendee tables. Previously, only "Name" (badgeName) was available. Now users can display:

- **First Name** - Shows firstName field
- **Last Name** - Shows lastName field  
- **Full Name** - Combines firstName + lastName intelligently
- **Badge Name** - Shows badgeName field (formerly "Name")

## Files Modified

### 1. **admin/src/table-builder/table-builder.js**
   - Updated `allPossibleColumns` array to include: 'First Name', 'Last Name', 'Full Name', 'Badge Name'
   - Updated `fieldKeyMap` object with new name field mappings:
     - "First Name" → "firstName"
     - "Last Name" → "lastName"
     - "Full Name" → "fullName"
     - "Badge Name" → "badgeName"
   - Added Full Name rendering logic that combines firstName and lastName in table cells

### 2. **admin/src/components/Modal.js**
   - Updated `fieldKeyMap` with new name field options
   - Added Full Name logic in the modal table rendering to combine firstName + lastName

### 3. **includes/class-efbc-shortcodes.php**
   - Updated `$fieldKeyMap` array in shortcode rendering
   - Added Full Name concatenation logic for shortcode table display
   - Handles empty lastName gracefully with space trimming

### 4. **assets/js/front.js**
   - Updated `colToKey` mapping with new name fields
   - Added Full Name handling in `renderRows()` function for frontend pagination
   - Intelligently combines firstName and lastName with proper spacing

## API Data Structure

Ensure your API response includes:
```json
{
  "firstName": "Christopher",
  "lastName": "Counts",
  "badgeName": "CHRIS",
  ...other fields
}
```

## How It Works

### Full Name Logic
When "Full Name" is selected as a column, the plugin will:
1. Combine firstName + lastName with a space between them
2. Handle cases where lastName is empty/null gracefully
3. Display "firstName lastName" or just "firstName" if lastName is not provided

### Column Selection
Users can now select any combination of these fields in:
- **Admin Table Builder** - `/wp-admin/admin.php?page=efbc-table-builder`
- **Shortcode tables** - `[efbc_attendees event_id="X"]`
- **Modal preview** - Admin preview modals

## Testing Checklist

- [ ] Test each new name column individually in Table Builder
- [ ] Test combining First Name + Last Name + Badge Name in same table
- [ ] Test Full Name displays correctly: "firstName lastName"
- [ ] Test Full Name with only firstName (no lastName)
- [ ] Test shortcode table displays new fields correctly
- [ ] Test modal preview with new name fields
- [ ] Test Frontend pagination renders Full Name properly
- [ ] Test column drag-and-drop reordering with new fields
- [ ] Test column removal and re-adding
- [ ] Verify backward compatibility (old "Name" can still be used as Badge Name)

## Backward Compatibility

⚠️ **Important Breaking Change:**
- Old columns labeled "Name" have been replaced with "Badge Name"
- Tables with saved "Name" columns may need to be updated in Table Builder
- The field mapping still uses "badgeName" for the same API data

## Building & Deployment

To apply these changes:

1. **If you haven't built admin assets yet:**
   ```powershell
   cd admin
   npm install
   npm run build
   ```

2. **Clear any caching:**
   - Clear WordPress object cache
   - Clear browser cache
   - Clear any page cache plugins

3. **Test in admin:**
   - Go to EFBC Events → Table Builder
   - Select an event
   - Verify new name columns appear in the "Add column..." dropdown

## API Response Example

```json
{
  "data": {
    "id": 123,
    "firstName": "Christopher",
    "lastName": "Counts",
    "badgeName": "CHRIS",
    "email": "chris@example.com",
    "mobile": "555-0123",
    "city": "New York",
    "state": "NY",
    ...
  }
}
```

## Future Enhancements

- [ ] Support for middle names/initials
- [ ] Custom name formatting options
- [ ] Prefix/suffix support (Mr., Dr., Jr., etc.)
- [ ] Name field name mappings configuration in settings

---

**Version:** Updated for v1.2.0+  
**Date:** January 2025  
**Modified by:** [Your name/team]
