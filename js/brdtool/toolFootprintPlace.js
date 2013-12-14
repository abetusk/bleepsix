/*

    Copyright (C) 2013 Abram Connelly

    This file is part of bleepsix v2.

    bleepsix is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    bleepsix is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with bleepsix.  If not, see <http://www.gnu.org/licenses/>.

    Parts based on bleepsix v1. BSD license
    by Rama Hoetzlein and Abram Connelly.

*/

function toolFootprintPlace( mouse_x, mouse_y , footprint_name, footprint_data ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );

  this.angle = 0.0;

  var ref_name = g_controller.board.getReferenceName( g_footprint_cache[ footprint_name ] );

  this.cloned_footprint = {};
  if ( typeof footprint_data === 'undefined' )
  {
    $.extend(true, this.cloned_footprint, g_footprint_cache[ footprint_name ] );
  }
  else
  {
    $.extend(true, this.cloned_footprint, g_footprint_cache[ footprint_name ] );
    //g_controller.board.extendComponentText( this.cloned_footprint, footprint_data );

    this.cloned_footprint.name = footprint_data.name;
    this.angle = 0.0;

    console.log( this.cloned_footprint );

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
}

toolFootprintPlace.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolFootprintPlace.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_x, this.mouse_y, delta ); }


toolFootprintPlace.prototype.drawOverlay = function()
{
  var s = this.cursorSize / 2;


  g_controller.board.drawFootprint( this.cloned_footprint,
                                    parseFloat(this.world_xy["x"]), 
                                    parseFloat(this.world_xy["y"]), 
                                    0, true );
                                    //this.angle, true );

}

toolFootprintPlace.prototype.mouseDown = function( button, x, y )
{

  if (button == 1)
  {

    console.log("toolFootprintPlace: placing footprint: " + this.footprint_name);

    g_controller.board.addFootprintData( this.cloned_footprint, 
                                             this.world_xy["x"], 
                                             this.world_xy["y"] );
                                             //0);
                                             //this.angle );

    console.log("toolFootprintPlace: passing back to toolBoardNav");

    g_controller.tool = new toolBoardNav(x, y);
    //g_controller.tool.mouseMove( x, y );  // easy way to setup?
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

   g_painter.dirty_flag = true;

  }

}

toolFootprintPlace.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    console.log("toolFootprintPlace: passing back to toolNav");

    g_controller.tool = new toolBoardNav( this.mouse_x, this.mouse_y );
    g_painter.dirty_flag = true;

  }
  else if (ch == 'R')
  {
    this.angle += Math.PI / 2.0;
    if (this.angle >=  Math.PI)
       this.angle -= 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_controller.board.rotate90( id_ref, true );

    console.log(" (r) angle now: " + this.cloned_footprint.angle );

    //this.cloned_footprint.angle = this.angle;
    g_painter.dirty_flag = true;
  }

  else if (ch == 'E')
  {
    this.angle -= Math.PI / 2.0;
    if (this.angle < -Math.PI)
      this.angle += 2.0 * Math.PI;

    var id_ref = { id: this.cloned_footprint.id, ref : this.cloned_footprint };
    g_controller.board.rotate90( id_ref, false );

    console.log(" (e) angle now: " + this.cloned_footprint.angle );

    //this.cloned_footprint.angle = this.angle;
    g_painter.dirty_flag = true;
  }
  else if (keycode == 191)
  {
    console.log(g_footprint_cache[this.footprint_name]);
  }

}

toolFootprintPlace.prototype.keyUp = function( keycode, ch, ev  )
{
}

