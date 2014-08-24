# ryan robitialle (12/6/2012)
# creating Tableau Data Extracts via CSV files

import csv, os, time
from datetime import datetime
import dataextract as tde #saves some typing, cause i'm a lazy person

################ PARAMETERS FOR YOU, CODE MONKEY! ##########################
cvsfilenamemask = '.csv' # can be explicit 'thisfile.csv' for one file - or open '.csv' for all that match
sourcedir = 'C:\\node\\public\\uploads\\' # need to double up the \\s | windows shares use like this '\\\\ryrobesxps\d$\' etc
targetdir = 'C:\\node\\public\\uploads\\' # can't be a share or UNC path
csvdelimiter = ',' # obvious!
csvquotechar = '"' # obvious!
rowoutput = False # useful for debugging data errors / slows stuff down a lot however
################ PARAMETERS FOR YOU, CODE MONKEY! ##########################

# Note: if you have less than a few thousand rows, the progress bar will be a bit odd looking.

fileperf = dict() # for saving each files execution times

# since the CSV module imports all fields as strings regardless of what they are..
def datatyper(n):    # force some data types to figure stuff out
        try:         # kind of lame.... BUT IT WORKS
            x = int(n)
            return int(n)
        except:
                try:
                    x = float(n)
                    return float(n)
                except:
                    try:
                        date_object = datetime.strptime(n, '%m/%d/%Y')
                        return date_object
                    except:
                        try:
                            date_object = datetime.strptime(n, '%Y-%m-%d')
                            return date_object
                        except:
                            if n == 'NULL': # just in case, don't want any literal NULLs in there
                                return None
                            elif len(n) > 0:
                                return str(n)
                            else: # no need to return an empty string, let's NULL that stuff out
                                return None
# end ugly data types function

def showhumanfilesize(num):
    for x in ['bytes','KB','MB','GB']:
        if num < 1024.0:
            return "%3.1f%s" % (num, x)
        num /= 1024.0
    return "%3.1f%s" % (num, 'TB')

def intWithCommas(x):
    if type(x) not in [type(0), type(0L)]:
        raise TypeError("Parameter must be an integer.")
    if x < 0:
        return '-' + intWithCommas(-x)
    result = ''
    while x >= 1000:
        x, r = divmod(x, 1000)
        result = ",%03d%s" % (r, result)
    return "%d%s" % (x, result)

def file_lines(fname):
    with open(fname) as f:
        for i, l in enumerate(f):
            pass
    return i + 1

#print ' '
#print '[ Note: Each . = ' +str(dotsevery)+ ' rows processed ]'

os.chdir(sourcedir)

#delete any old TDEs
files = os.listdir(".")
for f in files:
  if not os.path.isdir(f) and ".tde" in f:
    os.remove(f)

for csvfilename in os.listdir("."):
    if csvfilename.endswith(cvsfilenamemask):
        tdefilename = csvfilename.split('.')[0]+'.tde'
        linez = file_lines(sourcedir + csvfilename)
        if linez > 36:
            dotsevery = linez/36
        else:
            dotsevery = 10
        print ' '
        print '###########################################################################'
        print '  Now working on ' + csvfilename + ' ('+str(intWithCommas(linez))+') -> ' + tdefilename + ' (' + str(intWithCommas(dotsevery)) + ' rows per =)'
        print '###########################################################################'
        #print dotsevery
        time.sleep(1) # so you can read it.

