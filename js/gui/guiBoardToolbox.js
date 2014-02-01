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

var __icon_width = 24;

function guiBoardToolbox( name, bgColor  ) 
{
  bgColor = ((typeof bgColor !== 'undefined') ? bgColor : "rgba(255,255,255,0.4)" );
  this.constructor ( name )   

  //this.bgColor = "rgba( 0, 0, 255, 0.2 )";
  this.bgColor = bgColor;

  this.iconWidth = __icon_width;
  this.width = this.iconWdith + 5;

  this.height = 4* this.iconWidth;
  this.iconHeight = this.iconWidth;

  this.tabHeight = this.iconWidth;
  this.tabWidth = this.width - this.iconWidth;

  var cur_y = 0;
  var sz = this.iconWidth;


  // iconNav is just a simple guiIcon
  //
  this.iconNav = new guiIcon( name + ":nav" );
  this.iconNav.init( 0, cur_y, sz, sz);
  this.iconNav.drawShape = _draw_nav_icon;
  this.iconNav.bgColor = bgColor;
  this.iconNav.fgColor = "rgb(255,255,255)";
  this.addChild( this.iconNav );

  cur_y += this.iconNav.height;


  // grouped trace functions (trace, via, etc(?))
  //
  var w = new guiDropIcon( this.name + ":droptrace", this.iconWidth , this.iconWidth );
  w.bgColor = bgColor;
  w.fgColor = "rgb(255,255,255)";
  w.divColor = "rgba(255,255,255,0.2)";
  w.addIcon( this.name + ":trace", _draw_trace_icon );
  w.addIcon( this.name + ":via" , _draw_via_icon );
  w.move(0, cur_y);

  this.dropTrace = w;
  this.addChild( w );

  cur_y += w.height;


  // zone
  //
  var z = new guiDropIcon( this.name + ":dropzone", this.iconWidth, this.iconWidth );
  z.bgColor = bgColor;
  z.fgColor = "rgb(255,255,255)";
  z.divColor = "rgba(255,255,255,0.2)";
  z.addIcon( this.name + ":zone", _draw_zone_icon );
  z.move(0, cur_y);

  this.dropZone = z;
  this.addChild( z );

  cur_y += z.height;



  // grouped art functions (edge, box, arcs, circles, etc.)
  //
  var u = new guiDropIcon( this.name + ":dropedge", this.iconWidth , this.iconWidth );
  u.bgColor = bgColor;
  u.fgColor = "rgb(255,255,255)";
  u.divColor = "rgba(255,255,255,0.2)";
  u.addIcon( this.name + ":edge", _draw_edge_icon );
  //u.addIcon( this.name + ":text", _draw_text_icon );
  u.addIcon( this.name + ":box", _draw_box_icon );
  u.addIcon( this.name + ":circle", _draw_circle_icon );
  u.addIcon( this.name + ":arc", _draw_arc_icon );
  u.addIcon( this.name + ":roundedbox", _draw_roundedbox_icon );
  u.addIcon( this.name + ":inroundedbox", _draw_inroundedbox_icon );
  u.move(0, cur_y);

  this.dropEdge = u;
  this.addChild( u );

  cur_y += u.height;


  // text
  //
  /*
  var t.= new guiDropIcon( this.name + ":droptext", this.iconWidth, this.iconWidth );
  t.bgColor = bgColor;
  t.fgColor = "rgb(255,255,255)";
  t.divColor = "rgba(255,255,255,0.2)";
  t.addIcon( this.name + ":text", _draw_text_icon );
  t.move(0, cur_y);

  this.dropText = t;
  this.addChild( t );

  cur_y += t.height;
  */



  // dimension
  //
  var d = new guiDropIcon( this.name + ":droptext", this.iconWidth, this.iconWidth );
  d.bgColor = bgColor;
  d.fgColor = "rgb(255,255,255)";
  d.divColor = "rgba(255,255,255,0.2)";
  d.addIcon( this.name + ":text", _draw_text_icon );
  //d.addIcon( this.name + ":dimension", _draw_text_icon );
  //d.addIcon( this.name + ":layeralign", _draw_text_icon );
  //d.addIcon( this.name + ":drillalign", _draw_text_icon );
  d.move(0, cur_y);

  this.dropText = d;
  this.addChild( d );

  cur_y += d.height;


  this.iconNav.selected = true;
  this.dropEdge.selected = false;
  this.dropTrace.selected = false;
  this.dropZone.selected = false;
  this.dropText.selected = false;

}

