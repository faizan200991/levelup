document.getElementById('survey-form').addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Thank you for submitting the survey!');
    this.reset();
});
