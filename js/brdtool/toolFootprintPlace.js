/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/

function toolFootprintPlace( mouse_x, mouse_y , footprint_name, footprint_data ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );

  this.angle = 0.0;

  var ref_name = g_board_controller.board.getReferenceName( g_footprint_cache[ footprint_name ] );

  this.cloned_footprint = {};
  if ( typeof footprint_data === 'undefined' )
  {
    $.extend(true, this.cloned_footprint, g_footprint_cache[ footprint_name ] );
  }
  else
  {
    $.extend(true, this.cloned_footprint, g_footprint_cache[ footprint_name ] );
    //g_board_controller.board.extendComponentText( this.cloned_footprint, footprint_data );

    this.cloned_footprint.name = footprint_data.name;
    this.angle = 0.0;

    //console.log( this.cloned_footprint );

  }

  //this.cloned_footprint.text[0].reference = ref_name;

  this.mouse_x = mouse_x;
  this.mouse_y = mouse_y;
  this.footprint_name = footprint_name;

  this.mouse_drag_button = false;

  //this.drawHighlightRect = true;
  this.drawHighlightRect = false;

  this.world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.snap_world_xy = g_snapgrid.snapGrid (this.world_xy);

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.highlightId = null;

  this.groupId = String(guid());
}

toolFootprintPlace.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolFootprintPlace.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_x, this.mouse_y, delta ); }


toolFootprintPlace.prototype.drawOverlay = function()
{
  var s = this.cursorSize / 2;


  g_board_controller.board.drawFootprint( this.cloned_footprint,
                                    parseFloat(this.world_xy["x"]), 
                                    parseFloat(this.world_xy["y"]), 
                                    0, true );
                                    //this.angle, true );

  if (this.highlightId)
  {
    var ref = g_board_controller.board.refLookup( this.highlightId );
    var bbox = ref.bounding_box;
    var x = bbox[0][0];
    var y = bbox[0][1];
    var w = bbox[1][0] - x;
    var h = bbox[1][1] - y;

    g_painter.drawRectangle( x, y, w, h, 100, "rgb(128,128,128)", true, "rgba(255,255,255,0.25)");
  }
}

toolFootprintPlace.prototype.mouseDown = function( button, x, y )
{

  if (button == 1)
  {

    // Generate new nets for each of the pads about to be created
    //
    for (var p_ind in this.cloned_footprint.pad )
    {
      var net_obj = g_board_controller.board.genNet();

      var net_op = { source : "brd" , destination: "brd" };
      net_op.action = "add";
      net_op.type = "net";
      net_op.data = { net_number : net_obj.net_number,
                      net_name : net_obj.net_name };
      net_op.groupId = this.groupId;
      g_board_controller.opCommand(net_op);

      var pad = this.cloned_footprint.pad[p_ind];
      pad.net_number = net_obj.net_number;
      pad.net_name = net_obj.net_name;
    }

    if (this.highlightId)
    {
      var ref = g_board_controller.board.refLookup( this.highlightId );
      var saved_ref = simplecopy(ref);

      var tx = ref.x;
      var ty = ref.y;

      this.cloned_footprint.id = ref.id;
      this.cloned_footprint.x = ref.x;
      this.cloned_footprint.y = ref.y;

      this.cloned_footprint.text[0].text = ref.text[0].text;
      this.cloned_footprint.text[1].text = ref.text[1].text;

      if ( (this.cloned_footprint.type == "module") &&
           (this.cloned_footprint.name != "unknown") )
      {
        var pads = this.cloned_footprint.pad;
        for (var ind in pads)
        {
          var pad = pads[ind];
          if (!("id" in pad))
            pad.id = g_board_controller.board._createId( this.cloned_footprint.id );
        }
      }


      var op = { source: "brd", destination: "brd" };
      op.action = "update";
      op.type = "edit";
      op.id = [ ref.id ];
      op.data = { element : [ this.cloned_footprint ] , oldElement : [ saved_ref ] };
      op.groupId = this.groupId;
      g_board_controller.opCommand( op );

      g_board_controller.tool = new toolBoardNav(x, y);
      g_painter.dirty_flag = true;


      var net_op = { source : "brd", destination: "sch" };
      net_op.action = "update";
      net_op.type = "schematicnetmap";
      net_op.groupId = this.groupId;
      g_board_controller.opCommand( net_op );

      //var sch_pin_id_net_map = g_board_controller.schematic.getPinNetMap();
      //g_board_controller.board.updateSchematicNetcodeMap( sch_pin_id_net_map );

      var map = g_board_controller.board.kicad_brd_json.brd_to_sch_net_map;
      g_board_controller.board.updateRatsNest( undefined, undefined, map );


      //console.log("TESTING");
      return;
    }

    //console.log("toolFootprintPlace: placing footprint: " + this.footprint_name);

    var op = { source : "brd" , destination: "brd" };
    op.action = "add";
    op.type = "footprintData";
    op.data = { footprintData : this.cloned_footprint, x: this.world_xy.x, y: this.world_xy.y };
    op.groupId = this.groupId;
    g_board_controller.opCommand( op );

    /*
    g_board_controller.board.addFootprintData( this.cloned_footprint, 
                                             this.world_xy["x"], 
                                             this.world_xy["y"] );
                                             //0);
                                             //this.angle );
                                             */

    //console.log("toolFootprintPlace: passing back to toolBoardNav");

    g_board_controller.tool = new toolBoardNav(x, y);
    //g_board_controller.tool.mouseMove( x, y );  // easy way to setup?
    g_painter.dirty_flag = true;
  }
  else if (button == 3)
  {
    this.mouse_drag_button = true;
  }


}

