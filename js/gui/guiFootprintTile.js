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

function guiFootprintTile( gui_name, footprint_name ) 
{
  this.constructor ( gui_name )   
  this.footprint_name = footprint_name;
  this.bgColor = "rgba(100, 10, 10, 0.5)";

  this.fudge = 30;

  this.ready = false;

  this.bbox = [ [0, 0], [0,0] ];
  bbox = this.bbox;
  if ( footprint_name in g_footprint_cache )
  {
    this.bbox = g_footprint_cache[ footprint_name ]["coarse_bounding_box"];
    bbox = this.bbox;
    this.ready = true;
  }

  this.footprint_width  = bbox[1][0] - bbox[0][0] + this.fudge;
  this.footprint_height = bbox[1][1] - bbox[0][1] + this.fudge;

  var mM = Math.max( this.footprint_width, this.footprint_height );

  this.rescale = 1.0;
  if (mM > 0)
    this.rescale = this.width / mM;


  // debugging...
  this.uniq = parseInt(256.0*Math.random());
  this.bgColor = "rgba(" + this.uniq + ",0,0," + "0.2)";

  this.guiPickCallback = null;

  this.once = false;

  console.log("guiFootprintTile loaded");

}

guiFootprintTile.inherits ( guiRegion );

guiFootprintTile.prototype.registerPickCallback = function( f ) 
{
  this.guiPickCallback = f;
}

guiFootprintTile.prototype.refresh = function()
{

  this.bbox = [ [0, 0], [0,0] ];
  bbox = this.bbox;
  if ( this.footprint_name in g_footprint_cache )
  {
    this.bbox = g_footprint_cache[ this.footprint_name ]["coarse_bounding_box"];
    bbox = this.bbox;
    this.ready = true;

  }

  this.footprint_width  = bbox[1][0] - bbox[0][0] + this.fudge;
  this.footprint_height = bbox[1][1] - bbox[0][1] + this.fudge;

  var mM = Math.max( this.footprint_width, this.footprint_height );

  this.rescale = 1.0;
  if (mM > 0)
    this.rescale = this.width / mM;

}


guiFootprintTile.prototype.draw = function()
{

  this.refresh();

  if (this.ready )
  {
    if ( this.footprint_name in g_footprint_cache )
    {

      var r = this.rescale;
      var s = this.width / 2;

      var com_x = r * (this.bbox[1][0] + this.bbox[0][0])/2.0;
      var com_y = r * (this.bbox[1][1] + this.bbox[0][1])/2.0;

      // "identity".  KiCAD reverses the Y direction
      //
      var identity = [ [ 1, 0], [0, -1] ];
      var orientation = 0.0;

      g_painter.context.save();
      g_painter.context.transform( r, 0, 0, r, s-com_x, s+com_y );
      //g_controller.schematic.drawComponent( g_footprint_cache[this.footprint_name], 0, 0, identity, true );
      //g_controller.board.drawComponent( g_footprint_cache[this.footprint_name], 0, 0, identity, true );
      g_board_controller.board.drawFootprint( g_footprint_cache[this.footprint_name], 0, 0, orientation, true );
      g_painter.context.restore();


    }
    else
    {
      console.log("guiFootprintTile: " + this.footprint_name + " not loaded, not rendering");
    }

  }
  else
  {
    g_painter.drawRectangle( 0, 0, this.width, this.height,  
                             0, "rgb(0,0,0)", 
                             true, this.bgColor );

  }

}

 
