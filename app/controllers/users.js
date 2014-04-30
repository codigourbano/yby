
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	validator = require('validator'),
	messages = require('../../lib/messages'),
	mailer = require('../../lib/mailer'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User'),
	AccessToken = mongoose.model('AccessToken'),
	Layer = mongoose.model('Layer'),
	Map = mongoose.model('Map');


/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
	var query = { username:id };
	if(id.match(/^[0-9a-fA-F]{24}$/)) // change query if id string matches object ID regex
		query = { _id: id };
	User
		.load(query, function (err, user) {
			if (err) return next(err)
			if (!user) return next(new Error(t('user.load.error') + id))
			req.profile = user
			next()
		});
}

/**
 * Create user
 */

exports.create = function (req, res) {

	var user = new User(req.body);
	var preValidationErrors = [];

	// Checks existence of all fields before sending to mongoose

	if (!user.name)
		preValidationErrors.push(t('user.create.error.missing_name'));
	if (!user.email)
		preValidationErrors.push(t('user.create.error.email.missing'));
	else 
		if (!validator.isEmail(user.email))
			preValidationErrors.push(t('user.create.error.email.invalid'));
	

	if (!user.password)
		preValidationErrors.push(t('user.create.error.password.missing'));
	else if (user.password.length < 6)
		preValidationErrors.push(t('user.create.error.password.length'));

	// Avoid e-mail confirmation at development environment
	// if (process.env.NODE_ENV == 'development') {
	// 	user.needsEmailConfirmation = false;
	// }

	if (preValidationErrors.length > 0){
		return res.json(400, { messages: messages.errorsArray(req.i18n, preValidationErrors) });
	} else {
		user.save(function (err) {
			if (err) return res.json(400, { messages: messages.mongooseErrors(req.i18n, err)});		

			// Don't send email if user is active
			if (!user.needsEmailConfirmation) {			
				return res.json(messages.success(req.i18n.t('user.create.success.without_token')))
			} else {
				mailer.confirmEmail({
					mailSender: req.app.mailer, 
					user: user,
					callbackUrl: req.body.callback_url
				}, function(err){
					console.log(err);
					if (err) 
						return res.json({ messages: messages.mongooseErrors(req.i18n, err)});
					else 
						return res.json(messages.success(req.i18n.t('user.create.success.with_token')));
				})
			}
		})		
	}
}

/**
 * Update user
 */

exports.update = function (req, res) {

	User.findById(req.user._id, function(err, user){
		

		// User is changing password
		if (req.body.userPwd) {
			if (!user.authenticate(req.body.userPwd)) {
				return res.json(400, messages.error(t('user.update.password.error.wrong')));
			} else if (req.body.newPwd.length < 6) {
				return res.json(400, messages.error(t('user.update.password.error.length')));
			} else {
				if (req.body.newPwd == req.body.validatePwd){
					user.password = req.body.newPwd;
					user.save(function(err){
						if (err) res.json(400, messages.errors(err));
						else res.json(messages.success(t('user.update.password.success')));
					});		
				} else {
					return res.json(400, messages.error(t('user.update.password.error.dont_match')));
				}
			}
 
		// User is changing e-mail
		} else if (req.body.email) {

			// Check if is a diffent e-mail
			if (req.body.email == user.email) {
				return res.json(400, messages.error(t('user.update.email.error.already_associated')));
			}

			// Check if is valid
			if (!validator.isEmail(req.body.email)) {
				return res.json(400, messages.error(t('user.update.email.error.invalid')));
			}

			// Send confirmation, if e-mail is not already used
			User.findOne({email: req.body.email}, function(err, anotherUser){
				if (!req.body.callback_url){
					return res.json(400, messages.error(t('user.update.email.error.missing_callback')));			
				} else if (!anotherUser) {
					mailer.changeEmail(user, req.body.email, req.body.callback_url, function(err){
						if (err) {
							return res.json(400, messages.error(t('user.update.email.error.mailer')));
						} else {
							return res.json(messages.success(t('user.update.email.success')));
						}
					});
				} else {
					return res.json(400, messages.error(t('user.update.email.error.already_used')));			
				}
			})
			


		} else {
			user.bio = req.body.bio;
			user.name = req.body.name;
			user.username = req.body.username;
			user.save(function(err){
				if (err) res.json(400, messages.errors(err));
				else res.json(messages.success(t('user.update.success')));
			});		 
		}

	});
}

