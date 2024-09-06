from app import db


class Role(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(100))


class Personnel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("role.id"))
    role = db.relationship("Role", backref=db.backref("personnel", lazy=True))


class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

    dependencies = db.relationship(
        "Task",
        secondary="task_dependencies",
        primaryjoin="Task.id==task_dependencies.c.task_id",
        secondaryjoin="Task.id==task_dependencies.c.dependency_id",
        backref=db.backref("dependent_tasks", lazy="dynamic"),
    )


class Assignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), nullable=False)
    personnel_id = db.Column(db.Integer, db.ForeignKey("personnel.id"), nullable=False)
    hours = db.Column(db.Float, nullable=False)


class TaskDependency(db.Model):
    __tablename__ = "task_dependencies"
    task_id = db.Column(db.Integer, db.ForeignKey("task.id"), primary_key=True)
    dependency_id = db.Column(db.Integer, db.ForeignKey("task.id"), primary_key=True)
