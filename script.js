// Mata Fome - script do site
// APIs usadas: IBGE (estados e cidades) e Open Food Facts (sugestao de alimentos)
// Os dados ficam salvos no localStorage do navegador.

// ---------- dados de exemplo ----------
var doadoresExemplo = [
  { tipo: 'doador', nome: 'Restaurante Sabor da Terra', categoria: 'Restaurante', uf: 'PR', cidade: 'Curitiba', endereco: 'Centro', contato: '(41) 3000-0001', kg: 45 },
  { tipo: 'doador', nome: 'Mercado Bom Preço', categoria: 'Supermercado', uf: 'PR', cidade: 'Curitiba', endereco: 'Água Verde', contato: '(41) 3000-0002', kg: 120 },
  { tipo: 'instituicao', nome: 'ONG Mãos Solidárias', categoria: 'ONG / Banco de alimentos', uf: 'PR', cidade: 'Curitiba', endereco: 'Cajuru', contato: '(41) 3000-0003', kg: 0 },
  { tipo: 'doador', nome: 'Sítio Colheita Viva', categoria: 'Produtor rural', uf: 'PR', cidade: 'Colombo', endereco: 'Zona rural', contato: '(41) 3000-0004', kg: 80 },
  { tipo: 'doador', nome: 'Padaria Pão Nosso', categoria: 'Padaria', uf: 'SP', cidade: 'São Paulo', endereco: 'Pinheiros', contato: '(11) 3000-0006', kg: 30 },
  { tipo: 'doador', nome: 'Hortifruti Raiz', categoria: 'Supermercado', uf: 'RJ', cidade: 'Rio de Janeiro', endereco: 'Tijuca', contato: '(21) 3000-0007', kg: 90 }
];

var depoimentos = [
  { texto: 'Com as doações, conseguimos montar cestas completas para 60 famílias do nosso bairro todo mês.', autor: 'Maria, coordenadora de associação comunitária' },
  { texto: 'Meus filhos voltaram a ter frutas e verduras em casa. Não tenho palavras para agradecer.', autor: 'Josiane, mãe de três filhos' },
  { texto: 'Antes jogávamos fora o que sobrava do dia. Hoje sabemos que cada refeição chega a alguém.', autor: 'Carlos, dono de restaurante parceiro' },
  { texto: 'A plataforma facilitou a coleta: avisamos a ONG e em poucas horas o alimento já está a caminho.', autor: 'Dona Lúcia, produtora rural' }
];

// ---------- funções auxiliares ----------
function pegar(nome) {
  var texto = localStorage.getItem(nome);
  if (texto) {
    return JSON.parse(texto);
  }
  return [];
}

function salvar(nome, lista) {
  localStorage.setItem(nome, JSON.stringify(lista));
}

