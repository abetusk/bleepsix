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

//bleepsixSchematic.prototype._conn_wire_intersect = function( conn, wire )
bleepsixSchematic.prototype._point_wire_intersect = function( point, wire )
{
  var eps = 0.0001;
  var p = [ parseInt(wire.startx), parseInt(wire.starty) ];
  var d = [ parseInt(wire.endx) - p[0], parseInt(wire.endy) - p[1] ];
  //var q = [ parseInt(conn.x), parseInt(conn.y) ];
  var q = [ parseInt(point.x), parseInt(point.y) ];

  var l = numeric.norm2Squared( d );
  if ( l < eps) return false;

  var t = ( (q[0] - p[0])*d[0] + (q[1] - p[1])*d[1] ) / l;
  var v = [ p[0] + t*d[0], p[1] + t*d[1] ];

  var finalDist = numeric.norm2( numeric.sub( v, q ) );
  if ( finalDist < eps )
  {

    if ( (t >= 0) && (t <= 1) )
    {
      return true;
    }
  }

  return false;
}


// Returns an array if id pairs.  If pair [a,b] appears, [b,a] will
// also appear in the list.
// We only care about splitting wire types with conns.
//
//bleepsixSchematic.prototype._net_collect_conn_edges = function()
bleepsixSchematic.prototype._net_extend_VE_from_conn_wires = function( V, E )
{
  var edge = [];
  var conn = [];
  var wire = [];

  var sch = this.kicad_sch_json.element;
  var n = sch.length;
  for (var i=0; i<n; i++)
  {
    var ele = sch[i];
    var type = ele.type;

    if (type == "connection")
    {
      var data = { type: "connection", ref: ele, id: ele.id, visited:false, net: 0 };
      conn.push(ele);
      V[ ele.id ] = data;
    }
    else if (type == "wireline")
    {
      var data = { type: "wireline", ref: ele, id: ele.id, visited:false, net: 0 };
      wire.push(ele);
      V[ ele.id ] = data;
    }

  }

  for (var i=0; i<wire.length; i++)
  {
    for (var j=0; j<conn.length; j++)
    {
      if ( this._point_wire_intersect( conn[j], wire[i] ) )
      {
        edge.push( [ wire[i].id, conn[j].id ] );
        edge.push( [ conn[j].id, wire[i].id ] );

        if (!(wire[i].id in E)) E[ wire[i].id ] = {};
        E[ wire[i].id ][ conn[j].id ] = [ V[ wire[i].id ], V[ conn[j].id ] ];

        if (!(conn[j].id in E)) E[ conn[j].id ] = {};
        E[ conn[j].id ][ wire[i].id ] = [ V[ conn[j].id ], V[ wire[i].id ] ];

      }
    }
  }

}

bleepsixSchematic.prototype._lookup_comp = function( name )
{
  if (name in this.local_component_cache)
    return this.local_component_cache[name];

  console.log("ERROR: bleepsixSchematic._lookup_comp: could not find " + name + " in local component cache");
  return null;
}

bleepsixSchematic.prototype._net_make_key = function( x, y )
{
  return String(parseInt(x)) + ":" + String(parseInt(y));
}

bleepsixSchematic.prototype._net_add_endpoint = function( endpoints, key, data )
{
  if (key in endpoints)
  {
    endpoints[key].push( data );
  }
  else
  {
    endpoints[key] = [ data ];
  }

}

