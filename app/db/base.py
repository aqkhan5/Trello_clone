# This project is a backend API for a Trello-like task and project management application.
# It allows users to manage workspaces, boards, lists, cards, and team collaboration.

# ---------------------------------------------------------------------------
# Imports
# ---------------------------------------------------------------------------
from sqlalchemy.orm import DeclarativeBase

# ---------------------------------------------------------------------------
# Database Base Model
# ---------------------------------------------------------------------------
# Base class that all database models inherit from
class Base(DeclarativeBase):
    pass
