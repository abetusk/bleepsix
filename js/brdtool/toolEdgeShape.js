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

function toolEdgeShape( x, y, shape, initialPlaceFlag ) 
{
  console.log("toolEdgeShape " + x + " " + y + " " + initialPlaceFlag );

  x = ( typeof x !== 'undefined' ? x : 0 );
  y = ( typeof y !== 'undefined' ? y : 0 );
  shape = ( (typeof shape !== 'undefined') ? shape : 'rect' );

  initialPlaceFlag = ( typeof initialPlaceFlag !== 'undefined' ? initialPlaceFlag : true );

  this.dist1_edge_eps = 10;

  this.shape = shape;

  this.circle = { r: 0, x: x, y: y };
  this.rect= { x : x, y: y, w: 0, h: 0 };
  this.roundedRect = { x: x, y: y, w:0, h:0, r: 2500 };
  this.inroundedRect = { x: x, y: y, w:0, h:0, r: 2500 };

  this.mouse_down = false;
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;


  this.show_cursor_flag = true;

  this.cursorSize = 6;
  this.cursorWidth = 1;

  this.mouse_drag_flag = false;

  this.mouse_world_xy = g_snapgrid.snapGrid( g_painter.devToWorld(x,y) );
  this.raw_mouse_world_xy = g_painter.devToWorld(x,y);

  this.edge_history = [];
  this.cur_edge_point = [];


  this.state = "init";
  this.initialPlaceFlag = initialPlaceFlag;
  this.startedFlag = false;
  if (this.initialPlaceFlag)
  {
    this._initEdgeShapeState();
  }

  // Needs to be taken from board design constraints.
  // Hardcoded for now.
  //
  this.edge_width = 200;

  this.layer = 28;
  this.color = "rgba(255,255,0,0.4)";

  console.log("toolEdgeShape : " + this.layer );


  var ele = document.getElementById("canvas");
  ele.style.cursor = "url('img/cursor_custom_wire_s24.png') 4 3, cursor";

}

toolEdgeShape.prototype._initEdgeShapeState = function()
{

  //DEBUG
  console.log("_initEdgeShapeState");

  var xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.startedFlag = true;

  var x = xy.x;
  var y = xy.y;

  this.circle = { r: 0, x: x, y: y };
  this.rect = { x : x, y: y, w: 0, h: 0 };
  this.roundedRect = { x: x, y: y, w:0, h:0, r: 2500 };
  this.inroundedRect = { x: x, y: y, w:0, h:0, r: 2500 };

}

//-----------------------------

