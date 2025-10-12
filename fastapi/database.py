from databases import Database

POSTGRES_USER = "temp"
POSTGRES_PASSWORD = "temp"
POSTGRES_DB = "advcompro"
POSTGRES_HOST = "db"

DATABASE_URL = f'postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}/{POSTGRES_DB}'

database = Database(DATABASE_URL)

async def connect_db():
    await database.connect()
    print("Database connected")

async def disconnect_db():
    await database.disconnect()
    print("Database disconnected")

# Insert user (store hash, do not return password)
async def insert_user(username: str, password: str, email: str):
    query = """
    INSERT INTO users (username, password, email)
    VALUES (:username, :password, :email)
    RETURNING user_id, username, email, created_at
    """
    values = {"username": username, "password": password, "email": email}
    return await database.fetch_one(query=query, values=values)

# Get user (exclude password from result)
async def get_user(user_id: int):
    query = """
    SELECT user_id, username, email, created_at
    FROM users
    WHERE user_id = :user_id
    """
    return await database.fetch_one(query=query, values={"user_id": user_id})

# Update user (rehash done in user.py, exclude password from return)
async def update_user(user_id: int, username: str, password: str, email: str):
    query = """
    UPDATE users 
    SET username = COALESCE(:username, username),
        password = COALESCE(:password, password),
        email = COALESCE(:email, email)
    WHERE user_id = :user_id
    RETURNING user_id, username, email, created_at
    """
    values = {
        "user_id": user_id,
        "username": username,
        "password": password,
        "email": email
    }
    return await database.fetch_one(query=query, values=values)

# Delete user (only return id to confirm deletion)
async def delete_user(user_id: int):
    query = """
    DELETE FROM users 
    WHERE user_id = :user_id
    RETURNING user_id
    """
    return await database.fetch_one(query=query, values={"user_id": user_id})
