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

/* Encapsulates the 'command pattern' portion of bleepsixSchBrdOp.
 */

var schBrdOpHeadless = false;
if ( typeof module !== 'undefined')
{
  schBrdOpHeadless = true;
}

function bleepsixSchBrdOp( schematic, board )
{
  this.schematic = schematic;
  this.board = board;

  // Global index.  Will be updated by communcation back to central DB. 
  // Initially set to -1 to indicate we don't know what the absolute index is.
  //
  this.opHistoryIndex = -1;

  // local parameters for unde/redo history.
  //
  this.opHistoryStart = 0;
  this.opHistoryEnd = -1;

  this.opHistory = [];

}

bleepsixSchBrdOp.prototype._opDebugPrint = function ( )
{
  console.log("DEBUG: g_schematic_controller.schematic.ref_lookup");
  console.log( "  opHistoryIndex: " + this.opHistoryIndex );
  console.log( "  opHistoryStart: " + this.opHistoryStart );
  console.log( "  opHistoryEnd: " + this.opHistoryEnd );
  console.log( "  opHistory.length: " + this.opHistory.length);
  console.log( this.opHistory );

}

//-- ADD (single)

bleepsixSchBrdOp.prototype._opBrdAddSingle = function ( type, id, data, op )
{

  var updateBBox = true;
  op = ((typeof op !== 'undefined') ? op : {} );

  if      ( type == "net" )
  {
    this.board.addNet( data.netcode, data.netname, id );
  }

  else if ( type == "via" )
  {
    this.board.addVia( data.x, data.y, data.width, data.layer0, data.layer1, data.netcode, id );
  }

  else if ( type == "track" )
  {
    this.board.addTrack( data.x0, data.y0, data.x1, data.y1, data.width, data.layer, data.netcode, id );
  }

  else if ( type == "footprint" )
  {
    this.board.addFootprintData( data.footprintData, data.x, data.y, id, op.idText );
  }

  else if ( type == "footprintData" )
  {
    //DEBUG
    console.log("adding footprintData: " + id);
    console.log( data.footprintData );

    this.board.addFootprintData( data.footprintData, data.x, data.y, id, op.idText );
  }
  else if ( type == "czone" )
  {
    this.board.addCZone( data.points, data.netcode, data.layer, data.polyscorners, id );
  }
  else
  {
    updateBBox = false;
  }

  if (updateBBox)
  {
    var ref = this.board.refLookup( id );
    if (ref)
      this.board.updateBoundingBox( ref );
    else
      console.log("bleepsixSchBrdOp._opBrdAdd: ERROR: refLookup for id " + id + 
          " failed.  Not updating bounding box");
  }

}

bleepsixSchBrdOp.prototype._undeleteComponent = function ( ref )
{
  this.schematic.addComponentData( 
      ref, 
      ref.x, ref.y, 
      ref.transform, 
      ref.id, 
      [ ref.text[0].id, ref.text[1].id ] );

  var comp = this.schematic.refLookup( ref.id );
  comp.text[0].text = ref.text[0].text;
  comp.text[0].x = ref.text[0].x;
  comp.text[0].y = ref.text[0].y;

  comp.text[1].text = ref.text[1].text;
  comp.text[1].x = ref.text[1].x;
  comp.text[1].y = ref.text[1].y;
}


bleepsixSchBrdOp.prototype._opSchAddSingle = function ( type, id, data, op )
{
  var updateBBox = true;
  op = ((typeof op !== 'undefined') ? op : {} );

  if      ( type == "connection" )
  {
    this.schematic.addConnection( data.x, data.y, id ); 
  }

  else if ( type == "noconn" )
  {
    this.schematic.addNoconn( data.x, data.y, id ); 
  }

  else if ( type == "componentData" )
  {
    this.schematic.addComponentData( data.componentData, data.x, data.y, data.transform, id, op.idText  );
  }

  else if ( type == "component" )
  {
    this.schematic.addComponent( data.name, data.x, data.y, data.transform, id, op.idText );
  }

  else if ( type == "wireline" )
  {
    this.schematic.addWire( data.startx, data.starty, data.endx, data.endy, id );
  }

  else if ( type == "busline" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd busline not implemented\n");
    updateBBox = false;
  }
  else if ( type == "entrybusbus" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd entrybusbus not implemented\n");
    updateBBox = false;
  }
  else if ( type == "textnote" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd textnote not implemented\n");
    updateBBox = false;
  }
  else if ( type == "label" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd label not implemented\n");
    updateBBox = false;
  }
  else if ( type == "labelglobal" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd labelglobal not implemented\n");
    updateBBox = false;
  }
  else if ( type == "labelheirarchical" )
  {
    console.log("bleepsixSchBrdOp.opSchAdd labelheirarchical not implemented\n");
    updateBBox = false;
  }
  else
  {
    updateBBox = false;
  }

  if (updateBBox)
  {
    var ref = this.schematic.refLookup( id );
    if (ref)
      this.schematic.updateBoundingBox( ref );
    else
      console.log("bleepsixSchBrdOp._opSchAdd: ERROR: refLookup for id " + id + " failed.  Not updating bounding box");
  }

}

