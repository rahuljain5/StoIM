const env = process.env.NODE_ENV || "development";
const config = require("../config/config")[env];
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    host: config.mailer_host,
    port: config.mailer_port,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.mailer_username, // generated ethereal user
        pass: config.mailer_password // generated ethereal password
    }
});

const sendmail = (to, subject, message) => {
    let mailOptions = {
        from: "noreply@stoim", // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: message // html body
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error:" + error)
            return 1;
        }
        console.log("Message sent: %s", info.messageId);
    });
}
exports.sendmail = sendmail;
