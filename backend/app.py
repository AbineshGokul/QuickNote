
# Import required Flask modules and database functions
from flask import Flask, render_template, request, jsonify
from database import get_connection, create_table

# Initialize Flask application and configure frontend folders
app = Flask(
    __name__,
    template_folder="../frontend/templates",
    static_folder="../frontend/static"
)


# --------------------------------------------------
# HOME PAGE
# --------------------------------------------------

# Display the main QuickNote application page
@app.route("/")
def home():
    return render_template("index.html")


# --------------------------------------------------
# API 1: GET ALL NOTES
# --------------------------------------------------

# Retrieve all saved notes from the SQLite database
@app.route("/api/notes", methods=["GET"])
def get_notes():

    # Establish database connection
    connection = get_connection()

    # Fetch all notes in descending order of ID
    notes = connection.execute(
        "SELECT * FROM notes ORDER BY id DESC"
    ).fetchall()

    # Close database connection
    connection.close()

    # Convert database rows into JSON response
    return jsonify([dict(note) for note in notes])


# --------------------------------------------------
# API 2: CREATE A NEW NOTE
# --------------------------------------------------

# Receive note details and save them to the database
@app.route("/api/notes", methods=["POST"])
def add_note():

    # Read JSON data sent by the frontend
    data = request.get_json(silent=True) or {}

    # Extract and clean title and content
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()

    # Validate required fields
    if not title or not content:
        return jsonify({
            "error": "Title and content are required"
        }), 400

    # Connect to the database
    connection = get_connection()

    # Insert the new note using parameterized SQL
    cursor = connection.execute(
        "INSERT INTO notes (title, content) VALUES (?, ?)",
        (title, content)
    )

    # Save database changes
    connection.commit()

    # Get the ID of the newly created note
    note_id = cursor.lastrowid

    # Retrieve the newly inserted note
    note = connection.execute(
        "SELECT * FROM notes WHERE id = ?", (note_id,)
    ).fetchone()

    # Close database connection
    connection.close()

    # Return success message and saved note
    return jsonify({
        "message": "Note saved successfully",
        "note": dict(note)
    }), 201


# --------------------------------------------------
# API 3: UPDATE AN EXISTING NOTE
# --------------------------------------------------

# Update the title and content of a selected note
@app.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):

    # Read updated note details from the frontend
    data = request.get_json(silent=True) or {}

    # Extract and clean the updated values
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()

    # Validate the updated note details
    if not title or not content:
        return jsonify({
            "error": "Title and content are required"
        }), 400

    # Establish database connection
    connection = get_connection()

    # Update the selected note using its ID
    cursor = connection.execute(
        """
        UPDATE notes
        SET title = ?, content = ?
        WHERE id = ?
        """,
        (title, content, note_id)
    )

    # Commit the updated values
    connection.commit()

    # Check whether the requested note exists
    if cursor.rowcount == 0:
        connection.close()
        return jsonify({
            "error": "Note not found"
        }), 404

    # Fetch the updated note details
    note = connection.execute(
        "SELECT * FROM notes WHERE id = ?", (note_id,)
    ).fetchone()

    # Close database connection
    connection.close()

    # Return updated note and success message
    return jsonify({
        "message": "Note updated successfully",
        "note": dict(note)
    })


# --------------------------------------------------
# API 4: DELETE A NOTE
# --------------------------------------------------

# Delete a selected note from the database
@app.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):

    # Establish database connection
    connection = get_connection()

    # Delete the note using its unique ID
    cursor = connection.execute(
        "DELETE FROM notes WHERE id = ?", (note_id,)
    )

    # Save deletion changes
    connection.commit()

    # Check whether a note was deleted
    deleted = cursor.rowcount

    # Close database connection
    connection.close()

    # Return an error if the note does not exist
    if deleted == 0:
        return jsonify({
            "error": "Note not found"
        }), 404

    # Return successful deletion response
    return jsonify({
        "message": "Note deleted successfully"
    })


# --------------------------------------------------
# APPLICATION ENTRY POINT
# --------------------------------------------------

# Run the Flask development server
if __name__ == "__main__":

    # Create the database table if it does not exist
    create_table()

    # Start the application in debug mode
    app.run(debug=True)
