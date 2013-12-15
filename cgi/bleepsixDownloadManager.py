#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
cgitb.enable();

staging_base    = "/tmp/stage"
logfile         = "/tmp/bleepsixDownloadManager.log"

def print_header():
  print "Content-Disposition: attachment; filename=\"foo.txt\""
  print "Content-Type: application/octet-stream"
  print

def print_error():
  print "Content-Type: text/html"
  print
  print "<html><body>error occured</body></html>"


form = cgi.FieldStorage()
if "id" not in form:
  print_error()
  sys.exit(0)

file_id = form["id"].value

try:
  first = True
  with open( staging_base + "/" + file_id, "r") as content_file:

    if first:
      print_header()
      first = False

    print content_file.read()

except IOError:
  print_error()




