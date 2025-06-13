import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

serviceWorkerRegistration.register();

const convidadosIniciais = [
  { id: 1, nome: "Ana Clara", rg: "123456789", confirmado: false },
  { id: 2, nome: "Bruno Silva", rg: "987654321", confirmado: false },
  { id: 3, nome: "Carlos Souza", rg: "456789123", confirmado: false },
  { id: 4, nome: "Daniela Lima", rg: "321654987", confirmado: false },
  { id: 5, nome: "Eduardo Ramos", rg: "654123789", confirmado: false },
];

const STORAGE_KEY = "convidados-checklist";

export default function App() {
  const [convidados, setConvidados] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : convidadosIniciais;
    } catch {
      return convidadosIniciais;
    }
  });

  const [busca, setBusca] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convidados));
  }, [convidados]);

  const toggleConfirmado = useCallback((id) => {
    setConvidados((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, confirmado: !c.confirmado } : c
      )
    );
  }, []);

  const resetarLista = () => {
    setConvidados(convidadosIniciais);
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportarLista = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(convidados);
    XLSX.utils.book_append_sheet(wb, ws, "Convidados");
    XLSX.writeFile(wb, "convidados.xlsx");
  };

  const importarLista = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    const normalizarObjeto = (obj) => {
      const chavesNormalizadas = {};
      for (const chave in obj) {
        chavesNormalizadas[chave.trim().toLowerCase()] = obj[chave];
      }
      return chavesNormalizadas;
    };

    if (file.name.endsWith(".json")) {
      reader.onload = (e) => {
        try {
          const lista = JSON.parse(e.target.result);
          if (Array.isArray(lista)) {
            setConvidados(lista);
          } else {
            alert("Arquivo JSON inválido");
          }
        } catch {
          alert("Erro ao ler o arquivo JSON");
        }
      };
      reader.readAsText(file);
    } else if (file.name.endsWith(".xlsx")) {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const lista = rows.map((row, i) => {
          const r = normalizarObjeto(row);
          return {
            id: i + 1,
            nome: r["nome"] || "Sem Nome",
            rg: r["rg"] || "",
            confirmado: r["confirmado"] === true || r["confirmado"] === "true",
          };
        });
        setConvidados(lista);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato de arquivo não suportado. Use .json ou .xlsx");
    }
  };

  const listaFiltrada = busca
    ? convidados.filter((c) =>
        c.nome.toLowerCase().includes(busca.toLowerCase())
      )
    : convidados;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Lista de Convidados</h1>

      <div className="flex gap-2 mb-4">
        <button
          onClick={resetarLista}
          className="bg-red-500 text-white px-4 py-2 rounded-lg shadow"
        >
          Resetar Lista
        </button>
        <button
          onClick={exportarLista}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow"
        >
          Exportar
        </button>
        <label className="bg-green-500 text-white px-4 py-2 rounded-lg shadow cursor-pointer">
          Importar
          <input
            type="file"
            accept=".json, .xlsx"
            onChange={importarLista}
            className="hidden"
          />
        </label>
      </div>

      <input
        type="text"
        placeholder="Buscar nome..."
        className="mb-6 px-4 py-2 w-full max-w-md rounded-lg border border-gray-300 shadow-sm"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <ul className="w-full max-w-md space-y-3">
        {listaFiltrada.map((convidado) => (
          <li
            key={convidado.id}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
          >
            <div>
              <div className="font-semibold">{convidado.nome}</div>
              <div className="text-sm text-gray-500">RG: {convidado.rg}</div>
            </div>
            <input
              type="checkbox"
              checked={convidado.confirmado}
              onChange={() => toggleConfirmado(convidado.id)}
              className="w-5 h-5"
            />
          </li>
        ))}

        {listaFiltrada.length === 0 && (
          <li className="text-center text-gray-500">Nenhum convidado encontrado</li>
        )}
      </ul>
    </div>
  );
}
