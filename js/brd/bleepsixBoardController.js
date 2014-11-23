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

  var bleepsixAux = require("../lib/meowaux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;

}



function bleepsixBoardController( viewMode ) {

  this.viewMode = ( (typeof viewMode === 'undefined') ? false : viewMode );

  this.canvas = null;
  this.context = null;

  this.type = "board";

  this.board = new bleepsixBoard();
  this.schematic = new bleepsixSchematic();

  this.op = new bleepsixSchBrdOp( this.schematic, this.board );

  this.mouse_left_down = false;
  this.mouse_center_down = false;
  this.mouse_right_down = false;

  this.mouse_start_x = 0;
  this.mouse_start_y = 0;
  this.mouse_cur_x = 0;
  this.mouse_cur_y = 0;

  this.width = 1200;
  this.height = 700;

  this.queued_display_module = 0;

  this.opHistoryStart = 0;
  this.opHistoryN = 0;
  this.opHistory = [];

  if (!brdControllerHeadless)
  {
    this.tool = new toolBoardNav ( undefined, undefined, this.viewMode );
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


//---------------


bleepsixBoardController.prototype._opDebugPrint = function ( )
{
  console.log("DEBUG: bleepsixBoardController._opDebugPrint");
  console.log( "  opHistoryIndex: " + this.opHistoryIndex );
  console.log( "  opHistoryStart: " + this.opHistoryStart );
  console.log( "  opHistoryN: " + this.opHistoryN );
  console.log( "  opHistory.length: " + this.opHistory.length);
  console.log( this.opHistory );

}

bleepsixBoardController.prototype.opHistoryUpdate = function ( msg )
{
  var replayFlag = ( (typeof msg.replayFlag === "undefined") ? false : msg.replayFlag );

  if (!replayFlag)
  {
    var n = this.opHistoryN;
    var hist = this.opHistory;
    if ( n < hist.length ) { hist[n] = msg; }
    else                   { hist.push( msg ); }

    this.opHistoryN++;
    this.opHistory = hist.slice(0,this.opHistoryN);
  }

}



bleepsixBoardController.prototype.opUndo = function( )
{
  //this.op.opUndo();

  if ( this.opHistoryN > 0 )
  {

    var ind = this.opHistoryN-1;

    var start_group_id = this.opHistory[ ind ].groupId ;
    while ( ( this.opHistoryN > 0 ) &&
            ( this.opHistory[ ind ].groupId == start_group_id ) )
    {

      var op = this.opHistory[ind];

      if ( ("type" in op) && (op["type"] == "batch") )
      {
        var batch_op = op;
        var ops = batch_op["ops"];

        for (var i=0; i<ops.length; i++)
        {
          ops[i].inverseFlag = true;
          ops[i].replayFlag = true;
          //this.op.opCommand( ops[i], true, true );
          this.op.opCommand( ops[i] );
        }

        if ( batch_op.scope == "network" )
        {

          for (var i=0; i<ops.length; i++)
          {
            ops[i].inverseFlag = true;
            ops[i].replayFlag = true;
            g_brdnetwork.projectop( ops[i] );
          }

        }

      }
      else
      {

        //this.opCommand( this.opHistory[ ind ], true, true );
        op.inverseFlag = true;
        op.replayFlag = true;

        //this.op.opCommand( op, true, true );
        this.op.opCommand( op );
        if ( op.scope == "network" )
        {
          g_brdnetwork.projectop( op );
        }

      }

      this.opHistoryN--;
      ind = this.opHistoryN-1;

    }

  }
  else
  {
    console.log("bleepsixBoardController.opUndo: already at first element, can't undo any further");
  }

  this.boardUpdate = true;
  g_painter.dirty_flag = true;
}

bleepsixBoardController.prototype.opRedo = function( )
{
  //this.op.opRedo();

  if ( this.opHistoryN < this.opHistory.length )
  {

    var ind = this.opHistoryN;

    //DEBUG
    console.log(">> redoing...");
    console.log( ind, this.opHistory );
    console.log( this.opHistory[ind] );

    var start_group_id = this.opHistory[ ind ].groupId ;

    //DEBUG
    console.log( start_group_id, this.opHistory[ind].groupId );

    while ( ( this.opHistoryN < this.opHistory.length ) &&
            ( this.opHistory[ ind ].groupId == start_group_id ) )
    {

      //DEBUG
      console.log( ">>>", start_group_id, this.opHistory[ind].groupId );

      var op = this.opHistory[ind];

      if ( ("type" in op) && (op["type"] == "batch") )
      {
        var batch_op = op;
        var ops = batch_op["ops"];

        for (var i=0; i<ops.length; i++)
        {
          ops[i].inverseFlag = false;
          ops[i].replayFlag = true;
          //this.op.opCommand( ops[i], false, true );
          this.op.opCommand( ops[i] );
        }

        if ( batch_op.scope == "network" )
        {

          for (var i=0; i<ops.length; i++)
          {
            ops[i].inverseFlag = false;
            ops[i].replayFlag = true;
            g_brdnetwork.projectop( ops[i] );
          }

        }

      }
      else
      {
        //DEBUG
        console.log(">>normal redo op>>", op);

        //this.opCommand( this.opHistory[ ind ], true, true );
        op.inverseFlag = false;
        op.replayFlag = true;

        //this.op.opCommand( op, false, true );
        this.op.opCommand( op );
        if ( op.scope == "network" )
        {
          g_brdnetwork.projectop( op );
        }

      }

      this.opHistoryN++;
      ind = this.opHistoryN;

    }

  }
  else
  {
    console.log("bleepsixBoardController.opUndo: already at first element, can't undo any further");
  }

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
  msg.inverseFlag = false;
  msg.replayFlag = false;

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

  this.opHistoryUpdate( msg );


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
    schop.inverseFlag = false;
    schop.replayFlag = false;

    this.op.opCommand( schop );

    if ( g_brdnetwork && (msg.scope == "network") )
    {
      g_brdnetwork.projectop( schop );
    }

    this.opHistoryUpdate( schop );

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
      netop.inverseFlag = false;
      netop.replayFlag = false;
      this.op.opCommand( netop );

      if ( g_brdnetwork && (msg.scop == "network") )
        g_brdnetwork.projectop( netop );

      this.opHistoryUpdate( netop );
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
    schop.inverseFlag = false;
    schop.replayFlag = false;

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

      this.opHistoryUpdate( schop );
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
  if (g_brdnetwork)
  {
    this.tabCommunication.addMessage( "sch:" + g_brdnetwork.projectId, "" );
  }
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

          //DEBUG
          console.log("+++ tabComm")

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

    if (!this.viewMode)
    {
      this.guiToolbox.drawChildren();
      this.guiLayer.drawChildren();
    }
    this.guiGrid.drawChildren();



    //------------------------
    //
    // Draw text graphics
    //

    g_painter.context.setTransform ( 1, 0, 0, 1, 0, 0 );

    if (this.display_text_flag )
    {
      //g_painter.drawText(this.display_text, 10, 680, "rgba(255,255,255,0.5)", 15);

      var _height = this.height-20;
      g_painter.drawText(this.display_text, 10, _height, "rgba(255,255,255,0.5)", 15);

    }

    if (this.project_name_text_flag)
      g_painter.drawText(this.project_name_text, 60, 10, "rgba(255,255,255,0.5)", 15);


    if (action_text_touched)
    {
      //g_painter.drawText(this.action_text, 10, 650, "rgba(255,255,255," + action_text_val + ")", 15);

      var _height = this.height-50;
      g_painter.drawText(this.action_text, 10, _height, "rgba(255,255,255," + action_text_val + ")", 15);
    }


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
    if (!this.viewMode)
    {
      this.guiFootprintLibrary.drawChildren();
    }

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

bleepsixBoardController.prototype.resize = function( w, h, ev )
{
  this.guiFootprintLibrary.move( g_painter.width - this.guiFootprintLibrary.width, 0);
  g_painter.dirty_flag = true;

  this.width = w;
  this.height = h;
}

/*
bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{
  if (typeof this.tool.keyDown !== 'undefined' )
  {
    r = this.tool.keyDown( keycode, ch, ev );
  }

}
*/

bleepsixBoardController.prototype.keyUp = function( keycode, ch, ev )
{
  if (this.viewMode) { return true; }

  if (typeof this.tool.keyUp !== 'undefined' )
  {
    r = this.tool.keyUp( keycode, ch, ev );
  }

}


var g_debug_pos = 300;

bleepsixBoardController.prototype.keyDown = function( keycode, ch, ev )
{

  if (this.viewMode) {
    var r = true;
   if (typeof this.tool.keyDown !== 'undefined' )
   {
     r = this.tool.keyDown( keycode, ch, ev );
   }
   return r;
  }

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
  if (this.viewMode) { return true; }

  //console.log( "keyPress: " + keycode + " " + ch  );

  if (typeof this.tool.keyPress !== 'undefined' )
    this.tool.keyPress( keycode, ch, ev );
}


bleepsixBoardController.prototype.mouseDown = function( button, x, y )
{

  if (!this.viewMode)
  {

    if (this.guiFootprintLibrary.hitTest(x,y))
    {
      this.guiFootprintLibrary.mouseDown(button, x, y);
      return;
    }

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

  if (!this.viewMode)
  {

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

  if (this.viewMode) { return true; }

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

  if (!this.viewMode)
  {
    if (this.movingFootprintLibrary)
      this.guiFootprintLibrary.move(x, y);

    if (this.movingLayer)
      this.guiLayer.move(x, y);
  }

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

  if (!this.viewMode)
  {
    if (this.guiFootprintLibrary.hitTest(x, y))
    {
      this.guiFootprintLibrary.mouseWheelXY(delta, x, y);
    }
    else if (typeof this.tool.mouseWheel !== 'undefined' )
    {
      this.tool.mouseWheel ( delta );
    }

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

    return controller.keyUp( e.keyCode, ch, e );
  });

  $(canvas_id).resize( function(w, h, e) {
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
