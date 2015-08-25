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


function toolHelp( x, y, viewMode ) 
{
  this.viewMode = ( (typeof viewMode === 'undefined') ? false : viewMode );
  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );

  this.x = x;
  this.y = y;

  g_painter.dirty_flag=true;

}


toolHelp.prototype.drawOverlay = function()
{
  var x=100, y=100, w=700, h=500;
  var txt_x=110, txt_y=110, txt_dy=20;
  var text_color = "rgba(0,0,0,0.7)";
  var font_height = 18;
  var hjustify="L", vjustify="T";

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";

  var M = g_painter.transform;
  g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

  g_painter.fillRect( x+w/2, y+h/2, w, h, "rgba(0,0,0,0.1)");

  g_painter.drawText( "Welcome to MeowCAD help!",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "Press any key or click the mouse to clear this screen!",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  txt_y+=txt_dy

  g_painter.drawText( "1/2/3 - Set grid style (none/dots/grid)",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "W     - Wire",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "D     - Delete",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "X     - No-connect",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "R/E   - Rotate CCW/CW",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "Y     - Flip",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "J     - Wire-connect (joint)",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "L     - Label (named net)",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "[/]   - Undo/Redo (session only)",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "</>   - Zoom Out/In (','/'.' also work)",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( "~     - Toggle debug view",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  txt_y+=txt_dy

  g_painter.drawText( "To associate an unknown part,",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.drawText( " drag and place a part over the component in the schematic",
      txt_x, txt_y, text_color, font_height, 0, hjustify, vjustify);
  txt_y+=txt_dy;

  g_painter.context.setTransform( M[0][0], M[1][0], M[0][1], M[1][1], M[0][2], M[1][2] );
}

toolHelp.prototype.mouseDown = function( button, x, y ) 
{
  g_schematic_controller.tool = new toolNav();
  g_schematic_controller.guiToolbox.defaultSelect();

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";

  g_painter.dirty_flag=true;
  return true;
}


/*
toolHelp.prototype.doubleClick = function(button, x, y) { }
toolHelp.prototype.mouseUp = function( button, x, y ) { }
toolHelp.prototype.mouseDrag = function( dx, dy ) { }
toolHelp.prototype.mouseWheel = function( delta ) { }
toolHelp.prototype.mouseMove = function( x, y ) { g_painter.dirty_flag=true; }
*/

toolHelp.prototype.keyDown = function( keycode, ch, ev )
{
  g_schematic_controller.tool = new toolNav();
  g_schematic_controller.guiToolbox.defaultSelect();

  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";

  return true;
}

toolHelp.prototype.keyUp = function( keycode, ch, ev ) { }
