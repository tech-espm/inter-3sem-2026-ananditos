CREATE DATABASE IF NOT EXISTS ananditos DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_general_ci;

USE ananditos;

-- topic v3/espm/devices/passage01/up
-- topic v3/espm/devices/passage02/up
-- { "end_device_ids": { "device_id": "passage01" }, "uplink_message": { "rx_metadata": [{ "timestamp": 2040934975 }], "decoded_payload": { "battery": 0, "period_in": 0, "period_out": 0 } } }
CREATE TABLE passagem (
  id bigint NOT NULL AUTO_INCREMENT,
  data datetime NOT NULL,
  id_sensor tinyint NOT NULL,
  delta int NOT NULL,
  bateria tinyint NOT NULL,
  entrada int NOT NULL,
  saida int NOT NULL,
  PRIMARY KEY (id),
  KEY passagem_data_id_sensor (data, id_sensor),
  KEY passagem_id_sensor (id_sensor)
);


-- ==============================================================7
-- =============================================================
-- TABELAS AUXILIARES DE CONFIGURAÇÃO
-- =============================================================

-- Tabela de sensores: metadados e capacidade máxima por local
CREATE TABLE sensor (
  id            tinyint      NOT NULL AUTO_INCREMENT,
  device_id     varchar(50)  NOT NULL,          -- ex: 'passage01'
  descricao     varchar(100) NOT NULL,          -- ex: 'Entrada Principal - CPTM Lapa'
  localizacao   varchar(100) DEFAULT NULL,      -- ex: 'Plataforma A'
  capacidade    smallint     NOT NULL DEFAULT 100, -- ocupação máxima permitida
  ativo         tinyint(1)   NOT NULL DEFAULT 1,
  criado_em     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY sensor_device_id (device_id)
);

-- Inserção dos dois sensores já existentes no projeto
INSERT INTO sensor (device_id, descricao, localizacao, capacidade) VALUES
  ('passage01', 'Sensor Passagem 01', 'Entrada Principal', 200),
  ('passage02', 'Sensor Passagem 02', 'Entrada Secundária', 200);

-- Tabela de configurações gerais do sistema (chave-valor)
CREATE TABLE configuracao (
  chave     varchar(50)  NOT NULL,
  valor     varchar(200) NOT NULL,
  descricao varchar(200) DEFAULT NULL,
  PRIMARY KEY (chave)
);

INSERT INTO configuracao (chave, valor, descricao) VALUES
  ('alerta_ocupacao_amarelo', '80',  'Percentual de ocupação para alerta amarelo (atenção)'),
  ('alerta_ocupacao_vermelho', '90', 'Percentual de ocupação para alerta vermelho (crítico)'),
  ('janela_tempo_real_minutos', '60', 'Janela de tempo considerada para visão ao vivo (em minutos)');


-- Query de consolidação por dia da semana (1 = domingo, 2 = segunda...) e por hora, para o heatmap com 7 colunas e 24 linhas
select dayofweek(data) dia_semana, extract(hour from data) hora, sum(entrada) fluxo_total
from passagem
where data between '2025-03-03 00:00:00' and '2025-03-14 23:59:59'
and id_sensor = 2
group by dia_semana, hora;

-- Query de consolidação por dia do mês e por hora, para o heatmap de visão explodida por dia da semana com N colunas e 24 linhas
select date_format(date(data), '%d/%m/%Y') dia, extract(hour from data) hora, sum(entrada) fluxo_total
from passagem
where data between '2025-03-03 00:00:00' and '2025-03-14 23:59:59'
and id_sensor = 2
group by dia, hora;

-- Query de consolidação de pessoas presentes no espaço por dia do mês e por hora, para o heatmap de visão explodida por presença com N colunas e 24 linhas
-- A presença é dada por uma coluna virtual, gerada via código, onde:
-- presenca[i] = max(0, presenca[i - 1] + total_entrada[i] - total_saida[i])
-- exceto presenca[0], que vale 0
-- (Consolidado i deve ser reiniciado para 0 na mudança de dia)
select date_format(date(data), '%d/%m/%Y') dia, extract(hour from data) hora, sum(entrada) total_entrada, sum(saida) total_saida
from passagem
where data between '2025-03-03 00:00:00' and '2025-03-14 23:59:59'
and id_sensor = 2
group by dia, hora
order by dia, hora;




