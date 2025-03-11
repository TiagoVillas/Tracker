"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";
import { Download, FileText, Table, X } from "lucide-react";

interface ExportFinanceDataProps {
  transactions: Transaction[];
  currentMonth: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportFinanceData({
  transactions,
  currentMonth,
  isOpen,
  onClose
}: ExportFinanceDataProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeDates, setIncludeDates] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Formatar data
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR');
  };

  // Formatar categoria
  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Exportar para CSV
  const exportToCSV = () => {
    // Cabeçalho do CSV
    let headers = ['Descrição', 'Tipo', 'Valor'];
    if (includeCategories) headers.push('Categoria');
    if (includeDates) headers.push('Data');
    
    // Linhas de dados
    const rows = transactions.map(transaction => {
      const row = [
        `"${transaction.description}"`, // Adicionar aspas para evitar problemas com vírgulas
        transaction.type === 'income' ? 'Receita' : 'Despesa',
        transaction.amount.toString().replace('.', ',') // Formato brasileiro
      ];
      
      if (includeCategories) {
        row.push(formatCategory(transaction.category));
      }
      
      if (includeDates) {
        row.push(formatDate(transaction.date));
      }
      
      return row.join(',');
    });
    
    // Montar o conteúdo do CSV
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Criar e baixar o arquivo
    downloadFile(csvContent, `financas-${currentMonth}.csv`, 'text/csv');
  };

  // Exportar para JSON
  const exportToJSON = () => {
    // Filtrar campos conforme seleção do usuário
    const filteredData = transactions.map(transaction => {
      const item: any = {
        description: transaction.description,
        type: transaction.type,
        amount: transaction.amount
      };
      
      if (includeCategories) {
        item.category = transaction.category;
      }
      
      if (includeDates) {
        item.date = formatDate(transaction.date);
      }
      
      return item;
    });
    
    // Criar e baixar o arquivo
    const jsonContent = JSON.stringify(filteredData, null, 2);
    downloadFile(jsonContent, `financas-${currentMonth}.json`, 'application/json');
  };

  // Função genérica para download de arquivo
  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Iniciar exportação
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'csv') {
        exportToCSV();
      } else {
        exportToJSON();
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Ocorreu um erro ao exportar os dados. Por favor, tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 sm:mx-0 sm:h-10 sm:w-10">
                <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  Exportar Dados Financeiros
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Selecione o formato e as opções para exportar seus dados financeiros.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Exportação
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="exportFormat"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={() => setExportFormat('csv')}
                    />
                    <span className="ml-2 flex items-center text-gray-700 dark:text-gray-300">
                      <Table className="h-4 w-4 mr-1" />
                      CSV (Excel)
                    </span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-indigo-600"
                      name="exportFormat"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={() => setExportFormat('json')}
                    />
                    <span className="ml-2 flex items-center text-gray-700 dark:text-gray-300">
                      <FileText className="h-4 w-4 mr-1" />
                      JSON
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opções de Exportação
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="form-checkbox text-indigo-600"
                      checked={includeCategories}
                      onChange={(e) => setIncludeCategories(e.target.checked)}
                    />
                    <span className="ml-2 text-gray-700 dark:text-gray-300">
                      Incluir categorias
                    </span>
                  </label>
                  <div>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox text-indigo-600"
                        checked={includeDates}
                        onChange={(e) => setIncludeDates(e.target.checked)}
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        Incluir datas
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {transactions.length} transações serão exportadas do período {currentMonth.replace('-', '/')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 