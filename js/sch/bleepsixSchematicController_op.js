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


bleepsixSchematicController.prototype.opSchAdd = function ( op )
{
  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  if ( !( "id" in op ) )
    op.id = this.schematic._createId();

  if      ( type == "connection" )
  {
    this.schematic.addConnection( data.x, data.y, op.id );  //
    var ref = this.schematic.refLookup( op.id );
    this.schematic.updateBoundingBox( ref );
  }
  else if ( type == "noconn" )
  {
    this.schematic.addNoconn( data.x, data.y, op.id ); //
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
    this.schematic.addWire( data.x0, data.y0, data.x1, data.y1, op.id ); //
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

bleepsixSchematicController.prototype.opSchUpdate = function ( op )
{

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "componentRotate90" )
  {
    var ref = this.schematic.refLookup( id );
    this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
    this.schematic.updateBoundingBox( ref );
  }
  else if ( type == "componentRotate180" )
  {
    var ref = this.schematic.refLookup( id );
    this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
    this.schematic.rotate90( { id: id, ref : ref } , op.ccw );
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

    for (var ind=0; ind<id.length; ind++)
    {
      var ref = this.schematic.refLookup( id[ind] );
      $.extend( true, ref, data.element[ind] );
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

bleepsixSchematicController.prototype.opSchDelete = function ( op )
{

  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;
  var id = op.id;

  if      ( type == "group" )
  {

    for (var ind in id )
    {
      var ref = this.schematic.refLookup( id[ind] );
      this.schematic.remove( { id: id[ind], ref: ref } );
    }

  }

}

bleepsixSchematicController.prototype.opCommand = function ( op )
{
  var source = op.source;
  var action = op.action;
  var type = op.type;
  var data = op.data;

  this.opHistory.push( op );
  if (this.opHistoryIndex >= 0)
    this.opHistoryIndex++;

  if ( source == "sch" )
  {
    if      ( action == "add" )    { this.opSchAdd( op ); }
    else if ( action == "update" ) { this.opSchUpdate( op ); }
    else if ( action == "delete" ) { this.opSchDelete( op ); }
  }

  else if (source == "brd" )
  {
    if      ( action == "add" )    { this.opBrdAdd( op ); }
    else if ( action == "update" ) { this.opBrdUpdate( op ); }
    else if ( action == "delete" ) { this.opBrdDelete( op ); }
  }

  // Some of this will need to change...
  // 
  g_painter.dirty_flag = true;
  this.schematicUpdate = true;
  this.schematic.eventSave();


}

