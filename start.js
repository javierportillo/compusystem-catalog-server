const fs = require('fs');
const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const { query } = require('./mysql')

const app = express()
const api = express.Router()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/api', api)

api.post('/producto', async (req, res) => {
	const results = await query('INSERT INTO producto (nombre, descripcion, precio, estado) VALUES (?, ?, ?, ?)', [
		req.body.nombre,
		req.body.descripcion,
		req.body.precio,
		req.body.estado,
	])
	res.json({ success: true, id: results.insertId })
})

function extension(name) {
	const found = /(?:\.([^.]+))?$/.exec(name)[1]
	return found ? `.${found}` : ''
}

const upload = multer({ dest: 'public/img/' })
api.post('/producto/:id/foto', upload.array('foto', 4), async (req, res) => {
	const names = []
	for(const file of req.files) {
		const ext = extension(file.originalname)
		names.push(file.filename + ext)
		fs.rename(file.path, file.path + ext, () => {})
	}
	await query('UPDATE producto SET foto = ? WHERE id = ?', [
		JSON.stringify(names),
		req.params.id,
	])
	res.json({ success: true, fotos: names })
})

api.get('/producto', async (req, res) => {
	const productos = await query('SELECT * FROM producto LIMIT 10')
	res.json(productos.map((p) => {
		p.foto = JSON.parse(p.foto)
		return p
	}))
})

api.get('/producto/search', async (req, res) => {
	if (!req.query.name) { return res.json({ success: false }) }
	const productos = await query('SELECT * FROM producto WHERE MATCH(nombre) AGAINST(?)', [
		req.query.name,
	])
	res.json(productos.map((p) => {
		p.foto = JSON.parse(p.foto)
		return p
	}))
})

api.get('/producto/:id', async (req, res) => {
	const [producto] = await query('SELECT * FROM producto WHERE id = ? LIMIT 1', [
		req.params.id,
	])
	producto.foto = JSON.parse(producto.foto)
	res.json(producto)
})

api.delete('/producto/:id', async (req, res) => {
	const [producto] = await query('SELECT foto FROM producto WHERE id = ?', [
		req.params.id,
	])
	if (!producto) { return }
	const fotos = JSON.parse(producto.foto)
	for (const foto of fotos) {
		fs.unlink(`./public/img/${foto}`, () => {})
	}
	await query('DELETE FROM producto WHERE id = ?', [
		req.params.id,
	])
	res.json({ success: true })
})

api.get('/contacto', async (req, res) => {
	const [contacto] = await query('SELECT telefono, facebook, twitter, correo FROM configuracion LIMIT 1')
	if (!contacto) {
		await query('INSERT INTO configuracion (telefono, facebook, twitter, correo) VALUES ("", "", "", "")')
		res.json({
			telefono: '',
			facebook: '',
			twitter: '',
			correo: '',
		})
	}
	res.json(contacto)
})

api.post('/contacto', async (req, res) => {
	await query('UPDATE configuracion SET ?', {
		telefono: req.body.telefono || null,
		facebook: req.body.facebook || null,
		twitter : req.body.twitter || null,
		correo: req.body.correo || null,
	})
	res.json({ success: true })
})

const PORT = 9100

app.listen(PORT, () => console.log(`Escuchando en el puerto ${PORT}`))
