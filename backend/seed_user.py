from app.db.database import SessionLocal
from app.models.unit import Unit
from app.models.user import User
from app.core.security import get_password_hash

cpf = '16445111858'
password = 'Fergi@123'
name = 'Admin Test'
unit_id = 1

with SessionLocal() as db:
    unit = db.query(Unit).filter(Unit.id == unit_id).first()
    if not unit:
        unit = Unit(id=unit_id, name='Unidade Principal')
        db.add(unit)
        db.commit()
        db.refresh(unit)
        print('unit created', unit.id)

    user = db.query(User).filter(User.cpf == cpf).first()
    pw_hash = get_password_hash(password)

    if user:
        user.password_hash = pw_hash
        user.name = name
        user.unit_id = unit.id
        user.is_admin = True
        user.is_active = True
        db.commit()
        print('user updated', user.cpf)
    else:
        user = User(cpf=cpf, name=name, unit_id=unit.id, password_hash=pw_hash, is_admin=True, is_active=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        print('user created', user.cpf)
