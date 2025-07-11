const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body || '{}');
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email.' }),
      };
    }

    // Configure your SMTP - here using Gmail as an example
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: 'no-reply@porkchop.app',
      to: 'chef@porkchop.app',
      subject: 'PorkChop Subscription Cancellation Request',
      text: `User with email ${email} has requested to cancel their subscription. Please process within 24 hours.`,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Notification sent.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email.' }),
    };
  }
};