toolEdgeShape.prototype.drawOverlay = function()
{

  if (this.shape == "rect")
  {
    var x = this.rect.x;
    var y = this.rect.y;
    var w = this.rect.w;
    var h = this.rect.h;

    if (w < 0)
      x += w;
    if (h < 0)
      y += h;
    w = Math.abs(w);
    h = Math.abs(h);

    if ( ( w > 1 ) &&
         ( h > 1 ) )
    {
      g_painter.drawRectangle( x, y, w, h, this.edge_width, "rgba(255,255,0,0.4)" );
    }

  }

  else if (this.shape == "roundedRect")
  {
    var x = this.roundedRect.x;
    var y = this.roundedRect.y;
    var w = this.roundedRect.w;
    var h = this.roundedRect.h;

    var r = this.roundedRect.r;

    if (w < 0)
      x += w;
    if (h < 0)
      y += h;
    w = Math.abs(w);
    h = Math.abs(h);

    if ( (w > 2*r) && (h > 2*r) )
    {

      var edges = [ [ [ x + r, y ],    [x + w - r, y ] ],
                    [ [ x + r, y + h], [x + w - r, y + h ] ],
                    [ [ x, y + r ], [ x, y + h - r ] ],
                    [ [ x + w, y + r ], [ x + w, y + h - r ] ] ];

      for ( var i in edges )
      {
        g_painter.line( edges[i][0][0], edges[i][0][1],
                        edges[i][1][0], edges[i][1][1],
                        "rgba(255,255,0,0.4)",  this.edge_width );
      }

      // upper left
      g_painter.drawArc( x + r, y + r, r, -Math.PI/2, -Math.PI, true, this.edge_width, "rgba(255,255,0,0.4)" );

      // upper right
      g_painter.drawArc( x + w - r, y + r, r, 0, -Math.PI/2, true, this.edge_width, "rgba(255,255,0,0.4)" );

      // lower right
      g_painter.drawArc( x + w - r, y + h - r, r, Math.PI/2, 0, true, this.edge_width, "rgba(255,255,0,0.4)" );

      // lower right
      g_painter.drawArc( x + r, y + h - r, r, Math.PI, Math.PI/2, true, this.edge_width, "rgba(255,255,0,0.4)" );


    }

    g_painter.drawRectangle( x, y, w, h, this.edge_width, "rgba(255,255,255,0.2)" );
  }

  else if (this.shape == "inroundedRect")
  {
    var x = this.inroundedRect.x;
    var y = this.inroundedRect.y;
    var w = this.inroundedRect.w;
    var h = this.inroundedRect.h;

    var r = this.inroundedRect.r;

    if (w < 0)
      x += w;
    if (h < 0)
      y += h;
    w = Math.abs(w);
    h = Math.abs(h);

    if ( (w > 2*r) && (h > 2*r) )
    {

      var edges = [ [ [ x + r, y ],    [x + w - r, y ] ],
                    [ [ x + r, y + h], [x + w - r, y + h ] ],
                    [ [ x, y + r ], [ x, y + h - r ] ],
                    [ [ x + w, y + r ], [ x + w, y + h - r ] ] ];

      for ( var i in edges )
      {
        g_painter.line( edges[i][0][0], edges[i][0][1],
                        edges[i][1][0], edges[i][1][1],
                        "rgba(255,255,0,0.4)",  this.edge_width );
      }

      var p = [ [ x , y  ], 
                 [ x + w , y  ],
                 [ x + w , y + h ],
                 [ x , y + h  ] ];
      var ang = [ [ Math.PI/2,  0 ],
                  [ Math.PI,    Math.PI/2 ],
                  [ -Math.PI/2, -Math.PI ],
                  [ 0,          -Math.PI/2 ] ];

      for (var i in p )
      {
        g_painter.drawArc( p[i][0], p[i][1],  
                           r, 
                           ang[i][0], ang[i][1],
                           true, this.edge_width, "rgba(255,255,0,0.4)" );
      }

    }

    g_painter.drawRectangle( x, y, w, h, this.edge_width, "rgba(255,255,255,0.2)" );
  }


  // cursor
  //
  var s = this.cursorSize / 2;
  g_painter.drawRectangle( this.mouse_world_xy["x"] - s,
                           this.mouse_world_xy["y"] - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           "rgb(128, 128, 128 )" );


}

//-----------------------------

toolEdgeShape.prototype.dist1 = function( xy0, xy1 )
{

  var dx = Math.abs( xy0["x"] - xy1["x"] );
  var dy = Math.abs( xy0["y"] - xy1["y"] );

  return Math.max(dx, dy);

}

//-----------------------------

toolEdgeShape.prototype._placeRoundedRect = function()
{
  console.log("toolEdgeShape._placeRoundedRect");
  var x = this.roundedRect.x;
  var y = this.roundedRect.y;
  var w = this.roundedRect.w;
  var h = this.roundedRect.h;

  var r = this.roundedRect.r;

  if (w < 0)
    x += w;
  if (h < 0)
    y += h;
  w = Math.abs(w);
  h = Math.abs(h);

  if ( (w <= 2*r) && (h <= 2*r) )
  {
    console.log("toolEdgeShape._placeRoundedRect: too small, not placing rect"); 
    return;
  }


  var edges = [ [ [ x + r, y ],    [x + w - r, y ] ],
                [ [ x + r, y + h], [x + w - r, y + h ] ],
                [ [ x, y + r ], [ x, y + h - r ] ],
                [ [ x + w, y + r ], [ x + w, y + h - r ] ] ];

  for ( var i in edges )
  {
    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "drawsegment";
    op.data = { x0 : edges[i][0][0], y0: edges[i][0][1],
                x1 : edges[i][1][0], y1: edges[i][1][1],
                width: this.edge_width,
                layer: this.layer };
    g_board_controller.opCommand( op );

  }

  var p = [ [ x + r, y + r ], 
             [ x + w -r , y + r ],
             [ x + w - r, y + h - r],
             [ x + r, y + h - r ] ];
  var ang = [ [ -Math.PI/2, -Math.PI ],
              [ 0, - Math.PI/2 ],
              [ Math.PI/2, 0 ],
              [ Math.PI, Math.PI/2 ] ];

  for (var i in p )
  {
    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "drawarcsegment";
    op.data = { x : p[i][0], y : p[i][1], 
                r : r, 
                start_angle: ang[i][0], end_angle: ang[i][1],
                width: this.edge_width,
                layer: this.layer };
    g_board_controller.opCommand( op );
  }

}

