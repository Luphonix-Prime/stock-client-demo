# Design Guidelines: Clothing Inventory & Order Management System

## Design Approach

**Selected Approach**: Design System - Material Design Principles  
**Justification**: This is a utility-focused, information-dense application where efficiency, data clarity, and learnability are paramount. Material Design provides excellent patterns for data-heavy applications with strong visual hierarchy and interaction feedback.

**Core Principles**:
- Clarity over decoration - every element serves a functional purpose
- Efficient data entry and scanning workflows
- Clear information hierarchy in tables and forms
- Consistent interaction patterns across inventory and order screens

---

## Typography System

**Font Family**: Inter (via Google Fonts CDN) for primary UI, Roboto Mono for SKU/codes

**Type Scale**:
- Page Headers: text-3xl font-bold (Inventory, Orders, Create Product)
- Section Headers: text-xl font-semibold (Product Details, Variant Information)
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels: text-sm font-medium uppercase tracking-wide
- Helper Text: text-sm text-opacity-70
- Data/Numbers: text-base font-mono (for SKUs, prices, quantities)
- Table Headers: text-sm font-semibold uppercase

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Form field gaps: gap-4
- Card spacing: p-6
- Button padding: px-6 py-3

**Grid System**:
- Main container: max-w-7xl mx-auto px-4
- Two-column layout for forms: grid grid-cols-1 md:grid-cols-2 gap-6
- Product grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Table layouts: full-width responsive tables with horizontal scroll on mobile

**Layout Structure**:
- Top navigation bar (h-16) with screen tabs and action buttons
- Main content area with generous padding (py-8)
- Sidebar for filters (w-64) on inventory screen
- Modal overlays for create/edit forms (max-w-4xl)

---

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header with app title on left
- Tab navigation between Inventory and Orders screens
- Action button area on right (Create Product, QR Scanner)
- Shadow elevation for depth separation

### Data Display Components

**Product Cards** (for grid view):
- Compact card with product image (aspect-ratio-square)
- Product name (truncate after 2 lines)
- SKU badge with monospace font
- Stock quantity indicator
- Price display
- Quick action buttons (Edit, View QR, Delete)
- Hover state with subtle elevation increase

**Data Table** (for list view):
- Sticky header row
- Sortable columns (name, SKU, category, stock, price)
- Row hover states
- Action column with icon buttons
- Responsive: card layout on mobile, table on desktop
- Pagination controls at bottom (showing 10/25/50/100 items per page)

**QR Code Display Card**:
- Centered QR code image (size: 256x256px or 300x300px)
- Product name and SKU below QR
- Download QR button
- Print QR button
- Share/copy functionality

### Form Components

**Create/Edit Product Form** (organized in tabbed sections):

**Tab 1: Basic Information**
- Product Name: Full-width text input
- SKU/Product Code: Text input with "Generate QR" button adjacent
- Category: Dropdown select with search
- Brand: Text input with autocomplete suggestions
- Description: Textarea (h-32) or rich text editor

**Tab 2: Variant Details** (2-column grid)
- Color: Multi-select dropdown with color chips
- Size: Multi-select (S, M, L, XL, XXL)
- Fabric: Select or text input
- Pattern: Select dropdown
- Gender: Radio button group (horizontal)

**Tab 3: Pricing & Stock** (2-column grid)
- Price: Currency input with symbol prefix
- Cost Price: Currency input
- Stock Quantity: Number input with +/- steppers
- Warehouse: Linked dropdown (if applicable)

**Tab 4: Media & Metadata**
- Product Image: Drag-and-drop image upload zone (aspect-ratio-square preview)
- Gallery Images: Multi-image upload with thumbnail preview grid
- Is Featured: Toggle switch
- Launch Date: Date picker
- Rating: Star rating display/input
- Tags: Tag input with autocomplete (chips display)

**Form Actions**:
- Bottom-aligned button group
- Cancel (secondary), Save Draft (secondary), Create Product (primary)

