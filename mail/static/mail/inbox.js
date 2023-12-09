document.addEventListener('DOMContentLoaded', function() {

  ['inbox', 'sent', 'archived'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => load_mailbox(id))
  });
  
  document.getElementById('compose').addEventListener('click', () => compose_email());
 
  // By default, load the inbox
  load_mailbox('inbox');

});

// Toggle email icon, apply active tag css, load the mailbox
function load_mailbox(mailbox) {

  const emailIcon = $('<i>');

  // Toggle the email icon when in different mailbox
  if (mailbox != 'inbox') 
    emailIcon.addClass('bi bi-envelope-fill nav-icon');
  else 
    emailIcon.addClass('bi bi-envelope-open nav-icon');

   // Jquery way to replace inbox first's child with another icon
  $('#inbox').children().eq(0).replaceWith(emailIcon);
  
  // Set the navbar active class, and remove other inactive ones
  $(`#${mailbox}`).addClass('active');
  $(`#${mailbox}`).siblings().removeClass('active');


  // Set emails view title and set the mailbox data attribute
  const emailsView = $('#emails-view')
    .html(`<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`)
    .data('mailbox', mailbox)
    .css('display', 'block')
    .siblings().css('display', 'none');
    

  // Get mails from backend and display them
  getMailsFromBackendAndDisplayThem(mailbox);

}

function getMailsFromBackendAndDisplayThem(mailbox) {
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(result => {
    if (result.error) {

      createAlertMessage('alert-danger', $('#emails-view'), result.error)
    } else {
      displayMails(result);
    }
   
  }) 
  .catch(error => {
    createAlertMessage('alert-danger', $('#emails-view'), error)
  })
}

function displayMails(mails) {

  // If no mails in this mailbox, display a empty message
  if (!mails.length) {
    const mailxEmptyMessage = document.createElement('div');
    mailxEmptyMessage.classList.add('text-center', 'text-muted');
    mailxEmptyMessage.innerHTML = 'No mails in this mailbox';
    document.querySelector('#emails-view').append(mailxEmptyMessage);
    return
  }
  
  // Create mail container for each mail
  const emailsView = $('#emails-view')
  mails.forEach(mail => {

    mailContainer = createMailContainer(mail)

    // Add mail clicking event listener to them
    mailContainer.on('click', openMail);

    emailsView.append(mailContainer);

  })
}

// Create main container and fill in the values and styles
function createMailContainer(mail) {

  // Create mail container as table row
  const mailContainer = $('<div>')
    .addClass('mail-container')
    .attr('data-mailid', mail.id);

  // Set the background color and font weight if the mail is read
  if (mail.read) 
    mailContainer.css('background', '#f2f6fc');
  else 
    mailContainer.css('font-weight', 'bold');

  // Set responsive grid system for mail info
  const row = $('<div>').addClass('row px-3 py-3 align-items-center');
 
  const senderTag = $('<span>').addClass('col-3');
  const subjectTag = $('<span>').addClass('col-6');
  const timestampTag = $('<span>').addClass('col-3 small-text text-end')
  
  row.append(senderTag, subjectTag, timestampTag);

  // fill in the value 
  senderTag.html(mail.sender);
  subjectTag.html(mail.subject);
  timestampTag.html(mail.timestamp);

  mailContainer.append(row);

  return mailContainer
}

function createAlertMessage(alertType, parentElement, message) {
  // Create a alert message element
  const alertMessage = $('<div>')
    .addClass(`alert ${alertType} rounded-0 shrink`)
    .attr('role', 'alert')
    .text(message)
    .on('click', function() {
      this.remove();
    });

  // Place it at the top of the view div
  parentElement.prepend(alertMessage);
}


// Display compose mail form
function compose_email(recipient="", subject="", body="") {

  // Show compose view and hide other views
  $('#emails-view').css('display', 'none');
  $('#open-mail-view').css('display', 'none');
  $('#compose-view').css('display', 'block');

  // Clear out composition fields
  $('#compose-recipients').val(recipient);
  $('#compose-subject').val(subject);
  $('#compose-body').val(body);

  // Listen to submit compose event
  $('#submit-compose').on('click', (event) => post_compose(event));
}

function post_compose(event) {

  // Prevent refresh default behaviour
  event.preventDefault();

  // Get all the input values of a compose 
  const recipients = $('#compose-recipients').val();
  const subject = $('#compose-subject').val();
  const body = $('#compose-body').val();

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
      createAlertMessage('alert-danger', $('#compose-view'), result.error);
      
    } else {

      load_mailbox('sent');

      // Create a success message element
      createAlertMessage('alert-success', $('#emails-view'), result.message)

    }
  })
  
}



