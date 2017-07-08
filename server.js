// ==== DECLARATIONS ==== //
const express = require('express');
const request = require('request');
const helmet = require('helmet');
const RateLimit = require('express-rate-limit');
const limiter = new RateLimit({
	windowMs: 15 * 60 * 1000,
	max: 20,
	delayMs: 0
});
const app = express();


// ==== FUNCTIONS ==== //
/**
 * Set the options for querying CR
 * @param  {Response} query Query from the url
 * @return {Object}     Options for the query to CR
 */
function setOptions(query) {
	let options = {
		url: 'https://api.crunchyroll.com/start_session.0.json',
		qs: {
			version: '1.0', // eslint-disable-line
			access_token: 'Scwg9PRRZ19iVwD', // eslint-disable-line
			device_type: 'com.crunchyroll.crunchyroid', // eslint-disable-line
			device_id: generateId() // eslint-disable-line
		}
	};
	if (query.auth) {
		options.qs.auth = query.auth;
	}
	return options;
}

/**
 * Generate a random 32 character long device ID
 * @return {String} Generated device ID
 */
function generateId() {
	let id = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (var i = 0; i < 32; i++) {
		id += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return id;
}

/**
 * Emit a negative reply containing an error message
 * @param  {Object} res  Reply object
 * @param  {String} err Error message
 */
function replyError(res, err) {
	res.status(500).send({
		message: err,
		code: 'error',
		error: true
	});
}

/**
 * Emit a positive reply containing data
 * @param  {Object} res  Reply object
 * @param  {Object} data Object containing the requested payload
 */
function replySuccess(res, data) {
	res.status(200).send(data);
}

// ==== ROUTING ==== //
// support for reverse proxy
app.enable('trust proxy');
// use the middleware
app.use(helmet());
app.use(limiter);
app.get('/start_session', (req, res) => {
	if (req.query.version === undefined || req.query.version === '1.0') {
		let options = setOptions(req.query);
		request(options, (error, response, body) => {
			replySuccess(res, JSON.parse(body));
		}).on('error', error => {
			console.log(`Error fetching ${options.url}: ${error}`);
			replyError(res, error);
		});
	} else {
		replyError(res, 'Invalid API version specified.');
	}
});
app.get('*', (req, res) => {
	replyError(res, 'Invalid API endpoint.');
});

// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 3001; // eslint-disable-line
app.listen(port, () => {
	console.log(`Listening on port ${port}`);
});