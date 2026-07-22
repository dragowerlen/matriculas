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
 * apiOpcoes — valores distintos usados nos <select>/filtros.
 * Usa a função "valores_distintos" criada no politicas-rls.sql.
 * ============================================================ */
async function apiOpcoes(){
  async function distintos(coluna){
    const { data, error } = await supabaseClient.rpc("valores_distintos", { nome_coluna: coluna });
    if(error) throw new Error(error.message);
    const valores = (data || []).map(r => r.valor).filter(v => v !== null && v !== "");
    return [""].concat(valores.sort());
  }

  const [statusComercial, statusComportamental, profissao, referidos] = await Promise.all([
    distintos("status_comercial"),
    distintos("status_contato"),
    distintos("profissao"),
    distintos("referido")
  ]);

  return { statusComercial, statusComportamental, profissao, referidos };
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

  return { sucesso: true };
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