guiBoardToolbox.inherits ( guiRegion );

//-------------------------------

function _draw_nav_icon()
{
  var sz = 10;
  var sx = __icon_width/2-sz/2, sy = __icon_width/2-sz/2;

  var r = parseInt(8 * __icon_width /10);
  g_imgcache.draw( "cursor", 3, 1, r, r );

}

function _draw_gridinch_icon()
{
  g_painter.drawText("in", 3, 3, "rgba(0,0,0,0.5)", 12, 0, "L", "T");
  //g_painter.drawRectangle( 0, 0, 30, 30, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.1)");
  //g_painter.drawRectangle( 1, 1, 29, 29, 1, "rgba(0,0,0,0.5)");
  g_painter.drawRectangle( 0, 0, __icon_width, __icon_width, 0, "rgb(0,0,0)", true, "rgba(0,0,0,0.2)");
}

function _draw_gridmm_icon()
{
  g_painter.drawText("mm", 6, 8, "rgba(0,0,0,0.5)", 15, 0, "L", "T");
}


function _draw_trace_icon()
{
  var sx = __icon_width/5, sy = __icon_width/3;
  var dx = __icon_width/5, dy = __icon_width/3;
  var color = "rgba(0,255,0,0.45)", width = 4;

  var layer = g_board_controller.guiLayer.selectedLayer;
  if (typeof g_board_controller.board.layer_color[layer] !== 'undefined')
  {
    color = g_board_controller.board.layer_color[layer];
  }

  var p = [ [ 0,     0 ], 
            [ dx,    0 ],
            [ 2*dx, dy ],
            [ 3*dx, dy ] ];

  g_painter.drawPath( p, sx, sy, color, width, false);

}

function _draw_via_icon()
{
  var sx = __icon_width/2, sy = __icon_width/2;
  var color = "rgba(255,255,255,0.4)";
  var r = __icon_width/4;

  g_painter.circle( sx, sy, r, 0, color, true, color );

}

function _draw_text_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var h = __icon_width/1.2;
  var w = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;

  g_painter.drawTextSimpleFont( "T", mx, my, "rgba(0,0,0,0.9)", h, "Calibri");

}

function _draw_zone_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var color = "rgba(0,0,138,0.6)";
  var width = 2;
  var h = __icon_width/1.2;

  g_painter.drawTextSimpleFont( "Z", mx, my, "rgba(0,0,0,0.9)", h, "Calibri");
}

//--- art and edge drawing functions

function _draw_edge_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/5, dy = __icon_width/5;
  var color = "rgba(255,255,0,0.6)";
  var width = 4;

  g_painter.line( mx+dx, my-dy, mx-dx, my+dy, color, width );
}

function _draw_box_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/5, dy = __icon_width/5;
  var color = "rgba(255,255,0,0.6)";
  var width = 3;


  var p = [ [ -dx, -dy ], 
            [  dx, -dy ],
            [  dx,  dy ],
            [ -dx,  dy ],
            [ -dx, -dy ] ];

  g_painter.drawPath( p, mx, my, color, width, false);
}


function _draw_circle_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var r = __icon_width/5;
  var color = "rgba(255,255,0,0.6)";
  var width = 3;

  g_painter.circle( mx, my, r, width, color );
}

function _draw_arc_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var r = __icon_width/5;
  var color = "rgba(255,255,0,0.6)";
  var width = 3;

  g_painter.drawArc( mx, my, r, 0, -Math.PI/2.0, true, width, color);
}

