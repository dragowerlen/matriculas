/**
 * ============================================================
 * supabase-api-shim.js
 * ------------------------------------------------------------
 * Substitui as funções que antes chamavam o Apps Script
 * (apiListar, apiOpcoes, apiDetalhe, apiAtualizar, apiCriar,
 * apiExcluir, apiAgendar, apiCancelarAgendamento, apiManutencao)
 * por versões que usam o Supabase — MESMOS nomes de função,
 * MESMOS parâmetros, MESMO formato de retorno. O resto do
 * index.html não precisa saber que a fonte de dados mudou.
 *
 * Requer que supabase-client.js já tenha sido carregado antes
 * deste arquivo (ele expõe window.supabaseClient).
 * ============================================================
 */

// Mapa entre as chaves usadas no front-end (CONFIG.COLUNAS do Apps
// Script) e as colunas reais da tabela "contatos" no Postgres.
const MAPA_CAMPOS = {
  FUSO: "fuso",
  PAIS: "pais",
  REGIAO: "regiao",
  STATUS_COMERCIAL: "status_comercial",
  PROFISSAO: "profissao",
  NOME: "nome",
  TELEFONE: "telefone",
  INDICADO_POR: "indicado_por",
  STATUS_COMPORTAMENTAL: "status_contato",
  REFERIDOS: "referido",
  OBSERVACAO: "observacao_contato",
  OBSERVACAO_INDICADO: "observacao_indicado_por",
  REGISTRO_STATUS_COMERCIAL: "data_status_comercial",
  REGISTRO_TELEFONE: "data_telefone",
  REGISTRO_STATUS_COMPORTAMENTAL: "data_status_contato",
  LINK_WHATSAPP: "link_whatsapp",
  AGENDAMENTO: "agendamento",
  ID_EVENTO_AGENDA: "id_evento"
};

const CAMPOS_APP = Object.keys(MAPA_CAMPOS);

function campoApp2Coluna(chaveApp){ return MAPA_CAMPOS[chaveApp] || null; }

