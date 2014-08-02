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

function guiLibrary( name, userId, sessionId, projectId ) 
{

  this.constructor(name);

  //this.bgColor = "rgba(0,0,255, 0.2)";
  this.bgColor = "rgba(0,0,0, 0.2)";

  this.border = 10;

  this.height = 600;
  this.width = 200;

  this.myname = "foo";

  var guilist = new guiList("guiLibrary:list" );
  guilist.init( this.border, this.border, this.width, this.height - this.width );
  //guilist.move( this.border,this.border);

  guilist.indexN = 40;
  guilist.updateList();

  var foo = this;
  guilist.registerPickCallback( function(data) { foo.listPick(data); }  );

  this.addChild( guilist );




  /*
  $.ajaxSetup({cache :false });
  $.getJSON( "json/component_list_default.json",
              function(data) {
                foo.load_webkicad_library_json(data);
              }
           ).fail( function(jqxr, textStatus, error) { console.log("FAIL:" + textStatus + error); } );
           */
  this.fetchComponentList( userId, sessionId, projectId );


  var guiComp = new guiComponentTile( "guiLibrary:component", "" );
  guiComp.x = this.border;

  //guiComp.y = this.height/2 + 3*this.border;
  guiComp.y = (this.height - this.width) + 3*this.border;

  guiComp.width = this.width;

  //guiComp.height = this.height/2;
  guiComp.height = this.width;

  var bar = this;
  guiComp.registerPickCallback( function(data) { bar.tilePick(data); } );

  this.addChild( guiComp );


  /*
  var lib = this;
  $.ajaxSetup({ cache : false });
  $.getJSON( "library_list.json",
              function(data) {
                lib.load_library(data);
              }
           ).fail(
            function(jqxr, textStatus, error) {
              lib.load_library_error(jqxr, textStatus, error);
            }
           );
  */

  this.height += 4*this.border ;
  this.width  += 2*this.border ;
  //this.move(900, 25);
  this.move(300, 25);

  g_painter.dirty_flag = true;


}

guiLibrary.inherits ( guiRegion );

guiLibrary.prototype.fetchComponentList = function( userId, sessionId, projectId )
{

  var foo = this;

  $.ajaxSetup({cache :false });

  var req = { op : "COMP_LIST" };
  if ( (typeof userId !== 'undefined') && 
       (typeof sessionId !== 'undefined') && 
       (typeof projectId !== 'undefined') )
  {
    req = { op : "COMP_LIST", userId : userId, sessionId : sessionId, projectId : projectId  };
  }

  //DEBUG
  //console.log("fetchComponentList>>", userId, sessionId, projectId);
  //console.log("fetchComponentList>>", req);

  $.ajax({
    url : "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),


    /* FUCKING JQUERY!!!
     * http://stackoverflow.com/questions/10456240/jquery-ajax-call-return-json-parsing-error
     */
    //dataType: "application/json",
    dataType: "json",


    success: 
    function(data) {

      //DEBUG
      //console.log("got:");
      //console.log(data);

      foo.load_webkicad_library_json(data);
    },
    error: 
    function(jqxr, textStatus, error) { 
      console.log("FAIL:");
      console.log( jqxr );
      console.log( textStatus )
      console.log( error ); 
    }
  });

}


guiLibrary.prototype.load_webkicad_library_json = function(data)
{

  this.guiChildren[0].clearList();

  //DEVELOPMENT
  //g_component_library = {};

  var parent = null;

  for (var ind in data)
  {
    var ele = data[ind];

    if (ele.type == "list")
    {
      this.guiChildren[0].addList( ele.id, ele.name );
      parent = ele.id ;

      for (var comp_ind in ele.list)
      {
        var comp = ele.list[comp_ind];
        if (comp.type == "element")
        {
          this.guiChildren[0].add( comp.id, comp.name, comp.data, parent);

          //DEVELOPMENT
          //g_component_library[ comp.id ] = { "name" : comp.name, "location" : comp.data };
        }
      }
    }
  }

}


guiLibrary.prototype.listPick = function(list_ele)
{
  if (list_ele.type == "element")
  {
    /*
    var userId = $.cookie("userId");
    var sessionId = $.cookie("sessionId");
    var projectId = $.cookie("recentProjectId");
    */

    var userId = ( g_schnetwork ? g_schnetwork.userId : undefined );
    var sessionId = ( g_schnetwork ? g_schnetwork.sessionId : undefined );
    var projectId = ( g_schnetwork ? g_schnetwork.projectId : undefined );
    load_component_cache_part( list_ele.name, list_ele.data, userId, sessionId, projectId );

    this.guiChildren[1].component_name = list_ele.name;
    this.guiChildren[1].refresh();
  }
}

guiLibrary.prototype.tilePick = function(tile_ele)
{
  console.log("tilePick");
  console.log(tile_ele);
}

guiLibrary.prototype.load_library = function(data)
{
  console.log("got data for " + this.myname )
  console.log(data);
}

guiLibrary.prototype.load_library_error = function(jqxr, textStatus, error)
{
  console.log("load error for " + this.myname)
  console.log(jqxr);
  console.log(textStatus);
  console.log(error);
}

/*
guiLibrary.prototype.hitTest = function(x, y)
{
  for (var ind in this.guiChildren)
  {
    this.guiChildren[ind].hitTest(x,y);
  }
}
*/

guiLibrary.prototype.mouseDown = function(button, x, y )
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  if (this.guiChildren[1].visible && this.guiChildren[1].ready )
  {
    var r = this.guiChildren[1].hitTest(x, y);

    if (r)
    {
      //console.log("guiLibrary: got tile hit " + this.guiChildren[1].component_name );
      g_schematic_controller.tool = new toolComponentPlace( x, y, this.guiChildren[1].component_name );
      g_schematic_controller.guiToolbox.defaultSelect();
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
    console.log( "guiLibrary: hit\n");
    return true;
  }

  return false;

}

guiLibrary.prototype.mouseWheel = function(delta)
{
  console.log("guiLibrary.mouseWheel delta " + delta);

  /*
  this.indexStart += delta;
  if (this.indexStart < 0)
    this.indexStart = 0;

  this.indexEnd = this.indexStart + this.indexN;
 */
}

/*
guiLibrary.prototype.mouseWheelXY = function(delta, x, y)
{
  console.log("???");
}
*/

guiLibrary.prototype.draw = function()
{

  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );

                           /*
  for (var ind in this.library_list)
  {
    var sz = 15;
    g_painter.drawText( this.library_list[ind], 0, sz*ind, "rgb(128, 0, 0)", sz, 0, "L", "T" );
  }
 */

}


