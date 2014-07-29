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

function guiPalette( name ) 
{
  this.constructor ( name )   

  this.bgColor = "rgba( 0, 0, 0, 0.2 )";


  this.component_row = 2;
  this.component_column = 8;

  this.power_row = 2;
  this.power_column = 2;

  this.max_component = this.component_row * this.component_column;
  this.max_power = this.power_row * this.power_column;

  this.tile_width = 40;
  this.tile_height = 40;
  this.tile_border = 10;

  this.width  = (this.tile_width  + this.tile_border) * (this.component_column + this.power_column) + this.tile_border;
  this.height = (this.tile_height + this.tile_border) * Math.max(this.component_row , this.power_row ) + this.tile_border ;

  //this.default_part_list = [ "R", "C", "CP1", "LED", "CRYSTAL", "NPN", "PNP", "DIODE" ] 
  this.default_part_list = [ 
    { "name":"R", "location":"eeschema/json/device/R.json" }, 
    {  "name": "C" , "location" : "eeschema/json/device/C.json" },  
    {  "name" :  "CP1" , "location" : "eeschema/json/device/CP1.json" },  
    {  "name" :  "LED" , "location" : "eeschema/json/device/LED.json" },  
    {  "name" :  "CRYSTAL" , "location" : "eeschema/json/device/CRYSTAL.json" },  
    {  "name" :  "NPN" , "location" : "eeschema/json/device/NPN.json" },  
    {  "name" :  "PNP" , "location" : "eeschema/json/device/PNP.json" },  
    {  "name" :  "DIODE" , "location" : "eeschema/json/device/DIODE.json" }
  ] ;

  //this.default_power_list = [ "PWR_FLAG", "VCC", "GND", "PWR_FLAG" ];
  this.default_power_list = [ 
     { "name" : "VCC" , "location" : "eeschema/json/power/VCC.json" },  
     { "name" : "~GND" , "location" : "eeschema/json/power/%257EGND.json" },  
     { "name" : "PWR_FLAG" , "location" : "eeschema/json/power/PWR_FLAG.json" }
  ];

  var x_s = this.tile_border / 2;
  var y_s = this.tile_border / 2;

  this.border_pos_x = (this.tile_width + this.tile_border) * this.component_column ;

  var guicomp;

  var cur=0;
  for (var r = 0; r < this.component_row; r++)
  {
    for (var c = 0; c<this.component_column; c++)
    {
      if (cur >= this.default_part_list.length) break;

      guicomp = new guiComponentTile( "guiPalette:C:r" + r + ",c" + c , this.default_part_list[cur].name );
      guicomp.x = c * (this.tile_width  + this.tile_border) + x_s;
      guicomp.y = r * (this.tile_height + this.tile_border) + y_s;

      var userId = $.cookie("userId");
      var sessionId = $.cookie("sessionId");
      load_component_cache_part( this.default_part_list[cur].name, this.default_part_list[cur].location, userId, sessionId );

      this.addChild( guicomp );

      cur++;
    }
  }

  cur = 0 ;
  var base_x = (this.tile_width + this.tile_border) * ( this.component_column );

  for (var r = 0; r < this.power_row; r++)
  {
    for (var c = 0; c < this.power_column; c++)
    {
      if (cur >= this.default_power_list.length) break;

      guicomp = new guiComponentTile( "guiPalette:C:r" + r + ",c" + c , this.default_power_list[cur].name );
      guicomp.x = c * (this.tile_width  + this.tile_border) + x_s + base_x;
      guicomp.y = r * (this.tile_height + this.tile_border) + y_s;

      var userId = $.cookie("userId");
      var sessionId = $.cookie("sessionId");
      load_component_cache_part( this.default_power_list[cur].name, this.default_power_list[cur].location, userId, sessionId );

      this.addChild( guicomp );

      cur++;

    }
  }

  g_painter.dirty_flag = true;

  this.move(100, 575);

}

guiPalette.inherits ( guiRegion );

guiPalette.prototype.draw = function()
{

  g_painter.drawRectangle( 0, 0, this.width, this.height,  
                           0, "rgb(0,0,0)", 
                           true, this.bgColor );


  //g_painter.line( this.border_pos_x, 0, this.border_pos_x, this.height,
  g_painter.line( this.border_pos_x, 5, this.border_pos_x, this.height-5,
                  "rgba(0,0,0, 0.2)",
                  this.tile_border/4 );
}

// override hitTest and change tool if we've picked a component
//
guiPalette.prototype.hitTest = function(x, y)
{
  var u = numeric.dot( this.inv_world_transform, [x,y,1] );

  for (var ind in this.guiChildren )
  {
    if (this.guiChildren[ind].visible && this.guiChildren[ind].ready )
    {

      var r = this.guiChildren[ind].hitTest(x, y);

      if (r)
      {
        //console.log("guiPalette: got child hit " + this.guiChildren[ind].component_name );
        g_schematic_controller.tool = new toolComponentPlace( x, y, this.guiChildren[ind].component_name );

        g_schematic_controller.guiToolbox.defaultSelect();
        return true;
      }

    }
  }

  if ( (0 <= u[0]) && (u[0] <= this.width) &&
       (0 <= u[1]) && (u[1] <= this.height) )
  {
    //console.log( "guiPalette: " + this.name + " hit\n");
    return true;
  }

  return false;

}

guiPalette.prototype.addElement = function(name)
{

  var ref = {};
  ref["name"] = name;
  ref["frequency"] = 1;
  ref["user_order"] = 1;

  this.element_array.push(name);
  
}


guiPalette.prototype.removeElement = function()
{
}