// dd/MM/yyyy <-> yyyy-MM-dd (o Postgres guarda "date" nesse formato)
function isoParaBrData(iso){
  if(!iso) return "";
  const partes = String(iso).split("-");
  if(partes.length !== 3) return "";
  return partes[2].substring(0,2) + "/" + partes[1] + "/" + partes[0];
}
function brDataParaIso(br){
  const m = String(br || "").match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if(!m) return null;
  return m[3] + "-" + m[2] + "-" + m[1];
}
// "dd/MM/yyyy HH:mm" <-> timestamptz ISO (agendamento)
function isoParaBrDataHora(isoCompleto){
  if(!isoCompleto) return "";
  const d = new Date(isoCompleto);
  if(isNaN(d.getTime())) return "";
  const pad = n => String(n).padStart(2, "0");
  return pad(d.getDate()) + "/" + pad(d.getMonth()+1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

/**
 * Converte uma linha da tabela "contatos" (formato do Postgres) para
 * o formato de objeto que o front-end já espera (chaves como NOME,
 * TELEFONE, REGISTRO_TELEFONE em dd/MM/yyyy, "linha" no lugar de id).
 */
function linhaSupabaseParaContatoApp(linha){
  const contato = { linha: linha.id, aba: ABA_CONTATOS };
  CAMPOS_APP.forEach(chaveApp => {
    const coluna = MAPA_CAMPOS[chaveApp];
    let valor = linha[coluna];
    if(valor === null || valor === undefined) valor = "";
    if(chaveApp === "REGISTRO_STATUS_COMERCIAL" || chaveApp === "REGISTRO_TELEFONE" || chaveApp === "REGISTRO_STATUS_COMPORTAMENTAL"){
      valor = isoParaBrData(valor);
    }
    if(chaveApp === "AGENDAMENTO"){
      valor = isoParaBrDataHora(valor);
    }
    contato[chaveApp] = valor;
  });
  return contato;
}

/**
 * Converte um objeto de "dados" no formato do front-end (chaves
 * como TELEFONE, STATUS_COMERCIAL...) para um objeto pronto pra
 * update/insert no Supabase (colunas como telefone, status_comercial).
 */
function dadosAppParaSupabase(dados){
  const saida = {};
  Object.keys(dados).forEach(chaveApp => {
    const coluna = campoApp2Coluna(chaveApp);
    if(!coluna) return;
    let valor = dados[chaveApp];
    if((chaveApp === "REGISTRO_STATUS_COMERCIAL" || chaveApp === "REGISTRO_TELEFONE" || chaveApp === "REGISTRO_STATUS_COMPORTAMENTAL") && valor){
      valor = brDataParaIso(valor);
    }
    saida[coluna] = valor === "" ? null : valor;
  });
  return saida;
}

/* ============================================================
 * apiListar — busca TODOS os contatos (o front-end já faz a
 * filtragem/paginação em memória depois de carregar). Mantém o
 * mesmo formato { campos, aba, linhas } que o Apps Script devolvia.
 * ============================================================ */
async function apiListar(aba){
  const TAMANHO_PAGINA = 1000;
  let de = 0;
  let todosOsDados = [];

  while(true){
    const { data, error } = await supabaseClient
      .from("contatos")
      .select("*")
      .order("id", { ascending: true })
      .range(de, de + TAMANHO_PAGINA - 1);

    if(error) throw new Error(error.message);
    if(!data || data.length === 0) break;

    todosOsDados = todosOsDados.concat(data);
    if(data.length < TAMANHO_PAGINA) break;
    de += TAMANHO_PAGINA;
  }

  return todosOsDados.map(linha => linhaSupabaseParaContatoApp(linha));
}

/* ============================================================
 * apiOpcoes — lê da tabela "opcoes_lista" (não mais dos valores
 * distintos dos contatos), pra permitir criar uma opção nova antes
 * de qualquer contato usá-la.
 * ============================================================ */
const MAPA_CAMPO_OPCOES = {
  statusComercial: "status_comercial",
  statusComportamental: "status_contato",
  profissao: "profissao",
  referidos: "referido"
};

async function apiOpcoes(){
  const { data, error } = await supabaseClient
    .from("opcoes_lista")
    .select("campo, valor")
    .order("valor", { ascending: true });

  if(error) throw new Error(error.message);

  const porCampo = {};
  Object.values(MAPA_CAMPO_OPCOES).forEach(c => porCampo[c] = []);
  (data || []).forEach(linha => {
    if(porCampo[linha.campo]) porCampo[linha.campo].push(linha.valor);
  });

  const resultado = {};
  Object.keys(MAPA_CAMPO_OPCOES).forEach(chaveApp => {
    resultado[chaveApp] = [""].concat(porCampo[MAPA_CAMPO_OPCOES[chaveApp]]);
  });

  return resultado;
}

/**
 * Adiciona uma opção nova numa das 4 listas. Não dá erro se a opção
 * já existir (só não duplica).
 */
async function apiAdicionarOpcao(chaveApp, valor){
  const campo = MAPA_CAMPO_OPCOES[chaveApp];
  if(!campo) throw new Error("Campo desconhecido: " + chaveApp);

  const valorLimpo = String(valor || "").trim();
  if(valorLimpo === "") throw new Error("Digite um valor.");

  const { error } = await supabaseClient
    .from("opcoes_lista")
    .insert({ campo, valor: valorLimpo });

  // erro de duplicata (já existe) não é um problema de verdade
  if(error && error.code !== "23505") throw new Error(error.message);

  return { sucesso: true };
}

/**
 * Conta quantos contatos usam um determinado valor num campo —
 * usado pra decidir se precisa perguntar a reatribuição antes de
 * excluir a opção.
 */
async function apiContarUsoOpcao(chaveApp, valor){
  const campo = MAPA_CAMPO_OPCOES[chaveApp];
  if(!campo) throw new Error("Campo desconhecido: " + chaveApp);

  const { count, error } = await supabaseClient
    .from("contatos")
    .select("id", { count: "exact", head: true })
    .eq(campo, valor);

  if(error) throw new Error(error.message);
  return count || 0;
}

/**
 * Exclui uma opção de uma lista. Se novoValor for informado, todos
 * os contatos que usavam a opção antiga passam a usar o novoValor
 * (ou ficam em branco, se novoValor for "" / null).
 */
async function apiExcluirOpcao(chaveApp, valorAntigo, novoValor){
  const campo = MAPA_CAMPO_OPCOES[chaveApp];
  if(!campo) throw new Error("Campo desconhecido: " + chaveApp);

  // Reatribui os contatos que usavam essa opção
  const valorFinal = (novoValor === undefined || novoValor === null) ? null : (String(novoValor).trim() || null);
  const { error: erroUpdate } = await supabaseClient
    .from("contatos")
    .update({ [campo]: valorFinal })
    .eq(campo, valorAntigo);

  if(erroUpdate) throw new Error(erroUpdate.message);

  // Remove a opção da lista
  const { error: erroDelete } = await supabaseClient
    .from("opcoes_lista")
    .delete()
    .eq("campo", campo)
    .eq("valor", valorAntigo);

  if(erroDelete) throw new Error(erroDelete.message);

  return { sucesso: true };
}

/* Troca o valor de um campo em TODOS os contatos que tiverem o valor
   antigo, de uma vez só — sem excluir a opção da lista (diferente de
   apiExcluirOpcao, que reatribui E remove a opção). */
/* ============================================================
 * MENSAGENS DO WHATSAPP — sincronizadas via Supabase (tabela
 * mensagens_whatsapp), pra funcionar igual em qualquer aparelho.
 * ============================================================ */
async function apiListarMensagensWhatsapp(){
  const { data, error } = await supabaseClient
    .from("mensagens_whatsapp")
    .select("id, nome, texto, padrao")
    .order("criado_em", { ascending: true });

  if(error) throw new Error(error.message);
  return data || [];
}

async function apiCriarMensagemWhatsapp(nome, texto, padrao){
  const { data, error } = await supabaseClient
    .from("mensagens_whatsapp")
    .insert({ nome, texto, padrao: !!padrao })
    .select("id, nome, texto, padrao")
    .single();

  if(error) throw new Error(error.message);
  return data;
}

async function apiAtualizarMensagemWhatsapp(id, dados){
  const { error } = await supabaseClient
    .from("mensagens_whatsapp")
    .update(dados)
    .eq("id", id);

  if(error) throw new Error(error.message);
  return { sucesso: true };
}

async function apiExcluirMensagemWhatsapp(id){
  const { error } = await supabaseClient
    .from("mensagens_whatsapp")
    .delete()
    .eq("id", id);

  if(error) throw new Error(error.message);
  return { sucesso: true };
}

/* Marca uma mensagem como padrão e desmarca todas as outras — feito
   em 2 passos porque o Supabase não tem "só um pode ser true" nativo. */
async function apiDefinirMensagemWhatsappPadrao(id){
  const { error: erro1 } = await supabaseClient
    .from("mensagens_whatsapp")
    .update({ padrao: false })
    .neq("id", id);
  if(erro1) throw new Error(erro1.message);

  const { error: erro2 } = await supabaseClient
    .from("mensagens_whatsapp")
    .update({ padrao: true })
    .eq("id", id);
  if(erro2) throw new Error(erro2.message);

  return { sucesso: true };
}

async function apiSubstituirValorEmMassa(chaveApp, valorAntigo, valorNovo){
  const campo = MAPA_CAMPO_OPCOES[chaveApp];
  if(!campo) throw new Error("Campo desconhecido: " + chaveApp);

  const { error } = await supabaseClient
    .from("contatos")
    .update({ [campo]: valorNovo })
    .eq(campo, valorAntigo);

  if(error) throw new Error(error.message);
  return { sucesso: true };
}

/* ============================================================
 * apiDetalhe — todos os campos de 1 contato + duplicados (outras
 * linhas com o mesmo telefone).
 * ============================================================ */
async function apiDetalhe(aba, linha){
  const { data, error } = await supabaseClient
    .from("contatos")
    .select("*")
    .eq("id", linha)
    .single();

  if(error) throw new Error(error.message);

  const contato = linhaSupabaseParaContatoApp(data);

  // Busca duplicados (outras linhas com o mesmo telefone)
  if(data.telefone){
    const { data: duplicadosData, error: erroDuplicados } = await supabaseClient
      .from("contatos")
      .select("id, indicado_por, observacao_indicado_por")
      .eq("telefone", data.telefone)
      .neq("id", linha);

    if(!erroDuplicados && duplicadosData){
      contato.duplicados = duplicadosData.map(d => ({
        linha: d.id,
        indicadoPor: d.indicado_por || "",
        observacaoIndicadoPor: d.observacao_indicado_por || ""
      }));
    } else {
      contato.duplicados = [];
    }
  } else {
    contato.duplicados = [];
  }

  return contato;
}

/* ============================================================
 * apiAtualizar — atualiza os campos informados. Se TELEFONE
 * mudou, reprocessa telefone/whatsapp/fuso/país/região (igual ao
 * Apps Script fazia). Se STATUS mudou, carimba a data.
 * ============================================================ */
async function apiAtualizar(aba, linha, dados){
  const camposParaSalvar = { ...dados };

  if(dados.hasOwnProperty("TELEFONE") && String(dados.TELEFONE || "").trim() !== ""){
    const processado = processarTelefoneContato(dados.TELEFONE);
    camposParaSalvar.TELEFONE = processado.telefone;
    camposParaSalvar.LINK_WHATSAPP = processado.link_whatsapp;
    camposParaSalvar.FUSO = processado.fuso;
    camposParaSalvar.PAIS = processado.pais;
    camposParaSalvar.REGIAO = processado.regiao;
    camposParaSalvar.REGISTRO_TELEFONE = hojeBr();
  }

  if(dados.hasOwnProperty("STATUS_COMERCIAL")){
    camposParaSalvar.REGISTRO_STATUS_COMERCIAL = hojeBr();
  }
  if(dados.hasOwnProperty("STATUS_COMPORTAMENTAL")){
    camposParaSalvar.REGISTRO_STATUS_COMPORTAMENTAL = hojeBr();
  }

  const colunasSupabase = dadosAppParaSupabase(camposParaSalvar);

  const { error } = await supabaseClient
    .from("contatos")
    .update(colunasSupabase)
    .eq("id", linha);

  if(error) throw new Error(error.message);

  await sincronizarOpcoesNovas(dados);

  return { sucesso: true };
}

/**
 * Se algum dos campos de lista suspensa (Profissão, Referido, Status
 * Comercial, Status do Contato) recebeu um valor novo — que ainda
 * não está na lista de opções — adiciona ele automaticamente, igual
 * o Apps Script fazia com garantirListaCompleta().
 */
async function sincronizarOpcoesNovas(dados){
  const camposDeLista = { PROFISSAO: "profissao", REFERIDOS: "referidos", STATUS_COMERCIAL: "statusComercial", STATUS_COMPORTAMENTAL: "statusComportamental" };
  for(const chaveApp of Object.keys(camposDeLista)){
    if(!dados.hasOwnProperty(chaveApp)) continue;
    const valor = String(dados[chaveApp] || "").trim();
    if(valor === "") continue;
    try{ await apiAdicionarOpcao(camposDeLista[chaveApp], valor); }
    catch(e){ /* não trava o salvamento do contato por causa disso */ }
  }
}

function hojeBr(){
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return pad(d.getDate()) + "/" + pad(d.getMonth()+1) + "/" + d.getFullYear();
}

/* ============================================================
 * apiCriar — cria um novo contato, processando TELEFONE.
 * ============================================================ */
async function apiCriar(aba, dados){
  if(!dados || !String(dados.TELEFONE || "").trim()){
    throw new Error("Telefone é obrigatório pra criar um contato.");
  }

  const camposParaSalvar = { ...dados };
  const processado = processarTelefoneContato(dados.TELEFONE);
  camposParaSalvar.TELEFONE = processado.telefone;
  camposParaSalvar.LINK_WHATSAPP = processado.link_whatsapp;
  camposParaSalvar.FUSO = processado.fuso;
  camposParaSalvar.PAIS = processado.pais;
  camposParaSalvar.REGIAO = processado.regiao;
  camposParaSalvar.REGISTRO_TELEFONE = hojeBr();

  if(dados.STATUS_COMERCIAL) camposParaSalvar.REGISTRO_STATUS_COMERCIAL = hojeBr();
  if(dados.STATUS_COMPORTAMENTAL) camposParaSalvar.REGISTRO_STATUS_COMPORTAMENTAL = hojeBr();

  const colunasSupabase = dadosAppParaSupabase(camposParaSalvar);

  const { data, error } = await supabaseClient
    .from("contatos")
    .insert(colunasSupabase)
    .select()
    .single();

  if(error) throw new Error(error.message);

  await sincronizarOpcoesNovas(dados);

  return { sucesso: true, linha: data.id, aba };
}

/* ============================================================
 * apiExcluir
 * ============================================================ */
async function apiExcluir(aba, linha){
  const { error } = await supabaseClient
    .from("contatos")
    .delete()
    .eq("id", linha);

  if(error) throw new Error(error.message);
  return { sucesso: true };
}

/* ============================================================
 * apiAgendar / apiCancelarAgendamento
 * ------------------------------------------------------------
 * IMPORTANTE (limitação atual): esta versão grava a data/hora do
 * agendamento na tabela e marca STATUS_COMERCIAL como "AGENDADO",
 * exatamente como antes. O que ainda NÃO faz (por enquanto) é criar
 * o evento correspondente no Google Agenda de verdade — isso exige
 * uma integração à parte com a API do Google Calendar (login OAuth
 * do Google direto no navegador), que fica como um próximo passo
 * separado. Por ora, o agendamento fica salvo e visível no app
 * normalmente, só não aparece automaticamente na sua Agenda do
 * Google.
 * ============================================================ */
async function apiAgendar(aba, linha, dataHora){
  const dataFormatada = isoParaBrDataHora(dataHora);

  const { error } = await supabaseClient
    .from("contatos")
    .update({
      agendamento: new Date(dataHora).toISOString(),
      status_comercial: "AGENDADO",
      data_status_comercial: hojeBrIso()
    })
    .eq("id", linha);

  if(error) throw new Error(error.message);

  return { sucesso: true, agendamento: { dataHora: dataFormatada } };
}

async function apiCancelarAgendamento(aba, linha){
  const { error } = await supabaseClient
    .from("contatos")
    .update({ agendamento: null, id_evento: null })
    .eq("id", linha);

  if(error) throw new Error(error.message);
  return { sucesso: true };
}

function hojeBrIso(){
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

/* ============================================================
 * apiManutencao — as funções de manutenção que existiam no Apps
 * Script eram específicas do Google Sheets (colunas coloridas,
 * validações de lista, gatilhos). No Supabase a maior parte não
 * se aplica mais. Mantém o menu funcionando, com mensagens
 * explicando o que mudou em cada caso.
 * ============================================================ */
async function apiManutencao(funcao){
  const mensagens = {
    processarPendentes: "Não é mais necessário: no Supabase, cada contato já é processado (telefone, WhatsApp, fuso/país/região) no momento em que é criado ou editado.",
    atualizarDuplicados: "A marcação colorida de duplicados era um recurso do Google Sheets. No app, contatos duplicados aparecem automaticamente na tela de detalhes de cada contato.",
    reordenarDuplicados: "Não se aplica mais: no Supabase não há conceito de 'linhas' fisicamente ordenadas — os duplicados são sempre encontrados automaticamente por telefone, onde quer que estejam.",
    sincronizarAgenda: "A sincronização com o Google Agenda ainda está pendente de implementação nesta nova versão (ver observação no botão de Agendamento).",
    corrigirAgendamentosAntigos: "Não se aplica: no Supabase a data/hora do agendamento é guardada num formato próprio que nunca perde a hora.",
    verificarColunas: "Não se aplica: no Supabase as colunas são fixas na estrutura da tabela, não há como ficar com nome errado.",
    verificarAbas: "Não se aplica: no Supabase existe só uma tabela 'contatos', não há múltiplas abas para verificar.",
    diagnosticoCache: "Não se aplica: o app agora lê direto do Supabase, sem cache intermediário."
  };

  return { sucesso: true, mensagem: mensagens[funcao] || "Função não disponível nesta versão." };
}