//-- ADD

bleepsixSchBrdOp.prototype.opSchAdd = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );
  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  if ( !( "id" in op ) )
    op.id = this.schematic._createId();

  if (inverseFlag)
  {
    var ref = this.schematic.refLookup( op.id );
    this.schematic.remove( { id: op.id, ref: ref } );
    return;
  }

  this._opSchAddSingle( type, op.id, data, op );

}

bleepsixSchBrdOp.prototype.opBrdAdd = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );
  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  if ( !( "id" in op ) )
    op.id = this.board._createId();

  if (inverseFlag)
  {
    var ref = this.board.refLookup( op.id );
    this.board.remove( { id: op.id, ref: ref } );
    return;
  }

  this._opBrdAddSingle( type, op.id, data, op );

}

//-- UPDATE 

bleepsixSchBrdOp.prototype.opSchUpdate = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "componentRotate90" )
  {
    var ccw_flag = ( inverseFlag ? (!data.ccw) : data.ccw );
    var ref = this.schematic.refLookup( id );

    //this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
    this.schematic.rotate90( { id: id, ref : ref } , ccw_flag );

    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "componentRotate180" )
  {
    var ccw_flag = ( inverseFlag ? (!data.ccw) : data.ccw );

    var ref = this.schematic.refLookup( id );

    //this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
    //this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
    this.schematic.rotate90( { id: id, ref : ref } , ccw_flag );
    this.schematic.rotate90( { id: id, ref : ref } , ccw_flag );

    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "componentFlip" )
  {
    var ref = this.schematic.refLookup( id );
    this.schematic.flip( { id: id, ref: ref } );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "edit" )
  {

    if (inverseFlag)
    {

      console.log("opSchUpdate edit inverse: length: " + data.oldElement.length);
      console.log( data.oldElement );

      for (var ind=0; ind< data.oldElement.length; ind++)
      {
        var ref = this.schematic.refLookup( data.element[ind].id );
        //$.extend( true, ref, data.oldElement[ind].ref );
        $.extend( true, ref, data.oldElement[ind] );
        this.schematic.refUpdate( id[ind], data.oldElement[ind].id );
      }

    }
    else
    {

      // id holds array of _new_ ids.  oldElement has old id.
      // array lengths of oldelement, id and element must match.
      //
      for (var ind=0; ind<id.length; ind++)
      {
        var ref = this.schematic.refLookup( data.oldElement[ind].id );
        $.extend( true, ref, data.element[ind] );
        this.schematic.refUpdate( data.oldElement[ind].id, id[ind] );
      }

    }

  }
  else if ( type == "moveGroup" )
  {

    var id_ref_ar = [];
    for (var ind in id)
    {
      var ref = this.schematic.refLookup( id[ind] );
      id_ref_ar.push( { id: id[ind], ref: ref } );
    }

    var cx = op.data.cx;
    var cy = op.data.cy;
    var dx = op.data.dx;
    var dy = op.data.dy;
    var rotateCount = op.data.rotateCount;

    if (inverseFlag)
    {
      for (var ind in id_ref_ar)
      {
        this.schematic.relativeMoveElement( id_ref_ar[ind], -dx, -dy );
        this.schematic.updateBoundingBox( id_ref_ar[ind].ref );
      }

      for (var i=0; (i<4) && (i<rotateCount); i++)
      {
        this.schematic.rotateAboutPoint90( id_ref_ar, cx, cy, true );
      }

    }
    else
    {

      for (var i=0; (i<4) && (i<rotateCount); i++)
      {
        this.schematic.rotateAboutPoint90( id_ref_ar, cx, cy, false );
      }

      for (var ind in id_ref_ar)
      {
        this.schematic.relativeMoveElement( id_ref_ar[ind], dx, dy );
        this.schematic.updateBoundingBox( id_ref_ar[ind].ref );
      }

    }

  }

}


