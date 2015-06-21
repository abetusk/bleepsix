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

if (typeof module !== 'undefined')
{
  var bleepsixBoard = require("./bleepsixBoard_bbox.js");
  module.exports = bleepsixBoard;
}



bleepsixBoard.prototype._pad_by_name = function( pad, name )
{
  for (var ind in pad)
  {
    if (pad[ind].name == name )
      return pad[ind];
  }
  return null;
}


// Update schematic to board net and board to schematic net mappings.
//
// sch_pin_id_net_map is received from the schematic portion and is
// a hash of <id>:<pin> -> { id : <id> , netcode : <nc> , pin : <pin> }.
// Netcode in the structure is the schematic netcode.
//
bleepsixBoard.prototype.updateSchematicNetcodeMap = function( sch_pin_id_net_map )
{
  var sch_netcode_map = {};

  var brd_to_sch_net_map = {};
  var sch_to_brd_net_map = {};

  for (var pin_id in sch_pin_id_net_map)
  {
    var pin_name  = sch_pin_id_net_map[pin_id].pin;
    var parent_id   = sch_pin_id_net_map[pin_id].id;
    var sch_netcode = parseInt(sch_pin_id_net_map[pin_id].netcode);

    var ref = this.refLookup( parent_id );


    //DEBUG
    if (!ref)
    {
      console.log(">>>> updateSchematicNetcodeMap, trying to lookup:", parent_id);
      console.log(">>>> pin_name:", pin_name, ", sch_netcode:", sch_netcode);
    }


    if (!ref) continue;
    if (! ( "pad" in ref ) ) continue;

    var pad = this._pad_by_name( ref.pad, pin_name );
    if (!pad) continue;

    var pad_net = parseInt( pad.net_number );

    if (pad_net <= 0) continue;

    // setup mappings
    //
    if (pad_net in brd_to_sch_net_map)
      brd_to_sch_net_map[ pad_net ].push( sch_netcode );
    else
      brd_to_sch_net_map[ pad_net ] = [ sch_netcode ];

    if ( sch_netcode in sch_to_brd_net_map )
      sch_to_brd_net_map[ sch_netcode ].push( pad_net );
    else
      sch_to_brd_net_map[ sch_netcode ] = [ pad_net ];

  }

  this.kicad_brd_json.brd_to_sch_net_map = brd_to_sch_net_map;
  this.kicad_brd_json.sch_to_brd_net_map = sch_to_brd_net_map;

  this.kicad_brd_json.sch_pin_id_net_map = sch_pin_id_net_map;

}



// ------------- EXPERIMENTAL -----------------




bleepsixBoard.prototype._local_net_add_track_vert = function( V, verts, ref, ds )
{
  var x0 = parseInt(ref.x0);
  var y0 = parseInt(ref.y0);

  verts.push( [ x0, y0 ] );

  var layers = [ ref.layer ];
  if (ref.shape == "through")
  {
    var n_layer = parseInt(ref.layer);
    for (var ind=0; ind<n_layer-1; ind++)
      layers.push(ind);
  }

  V.push( { layers: layers, shape: ref.shape, type: ref.type, ref: ref, id: ref.id , visited: false} );

  if (ref.shape == "track")
  {

    var x1 = parseInt(ref.x1);
    var y1 = parseInt(ref.y1);
    verts.push( [ x1, y1 ] );
    V.push( { layers: layers, shape: ref.shape, type: ref.type, ref: ref, id: ref.id, visited: false  } );

    var dx = x1 - x0;
    var dy = y1 - y0;
    var dl = Math.sqrt( (dx*dx) + (dy*dy) );

    if (dl == 0) return;

    for (var dt=ds; dt < dl; dt += ds)
    {
      var tx = parseInt(x0 + (dx*dt/dl));
      var ty = parseInt(y0 + (dy*dt/dl));
      verts.push( [ tx, ty ] );
      V.push( { layers: layers, shape: ref.shape, type: ref.type, ref: ref, id: ref.id, visited: false  } );
    }

  }

}

