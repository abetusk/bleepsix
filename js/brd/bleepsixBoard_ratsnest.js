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

bleepsixBoardHeadless_ratsnest = false;
if (typeof module !== 'undefined')
{
  var bleepsixBoard = require("./bleepsixBoard_netops.js");

  var EuclideanMST = require("../lib/euclideanmst.js");
  module.exports = bleepsixBoard;
  bleepsixBoardHeadless_ratsnest = true;
}



// auxiliary functions for rat's nest calculations
//


bleepsixBoard.prototype._filter_copper_element_single = function( res, ele, orig_netcode, layer, sch_net_code_map )
{
  var type = ele.type;

  if (orig_netcode < 0) return false;

  /*
  netcode = orig_netcode;
  if (sch_net_code_map && (netcode in sch_net_code_map))
    netcode = sch_net_code_map[ orig_netcode ];
    */

  var mapNetList = [ orig_netcode ];
  if (sch_net_code_map && (orig_netcode in sch_net_code_map))
    mapNetList = sch_net_code_map[ orig_netcode ];


  //DEBUG
  //console.log(">>> filter single (orig_netcode " + orig_netcode + ")" );
  //console.log( sch_net_code_map);
  //console.log(mapNetList);


  if (type == "track")
  {

    if ((layer >= 0) &&
        (layer != parseInt(ele.layer)))
      return ;

    var ele_net_number = parseInt(ele.netcode);

    var eleNetList = [ ele_net_number ];
    if (sch_net_code_map && (orig_netcode in sch_net_code_map))
      eleNetList = sch_net_code_map[ ele_net_number ];

    var foundFlag = false;
    for (var ii in eleNetList)
    {
      for (var jj in mapNetList)
      {
        if (eleNetList[ii] == mapNetList[jj])
        {
          foundFlag = true;
          break;
        }
      }
      if (foundFlag) break;
    }

    if (!foundFlag) 
      return ;

    res.push( { id: ele.id, ref: ele, type : "track" } );

  }

  else if (type == "module")
  {

    var pads = ele.pad;

    /*
    //DEBUG
    console.log("ele, pads:");
    console.log(ele);
    console.log(pads);
    */

    for (var p_ind in pads)
    {
      var pad = pads[p_ind];

      if ((layer >= 0) &&
          ( (parseInt(pad.layer_mask, 16) & (1<<layer)) == 0 ) )
      {
        continue;
      }

      var ele_net_number = parseInt(pad.net_number);

      var eleNetList = [ ele_net_number ];
      if (sch_net_code_map && (orig_netcode in sch_net_code_map))
        eleNetList = sch_net_code_map[ ele_net_number ];

      /*
      //DEBUG
      console.log("considering pad(" + p_ind + "): " + pad.net_number );
      console.log(pad);
      console.log("\n");
      */


      var foundFlag = false;
      for (var ii in eleNetList)
      {
        for (var jj in mapNetList)
        {
          if ( (parseInt(eleNetList[ii]) == 0) || 
               (parseInt(mapNetList[jj]) == 0) )
            continue;

          if ( parseInt(eleNetList[ii]) == parseInt(mapNetList[jj]) )
          {
            foundFlag = true;
            break;
          }
        }
        if (foundFlag) break;
      }

      if (!foundFlag) 
      {
        continue;
      }

      /*
      //DEBUG
      console.log(">>>> pad filter (" + foundFlag + ") (" + layer + ")" );
      console.log( pad );
      console.log( mapNetList );
      console.log("\n");
      */

      if (!foundFlag) 
      {
        continue;
      }


      /*
      if ((netcode >= 0) &&
          (netcode != parseInt(pad.net_number)) )
        return false;
        */

      res.push( { id: pad.id, ref: ele, pad_ref: pad, type :"pad" } );

    }

  }

}


// Get all elements from this.kicad_brd_json that are of the same netcode
// and layer.  If netcode and/or layer aren't specified, grab all copper
// elements from from the appropriate necode/layer.
//
// CZones are ignored.
//
// Returns an id_ref_array.
//
//
bleepsixBoard.prototype._filter_copper_elements = function( netcode, layer, id_ref_array, sch_net_code_map )
{
  netcode = ( (typeof netcode === 'undefined') ? -1 : netcode );
  layer   = ( (typeof layer === 'undefined') ? -1 : layer );
  id_ref_array = ( (typeof id_ref_array === 'undefined') ? [] : id_ref_array );


  var res = [];

  var brd = this.kicad_brd_json.element;
  for (var ind in brd)
  {
    if ( ("hideFlag" in brd[ind]) &&
         brd[ind].hideFlag )
      continue;

    this._filter_copper_element_single( res, brd[ind], netcode, layer, sch_net_code_map );
  }

  for (var ind in id_ref_array)
  {
    this._filter_copper_element_single( res, id_ref_array[ind].ref, netcode, layer, sch_net_code_map );
  }

  return res;

}


