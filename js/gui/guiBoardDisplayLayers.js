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

function guiBoardDisplayLayers(name, bgColor) 
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

  this.layer_desc = { 0: "B.Cu", 1:"Inner1.Cu", 2:"Inner2.Cu", 15:"F.Cu",
                      20:"B.SilkS", 21:"F.SilkS", 22:"B.SolderM", 23:"F.SolderM", 28:"Edge.Cuts" }

  // "top" layers
  //
  var u = new guiDropIcon( this.name + ":displaylayer", this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon(this.name + ":layerval:HiC", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,"HiC") );
  u.addIcon(this.name + ":layerval:0", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,0) );
  u.addIcon(this.name + ":layerval:1", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,1) );
  u.addIcon(this.name + ":layerval:2", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,2) );
  u.addIcon(this.name + ":layerval:15", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,15) );
  u.addIcon(this.name + ":layerval:20", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,20) );
  u.addIcon(this.name + ":layerval:21", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,21) );
  u.addIcon(this.name + ":layerval:22", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,22) );
  u.addIcon(this.name + ":layerval:23", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,23) );
  u.addIcon(this.name + ":layerval:28", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,28) );
  u.move(0, cur_y);

  this.dropDisplayLayer = u;
  this.addChild(u);

  cur_y += u.height;


  this.dropDisplayLayer.selected = true;

  // Most of these values should be passed in from the controller, say.
  // For now we hardcode them here.
  //
  this.layerColor = { 0:"rgba(0,255,0,0.4)", 15:"rgba(255,0,0,0.4)", 1:"rgba(0,255,255,0.4)", 2:"rgba(255,127,0,0.4)",
     20:"rgba(0,255,0,0.4)", 21:"rgba(255,0,0,0.4)", 22:"rgba(0,255,255,0.4)", 23:"rgba(255,127,0,0.4)",
     28:"rgba(255,127,0,0.4)", "HiC":"rgba(255,127,0,0.4)" };

}

guiBoardDisplayLayers.inherits ( guiRegion );

//-------------------------------

guiBoardDisplayLayers.prototype._draw_layer_icon = function(layer_name)
{
  var sx = this.iconWidth/2;
  var sy = this.iconWidth/2;
  var d = 2;
  var textColor = "rgba(0,0,0,0.5)";
  var fgColor = this.layerColor[layer_name];

  g_painter.drawRectangle(d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, fgColor);
  g_painter.drawTextSimpleFont(layer_name, sx, sy, textColor, 15, "Calibri");
}

// children will be in weird places, so don't confine it to the box of the
// guiBoardDisplayLayers.
//
guiBoardDisplayLayers.prototype.hitTest = function(x, y)
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

guiBoardDisplayLayers.prototype._eventMouseDown = function( ev )
{
  var re;

  if ( re = ev.owner.match(/:layerval:(.+)$/) )
  {
    var layerVal = re[1];
    this.dropDisplayLayer.contract();
    this.dropDisplayLayer.selected = true;

    this.selectedLayer = layerVal;

    console.log(">>>", this.selectedLayer);
  }

  else if (ev.owner == this.name + ":droplayer:tab") { }

}

guiBoardDisplayLayers.prototype._eventDoubleClick = function( ev )
{
  console.log("gui board layer double click");
}

guiBoardDisplayLayers.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);

}

guiBoardDisplayLayers.prototype.draw = function() { }