toolEdgeShape.prototype._placeInroundedRect = function()
{
  console.log("toolEdgeShape._placeInroundedRect");
  var x = this.inroundedRect.x;
  var y = this.inroundedRect.y;
  var w = this.inroundedRect.w;
  var h = this.inroundedRect.h;

  var r = this.inroundedRect.r;

  if (w < 0)
    x += w;
  if (h < 0)
    y += h;
  w = Math.abs(w);
  h = Math.abs(h);

  if ( (w <= 2*r) && (h <= 2*r) )
  {
    console.log("toolEdgeShape._placeInroundedRect: too small, not placing rect"); 
    return;
  }


  var edges = [ [ [ x + r, y ],    [x + w - r, y ] ],
                [ [ x + r, y + h], [x + w - r, y + h ] ],
                [ [ x, y + r ], [ x, y + h - r ] ],
                [ [ x + w, y + r ], [ x + w, y + h - r ] ] ];

  for ( var i in edges )
  {
    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "drawsegment";
    op.data = { x0 : edges[i][0][0], y0: edges[i][0][1],
                x1 : edges[i][1][0], y1: edges[i][1][1],
                width: this.edge_width,
                layer: this.layer };
    g_board_controller.opCommand( op );

  }

  var p = [ [ x , y  ], 
             [ x + w , y  ],
             [ x + w , y + h ],
             [ x , y + h  ] ];
  var ang = [ [ Math.PI/2,  0 ],
              [ Math.PI,    Math.PI/2 ],
              [ -Math.PI/2, -Math.PI ],
              [ 0,          -Math.PI/2 ] ];

  for (var i in p )
  {
    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "drawarcsegment";
    op.data = { x : p[i][0], y : p[i][1], 
                r : r, 
                start_angle: ang[i][0], end_angle: ang[i][1],
                width: this.edge_width,
                layer: this.layer };
    g_board_controller.opCommand( op );
  }

}

toolEdgeShape.prototype._placeRect = function()
{
  console.log("toolEdgeShape._placeRect");

  var sx = parseFloat(this.rect.x);
  var sy = parseFloat(this.rect.y);
  var w = parseFloat(this.rect.w);
  var h = parseFloat(this.rect.h);

  if (w < 0)
  {
    sx += w;
    w = -w;
  }

  if (h < 0)
  {
    sy += h;
    h = -h;
  }

  if ( (h <= 1) || (w <= 1) )
  {
    console.log("toolEdgeShape._placeRect: too small, not placing rect"); 
    return;
  }

  var p = [ [sx, sy], [sx + w, sy], [sx + w, sy + h], [sx, sy + h ] ];

  for (var i=0; i<p.length; i++)
  {

    var a = p[i];
    var b = p[ (i+1)%4 ];

    var op = { source: "brd", destination: "brd" };
    op.action = "add";
    op.type = "drawsegment";
    op.data = { x0 : a[0], y0: a[1],
                x1 : b[0], y1: b[1],
                width: this.edge_width,
                layer: this.layer };
    g_board_controller.opCommand( op );

  }

}

