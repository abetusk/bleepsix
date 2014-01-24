#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
cgitb.enable();


#staging_base    = "/tmp/stage"
#logfile         = "/tmp/bleepsixDownloadManager.log"

staging_base    = "/home/meow/stage"
logfile         = "/home/meow/log/bleepsixDownloadManager.log"

g_filename = "download.file"

def print_header():
#  print "Content-Disposition: attachment; filename=\"foo.txt\""
  print "Content-Disposition: attachment; filename=\"" + g_filename + "\""
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


if "name" in form:
  g_filename = re.sub( "[^0-9a-zA-Z._-]", "", form["name"].value)
  if not g_filename:
    g_filename = "download.file"


file_id = form["id"].value

try:
  first = True
  with open( staging_base + "/" + file_id, "r") as content_file:

    if first:
      print_header()
      first = False

    #print content_file.read()

    # get rid of trailing newline
    sys.stdout.write( content_file.read() )

except IOError:
  print_error()