bleepsixBoard.prototype._local_net_add_pad_vert = function( V, verts, ref, pad_ref, ds )
{

  var layers = [];
  for (var ind=0; ind<16; ind++)
  {
    if ( parseInt(pad_ref.layer_mask, 16) & (1<<ind) )
    {
      layers.push(ind);
    }
  }

  var cx = parseInt( ref.x );
  var cy = parseInt( ref.y );
  var ma = parseInt( ref.angle );

  var px = parseInt( pad_ref.posx );
  var py = parseInt( pad_ref.posy );
  var pa = parseInt( pad_ref.angle );

  var u = numeric.dot( this._R( ma ), [ px, py ] );

  var tx = parseInt(cx + u[0]);
  var ty = parseInt(cy + u[1]);
  verts.push( [ tx, ty ] );
  V.push(  { layers: layers, type: "pad", ref: ref, pad_ref : pad_ref, id : pad_ref.id, visited: false } );

}

bleepsixBoard.prototype._local_net_populate_r = function( v, V, verts, E, local_net_code , via_info, ds ) 
{
  ds = parseFloat(ds);
  var type = V[v].type;

  if (type == "pad")
  {

    if (V[v].visited) return;
    V[v].visited = true;

    V[v].pad_ref.local_net_code = local_net_code;
    for ( var w in E[v] )
    {
      var d = __dist2( verts[v], verts[w] );
      if (d > 2*ds) continue;

      this._local_net_populate_r( w, V, verts, E, local_net_code, via_info, ds );
    }

  }
  else if (type == "track")
  {

    if (V[v].visited) return;
    V[v].visited = true;

    if (V[v].ref.shape == "through")
    {
      if ( !( V[v].ref.id in via_info ) )
      {
        via_info[ V[v].ref.id ] = {};
      }
      via_info[ V[v].ref.id ][ local_net_code ] = 1;
    }

    V[v].ref.local_net_code = local_net_code;
    for ( var w in E[v] )
    {
      var d = parseFloat(__dist2( verts[v], verts[w] ));
      if (d > parseFloat(2*ds) ) continue;

      this._local_net_populate_r( w, V, verts, E, local_net_code, via_info, ds );
    }

  }

}

bleepsixBoard.prototype._local_net_populate = function( V, verts, E , via_info, ds ) 
{
  var cur_net_code = 1;

  var n = V.length;
  for (var ind=0; ind<n; ind++)
  {
    var type = V[ind].type;

    if (type == "pad")
    {
      if (V[ind].visited) continue;
      this._local_net_populate_r( ind, V, verts, E, cur_net_code, via_info, ds );
      cur_net_code++;

    }
    else if (type == "track")
    {
      if (V[ind].visited) continue;
      this._local_net_populate_r( ind, V, verts, E, cur_net_code, via_info, ds );

      if (V[ind].ref.shape == "through")
      {
        if ( !( V[ind].ref.id in via_info ) )
        {
          console.log("bang");
          via_info[ V[ind].ref.id ] = {};
        }
        via_info[ V[ind].ref.id ][ cur_net_code ] = 1;
      }

      cur_net_code++;

    }

  }

}

bleepsixBoard.prototype._local_net_rename = function( src, dst )
{
  console.log("  src: " + src + ", dst: " + dst );
}

bleepsixBoard.prototype._local_net_flatten_from_via = function( via_info )
{
  var max_net_code = -1;
  var rename_map = {};

  for (var via_id in via_info)
    for (var net_code in via_info[via_id])
    {
      if (net_code > max_net_code)
        max_net_code = net_code;
    }

  var set = new UnionFind(max_net_code+1);

  for (var via_id in via_info)
  {
    var prev = -1;
    for (var net_code in via_info[via_id])
    {
      if (prev >= 0) set.link( prev, net_code );
      else prev = net_code;
    }
  }

  for (var via_id in via_info)
  {
    for (var net_code in via_info[via_id])
    {
      var x = set.find(net_code);

      if (x == net_code)
        continue;

      rename_map[ net_code ] = x;

    }
  }

  var elements = this.kicad_brd_json.element;
  var n = elements.length;
  for (var ind=0; ind<n; ind++)
  {
    var ele = elements[ind];
    var type = ele.type;

    if (type == "module")
    {

    }
    else if (type == "track")
    {
    }

  }

}

