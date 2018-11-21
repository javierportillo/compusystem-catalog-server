const mysql = require('mysql')

const conexion = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    user: 'javier',
    password: 'javier',
    database: '2018ntpproyecto',
})

conexion.on('connection', () => {
    console.log('************************')
    console.log('Conexion exitosa a MySQL BD Call Center')
    console.log('************************')
})

function query(sentencia, campos) {
    return new Promise((resolve, reject) => {
        conexion.query(sentencia, campos, (error, results) => {
            if (error) {
                reject(error)
                return
            }
            resolve(results)
        })
    })
}

module.exports = {
    query,
}
