/* ─── FADE-IN OBSERVER ─── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

/* ─── TOGGLE BUTTONS ─── */
document.querySelectorAll('.chart-toggle').forEach(group => {
  group.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});

/* ─── CHART.JS DEFAULTS ─── */
Chart.defaults.color = '#7a8799';
Chart.defaults.font.family = "'Space Grotesk', sans-serif";
Chart.defaults.font.size = 11;

const CYAN = '#00e5c3';
const PURPLE = '#a78bfa';
const BLUE = '#60a5fa';

// Funções para os gráficos
async function carregarDadosDashboard(periodo = "hoje", 
	periodoVariabilidade = "atual", 
	periodoEntradasSaidas = "hoje",
	periodoOcupacao = "hoje",
	periodoSetor = "hoje") {
	const resposta = await fetch(`/dashboard/dados?periodo=${periodo}&periodoVariabilidade=${periodoVariabilidade}&periodoEntradasSaidas=${periodoEntradasSaidas}&periodoOcupacao=${periodoOcupacao}&periodoSetor=${periodoSetor}`);
	const dados = await resposta.json();

	return dados;
}

let graficoFluxoPorHora = null;

async function criarGraficoFluxoPorHora(periodo = "hoje") {
	const dados = await carregarDadosDashboard(periodo);

	const horas = [];

  for (let h = 0; h <= 23; h++) {
    horas.push(h);
  }

  const labels = horas.map(hora => `${hora}h`);

  const valores = horas.map(hora => {
    const item = dados.fluxoPorHora.find(item => Number(item.hora) === hora);

    if (!item) {
      return 0;
    }

    return Number(item.entradas) + Number(item.saidas);
  });

  if (graficoFluxoPorHora) {
		graficoFluxoPorHora.destroy();
	}

	graficoFluxoPorHora = new Chart(document.getElementById("chart1"), {
		type: "bar",
		data: {
			labels: labels,
			datasets: [{
				label: "Fluxo por hora",
				data: valores,
				backgroundColor: "rgba(0,229,195,0.45)",
				borderRadius: 5,
				borderSkipped: false
			}]
		},
		options: {
			plugins: {
				legend: {
					display: false
				}
			},
			scales: {
				x: {
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				},
				y: {
					beginAtZero: true,
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				}
			}
		}
	});
}
document.querySelectorAll("#filtro-fluxo-hora .toggle-btn").forEach(btn => {
	btn.addEventListener("click", async () => {
		const periodo = btn.dataset.periodo;

		document.querySelectorAll("#filtro-fluxo-hora .toggle-btn").forEach(b => {
			b.classList.remove("active");
		});

		btn.classList.add("active");

		await criarGraficoFluxoPorHora(periodo);
	});
});

let graficoVariabilidadeSemanal = null;
async function criarGraficoVariabilidadeSemanal(periodoVariabilidade = "atual") {
	const dados = await carregarDadosDashboard("hoje", periodoVariabilidade);

	const diasDaSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const labels = diasDaSemana;

  const valoresMinimos = diasDaSemana.map(dia => {
    const item = dados.variabilidadeSemanal.find(item => item.dia === dia);
    return item ? Number(item.minimo) : 0;
  });

  const valoresMedios = diasDaSemana.map(dia => {
    const item = dados.variabilidadeSemanal.find(item => item.dia === dia);
    return item ? Number(item.media) : 0;
  });

  const valoresMaximos = diasDaSemana.map(dia => {
    const item = dados.variabilidadeSemanal.find(item => item.dia === dia);
    return item ? Number(item.maximo) : 0;
  });

  if (graficoVariabilidadeSemanal) {
		graficoVariabilidadeSemanal.destroy();
	}

	graficoVariabilidadeSemanal = new Chart(document.getElementById("chart2"), {
		type: "bar",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Mínimo",
					data: valoresMinimos,
					backgroundColor: "rgba(0,229,195,0.25)",
					borderRadius: 4
				},
				{
					label: "Médio",
					data: valoresMedios,
					backgroundColor: "rgba(0,229,195,0.5)",
					borderRadius: 4
				},
				{
					label: "Máximo",
					data: valoresMaximos,
					backgroundColor: "#00e5c3",
					borderRadius: 4
				}
			]
		},
		options: {
			plugins: {
				legend: {
					position: "top",
					labels: {
						boxWidth: 10,
						padding: 14
					}
				}
			},
			scales: {
				x: {
					stacked: false,
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				},
				y: {
					beginAtZero: true,
					stacked: false,
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				}
			}
		}
	});
}
document.querySelectorAll("#filtro-variabilidade-semanal .toggle-btn").forEach(btn => {
	btn.addEventListener("click", async () => {
		const periodoVariabilidade = btn.dataset.periodoVariabilidade;

		document.querySelectorAll("#filtro-variabilidade-semanal .toggle-btn").forEach(b => {
			b.classList.remove("active");
		});

		btn.classList.add("active");

		await criarGraficoVariabilidadeSemanal(periodoVariabilidade);
	});
});

