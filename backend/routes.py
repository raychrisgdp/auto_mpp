from collections import defaultdict

from app import app, db
from flask import jsonify, request
from models import Assignment, Personnel, Role, Task


def topological_sort(tasks):
    # Create a graph representation
    graph = {task.id: set() for task in tasks}
    for task in tasks:
        for dep in task.dependencies:
            graph[dep.id].add(task.id)

    # Perform topological sort
    visited = set()
    stack = []

    def dfs(task_id):
        visited.add(task_id)
        for neighbor in graph[task_id]:
            if neighbor not in visited:
                dfs(neighbor)
        stack.append(task_id)

    for task_id in graph:
        if task_id not in visited:
            dfs(task_id)

    return stack[::-1]


def _get_later_time(day1: int, hour1: int, day2: int, hour2: int) -> tuple[int, int]:
    if day1 < day2:
        return (day2, hour2)
    elif day1 > day2:
        return (day1, hour1)
    else:
        return (day1, max(hour1, hour2))


def generate_timeline(tasks):
    sorted_task_ids = topological_sort(tasks)
    timeline = []
    # personnel_workload = defaultdict(lambda: defaultdict(int))
    task_end_times = {task.id: (0, 0) for task in tasks}  # Initialize end times
    personnel_available_times = defaultdict(lambda: (0, 0))  # (day, hour)
    max_day = 0

    for task_id in sorted_task_ids:
        task = next(t for t in tasks if t.id == task_id)

        # Find the earliest start time for this task based on dependencies
        earliest_start_day = 1
        earliest_start_hour = 0
        for dep in task.dependencies:
            if dep.id in task_end_times:
                end_day, end_hour = task_end_times[dep.id]
                earliest_start_day, earliest_start_hour = _get_later_time(
                    earliest_start_day, earliest_start_hour, end_day, end_hour
                )

        assignments = Assignment.query.filter_by(task_id=task.id).all()
        task_timeline = []
        task_end_day = earliest_start_day
        task_end_hour = earliest_start_hour

        for assignment in assignments:
            person_id = assignment.personnel_id
            current_day, current_hour = personnel_available_times[person_id]

            # Calculate the earliest start time for this person
            current_start_day, current_start_hour = _get_later_time(
                current_day, current_hour, earliest_start_day, earliest_start_hour
            )
            remaining_hours = assignment.hours
            while remaining_hours > 0:

                available_hours = min(
                    8 - current_start_hour,
                    remaining_hours,
                )

                task_timeline.append(
                    {
                        "task_id": task.id,
                        "task_name": task.name,
                        "person_id": person_id,
                        "day": current_start_day,
                        "start_hour": current_start_hour,
                        "duration": available_hours,
                    }
                )

                remaining_hours -= available_hours
                current_start_hour += available_hours

                # Update task end time
                if current_start_hour >= 8:
                    current_start_day += 1
                    current_start_hour -= 8  # Adjust hour to be less than 8

                task_end_day, task_end_hour = _get_later_time(
                    task_end_day, task_end_hour, current_start_day, current_start_hour
                )

            # Update personnel's next available time
            personnel_available_times[person_id] = (
                current_start_day,
                current_start_hour,
            )

        task_end_times[task.id] = (task_end_day, task_end_hour)  # Store as tuple
        max_day = max(max_day, task_end_day)
        # when task ends in the beginning of the day, it actually finished the previous day
        if task_end_hour == 0:
            max_day -= 1

        timeline.extend(task_timeline)

    return timeline, max_day


@app.route("/personnel", methods=["GET", "POST"])
def handle_personnel():
    if request.method == "POST":
        data = request.json
        new_personnel = Personnel(name=data["name"], role_id=data.get("role_id"))
        db.session.add(new_personnel)
        db.session.commit()
        return (
            jsonify(
                {
                    "id": new_personnel.id,
                    "name": new_personnel.name,
                    "role_id": new_personnel.role_id,
                }
            ),
            201,
        )
    else:
        personnel = Personnel.query.all()
        return jsonify(
            [
                {
                    "id": p.id,
                    "name": p.name,
                    "role_id": p.role_id,
                    "role_name": p.role.name if p.role else None,
                }
                for p in personnel
            ]
        )


@app.route("/personnel/<int:id>", methods=["PUT", "DELETE"])
def handle_single_personnel(id):
    personnel = Personnel.query.get_or_404(id)
    if request.method == "PUT":
        data = request.json
        personnel.name = data["name"]
        personnel.role_id = data.get("role_id", personnel.role_id)
        db.session.commit()
        return jsonify(
            {"id": personnel.id, "name": personnel.name, "role_id": personnel.role_id}
        )
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