// Help function to make key for hash
//
bleepsixBoard.prototype._make_endpoint_key = function( x, y )
{
  var scale =  1000000000;
  var str_x = (scale*parseFloat(x)).toFixed(0);
  var str_y = (scale*parseFloat(y)).toFixed(0);

  return str_x + ":" + str_y;

}

bleepsixBoard.prototype._ratsnest_make_endpoint_hash = function( endpoint_hash, net_id_ref )
{

  for (var ind in net_id_ref)
  {

    var id_ref = net_id_ref[ind];
    var type = id_ref.type;

    if (type == "track")
    {
      var ref = id_ref.ref;
      var shape = ref.shape;

      var key = this._make_endpoint_key( ref.x0, ref.y0 );
      if (key in endpoint_hash) 
        endpoint_hash[key].bp.push( id_ref );
      else 
        endpoint_hash[key] = { bp: [ id_ref] };

      if (shape == "track")
      {
        key = this._make_endpoint_key( ref.x1, ref.y1 );
        if (key in endpoint_hash) 
          endpoint_hash[key].bp.push( id_ref );
        else 
          endpoint_hash[key] = { bp: [ id_ref] };
      }

    }

    else if (type == "pad")
    {

      var ref = id_ref.ref;
      var pad_ref = id_ref.pad_ref;

      var tx = parseFloat(ref.x);
      var ty = parseFloat(ref.y);

      var px = parseFloat(pad_ref.posx);
      var py = parseFloat(pad_ref.posy);

      var key = this._make_endpoint_key( tx + px, ty + py );

      if (key in endpoint_hash)
        endpoint_hash[key].bp.push( id_ref );
      else
        endpoint_hash[key] = { bp: [ id_ref] };
    }

    //else if (type== "czone") { }

  }


}

bleepsixBoard.prototype._ratsnest_group_elements = function( endpoint_hash, net_id_ref )
{

  var group_list ;
  var dirty_flag = true;
  while (dirty_flag)
  {

    group_list = this._ratsnest_create_group_list( net_id_ref );
    var group_geom_pgns = {};

    group_bbox = {};

    for (var g in group_list)
    {
      var first_bbox_flag = true;
      for (var i in group_list[g])
      {
        var ele = group_list[g][i];
        var tbox;
        if (ele.type == "track")
          tbox = group_list[g][i].ref.bounding_box;
        else if (ele.type == "pad")
          tbox = group_list[g][i].pad_ref.bounding_box;

        if (first_bbox_flag)
        {
          group_bbox[g] = [[ tbox[0][0], tbox[0][1] ], [ tbox[1][0], tbox[1][1] ] ];
          first_bbox_flag = false;
        }
        else
        {
          this._update_bbox_with_point( group_bbox[g], tbox[0][0], tbox[0][1] );
          this._update_bbox_with_point( group_bbox[g], tbox[1][0], tbox[1][1] );
        }
      }

    }

    /*
    for (var g in group_list)
    {
      var first_bbox_flag = true;

      var pgns = [];
      for (var i in group_list[g])
      {
        pgns.push( this._build_element_polygon( group_list[g][i] ) );

        var ele = group_list[g][i];
        var tbox;
        if (ele.type == "track")
          tbox = group_list[g][i].ref.bounding_box;
        else if (ele.type == "pad")
          tbox = group_list[g][i].pad_ref.bounding_box;

        if (first_bbox_flag)
        {
          group_bbox[g] = [[ tbox[0][0], tbox[0][1] ], [ tbox[1][0], tbox[1][1] ] ];
          first_bbox_flag = false;
        }
        else
        {
          this._update_bbox_with_point( group_bbox[g], tbox[0][0], tbox[0][1] );
          this._update_bbox_with_point( group_bbox[g], tbox[1][0], tbox[1][1] );
        }

      }


      var u_pgns = [];
      this._clip_union(u_pgns, pgns);
      group_geom_pgns[g] = u_pgns;

    }
    */

    dirty_flag = false;
    for (var g0 in group_list)
    {
      for (var g1 in group_list)
      {
        if (g1 <= g0) continue;

        // could put bbox intersection here to try and speed things up
        //

        if (! this._box_box_intersect( group_bbox[g0], group_bbox[g1]) )
          continue;

        //TESTING
        // It's just so much faster without this extra step.
        // What happens when we don't calculate the "correct" rats nest?
        // we have extra lines and groups that are disjoint when they
        // should really be connected.  At worst we get extra lines drawn
        // instead of just a few.  I think this is a reasonable price
        // to pay for a 30x increase.  We can come back to it later...
        //
        continue;

        if (!(g0 in group_geom_pgns))
        {
          var pgns = [];
          for (var i in group_list[g0])
            pgns.push( this._build_element_polygon( group_list[g0][i] ) );
          var u_pgns = [];
          this._clip_union(u_pgns, pgns);
          group_geom_pgns[g0] = u_pgns;
        }

        if (!(g1 in group_geom_pgns))
        {
          var pgns = [];
          for (var i in group_list[g1])
            pgns.push( this._build_element_polygon( group_list[g1][i] ) );
          var u_pgns = [];
          this._clip_union(u_pgns, pgns);
          group_geom_pgns[g1] = u_pgns;
        }

        var tst_pgn = [];
        this._clip_intersect( tst_pgn, group_geom_pgns[g0], group_geom_pgns[g1] );

        if (tst_pgn.length > 0)
        {
          for (var k in group_list[g1])
            group_list[g1][k].group_name = parseInt(g0);
          dirty_flag = true;
          break;
        }


      }

      if (dirty_flag) break;
    }

  }

}