bleepsixSchBrdOp.prototype.opBrdUpdate = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "moveGroup" )
  {
    var id_ref_ar = [];
    for (var ind in id)
    {
      var ref = this.board.refLookup( id[ind] );
      id_ref_ar.push( { id: id[ind], ref: ref } );
    }

    var cx = op.data.cx;
    var cy = op.data.cy;
    var dx = op.data.dx;
    var dy = op.data.dy;
    var rotateCount = op.data.rotateCount;

    if (inverseFlag)
    {
      for (var ind in id_ref_ar)
      {
        this.board.relativeMoveElement( id_ref_ar[ind], -dx, -dy );
        this.board.updateBoundingBox( id_ref_ar[ind].ref );
      }

      for (var i=0; (i<4) && (i<rotateCount); i++)
      {
        this.board.rotateAboutPoint90( id_ref_ar, cx, cy, true );
      }

    }
    else
    {

      for (var i=0; (i<4) && (i<rotateCount); i++)
      {
        this.board.rotateAboutPoint90( id_ref_ar, cx, cy, false );
      }

      for (var ind in id_ref_ar)
      {
        this.board.relativeMoveElement( id_ref_ar[ind], dx, dy );
        this.board.updateBoundingBox( id_ref_ar[ind].ref );
      }

    }
  }
  else if (type == "rotate90")
  {

    console.log("board rotate90");

    var ccw_flag = ( inverseFlag ? (!data.ccw) : data.ccw );
    var ref = this.board.refLookup( id );
    this.board.rotate90( { id: id, ref : ref } , ccw_flag );
    this.board.updateBoundingBox( ref );
  }
  else if (type == "rotate" )
  {
    console.log("board rotate");

    var ccw_flag = ( inverseFlag ? (!data.ccw) : data.ccw );
    var ref = this.board.refLookup( id );

    console.log("id:" + id);
    console.log(ref);

    this.board.rotateAboutPoint( 
        [ { id: id, ref : ref } ] , 
        data.cx, data.cy,
        data.angle,
        ccw_flag );
    this.board.updateBoundingBox( ref );
  }
  else if (type == "fillczone")
  {
    console.log("fillczone");

    for (var ind in id)
    {
      var ref = this.board.refLookup( id[ind] );
      this.board.fillCZone( ref );
    }

  }

     

}


//-- DELETE

bleepsixSchBrdOp.prototype.opSchDelete = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "group" )
  {

    if (inverseFlag)
    {

      for (var ind in id )
      {
        var ref = data.element[ind];

        if ( ref.type == "component" )
        {
          this._undeleteComponent( ref );
        }
        else
        {
          this._opSchAddSingle( ref.type, ref.id, ref );
        }
      }

    }

    else
    {

      for (var ind in id )
      {
        var ref = this.schematic.refLookup( id[ind] );
        this.schematic.remove( { id: id[ind], ref: ref } );
      }

    }

  }

}

bleepsixSchBrdOp.prototype.opBrdDelete = function ( op, inverseFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "group" )
  {

    if (inverseFlag)
    {

      for (var ind in id )
      {
        var ref = data.element[ind];
        this._opBrdAddSingle( ref.type, ref.id, ref );
      }

    }

    else
    {

      for (var ind in id )
      {
        var ref = this.board.refLookup( id[ind] );
        this.board.remove( { id: id[ind], ref: ref } );
      }

    }

  }

}



bleepsixSchBrdOp.prototype.opCommand = function ( op, inverseFlag, replayFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );
  replayFlag = ( (typeof replayFlag !== 'undefined') ? replayFlag : false );

  var source = op.source;
  var dest = op.destination;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  if (!replayFlag)
  {
    this.opHistoryEnd++;
    var end = this.opHistoryEnd;
    var hist = this.opHistory;

    if ( end < hist.length ) { hist[ end ] = op; }
    else                     { hist.push( op ); }

    this.opHistory = hist.slice(0, end+1);

  }

  if (this.opHistoryIndex >= 0)
    this.opHistoryIndex++;

  if ( dest == "sch" )
  {
    if      ( action == "add" )    { this.opSchAdd( op, inverseFlag ); }
    else if ( action == "update" ) { this.opSchUpdate( op, inverseFlag ); }
    else if ( action == "delete" ) { this.opSchDelete( op, inverseFlag ); }
  }

  else if ( dest == "brd" )
  {
    if      ( action == "add" )    { this.opBrdAdd( op, inverseFlag ); }
    else if ( action == "update" ) { this.opBrdUpdate( op, inverseFlag ); }
    else if ( action == "delete" ) { this.opBrdDelete( op, inverseFlag ); }
  }

}


bleepsixSchBrdOp.prototype.opUndo = function( src )
{
  console.log("opUndo");

  if ( this.opHistoryEnd >= 0 )
  {

    console.log(this.opHistory[ this.opHistoryEnd ] );

    this.opCommand( this.opHistory[ this.opHistoryEnd ], true, true );
    this.opHistoryEnd--;
  }
  else
  {
    console.log("bleepsixSchematic.opUndo: already at first element, can't undo any further");
  }

}

bleepsixSchBrdOp.prototype.opRedo = function( src )
{
  console.log("opRedo");

  if ( this.opHistoryEnd < (this.opHistory.length-1) )
  {
    this.opHistoryEnd++;
    this.opCommand( this.opHistory[ this.opHistoryEnd ], false, true );
  }
  else
  {
    console.log("bleepsixSchematic.opRedo: already at last element, can't redo any further");
  }

}

if ( typeof module !== 'undefined')
{
  module.exports = bleepsixSchBrdOp ;
}


