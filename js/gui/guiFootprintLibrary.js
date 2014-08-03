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

function guiFootprintLibrary( name, userId, sessionId, projectId ) 
{
  this.constructor(name);


  this.bgColor = "rgba(200,200,200, 0.6)";

  this.border = 10;

  this.height = 700 - 4*this.border;
  this.width = 200;

  this.myname = "foo";

  var guilist = new guiList("guiFootprintLibrary:list" );
  guilist.init( this.border, this.border, this.width, this.height - this.width );
  //guilist.move( this.border,this.border);

  guilist.indexN = 46;
  guilist.updateList();

  var foo = this;
  guilist.registerPickCallback( function(data) { foo.listPick(data); }  );

  this.addChild( guilist );



  // Ideally we would be able to load either dynamically or dependent
  // on user preferences.  For now, we will load in a footprint library
  // of default values stored in "footprint_list_default.json", which
  // stores the json object of list elements to populate our
  // list gui element.
  //

  this.fetchModuleLibrary( userId, sessionId, projectId );



  // Create and position snugly to the right
  //
  var guiFoot = new guiFootprintTile( "guiFootprintLibrary:footprint", "" );
  guiFoot.x = this.border;
  guiFoot.y = (this.height - this.width) + 3*this.border;
  guiFoot.width = this.width;
  guiFoot.height = this.width;

  var bar = this;
  guiFoot.registerPickCallback( function(data) { bar.tilePick(data); } );

  this.addChild( guiFoot );

  this.height += 4*this.border ;
  this.width  += 2*this.border ;

  this.move(300, 25);

  g_painter.dirty_flag = true;

}

guiFootprintLibrary.inherits ( guiRegion );

guiFootprintLibrary.prototype.fetchModuleLibrary = function( userId, sessionId, projectId )
{
  var foo = this;

  $.ajaxSetup({cache :false });

  var req = { op : "MOD_LIST" };
  if ( (typeof userId !== 'undefined') && 
       (typeof sessionId !== 'undefined') &&
       (typeof projectId !== 'undefined') ) 
  {
    req = { op : "MOD_LIST", userId : userId, sessionId : sessionId, projectId: projectId  };
  }

  $.ajax({
    url : "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),
    dataType: "json",
    success: function(data) { foo.load_webkicad_module_json(data); },
    error: 
    function(jqxr, textStatus, error) {
      console.log("FAIL:");
      console.log(jqxr);
      console.log(textStatus);
      console.log(error);
    }
  });

}

// Build up our list gui element
//
guiFootprintLibrary.prototype.load_webkicad_module_json = function(data)
{

  this.guiChildren[0].clearList();

  var parent = null;

  for (var ind in data)
  {
    var ele = data[ind];

    if (ele.type == "list")
    {
      this.guiChildren[0].addList( ele.id, ele.name );
      parent = ele.id ;

      for (var foot_ind in ele.list)
      {
        var foot = ele.list[foot_ind];
        if (foot.type == "element")
        {
          this.guiChildren[0].add( foot.id, foot.name, foot.data, parent);
        }
      }
    }
  }

  g_painter.dirty_flag = true;

}


guiFootprintLibrary.prototype.listPick = function(list_ele)
{
  if (list_ele.type == "element")
  {

    var userId = ( g_brdnetwork ? g_brdnetwork.userId : undefined );
    var sessionId = ( g_brdnetwork ? g_brdnetwork.sessionId : undefined );
    var projectId = ( g_brdnetwork ? g_brdnetwork.projectId : undefined );
    load_footprint_cache_part( list_ele.name, list_ele.data, userId, sessionId, projectId );

    this.guiChildren[1].footprint_name = list_ele.name;
    this.guiChildren[1].refresh();
  }
}

guiFootprintLibrary.prototype.tilePick = function(tile_ele)
{
}

guiFootprintLibrary.prototype.load_library = function(data)
{
}

guiFootprintLibrary.prototype.load_library_error = function(jqxr, textStatus, error)
{
  console.log("load error for " + this.myname)
  console.log(jqxr);
  console.log(textStatus);
  console.log(error);
}

/*
guiFootprintLibrary.prototype.hitTest = function(x, y)
{
  for (var ind in this.guiChildren)
  {
    this.guiChildren[ind].hitTest(x,y);
  }
}
*/

guiFootprintLibrary.prototype.mouseDown = function(button, x, y )
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  if (this.guiChildren[1].visible && this.guiChildren[1].ready )
  {
    var r = this.guiChildren[1].hitTest(x, y);

    if (r)
    {
      g_board_controller.tool = new toolFootprintPlace( x, y, this.guiChildren[1].footprint_name );
      return true;
    }

  }

  if (this.guiChildren[0].hitTest(x, y))
  {
    return this.guiChildren[0].mouseDown(button, x, y);
  }

  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {
    return true;
  }

  return false;

}

guiFootprintLibrary.prototype.mouseWheel = function(delta)
{

  /*
  this.indexStart += delta;
  if (this.indexStart < 0)
    this.indexStart = 0;

  this.indexEnd = this.indexStart + this.indexN;
 */
}

/*
guiFootprintLibrary.prototype.mouseWheelXY = function(delta, x, y)
{
  console.log("???");
}
*/

guiFootprintLibrary.prototype.draw = function()
{

  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );
}