// troca caracteres especiais para ninguém colocar HTML nos campos
function limpar(texto) {
  var div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function formatar(numero) {
  return Math.round(numero).toLocaleString('pt-BR');
}

function mostrarMensagem(id, texto, deuCerto) {
  var p = document.getElementById(id);
  p.textContent = texto;
  p.className = deuCerto ? 'msg ok' : 'msg err';
}

// marca os campos vazios em vermelho e diz se está tudo preenchido
function camposPreenchidos(ids) {
  var tudoOk = true;
  for (var i = 0; i < ids.length; i++) {
    var campo = document.getElementById(ids[i]);
    if (campo.value.trim() == '') {
      campo.classList.add('invalid');
      tudoOk = false;
    } else {
      campo.classList.remove('invalid');
    }
  }
  return tudoOk;
}

// ---------- números de impacto ----------
function atualizarNumeros() {
  var cadastros = pegar('matafome_cadastros');
  var solicitacoes = pegar('matafome_solicitacoes');

  // soma os kg de todos os cadastros salvos
  var kg = 0;
  for (var i = 0; i < cadastros.length; i++) {
    kg = kg + cadastros[i].kg;
  }

  document.getElementById('heroKg').textContent = formatar(kg);
  document.getElementById('statKg').textContent = formatar(kg);
  document.getElementById('statMeals').textContent = formatar(kg / 0.4); // 1 refeição = 400 g
  document.getElementById('statPartners').textContent = cadastros.length;
  document.getElementById('statFamilies').textContent = solicitacoes.length;
}

// ---------- estados e cidades (API do IBGE) ----------
var IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

function carregarEstados() {
  fetch(IBGE + '/estados?orderBy=nome')
    .then(function (resposta) { return resposta.json(); })
    .then(function (estados) {
      var selects = document.querySelectorAll('.uf-select');
      for (var i = 0; i < selects.length; i++) {
        for (var j = 0; j < estados.length; j++) {
          selects[i].add(new Option(estados[j].nome + ' (' + estados[j].sigla + ')', estados[j].sigla));
        }
      }
    })
    .catch(function () {
      alert('Não foi possível carregar os estados. Verifique a internet.');
    });
}

function carregarCidades(selectEstado) {
  var selectCidade = document.getElementById(selectEstado.dataset.city);
  selectCidade.innerHTML = '<option value="">Selecione o estado</option>';
  selectCidade.disabled = true;
  if (selectEstado.value == '') {
    return;
  }

  fetch(IBGE + '/estados/' + selectEstado.value + '/municipios?orderBy=nome')
    .then(function (resposta) { return resposta.json(); })
    .then(function (cidades) {
      selectCidade.innerHTML = '<option value="">Cidade</option>';
      for (var i = 0; i < cidades.length; i++) {
        selectCidade.add(new Option(cidades[i].nome, cidades[i].nome));
      }
      selectCidade.disabled = false;
    });
}

var selectsEstado = document.querySelectorAll('.uf-select');
for (var i = 0; i < selectsEstado.length; i++) {
  selectsEstado[i].addEventListener('change', function () {
    carregarCidades(this);
  });
}

// ---------- cadastro de doador / instituição ----------
var botoesAba = document.querySelectorAll('.tab');
for (var i = 0; i < botoesAba.length; i++) {
  botoesAba[i].addEventListener('click', function () {
    for (var j = 0; j < botoesAba.length; j++) {
      botoesAba[j].classList.remove('active');
    }
    this.classList.add('active');
    document.getElementById('regType').value = this.dataset.type;
    // instituição não informa quantidade de alimentos
    document.getElementById('kgLabel').style.display = this.dataset.type == 'doador' ? '' : 'none';
  });
}

document.getElementById('regForm').addEventListener('submit', function (e) {
  e.preventDefault();

  var obrigatorios = ['regName', 'regContact', 'regUf', 'regCity', 'regAddress'];
  if (!camposPreenchidos(obrigatorios)) {
    mostrarMensagem('regMsg', 'Preencha todos os campos obrigatórios.', false);
    return;
  }

  var tipo = document.getElementById('regType').value;
  var kg = 0;
  if (tipo == 'doador') {
    kg = Number(document.getElementById('regKg').value) || 0;
  }

  var cadastros = pegar('matafome_cadastros');
  cadastros.push({
    id: Date.now(),
    tipo: tipo,
    nome: document.getElementById('regName').value.trim(),
    contato: document.getElementById('regContact').value.trim(),
    categoria: document.getElementById('regCategory').value,
    uf: document.getElementById('regUf').value,
    cidade: document.getElementById('regCity').value,
    endereco: document.getElementById('regAddress').value.trim(),
    kg: kg
  });
  salvar('matafome_cadastros', cadastros);

  this.reset();
  document.getElementById('regCity').disabled = true;
  mostrarMensagem('regMsg', 'Cadastro feito com sucesso!', true);
  mostrarCadastros();
  atualizarNumeros();
});

function mostrarCadastros() {
  var cadastros = pegar('matafome_cadastros');
  var html = '';

  for (var i = 0; i < cadastros.length; i++) {
    var c = cadastros[i];
    var nomeTipo = c.tipo == 'doador' ? 'Doador' : 'Instituição';
    html += '<div class="match">';
    html += '<small>' + nomeTipo + ' · ' + limpar(c.categoria) + '</small>';
    html += '<h3>' + limpar(c.nome) + '</h3>';
    html += '<small>' + limpar(c.endereco) + ' — ' + limpar(c.cidade) + '/' + limpar(c.uf) + '</small><br>';
    html += '<small>Contato: ' + limpar(c.contato) + '</small>';
    if (c.tipo == 'doador') {
      html += '<br><strong>' + formatar(c.kg) + ' kg disponíveis</strong>';
    }
    html += '<div class="card-actions"><button class="btn small outline" data-remover="' + c.id + '">Remover</button></div>';
    html += '</div>';
  }

  if (html == '') {
    html = '<p class="muted">Nenhum cadastro salvo ainda.</p>';
  }
  document.getElementById('savedList').innerHTML = html;
}

document.getElementById('savedList').addEventListener('click', function (e) {
  var id = e.target.dataset.remover;
  if (!id) {
    return;
  }
  var cadastros = pegar('matafome_cadastros');
  var novaLista = [];
  for (var i = 0; i < cadastros.length; i++) {
    if (cadastros[i].id != id) {
      novaLista.push(cadastros[i]);
    }
  }
  salvar('matafome_cadastros', novaLista);
  mostrarCadastros();
  atualizarNumeros();
});

// ---------- solicitação de doação ----------
document.getElementById('reqForm').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!camposPreenchidos(['reqName', 'reqPhone', 'reqUf', 'reqCity', 'reqAddress'])) {
    mostrarMensagem('reqMsg', 'Preencha todos os campos obrigatórios.', false);
    return;
  }

  var uf = document.getElementById('reqUf').value;
  var cidade = document.getElementById('reqCity').value;

  var solicitacoes = pegar('matafome_solicitacoes');
  solicitacoes.push({
    nome: document.getElementById('reqName').value.trim(),
    telefone: document.getElementById('reqPhone').value.trim(),
    uf: uf,
    cidade: cidade,
    endereco: document.getElementById('reqAddress').value.trim(),
    pessoas: Number(document.getElementById('reqPeople').value) || 1,
    alimento: document.getElementById('reqFood').value.trim(),
    data: new Date().toLocaleDateString('pt-BR'),
    doado: false
  });
  salvar('matafome_solicitacoes', solicitacoes);

  // procura doadores da mesma cidade (exemplos + cadastrados)
  var todos = doadoresExemplo.concat(pegar('matafome_cadastros'));
  var html = '';
  var achados = 0;
  for (var i = 0; i < todos.length; i++) {
    var d = todos[i];
    if (d.tipo == 'doador' && d.uf == uf && d.cidade == cidade && d.kg > 0) {
      achados++;
      html += '<div class="match">';
      html += '<h3>' + limpar(d.nome) + '</h3>';
      html += '<small>' + limpar(d.categoria) + ' · ' + limpar(d.endereco) + '</small><br>';
      html += '<small>Contato: ' + limpar(d.contato) + '</small><br>';
      html += '<strong>' + formatar(d.kg) + ' kg disponíveis</strong>';
      html += '</div>';
    }
  }
  document.getElementById('matches').innerHTML = html;

  if (achados > 0) {
    mostrarMensagem('reqMsg', 'Solicitação enviada! Encontramos ' + achados + ' doador(es) em ' + cidade + '.', true);
  } else {
    mostrarMensagem('reqMsg', 'Solicitação registrada! Ainda não há doadores nesta cidade.', true);
  }

  this.reset();
  document.getElementById('reqCity').disabled = true;
  mostrarSolicitacoes();
  atualizarNumeros();
});

