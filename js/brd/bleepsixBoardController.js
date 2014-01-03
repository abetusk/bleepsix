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

function snapGrid(active_flag , unit, spacing)
{
  this.active = active_flag;
  this.unit = unit;
  this.spacing = parseFloat(spacing);
  this.cursorSize = 6;
  this.cursorWidth = 1;
  this.color = "rgb(128,128,128)";

  this.guiFootprintLibary = null;
  this.guiLayer = null;

}

snapGrid.prototype.snapGrid = function( xy )
{
  var snap_pos = {};

  snap_pos["x"] = parseFloat( xy["x"] );
  snap_pos["y"] = parseFloat( xy["y"] );

  if ( this.active )
  {
    snap_pos["x"] = this.spacing * Math.round( snap_pos["x"] / this.spacing );
    snap_pos["y"] = this.spacing * Math.round( snap_pos["y"] / this.spacing );
  }

  return snap_pos;
}

snapGrid.prototype.drawCursor = function( xy )
{
  var s = this.cursorSize / 2;

  g_painter.drawRectangle( xy.x - s,
                           xy.y - s,
                           this.cursorSize ,
                           this.cursorSize ,
                           this.cursorWidth ,
                           this.color );

}


function bleepsixBoardController() {
  this.canvas = null;
  this.context = null;

  this.board = new bleepsixBoard();

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.queued_display_module = 0;

  this.tool = new toolBoardNav ();
  
  this.moving = false;
  this.movingFootprintLibrary = false;
  //this.movingToolbox = false;
  //this.movingGrid = false;
  //this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  var controller = this;
  //setInterval( function() { controller.redraw() } , 50 );

  // HARD CODED FOR DEMO.  REMOVE ASAP
  //g_painter.adjustPan( -4000, -1500);
  g_painter.adjustPan( 0, 0);

  this.display_text_flag = true;
  this.display_text = "bloop";
}

// - *************************************************
// - *************************************************
// -
// -  testing
// -
// - *************************************************
// - *************************************************

bleepsixBoardController.prototype._randColor = function ()
{
  var r = Math.floor(Math.random()*256);
  var g = Math.floor(Math.random()*256);
  var b = Math.floor(Math.random()*256);

  return "rgb(" + r + "," + g + "," + b + ")";
}

bleepsixBoardController.prototype.hershey_font_test = function ()
{

  if (!this.board.flag_utf8_hershey_font_loaded)
  {
    console.log("hershey font not ready yet");
    return;
  }

  var line_width = [ 80, 140 ];
  var color = "rgba(255,255,255,0.8)";
  var x = 0, y = 0;
  var dx = 0, dy = 1000;
  var font = this.board.utf8_hershey_font;

  var str_a = String.fromCharCode(0x3a9);
  var str_b = String.fromCharCode(0x3a9);
  //var str_b = String.fromCharCode(21941);

  g_painter.drawTextFont( str_a, font, x, y, color, 500, 500, line_width[0], 0, "C", "C", false);

  y += 1000;

  g_painter.drawTextFont( str_b, font, x, y, color, 500, 500, line_width[0], 0, "C", "C", false);
}

