//modules ==========================================

// ExpressJS 4.0 used for the middleware and web framework
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var flash = require('connect-flash');

// Modules for handling xml requests and responses
var jsxml = require("node-jsxml");
var XMLWriter = require('xml-writer');
var request = require("request");

// Modules used for uploading files, writing to the file system, and publishing to Tableau
var fs = require('fs');
var busboy = require('connect-busboy');
var parseString = require('xml2js').parseString;
var PythonShell = require('python-shell');
var exec = require('exec');


var app = express();

app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser());

app.use(busboy()); 
// ejs (embedded javascript) used as the template engine
app.engine('html', require('ejs').renderFile);
app.use(cookieParser('Ronaldinho'));
app.use(session());
app.use(flash());

//'database' of users
//Each user is a property in this object whose value is that user's pw.
// EG if a user's login is mike/hello then users['mike'] == "hello"
var users = {russch:"howdy"};

//Variables we'll use throughout the app

// admin username & pw: OF COURSE you won't hard-code these in the real world:
var admin = {username: "admin", password: "adminpw"};

//location of the server
//var tableauServer = "http://winTableau"; //Russell's
var tableauServer = "http://mkovner-vm"; //Kovner's


//variable to hold auth token of an admin user so we can do stuff easily
var adminAuthToken; 



app.get('/', function(req,res) {
	res.render('login.ejs', {
		error: req.flash('error'),
		success: req.flash('success')
	});
});

app.get('/signup', function(req,res) {
	res.render('signup.ejs', {
		error: req.flash('error'),
		success: req.flash('success')
	});
});

app.post('/user', function(req,res) {
	if(req.body.user.length === 0) {
		req.flash('error', "please choose a username");
		res.redirect('/signup');
	} else if(req.body.pass.length === 0) {
		req.flash('error', "please choose a password");
	} else if(users[req.body.user]) {
		req.flash('error', 'user already exists');
		res.redirect('/signup');
	} else if(req.body.pass != req.body.conf) {
		req.flash('error', "password and pw confirmation don't match");
		res.redirect('/signup');
	} else {
		// OK everything looks good. Let's create this user on Tableau Server with the REST API
		createUser(req.body.user, function(err) {
			if(err) {
				req.flash('error', "Error while posting to Server: " + err);
				res.redirect('/signup');
			} else {
				users[req.body.user] = req.body.pass;
				req.flash('success', "User added");
				res.redirect('/');
			}
		});
	}
});

app.post('/login', function(req,res) {
	if(req.body.password === users[req.body.user]) {
		req.session.user = req.body.user;
		res.redirect('/about');
	} else {
		req.flash('error', "Username or password incorrect.");
		res.redirect('/');
	}
});

app.get('/about', function(req, res) {
	//First we get a ticket, then we pass that and the username to the ejs that we render
	console.log(req.session.user);
    request.post( 
		{
			url: tableauServer + '/trusted',
			form: { 
				'username': req.session.user ,
				'target_site': 'rest'
			}
		},
		// Express requests take a 'callback' function which will be called when the request has been processed. The
		// response from the server will be contained in the 3rd parameter 'body'.
		function(err, response, body) {
			if(err) {
				callback(err);
				return;
			} else {
				res.render('aboutcompany.ejs', {
					user: req.session.user,
					ticket: body
				});
            }
        }
    );
});

app.get('/analyze', function(req,res) {
    
    getDataSources( function(datasources) {
        console.log ("analyze: " + datasources);
        res.render('analyze.ejs', {
            user: req.session.user, datasource: datasources
        });
    });
});

app.post('/uploadfile', function(req, res) {
    
    // Called to deal with POSTed file by client
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        fstream = fs.createWriteStream(__dirname + '/public/uploads/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
        res.redirect('back');
        });
    });
});

app.get('/processfile', function(req, res){

    // Called by client after a file has completely uploaded
    
    // Filename to work with
    var fileName = req.query.fileName;
    console.log("File to process: " + fileName);
    var options = {
      mode: 'text',
      scriptPath: 'C:\\node\\public\\js'
    };
	
    PythonShell.run('csv_2_tde.py', options, function (err, results) {
      if (err) throw err;
      // results is an array consisting of messages collected during execution
      //console.log('results: %j', JSON.stringify(results));
	  console.log(results[results.length -2]);
	  console.log(results[results.length -1]);
	  
	  
		console.log ("Publishing Data Source");
		
		argArray  = [];
		// Args to pass to exec module
		argArray.push('tabcmd');
		argArray.push('publish');
		argArray.push('c:\\node\\public\\uploads\\' + fileName.slice(0,-4) + '.tde');
		argArray.push('-p' + admin.password);
		argArray.push('-u' + admin.username);
		argArray.push('-n' + fileName.slice(0,-4)); // Friendly name of data source


		//First, TabCmd Publish
		exec( argArray, function(err, out, code) {
		  if (err instanceof Error)
			throw err;
		  process.stderr.write(err);
		  process.stdout.write(out);
		  
			  //Then, logout
			  exec(['tabcmd', 'logout'], function(err, out, code) {

				  if (err instanceof Error)
					throw err;
				  process.stderr.write(err);
				  process.stdout.write(out);
				 // process.exit(code);		
				res.end();
				});
		});
		
	  
    });
	
});

app.get('/trustedticket', function(req, res) {
    
    var user = req.query.user;
    request.post( 
		{
			url: tableauServer + '/trusted',
			form: { 'username': user }
		},
		// Express requests take a 'callback' function which will be called when the request has been processed. The
		// response from the server will be contained in the 3rd parameter 'body'.
		function(err, response, body) {
			if(err) {
				callback(err);
				return;
			} else {
				var ticket = body;
				console.log(body);
				res.send(body);
            }
        });
});

