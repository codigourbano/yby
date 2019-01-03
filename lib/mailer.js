const path = require('path');
const mongoose = require('mongoose');
const moment = require('moment');
const jade = require('jade');
const nodemailer = require('nodemailer');
const postmark = require('postmark');
const Token = mongoose.model('Token');

const tplPath = path.join(__dirname, '..', 'app', 'views', 'mailer');

function Mailer (options) {
  var self = this;

  self.options = options.mailer || {};

  // get API server url to use in e-mails
  self.options.serverUrl = options.general.serverUrl;

  switch (self.options.provider) {
    case 'smtp':
      self.transport = nodemailer.createTransport('SMTP', {
        host: self.options.smtp.host || '', // hostname
        secureConnection: self.options.smtp.secureConnection || false, // use SSL
        port: self.options.smtp.port || 25, // port for secure SMTP
        auth: {
          user: self.options.smtp.user,
          pass: self.options.smtp.pass
        }
      });
      break;
    case 'postmark':
      self.transport = postmark(self.options.postmark.apikey);
      break;
  }
}

Mailer.prototype.sendEmail = function (type, to, data, i18n, callback) {
  var self = this;

  self.createMessage(type, to, data, i18n, function (err, body) {
    if (err) return callback(err);

    switch (self.options.provider) {
      case 'smtp':
        var message = {
          from: self.options.from,
          to: to,
          subject: i18n.t('views.mailer.subjects.' + type),
          html: body
        };
        self.transport.sendMail(message, callback);
        break;
      case 'postmark':
        self.transport.send(
          {
            From: self.options.from,
            To: to,
            Subject: i18n.t('views.mailer.subjects.' + type),
            HtmlBody: body
          },
          callback
        );
        break;
      default:
        callback(new Error('Email transport not defined.'));
    }
  });
};

Mailer.prototype.createMessage = function (type, to, data, i18n, callback) {
  var self = this;

  switch (type) {
    case 'confirm_email':
      self.createToken(type, data, function (err, token) {
        if (err) callback(err);
        else {
          jade.renderFile(
            tplPath + '/email/confirm.jade',
            {
              t: i18n.t,
              user: data.user,
              token: token,
              serverUrl: self.options.serverUrl,
              appUrl: data.appUrl
            },
            callback
          );
        }
      });
      break;
    case 'password_reset':
      self.createToken(type, data, function (err, token) {
        if (err) callback(err);
        else {
          jade.renderFile(
            tplPath + '/password/recover.jade',
            {
              i18n: i18n,
              user: data.user,
              serverUrl: self.options.serverUrl,
              token: token
            },
            callback
          );
        }
      });
      break;
    case 'email_change':
      self.createToken(type, data, function (err, token) {
        if (err) callback(err);
        else {
          jade.renderFile(
            tplPath + '/email/change.jade',
            {
              serverUrl: self.options.serverUrl,
              t: i18n.t,
              user: data.user,
              token: token
            },
            callback
          );
        }
      });
      break;
    case 'inform_contributor_permission':
      jade.renderFile(
        tplPath + '/contributions/inform_contributor_permission.jade',
        {
          t: i18n.t,
          layer: data.layer,
          creator: data.creator,
          contributor: data.contributor
        },
        callback
      );
      break;
    case 'invite_contributor':
      self.createToken(type, data, function (err, token) {
        if (err) return callback(err);

        jade.renderFile(
          tplPath + '/user/invite.jade',
          {
            serverUrl: self.options.serverUrl,
            user: data.user,
            i18n: i18n,
            token: token
          },
          callback
        );
      });
      break;
    default:
      callback(new Error('Mail template not found'));
  }
};

Mailer.prototype.createToken = function (type, data, callback) {
  let token;
  switch (type) {
    case 'confirm_email':
      token = new Token({
        _id: Token.generateId(),
        type: type,
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      token.save(callback);
      break;
    case 'password_reset':
      token = new Token({
        _id: Token.generateId(),
        type: 'password_reset',
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      token.save(callback);
      break;
    case 'password_definition':
      token = new Token({
        _id: Token.generateId(),
        type: 'password_needed',
        user: data.user,
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      token.save(callback);
      break;
    case 'email_change':
      token = new Token({
        _id: Token.generateId(),
        type: 'email_change',
        user: data.user,
        expiresAt: moment()
          .add('day', 1)
          .toDate(),
        callbackUrl: data.callbackUrl,
        data: { email: data.newEmail }
      });
      token.save(callback);
      break;
    case 'invite_contributor':
      token = new Token({
        _id: Token.generateId(),
        type: 'acceptInvitation',
        data: { user: data.user },
        callbackUrl: data.callbackUrl,
        expiresAt: moment()
          .add('day', 1)
          .toDate()
      });
      token.save(callback);
      break;
    default:
      callback(new Error('invalid token type'));
  }
};

/**
 * Expose
 */

module.exports = Mailer;
