
var bleepsixSchematic = require("./bleepsixSchematicNode.js");
var bleepsixSchematicController = require("./bleepsixSchematicController.js");

var sch = new bleepsixSchematic();
var g_schematic_controller = new bleepsixSchematicController();

console.log( sch.kicad_sch_json );

console.log( g_schematic_controller.schematic.kicad_sch_json );