# BEGIN MULTI FILE LOOP
        start_time = time.time() # simple timing for test purposes

        try:
            # taking a sample of the file
            csvfile = open(csvfilename, 'rb')
            toplines = csvfile.readlines()
            filebuffer = '' # empty string
            for i in range(dotsevery):
                filebuffer = filebuffer + toplines[i]
            hasheader = csv.Sniffer().has_header(filebuffer) # csvfile.read()  /  filebuffer
        except:
            hasheader = False


        # ok lets go
        csvfile.seek(0) # YOU WILL DO, WHAT I SAY, WHEN I SAY! BACK TO THE FRONT!
        csvreader = csv.DictReader(csvfile, delimiter=csvdelimiter, quotechar=csvquotechar)

        dfields = []
        dtypes = []

        if hasheader == True:
            for f in csvreader.fieldnames:
                dfields.append(f)
            
        else: # WTF? No header? JERK.
            fieldnum = 0
            #print 'If you don\'t have a header, how will you recognize the fields in Tableau?'
            for f in csvreader.fieldnames:
                dfields.append('field'+str(fieldnum))
                fieldnum = fieldnum + 1
            csvreader = csv.DictReader(csvfile, delimiter=csvdelimiter, quotechar=csvquotechar, fieldnames=dfields)
            # we have to make our own field names
            
        for row in csvreader:
            for i in dfields:
                dtypes.append(str(type(datatyper(row[i]))))
            break # got stuff, we're out

        csvfile.seek(0) # BACK TO THE FRONT! (AGAIN!)



        os.chdir(targetdir)
        try:  # Just in case the file exists already, we don't want to bomb out
            tdefile = tde.Extract(tdefilename) # in CWD
        except: 
            os.system('del ' + targetdir + tdefilename)
            os.system('del DataExtract.log') #might as well erase this bitch too
            tdefile = tde.Extract(targetdir + tdefilename)

        # ok lets build the table definition in TDE with our list of names and types first
        # replacing literals with TDE datatype integers, etc
        tableDef = tde.TableDefinition() #create a new table def

        numfields = len(dfields)
        #print numfields

        if rowoutput == True:
            print '*** field names list ***' # debug 
        for t in range(numfields):
            fieldtypeo = dtypes[t].replace("<type '","").replace("'>","").replace("<class '","").replace('NoneType','str').replace('uuid.UUID','str')
            fieldname = dfields[t]
            fieldtype = str(fieldtypeo).replace("str","15").replace("datetime.datetime","13").replace("int","7").replace("decimal.Decimal","10").replace("float","10").replace("uuid.UUID","15").replace("bool","11")
            if rowoutput == True:
                print fieldname + '  (looks like ' + fieldtypeo +', TDE datatype ' + fieldtype + ')'  # debug 
            try:
                tableDef.addColumn(fieldname, int(fieldtype)) # if we pass a non-int to fieldtype, it'll fail
            except:
                tableDef.addColumn(fieldname, 15) # if we get a weird type we don't recognize, just make it a string
        if rowoutput == True:
            print '***'
            time.sleep(5) # wait 5 seconds so you can actually read stuff!

        # ok, lets print out the table def we just made, for stuffs and giggles
        if rowoutput == True:
            print '################## TDE table definition created ######################'
            for c in range(0,tableDef.getColumnCount()):
                print 'Column: ' + str(tableDef.getColumnName(c)) + ' Type: ' + str(tableDef.getColumnType(c))
            time.sleep(5) # wait 5 seconds so you can actually read stuff!

        # ok lets add the new def as a table in the extract
        tabletran = tdefile.addTable("Extract",tableDef) 

        # time to start pumping rows!

        rowsinserted = 1

        # if we have a header, we don't want to try and process it
        if hasheader == True:
            csvreader.next()
        print '[',
        for row in csvreader:

            if rowoutput == True: # row deets, else just '.'
                print '************** INSERTING ROW NUMBER: ' + str(rowsinserted) + '**************' # debug output
            else: # only print dot every 50 records
                if (rowsinserted%dotsevery) == 0:
                    print '=',

            columnposition = 0
            newrow = tde.Row(tableDef)

            for t in range(numfields):
                fieldtype = dtypes[t].replace("<type '","").replace("'>","").replace("<class '","").replace('NoneType','str').replace('uuid.UUID','str')
                fieldname = dfields[t]
                
                if rowoutput == True: # column deets
                    print str(columnposition) + ' ' + fieldname + ':   ' + str(row[fieldname]) + ' (' + str(fieldtype).split('.')[0] + ')' # debug output

                if fieldtype == 'str':
                    if row[fieldname] != None: # we don't want no None!
                        newrow.setCharString(columnposition, str(row[fieldname]))
                    else:
                        newrow.setNull(columnposition) # ok, put that None here

                if fieldtype == 'int':
                    if row[fieldname] != None:
                        newrow.setInteger(columnposition, datatyper(row[fieldname]))
                    else:
                        newrow.setNull(columnposition)

                if fieldtype == 'bool':
                    if row[fieldname] != None:
                        newrow.setBoolean(columnposition, datatyper(row[fieldname]))
                    else:
                        newrow.setNull(columnposition)

                if fieldtype == 'decimal.Decimal':
                    if row[fieldname] != None:
                        newrow.setDouble(columnposition, datatyper(row[fieldname]))
                    else:
                        newrow.setNull(columnposition)

                if fieldtype == 'datetime.datetime': # sexy datetime splitting
                    if row[fieldname] != None:
                        strippeddate = str(datatyper(row[fieldname])).split('.')[0] # just in case we get microseconds (not all datetime uses them)
                        timechunks = time.strptime(str(strippeddate), "%Y-%m-%d %H:%M:%S") # chunky style!
                        newrow.setDateTime(columnposition, timechunks[0], timechunks[1], timechunks[2], timechunks[3], timechunks[4], timechunks[5], 0000)
                    else:
                        newrow.setNull(columnposition)
            
                columnposition = columnposition + 1 # we gots to know what column number we're working on!
            tabletran.insert(newrow) # finally insert buffered row into TDE 'table'
            newrow.close()
            rowsinserted = rowsinserted + 1

        # ok let's write out that file and get back to making dinner
        tdefile.close()
        csvfile.close()
        print '] '
        print '('+str(intWithCommas(rowsinserted))+' rows)' # to clear out the row on command line

        plist = []

        # timing purposes for debugging / optimizing / FUN! This is FUN, Lars.
        timetaken = time.time() - start_time
        plist.append(timetaken)
        plist.append(rowsinserted)
        plist.append(os.path.getsize(sourcedir + csvfilename))
        plist.append(os.path.getsize(sourcedir + tdefilename))
        fileperf[str(csvfilename)] = plist
        # added by RFC - delete uploaded file
        os.remove(csvfilename)
# just for our "result time"
totaltime = 0
totalrecords = 0
totalpresize = 0
totalpostsize = 0

print ' '

for p in fileperf:
    print p + '     ' + str(intWithCommas(int(fileperf[p][0]))) + ' seconds     processed ' + str(intWithCommas(fileperf[p][1])) + ' records. Resulting TDE file is ' + str(showhumanfilesize(fileperf[p][3])) + ' (source was ' + str(showhumanfilesize(fileperf[p][2])) + ')'
    totaltime = fileperf[p][0] + totaltime
    totalrecords = fileperf[p][1] + totalrecords
    totalpresize = fileperf[p][2] + totalpresize
    totalpostsize = fileperf[p][3] + totalpostsize
print 'Success'
if len(fileperf) > 1:
    print ' '
    print 'TOTAL RUN        ' + str(intWithCommas(int(totaltime))) + ' seconds      processed ' + str(intWithCommas(totalrecords)) + ' records - crunched ' + str(showhumanfilesize(totalpresize)) + ' of text into ' + str(showhumanfilesize(totalpostsize)) + ' of binary sexiness'