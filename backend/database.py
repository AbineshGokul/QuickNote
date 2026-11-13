
# Import SQLite and Path for database management
import sqlite3
from pathlib import Path


# Get the directory containing this Python file
BASE_DIR = Path(__file__).resolve().parent

# Define the SQLite database file location
DATABASE = BASE_DIR / "notes.db"


# Create and return a database connection
def get_connection():

    # Connect to the SQLite database
    connection = sqlite3.connect(DATABASE)

    # Enable column-based access to database rows
    connection.row_factory = sqlite3.Row

    return connection


# Create the notes table if it does not already exist
def create_table():

    # Establish database connection
    connection = get_connection()

    # Execute SQL command to create the notes table
    connection.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Save database changes
    connection.commit()

    # Close database connection
    connection.close()

    print("Database and notes table created successfully!")