let graficoEntradasSaidas = null;
async function criarGraficoEntradasSaidasPorDia(periodoEntradasSaidas = "hoje") {
	const dados = await carregarDadosDashboard("hoje", "atual", periodoEntradasSaidas);

	const diasDaSemana = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const labels = diasDaSemana;

  const entradas = diasDaSemana.map(dia => {
    const item = dados.entradasSaidasPorDia.find(item => item.dia === dia);
    return item ? Number(item.entradas) : 0;
  });

  const saidas = diasDaSemana.map(dia => {
    const item = dados.entradasSaidasPorDia.find(item => item.dia === dia);
    return item ? Number(item.saidas) : 0;
  });

  if (graficoEntradasSaidas) {
		graficoEntradasSaidas.destroy();
	}

	graficoEntradasSaidas = new Chart(document.getElementById("chart3"), {
		type: "bar",
		data: {
			labels: labels,
			datasets: [
				{
					label: "Entradas",
					data: entradas,
					backgroundColor: CYAN,
					borderRadius: 4
				},
				{
					label: "Saídas",
					data: saidas,
					backgroundColor: PURPLE,
					borderRadius: 4
				}
			]
		},
		options: {
			plugins: {
				legend: {
					position: "top",
					labels: {
						boxWidth: 10,
						padding: 14
					}
				}
			},
			scales: {
				x: {
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				},
				y: {
					beginAtZero: true,
					grid: {
						color: "rgba(255,255,255,0.04)"
					}
				}
			}
		}
	});
}
document.querySelectorAll("#filtro-entradas-saidas .toggle-btn").forEach(btn => {
	btn.addEventListener("click", async () => {
		const periodoEntradasSaidas = btn.dataset.periodoEntradasSaidas;

		document.querySelectorAll("#filtro-entradas-saidas .toggle-btn").forEach(b => {
			b.classList.remove("active");
		});

		btn.classList.add("active");

		await criarGraficoEntradasSaidasPorDia(periodoEntradasSaidas);
	});
});

let graficoOcupacaoDia = null;
async function criarGraficoOcupacaoAoLongoDoDia(periodoOcupacao = "hoje") {
	const dados = await carregarDadosDashboard("hoje", "atual", "hoje", periodoOcupacao);

	const labels = dados.ocupacaoAoLongoDoDia.map(item => item.horario);
	const valores = dados.ocupacaoAoLongoDoDia.map(item => Number(item.ocupacao));

	if (graficoOcupacaoDia) {
		graficoOcupacaoDia.destroy();
	}

	graficoOcupacaoDia = new Chart(document.getElementById("chart5"), {
		type: "line",
		data: {
			labels: labels,
			datasets: [{
				label: "Ocupação",
				data: valores,
				borderColor: CYAN,
				borderWidth: 2,
				pointRadius: 0,
				pointHoverRadius: 5,
				tension: 0.4,
				fill: true,
				backgroundColor: (ctx) => {
					const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
					g.addColorStop(0, "rgba(0,229,195,0.18)");
					g.addColorStop(1, "rgba(0,229,195,0)");
					return g;
				}
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					display: false
				}
			},
			scales: {
				x: {
					grid: { color: "rgba(255,255,255,0.04)" },
					ticks: { maxTicksLimit: 12 }
				},
				y: {
					beginAtZero: true,
					grid: { color: "rgba(255,255,255,0.04)" }
				}
			}
		}
	});
}
document.querySelectorAll("#filtro-ocupacao .toggle-btn").forEach(btn => {
	btn.addEventListener("click", async () => {
		const periodoOcupacao = btn.dataset.periodoOcupacao;

		document.querySelectorAll("#filtro-ocupacao .toggle-btn").forEach(b => {
			b.classList.remove("active");
		});

		btn.classList.add("active");

		await criarGraficoOcupacaoAoLongoDoDia(periodoOcupacao);
	});
});

let graficoOcupacaoPorSetor = null;
async function criarGraficoOcupacaoPorSetor(periodoSetor = "hoje") {
	const dados = await carregarDadosDashboard("hoje", "atual", "hoje", "hoje", periodoSetor);

	const labels = dados.ocupacaoPorSetor.map(item => item.setor);
	const valores = dados.ocupacaoPorSetor.map(item => Number(item.ocupacao));

	if (graficoOcupacaoPorSetor) {
		graficoOcupacaoPorSetor.destroy();
	}

	graficoOcupacaoPorSetor = new Chart(document.getElementById("chart4"), {
		type: "doughnut",
		data: {
			labels: labels,
			datasets: [{
				data: valores,
				backgroundColor: [CYAN, PURPLE, BLUE, "#f59e0b", "rgba(255,255,255,0.15)"],
				borderColor: "#0c0f14",
				borderWidth: 3,
				hoverOffset: 10
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: "right",
					labels: {
						boxWidth: 10,
						padding: 12,
						font: {
							size: 11
						}
					}
				}
			},
			cutout: "65%"
		}
	});
}
document.querySelectorAll("#filtro-ocupacao-setor .toggle-btn").forEach(btn => {
	btn.addEventListener("click", async () => {
		const periodoSetor = btn.dataset.periodoSetor;

		document.querySelectorAll("#filtro-ocupacao-setor .toggle-btn").forEach(b => {
			b.classList.remove("active");
		});

		btn.classList.add("active");

		await criarGraficoOcupacaoPorSetor(periodoSetor);
	});
});



