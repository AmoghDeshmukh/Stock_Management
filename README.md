# Material Stock Management Application

A web-based inventory management system for tracking material stock with inward/outward movements.

## Features

- **Add/Edit/Delete** material records
- **Track** inward and outward quantities
- **Auto-calculate** stock balance
- **Search** by item name, party, or storage location
- **Dashboard** with real-time statistics
- **Responsive** Bootstrap 5 UI

## Tech Stack

- **Backend**: Python Flask + SQLAlchemy
- **Database**: SQLite
- **Frontend**: HTML5, Bootstrap 5, JavaScript

## Local Development

```bash
# Clone the repository
git clone <your-repo-url>
cd Stock_app

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

Visit `http://localhost:5000` in your browser.

---

## Free Deployment Options

### Option 1: Render (Recommended)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign up
3. Click **New** → **Web Service**
4. Connect your GitHub repository
5. Configure:
   - **Name**: `material-stock-app`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
6. Click **Create Web Service**

Your app will be live at `https://your-app-name.onrender.com`

---

### Option 2: PythonAnywhere (Easiest)

1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Go to **Web** tab → **Add a new web app**
3. Choose **Flask** and Python 3.10+
4. Upload your files or clone from GitHub:
   ```bash
   git clone <your-repo-url>
   ```
5. In **Web** tab, set:
   - **Source code**: `/home/yourusername/Stock_app`
   - **Working directory**: `/home/yourusername/Stock_app`
6. Edit the WSGI file and update the path
7. Install dependencies in a Bash console:
   ```bash
   pip install -r requirements.txt
   ```
8. Reload the web app

---

### Option 3: Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) and sign in with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select your repository
5. Railway auto-detects Flask and deploys

---

### Option 4: Vercel (Serverless)

1. Create `vercel.json` in your project:
   ```json
   {
     "builds": [{"src": "app.py", "use": "@vercel/python"}],
     "routes": [{"src": "/(.*)", "dest": "app.py"}]
   }
   ```
2. Install Vercel CLI: `npm i -g vercel`
3. Run `vercel` in your project folder
4. Follow the prompts

---

## Environment Variables (Production)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | Auto-generated |
| `DATABASE_URL` | Database connection string | SQLite |
| `PORT` | Server port | 5000 |
| `FLASK_DEBUG` | Enable debug mode | False |

---

## Project Structure

```
Stock_app/
├── app.py              # Flask application
├── requirements.txt    # Python dependencies
├── Procfile           # Production server config
├── render.yaml        # Render deployment config
├── static/
│   ├── css/style.css  # Custom styles
│   └── js/app.js      # Frontend JavaScript
├── templates/
│   └── index.html     # Main UI template
└── instance/
    └── material_stock.db  # SQLite database
```

## License

MIT License

## Live Hosted
https://stock-management-m3ya.onrender.com/