// DEFUNCT
bleepsixBoard.prototype.updateLocalNet = function( )
{
  var ds = 50;
  //var layer = 15;
  //var layer = 0;
  var layers = [0,15];

  var via_info = {};

  var elements = this.kicad_brd_json.element;
  var n = elements.length;
  for (var layer_ind in layers )
  {
    var verts = [];
    var V = [], E = {};

    var layer = layers[layer_ind];

    for (var ind=0; ind<n; ind++)
    {
      var ele = elements[ind];
      var type = ele.type;
      var shape = ele.shape;

      if (type == "track")
      {

        if (shape == "through")
        {
          if ( parseInt(layer) > parseInt(ele.layer) ) continue;
        }
        else if ( ele.layer != layer) { continue; }

        this._local_net_add_track_vert( V, verts, ele, ds );
        ele.local_net_code = -1;
      }

      else if (type == "module")
      {
        if (!( "pad" in ele))
          continue;

        var pads = ele.pad;
        var m = pads.length;
        for (var p_ind=0; p_ind<m; p_ind++)
        {

          var pad = pads[p_ind];
          if (( parseInt(pad.layer_mask, 16) & (1<<layer)) == 0)
            continue;

          this._local_net_add_pad_vert( V, verts, ele, pad, ds );
          pad.local_net_code = -1;
        }

      }
    }

    var edges  = EuclideanMST.euclideanMST( verts, __dist2 );

    // construct edge graph
    //
    var m = edges.length;
    for (var ind=0; ind<m; ind++)
    {
      var v = edges[ind][0];
      var u = edges[ind][1];

      if (!(v in E)) E[v] = {};
      E[v][u] = 1;

      if (!(u in E)) E[u] = {};
      E[u][v] = 1;

    }

    this._local_net_populate( V, verts, E, via_info, ds );

  }

  this._local_net_flatten_from_via( via_info );

}


bleepsixBoard.prototype._get_layer_list = function( layer_mask )
{

  var r = [];

  for (var layer=0; layer<16; layer++)
  {
    if ( !( parseInt( layer_mask, 16 ) & (1<<layer)) )
      continue;
    r.push( layer );
  }

  return r;

}

