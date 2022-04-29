const { networkInterfaces } = require('os');
const nets = networkInterfaces();

//console.log(nets);

// IP SERVIDOR
let SERVER_1 = "18.228.215.203"; // server  AWS
let SERVER_2 = "208.109.189.233"; // server GODADDY

let HOST = "";
let PASSWORD = "";
let USER = "";
let BD = "";

let server = 0;

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            //console.log(net.address);
            if (net.address == SERVER_1)
            {
                server = 1;
            }
            else if (net.address == SERVER_2)
            {
                server = 1;
            }
        }
    }
}
switch(server)
{
    case 0:
        HOST = "127.0.0.1";
        PASSWORD = "12.RL$";
        USER = "root";
        BD = "rle_red";
    break;
    case 1:
        HOST = "18.228.215.203";
        PASSWORD = "NRle.2019$TI*.";
        USER = "root";
        BD = "rle_red";
    break;
    case 2:
        HOST = "208.109.189.233";
        PASSWORD = "$rRPB231281$";
        USER = "cpadmin";
        BD = "cpadmin_rle_red";
    break;

}

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