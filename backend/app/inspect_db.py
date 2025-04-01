from sqlalchemy import inspect
from app.database import engine

# Crear un inspector para analizar la base de datos
inspector = inspect(engine)

# Obtener nombres de todas las tablas
print("Tablas en la base de datos:")
print(inspector.get_table_names())

# Obtener detalles de cada tabla
for table_name in inspector.get_table_names():
    print(f"\nEstructura de la tabla '{table_name}':")
    for column in inspector.get_columns(table_name):
        print(f"  - {column['name']} ({column['type']})")
