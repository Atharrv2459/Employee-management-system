import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER, // your email
    pass: process.env.MAIL_PASS, // app password
  },
});

export const sendAccountCreatedEmail = async (to, password) => {
  const mailOptions = {
    from: `"Admin" <${process.env.MAIL_USER}>`,
    to,
    subject: "Your account has been created",
    html: `
      <h2>Welcome!</h2>
      <p>Your account has been created by admin.</p>
      <p><b>Email:</b> ${to}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please log in and change your password immediately.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
