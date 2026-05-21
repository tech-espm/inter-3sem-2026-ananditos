const express = require("express");
const wrap = require("express-async-error-wrapper");
const axios = require("axios");
const router = express.Router();
const sql = require("../data/sql");

const url_api = process.env.url_api;

router.get("/", wrap(async (req, res) => {
	
	
	await sql.connect(async sql => {
		let lista = await sql.query("select max(id) id from passagem");

		let id_inferior = 92107;
		if (lista[0].id) {
			id_inferior = lista[0].id;
		}

		const response = await axios.get(url_api + "?sensor=passage&id_inferior=" + id_inferior);
		const dadosNovos = response.data;

		for (let i = 0; i < dadosNovos.length; i++) {
			const dadoNovo = dadosNovos[i];

			await sql.query("insert into passagem (id, data, id_sensor, delta, bateria, entrada, saida) values (?, ?, ?, ?, ?, ?, ?)", [dadoNovo.id, dadoNovo.data, dadoNovo.id_sensor, dadoNovo.delta, dadoNovo.bateria, dadoNovo.entrada, dadoNovo.saida]);
		}
	});

	let nomeDoUsuarioQueVeioDoBanco = "Rafael";

	let opcoes = {
		usuario: nomeDoUsuarioQueVeioDoBanco,
		quantidadeDeRepeticoes: 5
	};

	res.render("index/principal", opcoes);
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

// Rota para os gráficos

router.get("/dashboard/dados", wrap(async (req, res) => {
	let periodo = req.query.periodo || "hoje";
	let periodoVariabilidade = req.query.periodoVariabilidade || "atual";
	let periodoEntradasSaidas = req.query.periodoEntradasSaidas || "hoje";
	let periodoOcupacao = req.query.periodoOcupacao || "hoje";
	let periodoSetor = req.query.periodoSetor || "hoje";

	// Fluxo por hora
	let filtroFluxoPorHora = "date(data) = curdate()";

	if (periodo === "semana") {
		filtroFluxoPorHora = "yearweek(data, 1) = yearweek(curdate(), 1)";
	} else if (periodo === "mes") {
		filtroFluxoPorHora = "month(data) = month(curdate()) and year(data) = year(curdate())";
	}

	// Variabilidade semanal
	let filtroVariabilidadeSemanal = "yearweek(data, 1) = yearweek(curdate(), 1)";

	if (periodoVariabilidade === "anterior") {
		filtroVariabilidadeSemanal = "yearweek(data, 1) = yearweek(date_sub(curdate(), interval 7 day), 1)";
	} else if (periodoVariabilidade === "mes") {
		filtroVariabilidadeSemanal = "month(data) = month(curdate()) and year(data) = year(curdate())";
	}

	// Comparativo de entradas e saídas
	let filtroEntradasSaidas = "date(data) = curdate()";

	if (periodoEntradasSaidas === "semana") {
		filtroEntradasSaidas = "yearweek(data, 1) = yearweek(curdate(), 1)";
	} else if (periodoEntradasSaidas === "mes") {
		filtroEntradasSaidas = "month(data) = month(curdate()) and year(data) = year(curdate())";
	}

	// Ocupação por setor
	let filtroOcupacaoSetor = "date(p.data) = curdate()";

	if (periodoSetor === "semana") {
		filtroOcupacaoSetor = "yearweek(p.data, 1) = yearweek(curdate(), 1)";
	} else if (periodoSetor === "mes") {
		filtroOcupacaoSetor = "month(p.data) = month(curdate()) and year(p.data) = year(curdate())";
	}

	let dados = await sql.connect(async sql => {
		let fluxoPorHora = await sql.query(`
			select 
				hour(data) hora,
				sum(entrada) entradas,
				sum(saida) saidas
			from passagem
			where ${filtroFluxoPorHora} and id < 900000
			group by hour(data)
			order by hour(data)
		`);

		let variabilidadeSemanal = await sql.query(`
			select
				weekday(data) dia_semana,
				case weekday(data)
					when 0 then 'Seg'
					when 1 then 'Ter'
					when 2 then 'Qua'
					when 3 then 'Qui'
					when 4 then 'Sex'
					when 5 then 'Sab'
					when 6 then 'Dom'
				end dia,
				min(ocupacao) minimo,
				avg(ocupacao) media,
				max(ocupacao) maximo
			from (
				select
					dados.data,
					@ocupacao := greatest(@ocupacao + dados.entrada - dados.saida, 0) ocupacao
				from (
					select
						data,
						entrada,
						saida
					from passagem
					where ${filtroVariabilidadeSemanal} and id < 900000
					order by data, id
				) dados
				cross join (select @ocupacao := 0) variavel
			) ocupacao_por_registro
			where weekday(data) between 0 and 6
			group by weekday(data), dia
			order by weekday(data)
		`);

		let entradasSaidasPorDia = await sql.query(`
			select
				weekday(data) dia_semana,
				case weekday(data)
					when 0 then 'Seg'
					when 1 then 'Ter'
					when 2 then 'Qua'
					when 3 then 'Qui'
					when 4 then 'Sex'
					when 5 then 'Sáb'
					when 6 then 'Dom'
				end dia,
				sum(entrada) entradas,
				sum(saida) saidas
			from passagem
			where ${filtroEntradasSaidas} and id < 900000
			group by weekday(data), dia
			order by weekday(data)
		`);

		let ocupacaoAoLongoDoDia;

		if (periodoOcupacao === "semana") {
			ocupacaoAoLongoDoDia = await sql.query(`
				select
					date_format(data, '%H:00') horario,
					avg(ocupacao) ocupacao
				from (
					select
						dados.data,
						@ocupacao := greatest(@ocupacao + dados.entrada - dados.saida, 0) ocupacao
					from (
						select
							data,
							entrada,
							saida
						from passagem
						where yearweek(data, 1) = yearweek(curdate(), 1) and id < 900000
						order by data, id
					) dados
					cross join (select @ocupacao := 0) variavel
				) ocupacao_por_registro
				group by date_format(data, '%H:00')
				order by date_format(data, '%H:00')
			`);
		} else if (periodoOcupacao === "30min") {
			ocupacaoAoLongoDoDia = await sql.query(`
				select
					date_format(data, '%H:%i') horario,
					ocupacao
				from (
					select
						dados.data,
						@ocupacao := greatest(@ocupacao + dados.entrada - dados.saida, 0) ocupacao
					from (
						select
							data,
							entrada,
							saida
						from passagem
						where date(data) = curdate() and id < 900000
						order by data, id
					) dados
					cross join (select @ocupacao := 0) variavel
				) ocupacao_por_registro
				where data >= date_sub(now(), interval 30 minute)
				order by data
			`);
		} else {
			ocupacaoAoLongoDoDia = await sql.query(`
				select
					date_format(data, '%H:%i') horario,
					ocupacao
				from (
					select
						dados.data,
						@ocupacao := greatest(@ocupacao + dados.entrada - dados.saida, 0) ocupacao
					from (
						select
							data,
							entrada,
							saida
						from passagem
						where date(data) = curdate() and id < 900000
						order by data, id
					) dados
					cross join (select @ocupacao := 0) variavel
				) ocupacao_por_registro
				order by data
			`);
		}

		let ocupacaoPorSetor = await sql.query(`
			select
				s.setor,
				coalesce(greatest(sum(p.entrada) - sum(p.saida), 0), 0) ocupacao
			from sensor_setor s
			left join passagem p 
				on p.id_sensor = s.id_sensor
				and ${filtroOcupacaoSetor}
			where s.ativo = 1
			group by s.setor
			order by s.setor
		`);

		return {
			fluxoPorHora,
			variabilidadeSemanal,
			entradasSaidasPorDia,
			ocupacaoAoLongoDoDia,
			ocupacaoPorSetor
		};
	});

	res.json(dados);
}));

module.exports = router;
