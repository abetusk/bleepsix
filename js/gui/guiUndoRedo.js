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

function guiUndoRedo( name, bgColor  ) 
{
  bgColor = ((typeof bgColor !== 'undefined') ? bgColor : "rgba(0,0,0,0.25)" );
  this.constructor ( name )   

  this.bgColor = bgColor;

  this.iconWidth = 24;
  this.width = 2*this.iconWidth;

  this.height = this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_x = 0;
  var cur_y = 0;

  // "undo"
  //
  var u = new guiIcon( this.name + ":undo");
  u.init( 0, 0, this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  //u.divColor = "rgba(255,255,255,0.2)";
  u.move(cur_x, cur_y);
  u.drawShape = (function(xx) { return function() { xx.drawUndo(); } } )(this);
  this.addChild( u );

  cur_x += u.width;
  //cur_y += u.height;


  // "redo"
  //
  var b = new guiIcon( this.name + ":redo");
  b.init(0,0, this.iconWidth, this.iconWidth );
  b.bgColor = bgColor;
  b.fgColor = "rgb(255,255,255)";
  //b.divColor = "rgba(255,255,255,0.2)";
  //b.addIcon( this.name + ":layerbottom", (function(s) { return function() { s._draw_bottom_icon(); }; })(this) );
  b.move(cur_x, cur_y);
  b.drawShape = (function(xx) { return function() { xx.drawRedo(); } } )(this);
  this.addChild( b );

  cur_x += b.width;
  //cur_y += b.height;

}
guiUndoRedo.inherits ( guiRegion );

//-------------------------------

guiUndoRedo.prototype.drawUndo = function()
{
  var d = 2;
  var bgColor = "rgba(0,0,0,0.3)";

  var sz = this.iconWidth;

  g_painter.drawRectangle( d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, bgColor );
  g_imgcache.draw( "undo", 0, 0, sz, sz );
}

guiUndoRedo.prototype.drawRedo = function()
{
  var d = 2;
  var bgColor = "rgba(0,0,0,0.3)";
  var sz = this.iconWidth;


  g_painter.drawRectangle( d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, bgColor );
  g_imgcache.draw( "redo", 0, 0, sz, sz );
}

// children will be in weird places, so don't confine it to the box of the
// guiUndoRedo.
//
guiUndoRedo.prototype.hitTest = function(x, y)
{

  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  for (var ind in this.guiChildren )
  {
    if (this.guiChildren[ind].visible)
    {

      var r = this.guiChildren[ind].hitTest(x, y);
      if (r) return r;
    }
  }

  return null;
}


guiUndoRedo.prototype._eventMouseDown = function( ev )
{

  if (ev.owner.match(/:undo$/)) {
    g_schematic_controller.opUndo();
  }

  else if (ev.owner.match(/:redo$/)) {
    g_schematic_controller.opRedo();
  }

}

guiUndoRedo.prototype._eventDoubleClick = function( ev )
{
  console.log("undo/redo double click");
}

guiUndoRedo.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiUndoRedo.prototype.draw = function()
{

}
