
# TODO

## General

* Through hole not rotation properly in gerber production?  for example: CR2032H not rotation
* Produce drill file
* Export issues with zone.  KiCAD expects path not to overlap with any open regions.  Convert
  to appropriate polyscorners so KiCAD doesn't get confused (gerber is fine).
* Fix upload, both in schematic and in board.  Need to decide how exactly to do this.  Add elements
  one at a time?  If a board and a schematic is specified we should try to tie them together?
* Add timestamps to sessions, portfolios and the like.
* Add in name verification to delete project.
* DRC checks for both
* undo/redo batching and server communication
* ~~Cross browser net highlights~~

## Schematic

* Wire "grabbing" instead of free floating pick and move.
* Need cursor icon for label.
* ~~toolWire needs to take into account component rotation when highlighting net~~
* ~~Power lines need to be treated as a net so nets connect in board.~~

## Board

* When splitting nets, the newly created split net isn't persisting across refreshes.  It's not being
  saved in the database?
* Recalculate rats nest after placement of parts and traces
* toolTrace needs to either highlight net show the airwire so we know where we're
  routing to.
* Shift auto placed parts so they don't stack on top of each other.
* toolTrace needs some work with regards to the initial joint pair.  Sometimes it gets confused
  if it intersects geometry initially.
* Move text for modules.
* Add via tool.
* Figure out a way to get custom modules in easily.
* Need cursor for edges, track fcolor, zone and text.
* DXF imports edges/copper.
* ~~Group/Track/Module moves need to ghost if they fall within the forbidden zone.~~
* ~~refLookups are failing.~~
* ~~Element moves need to induce splits and joins for their nets.~~
* ~~There was a hang when trying to add a trace to a via.  Having a hard time reproducing.~~
* ~~Store sch_pin_id_net_map and call updateSchematicNetcodeMap appripriately (bug fix).~~
* ~~zone sometimes makes thin connections to thermal reliefs.~~
* ~~Flip needs to go into opCommand and special consideration needs to be 
  done for through hole parts.~~

