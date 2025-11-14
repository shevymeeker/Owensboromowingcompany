# OMC Invoice Manager - Progressive Web App

Professional invoice and estimate management system for Owensboro Mowing Company.

## Features

- **Offline-First**: Works completely offline - no internet required for core functions
- **Client Management**: Store and manage client information with billing addresses
- **Estimates & Invoices**: Create professional multi-phase estimates and invoices
- **PDF Generation**: Generate beautiful PDFs with your branding
- **Share via SMS**: Share invoices directly via text message (iOS/Android)
- **Multi-Project Support**: Manage multiple projects simultaneously
- **Parts & Labor Library**: Maintain catalogs of common parts and labor rates
- **Photo Integration**: Attach photos to project phases
- **PWA Installable**: Install on iOS, Android, or desktop for app-like experience

## Quick Start

### 1. Generate App Icons

Open `generate-icons.html` in your browser and download both icons:
- `icon-192.png`
- `icon-512.png`

Save them in the root directory of your project.

### 2. Deploy to Web Server

Upload all files to your web server (GitHub Pages, Netlify, Vercel, etc.)

The app needs to be served over HTTPS for PWA features to work.

### 3. Install on Mobile

**iOS:**
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will work offline after installation

**Android:**
1. Open the app in Chrome
2. Tap "Install App" when prompted
3. Or use the browser menu → "Install App"

## Workflow

1. **Setup Your Company Info**: Go to "My company" tab and enter your business details
2. **Add Clients**: Use the "Customers" tab to add client information
3. **Create Estimate**:
   - Go to "Estimate" tab
   - Assign a customer
   - Add line items from your Parts/Labor library or custom items
   - Organize by phases if needed
4. **Generate Invoice**: Click "Print invoice" or "Share invoice"
5. **Send via Text**: Use the orange "Share invoice" button to send via SMS

## Data Management

- All data is stored locally in your browser
- Use **Export** to backup your data regularly
- Use **Import** to restore or transfer data between devices
- Multi-project support lets you switch between different jobs

## Color Scheme

- **Primary Green**: #2A9D8F (buttons, headers)
- **Orange Highlight**: #F4A261 (share button, accents)
- **Neutral Greys**: Light backgrounds, professional appearance
- **Black Text**: #2d2d2d for readability

## Technical Details

- **No Backend Required**: Fully client-side application
- **Storage**: localStorage for data persistence
- **PWA**: Service Worker for offline caching
- **PDF**: html2pdf.js for document generation
- **Styling**: Tailwind CSS + custom styles
- **Share API**: Web Share API for native sharing

## Browser Support

- **Recommended**: Chrome, Safari, Edge (latest versions)
- **iOS**: Safari 11.3+ (PWA support)
- **Android**: Chrome 57+ (PWA support)
- **Desktop**: All modern browsers

## Future Enhancements

- Cloud sync across devices (optional)
- Recurring invoices
- Payment tracking
- Client portal
- Email integration

## License

Private use for Owensboro Mowing Company

---

For support or questions, contact: 270.222.9613 or 270.499.7758
