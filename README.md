# Base Financeira

Plataforma web gratuita de educação financeira básica, desenvolvida como Atividade Extensionista I (Tecnologia Aplicada à Inclusão Digital) do curso de Análise e Desenvolvimento de Sistemas — UNINTER.

**Aluno:** João Vitor Santos de Oliveira Jardim (RU: 5178152)
**Aplicação:** comunidade de Itatiaia — RJ
**ODS:** 04 (Educação de Qualidade) e 08 (Trabalho Decente e Crescimento Econômico)

## O que o site faz

- Explica, em linguagem simples, o que é educação financeira e por que ela importa no dia a dia.
- Oferece uma calculadora de orçamento mensal: o usuário registra receitas e despesas e acompanha o saldo em tempo real.
- Reúne seis dicas práticas de controle financeiro, voltadas a quem está começando (primeiro emprego, primeira renda, primeiro orçamento).

## Tecnologias

- HTML5
- CSS3 (sem frameworks)
- JavaScript puro (sem dependências)

Os lançamentos da calculadora ficam salvos no navegador do próprio usuário (`localStorage`) — nenhum dado é enviado a um servidor.

## Como rodar localmente

Não precisa de instalação nem de servidor. Basta abrir o arquivo `index.html` em qualquer navegador.

```
git clone <url-do-repositorio>
cd base-financeira
# abra index.html no navegador
```

## Estrutura

```
base-financeira/
├── index.html
├── style.css
├── script.js
└── README.md
```
