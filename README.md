# EFBC Event Suite

A complete event management plugin for WordPress with a powerful React admin dashboard and dynamic attendee management.

**Version:** 1.0.0  
**Author:** [Bongdevs.com](https://bongdevs.com)  
**License:** GPL2  
**Repository:** [github.com/bongdevs/efbc-event-suite](https://github.com/bongdevs/efbc-event-suite)

---

## Features

✨ **Dynamic Attendee Display**
- `[efbc_attendees]` shortcode for displaying event attendees
- Filter by activity, search, and sort in real-time
- Fully responsive tables optimized for mobile and desktop

🎨 **Customizable Table Styling**
- Admin color picker for table headers, text, hover effects, and row alternation
- Apply custom colors site-wide through WordPress settings
- Consistent styling across all tables (shortcode, modal, admin)

⚙️ **Admin React Dashboard**
- Event management interface in WordPress admin
- Preview attendee lists in a responsive modal
- Full-featured Table Builder for column customization

🔧 **Table Builder**
- Drag-and-drop column reordering
- Add/remove columns dynamically
- Save unique column layouts per event and activity
- Live preview with seamless UX

📋 **Attendee Management**
- Filter attendees by activity type
- Search attendees by name, email, phone, and more
- Display columns: Name, Email, Phone, Status, Golf Handicap, Club Rentals, Paid, City, State, Zip, Country, Address, Organization, Company, Wednesday Activity

🔌 **API Integration**
- Connects to EFBC API for real-time attendee data
- Configurable API base URL in settings
- Automatic fallback to default API if no custom URL provided

---

## Installation

1. **Upload to WordPress**
   - Download or clone this repository
   - Upload to `/wp-content/plugins/efbc-event-suite/`
   - Or use FTP/SFTP to place the folder in your plugins directory

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "EFBC Event Suite" and click **Activate**

3. **Configure Settings**
   - Go to WordPress Admin → EFBC Events → Settings
   - Set your **API Base URL** (default: `https://server.efbcconference.org/api`)
   - Customize table colors (header background, text, hover, row stripe)
   - Click **Save Changes**

---

## Usage

### Using the Shortcode

Display attendees from a specific event:

```shortcode
[efbc_attendees event_id="123"]
```

Filter attendees by activity:

```shortcode
[efbc_attendees event_id="123" activity="Breakfast"]
```

**Attributes:**
- `event_id` (required): The ID of the event to display attendees from
- `activity` (optional): Filter attendees by activity name (e.g., "Breakfast", "Golf", etc.)

**Example:**
```shortcode
[efbc_attendees event_id="1" activity="Wednesday Activity"]
```

### Admin Dashboard

1. **View Events & Preview Attendees**
   - Go to WordPress Admin → EFBC Events
   - Click **Preview Attendees** on any event card
   - View attendees in a responsive modal
   - Apply optional activity filter before previewing

2. **Customize Table Columns (Table Builder)**
   - Go to WordPress Admin → EFBC Events → Table Builder
   - Select an event
   - Switch between "All Attendees" and individual activities
   - Drag columns to reorder
   - Click (✕) to remove columns
   - Select "Add column..." to add new columns
   - Click **Save Column Layout** to apply changes
   - Custom layouts are saved per event and activity

3. **Configure Colors (Settings)**
   - Go to WordPress Admin → EFBC Events → Settings
   - Set **API Base URL** (where your EFBC server is hosted)
   - Pick colors for:
     - Table Header Background
     - Table Header Text Color
     - Row Hover Color
     - Even Row Background (zebra stripe)
   - Click **Save Changes**
   - Colors apply to all shortcode tables and admin previews

---

## Shortcode Features

### Search & Sort

All shortcode tables include:

- **Search Bar** — Filter attendees by name, email, phone, or other visible fields in real-time
- **Clickable Headers** — Click any column header to sort ascending/descending (↕ ▲ ▼ icons)
- **Responsive** — Optimized for mobile, tablet, and desktop viewports

### Column Customization

The columns displayed depend on what you saved in the **Table Builder**:

- Visit **Table Builder** in admin to define which columns appear for each event/activity
- The shortcode automatically uses your saved layout
- If no layout is saved, a default set is used: Name, City, Organization, Zip

---

## Settings

Navigate to **WordPress Admin → EFBC Events → Settings** to configure:

### API Configuration
- **API Base URL** — Base URL for EFBC API (e.g., `https://server.efbcconference.org/api`)
- Leave blank to use the default URL

### Table Appearance
- **Table Header Background** — Color picker for header background
- **Table Header Text Color** — Color picker for header text (default: white)
- **Row Hover Color** — Color applied when hovering over table rows
- **Even Row Background** — Zebra stripe color for even rows

All colors are applied site-wide to shortcode tables and admin modals.

---

## File Structure

```
efbc-event-suite/
├── efbc-event-suite.php           # Main plugin file
├── README.md                       # This file
├── admin/
│   ├── class-admin.php            # Admin menu & settings page
│   ├── src/
│   │   ├── index.js               # Admin app entry point
│   │   ├── components/
│   │   │   ├── Modal.js           # Attendee preview modal
│   │   │   ├── Toast.js           # Notification toasts
│   │   │   └── DraggableColumns.js # Drag-drop columns UI
│   │   ├── pages/
│   │   │   └── EventSuiteApp.js   # Main admin dashboard
│   │   └── table-builder/
│   │       └── table-builder.js   # Table column customizer
│   ├── build/                     # Compiled JS/CSS (generated)
│   └── package.json               # Dependencies for admin
├── includes/
│   ├── class-efbc-ajax.php        # AJAX handlers (get_events, get_attendees)
│   ├── class-efbc-api.php         # API helper class
│   ├── class-efbc-shortcodes.php  # Shortcode registration & rendering
│   └── class-efbc-settings.php    # Settings registration
├── assets/
│   ├── css/
│   │   ├── front.css              # Frontend shortcode styles
│   │   └── admin.css              # Admin styles
│   └── js/
│       └── front.js               # Frontend search, sort, filtering
└── languages/                     # Translation files (i18n)
```

---

## Development

### Building Admin Dashboard

The admin interface is built with React and WordPress components. To rebuild after changes:

1. Navigate to the `admin` folder:
   ```powershell
   cd admin
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Build for production:
   ```powershell
   npm run build
   ```

4. Refresh WordPress admin pages to see changes

### Dependencies

- **WordPress >= 5.8** (for React components)
- **PHP >= 7.4**
- **@wordpress/element** (React internals)
- **react-beautiful-dnd** (Drag-and-drop for Table Builder)

### Frontend JavaScript

Frontend functionality (search, sort) is handled by `/assets/js/front.js`:

- Search input filters table rows in real-time
- Column headers are clickable for ascending/descending sort
- Sorting icons (⇅ ▲ ▼) appear on headers

### Frontend CSS

Responsive table styling in `/assets/css/front.css`:

- Zebra striping with customizable colors
- Smooth hover effects
- Mobile-optimized responsive design
- CSS variables for easy color injection

---

## API Integration

The plugin fetches event and attendee data from a remote EFBC API. Ensure your API base URL is correct in **Settings**.

### API Endpoints

Assuming your API base is `https://server.efbcconference.org/api`:

- **Get Events** — `GET /api/events`
- **Get Attendees** — `GET /api/registrations/event/{event_id}`

Response format (JSON):
```json
{
  "data": [
    {
      "id": 1,
      "badgeName": "John Doe",
      "email": "john@example.com",
      "mobile": "555-1234",
      "status": "confirmed",
      "golfHandicap": 12,
      "clubRentals": true,
      "paid": true,
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "address": "123 Main St",
      "organization": "Acme Corp",
      "companyType": "Tech",
      "wednesdayActivity": "Golf"
    }
  ]
}
```

---

## Customization

### Modifying Column Names

To add or change available columns, edit the `allPossibleColumns` array in:
- `/admin/src/table-builder/table-builder.js`
- Add the corresponding field mapping in `fieldKeyMap`

### Styling

- **Frontend table CSS** — Edit `/assets/css/front.css`
- **Admin table CSS** — Edit `/assets/css/admin.css`
- **Color overrides** — Use the **Settings** page color pickers (overrides CSS variables)

### Extending Shortcode

To add new shortcode attributes, edit `render_attendees_table()` in `/includes/class-efbc-shortcodes.php`:

```php
$atts = shortcode_atts( array(
    'event_id' => 0,
    'activity' => '',
    // Add new attribute here:
    'limit' => -1,
), $atts, 'efbc_attendees' );
```

---

## Troubleshooting

### Shortcode shows "Unable to fetch attendees"

- **Check API URL** — Go to Settings and verify the API Base URL is correct and reachable
- **Test connection** — Manually visit the API endpoint in your browser (e.g., `https://server.efbcconference.org/api/events`)
- **Event ID** — Ensure the `event_id` in the shortcode exists and has attendees

### Admin dashboard shows blank

- **Check build** — Run `npm run build` in the `/admin` folder
- **Check browser console** — Press F12 and look for JavaScript errors
- **Clear cache** — Clear browser cache and WordPress object cache

### Colors not updating

- **Save settings** — After changing colors, click **Save Changes** on the Settings page
- **Clear cache** — Clear any page/object caches (browser, Elementor, WordPress)
- **Refresh pages** — Reload frontend pages and admin pages that display tables

### Columns not saving

- **Check permissions** — Ensure you have `manage_options` capability
- **Check AJAX** — Open browser DevTools (F12) → Network tab and verify AJAX calls return 200 status
- **Database** — Verify WordPress options table can be written to

---

## Performance Tips

- Use **Table Builder** to display only the columns you need (smaller HTML)
- Add `limit` attribute in future versions to paginate large attendee lists
- Cache API responses if events/attendees change infrequently
- Use a CDN for CSS/JS assets if self-hosting

---

## Support & Contributions

For issues, feature requests, or contributions:
- Visit: [github.com/bongdevs/efbc-event-suite](https://github.com/bongdevs/efbc-event-suite)
- Report issues on the GitHub repository

---

## License

This plugin is licensed under the **GNU General Public License v2.0** or later. See [License](https://www.gnu.org/licenses/gpl-2.0.html) for details.

---

## Credits

Developed and maintained by **[Bongdevs.com](https://bongdevs.com)** — Your WordPress & Web Solutions Agency

**Lead Developer:** Jahid Hasan

**Related Link:** [EFBC Conference](https://efbcconference.org)

---

## Changelog

### Version 1.0.0 (2025-11-25)
- Initial release
- Dynamic `[efbc_attendees]` shortcode
- React admin dashboard
- Table Builder with column customization
- Admin color settings for table styling
- Real-time search and sort functionality
- Responsive design for all devices
- API integration with configurable base URL
- Drag-and-drop column reordering
- Activity filtering and attendee preview modal
