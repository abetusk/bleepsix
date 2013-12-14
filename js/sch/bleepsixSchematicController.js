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


function bleepsixSchematicController() {
  this.canvas = null;
  this.context = null;

  // classes controlled
  this.toolKit = null;
  this.toolLibrary = null;
  //this.palette = null;

  this.schematic = new bleepsixSchematic();

  //this.palette = new guiPalette();

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.queued_display_component = 0;

  this.tool = new toolNav ();
  
  /*
   *
  // EXAMPLE:
  //
  this.root = new guiRegion( "root" );
  button1 = new guiPalette( "b1" ) ;
  button2 = new guiPalette( "b2" ) ;
  button3 = new guiPalette( "b3" );
  this.root.addChild ( button1 );
  this.root.addChild ( button2 );
  
  button2.addChild ( button3 );
  
  this.root.init ( 160, 50, 200, 60 ); 
  
  button1.move ( 20, 10 );
  button1.bgColor = "rgba(255,0,0,1.0)";
  
  button2.move ( 80, 10 );
  button2.bgColor = "rgba(0,255,0,1.0)";
  
  console.log ( button1 );
  
  button3.move ( 8, 8 );
  button3.bgColor = "rgba(0,0,255,1.0)";
  
  */
  this.moving = false;
  this.movingLibrary = false;
  this.movingToolbox = false;
  this.movingGrid = false;
  this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  var controller = this;
  setInterval( function() { controller.redraw() } , 50 );
}

bleepsixSchematicController.prototype.redraw = function ()
{

  if ( g_painter.dirty_flag )
  {
    g_painter.startDraw();

    /*
    // reference, for scale and the like 
    g_painter.circle(0, 0, 10, 10, "rgb(128,128,128)" );
    g_painter.circle(0, 0, 100, 10, "rgb(128,128,128)" );
    g_painter.circle(0, 0, 1000, 10, "rgb(128,128,128)" );
    g_painter.circle(0, 0, 10000, 10, "rgb(128,128,128)" );
    */
    
    g_painter.drawGrid();

    if (this.schematic.displayable)
      this.schematic.drawSchematic ();

    this.tool.drawOverlay();

    g_painter.endDraw ();
	
	g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );
    this.guiPalette.drawChildren();

    this.guiToolbox.drawChildren();
    this.guiLibrary.drawChildren();

    this.guiGrid.drawChildren();

    this.guiAction.drawChildren();
    //if (this.palette.displayable) this.palette.draw();

    //this.guiTextboxTest.drawChildren();

    g_painter.dirty_flag = false;


    //g_painter.dirty_flag = true;

  }

}

/*
function relMouseCoords(ev)
{
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;
  var currentElement = this;

  do {
    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
  }
  while (currentElement = currentElement.offsetParent);

  canvasX = ev.pageX - totalOffsetX;
  canvasY = ev.pageY - totalOffsetY;

  return { x : canvasX, y : canvasY };
}

HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;
*/

bleepsixSchematicController.prototype.canvas_coords_from_global = function( x, y ) 
{
  var rect = this.canvas.getBoundingClientRect();
  var rl = rect.left;
  var rt = rect.top;

  var scrollx = window.scrollX;
  var scrolly = window.scrollY;

  //console.log(" canvas_coords_from_global: (" + x + " " + y + ")");
  //console.log(rect);
  //console.log(" scroll (" + scrollx + " " + scrolly + ")");


  return [ x - rl - scrollx, y - rt - scrolly ];
}

bleepsixSchematicController.prototype.mouseEnter = function( x, y ) 
{
  //console.log('mouseenter: ' + x + ", " + y );
}

bleepsixSchematicController.prototype.mouseLeave = function( x, y ) 
{
  //console.log('mouseleave: ' + x + ", " + y );
}



bleepsixSchematicController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

}


bleepsixSchematicController.prototype.keyDown = function( keycode, ch, ev )
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

    var guicomp = new guiPaletteComponent( "test", "R" );
    this.guiPalette.addChild( guicomp );

    g_painter.dirty_flag = true;
  }

  var r = true;

  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

  return r;

}

bleepsixSchematicController.prototype.keyPress = function( keycode, ch, ev )
{
  //console.log( "keyPress: " + keycode + " " + ch  );

  if (typeof this.tool.keyPress !== 'undefined' )
    this.tool.keyPress( keycode, ch, ev );
}


bleepsixSchematicController.prototype.mouseDown = function( button, x, y ) 
{


  //this.root.hitTest(x, y);

  if (this.guiPalette.hitTest(x, y))
  {
    console.log(" gui component hit, letting it handle it");
    return;
  }

  if (this.guiLibrary.hitTest(x,y))
  {
    this.guiLibrary.mouseDown(button, x, y);
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
    this.tool.mouseDown ( button, x, y );
}

bleepsixSchematicController.prototype.doubleClick = function( e )
{
  console.log("double click");

  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

  if (typeof this.tool.doubleClick !== 'undefined' )
    this.tool.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y )
}

bleepsixSchematicController.prototype.mouseUp = function( button, x, y ) 
{
  if (typeof this.tool.mouseUp !== 'undefined' )
    this.tool.mouseUp ( button, x, y );
}

bleepsixSchematicController.prototype.mouseMove = function( x, y ) 
{
  this.mouse_cur_x = x;
  this.mouse_cur_y = y;

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

  //if (this.movingDebug) this.guiTextboxTest.move(x,y);

  
  if (typeof this.tool.mouseMove !== 'undefined' )
    this.tool.mouseMove ( x, y );
}

bleepsixSchematicController.prototype.mouseDrag = function( dx, dy ) 
{

  if (typeof this.tool.mouseDrag !== 'undefined' )
    this.tool.mouseDrag ( x, y );
}

bleepsixSchematicController.prototype.mouseWheel = function( delta )
{
  var x = this.mouse_cur_x;
  var y = this.mouse_cur_y;

  if (this.guiLibrary.hitTest(x, y))
  {
    this.guiLibrary.mouseWheelXY(delta, x, y);
  }
  else if (typeof this.tool.mouseWheel !== 'undefined' )
  {
    this.tool.mouseWheel ( delta );
  }

}

bleepsixSchematicController.prototype.init = function( canvas_id ) 
{
  this.canvas = $("#" + canvas_id)[0];
  this.context = this.canvas.getContext('2d');

  /* hmm, guiPalette needs to know about g_controller.... */
  this.guiPalette = new guiPalette( "palette" );
  this.guiPalette.move( (g_painter.width - this.guiPalette.width)/4, g_painter.height - this.guiPalette.height );

  this.guiToolbox = new guiToolbox( "toolbox" );
  this.guiToolbox.move( 0, 150);

  this.guiGrid = new guiGrid( "grid" );
  this.guiGrid.move(0,0);

  this.guiLibrary = new guiLibrary( "library" );
  this.guiLibrary.move( g_painter.width - this.guiLibrary.width, 0);

  this.guiAction= new guiAction( "action" );
  this.guiAction.move( g_painter.width/2, 0);

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

  $(canvas_id).keypress( function(e) {
    //console.log('keypress');
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
  this.schematic.init ( g_painter );
}

