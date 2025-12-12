import React from 'react';
import { ProcessedFile } from '../types';
import { FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface DataPreviewProps {
  files: ProcessedFile[];
}

export const DataPreview: React.FC<DataPreviewProps> = ({ files }) => {
  if (files.length === 0) return null;

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Dados Extraídos
        </h3>
        <span className="text-sm text-slate-500">
          {files.filter(f => f.status === 'completed').length} de {files.length} processados
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">CPF</th>
              <th className="px-6 py-3 font-medium">Cargo</th>
              <th className="px-6 py-3 font-medium">Admissão</th>
              <th className="px-6 py-3 font-medium">Salário</th>
              <th className="px-6 py-3 font-medium">Documento Original</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                   {item.status === 'processing' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                   {item.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                   {item.status === 'error' && (
                     <div className="group relative">
                        <AlertCircle className="w-5 h-5 text-red-500 cursor-help" />
                        <span className="absolute left-6 top-0 w-32 p-2 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          {item.errorMessage || "Erro desconhecido"}
                        </span>
                     </div>
                   )}
                   {item.status === 'pending' && <div className="w-2 h-2 rounded-full bg-slate-300 ml-1.5" />}
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  {item.data?.nome || <span className="text-slate-400 italic">--</span>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.data?.cpf || <span className="text-slate-400 italic">--</span>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.data?.cargo || <span className="text-slate-400 italic">--</span>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.data?.data_admissao || <span className="text-slate-400 italic">--</span>}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {item.data?.salario || <span className="text-slate-400 italic">--</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <img 
                      src={item.previewUrl} 
                      alt="Miniatura" 
                      className="w-10 h-10 object-cover rounded border border-slate-200"
                    />
                    <span className="text-xs text-slate-500 truncate max-w-[100px]" title={item.file.name}>
                      {item.file.name}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};