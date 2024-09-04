from app import app, db
from flask import jsonify, request
from models import Assignment, Personnel, Task


@app.route("/personnel", methods=["GET", "POST"])
def handle_personnel():
    if request.method == "POST":
        data = request.json
        new_personnel = Personnel(name=data["name"])
        db.session.add(new_personnel)
        db.session.commit()
        return jsonify({"id": new_personnel.id, "name": new_personnel.name}), 201
    else:
        personnel = Personnel.query.all()
        return jsonify([{"id": p.id, "name": p.name} for p in personnel])


@app.route("/personnel/<int:id>", methods=["PUT", "DELETE"])
def handle_single_personnel(id):
    personnel = Personnel.query.get_or_404(id)
    if request.method == "PUT":
        data = request.json
        personnel.name = data["name"]
        db.session.commit()
        return jsonify({"id": personnel.id, "name": personnel.name})
    elif request.method == "DELETE":
        db.session.delete(personnel)
        db.session.commit()
        return "", 204


@app.route("/tasks", methods=["GET", "POST"])
def handle_tasks():
    if request.method == "POST":
        data = request.json
        new_task = Task(name=data["name"])
        db.session.add(new_task)
        db.session.commit()

        if "dependencies" in data:
            for dep_id in data["dependencies"]:
                dependency = Task.query.get(dep_id)
                if dependency:
                    new_task.dependencies.append(dependency)

        db.session.commit()
        return jsonify({"id": new_task.id, "name": new_task.name}), 201
    else:
        tasks = Task.query.all()
        return jsonify(
            [
                {
                    "id": t.id,
                    "name": t.name,
                    "assignments": [
                        {"id": a.id, "personnel_id": a.personnel_id, "hours": a.hours}
                        for a in Assignment.query.filter_by(task_id=t.id)
                    ],
                    "dependencies": [dep.id for dep in t.dependencies],
                }
                for t in tasks
            ]
        )


@app.route("/tasks/<int:id>", methods=["PUT", "DELETE"])
def handle_single_task(id):
    task = Task.query.get_or_404(id)
    if request.method == "PUT":
        data = request.json
        task.name = data["name"]

        if "dependencies" in data:
            task.dependencies.clear()
            for dep_id in data["dependencies"]:
                dependency = Task.query.get(dep_id)
                if dependency:
                    task.dependencies.append(dependency)

        db.session.commit()
        return jsonify(
            {
                "id": task.id,
                "name": task.name,
                "dependencies": [dep.id for dep in task.dependencies],
            }
        )
    elif request.method == "DELETE":
        db.session.delete(task)
        db.session.commit()
        return "", 204


@app.route("/tasks/<int:task_id>/assignments", methods=["POST"])
def add_assignment(task_id):
    data = request.json
    new_assignment = Assignment(
        task_id=task_id, personnel_id=data["personnel_id"], hours=data["hours"]
    )
    db.session.add(new_assignment)
    db.session.commit()
    return (
        jsonify(
            {
                "id": new_assignment.id,
                "task_id": new_assignment.task_id,
                "personnel_id": new_assignment.personnel_id,
                "hours": new_assignment.hours,
            }
        ),
        201,
    )


@app.route(
    "/tasks/<int:task_id>/assignments/<int:assignment_id>", methods=["PUT", "DELETE"]
)
def handle_assignment(task_id, assignment_id):
    assignment = Assignment.query.get_or_404(assignment_id)
    if request.method == "PUT":
        data = request.json
        assignment.personnel_id = data["personnel_id"]
        assignment.hours = data["hours"]
        db.session.commit()
        return jsonify(
            {
                "id": assignment.id,
                "task_id": assignment.task_id,
                "personnel_id": assignment.personnel_id,
                "hours": assignment.hours,
            }
        )
    elif request.method == "DELETE":
        db.session.delete(assignment)
        db.session.commit()
        return "", 204