function mostrarSolicitacoes() {
  var solicitacoes = pegar('matafome_solicitacoes');
  var html = '';

  for (var i = 0; i < solicitacoes.length; i++) {
    var s = solicitacoes[i];
    var classe = s.doado ? 'match donated' : 'match';
    var textoBotao = s.doado ? 'Desmarcar doação' : 'Marcar como já doado';

    html += '<div class="' + classe + '">';
    html += '<small>' + limpar(s.data) + ' · ' + s.pessoas + ' pessoa(s)' + (s.doado ? ' · Já doado' : '') + '</small>';
    html += '<h3>' + limpar(s.nome) + '</h3>';
    // solicitações antigas podem não ter endereço salvo
    html += '<small>' + (s.endereco ? limpar(s.endereco) + ' — ' : '') + limpar(s.cidade) + '/' + limpar(s.uf) + (s.alimento ? ' · ' + limpar(s.alimento) : '') + '</small><br>';
    html += '<small>Contato: ' + limpar(s.telefone) + '</small>';
    html += '<div class="card-actions">';
    html += '<button class="btn small yellow" data-doado="' + i + '">' + textoBotao + '</button>';
    html += '<button class="btn small outline" data-excluir="' + i + '">Remover</button>';
    html += '</div></div>';
  }

  if (html == '') {
    html = '<p class="muted">Nenhuma solicitação salva ainda.</p>';
  }
  document.getElementById('requestList').innerHTML = html;
}

