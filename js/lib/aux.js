/*
 * from the accepted (as of 2013-12-21) answer from user John Millikin
 * http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/105074#105074
 *
 */

function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
};

function guid() {
    return s4() + s4() + '-' + 
           s4() + '-' + 
           s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
}
