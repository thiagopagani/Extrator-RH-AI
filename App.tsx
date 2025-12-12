import React, { useState, useCallback } from 'react';
import { UploadCloud, FileSpreadsheet, Play, Trash2, Github, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { extractDataFromImage, fileToBase64 } from './services/geminiService';
import { ProcessedFile, ProcessingStatus } from './types';
import { DataPreview } from './components/DataPreview';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [globalStatus, setGlobalStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: ProcessedFile[] = Array.from(event.target.files).map((file: File) => ({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleProcess = async () => {
    setGlobalStatus(ProcessingStatus.PROCESSING);
    
    // Process files sequentially
    // Filtramos apenas pendentes ou com erro para tentar novamente
    const filesToProcess = files.filter(f => f.status === 'pending' || f.status === 'error');
    
    if (filesToProcess.length === 0) {
        setGlobalStatus(ProcessingStatus.IDLE);
        return;
    }

    for (let i = 0; i < filesToProcess.length; i++) {
        const fileItem = filesToProcess[i];
        
        // Atualiza status para processando
        setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'processing', errorMessage: undefined } : f));

        try {
            const base64 = await fileToBase64(fileItem.file);
            const data = await extractDataFromImage(base64, fileItem.file.type);
            
            setFiles(prev => prev.map(f => f.id === fileItem.id ? { ...f, status: 'completed', data } : f));
            
            // DELAY DE SEGURANÇA AUMENTADO
            // 12 segundos garante max 5 requisições/minuto (bem abaixo do limite de 15 RPM do plano free)
            if (i < filesToProcess.length - 1) {
              await wait(12000); 
            }

        } catch (error: any) {
            const errorMsg = error.toString().toLowerCase();
            const isQuotaError = errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('exceeded');
            
            setFiles(prev => prev.map(f => f.id === fileItem.id ? { 
                ...f, 
                status: 'error', 
                errorMessage: isQuotaError ? 'Limite de Cota Atingido' : 'Falha na leitura' 
            } : f));

            if (isQuotaError) {
                // Se atingiu a cota, faz uma pausa LONGA de 60 segundos antes de tentar o próximo arquivo da fila
                // Isso ajuda a "esfriar" a API Key
                await wait(60000);
            } else {
                // Se for outro erro, espera 2s apenas
                await wait(2000);
            }
        }
    }
    
    setGlobalStatus(ProcessingStatus.COMPLETED);
  };

  const handleExport = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.data);
    if (completedFiles.length === 0) return;

    // Mapping exact column names as requested by the user
    const dataToExport = completedFiles.map(f => ({
      'Empresa': f.data?.empregador,
      'Matricula': f.data?.numero_ordem,
      'Nome': f.data?.nome,
      'Endereço': f.data?.endereco_logradouro,
      'Nº': f.data?.endereco_numero,
      'Bairro': f.data?.endereco_bairro,
      'Cidade': f.data?.endereco_cidade,
      'UF': f.data?.endereco_uf,
      'CEP': f.data?.endereco_cep,
      'Pai': f.data?.filiacao_pai,
      'Mãe': f.data?.filiacao_mae,
      'Data Nasc': f.data?.data_nascimento,
      'Nacionalidade': f.data?.nacionalidade,
      'Est. Civil': f.data?.estado_civil,
      'Local Nasc': f.data?.local_nascimento,
      'UF Nasc': f.data?.local_nascimento_uf,
      'CTPS': f.data?.ctps,
      'Reservista': f.data?.reservista,
      'CPF': f.data?.cpf,
      'RG': f.data?.rg,
      'Tit. Eleitor': f.data?.titulo_eleitor,
      'PIS': f.data?.pis,
      'Admissao': f.data?.data_admissao,
      'Salario': f.data?.salario,
      'CBO': f.data?.cbo,
      'esocial': f.data?.matricula_esocial,
      'Email': f.data?.email,
      'Telefone': f.data?.telefone,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados Funcionários");
    XLSX.writeFile(workbook, "Extracao_RH.xlsx");
  };

  const handleClear = () => {
    setFiles([]);
    setGlobalStatus(ProcessingStatus.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Extrator RH <span className="text-blue-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="hidden sm:inline">Powered by Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Intro Section */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Transforme Fichas em Planilhas</h2>
          <p className="text-lg text-slate-600">
            Faça upload de imagens ou PDFs de fichas de funcionários. 
            A IA extrairá dados completos no layout padrão da empresa.
          </p>
          {globalStatus === ProcessingStatus.PROCESSING && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg inline-flex items-center gap-2 text-sm border border-blue-100">
               <AlertTriangle className="w-4 h-4" />
               <span>Modo Seguro Ativado: Processando lentamente para evitar bloqueio do Google (1 arquivo a cada 12s)</span>
            </div>
          )}
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex-1 w-full">
            <label 
              htmlFor="file-upload" 
              className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-blue-500 hover:bg-slate-50 focus:outline-none"
            >
              <div className="flex flex-col items-center space-y-2">
                <UploadCloud className="w-8 h-8 text-slate-400" />
                <span className="font-medium text-slate-600">
                  Clique para upload ou arraste arquivos
                </span>
                <span className="text-xs text-slate-500">Suporta .PNG, .JPG, .JPEG (e PDF convertidos)</span>
              </div>
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                accept="image/png, image/jpeg, image/jpg, application/pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
              onClick={handleProcess}
              disabled={files.length === 0 || globalStatus === ProcessingStatus.PROCESSING}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all
                ${files.length === 0 || globalStatus === ProcessingStatus.PROCESSING 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}`}
            >
              <Play className="w-5 h-5" />
              {globalStatus === ProcessingStatus.PROCESSING ? 'Processando...' : 'Iniciar Extração'}
            </button>
            
            <div className="flex gap-2">
                <button
                onClick={handleExport}
                disabled={files.filter(f => f.status === 'completed').length === 0}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium border transition-colors
                    ${files.filter(f => f.status === 'completed').length === 0
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                    : 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:border-green-300'}`}
                >
                <FileSpreadsheet className="w-4 h-4" />
                Baixar Excel
                </button>

                <button
                onClick={handleClear}
                disabled={files.length === 0}
                className="px-4 py-2.5 rounded-lg font-medium text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors"
                title="Limpar tudo"
                >
                <Trash2 className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <DataPreview files={files} />
        
        {files.length === 0 && (
           <div className="text-center py-20 opacity-40">
                <div className="mx-auto w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-10 h-10 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Nenhum documento carregado ainda</p>
           </div> 
        )}

      </main>
    </div>
  );
};

export default App;