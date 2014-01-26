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

/* Encapsulates the 'command pattern' portion of bleepsixSchematicController.
 */

var schControllerHeadless = false;
if ( typeof module !== 'undefined')
{
  schControllerHeadless = true;
  var bleepsixSchematicController = require("./bleepsixSchematicController.js");
  module.exports = bleepsixSchematicController;
}


bleepsixSchematicController.prototype._opDebugPrint = function ( )
{
  console.log("DEBUG: g_schematic_controller.schematic.ref_lookup");
  console.log( "  opHistoryIndex: " + this.opHistoryIndex );
  console.log( "  opHistoryStart: " + this.opHistoryStart );
  console.log( "  opHistoryEnd: " + this.opHistoryEnd );
  console.log( "  opHistory.length: " + this.opHistory.length);
  console.log( this.opHistory );

}


bleepsixSchematicController.prototype._opAddSingle = function ( type, id, data )
{

  if      ( type == "connection" )
  {
    this.schematic.addConnection( data.x, data.y, id ); 
    var ref = this.schematic.refLookup( id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "noconn" )
  {
    this.schematic.addNoconn( data.x, data.y, id ); 
    var ref = this.schematic.refLookup( id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "componentData" )
  {
    this.schematic.addComponentData( data.componentData, data.x, data.y, data.transform, id );
    var ref = this.schematic.refLookup( id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "component" )
  {
    this.schematic.addComponent( data.name, data.x, data.y, data.transform, id );
    var ref = this.schematic.refLookup( id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "wireline" )
  {
    //this.schematic.addWire( data.x0, data.y0, data.x1, data.y1, id );
    this.schematic.addWire( data.startx, data.starty, data.endx, data.endy, id );
    var ref = this.schematic.refLookup( id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "busline" )
  {
    console.log("bleepsixSchematicController.opSchAdd busline not implemented\n");
  }
  else if ( type == "entrybusbus" )
  {
    console.log("bleepsixSchematicController.opSchAdd entrybusbus not implemented\n");
  }
  else if ( type == "textnote" )
  {
    console.log("bleepsixSchematicController.opSchAdd textnote not implemented\n");
  }
  else if ( type == "label" )
  {
    console.log("bleepsixSchematicController.opSchAdd label not implemented\n");
  }
  else if ( type == "labelglobal" )
  {
    console.log("bleepsixSchematicController.opSchAdd labelglobal not implemented\n");
  }
  else if ( type == "labelheirarchical" )
  {
    console.log("bleepsixSchematicController.opSchAdd labelheirarchical not implemented\n");
  }

}

bleepsixSchematicController.prototype.opSchAdd = function ( op, inverseFlag )
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

  this._opAddSingle( type, op.id, data );
  return;

  if      ( type == "connection" )
  {
    this.schematic.addConnection( data.x, data.y, op.id ); 
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "noconn" )
  {
    this.schematic.addNoconn( data.x, data.y, op.id ); 
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "componentData" )
  {
    this.schematic.addComponentData( data.componentData, data.x, data.y, data.transform, op.id );
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "component" )
  {
    this.schematic.addComponent( data.name, data.x, data.y, data.transform, op.id );
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "wireline" )
  {
    //this.schematic.addWire( data.x0, data.y0, data.x1, data.y1, op.id );
    this.schematic.addWire( data.startx, data.stary, data.endx, data.endy, op.id );
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }

  else if ( type == "busline" )
  {
    console.log("bleepsixSchematicController.opSchAdd busline not implemented\n");
  }
  else if ( type == "entrybusbus" )
  {
    console.log("bleepsixSchematicController.opSchAdd entrybusbus not implemented\n");
  }
  else if ( type == "textnote" )
  {
    console.log("bleepsixSchematicController.opSchAdd textnote not implemented\n");
  }
  else if ( type == "label" )
  {
    console.log("bleepsixSchematicController.opSchAdd label not implemented\n");
  }
  else if ( type == "labelglobal" )
  {
    console.log("bleepsixSchematicController.opSchAdd labelglobal not implemented\n");
  }
  else if ( type == "labelheirarchical" )
  {
    console.log("bleepsixSchematicController.opSchAdd labelheirarchical not implemented\n");
  }

}

bleepsixSchematicController.prototype.opSchUpdate = function ( op, inverseFlag )
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

bleepsixSchematicController.prototype.opSchDelete = function ( op, inverseFlag )
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

        console.log("DEBUG:");
        console.log(ref);

        this._opAddSingle( ref.type, ref.id, ref );
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

bleepsixSchematicController.prototype.opCommand = function ( op, inverseFlag, replayFlag )
{
  inverseFlag = ( (typeof inverseFlag !== 'undefined') ? inverseFlag : false );
  replayFlag = ( (typeof replayFlag !== 'undefined') ? replayFlag : false );

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  /*
  if ( this.opHistoryEnd < 0 )  //special case for beginning of history
  {
    if (this.opHistory.length > 0)
      this.opHistory[ this.opHistoryEnd ] = op;
    else
      this.opHistory.push( op );
  }
  else if ( this.opHistoryEnd >= this.opHistory.length )
  {
    this.opHistory.push( op );
  }
  else
  {
    this.opHistory[ this.opHistoryEnd ] = op;
  }
  */

  if (!replayFlag)
  {

    this.opHistoryEnd++;
    if ( this.opHistoryEnd < this.opHistory.length )
    {
      this.opHistory[ this.opHistoryEnd ] = op;
    }
    else
    {
      this.opHistory.push( op );
    }

    this.opHistory = this.opHistory.slice(0, this.opHistoryEnd+1);

  }

  if (this.opHistoryIndex >= 0)
    this.opHistoryIndex++;

  if ( source == "sch" )
  {
    if      ( action == "add" )    { this.opSchAdd( op, inverseFlag ); }
    else if ( action == "update" ) { this.opSchUpdate( op, inverseFlag ); }
    else if ( action == "delete" ) { this.opSchDelete( op, inverseFlag ); }
  }

  else if (source == "brd" )
  {
    if      ( action == "add" )    { this.opBrdAdd( op, inverseFlag ); }
    else if ( action == "update" ) { this.opBrdUpdate( op, inverseFlag ); }
    else if ( action == "delete" ) { this.opBrdDelete( op, inverseFlag ); }
  }

  // Some of this will need to change...
  // 
  g_painter.dirty_flag = true;
  this.schematicUpdate = true;


}


bleepsixSchematicController.prototype.opUndo = function()
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

bleepsixSchematicController.prototype.opRedo = function()
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

