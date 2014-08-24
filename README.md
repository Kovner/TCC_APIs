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

FAQs / Notes
----

##### I see an error that sort of looks like this (data type may vary) whenever your code tries to turn a csv into an extract. What's going on?
Example:
```sh
Error: TypeError: an integer is required
    at PythonShell.parseError (C:\node\node_modules\python-shell\index.js:131:17)
    at ChildProcess.<anonymous> (C:\node\node_modules\python-shell\index.js:67:28)
    at ChildProcess.emit (events.js:98:17)
    at Process.ChildProcess._handle.onexit (child_process.js:809:12)
    ----- Python Traceback -----
    File "C:\node\public\js\csv_2_tde.py", line 216, in <module>
      newrow.setInteger(columnposition, datatyper(row[fieldname]))
    File "c:\python27\lib\site-packages\dataextract\Base.py", line 248, in setInteger
      , c_int(value)
 ```     

 Your CSV file most likely has mixed data types in the same field. For example, the code was expecting an INT based on the majority of the other values in the column, but this row just handed us a STRING. 
 
 What can you do? In /public/js/csv_2_tde.py, you can temporarily set the **rowoutput** flag (line 14) to **True**. Then navigate to /public/js and run the script manually to see debugging information. This extra information will tell you the row on which the script failed so you can fix it. 
 
 ##### I used to be able to process files with no problem. Now I an error like the one above when I attempt to upload a file I KNOW is good. Why?
 
 
The csv_2_tde.py script attempts to process ANY csv file it sees in the /public/uploads folder. It is likely an older, "broken" CSV file is still sitting there and the script is trying to process it (and failing) BEFORE it even gets to your "known good file". Clean up the /uploads folder and try again.
 
 
 

[PhantomJS]:http://phantomjs.org
[Node.js]:http://nodejs.org/
[Extract API]:http://www.tableausoftware.com/data-extract-api
[Python 2.7.X]:https://www.python.org/download/releases/2.7/
[documentation]:http://onlinehelp.tableausoftware.com/current/server/en-us/help.htm#trusted_auth_trustIP.htm
[Enable access]:http://kb.tableausoftware.com/articles/knowledgebase/creating-custom-administrative-views

Special thanks to Ryan Robitialle for writing the Python script years ago so we didn't have to!

