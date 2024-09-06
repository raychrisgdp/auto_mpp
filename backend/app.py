from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate  # Import Migrate
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config.from_object("config")
CORS(app)

db = SQLAlchemy(app)
migrate = Migrate(app, db)  # Initialize Migrate

from routes import *

with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