// not fully implemented, still testing
//
bleepsixBoard.prototype.updateLocalNet_slow = function( )
{
  var ds = 10;

  console.log("bleepsixBoard.updateLocalNet");

  var brd = this.kicad_brd_json.element;

  var layer_points = {};
  var layer_elements = {};
  for (var layer=0; layer<16; layer++)
  {
    layer_points[layer] = [];
    layer_elements[layer] = [];
  }

  // collect points for MST calculation
  //
  var n = brd.length;
  for (var ind=0; ind<n; ind++)
  {

    var ele = brd[ind];
    var type = ele.type;

    if ( type == "module" )
    {
      if (! ele.pad)
        continue;

      var pads = ele.pad;
      for (var p_ind=0; p_ind<pads.length; p_ind++)
      {
        var pad = pads[p_ind];

        var id_ref = { id: pad.id, ref : ele, pad_ref: pad, type : "pad" };
        var pgn = this._build_element_polygon( id_ref, ds, true );

        var n_pgn = pgn.length;
        for (var i=0; i<n_pgn; i++)
        {
          pgn[i].id = pad.id;
          pgn[i].parentId = ele.id;
        }

        var layer_list = this._get_layer_list( pad.layer_mask );
        for (var layer=0; layer<layer_list.length; layer++)
          layer_elements[ layer_list[layer] ].push( pgn );

      }
    }

    else 
    if (type == "track")
    {
      var pgn = [];
      this._make_segment( pgn, ele, ds, true );
      layer_elements[ ele.layer ].push( pgn );

      var n_pgn = pgn.length;
      for (var i=0; i<n_pgn; i++)
      {
        pgn[i].id = pad.id;
        pgn[i].parentId = ele.id;
      }

    }

  }

  // create the hash for lookup
  //
  var layer_point_hash = {};
  for (var layer in layer_elements)
  {
    for (var k in layer_elements[layer])
    {
      var pgn = layer_elements[layer][k];

      for (var p in pgn)
      {
        pgn[p].X = parseInt(pgn[p].X);
        pgn[p].Y = parseInt(pgn[p].Y);
        layer_point_hash[ layer + ":" + pgn[p].X + "," + pgn[p].Y ] = pgn[p];
        layer_points[layer].push( [ pgn[p].X, pgn[p].Y ] );
      }

    }
  }

  // do an initial pass to label all elements with a local netcode
  //
  var group_net = {};
  var group_net_id = 1;

  for (var layer in layer_elements)
  {
    
    var edges = EuclideanMST.euclideanMST( layer_points[layer], __dist2 );
    var filtered_edge = [];

    for (var e_ind in edges)
    {
      var u = layer_points[ layer ][ edges[e_ind][0] ];
      var v = layer_points[ layer ][ edges[e_ind][1] ];
      var d = __dist2( u, v );
      if ( d < 2*ds )
        continue;
      filtered_edge.push( edges[e_ind] );
    }


    for (var e_ind in filtered_edge)
    {
      var a = [];
      a.push( layer_points[ layer ][ filtered_edge[e_ind][0] ] );
      a.push( layer_points[ layer ][ filtered_edge[e_ind][1] ] );

      for (var i=0; i<2; i++)
      {
        var key = layer + ":" + a[i][0] + "," + a[i][1];
        var pgn = layer_point_hash[ key ];

        if (pgn.id in group_net)
          continue;

        group_net[ pgn.id ] = group_net_id++;
      }

    }

  }

  for (var id in group_net)
  {
    var ref = this.refLookup( id );
    ref.local_netcode = group_net[ id ];

  }

  console.log("...");

  return;

  //DEBUG

  /*
  var test_layer = 15;
  var edges = EuclideanMST.euclideanMST( layer_points[test_layer], __dist2 );
  var filtered_edge = [];

  for (var e_ind in edges)
  {
    var u = layer_points[ test_layer ][ edges[e_ind][0] ];
    var v = layer_points[ test_layer ][ edges[e_ind][1] ];

    var d = __dist2( u, v );
    if ( d < 2*ds )
      continue;

    filtered_edge.push( edges[e_ind] );

    //this.debug_edge.push( [[u[0], u[1]], [v[0],v[1]] ] );
  }
  g_painter.dirty_flag = true;

  //var group_net = {};
  //var group_net_id = 1;

  for (var e_ind in filtered_edge)
  {
    var a = [];
    a.push( layer_points[ test_layer ][ filtered_edge[e_ind][0] ] );
    a.push( layer_points[ test_layer ][ filtered_edge[e_ind][1] ] );

    for (var i=0; i<2; i++)
    {
      var key = test_layer + ":" + a[i][0] + "," + a[i][1];
      var pgn = layer_point_hash[ key ];

      console.log("..> " + key );
      console.log( layer_point_hash[key] );

      if (pgn.id in group_net)
      {
        console.log("  " + pgn.id + " already allcoated (" + group_net[ pgn.id ] + ")");
        continue;
      }

      this.debug_edge.push( a );

      group_net[ pgn.id ] = group_net_id++;
    }

  }

  console.log( " --> group_net_id: "  + group_net_id );
  console.log(group_net);
  */

  //console.log(edges);

  /*
  var test_layer = 0;
  for (var ind in layer_elements[test_layer])
  {
    this.debug_pgns.push( layer_elements[test_layer][ind] );
  }
  */

}


function __dist2( a, b )
{
  return Math.sqrt((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]));
}



// ------------- EXPERIMENTAL -----------------





