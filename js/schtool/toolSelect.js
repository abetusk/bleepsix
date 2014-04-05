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

function toolSelect( x, y) 
{

  //console.log("toolSelect");

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.orig_world_coord = g_painter.devToWorld( x, y );
  this.cur_world_coord = g_painter.devToWorld( x, y );

  this.select_box_threshold_size = 50;
  this.drawing_box_flag = false;

  this.mouse_drag_flag = false;

}

toolSelect.prototype.drawOverlay = function()
{
  if (this.drawing_box_flag)
  {


    var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
    var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

    var w = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"] );
    var h = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"] );

    g_painter.drawRectangle( mx, my, w, h, 10, "rgb(128, 128, 128)" );
  }
}

toolSelect.prototype.mouseDown = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = true;

}

toolSelect.prototype.mouseUp = function( button, x, y )
{

  if (button == 3)
    this.mouse_drag_flag = false;

  var world_coord = g_painter.devToWorld(x, y);

  if (button == 1)
  {
    if (this.drawing_box_flag)
    {
      var mx = Math.min( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var my = Math.min( this.cur_world_coord["y"], this.orig_world_coord["y"] );

      var Mx = Math.max( this.cur_world_coord["x"], this.orig_world_coord["x"] );
      var My = Math.max( this.cur_world_coord["y"], this.orig_world_coord["y"] );

      var id_ref_ar = g_schematic_controller.schematic.pickBox( mx, my, Mx, My );


      if (id_ref_ar.length > 0)
      {
        g_schematic_controller.tool = new toolMove(x, y);
        g_schematic_controller.tool.addElement( id_ref_ar );

        g_painter.dirty_flag = true;
      }
      else
      {
        g_schematic_controller.tool = new toolNav(x,y);
        g_painter.dirty_flag = true;
      }

    }
    else
    {
      var id_ref_ele = g_schematic_controller.schematic.pick( world_coord["x"], world_coord["y"] );

      if (id_ref_ele)
      {

        g_schematic_controller.tool = new toolMove(x, y);
        g_schematic_controller.tool.addElement( [ id_ref_ele ] );

        g_painter.dirty_flag = true;
      }
      else
      {
        g_schematic_controller.tool = new toolNav(x, y);
        g_painter.dirty_flag = true;
      }

    }

  }

}

toolSelect.prototype.mouseMove = function( x, y )
{

  if (this.mouse_drag_flag)
    this.mouseDrag( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (!this.mouse_drag_flag)
  {

    this.cur_world_coord = g_painter.devToWorld( x, y );

    var tx = this.cur_world_coord["x"];
    var ox = this.orig_world_coord["y"];

    var ty = this.cur_world_coord["x"];
    var oy = this.orig_world_coord["y"];

    var dx = Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"]) ;
    var dy = Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"]) ;

    if ( ( Math.abs( this.cur_world_coord["x"] - this.orig_world_coord["x"]) > this.select_box_threshold_size ) ||
         ( Math.abs( this.cur_world_coord["y"] - this.orig_world_coord["y"]) > this.select_box_threshold_size ) )
      this.drawing_box_flag = true;

  }


  if (this.drawing_box_flag == true)
    g_painter.dirty_flag = true;

}

toolSelect.prototype.mouseDrag = function( dx, dy )
{
  g_painter.adjustPan( dx, dy );
}

toolSelect.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom( this.mouse_cur_x, this.mouse_cur_y, delta );
}

toolSelect.prototype.keyDown = function( keycode, ch, ev )
{
}

toolSelect.prototype.keyUp = function( keycode, ch, ev  )
{
}