/**
 *	Show a user profile
 */

exports.show = function (req, res) {
	res.json(req.profile);
}

exports.info = function(req, res, next) {
	return res.json(req.user.info());
}

exports.layers = function(req, res, next) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page,
		criteria: { $or: [ { creator: req.user }, {contributors: { $in: [req.user._id] } } ] }
	}

	if (req.param('search')) {
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}
	}

	Layer.list(options, function(err, layers) {
		if (err) return res.json(400, err);
		Layer.count(options.criteria).exec(function (err, count) {
			if (!err) {
				res.json({options: options, layersTotal: count, layers: layers});
			} else {
				res.json(400, utils.errorMessages(err.errors || err))
			} 
		});
	});

}

exports.maps = function(req, res, next) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1;
	var perPage = (req.param('perPage') > 0 ? req.param('perPage') : 30);
	var options = {
		perPage: perPage,
		page: page,
		criteria: { creator: req.user }
	}

	if (req.param('search'))
		options.criteria = {
			$and: [
				options.criteria,
				{ title: { $regex: req.param('search'), $options: 'i' }}
			]
		}

	Map.list(options, function(err, maps) {
		if (err) return res.json(400, utils.errorMessages(err.errors || err));
		Map.count(options.criteria).exec(function (err, count) {
			if (err) res.json(400, utils.errorMessages(err.errors || err));
			else res.json({options: options, mapsTotal: count, maps: maps});
		})
	})
}

/**
 * Send reset password token
 */

exports.resetPasswordToken = function (req, res) {
	User.findOne({
		$or: [
		{email: req.body['emailOrUsername']}, 
		{username: req.body['emailOrUsername']}
		]
	}, function(err,user){
		if (err) 
			res.render('users/forgot_password', {
				title: t('user.reset_pwd.mail.title'),
				message: req.flash('error')
			});
		else {
			if (user) {
				mailer.passwordReset({
					mailSender: req.app.mailer,
					user: user,
					callbackUrl: req.body.callback_url
				}, function(err){
					if (err) 
						return res.json(messages.errors(err));
					else 
						return res.json(messages.success(t('user.reset_pwd.token.success')));
				});
			} else {
				req.flash('error', t('user.reset_pwd.form.error.user.not_found'));
				res.render('users/forgot_password', {
					title: t('user.reset_pwd.form.title'),
					message: req.flash('error')
				});				
			}
		}
	})
}


/**
 * Show migrate form
 */

exports.showMigrate = function (req, res) {
	res.render('users/migrate');
}

/**
 * Generate migration token
 */

exports.migrate = function (req, res) {
	var
		email = req.body.email,
		password = req.body.password,
		errors = [];

	if (!email) {
		errors.push(t('user.migrate.form.errors.email.missing'));
	}

	if (!password) {
		errors.push(t('user.migrate.form.errors.password.missing'));
	}

	if ((password) && (password.length < 6)) {
		errors.push(t('user.migrate.form.errors.password.length'));
	}

	if (errors.length > 0) {
		res.render('users/migrate', {
			errors: errors,
			email: email
		});
	} else {
		User.findOne({email: email, status: 'to_migrate'}, function(err, user){
			if (err) {
				res.render('users/migrate', {
					errors:  utils.errorMessagesFlash(err.errors),
					email: email
				});
			} else if (!user) {
				res.render('users/migrate', {
					errors:  [t('user.migrate.form.errors.user.not_found')],
					email: email
				});
			} else {
				mailer.migrateAccount(user, password, function(err){
					res.render('users/migrate', {
						info:  [t('user.migrate.form.success')],
						email: email
					});
				})
			}
		})
	}

}