bleepsixBoard.prototype._airwires_conn_r  = function( aw, airwire_point_hash, group_name  )
{

  if (parseInt(aw.group_name) >= 0)
    return;

  aw.group_name = parseInt(group_name);

  var id = aw.id;
  var keys = [ this._make_endpoint_key( aw.x0, aw.y0 ),
               this._make_endpoint_key( aw.x1, aw.y1 ) ];
  for (var k in keys)
  {
    var key = keys[k];

    for (var i in airwire_point_hash[key])
      this._airwires_conn_r( airwire_point_hash[key][i], airwire_point_hash, group_name );
  }
}

bleepsixBoard.prototype._update_airwire_group_points_r = function( graph_ele, gr, graph_edge, group_name )
{
  if (graph_ele.group_name >= 0)
    return;

  graph_ele.group_name = group_name;
  var neighbors = graph_edge[ graph_ele.orig_ind ];
  for (var n in neighbors)
    this._update_airwire_group_points_r( gr[n], gr, graph_edge, group_name);

}

bleepsixBoard.prototype._update_airwire_group_points = function( group_points, conn_graph )
{
  var id = 0;

  var gr = {};
  for (var g in group_points)
    gr[g] = { id: ++id, group_name : -1, pnts : group_points[g], orig_ind : g  };

  var group_names = [];
  for (var g in conn_graph)
    group_names.push( parseInt(g) );

  group_names.sort( function(x,y) { return x-y; } );

  for (var ind in group_names)
  {
    var g = group_names[ind];
    this._update_airwire_group_points_r( gr[g], gr, conn_graph, g );
  }

  t_group_points = {};
  for (var g in gr)
  {
    var group_name = gr[g].group_name;
    if (!(group_name in t_group_points))
      t_group_points[group_name] = [];

    var pnts = group_points[ gr[g].orig_ind ];
    for (var ind in pnts)
      t_group_points[ group_name ].push( pnts[ind] );
  }

  return t_group_points;

}

bleepsixBoard.prototype._connect_airwires = function( airwires, group_points )
{

  airwires.length = 0;

  var group_points_count=0;
  for (var ind in group_points)
    group_points_count++;

  while ( group_points_count > 1 )
  {
    var t_graph = {};

    for (var g0 in group_points)
    {
      var pnts_other = [];

      var t_min_g = -1;
      var t_min_aw = {};

      for (var g1 in group_points)
      {
        if (parseInt(g0) == parseInt(g1)) 
          continue;

        
        if (t_min_g < 0)
        {
          t_min_g = g1;
          t_min_aw = this._ratsnest_closest_point_n2( group_points[g0], [ group_points[g1] ] );
          continue;
        }

        var t_aw =  this._ratsnest_closest_point_n2( group_points[g0], [ group_points[g1] ]);
        if (t_aw.d2 < t_min_aw.d2)
        {
          t_min_aw = t_aw;
          t_min_g = g1;
        }
      }

      if (!(g0 in t_graph))
        t_graph[g0] = {};
      t_graph[g0][t_min_g] = 1;

      if (!(t_min_g in t_graph))
        t_graph[t_min_g] = {};
      t_graph[t_min_g][g0] = 1;

      airwires.push( t_min_aw );

    }

    group_points = this._update_airwire_group_points( group_points, t_graph );

    group_points_count = 0;
    for (var g in group_points)
      group_points_count++;

  }


}


