#!/usr/bin/python

import re
import cgi
import cgitb
import sys
import json
import uuid
import redis
import subprocess as sp
import zipfile as zf

#print "Content-Type: text/html; charset=utf-8;"
#print


cgitb.enable();

jsonsch_exec = "/home/meow/pykicad/jsonsch.py"
jsonbrd_exec = "/home/meow/pykicad/jsonbrd.py"

brdgrb_exec = "/home/meow/pykicad/brdgerber.py"
grbngc_exec = "/home/meow/bin/gbl2ngc"
font_file = "/home/meow/pykicad/aux/hershey_ascii.json"

staging_base = "/home/meow/stage"

def debugPrint( s ):
  f = open("/tmp/meow.log", "a")
  f.write( s )
  f.close()

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
    error_and_quit(e, sch_json_fn)

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

def readyProjectZipfile( json_message ):

  try:
    zip_uid = uuid.uuid4()


    # Put json data structures into files
    #
    sch_json_uid, brd_json_fn = dumpToFile( json.dumps(json_message["board"], indent=2) )
    brd_json_uid, sch_json_fn = dumpToFile( json.dumps(json_message["schematic"], indent=2) )

    # Create KiCAD schematic and board files
    #
    kicad_sch = sp.check_output( [jsonsch_exec, sch_json_fn ] );
    sch_uid, sch_fn  = dumpToFile( kicad_sch )

    kicad_brd = sp.check_output( [jsonbrd_exec, brd_json_fn ] );
    brd_uid, brd_fn = dumpToFile( kicad_brd )

    # Go through relevant layers and create gerber and gcode files for each
    #
    layers = { 0 : "F_Cu", 15 : "B_Cu", 20 : "F_Si", 21 : "B_Si", 28 : "Edge" }
    gerber_files = []
    gcode_files = []
    for layer in layers:

      grbr = sp.check_output( [brdgrb_exec, str(brd_fn), str(layer), str(font_file) ] )
      gerber_uid, gerber_fn = dumpToFile( grbr )
      gerber_files.append( { "id": gerber_uid , "filename" : gerber_fn, "layer" : layer } )

      radius_decithou = "0.002"
      gcode = sp.check_output( [ grbngc_exec, "--radius", radius_decithou, "--input", gerber_fn  ] )
      gcode_uid, gcode_fn = dumpToFile( gcode )
      gcode_files.append( { "id" : gcode_uid, "filename" : gcode_fn, "layer" : layer } )

    projname = "project"

    zip_fn = str(staging_base) + "/" + str(zip_uid)

    # http://stackoverflow.com/questions/9289734/linux-how-to-add-a-file-to-a-specific-folder-within-a-zip-file
    z = zf.ZipFile( str(zip_fn), "a" )
    z.write( sch_json_fn, projname + "/json/schematic.json" )
    z.write( brd_json_fn, projname + "/json/board.json" )
    z.write( sch_fn, projname + "/KiCAD/schematic.sch" )
    z.write( brd_fn, projname + "/KiCAD/board.brd" )


    for f in gerber_files:
      z.write( f["filename"], projname + "/gerber/board-" + layers[ int(f["layer"]) ] )

    for f in gcode_files:
      z.write( f["filename"], projname + "/gcode/board-" + layers[ int(f["layer"]) ] )

    z.close()

  except Exception as e:
    error_and_quit(e, "...")

  obj = { "type": "id", "id" : str(zip_uid), "notes" : "zip project file", "name" : "project.zip"  }
  return obj




try:
  json_container = json.load(sys.stdin);
except Exception as e:
  error_and_quit(e, "stdin")


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
elif msg_type == "downloadProject":

  obj = readyProjectZipfile( json_container )

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

