// Sample data for the book inventory
const books = [
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", genre: "Classic", year: 1925 },
    { title: "To Kill a Mockingbird", author: "Harper Lee", genre: "Classic", year: 1960 },
    { title: "1984", author: "George Orwell", genre: "Dystopian", year: 1949 },
    { title: "The Pragmatic Programmer", author: "Andrew Hunt", genre: "Programming", year: 1999 },
    { title: "Clean Code", author: "Robert C. Martin", genre: "Programming", year: 2008 }
];

function renderBooks() {
    const tbody = document.querySelector('#book-table tbody');
    tbody.innerHTML = '';
    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.genre}</td>
            <td>${book.year}</td>
        `;
        tbody.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', renderBooks);