toolFootprintPlace.prototype.mouseUp = function( button, x, y )
{
  this.mouse_drag_button = false;
}

toolFootprintPlace.prototype._moduleWithinReplaceDistance = function( ref )
{
  if ( ref.name == "unknown" )
  {
    return true;
  }

  var dist = 500;
  var x = ref.x;
  var y = ref.y;

  var dx = Math.abs( x - this.world_xy.x );
  var dy = Math.abs( y - this.world_xy.y );

  if ((dx < dist) && (dy < dist))
    return true;

  return false;

}


toolFootprintPlace.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_button)
    this.mouseDrag ( x - this.mouse_x, y - this.mouse_y );

  this.mouse_x = x;
  this.mouse_y = y;

  if (!this.mouse_drag_button)
  {
    this.world_xy = g_painter.devToWorld( this.mouse_x, this.mouse_y );
    this.world_xy = g_snapgrid.snapGrid( this.world_xy );

    var id_ref = g_board_controller.board.pick( this.world_xy.x, this.world_xy.y );
    if (id_ref && (id_ref.ref.type == "module"))
    {
      this.highlightId = ( this._moduleWithinReplaceDistance( id_ref.ref ) ? id_ref.id : null );
    }
    else
      this.highlightId = null;

   g_painter.dirty_flag = true;

  }

}

toolFootprintPlace.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    //console.log("toolFootprintPlace: passing back to toolNav");

    g_board_controller.tool = new toolBoardNav( this.mouse_x, this.mouse_y );
    g_painter.dirty_flag = true;

  }
  else if (ch == 'R')
  {
    this.angle += Math.PI / 2.0;
    if (this.angle >=  Math.PI)
       this.angle -= 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_board_controller.board.rotate90( id_ref, true );

    //console.log(" (r) angle now: " + this.cloned_footprint.angle );

    //this.cloned_footprint.angle = this.angle;
    g_painter.dirty_flag = true;
  }

  else if (ch == 'E')
  {
    this.angle -= Math.PI / 2.0;
    if (this.angle < -Math.PI)
      this.angle += 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_board_controller.board.rotate90( id_ref, false );

    //console.log(" (e) angle now: " + this.cloned_footprint.angle );

    //this.cloned_footprint.angle = this.angle;
    g_painter.dirty_flag = true;
  }
  else if (keycode == 191)
  {
    //console.log(g_footprint_cache[this.footprint_name]);
  }

}

toolFootprintPlace.prototype.keyUp = function( keycode, ch, ev  )
{
}

toolFootprintPlace.prototype.update = function( x, y )
{
}


