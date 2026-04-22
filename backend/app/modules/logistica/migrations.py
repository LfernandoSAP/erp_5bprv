from app.db.fleet_migrations import ensure_fleet_schema_compatibility
from app.db.item_migrations import ensure_item_schema_compatibility
from app.db.material_belico_migrations import ensure_material_belico_schema_compatibility
from app.db.movement_migrations import ensure_movement_schema_compatibility

__all__ = [
    "ensure_fleet_schema_compatibility",
    "ensure_item_schema_compatibility",
    "ensure_material_belico_schema_compatibility",
    "ensure_movement_schema_compatibility",
]