bleepsixSchematic.prototype._net_extend_VE_from_labels = function( V, E )
{
  var edge = [];
  var endpoints = {};
  var labels = [];

  var label_name_list = {};

  var sch = this.kicad_sch_json.element;
  var n = sch.length;
  for (var i=0; i<n; i++)
  {
    var ele = sch[i];
    var type = ele.type;
    
    if (type == "label")
    {
      labels.push(ele);

      var key = this._net_make_key( ele.x, ele.y );
      var data = { type: "label", ref: ele, id: ele.id, visited: false, net: 0 };

      if ( ele.text in label_name_list )
        label_name_list[ ele.text ].push( data );
      else
        label_name_list[ ele.text ] = [ data ];


      V[ ele.id ] = data;
      this._net_add_endpoint( endpoints, key, data );
    }
  }

  // make virtual link to each labels with the same name
  for ( var name in label_name_list )
  {
    var l = label_name_list[name].length;
    for (var i=0; i<l; i++)
    {
      var data0 = label_name_list[name][i];
      var ref0 = data0.ref;
      var key0 = this._net_make_key( ref0.x, ref0.y );


      this._net_add_endpoint( endpoints, key0, data0 );

      for (var j=i+1; j<l; j++)
      {
        var data1 = label_name_list[name][j];
        var ref1 = data1.ref;
        var key1 = this._net_make_key( ref1.x, ref1.y );

        this._net_add_endpoint( endpoints, key0, data1 );
      }

    }
  }

  for (var i=0; i<n; i++)
  {
    var ele = sch[i];
    var type = ele.type;

    if ( (type != "component") &&
         (type != "wireline") )
      continue;

    for (var j=0; j<labels.length; j++)
    {

      var data = labels[j];
      var label_key = this._net_make_key( data.x, data.y );

      if (type == "component")
      {

        var comp = this._lookup_comp( ele.name );
        var pins = comp.pin;

        if (comp.name == "unknown")
          continue;

        for (var p_ind=0; p_ind<pins.length; p_ind++)
        {
          var p = this._findPinEndpoints( comp.pin[p_ind], ele.x, ele.y, ele.transform );
          var key = this._net_make_key( p[0][0], p[0][1] );

          if ( (parseInt(p[0][0]) != parseInt(data.x)) ||
               (parseInt(p[0][1]) != parseInt(data.y)) )
            continue;

          var comp_data = {
            type : "pin",
            ref: ele,
            parentId : ele.id,
            id: ele.id + ":" + comp.pin[p_ind].number ,
            pin_number: comp.pin[p_ind].number ,
            visited : false,
            net : 0
          };

          this._net_add_endpoint( endpoints, label_key, comp_data );
        }


      }
      else if (type == "wireline")
      {

        if (! ( ((parseInt(ele.startx) == parseInt(data.x)) && (parseInt(ele.starty) == parseInt(data.y))) ||
              ((parseInt(ele.endx)   == parseInt(data.x)) && (parseInt(ele.endy)   == parseInt(data.y))) ) )
          continue;

        var wire_data = { type: "wireline", ref: ele, id: ele.id, visited: false, net: 0};
        this._net_add_endpoint( endpoints, label_key, wire_data );

      }

    }

  }

  for (var xy in endpoints)
  {
    var list= endpoints[xy];
    for (var i=0; i<list.length; i++)
    {
      for (var j=i+1; j<list.length; j++)
      {
        var a = list[i].id;
        var b = list[j].id;

        // DEBUG
        console.log("adding ", a, b );

        if (!(a in E)) E[a] = {};
        E[a][b] = [ list[i], list[j] ];

        if (!(b in E)) E[b] = {};
        E[b][a] = [ list[j], list[i] ];

      }
    }
  }

}

bleepsixSchematic.prototype._net_extend_VE_from_endpoints = function( V, E )
{
  var endpoints = {};
  var sch = this.kicad_sch_json;
  var eles = sch.element;


  var n = eles.length;
  for (var i=0; i<n; i++)
  {
    var ele = eles[i];
    var type = ele.type;

    if (type == "component")
    {
      var comp = this._lookup_comp( ele.name );
      if (!comp) continue;
      if (comp.name == "unknown") continue;

      for (var p_ind=0; p_ind<comp.pin.length; p_ind++)
      {
        var p = this._findPinEndpoints( comp.pin[p_ind], ele.x, ele.y, ele.transform );
        var key = this._net_make_key( p[0][0], p[0][1] );

        var data = { 
          x : p[0][0],
          y : p[0][1],
          type : "pin", 
          ref: ele, 
          parentId : ele.id,
          id: ele.id + ":" + comp.pin[p_ind].number ,  
          pin_number: comp.pin[p_ind].number ,
          visited : false,
          net : 0
        }; 

        this._net_add_endpoint( endpoints, key, data );

        V[ ele.id + ":" + comp.pin[p_ind].number ] = data;
      }

    }

    else if (type == "wireline")
    {
      var data = { 
        startx : ele.startx,
        starty : ele.starty,
        endx : ele.endx,
        endy : ele.endy,
        type: "wireline", 
        ref: ele, 
        id: ele.id, 
        visited: false, 
        net: 0 
      };
      var key0 = this._net_make_key( ele.startx, ele.starty );
      var key1 = this._net_make_key( ele.endx, ele.endy );
      this._net_add_endpoint( endpoints, key0, data );
      this._net_add_endpoint( endpoints, key1, data );

      V[ ele.id ] = data;
    }

    else if (type == "connection")
    {
      var data = { 
        x : ele.x,
        y : ele.y,
        type:"connection", 
        ref: ele, 
        id: ele.id, 
        visited:false, 
        net: 0 
      };
      var key = this._net_make_key( ele.x, ele.y );
      this._net_add_endpoint( endpoints, key, data );

      V[ ele.id ] = data;
    }

  }

  for (var xy in endpoints)
  {
    var list = endpoints[xy];
    for (var i=0; i<list.length; i++)
    {
      for (var j=i+1; j<list.length; j++)
      {
        var a = list[i].id;
        var b = list[j].id;

        if (!(a in E)) E[a] = {};
        E[a][b] = [ list[i], list[j] ];

        if (!(b in E)) E[b] = {};
        E[b][a] = [ list[j], list[i] ];
      }

    }
  }

}