function _draw_roundedbox_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/6, dy = __icon_width/6;
  var r = __icon_width/8;
  var color = "rgba(255,255,0,0.6)";
  var width = 3;
  var fudge = 1;

  g_painter.line( mx - dx - r, my - dy + r - fudge, 
                  mx - dx - r, my + dy - r + fudge,
                  color, width);
  g_painter.drawArc( mx + dx , my - dy , r, 0, -Math.PI/2.0, true, width, color );

  g_painter.line( mx + dx + r, my - dy + r - fudge, 
                  mx + dx + r, my + dy - r + fudge,
                  color, width);
  g_painter.drawArc( mx - dx , my - dy , r, -Math.PI/2.0, -Math.PI, true, width, color );

  g_painter.line( mx - dx + r - fudge, my - dy - r, 
                  mx + dx - r + fudge, my - dy - r,
                  color, width);
  g_painter.drawArc( mx - dx , my + dy , r, -Math.PI, -3.0*Math.PI/2.0, true, width, color );

  g_painter.line( mx - dx + r - fudge, my + dy + r, 
                  mx + dx - r + fudge, my + dy + r,
                  color, width);
  g_painter.drawArc( mx + dx , my + dy , r, -3.0*Math.PI/2.0, 2.0*Math.PI, true, width, color );
}

function _draw_inroundedbox_icon()
{
  var mx = __icon_width/2, my = __icon_width/2;
  var dx = __icon_width/5, dy = __icon_width/5;
  var r = __icon_width/10;
  var color = "rgba(255,255,0,0.6)";
  var width = 3;
  var fudge = 0;

  g_painter.line( mx - dx - r, my - dy + r - fudge, 
                  mx - dx - r, my + dy - r + fudge,
                  color, width);
  g_painter.drawArc( mx + dx , my - dy , r, -Math.PI, -3.0*Math.PI/2.0, true, width, color );

  g_painter.line( mx + dx + r, my - dy + r - fudge, 
                  mx + dx + r, my + dy - r + fudge,
                  color, width);
  g_painter.drawArc( mx - dx , my - dy , r, -3.0*Math.PI/2.0, -2.0*Math.PI, true, width, color );

  g_painter.line( mx - dx + r - fudge, my - dy - r, 
                  mx + dx - r + fudge, my - dy - r,
                  color, width);
  g_painter.drawArc( mx - dx , my + dy , r, 0, -Math.PI/2.0, true, width, color );

  g_painter.line( mx - dx + r - fudge, my + dy + r, 
                  mx + dx - r + fudge, my + dy + r,
                  color, width);
  g_painter.drawArc( mx + dx , my + dy , r, -Math.PI/2.0, -Math.PI, true, width, color );

}

//-------------


guiBoardToolbox.prototype.defaultSelect = function()
{
  this.dropEdge.selected = false;
  this.dropTrace.selected = false;
  this.dropZone.selected = false;
  this.dropText.selected = false;
  this.iconNav.selected = true;



  var ele = document.getElementById("canvas");
  ele.style.cursor = "auto";
}

guiBoardToolbox.prototype.traceSelect = function()
{
  this.dropEdge.selected = false;
  this.dropTrace.selected = true;
  this.dropZone.selected = false;
  this.dropText.selected = false;
  this.iconNav.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";
}

guiBoardToolbox.prototype.edgeSelect = function()
{
  this.dropEdge.selected = true;
  this.dropTrace.selected = false;
  this.dropZone.selected = false;
  this.dropText.selected = false;
  this.iconNav.selected = false;

  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";
}


// children will be in weird places, so don't confine it to the box of the
// guiBoardToolbox.
//
guiBoardToolbox.prototype.hitTest = function(x, y)
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

guiBoardToolbox.prototype._handleTraceEvent = function(ev)
{
  var handoff = true;

  if (ev.owner == this.name + ":trace")
  {
    console.log("  handing over to toolTrace (grid)");
    //g_board_controller.tool = new toolTrace(0, 0, [0, 15], false);
    g_board_controller.tool = new toolTrace(0, 0, g_board_controller.guiLayer.layer, false);
  }

  else if (ev.owner == this.name + ":via")
  {
    console.log("  IN DEVELOPMENT, sorry, tool via not implmeneted yet");
    //console.log("  handing over to toolTrace (grid)");
  }

  else
  {
    handoff = false;
  }

  if (handoff)
  {
    this.iconNav.selected = false;
    this.dropTrace.selected = true;
    this.dropZone.selected = false;
    this.dropEdge.selected = false;
    this.dropText.selected = false;
    g_painter.dirty_flag = true;

  }


}


