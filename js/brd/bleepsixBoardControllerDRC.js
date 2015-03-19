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


// Let's assume this won't be in the server version for now...
//
/*
var brdControllerHeadless = false;
if (typeof module !== 'undefined')
{
  brdControllerHeadless = true;
  var bleepsixSchematic = require("../sch/bleepsixSchematicNode.js");
  var bleepsixBoard = require("./bleepsixBoardNode.js");

  var bleepsixAux = require("../lib/meowaux.js");

  var guid = bleepsixAux.guid;
  var s4 = bleepsixAux.s4;

}
*/


// Floating pins
// ----
// Loop through schematic pins.  Loop through all
// noconns.  Loop through all pins and cross reference
// against noconns.  Collect all netcodes in pins
// that don't have noconns.  For all netcodes that
// only have one element (the pin in question), throw
// an error.
bleepsixBoardController.prototype._check_floating_pins = function()
{
  var sch = this.schematic.kicad_sch_json;
  var sch_net_pin_map = sch.net_pin_id_map;

  var brd = this.board.kicad_brd_json;
  var brd_to_sch = brd.brd_to_sch_net_map;
  var sch_to_brd = brd.sch_to_brd_net_map;

  // Find where noconns place on schematic pins.
  //
  var pin_xy_map = {};
  var noconn_xy_map = {};
  for (var ind in sch.element)
  {

    var ele = sch.element[ind];
    if (ele.type == "component")
    {

      if (!("pinData" in ele)) { continue; }
      for (var p_ind in ele.pinData)
      {
        var xykey = Math.floor(ele.pinData[p_ind].x) + ":" + Math.floor(ele.pinData[p_ind].y);
        pin_xy_map[xykey] = {
          associated : false,
          netcode : ele.pinData[p_ind].netcode,
          parent_id : ele.id,
          id : ele.id + ":" + p_ind,
          ind : p_ind,
          parent_data : ele,
          pin_data : ele.pinData[p_ind]
        };
      }

    } else if (ele.type == "noconn") {

      var xykey = Math.floor(ele.x) + ":" + Math.floor(ele.y);
      noconn_xy_map[xykey] = {
        associated:false,
        comp_data:{},
        pin_data:{}
      };

    }

  }

  //console.log(pin_xy_map);
  //console.log(noconn_xy_map);

  for (var xykey in noconn_xy_map) {
    if (xykey in pin_xy_map) {
      pin_xy_map[xykey].associated = true;
    }
  }

  var netcode_map = {};
  var nc_to_pin = {};

  for (var xykey in pin_xy_map) {
    if (pin_xy_map[xykey].associated) { continue; }
    var nc = pin_xy_map[xykey].netcode;
    if (nc in netcode_map) {
      netcode_map[nc] += 1;
    } else {
      netcode_map[nc] = 1;
    }

    nc_to_pin[nc] = pin_xy_map[xykey];
  }

  var ret = [];
  for (var nc in netcode_map) {
    if (netcode_map[nc]==1) {

      //DEBUG
      //console.log("unassociated netcode!", nc, nc_to_pin[nc].id );
      //console.log( this.schematic.refLookup( nc_to_pin[nc].parent_id ) );
      //console.log( this.board.refLookup( nc_to_pin[nc].parent_id ) );

      var uele = {
        id : nc_to_pin[nc].parent_id
        //ind :  nc_to_pin[nc].pin_ind
        //pad_name:  pin_ind
      };

      if ("ind" in nc_to_pin[nc]) {
        uele.pad_name = nc_to_pin[nc].ind;
      }

      ret.push(uele);

    }
  }

  return ret;

}