bleepsixSchematic.prototype._net_label_groups_r = function( V, E, id, net )
{
  if ( V[id].visited )
    return;

  V[id].visited = true;
  V[id].net = net;

  for (var next_id in E[id] )
  {
    this._net_label_groups_r( V, E, next_id, net );
  }

}

bleepsixSchematic.prototype._net_label_groups = function( V, E )
{
  var net = 1;
  for (var id in E)
  {
    this._net_label_groups_r( V, E, id, net );
    net++;
  }
}

// comp_id_pin_name is an array of <id>/<pin_name>
// Make mappings for both component and component/pin for easy inclusion testing.
// Then go through each element in our schematic and pick out the pins that 
// should be highlighted.
// TODO: highlight wirelines that connect to all component pins.
//
bleepsixSchematic.prototype.highlightNet = function( comp_id_pin_name )
{
  this.highlight_net = [];

  var sch = this.kicad_sch_json.element;

  var comp_id_lookup = {};
  for (var ind in comp_id_pin_name )
  {
    var comp_id_ar = comp_id_pin_name[ind].split('/');
    comp_id_lookup[comp_id_ar[0]] = { 
      id : comp_id_ar[0],
      pin : comp_id_ar[1]
    };
  }

  var comp_pin_id_lookup = {};
  for (var ind in comp_id_pin_name )
  {
    comp_pin_id_lookup[ comp_id_pin_name[ind] ] = 1;
  }


  for (var ind=0; ind<sch.length; ind++)
  {
    var ele = sch[ind];
    var type = ele.type;

    if (!(ele.id in comp_id_lookup))
      continue;

    if (type == "component")
    {

      var comp = this._lookup_comp( ele.name );
      if (!comp) continue;
      if (comp.name == "unknown") continue;

      for (var p_ind in comp.pin)
      {
        var x = ele.id + "/" +  comp.pin[p_ind].number.toString();
        if (x in comp_pin_id_lookup)
        {
          var p = this._findPinEndpoints( comp.pin[p_ind], ele.x, ele.y, ele.transform );
          this.highlight_net.push({ x : p[0][0], y : p[0][1], size : 50, type : "box" });
          this.highlight_net_flag = true;
        }
      }

    }

  }

}

bleepsixSchematic.prototype.highlightNet_old = function( sch_netcodes )
//bleepsixSchematic.prototype.highlightNet = function( sch_netcodes )
{
  var sch = this.kicad_sch_json;
  var elements = sch.element;
  var endpoints = {};

  // vertices are ids with custom data
  // edges are indexed by ids, with an array pointing to the vertices
  //   in the order of the indexes
  //
  var V = {};
  var E = {};

  this._net_extend_VE_from_conn_wires( V, E );
  this._net_extend_VE_from_endpoints( V, E );
  this._net_extend_VE_from_labels( V, E );

  this._net_label_groups(V, E);

  var map = {};
  for (var ind in sch_netcodes)
  {
    map[ parseInt(sch_netcodes[ind]) ] = 1;
  }

  this.highlight_net = [];
  this.highlight_net_flag = true;

  var groupToSchNetMap = {};
  for (var v in V)
  {
    var id = V[v].id;
    var nc = V[v].net;
    var ref = V[v].ref;
    var type = V[v].type;

    if (type == "wireline")
    {
    }
    else if (type == "pin")
    {
      var parent_id = ref.id;
      var pin_number = V[v].pin_number;

      //if (!("pin" in ref)) ref.pin = {}
      //ref.pin[ pin_number ]. 
    }

  }

  for (var v in V)
  {
    var nc = V[v].net;
    var type = V[v].type;

    if ( parseInt(nc) in map )
    {

      if (type == "wireline")
      {
        this.highlight_net.push({ 
          x0 : V[v].startx, y0 : V[v].starty,
          x1 : V[v].endx, y1 : V[v].endy,
          size : 50 , type : "rect" 
        });
      }
      else if (type == "pin")
      {
        this.highlight_net.push({ x : V[v].x, y : V[v].y, size : 50, type : "box" });
      }

    }

  }

  // DEBUG
  //console.log(">>>> HIGHLIGHT NET");
  //console.log( this.highlight_net );

}


