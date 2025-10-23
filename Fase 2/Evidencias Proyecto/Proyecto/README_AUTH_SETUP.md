Backend auth + PostgreSQL setup
================================

1) Create .env in Proyecto/ with:

DEBUG=true
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/servihogar

2) Ensure PostgreSQL is running and database exists:
- Create DB: servihogar (or change DATABASE_URL accordingly)

3) Create virtualenv and install deps:
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt

4) Run migrations:
python manage.py migrate

5) Start backend server:
python manage.py runserver 0.0.0.0:8000

6) Frontend env (Proyecto/frontend/.env):
VITE_API_URL=http://127.0.0.1:8000

7) Start frontend:
npm install
npm run dev

Auth Endpoints
--------------
- POST /api/auth/register/ -> { user, access, refresh }
- POST /api/auth/login/ -> { access, refresh } (username=email, password)
- GET  /api/auth/me/ -> current user with profile

Notes
-----
- Profile is auto-created and includes extra fields (rut, gender, phone, address, role, etc.).
- Passwords are hashed using Django.