const express = require("express");
const wrap = require("express-async-error-wrapper");

const router = express.Router();

router.get("/", wrap(async (req, res) => {
	let nomeDoUsuarioQueVeioDoBanco = "Rafael";

	let opcoes = {
		usuario: nomeDoUsuarioQueVeioDoBanco,
		quantidadeDeRepeticoes: 5
	};

	res.render("index/index", opcoes);
}));

router.get("/teste", wrap(async (req, res) => {
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste", opcoes);
}));

router.get("/teste2", wrap(async (req, res) => {
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste2", opcoes);
}));

router.get("/teste3", wrap(async (req, res) => {
	let opcoes = {
		layout: "casca-teste"
	};

	res.render("index/teste3", opcoes);
}));

router.get("/produtos", wrap(async (req, res) => {
	let produtoA = {
		id: 1,
		nome: "Produto A",
		valor: 25
	};

	let produtoB = {
		id: 2,
		nome: "Produto B",
		valor: 15
	};

	let produtoC = {
		id: 3,
		nome: "Produto C",
		valor: 100
	};

	let produtosVindosDoBanco = [ produtoA, produtoB, produtoC ];

	let opcoes = {
		titulo: "Listagem de Produtos",
		produtos: produtosVindosDoBanco
	};

	res.render("index/produtos", opcoes);
}));

module.exports = router;
