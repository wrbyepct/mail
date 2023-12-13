let currentMailbox = 'inbox';

// Pop back to previous page when click back button
$(window).on('popstate', function(event) {

  let previousPage = event.originalEvent.state.page;
  
  if (previousPage === 'compose') {

    compose_email();

  } else if (previousPage === 'reply') {

    const mail = event.originalEvent.state.mail;
    replyToMail(mail);
    
  } else if (previousPage === 'mail') {

    const mailId = event.originalEvent.state.mailid;

    // Restore the previous mailbox where the user was in
    const mailbox = event.originalEvent.state.mailbox;
    console.log(`Restore mailbox: ${mailbox}`);
    currentMailbox = mailbox
    openMail(mailId);
  } else {
    // Other mailbox pages: Inbox, Sent, Archived
    load_mailbox(previousPage);
    
  }
});


$(document).ready(function() {
  
  // Hide menu when click outside of it
  $(document).click(function () {
    let hamburgerExpanded = $("#navbarNav").hasClass("show");
    if (hamburgerExpanded) {
      $("#navbarNav").removeClass("show");
    }
  });

  ['inbox', 'sent', 'archived'].forEach(id => {
    $(`#${id}`).on('click', () => {
      load_mailbox(id);
      history.pushState({page: id}, "", `/`);
    });
    
  });

  // Compose button
  $('.compose-btn').each(function(){
    
    $(this).on('click', function() { 
      compose_email(); 
      history.pushState({page: 'compose'}, "", '/');
    });
   
  });
 
  // By default, load the inbox
  load_mailbox('inbox');
  history.pushState({page: 'inbox'}, "", "/");

});

// Toggle email icon, apply active tag css, hide other mailbox views load the mailbox
function load_mailbox(mailbox) {
  
  const emailIcon = $('<i>');

  // Toggle the email icon when in different mailbox
  if (mailbox != 'inbox') 
    emailIcon.addClass('bi bi-envelope-fill nav-icon');
  else 
    emailIcon.addClass('bi bi-envelope-open nav-icon');

   // Jquery way to replace inbox first's child with another icon
  $('#inbox')
    .children()
    .eq(0)
    .replaceWith(emailIcon);
  
  // Set the navbar active class, and remove other inactive ones
  $(`#${mailbox}`)
    .addClass('active')
    .siblings().removeClass('active');


  // Set emails view title and set the mailbox data attribute
  $('#emails-view')
    .html(`<h3 id="${mailbox}-title">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`)
    .css('display', 'block')
    .siblings().css('display', 'none');
    

  // Get mails from backend and display them
  getMailsFromBackendAndDisplayThem(mailbox);
  currentMailbox = mailbox;

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
    $('<div>')
      .addClass('text-center text-muted')
      .text('No mails in this mailbox')
      .appendTo($('#emails-view'));
    
    return
  }

  // Count then number of unread mails
  let unreadMails = 0;
  mails.forEach(mail => {
    if (!mail.read) unreadMails++;
  })
  // Update the inbox title with the number of unread mails
  $('#inbox-title').text(`Inbox (${unreadMails})`);
  
  // Create mail container for each mail
  const mailsContainer = $('<div id="mails-container"></div>');
  $('#emails-view').append(mailsContainer);


  let delay = 0;
  mails.forEach(mail => {
    const mailContainer = createMailContainer(mail)

    // Add mail clicking event listener to them
    mailContainer.on('click', () => {

      openMail(mail.id);

      history.pushState({
        page: 'mail', 
        mailid: mail.id,
        mailbox: currentMailbox
      }, "", '/');
    });

    // Append each mail container to the mails container every 50ms
    setTimeout(() => {

      mailsContainer.append(mailContainer);
    }, delay += 50);
    
  })

  
  
  
}

// Create main container and fill in the values and styles
function createMailContainer(mail) {

  // Create mail container that display sender, subject, timestamp
  const mailContainer = $('<div class="mail-container row px-0 py-3 align-items-center move-in"></div>')
    .attr('data-mailid', mail.id)
    .append(
      $(`<span class="col-3">${mail.sender}</span>`), // Sender
      $(`<span class="col-6">${mail.subject}</span>`), // Subject
      $(`<span class="col-3 small-text text-right">${mail.timestamp}</span>`) // Timestamp
    )  

  // Set the background color and font weight if the mail is read
  if (mail.read) 
    mailContainer.addClass('read');
  else 
    mailContainer.addClass('unread');

  return mailContainer
}

function createAlertMessage(alertType, parentElement, message) {
  // Create a alert message element
  const alertMessage = $(`<div class="alert ${alertType} rounded-0 shrink" 
                              role="alert">${message}</div>`);

  alertMessage.on('click', function() {
    this.remove();
  });                       

  // Place it at the top of the view div
  parentElement.prepend(alertMessage);
}


