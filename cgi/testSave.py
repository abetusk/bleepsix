#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
cgitb.enable();

staging_base = "/tmp/stage"

f = open( staging_base + "/bleepbloop" )
for line in sys.stdin:
  f.write( line )
f.close()

print "Content-Type: text/html"
print
print "upload successful"


