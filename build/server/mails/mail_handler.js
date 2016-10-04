// Generated by CoffeeScript 1.10.0
var Client, Event, User, VCalendar, async, cozydb, fs, localization, log, logoPath, os, path;

async = require('async');

fs = require('fs');

os = require('os');

path = require('path');

log = require('printit')({
  prefix: 'MailHandler',
  date: true
});

cozydb = require('cozydb');

Client = require('request-json').JsonClient;

Event = require('../models/event');

User = require('../models/user');

VCalendar = require('cozy-ical').VCalendar;

logoPath = fs.realpathSync('./build/server/mails/assets/cozy-logo.png');

localization = require('../libs/localization_manager');

module.exports.sendInvitations = function(event, dateChanged, callback) {
  var guests, locale, needSaving;
  guests = event.toJSON().attendees;
  needSaving = false;
  locale = localization.getLocale();
  return async.parallel([
    function(cb) {
      return cozydb.api.getCozyDomain(cb);
    }, function(cb) {
      return User.getUserInfos(cb);
    }
  ], function(err, results) {
    var domain, user;
    if (err) {
      return callback(err);
    }
    domain = results[0], user = results[1];
    return async.forEach(guests, function(guest, done) {
      var calendar, calendarOptions, date, dateFormat, dateFormatKey, description, htmlTemplate, icsPath, mailOptions, place, ref, shouldSend, subject, subjectKey, templateKey, templateOptions, url, vEvent;
      shouldSend = !guest.isSharedWithCozy && (guest.status === 'INVITATION-NOT-SENT' || (guest.status === 'ACCEPTED' && dateChanged));
      if (!shouldSend) {
        return done();
      }
      if (dateChanged) {
        htmlTemplate = localization.getEmailTemplate('mail_update');
        subjectKey = 'email update title';
        templateKey = 'email update content';
      } else {
        htmlTemplate = localization.getEmailTemplate('mail_invitation');
        subjectKey = 'email invitation title';
        templateKey = 'email invitation content';
      }
      subject = localization.t(subjectKey, {
        description: event.description
      });
      url = domain + "public/calendar/events/" + event.id;
      dateFormatKey = event.isAllDayEvent() ? 'email date format allday' : 'email date format';
      dateFormat = localization.t(dateFormatKey);
      date = event.formatStart(dateFormat);
      ref = event.toJSON(), description = ref.description, place = ref.place;
      place = (place != null ? place.length : void 0) > 0 ? place : "";
      templateOptions = {
        displayName: user.name,
        displayEmail: user.email,
        description: description,
        place: place,
        key: guest.key,
        date: date,
        url: url
      };
      mailOptions = {
        to: guest.email,
        subject: subject,
        html: htmlTemplate(templateOptions),
        content: localization.t(templateKey, templateOptions),
        attachments: [
          {
            path: logoPath,
            filename: 'cozy-logo.png',
            cid: 'cozy-logo'
          }
        ]
      };
      calendarOptions = {
        organization: 'Cozy Cloud',
        title: 'Cozy Calendar',
        method: 'REQUEST'
      };
      calendar = new VCalendar(calendarOptions);
      vEvent = event.toIcal();
      vEvent.model.organizer = {
        displayName: user.name,
        email: user.email
      };
      vEvent.build();
      calendar.add(vEvent);
      icsPath = path.join(os.tmpdir(), 'invite.ics');
      return fs.writeFile(icsPath, calendar.toString(), function(err) {
        var ref1;
        if (err) {
          log.error("An error occured while creating invitation file " + icsPath);
          log.error(err);
        } else {
          'email date format';
        }
        dateFormat = localization.t(dateFormatKey);
        date = event.formatStart(dateFormat, locale);
        ref1 = event.toJSON(), description = ref1.description, place = ref1.place;
        place = (place != null ? place.length : void 0) > 0 ? place : "";
        templateOptions = {
          displayName: user.name,
          displayEmail: user.email,
          description: description,
          place: place,
          key: guest.key,
          date: date,
          url: url
        };
        mailOptions = {
          to: guest.email,
          subject: subject,
          html: htmlTemplate(templateOptions),
          content: localization.t(templateKey, templateOptions),
          attachments: [
            {
              path: logoPath,
              filename: 'cozy-logo.png',
              cid: 'cozy-logo'
            }
          ]
        };
        calendarOptions = {
          organization: 'Cozy Cloud',
          title: 'Cozy Calendar',
          method: 'REQUEST'
        };
        calendar = new VCalendar(calendarOptions);
        vEvent = event.toIcal();
        vEvent.model.organizer = {
          displayName: user.name,
          email: user.email
        };
        vEvent.build();
        calendar.add(vEvent);
        icsPath = path.join(os.tmpdir(), 'invite.ics');
        return fs.writeFile(icsPath, calendar.toString(), function(err) {
          if (err) {
            log.error("An error occured while creating invitation file\n" + icsPath);
            return log.error(err);
          } else {
            return cozydb.api.sendMailFromUser(mailOptions, function(err) {
              if (err) {
                log.error("An error occured while sending invitation");
                log.error(err);
              } else {
                needSaving = true;
                guest.status = 'NEEDS-ACTION';
              }
              return fs.unlink(icsPath, function(errUnlink) {
                if (errUnlink) {
                  log.error("Error deleting ics file " + icsPath);
                }
                return done(err);
              });
            });
          }
        });
      });
    }, function(err) {
      if (err != null) {
        return callback(err);
      } else if (!needSaving) {
        return callback();
      } else {
        return event.updateAttributes({
          attendees: guests
        }, callback);
      }
    });
  });
};

module.exports.sendDeleteNotification = function(event, callback) {
  var guests, guestsToInform, locale;
  guests = event.toJSON().attendees;
  guestsToInform = guests.filter(function(guest) {
    var ref;
    return (ref = guest.status) === 'ACCEPTED' || ref === 'NEEDS-ACTION';
  });
  locale = localization.getLocale();
  return User.getUserInfos(function(err, user) {
    if (err) {
      return callback(err);
    }
    return async.eachSeries(guestsToInform, function(guest, done) {
      var date, dateFormat, dateFormatKey, description, htmlTemplate, mailOptions, place, ref, subject, subjectKey, templateOptions;
      if (event.isAllDayEvent()) {
        dateFormatKey = 'email date format allday';
      } else {
        dateFormatKey = 'email date format';
      }
      dateFormat = localization.t(dateFormatKey);
      date = event.formatStart(dateFormat, locale);
      ref = event.toJSON(), description = ref.description, place = ref.place;
      place = (place != null ? place.length : void 0) > 0 ? place : false;
      templateOptions = {
        displayName: user.name,
        displayEmail: user.email,
        description: description,
        place: place,
        date: date
      };
      htmlTemplate = localization.getEmailTemplate('mail_delete');
      subjectKey = 'email delete title';
      subject = localization.t(subjectKey, {
        description: event.description
      });
      mailOptions = {
        to: guest.email,
        subject: subject,
        content: localization.t('email delete content', templateOptions),
        html: htmlTemplate(templateOptions),
        attachments: [
          {
            path: logoPath,
            filename: 'cozy-logo.png',
            cid: 'cozy-logo'
          }
        ]
      };
      return cozydb.api.sendMailFromUser(mailOptions, function(err) {
        if (err != null) {
          log.error("An error occured while sending email");
          log.error(err);
        }
        return done(err);
      });
    }, callback);
  });
};
