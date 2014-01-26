// TODO: 
//   - do incremental updates instead of wholesale copies
//   - read and store history from database so undo isn't tied to the session

if (typeof module !== 'undefined')
{
  var bleepsixSchematic = require("./bleepsixSchematic.js");
  module.exports = bleepsixSchematic;
}

bleepsixSchematic.prototype.eventInit = function()
{
  this.eventStack = { n : 0, pos : 0, stack : [] };
}

bleepsixSchematic.prototype.eventPrint = function()
{
  console.log("bleepsixSchematic.eventPrint: n " + this.eventStack.n + ", pos " + this.eventStack.pos );
  console.log(this.eventStack.stack);
}


bleepsixSchematic.prototype.eventSave = function()
{

  console.log("bleepsixSchematic.eventSave neutered!");
  return;

  var n = this.eventStack.n;
  var p = this.eventStack.pos;

  if (n == 0)
  {
    this.eventStack.stack[0] = {};
    this.eventStack.n = 1;
    this.eventStack.pos = 0;
    $.extend( true, this.eventStack.stack[0], this.kicad_sch_json );
    return;
  }

  var p = this.eventStack.pos+1;

  this.eventStack.stack[p] = {};
  $.extend( true, this.eventStack.stack[p], this.kicad_sch_json );

  this.eventStack.pos++;
  this.eventStack.n = this.eventStack.pos+1;

}

bleepsixSchematic.prototype.eventUndo = function()
{
  var p = this.eventStack.pos-1;

  if (p<0)
  {
    console.log("last undo reached");
    return;
  }

  this.kicad_sch_json = {};
  $.extend( true, this.kicad_sch_json, this.eventStack.stack[p] );
  this.eventStack.pos--;

  g_painter.dirty_flag = true;
  g_schematic_controller.schematicUpdate = true;
}

bleepsixSchematic.prototype.eventRedo = function()
{
  var p = this.eventStack.pos+1;
  var n = this.eventStack.n;

  if (p >= n)
  {
    console.log("end of redo reached");
    return;
  }

  this.kicad_sch_json = {};
  $.extend( true, this.kicad_sch_json, this.eventStack.stack[p] );
  this.eventStack.pos++;

  g_painter.dirty_flag = true;
  g_schematic_controller.schematicUpdate = true;

}