// Display compose mail form
function compose_email(recipient="", subject="", body="") {

  // Show compose view and hide other views
  $('#compose-view')
    .css('display', 'block')
    .siblings().css('display', 'none');

  // Set the default values to empty string if it's not a reply mail
  $('#compose-recipients').val(recipient);
  $('#compose-subject').val(subject);
  $('#compose-body').val(body);

  // Listen to submit compose event
  $('#submit-compose').on('click', (event) => post_compose(event));
}

function post_compose(event) {

  // Prevent refresh default behaviour
  event.preventDefault();

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: $('#compose-recipients').val(),
      subject: $('#compose-subject').val(),
      body: $('#compose-body').val()
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
function openMail(mailId) {
  
  fetch(`/emails/${mailId}`)
  .then(response => response.json())
  .then(result => {
    if (result.error) {

      // Dsiplay error message at current mailbox
      const mainContainer = $(this).parents().eq(2);
      createAlertMessage('alert-danger', mainContainer, result.error);

    } else {

      displayMail(result);

      if(!result.read)
        updateReadStatus(result);
    }
  })
  
}

// Display the clicked mail
function displayMail(mail) {

  // Hide the other views and show open mail view 
  $('#open-mail-view')
  .css('display', 'block')
  .siblings().css('display', 'none');


  const clickedMailContainer = $(`<div class="p-3 border border-dark" 
                                      data-mailid="${mail.id}">`);

  const mailInfo = {
    'From: ': mail.sender,
    'To: ': mail.recipients.join(', '),
    'Subject: ': mail.subject,
    'Timestamp: ': mail.timestamp
  }

  // Attach each row of info: From, To, Subject, Timestamp to mail container
  Object.entries(mailInfo).forEach(([title, info]) => {

    clickedMailContainer
      .append(`<div>
                <strong>${title}</strong>
                <span>${info}</span>
              </div>`)
  })
  
  clickedMailContainer
    .append(
      ActionBox(mail),  // Attach actions box: Reply, Arhive buttons
      '<hr>',           // Attach divide line 
    );

  // Reformat the body text
  mail.body.split('\n').forEach( passage => {

    // Create a title element for passage it starts with "On" and end with "wrote:"
    if (passage.startsWith('On') && passage.endsWith('wrote: ')) 
      clickedMailContainer.append(`<h6>${passage}</h6>`);
    else if (passage === '') 
      clickedMailContainer.append('<br>')
    else 
      clickedMailContainer.append(`<p class="mb-0">${passage}</p>`);
    
})
  // Clear the open mail view and append the opened mail container
  $('#open-mail-view')
    .empty() 
    .append(clickedMailContainer);

  
}

// Create action buttons container: Reply and Archive buttons
function ActionBox(mail) {
  
  // Create action buttons container for Reply and Archive buttons 
  const actionBox = $('<div class="d-flex mt-2"></div>');

  // Reply button 
  // If current mailbox is sent, do not show reply button
  if (currentMailbox === 'sent') {
    
    actionBox
      .addClass('justify-content-end')
      .append(ArchiveBtn(mail.id, mail.archived));
    return actionBox
  
  }

  const replyBtn = $(`<button class="btn btn-outline-dark rounded-0">
                        <i class="bi bi-reply"></i>
                        Reply
                      </button>`)
                      .on('click', () => {
                        replyToMail(mail);
                        history.pushState({page: 'reply', mail: mail}, "", '/');
                      });
  
 
  // Attach action buttons: Reply and archive 
  actionBox
    .append(replyBtn, ArchiveBtn(mail.id, mail.archived))
    .addClass('justify-content-between align-items-center');

  return actionBox
}

// Create archive button
function ArchiveBtn(mailId, isArchived) {

  // Create archive button
  const archiveBtn = $(`<div id="archive-toggle"
                            data-toggle="tooltip"
                        ></div>`)
  
  setArchiveButtonState(archiveBtn, isArchived)

  archiveBtn.on('click', () => toggleArchiveIcon(isArchived, mailId))

  return archiveBtn

}

// Set click event toggle logic between archive and unarhive
function toggleArchiveIcon(isArchived, mailId) {

  const archiveBtn = $('#archive-toggle').empty();
  // Toggle icon and tooltip text
  setArchiveButtonState(archiveBtn, !isArchived)
  
  // update archive status
  updateArchivedStatus(mailId, !isArchived);

}

// Set archive icon and display tooltip
function setArchiveButtonState(archiveBtn, isArchived) {

  if (isArchived) {
    archiveBtn
      .html($('<i class="bi bi-archive-fill archive-icon"></i>'))
      .attr('data-original-title', 'Unarchive');
  }
  else {
    archiveBtn
    .html($('<i class="bi bi-archive archive-icon"></i>'))
      .attr('data-original-title', 'Archive');
  }

  // Activate tooltip
  archiveBtn.tooltip('hide').tooltip('show');
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
  
  // Scroll to body and focus on it
  const composeView = $('#compose-body')[0];
  composeView.scrollIntoView({behavior: 'smooth', block: 'start'})
  composeView.focus() 
  composeView.setSelectionRange(0, 0); // Move the cursor to the start of the text


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