toolEdgeShape.prototype.mouseDown = function( button, x, y ) 
{
  this.mouse_down = true;

  if (button == 3)
    this.mouse_drag_flag = true;

  if (button == 1)
  {

    // If we haven't started placing, setup state and return
    //
    if (!this.startedFlag)
    {
      this._initEdgeShapeState();
      return;
    }

    var xy = g_snapgrid.snapGrid( this.mouse_world_xy );

    if (this.shape == "rect")
    {
      this.rect.w = xy.x - this.rect.x ;
      this.rect.h = xy.y - this.rect.y ;
      this._placeRect();
    }

    else if (this.shape == "roundedRect") 
    {
      this.roundedRect.w = xy.x - this.roundedRect.x ;
      this.roundedRect.h = xy.y - this.roundedRect.y ;

      this._placeRoundedRect();
    }

    else if (this.shape == "inroundedRect") 
    {
      this.inroundedRect.w = xy.x - this.inroundedRect.x ;
      this.inroundedRect.h = xy.y - this.inroundedRect.y ;

      this._placeInroundedRect();
    }

    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;

  }

}

//-----------------------------


toolEdgeShape.prototype.doubleClick = function( button, x, y )
{
  console.log("toolEdgeShape.doubleClick");
}

//-----------------------------

toolEdgeShape.prototype.mouseUp = function( button, x, y ) 
{
  this.mouse_down = false;

  if (button == 3)
    this.mouse_drag_flag = false;

}

//------------

toolEdgeShape.prototype._make_point_edge = function( pnt_edge, edge )
{
  pnt_edge["x0"] = edge.x;
  pnt_edge["y0"] = edge.y;

  pnt_edge["x1"] = edge.x;
  pnt_edge["y1"] = edge.y;

  pnt_edge["layer"] = edge.layer;

  pnt_edge["width"] = this.edge_width;
  pnt_edge["shape"] = "drawsegment";
  pnt_edge["shape_code"] = "0";
}


toolEdgeShape.prototype.mouseMove = function( x, y ) 
{

  if ( this.mouse_drag_flag ) 
     this.mouseDrag ( x - this.mouse_cur_x, y - this.mouse_cur_y );

  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  this.mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );
  this.mouse_world_xy = g_snapgrid.snapGrid( this.mouse_world_xy );

  this.raw_mouse_world_xy = g_painter.devToWorld( this.mouse_cur_x, this.mouse_cur_y );

  g_painter.dirty_flag = true;

  // If we haven't started, just return
  // We need to wait for a mouseDown (or
  // an escape)
  //
  if (!this.startedFlag)
  { 
    return; 
  }

  if ( ! this.mouse_drag_flag ) 
  {
    var xy = this.mouse_world_xy;

    if (this.shape == "rect") 
    {
      this.rect.w = xy.x - this.rect.x ;
      this.rect.h = xy.y - this.rect.y ;
    }

    else if (this.shape == "roundedRect")
    {
      this.roundedRect.w = xy.x - this.roundedRect.x ;
      this.roundedRect.h = xy.y - this.roundedRect.y ;
    }

    else if (this.shape == "inroundedRect")
    {
      this.inroundedRect.w = xy.x - this.inroundedRect.x ;
      this.inroundedRect.h = xy.y - this.inroundedRect.y ;
    }

    g_painter.dirty_flag = true;

  }

}

//-----------------------------

toolEdgeShape.prototype.mouseDrag = function( dx, dy ) 
{
  g_painter.adjustPan ( dx, dy );
}

//-----------------------------

toolEdgeShape.prototype.mouseWheel = function( delta )
{
  g_painter.adjustZoom ( this.mouse_cur_x, this.mouse_cur_y, delta );
}

//-----------------------------
// TESTING

toolEdgeShape.prototype.keyDown = function( keycode, ch, ev )
{
  console.log("toolEdgeShape keyDown: " + keycode + " " + ch );

  if ((ch == 'Q') || (keycode == 27))
  {
    console.log("handing back to toolBoardNav");
    g_board_controller.tool = new toolBoardNav( this.mouse_cur_x, this.mouse_cur_y );
    g_board_controller.guiToolbox.defaultSelect();

    g_painter.dirty_flag = true;
  }

}

//-----------------------------

toolEdgeShape.prototype.keyUp = function( keycode, ch, ev )
{
  console.log("toolEdgeShape keyUp: " + keycode + " " + ch );
}


