Tableau Conference Sample Application
=========

This is sample code, and is not supported by Tableau. Please be kind and don't call Techincal Support for help - they don't know what this is!

What does it do?

  - Demonstrates the use of the Tableau JavaScript, TDE and REST APIs, along with Trusted Authentication
  - Allows you to create users w/o TabCmd or the Tableau Portal 
  - Queries / displays data sources on a site
  - Allows you to upload an arbitrary CSV file directly to Tableau and then build a report against same with Web Authoring


Version
----

1.0



Installation
--------------

 - To begin, you must download and install [Node.Js] for your operating system (Windows, Linux)
 - You must also install and configure the **Python**-based [Extract API].
 - And what good is the API without Python itself? Install [Python 2.7.X] for your OS. 
 - Next, download the code using the **Download** button to your right
 - Unzip to c:\node, and navigate there on the command-line.
 - Execute these commands to prepare the app
 
```sh
npm install 
```

##### Note: 
This sample application has only been "tested" (note the quotes?!) on Windows. It should work on Linux too. If it doesn't...well, you're a Linux person..which means you can probably troublshoot this yourself.
  
  
To run the application, type:

```sh
node app
```
App  Configuration
-----------

We're a bit lazy. We admit it. As a result you need to update the code a bit. 

In c:\node\app.js modify:
 - Line  44: Update the username & password for an admin on your server
 - Line  47: Update the Tableau Server name we'll be connecting to

 
In c:\node\views\aboutcompany.ejs, modify:
 - Line 8: Update the server name to your server
 
In c:\node\views\analyze.ejs, modify: 

 - Line 68: Update the server name to your server
 
Note: This app hard codes the Site ID & Name 'rest' when we request trusted tickets. If you want to create users and/or read data sources from a site other than 'rest', you'll need to find/replace this value.

And another note: The app demonstrates creating a user in Tableau via the "register" functionality, but it doesn't save said user in local storage so you can use it again after you stop / restart the application. Consider modifying line 39 of app.js if you want to add a "permanent" user to the application. 


Tableau Server Configuration
----
 - This application leverages Tableau **Trusted Authentication** to enable logged on user to view the viz on /about. Please review the [documentation] on same, and configure Tableau to trust the IP address or Machine Name of the box which runs this application. 

 - This app assumes a site called "rest" exists on your server. Create a new site using 'rest' for both the name and id of the site.


License
----

MIT



[PhantomJS]:http://phantomjs.org
[Node.js]:http://nodejs.org/
[Extract API]:http://www.tableausoftware.com/data-extract-api
[Python 2.7.X]:https://www.python.org/download/releases/2.7/
[documentation]:http://onlinehelp.tableausoftware.com/current/server/en-us/help.htm#trusted_auth_trustIP.htm
[Enable access]:http://kb.tableausoftware.com/articles/knowledgebase/creating-custom-administrative-views