// Fetch the mail clicked from the backend
function openMail() {
  
  const emailId = this.dataset.mailid;
  fetch(`/emails/${emailId}`)
  .then(response => response.json())
  .then(result => {
    if (result.error) {

      // Dsiplay error message at current mailbox
      const mainContainer = $(this).parents().eq(2);
      createAlertMessage('alert-danger', mainContainer, result.error);

    } else {

       // Hide the other views and show open mail view 
      $('#emails-view').css('display', 'none');
      $('#compose-view').css('display', 'none');
      $('#open-mail-view').css('display', 'block');
      
      displayMail(result);

      // After archive toggle attached to document can it then activate the tooltip 
      $(`#archive-toggle`).tooltip();

      if(!result.read)
        updateReadStatus(result);
    }
  })
  
}

// Display the clicked mail
function displayMail(mail) {

  const clickedMailContainer = $('<div>')
    .addClass('p-3 border border-dark')
    .attr('data-mailid', mail.id);


  const mailInfo = {
    'sender': 'From: ',
    'recipients': 'To: ',
    'subject': 'Subject: ',
    'timestamp': 'Timestamp: '
  }

  // Attach each row of info: From, To, Subject, Timestamp to mail container
  Object.entries(mailInfo).forEach(([key, title]) => {

      $('<div>')
        .append($('<strong>').text(title)) // Bold title
        .append($('<span>').text((key === 'recipients') ? mail[key].join(', ') : mail[key])) // Info tag
        .appendTo(clickedMailContainer);
  })
  
  
  clickedMailContainer.append(
    ActionBox(mail),     // Attach actions box: Reply, Arhive buttons
    $('<hr>'),           // Attach divide line 
  );

  // Reformat the body text
  const passages = mail.body.split('\n');
  passages.forEach( passage => {

    // Create a title element for passage it starts with "On" and end with "wrote:"
    if (passage.startsWith('On') && passage.endsWith('wrote: ')) {

      // Boldify the timestamp info 
      $('<h6>')
        .text(passage)
        .appendTo(clickedMailContainer);

        // if the passage is empty, make it a break line
    } else if (passage === '') {

      $('<br>').appendTo(clickedMailContainer);
      
    } else {

      // Create a paragraph element for passage
      $('<p>')
        .addClass('mb-0')
        .text(passage)
        .appendTo(clickedMailContainer);
    }
})
  // Clear the open mail view and append the opened mail container
  $('#open-mail-view')
    .html("") 
    .append(clickedMailContainer);
}

// Create action buttons container: Reply and Archive buttons
function ActionBox(mail) {
  
  // Create action buttons container for Reply and Archive buttons 
  const actionBox = $('<div>').addClass('d-flex');

  // Create archive button
  const archiveBtn = ArchiveBtn(mail.id, mail.archived);
  
 
  // Reply button 
  // If current mailbox is sent, do not show reply button
  if ($('#emails-view').data('mailbox') === 'sent') {

    actionBox
      .append(archiveBtn)
      .addClass('justify-content-end');
    return actionBox
  
  }

  const replyBtn = document.createElement('button');
  replyBtn.innerHTML = 'Reply';
  replyBtn.className = 'btn btn-outline-primary';
  replyBtn.addEventListener('click', () => replyToMail(mail));

  // Attach action buttons: Reply and archive 
  actionBox.append(replyBtn, archiveBtn);
  actionBox.addClass('justify-content-between align-items-center');

  return actionBox
}

// Create archive button
function ArchiveBtn(mailId, isArchived) {

  // Create archive button
  const archiveBtn = document.createElement('div');
  archiveBtn.id = 'archive-toggle';

  let archiveAttrs = {'data-toggle': 'tooltip', 'data-mailid': mailId};
  
  let archiveIcon;

  if (isArchived) {

    archiveIcon = ArchiveIcon('bi bi-archive-fill archive-icon');

    archiveAttrs['title'] = 'Unarchive';
    archiveAttrs['data-archived'] = 'true';
  }
  else {

    archiveIcon = ArchiveIcon('bi bi-archive archive-icon');

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


// Update the clicked mail to read status if it is not read
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

// Reply button logic
function replyToMail(mail) {

  // Fill in the compose form with mail info
  let subject = mail.subject; 
  if(mail.subject.startsWith('Re: ')) 
    subject = mail.subject;
  else
    subject = `Re: ${mail.subject}`;

  const breakLine = "\n\n----------------------------------------------------------------------------------\n";
  let body = `On ${mail.timestamp} ${mail.sender} wrote: \n\n${mail.body}`;

  compose_email(mail.sender, subject,  breakLine + body);
  const composeView = document.getElementById('compose-body');

  composeView.scrollIntoView({behavior: 'smooth', block: 'start'});
  composeView.focus();
  // move the cursor to the start of the text
  composeView.setSelectionRange(0, 0);


}

// Update the opened mail to archived status, if archived button is clicked
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

      // After update the archived status, load the inbox again
      load_mailbox('inbox');
    }
  })
}













