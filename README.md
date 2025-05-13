# Simple Finance Tracker (Python Version)

A minimalist web application for tracking personal finances, built with Python Flask and SQLite.

## Features

- Track income and expenses
- Store transaction data in SQLite database
- Simple and clean user interface
- View transaction history

## Project Structure

```
simple-finance-tracker-python/
│
├── app.py                 # Main Python Flask application
├── finance.db             # SQLite database (created automatically)
├── requirements.txt       # Python dependencies
│
└── templates/
    └── index.html         # Frontend UI template
```

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Clone or download this repository

2. Navigate to the project directory:
   ```
   cd simple-finance-tracker-python
   ```

3. Create a virtual environment (recommended):
   ```
   python -m venv venv
   ```

4. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

5. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

6. Run the application:
   ```
   python app.py
   ```

7. Open your browser and go to:
   ```
   http://localhost:5000
   ```

## Database

The application automatically creates a SQLite database file (`finance.db`) with the following schema:

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  date TEXT NOT NULL
);
```

## Development

For development mode with auto-reloading, the Flask app already has `debug=True` set in the `app.py` file.

## Future Enhancements

- Categories for transactions
- Monthly/yearly reports
- Data visualization
- Export to CSV/Excel
- Budget planning and tracking
- User authentication

## Customization

To modify the application:
- Edit `app.py` to change backend functionality
- Edit `templates/index.html` to modify the user interface