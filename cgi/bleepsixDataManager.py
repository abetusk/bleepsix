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

def error_and_quit(err, notes):
  print "Content-Type: application/json"
  print

  ret_obj = { "type" : "error", "message": str(err)  }
  if notes:
    ret_obj["notes"] = notes
  print json.dumps(ret_obj)
  sys.exit(0)

def dumpToFile( data ):
  u_id = uuid.uuid4()
  fn = staging_base + "/" + str(u_id)
  f = open( fn, "w" )
  #f.write( json.dumps(json_message["data"], indent=2) )
  f.write( data )
  f.close()

  return u_id, fn


def makeKiCADSchematic( json_message ):
  u_id, sch_json_fn = dumpToFile( json.dumps(json_message["data"], indent=2) )

  try:
    kicad_sch = sp.check_output( [jsonsch_exec, sch_json_fn ] );
    u_id, fn  = dumpToFile( kicad_sch )
  except Exception as e:
    error_and_quit(e)

  obj = { "type" : "id", "id" : str(u_id), "notes" : "KiCAD Schematic File ID"  }
  return obj

def makeJSONSchematic( json_message ):
  u_id, sch_json_fn = dumpToFile( json.dumps(json_message["data"], indent=2) )
  obj = { "type" : "id", "id" : str(u_id), "notes" : "JSON KiCAD Schematic File ID"  }
  return obj

def makePNG( json_message ):
  u_id, fn = dumpToFile( str(json_message["data"]) )

  png_uid = uuid.uuid4()
  png_fn = staging_base + "/" + str(png_uid)

  try:
    cut     = sp.Popen( [ "cut", "-f", "2" , "-d", ",", fn], \
        stdout = sp.PIPE )
    base64  = sp.Popen( [ "base64" , "--decode" ], \
        stdin = cut.stdout, stdout = sp.PIPE )
    convert = sp.Popen( [ "convert", "-", "-flatten", "-crop", "900x525+50+50", png_fn ], \
        stdin = base64.stdout, stdout = sp.PIPE )
  except Exception as e:
    error_and_quit(e, png_fn);

  obj = { "type" : "id", "id" : str(png_uid), "notes" : "PNG file id" }
  return obj

try:
  json_container = json.load(sys.stdin);
except Exception as e:
  error_and_quit(e)


userid = uuid.uuid4()
args = cgi.FieldStorage()
if "userid" in args.keys():
  userid = args["userid"].value

#userid = 

msg_type = json_container["type"]

obj = { "type" : "error" , "message" : "invalid function" }
if msg_type == "createKiCADSchematic":
  obj = makeKiCADSchematic( json_container )
elif msg_type == "createJSONSchematic":
  obj = makeJSONSchematic( json_container )
elif msg_type == "createPNG":
  obj = makePNG( json_container );

s = "nothing"
args = cgi.FieldStorage()
for i in args.keys():
  s += ", " + str(i) + " " + str( args[i].value )

obj["args"] = s

print "Content-Type: application/json; charset=utf-8"
print
print json.dumps(obj)


#print "Content-Type: text/html;charset=utf-8"
#print
#form = cgi.FieldStorage()
#for key in form :
#  s += str(key) + str(form[key].value) + ":::"

