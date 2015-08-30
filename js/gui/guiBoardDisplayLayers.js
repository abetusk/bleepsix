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
  this.width = this.iconWidth;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;

  this.layer_desc = { 0: "B.Cu", 1:"Inner1.Cu", 2:"Inner2.Cu", 15:"F.Cu",
                      20:"B.SilkS", 21:"F.SilkS", 22:"B.SolderM", 23:"F.SolderM", 28:"Edge.Cuts", " ":"default" }

  // layers to filter/display
  //
  //var u = new guiDropIcon(this.name + ":displaylayer", this.iconWidth , this.iconWidth, false, true);
  var u = new guiDropIcon(this.name + ":displaylayer", this.iconWidth , this.iconWidth, true);
  u.multiSelect = true;
  //u.box_highlight=false;
  u.reverse_highlight=true;
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon(this.name + ":layerval: ", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this," ") );
  //u.addIcon(this.name + ":layerval:HiC", (function(s,lyr) { return function() { s._draw_layer_icon(lyr); }; })(this,"HiC") );
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

  this.dropDown = u;

  cur_y += u.height;

  this.board= null;

  //this.dropDisplayLayer.selected = true;

  // Most of these values should be passed in from the controller, say.
  // For now we hardcode them here.
  //
  this.layerColor = {

     0:"rgba(0,255,0,0.4)",
     1:"rgba(0,255,255,0.4)",
     2:"rgba(255,127,0,0.4)",
     15:"rgba(255,0,0,0.4)",

     20:"rgba(0,0,255,0.2)",
     21:"rgba(0,255,255,0.2)",
     22:"rgba(255,255,0,0.1)",
     23:"rgba(255,255,0,0.1)",
     28:"rgba(255,255,0,0.4)",
     "HiC":"rgba(100,100,100,0.4)",
     " ":"rgba(12,48,64,0.3)" };


  this.saved_state = {};
  for (var i in this.layerColor) {
    if (i===" ") { continue; }
    this.saved_state[i] = "show";
  }


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
  var sz = this.iconWidth-6;

  g_painter.drawRectangle(d, d, this.iconWidth - 2*d, this.iconWidth - 2*d, 0, "rgb(0,0,0)", true, fgColor);
  g_painter.drawTextSimpleFont(layer_name, sx, sy, textColor, 15, "Calibri");
  g_imgcache.draw( "eye", 3, 3, sz, sz, 0.1 );
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
    this.selectedLayer = layerVal;
  }

  else if (ev.owner == this.name + ":droplayer:tab") { }

}

guiBoardDisplayLayers.prototype._eventDoubleClick = function( ev )
{
  console.log("gui board layer double click");
}

guiBoardDisplayLayers.prototype.handleEvent = function(ev)
{
  var r;
  if ( ev.type == "mouseDown" )
    r = this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    r = this._eventDoubleClick(ev);


  for (var i=0; i<this.dropDown.iconList.length; i++) {
    var ele = this.dropDown.iconList[i];
    var z = ele.name.split(":");
    var nam = z[2];
    var descr = this.layer_desc[nam];

    if ((nam!=" ") && (nam!="HiC") && (nam!="All")) {
      if (!(nam in g_board_controller.board.layer_display)) { continue; }
      if (!ele.selected) {
        g_board_controller.board.layer_display[nam].state = "show";
      } else {
        g_board_controller.board.layer_display[nam].state = "low";
      }
    } else if (nam==" ") {
      this.dropDown.iconList[i].selected = false;

      /*
      if (ele.selected) {
        this.saved_state = {};
        for (var x in g_board_controller.board.layer_display) {
          this.saved_state[x] = g_board_controller.board.layer_display[x];
          g_board_controller.board.layer_display[x].state = "show";
        }

        for (var ii=0; ii<this.dropDown.iconList.length; ii++) {
          this.dropDown.iconList[ii].selected = true;
        }
      } else {

        this.saved_state = {};
        for (var x in g_board_controller.board.layer_display) {
          this.saved_state[x] = g_board_controller.board.layer_display[x];
          g_board_controller.board.layer_display[x].state = "show";
        }

        for (var ii=0; ii<this.dropDown.iconList.length; ii++) {
          var ee = this.dropDown.iconList[ii];
          var zz = ele.name.split(":");
          var tnam = zz[2];

          if (tnam in this.saved_state) {
            if (this.saved_state[tnam].state === "show") {
              this.dropDown.iconList[ii].selected = true;
            } else {
              this.dropDown.iconList[ii].selected = false;
            }
          } else {
            this.dropDown.iconList[ii].selected = true;
          }
        }

      }
      break;
      */

    }

    /*
    else if (nam=="All") {

      console.log(">>>>");

      ele.selected = false;
      for (var ii=0; ii<this.dropDown.iconList.length; ii++) {
        this.dropDown.iconList[ii].selected = false;
      }
      for (var z in g_board_controller.board.layer_display) {
        g_board_controller.board.layer_display[z].state = "show";
      }
    }
    */

  }

  return r;
}

guiBoardDisplayLayers.prototype.draw = function() { }
