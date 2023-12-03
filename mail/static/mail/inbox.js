document.addEventListener('DOMContentLoaded', function() {

  ['inbox', 'sent', 'archived'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => load_mailbox(id))
  });
  
  document.getElementById('compose').addEventListener('click', compose_email);
 
  // By default, load the inbox
  load_mailbox('inbox');
});

// Display compose mail form
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#open-mail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Listen to submit compose event
  document.querySelector('#submit-compose').addEventListener('click', (event) => post_compose(event));
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-mail-view').style.display = 'none';

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

// Fetch the mail clicked from the backend
function openMail() {
  
  const emailId = this.dataset.mailid;
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(result => {
    if (result.error) {

      // Access the main container view 
      const mainContainer = $(this).parents().eq(2);
      createAlertMessage('alert-danger', mainContainer, result.error);

    } else {

       // Hide the other views and show open mail view 
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#open-mail-view').style.display = 'block';
      
      displayMail(result);
      updateReadStatus(result);
    }
  })
  
}

function updateReadStatus(mail) {
  fetch(`/emails/${mail.id}`, {
    'method': 'PUT', 
    'body': JSON.stringify({
      read: true
    })
  })
  .then(response => {
    if (!response.ok) {
      result = response.json();
      const mainContainer = $(this).parents().eq(2);
      createAlertMessage('alert-danger', mainContainer, result.error)
    } else {
      console.log(`Update mail id: ${mail.id} to read status: true`)
    }
  }) 
  
}

function displayMail(mail) {

  const mailContainer = document.createElement('div');

  const mailInfo = {
    'sender': 'From: ',
    'recipients': 'To: ',
    'subject': 'Subject: ',
    'timestamp': 'Timestamp: '
  }

  // Attach each row of info: From, To, Subject, Timestamp
  Object.entries(mailInfo).forEach(([key, title]) => {

      const infoRow = document.createElement('div')
      const boldTitle = document.createElement('strong');
      const infoTag = document.createElement('span');

      boldTitle.innerHTML = title;

      if (key === 'recipients') {
        const recipients = mail[key].join(', ');
        infoTag.innerHTML = recipients;
      }
      else 
        infoTag.innerHTML = mail[key];

      infoRow.append(boldTitle, infoTag);
      mailContainer.append(infoRow);
  })
  
 
  const actionBox = creatActionBox(mail.archived);

  mailContainer.append(actionBox);

  // Attach break line 
  mailContainer.append(document.createElement('hr'));

  // Attach content body 
  mailContainer.append(mail.body);

  // Attch to open mail view 
  const openMailView = document.getElementById('open-mail-view');
  openMailView.replaceChild(mailContainer, openMailView.firstChild);

  
}

function creatActionBox(isArchived) {
  console.log(isArchived);
  // Attach action buttons: Reply and archive 
  const actionBox = document.createElement('div');
  actionBox.classList.add('d-flex', 'justify-content-between', 'align-items-center')

  
  const archiveBox = document.createElement('div');
  archiveBox.setAttribute('id', 'archive-toggle');

  // Create archive button
  const archiveBtn = createArchiveBtn(isArchived);

  // Attach to archive box
  archiveBox.append(archiveBtn);

  // Set click event toggle logic between archive and unarhive
  archiveBox.addEventListener('click', function(isArchived) {
    const archiveBtn = createArchiveBtn(isArchived);
    this.replaceChild(archiveBtn, this.firstChild);
    // Enable tooltip 
    $('#archive').tooltip();
  } );

  // Reply button 
  const replyBtn = document.createElement('button');
  replyBtn.innerHTML = 'Reply';
  replyBtn.classList.add('btn', 'btn-outline-primary');

  actionBox.append(replyBtn, archiveBox);

  return actionBox
}


function createArchiveBtn(isArchived) {

  const archiveBtn = document.createElement('i');

  let archiveAttrs = {'data-toggle': 'tooltip', 'id': 'archive'};

  if (isArchived) {

    archiveBtn.className = 'bi bi-archive-fill';
    archiveAttrs['title'] = 'Unarchive';

  } else {
    
    archiveBtn.className = 'bi bi-archive';
    archiveAttrs['title'] = 'Archive';
    
  }

  Object.entries(archiveAttrs).forEach(([attr, value]) => {
    archiveBtn.setAttribute(attr, value);
  })

  return archiveBtn

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
      const composeView = document.getElementById('compose-view');
      createAlertMessage('alert-danger', composeView, result.error);
      
    } else {

      load_mailbox('sent');

      // Create a alert message element
      const emailsView = document.getElementById('emails-view');
      createAlertMessage('alert-success', emailsView, result.message)

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
  parentElement.prepend(alertMessage)
}



function getMailsFromBackendAndDisplayThem(mailbox) {
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    if (result.error) {

      const emailsView = document.getElementById('emails-view');
      createAlertMessage('alert-danger', emailsView, result.error)
    } else {
      displayMails(result);
    }
   
  }) 
  .catch(error => {
    const emailsView = document.getElementById('emails-view');
    createAlertMessage('alert-danger', emailsView, error)
  })
}

function displayMails(mails) {

  // const emailsView = document.getElementById('emails-view')
  const mailsTbody = document.querySelector('tbody');
  mails.forEach(mail => {

    mailContainer = createMailContainer(mail)

    // Add mail clicking event listener to them
    mailContainer.addEventListener('click', openMail)

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

  // Attach email id 
  mailContainer.setAttribute('data-mailid', mail.id)

  // Style for mailbox
  mailContainer.classList.add('d-flex', 'justify-content-between', 'p-2', 'border', 'border-dark');
  mailContainer.setAttribute('style', 'cursor: pointer;')
  if (mail.read) mailContainer.setAttribute('style', 'background: #D3D3D3; cursor: pointer;')

  return mailContainer
}

