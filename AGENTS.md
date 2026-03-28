# AGENTS.md - AI Coding Agent Guidelines

## Project Overview

**Material Stock Management Application** - A Flask-based web application for tracking material inventory with inward/outward movements, user authentication, admin management, and backup/restore functionality.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.x, Flask 3.x |
| Database | SQLAlchemy ORM, SQLite (development) |
| Frontend | HTML5, Bootstrap 5, Vanilla JavaScript |
| Email | Flask-Mail (SMTP) |
| Deployment | Gunicorn, Render, Vercel, PythonAnywhere |

## Project Structure

```
Stock_app/
├── app.py              # Main Flask application (routes, models, API)
├── requirements.txt    # Python dependencies
├── instance/           # SQLite database files (gitignored)
├── static/
│   ├── css/style.css   # Custom styles
│   ├── js/app.js       # Frontend JavaScript (1400+ lines)
│   └── images/         # Static assets
└── templates/          # Jinja2 HTML templates
    ├── index.html          # Dashboard page with category filter
    ├── material_list.html  # Material listing with CRUD
    ├── login.html          # User login
    ├── register.html       # User registration
    ├── profile.html        # User profile management
    ├── forgot_password.html
    ├── reset_password.html
    ├── admin_users.html    # Admin user management
    ├── admin_edit_user.html
    ├── admin_backup.html   # Admin backup & restore page
    └── admin_import_preview.html  # Import preview & selection
```

## Database Models

### User
- `id`, `username`, `email`, `password_hash`
- `role` (admin/manager/operator)
- `is_active`, `deleted_at` (soft delete)
- `reset_token`, `reset_token_expiry` (password reset)

### Material
- `id`, `date`, `item_name`
- `category` (Split AC, VRF AC, Cassete AC, AHU, Ductable AC, Cold Room, MS Fitting / Hardware, Fire, Electrical Goods, ADP, Insulation, PVC, UPVC, CPVC)
- `party_name`, `inward`, `outward`, `balance`
- `storage_place`, `description`
- `user_id` (FK to User)
- `deleted_at`, `deleted_by` (soft delete support)

### MaterialHistory
- Tracks individual inward/outward transactions
- `action_number`, `action_inward`, `action_outward`, `running_balance`
- Also tracks `item_name`, `party_name`, `description`, `storage_place` at time of action
- Maintains full audit trail per material

## API Endpoints

### Authentication
- `POST /login` - User login
- `POST /register` - User registration
- `GET /logout` - Logout
- `POST /forgot-password` - Request password reset
- `POST /reset-password/<token>` - Reset password

### Materials API
- `GET /api/materials` - List all materials (excludes soft-deleted)
- `POST /api/materials` - Create material
- `GET /api/materials/<id>` - Get single material
- `PUT /api/materials/<id>` - Update material
- `DELETE /api/materials/<id>` - Soft delete material (sets deleted_at)
- `GET /api/materials/<id>/history` - Get transaction history

### Admin Routes
- `GET /admin/users` - List users
- `GET/POST /admin/users/<id>/edit` - Edit user
- `POST /admin/users/<id>/delete` - Soft delete user
- `POST /admin/users/<id>/recover` - Recover deleted user
- `POST /admin/users/<id>/toggle-status` - Toggle active status

### Admin Backup & Restore Routes
- `GET /admin/backup` - Backup & restore dashboard
- `POST /admin/materials/<id>/restore` - Restore soft-deleted material
- `POST /admin/materials/<id>/permanent-delete` - Permanently delete material
- `GET /admin/download-backup` - Download SQLite database file
- `GET /admin/export-json` - Export all data as JSON
- `POST /admin/import-json` - Upload JSON backup for preview
- `POST /admin/import-materials` - Import selected materials from backup

## Coding Conventions