/* ─── CHART 1: Bar - Fluxo por Hora ─── 
new Chart(document.getElementById('chart1'), {
  type: 'bar',
  data: {
    labels: ['06h','07h','08h','09h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h','22h'],
    datasets: [{
      data: [80,210,380,460,300,270,350,390,310,280,320,460,420,290,200,140,70],
      backgroundColor: (ctx) => {
        const v = ctx.parsed.y;
        if (v > 400) return '#ff6b6b';
        if (v > 320) return CYAN;
        return 'rgba(0,229,195,0.45)';
      },
      borderRadius: 5,
      borderSkipped: false,
    }]
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxRotation: 0 } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  }
});*/

/* ─── CHART 2: Stacked Bar - Variabilidade Semanal ─── 
new Chart(document.getElementById('chart2'), {
  type: 'bar',
  data: {
    labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
    datasets: [
      { label: 'Mín', data: [120,90,100,80,110,60,40], backgroundColor: 'rgba(0,229,195,0.25)', borderRadius: 4 },
      { label: 'Méd', data: [200,220,180,210,250,130,90], backgroundColor: 'rgba(0,229,195,0.5)', borderRadius: 4 },
      { label: 'Máx', data: [480,510,430,500,560,280,180], backgroundColor: CYAN, borderRadius: 4 }
    ]
  },
  options: {
    plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 14 } } },
    scales: {
      x: { stacked: false, grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { stacked: false, grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  }
});*/

/* ─── CHART 3: Grouped Bar - Entradas vs Saídas ─── 
new Chart(document.getElementById('chart3'), {
  type: 'bar',
  data: {
    labels: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
    datasets: [
      { label: 'Entradas', data: [520,480,510,600,580,310,190], backgroundColor: CYAN, borderRadius: 4 },
      { label: 'Saídas',   data: [510,470,495,590,570,300,185], backgroundColor: PURPLE, borderRadius: 4 }
    ]
  },
  options: {
    plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 14 } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' } }
    }
  }
});*/

/* ─── CHART 4: Doughnut - Ocupação por Setor ─── 
new Chart(document.getElementById('chart4'), {
  type: 'doughnut',
  data: {
    labels: ['Estação Central','Shopping Norte','Terminal Leste','Arena Sul','Outros'],
    datasets: [{
      data: [35, 25, 20, 12, 8],
      backgroundColor: [CYAN, PURPLE, BLUE, '#f59e0b', 'rgba(255,255,255,0.15)'],
      borderColor: '#0c0f14',
      borderWidth: 3,
      hoverOffset: 10
    }]
  },
  options: {
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, padding: 12, font: { size: 11 } } }
    },
    cutout: '65%'
  }
});*/

/* ─── CHART 5: Line - Tendência Real ─── 
const labels5 = [];
const data5 = [];
for (let h = 6; h <= 23; h++) {
  ['00','15','30','45'].forEach(m => {
    labels5.push(`${String(h).padStart(2,'0')}:${m}`);
    const base = Math.sin((h - 6) / 17 * Math.PI) * 300 + 80;
    data5.push(Math.round(base + (Math.random() - 0.5) * 60));
  });
}
new Chart(document.getElementById('chart5'), {
  type: 'line',
  data: {
    labels: labels5,
    datasets: [{
      data: data5,
      borderColor: CYAN,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 5,
      tension: 0.4,
      fill: true,
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
        g.addColorStop(0, 'rgba(0,229,195,0.18)');
        g.addColorStop(1, 'rgba(0,229,195,0)');
        return g;
      }
    }]
  },
  options: {
    responsive: true,
	  maintainAspectRatio: false,
	  plugins: {
		legend: {
			display: false,
			labels: {
				boxWidth: 10,
				padding: 12,
				font: { size: 11 }
			}
		}
	},
	cutout: '65%'
  }
});*/

// Chamada das funções para os gráficos 
criarGraficoFluxoPorHora("hoje");
criarGraficoVariabilidadeSemanal("atual");
criarGraficoEntradasSaidasPorDia("hoje");
criarGraficoOcupacaoAoLongoDoDia("hoje");
criarGraficoOcupacaoPorSetor("hoje");