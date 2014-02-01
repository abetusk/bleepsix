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

function guiBoardLayer( name, bgColor  ) 
{
  bgColor = ((typeof bgColor !== 'undefined') ? bgColor : "rgba(255,255,255,0.4)" );
  this.constructor ( name )   

  //this.bgColor = "rgba( 0, 0, 255, 0.2 )";
  this.bgColor = bgColor;

  this.iconWidth = 24;
  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;

  // "top" layer
  //
  var u = new guiDropIcon( this.name + ":droplayertop", this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon( this.name + ":layertop", (function(s) { return function() { s._draw_top_icon(); }; })(this)  );
  u.move(0, cur_y);

  this.dropLayerTop = u;
  this.addChild( u );

  cur_y += u.height;


  // "bottom" layer
  //
  var b = new guiDropIcon( this.name + ":doprlayerbottom", this.iconWidth, this.iconWidth );
  b.bgColor = bgColor;
  b.fgColor = "rgb(255,255,255)";
  b.divColor = "rgba(255,255,255,0.2)";
  b.addIcon( this.name + ":layerbottom", (function(s) { return function() { s._draw_bottom_icon(); }; })(this) );
  b.move(0, cur_y);

  this.dropLayerBottom = b;
  this.addChild( b );

  cur_y += b.height;

  this.dropLayerTop.selected = true;
  this.dropLayerBottom.selected = false;

  this.layer = [ 0, 15 ];
  this.layerIndex = 0;
  this.selectedLayer = this.layer[ this.layerIndex ] ;

}

guiBoardLayer.inherits ( guiRegion );

//-------------------------------

guiBoardLayer.prototype._draw_top_icon = function()
{
  var sx = this.iconWidth/2;
  var sy = this.iconWidth/2;
  var d = 2;
  var textColor = "rgba(0,0,0,0.5)";
  var fgColor = "rgba(0,255,0,0.3)";

  g_painter.drawRectangle( d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, fgColor );
  //g_painter.drawTextSimpleFont( "0", sx, sy, textColor, 15, "Calibri");
  g_painter.drawTextSimpleFont( this.layer[0], sx, sy, textColor, 15, "Calibri");
}

guiBoardLayer.prototype._draw_bottom_icon = function()
{
  var sx = this.iconWidth/2;
  var sy = this.iconWidth/2;
  var d = 2;
  var textColor = "rgba(0,0,0,0.5)";
  var fgColor = "rgba(255,0,0,0.3)";

  g_painter.drawRectangle( d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, fgColor );
  //g_painter.drawTextSimpleFont( "15", sx, sy, textColor, 15, "Calibri");
  g_painter.drawTextSimpleFont( this.layer[1], sx, sy, textColor, 15, "Calibri");
}

// children will be in weird places, so don't confine it to the box of the
// guiBoardLayer.
//
guiBoardLayer.prototype.hitTest = function(x, y)
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

/*
guiBoardLayer.prototype._handleTopEvent = function(ev)
{

  if (ev.owner == this.name + ":layertop")
  {
    console.log(" layertop");
  }

}


guiBoardLayer.prototype._handleBottomEvent = function(ev)
{
  if (ev.owner == this.name + ":layerbottom")
  {
    console.log(" layerbottom");
  }

}
*/

guiBoardLayer.prototype._eventMouseDown = function( ev )
{

  if ( ev.owner.match(/:layertop$/) )
  {
    console.log("layertop");
    this.dropLayerTop.contract();
    this.dropLayerBottom.contract();
    this.dropLayerTop.selected = true;
    this.dropLayerBottom.selected = false;

    this.selectedLayer = this.layer[0];
  }

  else if ( ev.owner.match(/:layerbottom$/) )
  {
    console.log("layerbottom");
    this.dropLayerTop.contract();
    this.dropLayerBottom.contract();
    this.dropLayerTop.selected = false;
    this.dropLayerBottom.selected = true;

    this.selectedLayer = this.layer[1];
  }

  else if (ev.owner == this.name + ":droplayertop:tab")
  {
    console.log("  layertop tab!");

    if (this.dropLayerTop.showDropdown)
    {
      this.dropLayerBottom.contractSlim();
    }
    else
    {
      this.dropLayerBottom.contract();
    }
  }

  else if (ev.owner == this.name + ":droplayerbottom:tab")
  {
    console.log("  layerbottom tab");

    this.dropLayerTop.contract();
  }

}

guiBoardLayer.prototype._eventDoubleClick = function( ev )
{
  console.log("gui board layer double click");
}

guiBoardLayer.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiBoardLayer.prototype.toggleLayer = function()
{
  this.dropLayerTop.selected = !this.dropLayerTop.selected ; 
  this.dropLayerBottom.selected = !this.dropLayerBottom.selected ;

  this.layerIndex = (this.layerIndex + 1)%2;
  this.selectedLayer = this.layer[ this.layerIndex ] ;

}

guiBoardLayer.prototype.draw = function()
{

}


