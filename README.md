# Project Name

This project consists of a Flask backend API and a React frontend for managing tasks and personnel.

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS and Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

5. Initialize the database:
   ```
   python
   >>> from app import db
   >>> db.create_all()
   >>> exit()
   ```

6. Run the Flask application:
   ```
   python app.py
   ```

The backend API will be available at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install the required packages:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

The frontend application will be available at `http://localhost:3000`.

## API Endpoints

- GET /personnel: Retrieve all personnel
- POST /personnel: Create a new personnel
- PUT /personnel/<id>: Update a personnel
- DELETE /personnel/<id>: Delete a personnel
- GET /tasks: Retrieve all tasks with assignments
- POST /tasks: Create a new task
- PUT /tasks/<id>: Update a task
- DELETE /tasks/<id>: Delete a task
- POST /tasks/<task_id>/assignments: Create a new assignment
- PUT /tasks/<task_id>/assignments/<assignment_id>: Update an assignment
- DELETE /tasks/<task_id>/assignments/<assignment_id>: Delete an assignment