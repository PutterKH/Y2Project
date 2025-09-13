import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";

export default function Page2() {
  // State for books data, loading, and error handling
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch books data when component mounts
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/books');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setBooks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books from API');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Show loading spinner
  if (loading) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading books...</Typography>
      </Container>
    );
  }

  // Show error message
  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>
        Library — Books from API
      </Typography>

      <Paper elevation={1}>
        <Table aria-label="books-table">
          <TableHead>
            <TableRow>
              <TableCell>Book ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>ISBN</TableCell>
              <TableCell>Published</TableCell>
              <TableCell>Available</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {books.map((book) => (
              <TableRow key={book.book_id} hover>
                <TableCell>{book.book_id}</TableCell>
                <TableCell>
                  <Typography variant="body1">
                    {book.title}
                  </Typography>
                </TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>
                  <Typography variant="caption">
                    {book.isbn}
                  </Typography>
                </TableCell>
                <TableCell>{book.published_year}</TableCell>
                <TableCell>
                  <Chip
                    label={book.available ? "Available" : "Checked Out"}
                    color={book.available ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {books.length === 0 && (
        <Typography sx={{ mt: 2, textAlign: 'center' }}>
          No books found in the database.
        </Typography>
      )}
    </Container>
  );
}