// Go through and collect points into a hash where
// tracks end or pads are centered.  'Flood fill'
// to figure out which groupings each is in.
// If a track/pad is in a grouping, it guarantees
// it is of the same net as others in the group, but
// does not necessarily mean tracks/pads are different
// if they're not in the same grouping.
//
// Once initial groupings are established, do a bounding
// box test for the bounding box of each of the groupings.
// If the bounding box does not intersect, we know for
// certain that groupings are distinct and we can split
// the net (by renaming all but one).
//
// If bbox's intersect, then we need to do a more complicated
// geometry intersection test.  For this, we linearize
// the gemoetry, and do a boolean test of the appropriate
// geometry.  Depending on the test results, we know whether
// to keep the nets untouched or create a new one and
// rename the elements in one of the groups.
//
// Genearlizes to more than one group.  Worst case
// O(n^2), so we'll have to come back to it if it 
// turns out to be too slow.
//
//

// splits (through here) must have two different points 
// that are being disconnected.
// For example: 
//   a (non through-hole/buried) track will have two points on the same layer
//   a through hole pad will have the same x,y point on different layers.
//   
bleepsixBoard.prototype.splitNet = function( orig_netcode )
{
  var new_net_info = [];
  var net_ele_point_hash = {};

  this._construct_netsplit_point_hash( net_ele_point_hash, orig_netcode );
  this._populate_netsplit_group_hash_names( net_ele_point_hash );

  var group_list = this._get_netsplit_group_list(net_ele_point_hash);
  if (group_list.length == 1 )
  {

    // ???
    //console.log("ERROR:>>> group_list.length == 1?", group_list);

    return ;
  }

  var net_group_bin = this._get_netsplit_group_bin( net_ele_point_hash ) ;

  // successfully processed == true
  //
  var bb_ns_res = this._bounding_box_netsplit( net_group_bin );
  if (bb_ns_res.processed)
  {
    var split_result = { new_net : bb_ns_res.new_net_info, orig_net_number: orig_netcode };
    return split_result;
  }

  var ds = 10;

  var group_polygons = {};
  for (var group_name in net_group_bin)
  {
    var ele_list = net_group_bin[group_name];
    group_polygons[group_name] = [];

    for (var ind in ele_list)
    {
      var type = ele_list[ind].type;
      var pgn = [];

      var pgn = this._build_element_polygon( ele_list[ind] );

      group_polygons[group_name].push( pgn );
    }
  }

  // Each entry in the group_polygons list are known connected.
  // group_union is the geometry of each of the group_polygons 
  //   entries.
  //

  var group_union = {};
  for (var group_name in group_polygons)
  {
    group_union[group_name] = [];
    this._clip_union( group_union[group_name], group_polygons[group_name] );
  }

  var group_intersect_graph = {};
  for (var g in group_union)
    group_intersect_graph[g] = {};

  for (var g0 in group_union)
  {
    for (var g1 in group_union)
    {
      if (g0 <= g1) continue;

      var test_intersect_pgns = [];
      this._clip_intersect( test_intersect_pgns, group_union[g0], group_union[g1] );

      var val = ( (test_intersect_pgns.length > 0) ? -1 : 0 );
      group_intersect_graph[g0][g1] = val;
      group_intersect_graph[g1][g0] = val;

    }
  }

  // now we need to regroup, finding groups of groups

  var collection = this._flood_fill_grouping_graph( group_intersect_graph );

  var first = true;
  for (var c in collection)
  {

    if (first)
    {
      first = false;
      continue;
    }

    var new_net = this.addNet();
    new_net_info.push( new_net );

    var li = collection[c];
    for (var ind in li)
    {

      var net_bin_ar = net_group_bin[ li[ind] ];
      for (var i in net_bin_ar)
      {

        if (net_bin_ar[i].type == "track")
        {
          var ref = net_bin_ar[i].ref;
          var netcode = ref.netcode;

          ref.netcode = new_net.net_number;
        }

        else if (net_bin_ar[i].type == "pad")
        {
          var pad_ref = net_bin_ar[i].pad_ref;
          var netcode = pad_ref.net_number;

          pad_ref.net_number = new_net.net_number;
          pad_ref.net_name = new_net.net_name;
        }

      }

    }
  }

  var split_result = { new_net : new_net_info, orig_net_number: orig_netcode };
  return split_result;

}