// Run through power (schematic) components and see if they're
// connected to anything (check if they're floating).
//
// Return array of objects.  Each element:
// {
//   netcode : nc,
//   pwr : element
// }
//
//
bleepsixBoardController.prototype._check_pwr_connects = function()
{
  sch = this.schematic.kicad_sch_json;
  sch_net_pin_map = sch.net_pin_id_map;

  brd = this.board.kicad_brd_json;
  brd_to_sch = brd.brd_to_sch_net_map;
  sch_to_brd = brd.sch_to_brd_net_map;

  var pwr_ele = {};
  var pwr_net = {};
  var pwr_net_ele = {};
  for (var ind in sch.element)
  {

    var ele = sch.element[ind];
    if (ele.type == "component")
    {
      if (!("reference" in ele)) { continue; }
      if (ele.reference.match(/^#PWR/)) {

        if (!("powerPinData" in ele)) { continue; }
        for (var p_ind in ele.powerPinData) {
          var p_nc = ele.powerPinData[p_ind].netcode;
          pwr_net[ p_nc ] = -1;
          if (p_nc in pwr_net_ele) {
            pwr_net_ele[p_nc].push( ele );
          } else {
            pwr_net_ele[p_nc] = [ ele ];
          }
          pwr_ele[ ele.id ] = ele;
        }
      }

    }

  }

  for (var ind in sch.element) {
    var ele = sch.element[ind];
    if (!("pinData" in ele)) { continue; }

    for (var p_ind in ele.pinData) {
      var nc = ele.pinData[p_ind].netcode;
      if (nc in pwr_net) { pwr_net[nc] = 1; }
    }
  }

  var un_net = [];
  for (var nc in pwr_net) {
    if (pwr_net[nc] < 0) {

      //DEBUG
      //console.log("PWR net unassociated!", nc);

      un_net.push( { netcode: nc, pwr : pwr_net_ele[nc] } );
    }
  }

  return un_net;

}

bleepsixBoardController.prototype.DRC = function()
{
  var drc = {};
  sch = this.schematic.kicad_sch_json;
  sch_net_pin_map = sch.net_pin_id_map;

  brd = this.board.kicad_brd_json;
  brd_to_sch = brd.brd_to_sch_net_map;
  sch_to_brd = brd.sch_to_brd_net_map;

  // Make sure VCC and GND are present and not of the same
  // net as each other.
  //
  drc.pwr_unconn = this._check_pwr_connects();

  //DEBUG
  //console.log("unconnected power:", drc.pwr_unconn);

  // Make sure all pins labelled 'W' are attached to
  // VCC or GND (or some other PWR element).
  //

  //---

  // For every netcode in the schematic, if it
  // maps to a single pin component in the board,
  // and it's not a noconn, DRC error.
  //
  drc.float_pin = this._check_floating_pins();

  //DEBUG
  //console.log("floating pins:", drc.float_pin);

  //---

  // sch->brd nets and brd->sch nets should be 1-1 and onto.
  //
  drc.sch_to_brd_unconn = {};
  drc.brd_from_sch_issue = {};
  for (var sch_nc in sch_to_brd) {
    if (sch_to_brd[sch_nc].length > 1) {
      var count=0;
      var uniq = {};
      for (var ii in sch_to_brd[sch_nc]) { uniq[ sch_to_brd[sch_nc][ii] ] = 1; }
      for (var ii in uniq) { count++; }
      if (count>1) {
        drc.sch_to_brd_unconn[sch_nc] = 1;

        for (var jj in sch_to_brd[sch_nc]) {
          drc.brd_from_sch_issue[ sch_to_brd[sch_nc][jj] ] = 1;
        }

      }
    }
  }

  drc.brd_to_sch_unconn = {};
  drc.sch_from_brd_issue = {};
  for (var brd_nc in brd_to_sch) {
    if (brd_to_sch[brd_nc].length > 1) {
      var count=0;
      var uniq = {};
      for (var ii in brd_to_sch[brd_nc]) { uniq[ brd_to_sch[brd_nc][ii] ] = 1; }
      for (var ii in uniq) { count++; }
      if (count>1) {
        drc.brd_to_sch_unconn[brd_nc] = 1;

        for (var jj in brd_to_sch[brd_nc]) {
          drc.sch_from_brd_issue[ brd_to_sch[brd_nc][jj] ] = 1;
        }

      }
    }
  }

  return drc;

}

/*
  // Collect no-conns in sch
  //
  var noconn_pin_map = {};

  // first collect noconns
  for (var ind in sch.element)
  {
    var ele = sch.element[ind];
    if (ele.type == "noconn") {
      var xykey = Math.floor(ele.x) + ":" + Math.floor(ele.y);
      noconn_pin_map[xykey] = { associated:false, comp_data:{}, pin_data:{} };
    }
  }

  // Find where noconns place on schematic pins.
  //
  for (var ind in sch.element)
  {
    var ele = sch.element[ind];
    if (ele.type == "component")
    {
      if (!("pinData" in ele)) { continue; }
      for (var p_ind in ele.pinData)
      {
        var xykey = Math.floor(ele.pinData[p_ind].x) + ":" + Math.floor(ele.pinData[p_ind].y);
        if (xykey in noconn_pin_map) {
          noconn_pin_map[xykey].associated = true;
          noconn_pin_map[xykey].pin_data = ele.pinData[p_ind];
          noconn_pin_map[xykey].comp_data = ele;
          noconn_pin_map[xykey].pin_id = ele.id + ":" + p_ind;
        }
      }
    }
  }


  // Noconn maps to a board netcode which maps back to
  // schematic netcodes.  If that final map back
  // has multiple schematic netcodes, we know a noconn
  // connection has multiple connections and represents
  // a DRC error.
  //
  var noconn_drc_fail = [];
  for (var ind in noconn_pin_map) {
    var sch_nc = noconn_pin_map[ind].pin_data.netcode;

    var brd_ncs = sch_to_brd[sch_nc];
    var uniq = {};
    for (var ii in brd_ncs) {
      var sch_ncs = brd_to_sch[brd_ncs[ii]];
      for (var jj in sch_ncs) {
        uniq[sch_ncs[jj]] = 1;
      }
    }
    var count=0;
    for (var ii in uniq) { count++; }
    if (count>1) { noconn_drc_fail.push(noconn_pin_map[ind]) ; }
  }

  console.log("failing noconn drc:", noconn_drc_fail);
*/