bleepsixBoardController.prototype.hershey_ascii_font_test = function ()
{
  if (!this.board.flag_utf8_hershey_ascii_font_loaded)
  {
    console.log("font not ready yet");
    return;
  }


  var font = this.board.utf8_hershey_ascii_font;

  var txt = "the quick brown fox jumped over the lazy yellow dog";
  var TXT = "THE QUICK BROWN FOX JUMPED OVER THE LAZY YELLOW DOG";
  var misc = "01234567890-=`~!@#$%^&*()_+[]\\{}|;':\",./<>?";

  var color = "rgba(255,255,255,0.8)";

  var line_width = [ 80, 140 ];
  //var sizex_vec = [ 500, 600, 800];
  //var sizey_vec = [ 500, 600, 800 ];
  var sizex_vec = [ 500, 800];
  var sizey_vec = [ 500, 800 ];
  var offset_h_vec = [ "L", "C", "R" ];
  var offset_v_vec = [ "T", "C", "B" ];
  var flip_vec = [ false, true ];
  //var angle_vec = [ 0, 30, 60, 90, 120, 150, 180, -150, -120, -90, -60, -30 ];
  var angle_vec = [ 0, 30 ];

  var x = 0, y = 0;
  var dx = 0, dy = 1000;

  g_painter.drawTextFont( "M", font, x, -2*dy, color, 500, 500, line_width[0], 0, "C", "C", false);

  g_painter.drawTextFont( "mMgG", font, x, -dy, color, 500, 500, line_width[0], 0, "C", "C", false);

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( txt, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( TXT, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  for (var i=0; i<line_width.length; i++)
  {
    g_painter.drawTextFont( misc, font, x, y, color, 500, 500, line_width[i], 0, "C", "C", false);
    y += dy;
  }

  var  small_text = "mMgG";

  var count = 0;
  var lf_n = 8;
  dy = 5000;

  for (var i5=0; i5<flip_vec.length; i5++)
  for (var i2=0; i2<offset_h_vec.length; i2++)
  for (var i3=0; i3<offset_v_vec.length; i3++)
  for (var i4=0; i4<angle_vec.length; i4++)
  for (var i0=0; i0<sizex_vec.length; i0++)
  for (var i1=0; i1<sizey_vec.length; i1++)
  for (var i6=0; i6<line_width.length; i6++)
  {
    var tt = "G" + String(i0) + String(i1) + String(i2) + String(i3) + String(i4) + String(i5) + String(i6);
    count++;
    //dx = g_painter._font_text_width( small_text, font, sizex_vec[i0] ) + 500;
    dx = g_painter._font_text_width( tt , font, sizex_vec[i0] ) + 500;

    g_painter.drawRectangle( x-100, y-100, 100, 100, 50 );

    //g_painter.drawTextFont( small_text, font, x, y, color, 
    g_painter.drawTextFont( tt, font, x, y, color, 
        sizex_vec[i0], sizey_vec[i1], 
        line_width[i6],
        angle_vec[i4], 
        offset_h_vec[i2], offset_v_vec[i3],
        flip_vec[i5] )

    x += dx;

    if ((count % lf_n) == 0)
    {
      x = 0;
      y += dy;
    }

  }

}

bleepsixBoardController.prototype.primitives_test = function ()
{

  var x = 1000, y = 1000, dx = 1000, dy = 1000, r = 500, ir= 200, obA = 800, obB = 600 ;
  var lw = 50;
  var color = "";

  var gray_color = "rgb(128,128,128)";

  color = this._randColor();
  g_painter.fillCircle( x, y, r, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircle( x, y, r, lw, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleCircle( x, y, r, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleOblong( x, y, r, obA, obB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillCircleHoleOblong( x, y, r, obB, obA, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleCircle( x, y, r, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleOblong( x, y, r, obA, obB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeCircleHoleOblong( x, y, r, obB, obA, lw, color );


  //--
  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, lw, gray_color, color );

  //-- 

  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, 0, gray_color, color );

  //-- 

  x += dx;
  color = this._randColor();
  g_painter.circleHoleCircle( x, y, r, ir, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obA, obB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.circleHoleOblong( x, y, r, obB, obA, lw, gray_color );


  // -- oblong tests

  y += dy;
  x = 1000;

  color = this._randColor();
  g_painter.fillOblong( x, y, obA, obB, color);

  x += dx;
  color = this._randColor();
  g_painter.fillOblong( x, y, obB, obA, color);

  x += dx;
  color = this._randColor();
  g_painter.strokeOblong( x, y, obA, obB, lw, color);

  x += dx;
  color = this._randColor();
  g_painter.strokeOblong( x, y, obB, obA, lw, color);

  //--

  var ibA = 300;
  var ibB = 100;

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleCircle( x, y, obA, obB, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleCircle( x, y, obB, obA, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obA, obB, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obA, obB, x, y, ibB, ibA, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obB, obA, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillOblongHoleOblong( x, y, obB, obA, x, y, ibB, ibA, color );


  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleCircle( x, y, obA, obB, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleCircle( x, y, obB, obA, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obA, obB, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obA, obB, x, y, ibB, ibA, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obB, obA, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeOblongHoleOblong( x, y, obB, obA, x, y, ibB, ibA, lw, color );


  //--
  
  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obA, obB, ir, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obB, obA, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleCircle( x, y, obB, obA, ir, lw, gray_color )

  //--

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibA, ibB, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obA, obB, ibB, ibA, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibA, ibB, lw, gray_color);

  x += dx;
  color = this._randColor();
  g_painter.oblongHoleOblong( x, y, obB, obA, ibB, ibA, lw, gray_color);


  // rect tests

  var rA = 900;
  var rB = 800;

  x = 1000; y += dy;

  color = this._randColor();
  g_painter.fillRect( x, y, rA, rB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRect( x, y, rB, rA, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRect( x, y, rA, rB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRect( x, y, rB, rA, lw, color );

  //--

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleCircle( x, y, rA, rB, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleCircle( x, y, rB, rA, x, y, ir, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleCircle( x, y, rA, rB, x, y, ir, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleCircle( x, y, rB, rA, x, y, ir, lw, color );


  //--

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rA, rB, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rA, rB, x, y, ibB, ibA, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rB, rA, x, y, ibA, ibB, color );

  x += dx;
  color = this._randColor();
  g_painter.fillRectHoleOblong( x, y, rB, rA, x, y, ibB, ibA, color );



  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rA, rB, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rA, rB, x, y, ibB, ibA, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rB, rA, x, y, ibA, ibB, lw, color );

  x += dx;
  color = this._randColor();
  g_painter.strokeRectHoleOblong( x, y, rB, rA, x, y, ibB, ibA, lw, color );


  //--

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rA, rB, ir, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleCircle( x, y, rB, rA, ir, lw, gray_color );


  //-- 

  x = 1000; y += dy;

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, lw, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, lw, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, 0, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, 0, gray_color, color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, 0, gray_color, color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibA, ibB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rA, rB, ibB, ibA, lw, gray_color );


  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibA, ibB, lw, gray_color );

  x += dx;
  color = this._randColor();
  g_painter.rectHoleOblong( x, y, rB, rA, ibB, ibA, lw, gray_color );

}

// - *************************************************
// - *************************************************
// -
// -  testing
// -
// - *************************************************
// - *************************************************



bleepsixBoardController.prototype.redraw = function ()
{

  if (this.board.displayable)
    this.board.tick();

  if ( g_painter.dirty_flag )
  {
    g_painter.startDrawColor();

    g_painter.drawGrid();



    //DEBUG
    //this.primitives_test();
    //this.hershey_ascii_font_test();
    //this.hershey_font_test();
    //DEBUG



    if (this.board.displayable) 
      this.board.drawBoard();

    this.tool.drawOverlay();

    g_painter.endDraw ();

	g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );
	//this.root.drawChildren ();
    //this.guiBoardPalette.drawChildren();

    //this.guiToolbox.drawChildren();
    //this.guiModule.drawChildren();

    //this.guiGrid.drawChildren();
    //this.guiAction.drawChildren();

    this.guiFootprintLibrary.drawChildren();
    this.guiLayer.drawChildren();


    if (this.display_text_flag )
      g_painter.drawText(this.display_text, 50, 650, "rgba(255,255,255,0.4)", 20);

    g_painter.dirty_flag = false;


    //g_painter.dirty_flag = true;

    //console.log( g_painter.view.cx + " " + g_painter.view.cy + " " + g_painter.zoom );

  }

}

bleepsixBoardController.prototype.canvas_coords_from_global = function( x, y ) 
{
  var rect = this.canvas.getBoundingClientRect();
  var rl = rect.left;
  var rt = rect.top;

  var scrollx = window.scrollX;
  var scrolly = window.scrollY;


  return [ x - rl - scrollx, y - rt - scrolly ];
}

bleepsixBoardController.prototype.mouseEnter = function( x, y ) 
{
  //console.log('mouseenter: ' + x + ", " + y );
}

bleepsixBoardController.prototype.mouseLeave = function( x, y ) 
{
  //console.log('mouseleave: ' + x + ", " + y );
}



bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

}


bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if ( ch == 'G' ) {      
      this.moving = !this.moving;
  }
  else if (ch == 'O')
  {
    this.movingLibrary = !this.movingLibrary;
  }
  else if (ch == 'P')
  {
    this.movingToolbox = !this.movingToolbox;
  }
  else if (ch == 'I')
  {
    this.movingGrid = !this.movingGrid;
  }
  else if (ch == 'U')
  {
    this.movingAction = !this.movingAction;
  }
  else if (ch == 'Y')
    {
      this.movingDebug = !this.movingDebug;
    }

  else if (ch == '9')
  {
    console.log("adding 'R' component to palette");

    //var guicomp = new guiPaletteComponent( "test", "R" );
    //this.guiPalette.addChild( guicomp );

    g_painter.dirty_flag = true;
  }

  var r = true;

  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

  return r;

}

bleepsixBoardController.prototype.keyPress = function( keycode, ch, ev )
{
  console.log( "keyPress: " + keycode + " " + ch  );

  if (typeof this.tool.keyPress !== 'undefined' )
    this.tool.keyPress( keycode, ch, ev );
}


bleepsixBoardController.prototype.mouseDown = function( button, x, y ) 
{

  if (this.guiFootprintLibrary.hitTest(x,y))
  {
    this.guiFootprintLibrary.mouseDown(button, x, y);
    return;
  }

  if (this.guiLayer.hitTest(x,y))
  {
    this.guiLayer.mouseDown(button, x, y);
    return;
  }


  /*
  if (this.guiPalette.hitTest(x, y))
  {
    console.log(" gui component hit, letting it handle it");
    return;
  }

  if (this.guiToolbox.hitTest(x,y))
  {
    this.guiToolbox.mouseDown(button, x, y);
    return;
  }

  if (this.guiGrid.hitTest(x,y))
  {
    this.guiGrid.mouseDown(button, x, y);
    return;
  }

  if (this.guiAction.hitTest(x,y))
  {
    this.guiAction.mouseDown(button, x, y);
    return;
  }
 */

  //DEBUGGING
  /*
  if (this.guiTextboxTest.hitTest(x,y))
  {
    this.guiTextboxTest.mouseDown(button, x, y);
    return;
  }
  */

  /*
  for (var ind in this.guiChild)
  {
    if ( (typeof this.guiChild[ind].hitTest !== 'undefined') &&
         (this.guiChild[ind].hitTest(x, y)) )
    {
      if (typeof this.guiChild[ind].mouseDown !== 'undefined' )
        this.guiChild[ind].mouseDown(button, x, y);
      return;
    }
  }
 */

  if (typeof this.tool.mouseDown !== 'undefined' )
  {
    this.tool.mouseDown ( button, x, y );
  }
}

bleepsixBoardController.prototype.doubleClick = function( e )
{
  console.log("double click");

  /*
  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }
 */

  if (typeof this.tool.doubleClick !== 'undefined' )
    this.tool.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y )
}

bleepsixBoardController.prototype.mouseUp = function( button, x, y ) 
{
  if (typeof this.tool.mouseUp !== 'undefined' )
    this.tool.mouseUp ( button, x, y );
}

bleepsixBoardController.prototype.mouseMove = function( x, y ) 
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

  if (this.movingFootprintLibrary)
    this.guiFootprintLibrary.move(x, y);

  if (this.movingLayer)
    this.guiLayer.move(x, y);


  /*
  if ( this.moving ) 
    this.guiPalette.move(x, y);

  if (this.movingLibrary)
    this.guiLibrary.move(x, y);

  if (this.movingToolbox)
    this.guiToolbox.move(x,y);

  if (this.movingGrid)
    this.guiGrid.move(x,y);
  
  if (this.movingAction)
    this.guiAction.move(x,y);
   */

  //if (this.movingDebug) this.guiTextboxTest.move(x,y);

  
  if (typeof this.tool.mouseMove !== 'undefined' )
    this.tool.mouseMove ( x, y );
}

bleepsixBoardController.prototype.mouseDrag = function( dx, dy ) 
{

  if (typeof this.tool.mouseDrag !== 'undefined' )
    this.tool.mouseDrag ( x, y );
}

bleepsixBoardController.prototype.mouseWheel = function( delta )
{
  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;

  if (this.guiFootprintLibrary.hitTest(x, y))
  {
    this.guiFootprintLibrary.mouseWheelXY(delta, x, y);
  }
  else if (this.guiLayer.hitTest(x, y))
  {
    this.guiLayer.mouseWheelXY(delta, x, y);
  }
  else if (typeof this.tool.mouseWheel !== 'undefined' )
  {
    this.tool.mouseWheel ( delta );
  }

}

bleepsixBoardController.prototype.init = function( canvas_id ) 
{
  this.canvas = $("#" + canvas_id)[0];
  this.context = this.canvas.getContext('2d');

  /* hmm, guiPalette needs to know about g_controller.... */
  //this.guiPalette = new guiPalette( "palette" );
  //this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, g_painter.height - this.guiPalette.height );

  //this.guiToolbox = new guiToolbox( "toolbox" );
  //this.guiToolbox.move( 0, 150);

  //this.guiGrid = new guiGrid( "toolbox" );
  //this.guiGrid.move(0,0);

  this.guiFootprintLibrary = new guiFootprintLibrary( "library" );
  this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);


  this.guiLayer = new guiLayer( "layer" );
  this.guiLayer.move( 5, 5 );


  //this.guiLibrary = new guiLibrary( "library" );
  //this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0);

  //this.guiModule = new guiModule ( "module" );
  //this.guiModule.move( g_painter.width - this.guiModule.width, 0);

  //this.guiAction= new guiAction( "action" );
  //this.guiAction.move( g_painter.width/2, 0);

  //this.guiTextboxTest = new guiTextbox( "test" );
  //this.guiTextboxTest.move( g_painter.width/2, g_painter.height/2);


  var controller = this;

  $(canvas_id).focus( function(ev) {
    console.log('focus');
    //console.log(ev);
  });

  $(canvas_id).mouseup( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseUp( e.which , xy[0], xy[1] );
  });

  $(canvas_id).mousedown( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );

    //coords = controller.canvas.relMouseCoords( e );
    //controller.mouseDown( e.which, coords["x"], coords["y"] );
    controller.mouseDown( e.which, xy[0], xy[1] );
  });

  $(canvas_id).mouseover( function(e) {
    //console.log("mouse over");
    //console.log(e);
  });

  $(canvas_id).mouseenter( function(e) {

    //console.log("enter");
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseEnter( xy[0], xy[1] );
  });

  $(canvas_id).mouseleave( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseLeave( xy[0], xy[1] );
  });

  $(canvas_id).mousemove( function(e) {
    //console.log('mousemove');
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseMove( xy[0], xy[1] );
  });

  $(canvas_id).mousewheel( function(e, delta, detlax, deltay) {
    controller.mouseWheel( delta );
    return false;
  });

  $(canvas_id).click( function(e) {
    //console.log('click');
  });

  $(canvas_id).dblclick( function(e) {
    controller.doubleClick(e);
  });

  $(canvas_id).keydown( function(e) {
    var key = ( e.which ? e.which : e.keyCode );
    var ch = String.fromCharCode(key);

    //console.log('keydown: ' + ch);
    //console.log ( "... " + e.shiftKey );

    this.capState = $(window).capslockstate("state");

    //console.log("controller keydown: capState: " + this.capState);

    return controller.keyDown( e.keyCode, ch, e );
  });

  $(canvas_id).keyup( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);

    //console.log('keyup ' + ch);
    //controller.keyUp( key, ch);

    //controller.keyUp( e.keyCode, ch, e );
  });

  $(canvas_id).resize( function(e) {
    console.log("resize");
    console.log(e);
  });

  $(canvas_id).keypress( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
    controller.keyPress( key, ch, e );
  });



  $(window).bind("capsOn", function(e) {
    //console.log("caps on");
    controller.capState = "on";
  });

  $(window).bind("capsOff", function(e) {
    //console.log("caps off");
    controller.capState = "off";
  });

  $(window).bind("capsUnknown", function(e) {
    //console.log("caps unknown");
    controller.capState = "unknown";
  });

  $(window).capslockstate();



  /*
   (function(){
      var doCheck = true;
      var check = function(){
        console.log("check");
      };
      window.addEventListener("resize",function(){
        if(doCheck){
          check();
          doCheck = false;
          setTimeout(function(){
            console.log("settimeout");
            doCheck = true;
            check();
          },500)
        }
      });
   })();
  */

  // get rid of right click menu popup
  $(document).bind("contextmenu", function(e) { return false; });

  // put focus on the canvas
  $(canvas_id).focus();

  // do first draw  
  g_painter.dirty_flag = true;
  
  // give to schematic
  this.board.init ( g_painter );
}