// generic graph functions
//
bleepsixBoard.prototype._flood_fill_grouping_graph_r = function( grouping_graph, x, cur_name, grouping_map )
{
  var neighbors_actual = 0;

  var neighbors = [];
  for (var y in grouping_graph[x])
  {
    if (grouping_graph[x][y] < 0 )
    {
      grouping_graph[x][y] = cur_name;
      grouping_graph[y][x] = cur_name;
      neighbors.push(y);

      grouping_map[x] = cur_name;
      grouping_map[y] = cur_name;
      neighbors_actual++;
    }
    else if (grouping_graph[x][y] > 0)
    {
      neighbors_actual++;
    }

  }


  if (neighbors_actual == 0)
  {
    grouping_map[x] = cur_name;
    return;
  }

  for (var i in neighbors)
    this._flood_fill_grouping_graph_r( grouping_graph, neighbors[i], cur_name, grouping_map );

}

bleepsixBoard.prototype._flood_fill_grouping_graph = function( grouping_graph )
{
  var grouping_map = {};
  var cur_name = 1;
  for (var x in grouping_graph)
  {
    this._flood_fill_grouping_graph_r( grouping_graph, x, cur_name, grouping_map );
    cur_name++;
  }

  var collection = {};
  for (var v in grouping_map)
  {
    var grouping = grouping_map[v];
    if (grouping  in collection)
      collection[grouping].push(v);
    else collection[grouping] = [ v ] ;
  }

  return collection ;
}

//------

bleepsixBoard.prototype._get_netsplit_group_bin = function( net_ele_point_hash )
{

  var group_list = {};
  var net_ele_group_bin = {};
  var ele_hash = {};

  // construct a list of unique elements (id identifies them)
  //
  for (var key in net_ele_point_hash)
  {
    var ele_list = net_ele_point_hash[key];
    for (var ind in ele_list)
    {
      var ele = ele_list[ind];
      if (!(ele.id in ele_hash))
        ele_hash[ele.id] = ele;

      group_list[ ele.group_name ] = 1;
    }
  }

  // Bin them by group
  //
  for (var g in group_list)
    net_ele_group_bin[g] = [];

  for (var id in ele_hash)
    net_ele_group_bin[ ele_hash[id].group_name ].push( ele_hash[id] );

  return net_ele_group_bin;

}


// We have a hash of points tied to their elements (either tracks or pads)
// and a list of groups, where elements are in the same group if they share an
// endpoing (or center).
// Do a simple bounding box check for each group to see if they intersect.
// If they do, then we have to do some more complex processing to figure out if
// they actually do intersect or not.
// If they don't intersect, on the other hand, we're guaranteed that they're distinct
// nets, so we can immediately take care of them. 
//
// Construct a list of unique elements and bin them by group.
//
bleepsixBoard.prototype._bounding_box_netsplit = function( net_ele_groups )
{

  var group_bbox = {};

  // Construct the bounding box for each group list
  //
  for (var gn in net_ele_groups)
  {
    var ele_list = net_ele_groups[gn];
    for (var ind in ele_list)
    {
      var ele = ele_list[ind];

      var ref = ele.ref;
      if (ele.type == "pad")
        var ref = ele.pad_ref;

      if ( ele.group_name in group_bbox)
      {
        this._update_bbox_with_point( group_bbox[ ele.group_name ], ref.bounding_box[0][0], ref.bounding_box[0][1] );
        this._update_bbox_with_point( group_bbox[ ele.group_name ], ref.bounding_box[1][0], ref.bounding_box[1][1] );
      }
      else
      {
        group_bbox[ ele.group_name ] = [
          [ ref.bounding_box[0][0], ref.bounding_box[0][1] ],
          [ ref.bounding_box[1][0], ref.bounding_box[1][1] ]
          ];
      }

    }

  }

  // Finally,  do an O(n^2) (n being the number of groups)
  // bounding box test to see if they intersect.
  //
  for (var ind0 in group_bbox)
  {
    for (var ind1 in group_bbox)
    {
      if (ind0 <= ind1) continue;
      if (this._box_box_intersect( group_bbox[ind0], group_bbox[ind1] ))
      {
        //return false;
        return { processed: false };
      }
    }
  }

  //console.log("bounding boxes do not intersect, simple netsplit");

  // We have a simple netsplit, so go through, keep the
  // first group as is and label the rest of the gruops
  // with a new net.
  //
  var first = true;
  var new_net_list = [];
  for (var group_name in net_ele_groups)
  {

    // Skip over the first net as we're going to keep
    // it's name.
    //
    if (first) { first = false; continue; }

    // create a new net
    //
    var new_net = this.addNet();
    new_net_list.push(new_net);

    // and associate it to the appropriate group
    //
    var ele_list = net_ele_groups[group_name];
    for (var ind in ele_list)
    {
      var type = ele_list[ind].type;
      if (type == "track")
      {
        var ref = ele_list[ind].ref;
        ref.netcode = new_net.net_number;
      }
      else if (type == "pad")
      {
        var pad_ref = ele_list[ind].pad_ref;
        pad_ref.net_number = new_net.net_number;
        pad_ref.net_name = new_net.net_name;
      }

    }
  }

  //console.log("net split, done");
  //return true;
  return { processed: true, new_net_info : new_net_list };

}

