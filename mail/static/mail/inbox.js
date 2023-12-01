document.addEventListener('DOMContentLoaded', function() {

  ['inbox', 'sent', 'archived'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => load_mailbox(id))
  })
  
  document.getElementById('compose').addEventListener('click', compose_email)
 
  // By default, load the inbox
  load_mailbox('inbox');
});

// Display compose mail form
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Listen to submit compose event
  document.querySelector('#submit-compose').addEventListener('click', (event) => post_compose(event));
}


function post_compose(event) {

  // Prevent refresh default behaviour
  event.preventDefault();

  // Get all the input values of a compose 
  const recipients = document.getElementById('compose-recipients').value;
  const subject = document.getElementById('compose-subject').value;
  const body = document.getElementById('compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {

    if (result.error) {

      // Create a alert message element
      create_alert_message('alert-danger', 'compose-view', result.error)
      
    } else {

      load_mailbox('sent');

      // Create a alert message element
      create_alert_message('alert-success', 'emails-view', result.message)

    }
  })
  
}


function create_alert_message(alertType, parentElement, message) {
  // Create a alert message element
  const alertMessage = document.createElement('div');
  alertMessage.classList.add('alert', alertType, 'rounded-0', 'shrink');
  alertMessage.setAttribute('role', 'alert');

  // Fill it the error message
  alertMessage.innerHTML = message;

  // Remove it when animation done
  alertMessage.addEventListener('animationend', function(){
    this.remove();
  })

  // Place it at the top of the div
  document.getElementById(parentElement).prepend(alertMessage)
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  
}