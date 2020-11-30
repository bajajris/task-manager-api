const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name)=>{
    sgMail.send({
        to: email,
        from: 'rishabh.bajaj740@gmail.com',
        subject: 'Thanks for joining in',
        text: `Welcome to the app, ${name}.`
    })
}

const sendCancellationEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'rishabh.bajaj740@gmail.com',
        subject: 'Account deleting',
        text: `Hey ${name}, Let us know why you cancelled .`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}

// sgMail.send({
//     to: 'rishabh.bajaj740@gmail.com',
//     from: 'rishabh.bajaj740@gmail.com',
//     subject: 'This is my first creation',
//     text: 'First email'
// })