bleepsixBoard.prototype._get_netsplit_group_list = function( net_ele_point_hash )
{
  var tmp_group_name = {};
  var group_list = [];

  for (var pnt_key in net_ele_point_hash)
  {
    var hash_list = net_ele_point_hash[pnt_key];

    for (var ind in hash_list)
    {
      var ele = hash_list[ind];

      if (ele.group_name < 0)
      {
        console.log("ERROR: ele.group_name < 0: " + pnt_key + ", " + ind);
        console.log( net_ele_point_hash );
      }

      if ( !(ele.group_name in tmp_group_name) )
      {
        tmp_group_name[ ele.group_name ] = 1;
        group_list.push( ele.group_name );
      }

    }

  }

  return group_list;

}


bleepsixBoard.prototype._populate_netsplit_group_hash_names = function( net_ele_point_hash )
{
  var group_name = 1;

  for (var pnt_key in net_ele_point_hash)
  {
    var hash_list = net_ele_point_hash[pnt_key];

    for (var ind in hash_list)
    {
      var ele = hash_list[ind];
      var type = ele.type;

      var keys = null;
      if (type == "track")
        keys = this._construct_netsplit_track_hashkeys( ele.ref );
      else if (type == "pad")
        keys = this._construct_netsplit_pad_hashkeys( ele.ref, ele.pad_ref );

      for (var i in keys)
        this._construct_netsplit_flood_group_hash( net_ele_point_hash, keys[i], group_name );

    }
    group_name++;
  }
}


// Recursively go through the elements of net_ele_point_hash, using
// each visited element to jump off to another hash entry.
//
// Base case is if the group_name >= 0.
//
// If group_name < 0, populate it with group_name.
//
bleepsixBoard.prototype._construct_netsplit_flood_group_hash =
  function( net_ele_point_hash, key, group_name )
{
  var cur_group = group_name;

  if ( !(key in net_ele_point_hash) ) 
    return cur_group;

  for (var ind in net_ele_point_hash[key])
  {
    var ele = net_ele_point_hash[key][ind];
    var type = ele.type;

    if (ele.group_name >= 0)
      continue;

    ele.group_name = cur_group;

    if (type == "track")
    {
      var keys = this._construct_netsplit_track_hashkeys( ele.ref );
      for (var ind in keys)
        this._construct_netsplit_flood_group_hash( net_ele_point_hash, keys[ind], group_name );

    }
    else if (type == "pad")
    {

      var keys = this._construct_netsplit_pad_hashkeys( ele.ref, ele.pad_ref );
      for (var ind in keys)
        this._construct_netsplit_flood_group_hash( net_ele_point_hash, keys[ind], group_name );

    }

  }

}

