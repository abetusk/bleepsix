#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
import subprocess as sp

cgitb.enable();

brdjson_exec = "/home/meow/pykicad/brdjson.py"
staging_base = "/home/meow/stage"

u_id = -1

print "Content-Type: application/json"
print
print 

#flog = open( "/tmp/bleepsix.log", "a")
#flog.write("cp\n")
#flog.close()

form = cgi.FieldStorage()
if "fileData" in form:
  u_id = uuid.uuid4()
  fn = staging_base + "/" + str(u_id)
  f = open( fn, "wb" )
  f.write( form.getvalue('fileData') )
  f.close()

  try:
    json_brd = sp.check_output( [brdjson_exec, fn] )
    print json_brd
  except Exception as e:
    print "{ \"type\" : \"error\", \"message\" : \"" + str(e) + "\" }"
    





