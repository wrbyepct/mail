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
      createAlertMessage('alert-danger', 'compose-view', result.error)
      
    } else {

      load_mailbox('sent');

      // Create a alert message element
      createAlertMessage('alert-success', 'emails-view', result.message)

    }
  })
  
}


function createAlertMessage(alertType, parentElement, message) {
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

  // Place it at the top of the view div
  document.getElementById(parentElement).prepend(alertMessage)
}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Create table for mails 
  const mailsTable = document.createElement('table')
  mailsTable.classList.add('table', 'table-hover')

  const mailsTbody = document.createElement('tbody')
  mailsTable.append(mailsTbody)

  const emailsView = document.getElementById('emails-view');

  // Show the mailbox name
  emailsView.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Add mailsTable to emails view
  emailsView.append(mailsTable);

  getMailsFromBackendAndDisplayThem(mailbox);
  
}

function getMailsFromBackendAndDisplayThem(mailbox) {
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(mails => {
    displayMails(mails);
  }) 
  .catch(error => console.error(error))
}

function displayMails(mails) {

  // const emailsView = document.getElementById('emails-view')
  const mailsTbody = document.querySelector('tbody');
  mails.forEach(mail => {

    mailContainer = createMailContainer(mail)

    mailsTbody.append(mailContainer);

  })
}

// Create main container and fill in the values and styles
function createMailContainer(mail) {

  // Create mail container as table row
  const mailContainer = document.createElement('tr');

  // Left info in mailbox
  const leftInfo = document.createElement('div');
  const senderTag = document.createElement('strong');
  const subjectTag = document.createElement('span');
  subjectTag.classList.add('pl-3');
  leftInfo.append(senderTag, subjectTag);
  
  // timestamp right info
  const timestampTag = document.createElement('span');
  timestampTag.classList.add('text-muted');

  // fill in the value 
  senderTag.innerHTML = mail.sender;
  subjectTag.innerHTML = mail.subject;
  timestampTag.innerHTML = mail.timestamp;
  mailContainer.append(leftInfo, timestampTag);

  // Style for mailbox
  mailContainer.classList.add('d-flex', 'justify-content-between', 'p-2', 'border', 'border-dark');
  mailContainer.setAttribute('style', 'cursor: pointer;')
  if (mail.read) mailContainer.classList.add('bg-secondary');

  return mailContainer
}