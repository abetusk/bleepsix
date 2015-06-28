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

function guiBoardLayer( name, bgColor  ) 
{
  bgColor = ((typeof bgColor !== 'undefined') ? bgColor : "rgba(255,255,255,0.4)" );
  this.constructor ( name )   

  this.bgColor = bgColor;

  this.iconWidth = 24;
  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;

  // "top" layers
  //
  var u = new guiDropIcon( this.name + ":droplayertop", this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon( this.name + ":layertop0", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,0)  );
  u.addIcon( this.name + ":layertop1", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,1)  );
  u.addIcon( this.name + ":layertop2", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,2)  );
  u.addIcon( this.name + ":layertop15", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,15)  );
  u.move(0, cur_y);

  this.dropLayerTop = u;
  this.addChild( u );

  cur_y += u.height;


  // "bottom" layers
  //
  var b = new guiDropIcon( this.name + ":doprlayerbottom", this.iconWidth, this.iconWidth );
  b.bgColor = bgColor;
  b.fgColor = "rgb(255,255,255)";
  b.divColor = "rgba(255,255,255,0.2)";
  b.addIcon( this.name + ":layerbottom15", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,15) );
  b.addIcon( this.name + ":layerbottom1", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this, 1) );
  b.addIcon( this.name + ":layerbottom2", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this, 2) );
  b.addIcon( this.name + ":layerbottom0", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this, 0) );
  b.move(0, cur_y);

  this.dropLayerBottom = b;
  this.addChild( b );

  cur_y += b.height;

  this.dropLayerTop.selected = true;
  this.dropLayerBottom.selected = false;

  // Most of these values should be passed in from the controller, say.
  // For now we hardcode them here.
  //
  this.layerPair = [0, 15];
  this.layerIndex = 0;
  this.layerMap = { 0:0, 15:1, 1:2, 2:3 };
  this.layerColor = { 0:"rgba(0,255,0,0.4)", 15:"rgba(255,0,0,0.4)", 1:"rgba(0,255,255,0.4)", 2:"rgba(255,127,0,0.4)" };
  this.selectedLayer = this.layerPair[ this.layerIndex ] ;

}

guiBoardLayer.inherits ( guiRegion );

//-------------------------------

guiBoardLayer.prototype._draw_layer_icon = function(layer_num)
{
  var sx = this.iconWidth/2;
  var sy = this.iconWidth/2;
  var d = 2;
  var textColor = "rgba(0,0,0,0.5)";
  var fgColor = this.layerColor[layer_num];

  g_painter.drawRectangle(d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, fgColor);
  g_painter.drawTextSimpleFont(layer_num, sx, sy, textColor, 15, "Calibri");
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

guiBoardLayer.prototype._eventMouseDown = function( ev )
{
  var re;

  if ( re = ev.owner.match(/:layertop(\d+)$/) )
  {
    var layerNum = re[1];
    this.dropLayerTop.contract();
    this.dropLayerBottom.contract();
    this.dropLayerTop.selected = true;
    this.dropLayerBottom.selected = false;

    this.layerIndex = 0;
    this.layerPair[0] = layerNum;
    this.selectedLayer = parseInt(layerNum);
  }

  else if ( re = ev.owner.match(/:layerbottom(\d+)$/) )
  {
    var layerNum = re[1];
    this.dropLayerTop.contract();
    this.dropLayerBottom.contract();
    this.dropLayerTop.selected = false;
    this.dropLayerBottom.selected = true;

    this.layerIndex = 1;
    this.layerPair[1] = layerNum;
    this.selectedLayer = parseInt(layerNum);
  }

  else if (ev.owner == this.name + ":droplayertop:tab")
  {
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
  this.selectedLayer = this.layerPair[ this.layerIndex ] ;

}

guiBoardLayer.prototype.getActiveLayer = function()
{
  return this.layerPair[ this.layerIndex ];
}

guiBoardLayer.prototype.getInactiveLayer = function()
{
  var ind = (this.layerIndex + 1)%2;
  return this.layerPair[ ind ];
}

guiBoardLayer.prototype.draw = function() { }
