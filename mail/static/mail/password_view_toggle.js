
document.addEventListener('DOMContentLoaded', () => {
    // Toggle password view logic
  togglePasswordView();
});


// Add toggle logic to eye icons
function togglePasswordView() {
    
    const eyeIcons = document.querySelectorAll('.eye-icon');
    eyeIcons.forEach(eyeIcon => {
    eyeIcon.addEventListener('click', function() {
      
      const passwordInput = this.previousElementSibling;
      togglePasswordViewLogic(passwordInput, this);
    })
  })
}

// Toggle password view logic
function togglePasswordViewLogic(passwordInput, eyeIcon) {

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.classList.replace('bi-eye-slash', 'bi-eye');
    eyeIcon.classList.replace('text-danger', 'text-success');
  } else {
    passwordInput.type = 'password';
    eyeIcon.classList.replace('bi-eye', 'bi-eye-slash');
    eyeIcon.classList.replace('text-success', 'text-danger');
  }
}