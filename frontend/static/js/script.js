
// Define the backend API endpoint
const API_URL = "/api/notes";

// Get references to HTML elements
const noteForm = document.getElementById("noteForm");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const notesContainer = document.getElementById("notesContainer");
const emptyState = document.getElementById("emptyState");
const noteCount = document.getElementById("noteCount");
const charCount = document.getElementById("charCount");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const searchInput = document.getElementById("searchInput");

// Store notes fetched from the backend
let allNotes = [];

// Track the ID of the note currently being edited
let editingNoteId = null;


// --------------------------------------------------
// CHARACTER COUNTER
// --------------------------------------------------

// Update the character count whenever the user types
noteContent.addEventListener("input", () => {
    charCount.textContent = `${noteContent.value.length} characters`;
});


// --------------------------------------------------
// FETCH AND DISPLAY NOTES
// --------------------------------------------------

// Fetch all notes from the Flask backend
async function loadNotes() {
    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load notes");
        }

        // Convert API response into JavaScript data
        allNotes = await response.json();

        // Display the retrieved notes
        displayNotes(allNotes);

    } catch (error) {

        // Log errors and inform the user
        console.error(error);
        notesContainer.textContent = "Unable to load notes.";
    }
}


// --------------------------------------------------
// CREATE AND UPDATE NOTES
// --------------------------------------------------

// Handle note form submission
noteForm.addEventListener("submit", async (event) => {

    // Prevent the browser from refreshing the page
    event.preventDefault();

    // Get values entered by the user
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    // Validate note fields
    if (!title || !content) {
        alert("Please enter title and content!");
        return;
    }

    // Choose POST for new notes and PUT for editing
    const isEditing = editingNoteId !== null;

    const url = isEditing
        ? `${API_URL}/${editingNoteId}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    // Disable the button while the request is processing
    saveBtn.disabled = true;
    saveBtn.textContent = isEditing ? "Updating..." : "Saving...";

    try {

        // Send note data to the Flask backend
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title: title,
                content: content
            })
        });

        const result = await response.json();

        // Handle unsuccessful API responses
        if (!response.ok) {
            throw new Error(result.error || "Operation failed");
        }

        // Show success message
        alert(result.message);

        // Clear the editor and refresh the notes
        resetEditor();
        await loadNotes();

    } catch (error) {

        // Handle request errors
        console.error(error);
        alert(error.message);

    } finally {

        // Re-enable the button after the request
        saveBtn.disabled = false;
        saveBtn.textContent = editingNoteId !== null
            ? "Update Note"
            : "+ Save Note";
    }
});


// --------------------------------------------------
// DISPLAY NOTES
// --------------------------------------------------

// Create and display note cards dynamically
function displayNotes(notes) {

    // Clear previously displayed cards
    notesContainer.innerHTML = "";

    // Update the total number of displayed notes
    noteCount.textContent =
        `${notes.length} ${notes.length === 1 ? "Note" : "Notes"}`;

    // Show or hide the empty state
    emptyState.style.display =
        notes.length === 0 ? "block" : "none";

    // Display suitable message when no notes are available
    if (notes.length === 0) {

        const isSearching = searchInput.value.trim() !== "";

        emptyState.querySelector("h3").textContent =
            isSearching ? "No matching notes" : "No notes yet";

        emptyState.querySelector("p").textContent =
            isSearching
                ? "Try another search keyword."
                : "Start writing your first note above!";

        return;
    }

    // Generate a card for each note
    notes.forEach((note) => {

        const card = document.createElement("div");
        card.className = "note-card";

        // Add note title
        const heading = document.createElement("h3");
        heading.textContent = note.title;

        // Add note content
        const paragraph = document.createElement("p");
        paragraph.textContent = note.content;

        // Display note creation date
        const date = document.createElement("span");
        date.className = "note-date";
        date.textContent = "Created: " + note.created_at;

        // Create edit button
        const editButton = document.createElement("button");
        editButton.className = "edit-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editNote(note);
        });

        // Create delete button
        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteNote(note.id);
        });

        // Add all elements to the note card
        card.append(
            heading,
            paragraph,
            date,
            editButton,
            deleteButton
        );

        // Add the card to the notes container
        notesContainer.appendChild(card);
    });
}


// --------------------------------------------------
// EDIT NOTE
// --------------------------------------------------

// Load the selected note into the editor
function editNote(note) {

    // Store the selected note ID
    editingNoteId = note.id;

    // Fill the form with existing note details
    noteTitle.value = note.title;
    noteContent.value = note.content;

    // Change the button to update mode
    saveBtn.textContent = "Update Note";

    // Display the cancel button
    cancelEditBtn.hidden = false;

    // Update character count
    charCount.textContent =
        `${note.content.length} characters`;

    // Focus the title field
    noteTitle.focus();

    // Scroll to the editor section
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// --------------------------------------------------
// RESET EDITOR
// --------------------------------------------------

// Clear the form and return to create mode
function resetEditor() {

    editingNoteId = null;

    noteForm.reset();

    charCount.textContent = "0 characters";

    saveBtn.textContent = "+ Save Note";

    cancelEditBtn.hidden = true;
}


// Cancel the current editing operation
cancelEditBtn.addEventListener("click", () => {
    resetEditor();
});


// --------------------------------------------------
// DELETE NOTE
// --------------------------------------------------

// Send a DELETE request for the selected note
async function deleteNote(id) {

    // Ask for confirmation before deleting
    const confirmDelete = confirm(
        "Are you sure you want to delete this note?"
    );

    if (!confirmDelete) return;

    try {

        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Delete failed");
        }

        // Reset editor if the deleted note was being edited
        if (editingNoteId === id) {
            resetEditor();
        }

        alert(result.message);

        // Refresh the notes list
        await loadNotes();

    } catch (error) {

        console.error(error);
        alert(error.message);
    }
}


// --------------------------------------------------
// SEARCH NOTES
// --------------------------------------------------

// Filter notes based on title or content
searchInput.addEventListener("input", () => {

    const keyword = searchInput.value.toLowerCase().trim();

    const filteredNotes = allNotes.filter((note) => {

        return (
            note.title.toLowerCase().includes(keyword) ||
            note.content.toLowerCase().includes(keyword)
        );

    });

    // Display only matching notes
    displayNotes(filteredNotes);
});


// --------------------------------------------------
// INITIALIZE APPLICATION
// --------------------------------------------------

// Load saved notes when the page first opens
loadNotes();
