import React from 'react';
import { useStore } from '../store/useStore';

export const Header: React.FC = () => {
  const { project, resetProject } = useStore();

  const handleSave = () => {
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          useStore.getState().setProject(data);
        } catch (err) {
          alert('ファイルの読み込みに失敗しました');
        }
      }
    };
    input.click();
  };

  return (
    <header className="h-12 bg-gray-800 text-white flex items-center justify-between px-4 shadow-lg">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold">かげち君</h1>
        <span className="text-sm text-gray-300">{project.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleLoad}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          読込
        </button>
        <button
          onClick={handleSave}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
        >
          保存
        </button>
        <button
          onClick={() => {
            if (confirm('プロジェクトをリセットしますか？')) {
              resetProject();
            }
          }}
          className="px-3 py-1 bg-red-700 hover:bg-red-600 rounded text-sm"
        >
          リセット
        </button>
      </div>
    </header>
  );
};
