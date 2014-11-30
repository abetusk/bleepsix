
// Wrapper to include proper last file
// in the daisy chain.

if (typeof module !== 'undefined')
{
  //var bleepsixSchematic = require("./bleepsixSchematic_event.js");
  var bleepsixSchematic = require("./bleepsixSchematic_net.js");
  module.exports = bleepsixSchematic;
}
