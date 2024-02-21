const nodemailer = require('nodemailer');
const ejs = require('ejs');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstName;
    this.url = url;
    this.from = `Ogbonna Osita <${process.env.EMAIL_FROM}>`;
  }

  // Create Transport
  newTransport() {
    if ((process.env.NODE_ENV || '').trim() === 'production') {
      return nodemailer.createTransport({
        host: process.env.PROD_EMAIL_HOST,
        port: process.env.PROD_EMAIL_PORT,
        auth: {
          user: process.env.PROD_EMAIL_USERNAME,
          pass: process.env.PROD_EMAIL_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send Method
  async send(template, subject) {
    //Render html template
    const html = await ejs.renderFile(
      `${__dirname}/../views/emails/${template}.ejs`,
      {
        firstName: this.firstName,
        subject,
        url: this.url,
      },
    );

    //define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    //create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Thanks for signing up!');
  }

  async sendPasswordReset() {
    await this.send('passwordReset', 'Reset your password (Valid for 10 mins)');
  }

};