-- =============================================================
-- VISÃO AO VIVO
-- =============================================================

-- Ocupação atual por sensor:
-- Soma todas as entradas e saídas do dia corrente para estimar
-- quantas pessoas estão presentemente no local.
-- Une com a tabela sensor para exibir capacidade e calcular o percentual.
SELECT
  s.device_id,
  s.descricao,
  s.localizacao,
  s.capacidade,
  GREATEST(0, SUM(p.entrada) - SUM(p.saida))          AS presentes,
  ROUND(
    GREATEST(0, SUM(p.entrada) - SUM(p.saida))
    / s.capacidade * 100
  , 1)                                                 AS percentual_ocupacao,
  CASE
    WHEN GREATEST(0, SUM(p.entrada) - SUM(p.saida)) / s.capacidade * 100
         >= (SELECT valor FROM configuracao WHERE chave = 'alerta_ocupacao_vermelho')
    THEN 'CRITICO'
    WHEN GREATEST(0, SUM(p.entrada) - SUM(p.saida)) / s.capacidade * 100
         >= (SELECT valor FROM configuracao WHERE chave = 'alerta_ocupacao_amarelo')
    THEN 'ATENCAO'
    ELSE 'NORMAL'
  END                                                  AS status_alerta
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE DATE(p.data) = CURDATE()  
GROUP BY s.id, s.device_id, s.descricao, s.localizacao, s.capacidade;

-- Fluxo da última hora (janela rolante de 60 minutos)
-- Útil para o contador ao vivo no topo do dashboard
SELECT
  s.device_id,
  s.descricao,
  SUM(p.entrada) AS entradas_ultima_hora,
  SUM(p.saida)   AS saidas_ultima_hora
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE p.data >= NOW() - INTERVAL 60 MINUTE -- tá fucionando
GROUP BY s.id, s.device_id, s.descricao;


-- =============================================================
-- TOTAIS DIÁRIOS (resumo por dia)
-- =============================================================

-- Resumo diário por sensor: total de entradas, saídas e fluxo líquido.
-- Fluxo líquido positivo = mais entradas que saídas no dia.
SELECT
  s.device_id,
  s.descricao,
  DATE(p.data)           AS dia,
  SUM(p.entrada)         AS total_entradas,
  SUM(p.saida)           AS total_saidas,
  SUM(p.entrada)
    - SUM(p.saida)       AS fluxo_liquido
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY s.id, s.device_id, s.descricao, DATE(p.data)
ORDER BY dia, s.id;

-- Pico de ocupação registrado por dia:
-- Para cada dia, qual foi a hora com maior número de entradas.
-- Útil para exibir "horário de pico" no card de resumo diário.
SELECT
  s.device_id,
  DATE_FORMAT(DATE(p.data), '%d/%m/%Y') AS dia,
  EXTRACT(HOUR FROM p.data)             AS hora_pico,
  SUM(p.entrada)                        AS entradas_no_pico
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY s.id, s.device_id, DATE(p.data), EXTRACT(HOUR FROM p.data)
HAVING entradas_no_pico = (
  -- Subconsulta que encontra o máximo de entradas por hora naquele dia/sensor
  SELECT MAX(sub.total)
  FROM (
    SELECT SUM(p2.entrada) AS total
    FROM passagem p2
    WHERE p2.id_sensor = p.id_sensor
      AND DATE(p2.data) = DATE(p.data)
    GROUP BY EXTRACT(HOUR FROM p2.data)
  ) sub
)
ORDER BY dia, s.id;


-- =============================================================
-- RANKING DE HORÁRIOS DE PICO
-- =============================================================

