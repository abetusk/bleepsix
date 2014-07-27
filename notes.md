Notes
=====


Some general notes on ideas and how to implement them.


Custom Board Modules and Component Libraries
--------------------------------------------

It is critical that custom board modules and component
libraries are able to be imported into the system.  Without
this, users will hit a brick wall in development where the
lack of a single part will render the whole chain useless.

Initially an interface will be provided through the meowcad
website.  There will be a separate tab for module and library
upload.  The conversion will be a standalone program and
will accept either Eagle (v3+) or KiCAD (v2 only?) files.

The Eagle conversion needs to be a bit more fleshed out.  I think
the module conversion is simple enough but the component library 
conversion is not.  I think it's best to build off of 
[Eagle2Kicad](https://github.com/DanChianucci/Eagle2Kicad).  Eagle2Kicad
doesn't have schematic support yet, but the module conversion looks
to be working.

At the least KiCAD import support should be integrated.  Then, at least,
one can use existing KiCAD, Eagle to KiCAD or other conversion tools to
KiCAD to import custom libraries and modules.

Since this initial import will be outside of the main bleepsix interface,
this will only be available to bleepsix on reload.  Eventually we will
move to a message system where by the server will dynamically update
the library/module interface, but that seems like a large amount of complexity
initially.  We'll move there eventually, but for now we'll have to settle
for import on initial load.  Maybe as an intermediate step we'll have an
explicit 'reload' button on the library/module window.  We would also
like an upload feature in the bleepsix interface, something like an upload
button on the library/module window itself, but again, that can wait.

So, for the initial implementation we're going to load the library/module
at the beginning.  There will be a default library/module that will be
the existing library/module files we have now.  They'll be located in 
the `/var/www/` directory on the server.  There will be two other locations
to look in, one for a user wide library/module and the other for a 
project specific library/module.

The order is as follows:

  1. Global library/module set
  2. User library/module set
  3. Project library/module set

In this way users will be able to specify individual library/modules for
specific projects without polluting their global user project defaults.  The
global library/module will be used as a fall back.

Any library/module set specified with a higher number in the list will override
library/module sets with a lower number on the list.
This allows users to override a library/module for projects rather than use the
system wide default.

**NOTE: Initially only User library/module sets will be implemented.**

We'll get the the project specific overrides later, but the most important
feature right now is to have **some** facility to add in new library/module
sets.

All the complexity of this will be hidden from bleepsix by making a query to 
an intermediary library/module load python script that will handle the issues
itself and return a JSON location and list.  Subsequent library/module lookups
will also go through the intermediary script.

Locally to the server we'll try creating a 'shadow' directory structure where
users will have the library/module individual components laid out much like
they are for the default library/module sets.

Steps:

  1. Drop in replacement to get to functionality of what we have now
  2. Add dummy user override and make sure it appears in library/module list
  3. Upload facility in www.meowcad.com that does this automatically.

Some things to consider:

  - It would be nice to have libraries imported from not just the local filesystem
    (on upload) but from a GitHub/GitLab/Assembla/URL etc. location.
  - We would like a facility to view, download and potentially rate other library/module sets
    that other people provide (assuming they're public).
  - We might want to point to other library sets of other users.  This could be useful
    to have a 'community' library set that keeps updating with the latest (also has
    potential pitfalls as your schematic/PCB will change out from underneath you).

Speaking to the second issue, this gets back to the issue of social schematics and boards.
This is still a feature of the system that's not clear (in my mind) and needs to be addressed
at some point.