@app.route("/tasks/<int:task_id>/assignments/<int:assignment_id>", methods=["PUT"])
def handle_assignment(task_id, assignment_id):
    data = request.get_json()
    try:
        assignment = Assignment.query.get(assignment_id)
        if not assignment:
            return jsonify({"error": "Assignment not found"}), 404

        # Ensure personnel_id is present in the request
        if "personnel_id" not in data:
            return jsonify({"error": "personnel_id is required"}), 400

        assignment.hours = data.get("hours", assignment.hours)  # Update hours
        assignment.personnel_id = data["personnel_id"]  # Update personnel_id
        db.session.commit()
        return jsonify({"message": "Assignment updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/timeline", methods=["GET"])
def get_timeline():
    tasks = Task.query.all()
    personnel = Personnel.query.all()

    timeline, project_duration = generate_timeline(tasks)
    personnel_dict = {p.id: p.name for p in personnel}

    # Calculate personnel hours and task durations
    personnel_hours = defaultdict(int)
    task_durations = {}
    for item in timeline:
        personnel_hours[item["person_id"]] += item["duration"]
        if item["task_id"] not in task_durations:
            task_durations[item["task_id"]] = {
                "name": item["task_name"],
                "duration": item["duration"],
                "start": {"day": item["day"], "hour": item["start_hour"]},
                "end": {
                    "day": item["day"],
                    "hour": item["start_hour"] + item["duration"],
                },
            }
        else:
            task_durations[item["task_id"]]["duration"] += item["duration"]
            if item["day"] < task_durations[item["task_id"]]["start"]["day"] or (
                item["day"] == task_durations[item["task_id"]]["start"]["day"]
                and item["start_hour"]
                < task_durations[item["task_id"]]["start"]["hour"]
            ):
                task_durations[item["task_id"]]["start"] = {
                    "day": item["day"],
                    "hour": item["start_hour"],
                }
            if item["day"] > task_durations[item["task_id"]]["end"]["day"] or (
                item["day"] == task_durations[item["task_id"]]["end"]["day"]
                and item["start_hour"] + item["duration"]
                > task_durations[item["task_id"]]["end"]["hour"]
            ):
                task_durations[item["task_id"]]["end"] = {
                    "day": item["day"],
                    "hour": item["start_hour"] + item["duration"],
                }

    return jsonify(
        {
            "timeline": timeline,
            "project_duration": project_duration,
            "personnel_hours": {
                int(p_id): hours for p_id, hours in personnel_hours.items()
            },
            "task_durations": task_durations,
            "personnel_names": {
                int(p_id): name for p_id, name in personnel_dict.items()
            },
            "personnel_ids": [int(p_id) for p_id in personnel_dict.keys()],
        }
    )


@app.route("/tasks/<int:task_id>/assignments/<int:assignment_id>", methods=["DELETE"])
def delete_assignment(task_id, assignment_id):
    # Ensure the assignment belongs to the specified task
    assignment = Assignment.query.filter_by(id=assignment_id, task_id=task_id).first()
    if not assignment:
        return jsonify({"error": "Assignment not found"}), 404
    db.session.delete(assignment)
    db.session.commit()
    return "", 204


@app.route("/roles", methods=["GET", "POST"])
def handle_roles():
    if request.method == "POST":
        data = request.json
        if len(data["name"]) > 50 or len(data.get("description", "")) > 100:
            return jsonify({"error": "Name or description too long"}), 400
        new_role = Role(name=data["name"], description=data.get("description", ""))
        db.session.add(new_role)
        db.session.commit()
        return (
            jsonify(
                {
                    "id": new_role.id,
                    "name": new_role.name,
                    "description": new_role.description,
                }
            ),
            201,
        )
    else:
        roles = Role.query.order_by(Role.name).all()
        return jsonify(
            [{"id": r.id, "name": r.name, "description": r.description} for r in roles]
        )


@app.route("/roles/<int:id>", methods=["PUT", "DELETE"])
def handle_single_role(id):
    role = Role.query.get_or_404(id)
    if request.method == "PUT":
        data = request.json
        if len(data["name"]) > 50 or len(data.get("description", "")) > 100:
            return jsonify({"error": "Name or description too long"}), 400
        role.name = data["name"]
        role.description = data.get("description", role.description)
        db.session.commit()
        return jsonify(
            {"id": role.id, "name": role.name, "description": role.description}
        )
    elif request.method == "DELETE":
        if Personnel.query.filter_by(role_id=role.id).first():
            return jsonify({"error": "Cannot delete role with assigned personnel"}), 400
        db.session.delete(role)
        db.session.commit()
        return "", 204
