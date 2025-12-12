import { GoogleGenAI, Type, Schema } from "@google/genai";
import { EmployeeData } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const employeeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    empregador: { type: Type.STRING, description: "Nome do Empregador ou Empresa" },
    numero_ordem: { type: Type.STRING, description: "Número de Ordem ou Matrícula Interna" },
    nome: { type: Type.STRING, description: "Nome completo do empregado" },
    endereco_logradouro: { type: Type.STRING, description: "Endereço (Rua, Av, Logradouro)" },
    endereco_numero: { type: Type.STRING, description: "Número do endereço" },
    endereco_bairro: { type: Type.STRING, description: "Bairro" },
    endereco_cidade: { type: Type.STRING, description: "Cidade" },
    endereco_uf: { type: Type.STRING, description: "Estado (UF) do endereço" },
    endereco_cep: { type: Type.STRING, description: "CEP" },
    filiacao_pai: { type: Type.STRING, description: "Nome do Pai (Filiação)" },
    filiacao_mae: { type: Type.STRING, description: "Nome da Mãe (Filiação)" },
    data_nascimento: { type: Type.STRING, description: "Data de Nascimento (DD/MM/AAAA)" },
    idade: { type: Type.STRING, description: "Idade" },
    nacionalidade: { type: Type.STRING, description: "Nacionalidade" },
    estado_civil: { type: Type.STRING, description: "Estado Civil" },
    local_nascimento: { type: Type.STRING, description: "Local de Nascimento (Cidade)" },
    local_nascimento_uf: { type: Type.STRING, description: "UF do Local de Nascimento" },
    ctps: { type: Type.STRING, description: "CTPS (Número e Série)" },
    reservista: { type: Type.STRING, description: "Carteira de Reservista" },
    categoria: { type: Type.STRING, description: "Categoria (Reservista ou CNH)" },
    cpf: { type: Type.STRING, description: "CPF" },
    rg: { type: Type.STRING, description: "RG" },
    titulo_eleitor: { type: Type.STRING, description: "Título de Eleitor" },
    pis: { type: Type.STRING, description: "PIS/PASEP" },
    data_admissao: { type: Type.STRING, description: "Data de Admissão" },
    cargo: { type: Type.STRING, description: "Cargo" },
    salario: { type: Type.STRING, description: "Salário" },
    cbo: { type: Type.STRING, description: "CBO" },
    matricula_esocial: { type: Type.STRING, description: "Matrícula eSocial" },
    email: { type: Type.STRING, description: "Endereço de Email" },
    telefone: { type: Type.STRING, description: "Telefone ou Celular de contato" },
  },
  required: ["nome", "cpf"],
};

export const extractDataFromImage = async (base64Data: string, mimeType: string): Promise<EmployeeData> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Analise esta ficha de registro de empregado. Extraia TODOS os dados possíveis mapeando para os campos do JSON.
            
            Atenção aos detalhes:
            - Separe o endereço em logradouro, número, bairro, cidade, UF e CEP.
            - Separe filiação pai e mãe.
            - Busque por 'Matrícula eSocial' ou apenas 'Matrícula'.
            - Busque por informações de contato como 'Email' e 'Telefone'.
            - Se o campo for manuscrito, faça a melhor transcrição possível.
            - Normalize datas para DD/MM/AAAA.
            - Normalize valores monetários para R$ 0,00.
            
            Se um campo não existir no documento, deixe vazio.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: employeeSchema,
        temperature: 0.1, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("Sem resposta da IA");

    return JSON.parse(text) as EmployeeData;
  } catch (error) {
    console.error("Erro ao processar documento:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};