const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');

const sendMail = {
    config: {},
    setConfig: function(configuration){
        this.config = configuration;
    },
    send: function (subject, text, to){
        var transporter = nodemailer.createTransport(smtpTransport({
            service: 'gmail',
            host: this.config.host,
            auth: {
                user: this.config.user,
                pass: this.config.pass
            }
        }));
    
        var mailOptions = {
            from: this.config.from,
            to: to,
            subject: subject,
            text: text
        };
    
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
}

module.exports = sendMail;