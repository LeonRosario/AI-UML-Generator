"""Calendar-driven schedules; deliberately independent of React Flow nodes."""
from datetime import date, timedelta

from pydantic import BaseModel, Field, field_validator, model_validator


class GanttTask(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    start: date
    duration: int = Field(ge=0, le=3650, strict=True)
    assignee: str = "Unassigned"
    progress: int = Field(default=0, ge=0, le=100)
    milestone: bool = False
    dependencies: list[str] = Field(default_factory=list)

    @field_validator("start", mode="before")
    @classmethod
    def calendar_date(cls, value):
        if isinstance(value, str):
            if len(value) != 10 or date.fromisoformat(value).isoformat() != value:
                raise ValueError("Use YYYY-MM-DD calendar dates")
        elif not isinstance(value, date):
            raise ValueError("Use YYYY-MM-DD calendar dates")
        return value

    @model_validator(mode="after")
    def valid_duration(self):
        if self.milestone != (self.duration == 0):
            raise ValueError("Milestones have zero duration; tasks need at least one day")
        return self


class GanttChart(BaseModel):
    tasks: list[GanttTask] = Field(default_factory=list, max_length=300)

    @model_validator(mode="after")
    def valid_schedule(self):
        tasks = {task.id: task for task in self.tasks}
        if len(tasks) != len(self.tasks):
            raise ValueError("Task IDs must be unique")
        visited, active = set(), set()

        def visit(task):
            if task.id in active:
                raise ValueError("Task dependencies must not form a cycle")
            if task.id in visited:
                return
            active.add(task.id)
            for predecessor in task.dependencies:
                if predecessor not in tasks:
                    raise ValueError("Unknown task dependency")
                visit(tasks[predecessor])
                if task.start < tasks[predecessor].start + timedelta(days=tasks[predecessor].duration):
                    raise ValueError("A task must start after its predecessors finish")
            active.remove(task.id)
            visited.add(task.id)

        for task in self.tasks:
            visit(task)
        if tasks:
            start = min(t.start for t in self.tasks)
            end = max(t.start + timedelta(days=t.duration) for t in self.tasks)
            if (end - start).days > 3650:
                raise ValueError("Schedule span must be at most ten years")
        return self