var port = Number(process.env.PORT || 8001);
app.listen(port);
console.log("Listening on port " + port);


// Helper functions
var createUser = function(user, callback) {
	// First we need to login to the REST API as an admin.
	var loginxml = new XMLWriter();
	loginxml.startElement('tsRequest').startElement('credentials').writeAttribute('name', admin.username)
		.writeAttribute('password', admin.password).startElement('site').writeAttribute('contentUrl', '');
	request.post( 
		{
			url: tableauServer + '/api/2.0/auth/signin',
			body: loginxml.toString(),
			headers: {'Content-Type': 'text/xml'}
		},
		// Express requests take a 'callback' function which will be called when the request has been processed. The
		// response from the server will be contained in the 3rd parameter 'body'.
		function(err, response, body) {
			if(err) {
				callback(err);
				return;
			} else {
				// In order to grab information from the response, we turn it into an xml object and use a module
				// called node-jsxml to parse the xml. node-jsxml allows us to use child(), attribute(), and some other functions
				// to locate specific elements and pieces of information that we need.
				// Here, we need to grab the 'token' attribute and store it in the session cookie.
				var authXML = new jsxml.XML(body);
				var authToken = authXML.child('credentials').attribute("token").getValue();
				console.log("Auth token: " + authToken);
				// OK We're logged in, but we have one more step, grabbing the luid for the site we want to
				// add our user to.
				request(
					{
						url: tableauServer + '/api/2.0/sites/rest?key=name',
						headers: {
							'Content-Type': 'text/xml',
							'X-Tableau-Auth': authToken
						}
					},

					function(err, response, body) {
						if(err) {
							callback(err);
							return;
						} else {
							var siteXML = new jsxml.XML(body);
							var siteID = siteXML.child('site').attribute("id").getValue();
							console.log("site id: " + siteID);
						}
						// OK. we have the site id and the auth token. We have all the pieces to make the
						// post request to add the user.

						//First, build the XML for the POST
						var userxml = new XMLWriter();
						userxml.startElement('tsRequest').startElement('user')
							.writeAttribute('name', user).writeAttribute('role', 'Interactor')
							.writeAttribute('publish', 'true').writeAttribute('contentAdmin','false')
							.writeAttribute('suppressGettingStarted', 'true');
						request.post( 
							{
								url:  tableauServer + '/api/2.0/sites/' + siteID + '/users/',
								body: userxml.toString(),
								headers: {
									'Content-Type': 'text/xml',
									'X-Tableau-Auth': authToken
								}
							},
							function(err, response, body) {
								if(err) {
									callback(err);
									return;
								} else {
									//If the request was succesful we get xml back that contains the id and name of the added user.
									var newUserXML = new jsxml.XML(body);
									console.log(newUserXML.toString());
									var userID = newUserXML.child('user').attribute('id').getValue();
									var userName = newUserXML.child('user').attribute('name').getValue();
									console.log(userName + " added with user id " + userID);
								}
								callback(null);
								return;
							}
						);	
					}
				);
			}
		}
	);	
}

var adminLogin = function (callback){
    // Used to Login an Admin - First we need to login to the REST API as an admin.
	var loginxml = new XMLWriter();
	loginxml.startElement('tsRequest').startElement('credentials').writeAttribute('name', admin.username)
		.writeAttribute('password', admin.password).startElement('site').writeAttribute('contentUrl', '');
	request.post( 
		{
			url: tableauServer + '/api/2.0/auth/signin',
			body: loginxml.toString(),
			headers: {'Content-Type': 'text/xml'}
		},
		// Express requests take a 'callback' function which will be called when the request has been processed. The
		// response from the server will be contained in the 3rd parameter 'body'.
		function(err, response, body) {
			if(err) {
				callback(err);
				return;
			} else {
				// In order to grab information from the response, we turn it into an xml object and use a module
				// called node-jsxml to parse the xml. node-jsxml allows us to use child(), attribute(), and some other functions
				// to locate specific elements and pieces of information that we need.
				// Here, we need to grab the 'token' attribute and store it in the session cookie.
				var authXML = new jsxml.XML(body);
				try {
                    adminAuthToken = authXML.child('credentials').attribute("token").getValue();
                }
                catch (err)
                {
                    console.log ("Your servername, username or password are incorrect");
                    adminAuthToken = -1;
                }
                
				console.log("Auth token: " + adminAuthToken);
                callback(null);
                return;
            }
        }
    );
    
}

var getDataSources = function (callback) {

    // Lazy, I don't want to bother lookig up the site ID of my defaut site. You should.
    siteID = '94f96a34-64e7-49f2-8624-e77426bbd490';
    
    //Array which'll contain data sources
    var dataSourceArray = [];
    
    //Login as admin, then get data source list for a site using REST API
    adminLogin(function () {

        if (adminAuthToken == -1) {return};
        var options = {
            url: tableauServer + '/api/2.0/sites/' + siteID + '/datasources',
            headers: {
                'Content-Type': 'text/xml',
                'X-Tableau-Auth': adminAuthToken
            }
        };

        request.get(options, function (error, response, body) {
            parseString(body, function (err, result) {
                //console.log(JSON.stringify(result.tsResponse.datasources[0].datasource, null, 2))
                var datasources = result.tsResponse.datasources[0].datasource;
                
                for (i = 0; i < datasources.length; i++) {
                    console.log("Data Source: " + datasources[i].$.name);
                    dataSourceArray.push(datasources[i].$.name);
                }

                callback(dataSourceArray);
            });
        });
    });
}