bleepsixBoard.prototype._ratsnest_closest_point_n2 = function( pnts , pnts_list )
{
  var c0 = 0, c1 = 0;
  var min_d2 = 0;
  var min_pnt = { x0: 0, y0: 0, x1: 0, y1: 0, d2: 0 };

  for (var ipl in pnts_list)
  {
    for (var ip in pnts_list[ipl])
    {
      var p1 = pnts_list[ipl][ip];
      for (var i in pnts)
      {
        var p0 = pnts[i];
        var dx = p0[0] - p1[0];
        var dy = p0[1] - p1[1];

        var d2 = dx*dx + dy*dy;

        if ( ((c0 == 0) && (c1 == 0)) ||
             (d2 < min_pnt.d2) )
        {
          min_pnt.d2 = d2;
          min_pnt.x0 = p0[0];
          min_pnt.y0 = p0[1];
          min_pnt.x1 = p1[0];
          min_pnt.y1 = p1[1];

        }
        c0++;

      }

      c1++;
    }
  }

  return min_pnt;

}

bleepsixBoard.prototype._ratsnest_create_group_points = function( net_id_ref )
{

  var group_pnts = {};
  for (var ind in net_id_ref)
  {
    var ele = net_id_ref[ind];
    var type = ele.type;
    var ref = ele.ref;
    var group_name = ele.group_name;

    if (!(group_name in group_pnts))
      group_pnts[group_name] = [];
    var pnts = group_pnts[group_name];

    if (type == "track")
    {
      var shape = ref.shape;

      var x0 = parseFloat(ref.x0);
      var y0 = parseFloat(ref.y0);

      pnts.push( [ x0, y0 ] );

      if (shape == "track")
      {
        var x1 = parseFloat(ref.x1);
        var y1 = parseFloat(ref.y1);

        pnts.push( [ x1, y1 ] );

        var dx = x0 - x1;
        var dy = y0 - y1;
        var dl = Math.sqrt( (dx*dx) + (dy*dy) );

        if (dl > 0)
        {

          var ds = parseFloat(ref.width) * 10;

          for (var dt=ds; dt < dl; dt += ds )
          {
            var snapxy = g_snapgrid.snapGrid( { x: (x1 + (dx*dt/dl)), y: (y1 + (dy*dt/dl) ) } );
            pnts.push( [ snapxy.x, snapxy.y ] );
          }
        }
      }

    }
    else if (type == "pad")
    {
      var pad_ref = ele.pad_ref;

      var cx = parseFloat( ref.x );
      var cy = parseFloat( ref.y );
      var ma = parseFloat( ref.angle );

      var px = parseFloat( pad_ref.posx );
      var py = parseFloat( pad_ref.posy );
      var pa = parseFloat( pad_ref.angle );

      var u = numeric.dot( this._R( ma ), [ px, py ] );

      pnts.push( [ cx + u[0], cy + u[1] ] );
    }
    
  }

  return group_pnts;
}

bleepsixBoard.prototype._debug_color_group = function( net_id_ref )
{

  var group_color = {};
  for (var ind in net_id_ref)
  {
    r = Math.floor((Math.random()*256));
    g = Math.floor((Math.random()*256));
    b = Math.floor((Math.random()*256));
    group_color[ net_id_ref[ind].group_name ] = "rgba(" + r + "," + g + "," + b +",0.5)";
  }

  for (var ind in net_id_ref)
  {
    this.debug_cgeom.push({ 
      pnts : this._pgn2pnt( this._build_element_polygon( net_id_ref[ind] )  ), 
      color : group_color[ net_id_ref[ind].group_name ] 
    });
  }

}




