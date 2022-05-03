const { networkInterfaces } = require('os');
const nets = networkInterfaces();
var os = require('os');
//  console.log(nets);

let HOST = "208.109.189.233";
let PASSWORD = "$rRPB231281$";
let USER =  "cpadmin";
let BD = "cpadmin_rle_red";



//console.log (HOST);
module.exports ={ 
    database:{
        //host: '18.228.215.203',
        host: HOST,
        user: USER,
        //password: 'NRle.2019$TI*.', /*contaseña*/
        password:PASSWORD,
        database: BD /*nombre de la db*/
    }
};