guiBoardToolbox.prototype._handleZoneEvent = function(ev)
{
  if (ev.owner == this.name + ":zone")
  {
    console.log("  IN DEVELOPMENT, sorry, tool zone not implmeneted yet");
    //g_board_controller.tool = new toolZone(0, 0, "connection");

    this.iconNav.selected = false;
    this.dropTrace.selected = false;
    this.dropZone.selected = true;
    this.dropEdge.selected = false;
    this.dropText.selected = false;

    g_painter.dirty_flag = true;
  }

}

guiBoardToolbox.prototype._handleEdgeEvent = function(ev)
{
  var handoff = true;
  if (ev.owner == this.name + ":edge")
  {
    console.log("  IN DEVELOPMENT, sorry, tool edge not implmeneted yet");
    //console.log("  handing over to toolBoardEdge");
    //g_board_controller.tool = new toolBoardEdge(0, 0, "connection");

  }

  else if (ev.owner == this.name + ":box")
  {
    console.log("  IN DEVELOPMENT, sorry, tool edge not implmeneted yet");
    //console.log("  handing over to toolbox");
    //g_board_controller.tool = new toolBoardEdgeBox(0, 0, "noconn");
  }

  else if (ev.owner == this.name + ":circle")
  {
    console.log("  IN DEVELOPMENT, sorry, tool circle not implmeneted yet");
    //console.log("  handing over to toolbox");
    //g_board_controller.tool = new toolBoardEdgeBox(0, 0, "noconn");
  }

  else if (ev.owner == this.name + ":arc")
  {
    console.log("  IN DEVELOPMENT, sorry, tool arc not implmeneted yet");
    //console.log("  handing over to toolarc");
    //g_board_controller.tool = new toolBoardEdgeArc(0, 0, "noconn");
  }

  else if (ev.owner == this.name + ":roundedbox")
  {
    console.log("  IN DEVELOPMENT, sorry, tool rounded box not implmeneted yet");
    //console.log("  handing over to tool rounded box");
    //g_board_controller.tool = new toolBoardEdgeRoundedBox(0, 0, "noconn");
  }

  else if (ev.owner == this.name + ":inroundedbox")
  {
    console.log("  IN DEVELOPMENT, sorry, tool inroundedbox not implmeneted yet");
    //console.log("  handing over to tool inrounded box");
    //g_board_controller.tool = new toolBoardEdgeInroundedBox(0, 0, "noconn");
  }

  else
  {
    handoff = false;
  }

  if (handoff)
  {
    this.iconNav.selected = false;
    this.dropTrace.selected = false;
    this.dropZone.selected = false;
    this.dropEdge.selected = true;
    this.dropText.selected = false;
    g_painter.dirty_flag = true;
  }

}


guiBoardToolbox.prototype._handleTextEvent = function(ev)
{
  var handoff = true;
  if (ev.owner == this.name + ":text")
  {
    console.log("  IN DEVELOPMENT, sorry, tool not ready:  toolBoardText");
    //console.log("  handing over to toolBoardText");
    //g_board_controller.tool = new toolBoardText(0, 0 );
  }

  else if (ev.owner == this.name + ":dimension")
  {
    console.log("  IN DEVELOPMENT, sorry, tool not ready:  toolBoardDimension");
    //console.log("  handing over to toolBoardDimension");
    //g_board_controller.tool = new toolBoardDimension(0, 0 );
  }

  else if (ev.owner == this.name + ":layeralign")
  {
    console.log("  IN DEVELOPMENT, sorry, tool not ready:  toolBoardLayerAlign");
    //console.log("  handing over to toolBoardLayerAlign");
    //g_board_controller.tool = new toolBoardLayerAlign(0, 0 );
  }

  else if (ev.owner == this.name + ":drillalign")
  {
    console.log("  IN DEVELOPMENT, sorry, tool not ready:  toolBoardDrillAlign");
    //console.log("  handing over to toolBoardDrillAlign");
    //g_board_controller.tool = new toolBoardDrillAlign(0, 0 );
  }

  else
  {
    handoff = false;
  }

  if (handoff)
  {
    this.iconNav.selected = false;
    this.dropTrace.selected = false;
    this.dropZone.selected = false;
    this.dropEdge.selected = false;
    this.dropText.selected = true;
    g_painter.dirty_flag = true;
  }

}