### Input Field Styling
- Consistent height (h-12 for standard inputs)
- Border with focus ring
- Label above input (text-sm font-medium mb-2)
- Helper text below (text-sm text-opacity-70)
- Error states with icon and message
- Required field indicator (asterisk)

### Buttons
**Primary Actions**: 
- px-6 py-3, rounded-lg, font-medium
- Examples: Create Product, Save, Confirm Order

**Secondary Actions**:
- px-4 py-2, rounded-lg, border style
- Examples: Cancel, Clear Filters, Export

**Icon Buttons**:
- w-10 h-10, rounded-lg
- Examples: Edit, Delete, View, QR Scan

**FAB (Floating Action Button)**:
- Fixed bottom-right position (bottom-8 right-8)
- Large circular button (w-14 h-14)
- Quick access to Create Product or Start Scan

### QR Scanner Interface
**Full-screen modal overlay**:
- Camera preview taking majority of screen
- Scanning frame overlay (centered, animated corners)
- Instructions text at top
- Cancel button (top-left corner)
- Manual SKU entry option at bottom
- Success state with product preview card
- Error state for unrecognized codes

### Inventory Screen Layout
**Left Sidebar (w-64, collapsible on mobile)**:
- Search bar at top
- Filter sections (accordions):
  - Category checkboxes
  - Brand autocomplete
  - Size multi-select
  - Price range sliders
  - Stock status (In Stock, Low Stock, Out of Stock)
- Apply Filters button
- Clear All link

**Main Content Area**:
- Header with title, view toggle (grid/list), Create Product button, QR Scanner button
- Products count and sorting dropdown
- Product grid or table
- Pagination controls

### Order Screen Layout
**Order List View**:
- Table with columns: Order ID, Date, Customer, Products, Total, Status
- Status badges (Pending, Processing, Shipped, Delivered)
- Row click to view order details
- Create Order button (top-right)

**Create Order Form**:
- Customer information section
- Product selection: Search bar with autocomplete, Add Product button
- Selected products table (editable quantities)
- Automatic total calculation
- Order notes textarea
- Submit Order button

### Modal Dialogs
**Delete Confirmation**:
- Icon warning at top
- Clear message
- Product name in bold
- Cancel and Delete buttons

**Success Toast**:
- Fixed top-right position (top-4 right-4)
- Auto-dismiss after 3 seconds
- Icon, message, close button

---

## Interactions & States

**Loading States**:
- Skeleton loaders for table rows and cards
- Spinner for button actions
- Progress bar for image uploads

**Empty States**:
- Centered illustration or icon
- Clear message ("No products found")
- Action button ("Create Your First Product")

**Error States**:
- Inline validation messages for forms
- Toast notifications for system errors
- Retry buttons where applicable

**Focus Management**:
- Visible focus rings on all interactive elements
- Keyboard navigation support
- Logical tab order in forms

---

## Responsive Behavior

**Mobile (< 768px)**:
- Collapsed sidebar with filter button
- Single column forms
- Card-based product display
- Bottom sheet for quick actions
- Stack navigation tabs
- Simplified table views (card format)

**Tablet (768px - 1024px)**:
- Two-column forms
- Hybrid grid (2 columns)
- Collapsible sidebar
- Full table views

**Desktop (> 1024px)**:
- Three-column product grid
- Persistent sidebar
- Full form layout with all tabs visible
- Enhanced data tables with all columns

---

## Icons
**Library**: Heroicons (via CDN)
- Use outline style for navigation and secondary actions
- Use solid style for primary actions and badges
- Size: w-5 h-5 for inline icons, w-6 h-6 for buttons

---

## Accessibility
- All form inputs have associated labels
- Color is not the only indicator of state
- Sufficient touch target sizes (minimum 44x44px)
- Screen reader announcements for dynamic content
- Keyboard shortcuts documented (e.g., "N" for new product, "/" for search)
- High contrast ratios for text and interactive elements

---

## Images
**Product Images**: Square aspect ratio (1:1), minimum 600x600px recommended, displayed in cards and detail views with object-cover
**No hero images needed** - this is a utility application focused on data management