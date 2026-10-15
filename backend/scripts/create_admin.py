from getpass import getpass

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole


def main() -> None:
    print("=== Hostel Maintenance Intelligence - Admin Bootstrap ===")

    name = input("Admin name: ").strip()
    email = input("Admin email: ").strip().lower()
    phone = input("Admin phone (optional): ").strip() or None
    password = getpass("Admin password: ")
    confirm_password = getpass("Confirm admin password: ")

    if len(name) < 2:
        raise SystemExit("Admin name must contain at least 2 characters.")

    if password != confirm_password:
        raise SystemExit("Passwords do not match.")

    if len(password) < 8:
        raise SystemExit("Admin password must contain at least 8 characters.")

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == email))

        if existing:
            if existing.role == UserRole.ADMIN:
                raise SystemExit("An ADMIN account already exists with this email.")
            raise SystemExit("This email already belongs to another user account.")

        admin = User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print(f"Admin created successfully. User ID: {admin.id}")
        print(f"Login email: {admin.email}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
