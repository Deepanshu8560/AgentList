###  AgentList

A full-stack web application for managing agent information — built with a modern front-end and back-end stack.

### Table of Contents

- About

- Key Features

- Tech Stack

- Getting Started

- Prerequisites

- Installation & Setup

- Usage

- Testing

- Project Structure

- Contributing

### About

AgentList is designed to provide an intuitive interface to manage a list of agents with their contact phones and associated notes. The app supports CRUD operations (Create, Read, Update, Delete) on agent records and is built to be scalable and maintainable, making it ideal for small/medium teams tracking agent data and notes.

### Key Features

- Agent management: add new agents, view list of agents, update details, delete records

- Phone number storage (numeric format) and free-text notes for each agent

- Responsive front-end for desktop and mobile usage

- Clean separation of frontend and backend for modular development

- Automated tests to ensure core functionality works correctly

- Tech Stack

- Frontend: JavaScript, HTML, CSS (framework/library if applicable)

- Backend: Node.js (or whichever backend folder reveals)

- Database: MongoDB

- Languages: JavaScript and Python according to repo stats. 

- Testing: Automated tests (see test_reports and tests folders)

### Getting Started
- Prerequisites

- Node.js version X.X.X (or newer)

- npm package manager




### Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/Deepanshu8560/AgentList.git  
cd AgentList  
```

2. **Install backend dependencies**
```bash
cd backend  
npm install  
```

3. **Configure database credentials**
```bash
Install frontend dependencies

cd ../frontend  
npm install  
```

4. **Run the development server**
```bash
# backend  
cd ../backend && npm start  

# frontend  
cd ../frontend && npm start  
```

5. Open your browser and navigate to http://localhost:3000 (or whichever port) to view the app.

### Usage

- Navigate to the Agents page

- Use the Add Agent button to input a first name, phone number, and notes

- View the list of agents, click on an agent to view full details or edit
- Use Delete to remove an agent record

- Use the search/filter (if implemented) to quickly find an agent by name or note content

### Testing

Automated tests are included to verify key backend endpoints and frontend behaviour.
```bash
To run backend tests:

cd backend && npm test  
```

See test results in the test_reports/ folder.

### Project Structure
```bash
AgentList/
├─ frontend/           # UI code
├─ backend/            # API and server code
├─ tests/              # Unit/integration tests
├─ test_reports/       # Generated test result artifacts
├─ .emergent           # Configuration for (Emergent?) if applicable
└─ README.md           # You are here
```
### Contributing

- Contributions are welcome! If you’d like to contribute:

- Fork the repository

- Create a feature branch (e.g., feature/your-feature)

- Commit your changes
- Push the branch and create a Pull Request

Ensure new features are covered by tests and existing tests still pass

Please respect the existing code style and maintain consistency.