bleepsixBoard.prototype._ratsnest_create_group_list = function( net_id_ref )
{
  var group_list = {};
  for (var ind in net_id_ref)
  {
    var ele = net_id_ref[ind];
    var group_name = ele.group_name;
    if (group_name in group_list)
      group_list[group_name].push( ele );
    else
      group_list[group_name] = [ ele ];
  }

  return group_list;
}

bleepsixBoard.prototype._ratsnest_coarse_conn_graph_r = function( ele, endpoint_hash, cur_group )
{
  var keys = [];

  var type = ele.type;
  if (type == "track")
  {
    keys.push( this._make_endpoint_key( ele.ref.x0, ele.ref.y0  ) );

    if (ele.shape == "track")
      keys.push( this._make_endpoint_key( ele.ref.x1, ele.ref.y1 ) );

  }
  else if (type == "pad")
  {
    var cx = parseFloat( ele.ref.x );
    var cy = parseFloat( ele.ref.y );

    var px = parseFloat( ele.pad_ref.posx );
    var py = parseFloat( ele.pad_ref.posy );

    keys.push( this._make_endpoint_key( cx+px, cy+py ) );
  }

  for (var k in keys)
  {
    var key = keys[k];

    for (var ind in endpoint_hash[key].bp)
    {
      var next_ele = endpoint_hash[key].bp[ind];

      if (next_ele.id == ele.id)
      {
        continue;
      }


      if (next_ele.group_name >= 0)
        continue;

      next_ele.group_name = cur_group;
      this._ratsnest_coarse_conn_graph_r( next_ele, endpoint_hash, cur_group );
    }
  }


}

//bleepsixBoard.prototype._ratsnest_decorate_id_ref_with_coarse_group = function( endpoint_hash )
bleepsixBoard.prototype._ratsnest_decorate_coarse_group_with_group_name = function( endpoint_hash )
{
  var group_name = 1;
  for (var key in endpoint_hash)
    for (var ind in endpoint_hash[key].bp)
      endpoint_hash[key].bp[ind].group_name = -1;

  for (var key in endpoint_hash)
  {
    var h = endpoint_hash[key];
    for (var ind in h.bp)
    {
      if (h.bp[ind].group_name >= 0)
        continue;

      h.bp[ind].group_name = group_name;
      this._ratsnest_coarse_conn_graph_r( h.bp[ind], endpoint_hash, group_name );
    }
    group_name++;
  }
 
}

function distance_metric(a,b)
{
  return (a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]);
}


