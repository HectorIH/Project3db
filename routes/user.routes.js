const router = require("express").Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const Link = require("../models/Link");

const User = require("../models/User");

// REST => REpresentational State Transfer

// HTTP é stateless

// RESTful é uma API que segue todas as regras do REST

router.post("/signup", async (req, res) => {
  // 1. Extrair o email, nome e senha do usuario do corpo da requisição

  const { name, email, password } = req.body;

  // 2. Validar o email e a senha

  const errors = {};
  // Validacao de nome de usuario: é obrigatório, tem que ser do tipo string e não pode ter mais de 50 caracteres
  if (!name || typeof name !== "string" || name.length > 50) {
    errors.name = "Username is required and should be 50 characters max.";
  }

  // Tem que ser um email valido, é obrigatório
  if (!email || !email.match(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/)) {
    errors.email = "Email is required and should be a valid email address";
  }

  // Senha é obrigatória, precisa ter no mínimo 8 caracteres, precisa ter letras maiúsculas, minúsculas, números e caracteres especiais
  if (
    !password ||
    !password.match(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/
    )
  ) {
    errors.password =
      "Password is required, should be at least 8 characters long, should contain an uppercase letter, lowercase letter, a number and a special character";
  }

  // Se o objeto errors tiver propriedades (chaves), retorne as mensagens de erro
  if (Object.keys(errors).length) {
    console.error(errors);
    return res.status(400).json({ errors });
  }

  // 3. Criptografar a senha
  try {
    // Gerar o salt

    const saltRounds = 10;

    const salt = await bcrypt.genSalt(saltRounds);

    // "Embaralhar" a senha enviada pelo usuário antes de salvar no banco
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Salvar o email e a senha criptografada no banco
    const result = await User.create({ email, name, passwordHash });

    console.log(result);

    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    // Mensagem de erro para exibir erros de validacao do Schema do Mongoose
    if (err instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ error: err.message });
    } else if (err.code === 11000) {
      res.status(400).json({
        error:
          "Name and email need to be unique. Either username or email is already used.",
      });
    }
  }
});

// Next é uma função que passa algum valor para o próximo handler de rotas (do Express) da cadeia de handlers
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    // O objeto err só existe em caso de erro na comunicação com o Mongo
    if (err) {
      return res.status(500).json({ msg: err });
    }

    // Caso este email não esteja cadastrado ou a senha esteja divergente
    if (!user || info) {
      return res.status(401).json({ msg: info.message });
    }

    req.login(user, { session: false }, (err) => {
      if (err) {
        console.error(err);
        return next(err);
      }

      const { name, email, _id } = user;
      const userObj = { name, email, _id };
      const token = jwt.sign({ user: userObj }, process.env.TOKEN_SIGN_SECRET);

      return res.status(200).json({ user: userObj, token });
    });
  })(req, res, next);
});

router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      console.log("req", req.user);

      const result = await User.findOne({ _id: req.user._id });
      // console.log("result profile", result)
      res
        .status(200)
        .json({ message: "This is a protected route", user: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: err });
    }
  }
);

router.patch(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      console.log("req", req.user);
      const result = await User.findOneAndUpdate(
        { _id: req.user._id },
        req.body
      );
      res
        .status(200)
        .json({ message: "This is a protected route", user: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ msg: err });
    }
  }
);

//ROTA BACK END PARA CRIAR LINK ÚTEIS NO DB

router.post("/linkcreate", async (req, res) => {
  console.log(req.body);
  const registrarDB = await Link.create({
    link: req.body.link,
    url: req.body.url,
    description: req.body.description,
  });
  res.json({ name: "criou com sucesso" });
  console.log(registrarDB);
});

//ROTA BACK END PARA PUXAR LINK ÚTEIS NO DB

router.get("/linksall", async (req, res) => {
  const pegaAllLinks = await Link.find();
  res.json({ pegaAllLinks });
});

// FINISH

router.get("/allusers", async (req, res) => {
  const pegaAllUsersDB = await User.find();
  res.json({ pegaAllUsersDB });
});

// router.delete("/deletelink/:id", async (req, res) => {
//   console.log(req.params.id);

//   const deleteDBOne = await Link.deleteOne({ link: req.params.id });
// });

router.delete("/deletelink/:QUALQUERCOISA", async (req, res) => {
  console.log(req);
  console.log(req.params.QUALQUERCOISA);

  const ProcurarEDeletarnoBanco = await Link.deleteOne({
    link: req.params.QUALQUERCOISA,
  });
  res.json({ name: "deletado com sucesso" });
});

router.get("/perfil/:qualquercoisa", async (req, res) => {
  console.log(req.params.qualquercoisa);

  const PegarPerfilDinamicoBanco = await User.findOne({
    name: req.params.qualquercoisa,
  });

  console.log(PegarPerfilDinamicoBanco)
  res.json({PegarPerfilDinamicoBanco})
  // res.json({"O QUE VIER DO BANCO"})
});

module.exports = router;
