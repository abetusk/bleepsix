#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
import subprocess as sp
import sys

cgitb.enable();

schjson_exec = "/home/meow/pykicad/schjson.py"
staging_base = "/home/meow/stage"

u_id = -1

print "Content-Type: application/json"
print
print "{ \"type\" : \"error\", \"message\" : \"disabled\" }"
sys.exit(0)

print "Content-Type: application/json"
print
print 

form = cgi.FieldStorage()
if "fileData" in form:
  u_id = uuid.uuid4()
  fn = staging_base + "/" + str(u_id)
  f = open( fn, "wb" )
  f.write( form.getvalue('fileData') )
  f.close()

  try:
    json_sch = sp.check_output( [schjson_exec, fn] )
    print json_sch
  except Exception as e:
    print "{ \"type\" : \"error\", \"message\" : \"" + str(e) + "\" }"
    





