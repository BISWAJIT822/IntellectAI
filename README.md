# Sai Intellect Solutions - IntellectAI Chatbot

A highly polished, premium full-stack chatbot web application built for **Sai Intellect Solutions** (SWAPPL Intellect Sol Pvt Ltd). The application contains a modular, separate-file architecture.

## 🚀 Features

- **Consulting Flow & Lead Capture**: Guiding visitors to submit consultation inquiries (Name, Email, Service interest, Project Details) which are saved directly into a local SQLite database.
- **Leads Admin Panel**: Built-in, separate dashboard view to inspect and manage lead registrations in real-time.
- **Glassmorphic Tech UI**: Sleek, modern interface using CSS variables, glowing backgrounds, smooth micro-animations, and full responsiveness.
- **Advanced Accessibility Options**:
  - **Speech-to-Text**: Voice-typing using the Web Speech Recognition API.
  - **Text-to-Speech**: Listen to bot answers aloud using standard browser speech synthesis.
- **Markdown & Code Support**: Bot responses render professional formatting, bullet points, headers, and code snippets powered by `marked.js`.
- **Session & Chat History Preservation**: Remembers previous chat lines under active user session, with clear-history function.
- **Light & Dark Theme Switcher**: Modern toggle with preference retention in `localStorage`.

---

## 📂 File Structure

The project maintains clean, separate concerns across folders and files:

```text
sai_intellect_solutions_chatbot/
├── app.py                # Main Flask server, routes, and chat state-machine
├── database.py           # SQLite database setup and operations
├── requirements.txt      # Python dependencies
├── templates/
│   └── index.html        # HTML structure (Head, Sidebar, Panels)
└── static/
    ├── css/
    │   └── style.css     # Design tokens, theme variables, glassmorphic layout
    └── js/
        └── script.js     # JavaScript API driver, Speech, Theme, and Tab managers
```

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have **Python 3.x** installed on your system.

### 1. Install Dependencies
Open your command terminal, navigate to the project directory, and install requirements:
```bash
pip install -r requirements.txt
```

### 2. Start the Server
Run the Flask application:
```bash
python app.py
```
This will:
- Initialize the local database file `chatbot.db` automatically if it doesn't exist.
- Start the server on `http://127.0.0.1:5000/`.

### 3. Open in Browser
Open your browser and navigate to:
👉 **[http://127.0.0.1:5000/](http://127.0.0.1:5000/)**