guiBoardToolbox.prototype._eventMouseDown = function( ev )
{
  if (ev.owner == this.name + ":nav")
  {
    console.log("  handing over to toolBoardNav (2)");

    var ele = document.getElementById("canvas");
    ele.style.cursor = "auto";


    g_board_controller.tool = new toolBoardNav();

    this.iconNav.selected = true;

    this.dropEdge.selected = false;
    this.dropTrace.selected = false;

    g_painter.dirty_flag = true;

    return;
  }

  else if ( ev.owner.match(/:(trace|via)$/) )
  {
    this._handleTraceEvent(ev);

    if (this.dropTrace.showDropdown)
    {
      this.dropEdge.contractSlim();
      this.dropZone.contractSlim();
      this.dropText.contractSlim();
    }
    else
    {
      this.dropEdge.contract();
      this.dropZone.contract();
      this.dropText.contract();
    }

  }

  else if ( ev.owner.match(/:zone$/) )
  {
    this._handleZoneEvent(ev);

    this.dropTrace.contract();
    if (this.dropZone.showDropdown)
    {
      this.dropEdge.contractSlim();
      this.dropText.contractSlim();
    }
    else
    {
      this.dropEdge.contract();
      this.dropText.contract();
    }
  }

  else if ( ev.owner.match(/:(edge|box|circle|arc|roundedbox|inroundedbox)$/) )
  {
    this._handleEdgeEvent(ev);

    this.dropTrace.contract();
    this.dropZone.contract();
    if (this.dropEdge.showDropdown) { this.dropText.contractSlim(); }
    else { this.dropText.contract(); }

  }

  else if ( ev.owner.match(/:(text|dimension|layeralign|drillalign)$/) )
  {
    this._handleTextEvent(ev);

    this.dropTrace.contract();
    this.dropEdge.contract();
    this.dropZone.contract();

  }

  else if (ev.owner == this.name + ":droptrace:tab")
  {
    console.log("  trace tab!");

    // hide (or show) the tabs from other tools that stick out below it
    //
    //this.dropEdge.iconTab.visible = !this.dropEdge.iconTab.visible;
    //this.dropZone.iconTab.visible = !this.dropZone.iconTab.visible;
    //this.dropText.iconTab.visible = !this.dropText.iconTab.visible;

    if (this.dropTrace.showDropdown)
    {
      this.dropEdge.contractSlim();
      this.dropZone.contractSlim();
      this.dropText.contractSlim();
    }
    else
    {
      this.dropEdge.contract();
      this.dropZone.contract();
      this.dropText.contract();
    }

  }

  else if (ev.owner == this.name + ":dropzone:tab")
  {
    console.log("  zone tab");

    this.dropTrace.contract();

    if (this.dropZone.showDropdown)
    {
      this.dropEdge.contractSlim();
      this.dropText.contractSlim();
    }
    else
    {
      this.dropEdge.contract();
      this.dropText.contract();
    }

    g_painter.dirty_flag = true;
  }


  else if (ev.owner == this.name + ":dropedge:tab")
  {
    console.log("  edge tab");

    this.dropTrace.contract();
    this.dropZone.contract();

    if (this.dropEdge.showDropdown)
    {
      this.dropText.contractSlim();
    }
    else
    {
      this.dropText.contract();
    }

    g_painter.dirty_flag = true;
  }

  else if (ev.owner == this.name + ":droptext:tab")
  {
    console.log("  text tab");

    this.dropTrace.contract();
    this.dropEdge.contract();
    this.dropZone.contract();

    g_painter.dirty_flag = true;
  }


}

guiBoardToolbox.prototype._eventDoubleClick = function( ev )
{
  /*
  if (ev.owner == this.name + ":conn")
  {
    console.log("  handing over to toolConn('connection', 'persist')");
    //g_board_controller.tool = new toolConn( 0, 0, "connection", "persist");
    return;
  }
  else if (ev.owner == this.name + ":noconn")
  {
    console.log("  handing over to toolConn('noconn', 'persist')");
    //g_board_controller.tool = new toolConn( 0, 0, "noconn", "persist");
    return;
  }
  */
}

guiBoardToolbox.prototype.handleEvent = function(ev)
{
  if ( ev.type == "mouseDown" )
    return this._eventMouseDown(ev);
  else if ( ev.type == "doubleClick" )
    return this._eventDoubleClick(ev);


}

guiBoardToolbox.prototype.draw = function()
{

}