document.getElementById('requestList').addEventListener('click', function (e) {
  var solicitacoes = pegar('matafome_solicitacoes');

  if (e.target.dataset.doado) {
    var s = solicitacoes[e.target.dataset.doado];
    s.doado = !s.doado;
  } else if (e.target.dataset.excluir) {
    solicitacoes.splice(e.target.dataset.excluir, 1);
  } else {
    return;
  }

  salvar('matafome_solicitacoes', solicitacoes);
  mostrarSolicitacoes();
  atualizarNumeros();
});

// ---------- sugestões de alimentos (Open Food Facts) ----------
var alimentosComuns = ['Arroz', 'Feijão', 'Macarrão', 'Leite', 'Pão', 'Farinha', 'Óleo de soja', 'Açúcar', 'Frutas', 'Verduras', 'Legumes', 'Ovos'];
var listaAlimentos = '';
for (var i = 0; i < alimentosComuns.length; i++) {
  listaAlimentos += '<option value="' + alimentosComuns[i] + '">';
}
document.getElementById('foodList').innerHTML = listaAlimentos;

var temporizador;
document.getElementById('reqFood').addEventListener('input', function () {
  var busca = this.value.trim();
  clearTimeout(temporizador);
  if (busca.length < 3) {
    return;
  }
  // espera o usuário parar de digitar para não chamar a API toda hora
  temporizador = setTimeout(function () {
    var url = 'https://world.openfoodfacts.org/cgi/search.pl?search_terms=' + encodeURIComponent(busca) +
      '&search_simple=1&action=process&json=1&page_size=8&fields=product_name&lc=pt';
    fetch(url)
      .then(function (resposta) { return resposta.json(); })
      .then(function (dados) {
        var opcoes = '';
        for (var i = 0; i < dados.products.length; i++) {
          if (dados.products[i].product_name) {
            opcoes += '<option value="' + limpar(dados.products[i].product_name) + '">';
          }
        }
        if (opcoes != '') {
          document.getElementById('foodList').innerHTML = opcoes;
        }
      })
      .catch(function () { /* se der erro, continua com a lista padrão */ });
  }, 500);
});

// ---------- depoimentos ----------
var depoimentoAtual = 0;

function mostrarDepoimento(numero) {
  depoimentoAtual = numero;
  document.getElementById('tQuote').textContent = '“' + depoimentos[numero].texto + '”';
  document.getElementById('tAuthor').textContent = '— ' + depoimentos[numero].autor;
  var bolinhas = document.querySelectorAll('#tDots button');
  for (var i = 0; i < bolinhas.length; i++) {
    bolinhas[i].classList.toggle('active', i == numero);
  }
}

var bolinhasHtml = '';
for (var i = 0; i < depoimentos.length; i++) {
  bolinhasHtml += '<button aria-label="Depoimento ' + (i + 1) + '"></button>';
}
document.getElementById('tDots').innerHTML = bolinhasHtml;

var bolinhas = document.querySelectorAll('#tDots button');
for (var i = 0; i < bolinhas.length; i++) {
  bolinhas[i].addEventListener('click', function () {
    mostrarDepoimento([].indexOf.call(bolinhas, this));
  });
}

// troca sozinho a cada 6 segundos
setInterval(function () {
  mostrarDepoimento((depoimentoAtual + 1) % depoimentos.length);
}, 6000);

// ---------- quando a página abre ----------
atualizarNumeros();
mostrarCadastros();
mostrarSolicitacoes();
mostrarDepoimento(0);
carregarEstados();
