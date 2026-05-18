# Projeto Interdisciplinar III - Sistemas de Informacao ESPM

<p align="center">
    <a href="https://www.espm.br/cursos-de-graduacao/sistemas-de-informacao/"><img src="https://raw.githubusercontent.com/tech-espm/misc-template/main/logo.png" alt="Sistemas de Informacao ESPM" style="width: 375px;"/></a>
</p>

# Ananditos

### 2026-01

## Participantes

- [Ananda](https://github.com/ananda-fa)
- [Betina Volpi](https://github.com/bevolpi)
- [Icaro](https://github.com/Icaro2703)
- [Kayla](https://github.com/JohnnyD3pp)
- [Rodrigo Rodrigues](https://github.com/DPFNeiland)

## Visao Geral

O projeto Ananditos tem como objetivo desenvolver uma solucao de monitoramento inteligente de fluxo de pessoas em ambientes com grande circulacao, como estacoes, terminais, shoppings e demais espacos publicos ou privados.

A proposta utiliza sensores de contagem bidirecional para registrar entradas e saidas de pessoas em tempo real, sem captura de imagem ou dados biometricos. Com isso, o sistema permite acompanhar a ocupacao atual de um local, identificar horarios de pico, comparar movimentacoes entre sensores e apoiar a tomada de decisao operacional.

O projeto foi pensado para contribuir com a seguranca, organizacao e eficiencia de ambientes sujeitos a superlotacao, mantendo conformidade com principios de privacidade e protecao de dados.

## Problema

Locais com alto fluxo de pessoas frequentemente enfrentam dificuldades para acompanhar a ocupacao em tempo real. A ausencia de dados confiaveis pode prejudicar decisoes relacionadas a seguranca, alocacao de equipes, abertura de acessos, controle de filas e prevencao de superlotacao.

Solucoes tradicionais, como monitoramento visual ou estimativas manuais, podem ser imprecisas, custosas e sensiveis do ponto de vista da privacidade. Por isso, o projeto busca uma alternativa baseada em dados anonimos de fluxo.

## Solucao Proposta

A solucao proposta e um painel de monitoramento que consolida dados coletados por sensores de passagem. Cada sensor registra a quantidade de pessoas que entram e saem de determinado ponto, enviando informacoes como horario da leitura, entradas, saidas e nivel de bateria.

Esses dados sao armazenados em banco de dados e utilizados para gerar indicadores, graficos e alertas. O dashboard permite visualizar o comportamento do fluxo em diferentes periodos e comparar a movimentacao entre sensores instalados em pontos distintos.

## Objetivos do Projeto

### Objetivo Geral

Desenvolver uma solucao de monitoramento de fluxo de pessoas capaz de registrar, consolidar e apresentar dados de ocupacao para apoiar decisoes operacionais em ambientes com grande circulacao.

### Objetivos Especificos

- Registrar entradas e saidas de pessoas por sensor.
- Calcular a ocupacao estimada de um ambiente.
- Exibir dados de fluxo em um dashboard visual.
- Identificar horarios de pico.
- Comparar a movimentacao entre diferentes sensores.
- Monitorar o nivel de bateria dos dispositivos.
- Emitir status de alerta conforme percentuais de ocupacao.
- Organizar os dados de forma estruturada em banco relacional.
- Preservar a privacidade dos usuarios, sem uso de imagens ou biometria.

## Requisitos Funcionais

- RF01: O sistema deve registrar leituras enviadas pelos sensores.
- RF02: O sistema deve armazenar data, sensor, entradas, saidas, delta e bateria de cada leitura.
- RF03: O sistema deve manter o cadastro dos sensores monitorados.
- RF04: O sistema deve permitir configurar limites de alerta de ocupacao.
- RF05: O sistema deve calcular a ocupacao atual por sensor.
- RF06: O sistema deve classificar a ocupacao como normal, atencao ou critica.
- RF07: O sistema deve exibir o fluxo da ultima hora.
- RF08: O sistema deve gerar resumo diario de entradas, saidas e fluxo liquido.
- RF09: O sistema deve identificar horarios de pico.
- RF10: O sistema deve comparar o fluxo entre sensores.
- RF11: O sistema deve monitorar o nivel de bateria de cada sensor.
- RF12: O sistema deve apresentar graficos e indicadores em um dashboard.

## Requisitos Nao Funcionais

- RNF01: O sistema deve preservar a privacidade das pessoas monitoradas.
- RNF02: O sistema nao deve capturar imagens, videos ou dados biometricos.
- RNF03: O banco de dados deve utilizar codificacao compativel com caracteres especiais.
- RNF04: As consultas devem permitir analises por periodo, hora, dia e sensor.
- RNF05: A interface deve ser responsiva para diferentes tamanhos de tela.
- RNF06: A estrutura deve permitir a inclusao de novos sensores.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap
- Chart.js
- MySQL

## Estrutura do Projeto

```text
.
|-- README.md
|-- LICENSE
|-- script.sql
`-- prototipo
    |-- index.html
    |-- css
    |   `-- style.css
    `-- js
        `-- script.js
```

## Banco de Dados

O banco de dados utilizado pelo projeto se chama `ananditos`. Ele possui tabelas para armazenar leituras de passagem, sensores e configuracoes gerais do sistema.

### Tabela `passagem`

Armazena os registros de fluxo coletados pelos sensores.

| Campo | Descricao |
| --- | --- |
| `id` | Identificador unico da leitura |
| `data` | Data e hora da leitura |
| `id_sensor` | Sensor responsavel pela leitura |
| `delta` | Variacao do fluxo |
| `bateria` | Nivel de bateria informado pelo sensor |
| `entrada` | Quantidade de entradas registradas |
| `saida` | Quantidade de saidas registradas |

### Tabela `sensor`

Armazena os metadados dos sensores instalados.

| Campo | Descricao |
| --- | --- |
| `id` | Identificador unico do sensor |
| `device_id` | Identificador do dispositivo |
| `descricao` | Descricao do sensor |
| `localizacao` | Local onde o sensor esta instalado |
| `capacidade` | Capacidade maxima estimada do local |
| `ativo` | Indica se o sensor esta ativo |
| `criado_em` | Data de cadastro do sensor |

### Tabela `configuracao`

Armazena parametros gerais do sistema, como limites de alerta e janela de tempo usada na visao ao vivo.

## Principais Consultas

O arquivo `script.sql` inclui consultas para:

- consolidar o fluxo por dia da semana e hora;
- consolidar o fluxo por dia do mes e hora;
- calcular presenca estimada no ambiente;
- consultar ocupacao atual por sensor;
- calcular fluxo da ultima hora;
- gerar totais diarios;
- identificar pico de ocupacao;
- montar ranking de horarios de pico;
- comparar sensores por hora e por dia;
- monitorar o nivel de bateria dos sensores.

## Prototipo

O prototipo esta localizado na pasta `prototipo` e apresenta uma interface visual para demonstrar a proposta do dashboard.

A interface contempla:

- secao de apresentacao do projeto;
- informacoes sobre o sensor utilizado;
- cards de beneficios e caracteristicas;
- graficos de fluxo por hora;
- comparativo de entradas e saidas;
- visualizacao de ocupacao por setor;
- tendencia de ocupacao em tempo real;
- tabela com estrutura de dados utilizada.

## Como Executar o Prototipo

Para visualizar o prototipo, abra o arquivo abaixo em um navegador:

```text
prototipo/index.html
```

Como o prototipo utiliza arquivos estaticos, nao e necessario instalar dependencias ou iniciar um servidor local para a visualizacao inicial.

## Como Configurar o Banco de Dados

1. Abra um cliente MySQL.
2. Execute o arquivo `script.sql`.
3. Verifique se o banco `ananditos` foi criado.
4. Confirme a criacao das tabelas `passagem`, `sensor` e `configuracao`.

Exemplo:

```sql
SOURCE script.sql;
```

## Modelo de Funcionamento

1. O sensor registra o fluxo de pessoas.
2. A leitura e enviada com dados de entrada, saida, horario e bateria.
3. O sistema armazena a leitura na tabela `passagem`.
4. As consultas consolidam os dados por sensor e periodo.
5. O dashboard apresenta os indicadores para o usuario.
6. O sistema classifica alertas conforme a ocupacao estimada.

## Privacidade e LGPD

O projeto foi pensado para operar sem captura de imagem, audio, video ou biometria. Os sensores considerados realizam apenas contagem numerica de entradas e saidas, o que reduz riscos relacionados a identificacao pessoal.

Dessa forma, a solucao trabalha com dados anonimos de fluxo e ocupacao, mantendo foco em inteligencia operacional e preservacao da privacidade.

## Possiveis Melhorias Futuras

- Integrar o prototipo com dados reais do banco.
- Criar uma API para receber leituras dos sensores.
- Implementar autenticacao de usuarios.
- Adicionar filtros dinamicos por sensor, data e local.
- Criar notificacoes automaticas para alertas criticos.
- Melhorar a visualizacao de mapas de calor.
- Criar testes automatizados para as regras de consolidacao.
- Publicar o dashboard em ambiente web.

## Licença

Este projeto e licenciado sob a [MIT License](https://github.com/tech-espm/inter-3sem-2026-ananditos/blob/main/LICENSE).

<p align="right">
    <a href="https://www.espm.br/cursos-de-graduacao/sistemas-de-informacao/"><img src="https://raw.githubusercontent.com/tech-espm/misc-template/main/logo-si-512.png" alt="Sistemas de Informacao ESPM" style="width: 375px;"/></a>
</p>