-- Top 10 horas com maior fluxo de entrada no período,
-- considerando todos os sensores somados.
SELECT
  EXTRACT(HOUR FROM p.data)  AS hora,
  SUM(p.entrada)             AS total_entradas,
  COUNT(DISTINCT DATE(p.data)) AS dias_com_dados,
  ROUND(SUM(p.entrada)
    / COUNT(DISTINCT DATE(p.data)), 1) AS media_diaria
FROM passagem p
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY hora
ORDER BY total_entradas DESC
LIMIT 10;

-- Ranking de horários de pico separado por sensor
SELECT
  s.device_id,
  s.descricao,
  EXTRACT(HOUR FROM p.data)  AS hora,
  SUM(p.entrada)             AS total_entradas,
  RANK() OVER (
    PARTITION BY p.id_sensor
    ORDER BY SUM(p.entrada) DESC
  )                          AS ranking
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY p.id_sensor, s.device_id, s.descricao, EXTRACT(HOUR FROM p.data)
ORDER BY s.id, ranking;


-- =============================================================
-- COMPARATIVO ENTRE SENSORES
-- =============================================================

-- Comparativo lado a lado por hora do dia, somando todo o período.
-- Gera uma linha por hora com uma coluna para cada sensor.
-- Ideal para um gráfico de barras agrupadas no dashboard.
SELECT
  EXTRACT(HOUR FROM p.data)                             AS hora,
  SUM(CASE WHEN p.id_sensor = 1 THEN p.entrada ELSE 0 END) AS passage01_entradas,
  SUM(CASE WHEN p.id_sensor = 2 THEN p.entrada ELSE 0 END) AS passage02_entradas,
  SUM(CASE WHEN p.id_sensor = 1 THEN p.saida   ELSE 0 END) AS passage01_saidas,
  SUM(CASE WHEN p.id_sensor = 2 THEN p.saida   ELSE 0 END) AS passage02_saidas
FROM passagem p
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY hora
ORDER BY hora;

-- Comparativo por dia entre sensores: qual sensor movimentou mais pessoas?
SELECT
  DATE_FORMAT(DATE(p.data), '%d/%m/%Y')                     AS dia,
  SUM(CASE WHEN p.id_sensor = 1 THEN p.entrada ELSE 0 END)  AS passage01_entradas,
  SUM(CASE WHEN p.id_sensor = 2 THEN p.entrada ELSE 0 END)  AS passage02_entradas,
  CASE
    WHEN SUM(CASE WHEN p.id_sensor = 1 THEN p.entrada ELSE 0 END)
       > SUM(CASE WHEN p.id_sensor = 2 THEN p.entrada ELSE 0 END)
    THEN 'passage01'
    WHEN SUM(CASE WHEN p.id_sensor = 2 THEN p.entrada ELSE 0 END)
       > SUM(CASE WHEN p.id_sensor = 1 THEN p.entrada ELSE 0 END)
    THEN 'passage02'
    ELSE 'empate'
  END                                                        AS sensor_dominante
FROM passagem p
WHERE p.data BETWEEN '2025-03-03 00:00:00' AND '2025-03-14 23:59:59'
GROUP BY DATE(p.data)
ORDER BY DATE(p.data);


-- =============================================================
-- MONITORAMENTO DE BATERIA
-- =============================================================

-- Último nível de bateria registrado por sensor
-- Útil para exibir um indicador de saúde do hardware no dashboard.
SELECT
  s.device_id,
  s.descricao,
  p.bateria                          AS bateria_percentual,
  p.data                             AS ultima_leitura,
  CASE
    WHEN p.bateria <= 10 THEN 'CRITICO'
    WHEN p.bateria <= 30 THEN 'BAIXO'
    ELSE 'OK'
  END                                AS status_bateria
FROM passagem p
JOIN sensor s ON s.id = p.id_sensor
WHERE p.id = (
  SELECT MAX(p2.id)
  FROM passagem p2
  WHERE p2.id_sensor = p.id_sensor
)
ORDER BY s.id;