#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
import subprocess as sp

cgitb.enable();

jsonsch_exec = "/tmp/pykicad/jsonsch.py"
staging_base = "/tmp/stage"

json_container = json.load(sys.stdin);
msg_type = json_container["type"]

u_id = uuid.uuid4()
sch_json_fn = staging_base + "/" + str(u_id)
f = open( sch_json_fn, "w" )
f.write( json.dumps(json_container["data"], indent=2) )
#f.write( kicad_sch )
f.close()


print "Content-Type: application/json"
print

try:
  kicad_sch = sp.check_output( [jsonsch_exec, sch_json_fn ] );

  u_id = uuid.uuid4()
  f = open( staging_base + "/" + str(u_id), "w" )
  f.write( kicad_sch )
  f.close()

except Exception as e:
  print "{ \"type\" : \"error\", \"message\" : \"" + str(e) + "\" }"
  sys.exit(1)


obj = { "type" : "id", "id" : str(u_id), "extra": "hmm.." + str(u_id)  }
print json.dumps(obj)


#print "Content-Type: text/html;charset=utf-8"
#print
#form = cgi.FieldStorage()
#for key in form :
#  s += str(key) + str(form[key].value) + ":::"