### Python (app.py)
- Use Flask decorators for routes
- Use `@login_required` and `@admin_required` decorators for protected routes
- Password hashing uses SHA-256 via `hashlib`
- Session-based authentication (`session['user_id']`)
- Return JSON responses for API endpoints using `jsonify()`
- Use `to_dict()` methods on models for serialization

### JavaScript (static/js/app.js)
- Vanilla JavaScript (no frameworks)
- Bootstrap 5 for modals, toasts, UI components
- Fetch API for HTTP requests
- Debounced search input
- Client-side table sorting and rendering
- SheetJS library for Excel (.xlsx) export
- Print functions with fixed footer on every page

### CSS (static/css/style.css)
- Custom styles extending Bootstrap 5
- CSS variables for theming
- Responsive design patterns

## Development Setup

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
python app.py
# Server runs at http://localhost:5000
```

## Environment Variables

Configure via `.env` file or environment:

```
SECRET_KEY=<flask-secret-key>
DATABASE_URL=sqlite:///material_stock.db
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=465
MAIL_USE_SSL=True
MAIL_USERNAME=<email>
MAIL_PASSWORD=<app-password>
MAIL_DEFAULT_SENDER=<sender-email>
```

## Important Notes for AI Agents

1. **Single File Backend**: All backend logic is in `app.py` (~1100+ lines). Consider code organization when making large changes.

2. **Database Migrations**: Schema changes use inline SQLAlchemy migrations in `app.py` with `ALTER TABLE` statements. Check existing migration patterns before adding new columns.

3. **Soft Delete Pattern**: Both Users and Materials use soft delete with `deleted_at` timestamp. Filter queries with `Model.deleted_at == None` to exclude deleted items. Materials also track `deleted_by` for audit.

4. **Balance Calculation**: Material balance is auto-calculated as cumulative (previous_balance + inward - outward). MaterialHistory tracks the running balance.

5. **Frontend State**: The JavaScript app maintains local state (`materials` array) and re-renders the table. Always call `loadMaterials()` after server-side changes.

6. **Authentication**: Session-based auth stored in `session['user_id']`, `session['username']`, `session['role']`. Check these in route handlers.

7. **Category System**: Materials use 14 categories for AC/HVAC equipment and materials:
   - Split AC, VRF AC, Cassete AC, AHU, Ductable AC, Cold Room
   - MS Fitting / Hardware, Fire, Electrical Goods, ADP
   - Insulation, PVC, UPVC, CPVC

8. **Category Filter**: Dashboard (index.html) has a category dropdown filter integrated with the search box.

9. **Backup & Restore**: Admin can access `/admin/backup` to:
   - View/restore deleted materials and users
   - Download SQLite database backup
   - Export all data as JSON

10. **Navigation Pattern**: Admin dropdown menus include links to Users, Backup & Restore, Profile, and Logout.

11. **Testing**: No automated tests exist. Manual testing required after changes.

12. **Print Functionality**: Both pages use `window.print()` with:
    - Fixed footer "© Developed by Amogh Deshmukh" on every page
    - PDF filename format: `material_list_DD_MM_YY.pdf`
    - `.no-print` class hides nav, search, action buttons when printing

13. **Excel Export**: Uses SheetJS library (`xlsx.full.min.js`) for proper `.xlsx` format export.

14. **Cache Busting**: CSS and JS files use `?v=N` query parameter to bust browser cache after updates.

## Common Tasks

### Adding a New API Endpoint
1. Add route decorator in `app.py`
2. Apply `@login_required` if protected
3. Return `jsonify()` response with appropriate status codes

### Adding a Database Column
1. Add column to model class with `default` value
2. Add migration block in the `with app.app_context():` section
3. Update `to_dict()` method if needed

### Adding Frontend Features
1. Add HTML to appropriate template
2. Add JavaScript handlers in `static/js/app.js`
3. Add styles in `static/css/style.css`

### Adding a New Category
1. Update dropdown in `templates/index.html` (search filter and add material modal)
2. Update any print-by-category functionality if present
