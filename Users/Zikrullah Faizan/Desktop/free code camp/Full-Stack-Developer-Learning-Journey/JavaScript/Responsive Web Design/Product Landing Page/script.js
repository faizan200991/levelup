// Simple form validation and CTA interaction

document.getElementById('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    if (validateEmail(email)) {
        alert('Thank you for signing up!');
        document.getElementById('form').reset();
    } else {
        alert('Please enter a valid email address.');
    }
});

function validateEmail(email) {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
}
