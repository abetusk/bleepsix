JSON Data Files
===============

`component_location.json`
------------------------

Mapping of utf-8 (schematic) component name (unencoded) to local location as URL encoded strings.  

For example, here is the "+12V" component entry:

    ...
    "+12V" : {
      "name" : "+12V",
      "location" : "eeschema/json/power/%2B12V.json"
    },
    ...


`library_list_default.json`
--------------------------

A heirarchical list of default component names and locations.  Each entry has an `id`, `name`, `data`, `type` and optional `list` field.  `type` can be one of "list" or "element", where "list" denotes a list of entries.  `id` and `name` should be the same.  `data` is the location of the data, URL encoded.

For example:

    [
      {
        "id": "74xgxx",
        "name": "74xgxx",
        "data": "eeschema/json/74xgxx",
        "type": "list",
        "list": [
          {
            "id": "74AUC1G74",
            "name": "74AUC1G74",
            "data": "eeschema/json/74xgxx/74AUC1G74.json",
            "type": "element"
          },

          ...

          {
            "id": "74LVC3G34",
            "name": "74LVC3G34",
            "data": "eeschema/json/74xgxx/74LVC3G34.json",
            "type": "element"
          }
        ]
      },

      ...

    ]


`footprint_location.json`
-------------------------

Mapping of utf-8 (board) footprint names (unencoded) to local location as URL encoded strings.  

For example, here is the "MSOP-10(EP)" module:

    "MSOP-10(EP)" : {
      "name" : "MSOP-10(EP)" ,
      "location" : "pcb/json/smd_ssop_packages/MSOP-10%2528EP%2529.json"
    },


`footprint_list_default.json`
----------------------------

A heirarchical list of default footprint names and locations.  Each entry has an `id`, `name`, `data`, `type` and optional `list` field.  `type` can be one of "list" or "element", where "list" denotes a list of entries.  `id` and `name` should be the same.  `data` is the location of the data, URL encoded.

For example:

    [
      {
        "id": "capacitors",
        "name": "capacitors",
        "data": "pcb/json/capacitors",
        "type": "list",
        "list": [
          {
            "id": "CPA_13x31MM",
            "name": "CPA_13x31MM",
            "data": "pcb/json/capacitors/CPA_13x31MM.json",
            "type": "element"
          },

          ...

          {
            "id": "cnp_7x6mm",
            "name": "cnp_7x6mm",
            "data": "pcb/json/capacitors/cnp_7x6mm.json",
            "type": "element"
          }
        ]
      },

      ...


    ]


