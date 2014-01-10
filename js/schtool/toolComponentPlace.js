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


// Need to figure out if we keep the type specific component operations here
// or move them somewhere else.
// Yeah, it's pretty bad.  We'll have to figure out a way to make it more consistent
// and robust.
//

function toolComponentPlace( mouse_x, mouse_y , component_name , component_data ) 
{

  mouse_x = ( typeof mouse_x !== 'undefined' ? mouse_x : 0 );
  mouse_y = ( typeof mouse_y !== 'undefined' ? mouse_y : 0 );

  this.transform = [ [ 1, 0], [0, -1] ];

  var ref_name = g_controller.schematic.getReferenceName( g_component_cache[ component_name ] );

  this.cloned_component = {};
  if ( typeof component_data === 'undefined' )
  {
    $.extend(true, this.cloned_component, g_component_cache[ component_name ] );
  }
  else
  {
    $.extend(true, this.cloned_component, g_component_cache[ component_name ] );
    g_controller.schematic.extendComponentText( this.cloned_component, component_data );

    this.cloned_component.name = component_data.name;

    console.log( this.cloned_component );

    this.transform[0][0] = component_data.transform[0][0];
    this.transform[0][1] = component_data.transform[0][1];
    this.transform[1][0] = component_data.transform[1][0];
    this.transform[1][1] = component_data.transform[1][1];

  }

  this.cloned_component.text[0].reference = ref_name;

  this.mouse_x = mouse_x;
  this.mouse_y = mouse_y;
  this.component_name = component_name;

  this.mouse_drag_button = false;
  

  this.drawHighlightRect = true;

  this.world_xy = g_painter.devToWorld( mouse_x, mouse_y );
  this.snap_world_xy = g_snapgrid.snapGrid (this.world_xy);

  this.cursorSize = 6;
  this.cursorWidth = 1;
}

toolComponentPlace.prototype.mouseDrag  = function( dx, dy ) { g_painter.adjustPan( dx, dy ); }
toolComponentPlace.prototype.mouseWheel = function( delta )  { g_painter.adjustZoom ( this.mouse_x, this.mouse_y, delta ); }


toolComponentPlace.prototype.drawOverlay = function()
{
  var s = this.cursorSize / 2;


  g_controller.schematic.drawComponent( this.cloned_component,
                                        parseFloat(this.world_xy["x"]), 
                                        parseFloat(this.world_xy["y"]), 
                                        this.transform, true );

}

toolComponentPlace.prototype.mouseDown = function( button, x, y )
{

  if (button == 1)
  {

    console.log("toolComponentPlace: placing component: " + this.component_name);

    //g_controller.schematic.addComponent( this.component_name, this.world_xy["x"], this.world_xy["y"], this.transform );
    g_controller.schematic.addComponentData( this.cloned_component, 
                                             this.world_xy["x"], 
                                             this.world_xy["y"], 
                                             this.transform );
    g_controller.schematicUpdate = true;

    console.log("toolComponentPlace: passing back to toolNav");

    g_controller.tool = new toolNav();
    g_controller.tool.mouseMove( x, y );  // easy way to setup?
    g_painter.dirty_flag = true;
  }
  else if (button == 3)
  {
    this.mouse_drag_button = true;
  }


}

toolComponentPlace.prototype.mouseUp = function( button, x, y )
{
  this.mouse_drag_button = false;
}

toolComponentPlace.prototype.mouseMove = function( x, y )
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

toolComponentPlace.prototype.keyDown = function( keycode, ch, ev )
{

  if (keycode == 27)
  {

    console.log("toolComponentPlace: passing back to toolNav");

    // pass control back to toolNav
    g_controller.tool = new toolNav();
    g_controller.tool.mouseMove( this.mouse_x, this.mouse_y );  // easy way to setup?
    g_painter.dirty_flag = true;


  }
  else if (ch == 'R')
  {
    var rot = [ [ 0, 1], [-1, 0] ];
    this.transform = numeric.dot( rot, this.transform );
    g_painter.dirty_flag = true;
  }

  else if (ch == 'T')
  {
    var rot = [ [ 0, -1], [1, 0] ];
    this.transform = numeric.dot( rot, this.transform );
    g_painter.dirty_flag = true;
  }
  else if (keycode == 191)
  {
    console.log(g_component_cache[this.component_name]);
  }

}

toolComponentPlace.prototype.keyUp = function( keycode, ch, ev  )
{
}


