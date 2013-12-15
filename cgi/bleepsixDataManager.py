#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid

cgitb.enable();

staging_base = "/tmp/stage"

json_container = json.load(sys.stdin);
msg_type = json_container["type"]

u_id = uuid.uuid4()
f = open( staging_base + "/" + str(u_id), "w" )
f.write( json.dumps(json_container["data"], indent=2) )
f.close()

print "Content-Type: application/json"
print

obj = { "type" : "id", "id" : str(u_id) }
print json.dumps(obj)



#print "Content-Type: text/html;charset=utf-8"
#print
#form = cgi.FieldStorage()
#for key in form :
#  s += str(key) + str(form[key].value) + ":::"

