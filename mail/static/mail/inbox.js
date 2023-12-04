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
      // After archive totggle attached to document can it then activate the tooltip 
      $(`#archive-toggle`).tooltip();

      if (!result.read)
        updateReadStatus(result);
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

  // Attach each row of info: From, To, Subject, Timestamp to mail container
  Object.entries(mailInfo).forEach(([key, title]) => {

      const infoRow = document.createElement('div');
      const boldTitle = document.createElement('strong');
      const infoTag = document.createElement('span');

      boldTitle.innerHTML = title;
      infoTag.innerHTML = (key === 'recipients') ? mail[key].join(', ') : mail[key];
      
      infoRow.append(boldTitle, infoTag);
      mailContainer.append(infoRow);
  })
  
  mailContainer.append(
    ActionBox(mail.id, mail.archived),     // Attach actions box: Reply, Arhive buttons
    document.createElement('hr'), // Attach break line 
    mail.body                     // Attach content body 
  );

  // Attch to open mail view 
  const openMailView = document.getElementById('open-mail-view');
  openMailView.replaceChild(mailContainer, openMailView.firstChild);
  
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

function updateArchivedStatus(mailId, isArchived) {
  
  fetch(`/emails/${mailId}`, {
    method: 'PUT', 
    body: JSON.stringify({
      'archived': isArchived
    })
  })
  .then(response => {
    if (!response.ok) {
      createAlertMessage('alert-danger', $('#open-mail-view'), response.json().error);
    } else {
      console.log(`Archive state successfully updated for mail id: ${mailId} to ${isArchived ? "Archived" : "Not Archived"}`);
    }
  })
}

function ActionBox(mailId, isArchived) {
  
  // Create action buttons container for Reply and Archive buttons 
  const actionBox = document.createElement('div');
  actionBox.classList.add('d-flex', 'justify-content-between', 'align-items-center')

  // Create archive button
  const archiveBtn = ArchiveBtn(mailId, isArchived);
 
  // Reply button 
  const replyBtn = document.createElement('button');
  replyBtn.innerHTML = 'Reply';
  replyBtn.className = 'btn btn-outline-primary';


  // Attach action buttons: Reply and archive 
  actionBox.append(replyBtn, archiveBtn);


  return actionBox
}


function ArchiveBtn(mailId, isArchived) {

  const archiveBtn = document.createElement('div');
  archiveBtn.id = 'archive-toggle';

  let archiveAttrs = {'data-toggle': 'tooltip', 'data-mailid': mailId};
  
  let archiveIcon;

  if (isArchived) {

    archiveIcon = ArchiveIcon('bi bi-archive-fill');

    archiveAttrs['title'] = 'Unarchive';
    archiveAttrs['data-archived'] = 'true';
  }
  else {

    archiveIcon = ArchiveIcon('bi bi-archive');

    archiveAttrs['title'] = 'Archive';
  }

  Object.entries(archiveAttrs).forEach(([attr, value]) => {
    archiveBtn.setAttribute(attr, value);
  })
  

  // Attach to archive button
  archiveBtn.append(archiveIcon);

  // Set click event toggle logic between archive and unarhive
  archiveBtn.addEventListener('click', function() {

    let archiveIcon;
    if (this.dataset.archived === 'true') {
      
      // Reset to not archived
      archiveIcon = ArchiveIcon('bi bi-archive');
      this.setAttribute('data-original-title', 'Archive');
      this.dataset.archived = 'false';
      isArchived = false;

    } else {
      
      archiveIcon = ArchiveIcon('bi bi-archive-fill');
      this.setAttribute('data-original-title', 'Unarchive');
      this.dataset.archived = 'true';
      isArchived = true;
    }
    
    // Reset tooltip
    $(`#${this.id}`).tooltip('hide').tooltip('show');

    // Switch dislaying icon
    this.replaceChild(archiveIcon, this.firstChild);

    // update archive status
    updateArchivedStatus(mailId, isArchived);

    
  } );

  return archiveBtn

}

function ArchiveIcon(className) {

  const archiveIcon = document.createElement('i');
  archiveIcon.className = className;

  return archiveIcon

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

