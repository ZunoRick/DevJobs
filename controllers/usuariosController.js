const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const multer = require('multer');
const shortid = require('shortid');
const { validationResult } = require('express-validator');
const { validarFormRegistro, formEditarPerfil } = require('./../helpers/funciones');

exports.subirImagen = (req, res, next) => {
	upload(req, res, function(error){
		if(error){
			// console.log(error);
			if(error instanceof multer.MulterError){
				if (error.code === 'LIMIT_FILE_SIZE') {
					req.flash('error', 'El archivo es muy grande: Máximo 100kb');
				} else {
					req.flash('error', error.MulterError);
				}
			} else{
				req.flash('error', error.message);
			}
			res.redirect('administracion');
			return;
		}else{
			return next();
		}
	});
}

//opciones de Multer
const configuracionMulter = {
	limits: { fileSize: 100000}, // 1000 kbytes
	storage: fileStorage = multer.diskStorage({
		destination: (req, file, cb) =>{
			cb(null, __dirname+'../../public/uploads/perfiles');
		},
		filename: (req, file, cb) => {
			// console.log(file);
			const extension = file.mimetype.split('/')[1];
			cb(null, `${shortid.generate()}.${extension}`);
		}
	}),
	fileFilter(req, file, cb){
		if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
			//el callback se ejecuta como true o false: true cuando la imagen se acepta
			cb(null, true);
		}else{
			cb(new Error('Formato No Válido'));
		}
	}
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
	res.render('crear-cuenta', {
		nombrePagina: 'Crea tu cuenta en devJobs',
		tagline:
			'Comienza a publicar tus vacantes gratis, sólo debes crear una cuenta.',
	});
};

exports.validarRegistro = async (req, res, next) => {
	//sanitizar los campos
	const rules = validarFormRegistro(req);

	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);
    
	//si hay errores
    // console.log(errores);
	if (!errores.isEmpty()) {
		req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('crear-cuenta', {
			nombrePagina: 'Crea una cuenta en Devjobs',
			tagline: 'Comienza a publicar tus vacantes gratis, solo debes crear una cuenta',
			mensajes: req.flash(),
		});
		return;
	}

	//si toda la validacion es correcta
	next();
};

exports.crearUsuario = async (req, res, next) => {
	// Crear usuario
	const usuario = new Usuarios(req.body);

	try {
		await usuario.save();
		res.redirect('/iniciar-sesion');
	} catch (error) {
		req.flash('error', error);
		res.redirect('/crear-cuenta');
	}
};

//formulario para iniciar sesión
exports.formIniciarSesion = (req, res) => {
	res.render('iniciar-sesion', {
		nombrePagina: 'Iniciar Sesión devJobs'
	});
}

exports.formEditarPerfil = async (req, res) =>{
	const usuario = await Usuarios.findOne({ email: req.user.email });
	res.render('editar-perfil', {
		nombrePagina: 'Edita tu Perfil de devJobs',
		usuario,
		cerrarSesion: true,
        nombre: req.user.nombre,
		imagen: req.user.imagen
	});
}

//Guardar cambios editar perfil
exports.editarPerfil = async (req, res) =>{
	const usuario = await Usuarios.findById(req.user._id);

	//sanitizar los campos
	const rules = formEditarPerfil();

	await Promise.all(rules.map((validation) => validation.run(req)));
	const errores = validationResult(req);
	if (!errores.isEmpty()) {
		req.flash(
			'error',
			errores.array().map((error) => error.msg)
		);
		res.render('editar-perfil', {
			nombrePagina: 'Edita tu Perfil de devJobs',
			usuario: req.user,
			cerrarSesion: true,
			nombre: req.user.nombre,
			mensajes: req.flash(),
			imagen: req.user.imagen
		});
		return;
	}

	usuario.nombre = req.body.nombre;
	usuario.email = req.body.email;

	if(req.body.password){
		usuario.password = req.body.password;
	}

	if(req.file){
		usuario.imagen = req.file.filename;
	}
	await usuario.save();

	req.flash('correcto', 'Cambios guardados Correctamente');
	res.redirect('/administracion');
}
