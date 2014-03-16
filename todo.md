
# TODO

## General

* Export issues with zone.  KiCAD expects path not to overlap with any open regions.  Convert
  to appropriate polyscorners so KiCAD doesn't get confused (gerber is fine).
* Fix upload, both in schematic and in board.  Need to decide how exactly to do this.  Add elements
  one at a time?  If a board and a schematic is specified we should try to tie them together?
* Add timestamps to sessions, portfolios and the like.
* 


## Schematic

* Wire "grabbing" instead of free floating pick and move.
* Need cursor icon for label.
* Power lines need to be treated as a net so nets connect in board.

## Board

* There was a hang when trying to add a trace to a via.  Having a hard time reproducing.
* Figure out a way to get custom modules in easily.
* Store sch_pin_id_net_map and call updateSchematicNetcodeMap appripriately (bug fix).
* Add via tool.
* Shift auto placed parts so they don't stack on top of each other.
* Move text for modules.
* Need cursor for edges, track fcolor, zone and text.
* DXF imports edges/copper.

