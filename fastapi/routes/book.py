# Book API router for FastAPI
from typing import List, Optional  # List is needed for response_model
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import database

router = APIRouter(tags=["books"])

class Book(BaseModel):
  book_id: int
  title: str
  author: str
  isbn: str
  published_year: int
  available: bool
  created_at: datetime

@router.get("/books/", response_model=List[Book])
async def list_books():
  # Query all books from the database
  query = """
    SELECT
      book_id,
      title,
      author,
      isbn,
      published_year,
      available,
      created_at
    FROM books
    ORDER BY book_id
  """
  return await database.fetch_all(query)

# Note: In production, add error handling for database failures.
# Add this new model after the existing Book model
class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    published_year: int

class BookResponse(BaseModel):
    message: str
    book_id: int
    title: str
    author: str

# Add this new endpoint after the existing list_books endpoint
@router.post("/books/", response_model=BookResponse)
async def create_book(book: BookCreate):
    try:
        # Insert new book into database
        query = """
            INSERT INTO books
            (title, author, isbn, published_year, available, created_at)
            VALUES (:title, :author, :isbn, :published_year, TRUE, NOW())
            RETURNING book_id
        """

        values = {
            "title": book.title,
            "author": book.author,
            "isbn": book.isbn,
            "published_year": book.published_year
        }

        result = await database.fetch_one(query, values)
        book_id = result["book_id"]

        return BookResponse(
            message="Book created successfully",
            book_id=book_id,
            title=book.title,
            author=book.author
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create book: {str(e)}")