bleepsixSchematic.prototype.unhighlightNet = function( )
{
  this.highlight_net_flag = false;

  // DEBUG
  //console.log(">>>> UNHIGHLIGHT NET");
  //console.log( this.highlight_net );


}


bleepsixSchematic.prototype.constructNet = function()
{
  var sch = this.kicad_sch_json;
  var elements = sch.element;
  var endpoints = {};

  // vertices are ids with custom data
  // edges are indexed by ids, with an array pointing to the vertices
  //   in the order of the indexes
  //
  var V = {};
  var E = {};

  this._net_extend_VE_from_conn_wires( V, E );
  this._net_extend_VE_from_endpoints( V, E );
  this._net_extend_VE_from_labels( V, E );

  this._net_label_groups(V, E);

  //DEBUG
  console.log("V:");
  console.log(V);
  console.log("E:");
  console.log(E);

  var sch_pin_net_map = {};
  for (var v in V)
  {
    var id = V[v].id;
    var nc = V[v].net;
    var ref = V[v].ref;
    var type = V[v].type;

    if ( type == "pin") 
    {
      var parent_id = ref.id;
      var pin_number = V[v].pin_number;

      var obj = { netcode : nc, pin : pin_number, id : parent_id }
      sch_pin_net_map[ id ] = obj;

      if (!("pinData" in ref))
        ref.pinData = {};

      ref.pinData[ pin_number ] = { x : V[v].x, y: V[v].y, size : 50, type: "box", netcode: nc  };

    }
    else if (type == "wireline")
    {
      ref.data = { 
          x0 : V[v].startx, y0 : V[v].starty,
          x1 : V[v].endx,   y1 : V[v].endy,
          size : 50 , type : "rect" ,
          netcode: nc
        };
    }


  }

  console.log( sch_pin_net_map );

  this.kicad_sch_json.net_pin_id_map = sch_pin_net_map;

  return sch_pin_net_map;


  var n = sch.element.length;
  for (var ind=0; ind<n; ind++)
  {
    var ele = elements[ind];
    var type = ele.type;

    if (type == "wireline")
    {
      var x = parseInt(ele.startx);
      var y = parseInt(ele.starty);
      var key = String(x) + ":" + String(y);

      if (key in "endpoints")
        endpoints[key].push( ele.id );
      else
        endpoints[key] = [ ele.id ];

      x = parseInt(ele.endx);
      y = parseInt(ele.endy);
      key = String(x) + ":" + String(y);

      if (key in "endpoints")
        endpoints[key].push( ele.id );
      else
        endpoints[key] = [ ele.id ];
    }

    else if (type == "connection")
    {
      var verts = this._net_conn_wire_intersect();
    }

    else if (type == "noconn")
    {
    }

    else if (type == "component")
    {
    }

    else if (type == "busline")
    {
    }

    else if (type == "label")
    {
    }

    else if (type == "entrybusbus")
    {
    }


  }
}



bleepsixSchematic.prototype._calculate_netlist = function()
{
  var sch = this.kicad_sch_json.element;
  var n = sch.length;

  var ce_edge = this._net_collect_conn_edges();

  var V = {};
  var E = {};

  var point_map = {};

  for (var i=0; i<n; i++)
  {
    var ele = sch[i];
    var type = ele.type;

    if (type == "component")
    {
    }
    else if (type == "wireline")
    {
    }
    else if (type == "connection")
    {
    }

  }


  console.log(ce_edge);

}

