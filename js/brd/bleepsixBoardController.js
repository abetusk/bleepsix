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

var brdControllerHeadless = false;
if (typeof module !== 'undefined')
{
  brdControllerHeadless = true;
  var bleepsixSchematic = require("../sch/bleepsixSchematicNode.js");
  var bleepsixBoard = require("./bleepsixBoardNode.js");

  var bleepsixAux = require("../lib/aux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;

}



function bleepsixBoardController() {
  this.canvas = null;
  this.context = null;

  this.type = "board";

  this.board = new bleepsixBoard();
  this.schematic = new bleepsixSchematic();

  //HACKY!  though not really needed, we won't get component load
  // errors if we set this flag.
  //bleepsixSchematicHeadless = true;


  //this.schematic.makeUnknownComponent();

  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.queued_display_module = 0;

  if (!brdControllerHeadless)
  {
    this.tool = new toolBoardNav ();
    this.tabCommunication = new bleepsixTabCommunication();
  }
  
  this.moving = false;
  this.movingFootprintLibrary = false;
  //this.movingToolbox = false;
  //this.movingGrid = false;
  //this.movingAction = false;

  this.movingDebug = false;

  this.capState = "unknown";

  var controller = this;

  if (!brdControllerHeadless)
  {
    g_painter.adjustPan( 0, 0);
  }

  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  this.display_text_flag = true;
  this.display_text = "bloop";

  this.boardUpdate = false;

  this.project_name_text_flag = true;
  this.project_name_text = "no name";

  var d = new Date();
  var curt = d.getTime();

  this.action_text_flag = true;
  this.action_text = "init";
  this.action_text_fade = { sustainDur : 1500, dropoffDur : 500, T :0 , lastT : curt };

  this.drawSnapArea = false;
}

bleepsixBoardController.prototype.opUndo = function( )
{
  this.op.opUndo();
  this.boardUpdate = true;
  g_painter.dirty_flag = true;
}

bleepsixBoardController.prototype.opRedo = function( )
{
  this.op.opRedo();
  this.boardUpdate = true;
  g_painter.dirty_flag = true;
}


bleepsixBoardController.prototype.opCommand = function( msg )
{

  var group_id = ( (typeof msg.groupId === 'undefined') ? String(guid()) : msg.groupId );

  // We're going to delete the module in the board before
  // we mirror the operations in the schematic, so save
  // the ids that need to be deleted from the schematic,
  // skipping over anything that isn't a module.
  //
  var delModuleList = [];
  if ( (msg.action == "delete") && (msg.type == "group"))
  {
    for ( var ind in msg.id )
    {
      var brd_ele_ref = this.board.refLookup( msg.id[ind] );
      if (!brd_ele_ref) continue;
      if (brd_ele_ref.type != "module") 
        continue;
      delModuleList.push( { id: msg.id[ind], type: brd_ele_ref.type } );
    }
  }

  // Batch operations together so we can undo/redo properly
  //
  msg.groupId = group_id;

  //DEBUG
  console.log(">>>", msg, group_id )

  // Apply the operation to the board
  //
  this.op.opCommand( msg );
  this.boardUpdate = true;
  g_painter.dirty_flag = true;

  this.board.updateRatsNest( undefined, undefined, this.board.sch_to_brd_net_map );

  if (!( "scope" in msg ))
    msg.scope = "network";

  if ( g_brdnetwork && (msg.scope == "network") )
  {
    g_brdnetwork.projectop( msg );
  }

  if ( (msg.action == "add") && ((msg.type == "footprint") || (msg.type == "footprintData")) )
  {
    var ucomp = this.schematic.makeUnknownComponent();

    var brd_fp = this.board.refLookup( msg.id );

    ucomp.text[0].text      = brd_fp.text[0].text;
    ucomp.text[0].reference = brd_fp.text[0].text;
    ucomp.text[0].visible   = brd_fp.text[0].visible;
    ucomp.text[0].x = -280;
    ucomp.text[0].y = -280;

    ucomp.text[1].text      = brd_fp.text[1].text;
    ucomp.text[1].visible   = brd_fp.text[1].visible;
    ucomp.text[1].x = + 280;
    ucomp.text[1].y = + 280;


    var schop = { source: "brd", destination: "sch" };
    schop.scope = msg.scope;
    schop.action = msg.action;
    schop.type = "componentData";
    schop.data = { componentData: ucomp, x: 0, y: 0 };
    schop.id = msg.id;
    schop.groupId = group_id;

    this.op.opCommand( schop );

    if ( g_brdnetwork && (msg.scope == "network") )
    {
      g_brdnetwork.projectop( schop );
    }

  }

  if ( msg.action == "update" )
  {

    // We've split a net (potentially), so update the
    // sch to brd net mapping for highlighting and rats nest
    // calculation purposes.
    //
    if ( msg.type == "splitnet") 
    {
      var netop = { source: "brd", destination: "sch" };
      netop.scope = msg.scope;
      netop.action = "update";
      netop.type = "schematicnetmap";
      netop.groupId = group_id;
      this.op.opCommand( netop );

      if ( g_brdnetwork && (msg.scop == "network") )
        g_brdnetwork.projectop( netop );

    }

    else if (msg.type == "edit") 
    {
      //...
    }

  }


  // We have a group delete whose ids have been saved in delModuleList.
  // Go through and remove them from teh schematic, sending them
  // over the network if necessary.
  //
  if ( (msg.action == "delete") && (msg.type == "group"))
  {

    var schop = { source: "brd", destination: "sch" };
    schop.scope = msg.scope;
    schop.action = msg.action;
    schop.type = "group";
    
    schop.id = [];
    schop.data = { element : [] };
    schop.groupId = group_id;

    for ( var ind in delModuleList )
    {
      schop.id.push( delModuleList[ind].id );
      var clonedData = simplecopy( this.schematic.refLookup( delModuleList[ind].id ) );
      schop.data.element.push( clonedData );
    }

    if (schop.id.length > 0)
    {
      this.op.opCommand( schop );
      if ( g_brdnetwork && (msg.scope == "network") )
        g_brdnetwork.projectop( schop );
    }

  }




}


bleepsixBoardController.prototype.fadeMessage = function ( msg )
{
  var d = new Date();
  var curt = d.getTime();

  this.action_text = msg;
  this.action_text_fade.T = 0;
  this.action_text_fade.lastT = curt;
}



bleepsixBoardController.prototype.highlightSchematicNetsFromBoard = function( brd_nc )
{
  var brd = this.board.kicad_brd_json.element;
  var msg = "";

  var sch_netcodes = this.board.kicad_brd_json.sch_to_brd_net_map[ brd_nc ];

  for (var ind in brd)
  {
    var ele = brd[ind];
    var type = ele.type;

    if (type == "module")
    {
      for (var p_ind in ele.pad)
      {
        if ( !this.board._net_equal_bbs( parseInt(brd_nc), parseInt(ele.pad[p_ind].net_number) ) )
          continue;

        if (msg.length>0) msg += ".";
        msg += ele.id + "/" + ele.pad[p_ind].name;
      }
    }

  }

  if (msg.length>0)
    this.tabCommunication.addMessage( "sch:" + g_brdnetwork.projectId, msg );
  else
    this.tabCommunication.addMessage( "sch:" + g_brdnetwork.projectId,  "");

}



bleepsixBoardController.prototype.highlightNetCodes = function ( sch_netcodes )
{
  var msg = "";
  for (var ind in sch_netcodes)
  {
    if (msg.length > 0) msg += ".";
    msg += sch_netcodes[ind].toString();
  }
  this.tabCommunication.addMessage( "sch:" + g_brdnetwork.projectId, msg );
}

bleepsixBoardController.prototype.unhighlightNet = function()
{
  this.tabCommunication.addMessage( "sch:" + g_brdnetwork.projectId, "" );
}


bleepsixBoardController.prototype.redraw = function ()
{

  var action_text_touched = false;
  var action_text_val = 0.0;

  var at_s = 0.4;

  if (this.action_text_flag)
  {
    if ( this.action_text_fade.T < this.action_text_fade.sustainDur )
    {
      action_text_val = at_s ;
      action_text_touched = true;
    }
  else if (this.action_text_fade.T < ( this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur) )
  {
    var t = this.action_text_fade.sustainDur + this.action_text_fade.dropoffDur - this.action_text_fade.T;
    action_text_val = at_s * t / this.action_text_fade.dropoffDur;
    action_text_touched = true;
  }
  else
    action_text_touched = false;

    if (action_text_touched)
    {
      g_painter.dirty_flag = true;
      var d = new Date();
      var curt = d.getTime();
      var dt = curt - this.action_text_fade.lastT;
      this.action_text_fade.T += dt;
      this.action_text_fade.lastT = curt;
    }

  }

  if ( g_brdnetwork )
  {
    if ( g_brdnetwork.projectId )
    {
      //this.tabCommunication.setId( "sch:" + g_brdnetwork.projectId );
    }
  }

  if ( g_brdnetwork )
  {
    if ( g_brdnetwork.projectId )
    {

      var channelName = "brd:" + g_brdnetwork.projectId;

      if ( this.tabCommunication.hasNewMessage( channelName ) )
      {
        msg = this.tabCommunication.processMessage( channelName );

        if (msg.length > 0)
        {
          var hi_netcodes = [];
          var sch_nets = msg.split('.');

          for (var i in sch_nets)
          {
            var map = this.board.kicad_brd_json.sch_to_brd_net_map[ parseInt(sch_nets[i]) ];
            for (var j in map)
            {
              hi_netcodes.push( map[j] );
            }
          }

          this.board.highlightNetCodes( hi_netcodes );

        }
        else
        {
          this.board.unhighlightNet();
        }

        g_painter.dirty_flag = true;
      }
    }
  }


  if (this.board.displayable)
    this.board.tick();

  if ( g_painter.dirty_flag )
  {
    g_painter.startDrawColor();
    g_painter.drawGrid();

    if (this.board.displayable) 
      this.board.drawBoard();

    this.tool.drawOverlay();
    g_painter.endDraw ();


    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );


    // One of these drawChildren calls doesn't clean up after themselves
    // leading me to clean up after them and reset the transform.
    //
    this.guiToolbox.drawChildren();
    this.guiLayer.drawChildren();
    this.guiGrid.drawChildren();



    //------------------------
    //
    // Draw text graphics
    //

    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (this.display_text_flag )
      g_painter.drawText(this.display_text, 10, 680, "rgba(255,255,255,0.5)", 15);

    if (this.project_name_text_flag)
      g_painter.drawText(this.project_name_text, 60, 10, "rgba(255,255,255,0.5)", 15);


    if (action_text_touched)
      g_painter.drawText(this.action_text, 10, 650, "rgba(255,255,255," + action_text_val + ")", 15);


    if (this.drawSnapArea)
    {
      var lw = 5;
      var ww = 900 + 2*lw;
      var hh = 525 + 2*lw;
      var xx = 50 - lw;
      var yy = 50 - lw;

      g_painter.drawRectangle( xx, yy, ww, hh, lw, "rgba(255,255,255,0.4)", false );
    }

    //
    //------------------------
    //



    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    // guiFootprintLibrary leaves the transform matrix (I think)
    // in a bad state.  Need to look at this to make sure it plays
    // nice with the other gui elements.  For now leave it.
    //
    this.guiFootprintLibrary.drawChildren();

    g_painter.dirty_flag = false;

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
}

bleepsixBoardController.prototype.mouseLeave = function( x, y ) 
{
}

bleepsixBoardController.prototype.resize = function( x, y, ev )
{
  this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);
  g_painter.dirty_flag = true;
}

bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

}

var g_debug_pos = 300;

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

  else if (ch == '8')
  {
    g_painter.dirty_flag = true;
    g_debug_pos -= 50;
    //this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);
    this.guiFootprintLibrary.move( g_debug_pos, 0 );
  }

  else if (ch == '9')
  {
    g_painter.dirty_flag = true;
    g_debug_pos += 50;
    this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);
    //this.guiFootprintLibrary.move( g_debug_pos, 0 );
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
  //console.log( "keyPress: " + keycode + " " + ch  );

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

  /*
  if (this.guiLayer.hitTest(x,y))
  {
    this.guiLayer.mouseDown(button, x, y);
    return;
  }
  */


  /*
  if (this.guiPalette.hitTest(x, y))
  {
    console.log(" gui component hit, letting it handle it");
    return;
  }
  */

  if (this.guiToolbox.hitTest(x,y))
  {
    this.guiToolbox.mouseDown(button, x, y);
    return;
  }

  if (this.guiLayer.hitTest(x,y))
  {
    this.guiLayer.mouseDown(button, x, y);
    return;
  }

  if (this.guiGrid.hitTest(x,y))
  {
    this.guiGrid.mouseDown(button, x, y);
    return;
  }

  /*
  if (this.guiAction.hitTest(x,y))
  {
    this.guiAction.mouseDown(button, x, y);
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

  if (this.guiToolbox.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiToolbox.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

  if (this.guiLayer.hitTest( this.mouse_cur_x, this.mouse_cur_y ))
  {
    this.guiLayer.doubleClick( e, this.mouse_cur_x, this.mouse_cur_y  );
    return;
  }

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

  /*
  else if (this.guiLayer.hitTest(x, y))
  {
    this.guiLayer.mouseWheelXY(delta, x, y);
  }
  */

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

  this.guiToolbox = new guiBoardToolbox( "toolbox" );
  this.guiToolbox.move( 0, 200);

  this.guiLayer = new guiBoardLayer( "layer" );
  this.guiLayer.move( 0, 450 );

  this.guiGrid = new guiGrid( "toolbox", "rgba(255,255,255,0.5)", undefined, "rgba(255,255,255,0.2)", true );
  this.guiGrid.move(0,0);

  var userId = ( g_brdnetwork ? g_brdnetwork.userId : undefined );
  var sessionId = ( g_brdnetwork ? g_brdnetwork.sessionId : undefined );
  var projectId = ( g_brdnetwork ? g_brdnetwork.projectId : undefined );
  this.guiFootprintLibrary = new guiFootprintLibrary( "library", userId, sessionId, projectId );
  this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);

  var controller = this;

  $(canvas_id).focus( function(ev) {
  });

  $(canvas_id).mouseup( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseUp( e.which , xy[0], xy[1] );
  });

  $(canvas_id).mousedown( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );

    controller.mouseDown( e.which, xy[0], xy[1] );
  });

  $(canvas_id).mouseover( function(e) {
  });

  $(canvas_id).mouseenter( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseEnter( xy[0], xy[1] );
  });

  $(canvas_id).mouseleave( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseLeave( xy[0], xy[1] );
  });

  $(canvas_id).mousemove( function(e) {
    var xy = controller.canvas_coords_from_global( e.pageX, e.pageY );
    controller.mouseMove( xy[0], xy[1] );
  });

  $(canvas_id).mousewheel( function(e, delta, detlax, deltay) {
    controller.mouseWheel( delta );
    return false;
  });

  $(canvas_id).click( function(e) {
  });

  $(canvas_id).dblclick( function(e) {
    controller.doubleClick(e);
  });

  $(canvas_id).keydown( function(e) {
    var key = ( e.which ? e.which : e.keyCode );
    var ch = String.fromCharCode(key);

    this.capState = $(window).capslockstate("state");

    return controller.keyDown( e.keyCode, ch, e );
  });

  $(canvas_id).keyup( function(e) {
    var key = e.which;
    var ch = String.fromCharCode(key);
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
    controller.capState = "on";
  });

  $(window).bind("capsOff", function(e) {
    controller.capState = "off";
  });

  $(window).bind("capsUnknown", function(e) {
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

if (typeof module !== 'undefined')
{
  module.exports = bleepsixBoardController;
}