// Access function
// Not specifying netcode will update all netcodes
// Updates this.kicad_brd_json.net_code_airwire_map
//
// Jitter is added to compensate for weirdness in the EuclideanMST.  I think what's
// going on is that if points are colinera, the Delaunay triangulation screws up
// and drops some of the points.  By adding a small jitter (a random amount in [0,1])
// this makes it very unlikely that points are colinear and has all of them evaluated.
// If points are dropped, some line segments become longer than they would had the points
// not been dropped.  This creates airwire artifacts on some traces, for example.
// 
// sch_net_code_map is an object with board net codes as keys and an array of which schematic
// nets they map to.  For example, if board netcode "N-00003" (board netcode 3, say) mapped
// to schematic netcode 13 and 17, there would be:
// {
//   ...
//   3 : [ 13, 17 ],
//   ...
// }
// as a value in the 'sch_net_code_map'.
//
bleepsixBoard.prototype._update_single_ratsnest = function( netcode, ds, id_ref_array, sch_net_code_map )
{
  // anything below this and it'll probably just bog down too much.
  //
  //ds = ( (typeof ds === 'undefined') ? 100 : ds );
  //if (ds <=  0) ds = 100;

  ds = ( (typeof ds === 'undefined') ? 500 : ds );
  if (ds <=  0) ds = 200;

  var jitter_x = 0, jittery_y = 0;

  var net_id_ref = this._filter_copper_elements( netcode, undefined, id_ref_array, sch_net_code_map );

  //DEBUG
  //console.log(">>>>> _update_single_ratsnest");
  //console.log(net_id_ref);

  var verts = [];

  for (var ind in net_id_ref)
  {
    var ele = net_id_ref[ind];
    var type = ele.type;
    var ref = ele.ref;
    
    if (type == "pad")
    {
      var pad_ref = ele.pad_ref;
      var cx = parseFloat( ref.x );
      var cy = parseFloat( ref.y );
      var ma = parseFloat( ref.angle );

      var px = parseFloat( pad_ref.posx );
      var py = parseFloat( pad_ref.posy );
      var pa = parseFloat( pad_ref.angle );

      var u = numeric.dot( this._R( ma ), [ px, py ] );

      jitter_x = Math.random();
      jitter_y = Math.random();

      //verts.push( [ cx + u[0], cy + u[1] ] );
      verts.push( [ cx + u[0] + jitter_x, cy + u[1] + jitter_y ] );

    }
    else if (type == "track")
    {
      var x0 = parseFloat(ref.x0);
      var y0 = parseFloat(ref.y0);

      verts.push( [ x0, y0 ] );
      if (ref.shape == "track")
      {

        var x1 = parseFloat(ref.x1);
        var y1 = parseFloat(ref.y1);

        //verts.push( [ x1, y1 ] );
        jitter_x = Math.random();
        jitter_y = Math.random();
        verts.push( [ x1 + jitter_x, y1 + jitter_y ] );

        var dx = x1 - x0;
        var dy = y1 - y0;
        var dl = Math.sqrt( (dx*dx) + (dy*dy) );

        if (dl == 0) continue;

        for (var dt=ds; dt < dl; dt += ds)
        {
          //verts.push( [ x0 + (dx*dt/dl), y0 + (dy*dt/dl) ] );
          jitter_x = Math.random();
          jitter_y = Math.random();
          verts.push( [ x0 + (dx*dt/dl) + jitter_x, y0 + (dy*dt/dl) + jitter_y ] );


        }

      }
    }
  }

  var edges = [];

  if (verts.length > 2)
    edges = EuclideanMST.euclideanMST( verts, distance_metric );
  else if (verts.length == 2)
    edges = [[ 0, 1 ]] ;


  //var min_seg_len_sq = (ds+1)*(ds+1);
  var min_seg_len_sq = (ds+5)*(ds+5);

  var filtered_edge = [];
  for (var ind in edges)
  {

    var u =  edges[ind][0];
    var v =  edges[ind][1];
    var seg = { 
      //x0 : verts[u][0], y0 : verts[u][1], 
      //x1 : verts[v][0], y1 : verts[v][1]
      x0 : verts[u][0] + Math.random(), y0 : verts[u][1] + Math.random(), 
      x1 : verts[v][0] + Math.random(), y1 : verts[v][1] + Math.random()
      };

    var l2 = (seg.x0 - seg.x1)*(seg.x0 - seg.x1) + (seg.y0 - seg.y1)*(seg.y0 - seg.y1);
    if (l2 <= min_seg_len_sq)
      continue;

    this.kicad_brd_json.net_code_airwire_map[ netcode ].push( seg );
  }

}

bleepsixBoard.prototype.updateRatsNest = function( netcode, id_ref_array, sch_net_code_map )
{


  if (typeof netcode !== 'undefined')
  {

    if (!("net_code_airwire_map" in this.kicad_brd_json))
      this.kicad_brd_json.net_code_airwire_map = {};

    //EXPERIMENTAL
    //
    // Board nets might have been split (but still be connected via a schematic net) 
    // in which case we need to remove elements from the airwire map that are of
    // the same schematic net.  This operation is much cheaper than doing a board
    // wide recalculation.
    //
    else
    {

      var btosm0 = this.kicad_brd_json.brd_to_sch_net_map[netcode];
      var awp = this.kicad_brd_json.net_code_airwire_map;
      for (var nc_awp in awp)
      {
        var btosm1 = this.kicad_brd_json.brd_to_sch_net_map[nc_awp];
        for (var ii in btosm0)
          for (var jj in btosm1)
            if (btosm0[ii] == btosm1[jj])
              awp[ nc_awp ] = [];

      }
    }
    //
    //EXPERIMENTAL



    this.kicad_brd_json.net_code_airwire_map[netcode] = [];
    this._update_single_ratsnest( netcode, undefined, id_ref_array, sch_net_code_map );

    if (!bleepsixBoardHeadless_ratsnest)
    {
      g_painter.dirty_flag = true;
    }

    return;
  }

  this.kicad_brd_json.net_code_airwire_map = {};
  for (var nc in this.kicad_brd_json.net_code_map)
  {
    this.kicad_brd_json.net_code_airwire_map[nc] = [];
    this._update_single_ratsnest( nc, undefined , id_ref_array, sch_net_code_map );
  }

  if (!bleepsixBoardHeadless_ratsnest)
  {
    g_painter.dirty_flag = true;
  }


}