// The starting point for the recursive flood fill.
// Get seed points from the seed_point and call
// the flood function with the given group name
//
// Populates/changes net_ele_point_hash
//
bleepsixBoard.prototype._construct_netsplit_groups_from_hash =
  function( net_ele_groups ,
            net_ele_point_hash,
            seed_point )
{

  console.log("seed_point:");
  console.log(seed_point);

  var seed_keys = [ 
    this._construct_netsplit_hashkey( seed_point.x0, seed_point.y0, seed_point.layer0 ),
    this._construct_netsplit_hashkey( seed_point.x1, seed_point.y1, seed_point.layer1 )
  ];

  console.log("seed_keys:");
  console.log(seed_keys);

  var group_name = 1;

  for (var i in seed_keys)
  {
    var seed_key = seed_keys[i];
    if (seed_key in net_ele_point_hash)
    {

      console.log("seeding from seed_key " + seed_key );
      this._construct_netsplit_flood_group_hash( net_ele_point_hash, seed_key, group_name );

    }
    group_name++;
  }

}

//---------------
// aux functions
//---------------

bleepsixBoard.prototype._construct_netsplit_hashkey = function(x, y, layer)
{
  var x_str = parseFloat( x ).toFixed(8);
  var y_str = parseFloat( y ).toFixed(8);

  return x_str + ":" + y_str + ":" + parseInt(layer) ;

}

bleepsixBoard.prototype._construct_netsplit_pad_hashkeys = function( mod, pad )
{

  var mod_x = parseFloat( mod.x );
  var mod_y = parseFloat( mod.y );
  var mod_a = parseFloat( mod.angle );

  var pad_x = parseFloat( pad.posx );
  var pad_y = parseFloat( pad.posy );
  var pad_a = parseFloat( pad.angle );

  var u = numeric.dot( this._R( mod_a ), [ pad_x, pad_y ] );

  var keys = [];
  for (layer = 0; layer<16; layer++)
  {
    if ( !( parseInt( pad.layer_mask, 16 ) & (1<<layer)) )
      continue;
    keys.push( this._construct_netsplit_hashkey( u[0] + mod_x, u[1] + mod_y, layer ) );
  }

  return keys;

}

bleepsixBoard.prototype._construct_netsplit_track_hashkeys = function( track )
{
  var keys = [];

  var layer = parseInt( track.layer ) & 0x0f;
  keys.push( this._construct_netsplit_hashkey( track.x0, track.y0, layer ) );

  if ( track.shape != "track" )
    layer = ((parseInt( track.layer ) & 0xf0) >> 4);

  keys.push( this._construct_netsplit_hashkey( track.x1, track.y1, layer ) );

  return keys;

}

//------------------
// aux functions end
//------------------


// Go through the board and find all elements that have the netcode to 
// be split.  Construct a hash with elements:
//   group_name (initially -1)
//   type       (either "track" or "pad")
//   ref        (ref to track or module)
//   [pad_ref]  (reference to pad if type is "pad")
//
// Store into net_ele_point_hash
//
bleepsixBoard.prototype._construct_netsplit_point_hash =
  function( net_ele_point_hash,
            orig_netcode )

{
  var brd = this.kicad_brd_json["element"];
  for (var ind in brd)
  {
    var ele = brd[ind];
    if (ele.type == "track")
    {

      if ( parseInt(ele.netcode) != orig_netcode )
        continue;

      var keys = this._construct_netsplit_track_hashkeys( ele );
      for (var ind in keys)
      {
        var key = keys[ind];

        if (key in net_ele_point_hash)
          net_ele_point_hash[key].push( { type: "track", ref: ele, group_name : -1, id: ele.id } );
        else
          net_ele_point_hash[key] =  [ { type: "track", ref: ele, group_name : -1, id: ele.id } ]
      }

    }
    else if (ele.type == "module")
    {
      var pads = ele.pad;
      for (var pad_ind in pads)
      {
        var pad = pads[pad_ind];

        if ( parseInt(pad.net_number) != orig_netcode )
          continue;

        var keys = this._construct_netsplit_pad_hashkeys( ele, pad );
        for (var ind in keys )
        {
          var key = keys[ind];
          if (key in net_ele_point_hash)
            net_ele_point_hash[key].push( { type: "pad", ref: ele, pad_ref: pad, group_name : -1, id : pad.id } );
          else
            net_ele_point_hash[key] =  [ { type: "pad", ref: ele, pad_ref : pad, group_name : -1, id : pad.id  } ]
        }

      }
    }

  }
}

