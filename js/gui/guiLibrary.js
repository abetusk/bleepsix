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
  this.bgColor = "rgba(0,0,0, 0.2)";
  this.border = 10;
  this.height = 600;
  this.width = 200;
  this.myname = "foo";

  this.textHeight = 20;
  this.guisearch_selected = false;

  //--
  // Component list
  //--

  var guilist = new guiList("guiLibrary:list" );

  //guilist.init( this.border, this.border, this.width, this.height - this.width );
  guilist.init( this.border, 2*this.border + this.textHeight, this.width, this.height - this.width - this.textHeight );

  //guilist.indexN = 40;
  guilist.indexN = 38;
  guilist.updateList();
  guilist.registerPickCallback( (function(xx) { return function(data) { xx.listPick(data); }; })(this) );
  this.addChild( guilist );
  this.guiList = guilist;

  //--

  this.fetchComponentList( userId, sessionId, projectId );

  //--
  // Pickable component
  //--

  var guiComp = new guiComponentTile( "guiLibrary:component", "" );
  guiComp.x = this.border;
  //guiComp.y = (this.height - this.width) + 3*this.border;
  guiComp.y = (this.height - this.width) + 4*this.border;
  guiComp.width = this.width;
  guiComp.height = this.width;
  guiComp.registerPickCallback( (function(xx) { return function(data) { xx.tilePick(data); }; })(this) );

  this.addChild( guiComp );
  this.guiComponent = guiComp;

  //--
  // Search box
  //--

  var guisearch = new guiTextbox("guiLibrary:search");
  guisearch.init( this.border, this.border, this.width, this.textHeight );
  guisearch.registerTextCallback( (function(xx) { return function(data) { xx.searchUpdate(data); }; })(this) );
  this.addChild( guisearch );
  this.guiSearch = guisearch;

  //--


  this.height += 4*this.border ;
  this.width  += 2*this.border ;
  this.move(300, 25);

  g_painter.dirty_flag = true;
}
guiLibrary.inherits ( guiRegion );

guiLibrary.prototype.searchUpdate = function( txt )
{
  this.guiList.filter( txt );
}

guiLibrary.prototype.hasFocusedElement = function()
{
  return this.guisearch_selected;
}

guiLibrary.prototype.focusedElement = function()
{
  return this.guiSearch;
}

guiLibrary.prototype.fetchComponentList = function( userId, sessionId, projectId, callback, callback_err )
{

  if ( typeof callback === 'undefined' )
  {
    callback = (function(xx) {
      return function(data) { xx.load_webkicad_library_json(data); };
    })(this);
  }

  if ( typeof callback_err === 'undefined' )
  {
    callback_err = function(jqxr, textStatus, error) { 
        console.log("FAIL:");
        console.log( jqxr );
        console.log( textStatus )
        console.log( error ); 
      };
  }

  $.ajaxSetup({cache :false });

  var req = { op : "COMP_LIST" };
  if ( (typeof userId !== 'undefined') && 
       (typeof sessionId !== 'undefined') && 
       (typeof projectId !== 'undefined') )
  {
    req = { op : "COMP_LIST", userId : userId, sessionId : sessionId, projectId : projectId  };
  }

  $.ajax({
    url : "cgi/libmodmanager.py",
    type: "POST",
    data: JSON.stringify(req),

    /* FUCKING JQUERY!!!
     * http://stackoverflow.com/questions/10456240/jquery-ajax-call-return-json-parsing-error
     */
    dataType: "json",

    success: callback,
    error:  callback_err
  });

}


guiLibrary.prototype.load_webkicad_library_json = function(data)
{
  this.guiList.clearList();

  var parent = null;

  for (var ind in data)
  {
    var ele = data[ind];

    if (ele.type == "list")
    {
      this.guiList.addList( ele.id, ele.name );
      parent = ele.id ;

      for (var comp_ind in ele.list)
      {
        var comp = ele.list[comp_ind];
        if (comp.type == "element")
        {
          this.guiList.add( comp.id, comp.name, comp.data, parent);
        }
      }
    }
  }

}


guiLibrary.prototype.listPick = function(list_ele)
{
  if (list_ele.type == "element")
  {
    var userId = ( g_schnetwork ? g_schnetwork.userId : undefined );
    var sessionId = ( g_schnetwork ? g_schnetwork.sessionId : undefined );
    var projectId = ( g_schnetwork ? g_schnetwork.projectId : undefined );
    load_component_cache_part( list_ele.name, list_ele.data, userId, sessionId, projectId );

    g_painter.dirty_flag=true;

    this.guiComponent.component_name = list_ele.name;
    this.guiComponent.refresh();
  }
}

guiLibrary.prototype.tilePick = function(tile_ele)
{
  console.log("tilePick", tile_ele);
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

guiLibrary.prototype.mouseDown = function(button, x, y )
{

  this.guisearch_selected = false;

  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  if (this.guiComponent.visible && this.guiComponent.ready )
  {
    var r = this.guiComponent.hitTest(x, y);

    if (r)
    {
      g_schematic_controller.tool = new toolComponentPlace( x, y, this.guiComponent.component_name );
      g_schematic_controller.guiToolbox.defaultSelect();
      return true;
    }

  }

  if (this.guiList.hitTest(x, y))
  {
    return this.guiList.mouseDown(button, x, y);
  }

  if (this.guiSearch.hitTest(x,y))
  {
    this.guisearch_selected=true;
    return this.guiSearch.mouseDown(button, x, y);
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
}

guiLibrary.prototype.draw = function()
{
  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );
}
