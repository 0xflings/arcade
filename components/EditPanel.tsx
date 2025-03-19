'use client'
import React, { useState } from 'react';

// Define a type for the game data
interface GameData {
  entities?: any[];
  physics?: any;
  level?: any;
  code?: any;
  [key: string]: any;
}

interface EditPanelProps {
  gameData: GameData;
  onSave: (updatedData: GameData) => void;
  onCancel: () => void;
  className?: string;
}

export default function EditPanel({
  gameData,
  onSave,
  onCancel,
  className = ''
}: EditPanelProps) {
  // Tabs for different editing sections
  const [activeTab, setActiveTab] = useState<'entities' | 'physics' | 'level' | 'code'>('entities');
  
  // Initialize edited data from game data
  const [editedData, setEditedData] = useState<GameData & { _original: GameData }>({
    ...gameData,
    // Keep original reference for comparison
    _original: gameData
  });
  
  // Track if there are unsaved changes
  const hasChanges = () => {
    // Deep comparison logic would be needed for a real implementation
    return JSON.stringify(editedData) !== JSON.stringify(editedData._original);
  };
  
  // Handle saving changes
  const handleSave = () => {
    const { _original, ...dataToSave } = editedData;
    onSave(dataToSave);
  };
  
  // Handle changing a property value
  const handlePropertyChange = (path: string, value: any) => {
    setEditedData((prev: GameData & { _original: GameData }) => {
      // Create nested property paths
      const pathArray = path.split('.');
      const result = { ...prev };
      let current = result;
      
      // Navigate to the nested property
      for (let i = 0; i < pathArray.length - 1; i++) {
        if (!current[pathArray[i]]) current[pathArray[i]] = {};
        current = current[pathArray[i]];
      }
      
      // Set the value
      current[pathArray[pathArray.length - 1]] = value;
      return result;
    });
  };
  
  // Handle entity selection
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  
  // Get selected entity
  const selectedEntity = selectedEntityId && editedData.entities ? 
    editedData.entities.find((e: any) => e.id === selectedEntityId) : null;
  
  // Render entity editor
  const renderEntityEditor = () => {
    if (!editedData.entities || !Array.isArray(editedData.entities)) {
      return <div className="p-4 text-zinc-400">No entities found in game data.</div>;
    }
    
    return (
      <div className="flex h-full">
        {/* Entity List Sidebar */}
        <div className="w-48 border-r border-zinc-700 overflow-y-auto">
          <h3 className="p-2 font-medium text-sm text-zinc-300 bg-zinc-800">Game Entities</h3>
          <ul>
            {editedData.entities.map((entity: any) => (
              <li key={entity.id}>
                <button 
                  className={`w-full text-left p-2 text-sm ${
                    selectedEntityId === entity.id
                      ? 'bg-purple-700 text-white'
                      : 'text-zinc-300 hover:bg-zinc-700'
                  }`}
                  onClick={() => setSelectedEntityId(entity.id)}
                >
                  {entity.name || entity.type || entity.id}
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Entity Properties */}
        <div className="flex-1 overflow-y-auto">
          {selectedEntity ? (
            <div className="p-4">
              <h3 className="font-medium text-white mb-4">
                Edit {selectedEntity.name || selectedEntity.type || selectedEntity.id}
              </h3>
              
              {/* General Properties */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">General Properties</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Type</label>
                    <input 
                      type="text" 
                      value={selectedEntity.type || ''} 
                      onChange={(e) => {
                        if (!editedData.entities) return;
                        const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                        if (entityIndex === -1) return;
                        handlePropertyChange(
                          `entities[${entityIndex}].type`, 
                          e.target.value
                        );
                      }}
                      className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">X Position</label>
                    <input 
                      type="number" 
                      value={selectedEntity.x || 0} 
                      onChange={(e) => {
                        if (!editedData.entities) return;
                        const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                        if (entityIndex === -1) return;
                        handlePropertyChange(
                          `entities[${entityIndex}].x`, 
                          parseFloat(e.target.value)
                        );
                      }}
                      className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Y Position</label>
                    <input 
                      type="number" 
                      value={selectedEntity.y || 0} 
                      onChange={(e) => {
                        if (!editedData.entities) return;
                        const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                        if (entityIndex === -1) return;
                        handlePropertyChange(
                          `entities[${entityIndex}].y`, 
                          parseFloat(e.target.value)
                        );
                      }}
                      className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Physics Properties */}
              {selectedEntity.physics && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Physics Properties</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Has Gravity</label>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedEntity.physics.hasGravity || false} 
                          onChange={(e) => {
                            if (!editedData.entities) return;
                            const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                            if (entityIndex === -1) return;
                            handlePropertyChange(
                              `entities[${entityIndex}].physics.hasGravity`, 
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500 border-zinc-600 bg-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Is Static</label>
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedEntity.physics.isStatic || false} 
                          onChange={(e) => {
                            if (!editedData.entities) return;
                            const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                            if (entityIndex === -1) return;
                            handlePropertyChange(
                              `entities[${entityIndex}].physics.isStatic`, 
                              e.target.checked
                            );
                          }}
                          className="form-checkbox h-4 w-4 text-purple-600 rounded focus:ring-purple-500 border-zinc-600 bg-zinc-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sprite Properties */}
              {selectedEntity.sprite && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Sprite Properties</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Image Source</label>
                      <input 
                        type="text" 
                        value={selectedEntity.sprite.src || ''} 
                        onChange={(e) => {
                          if (!editedData.entities) return;
                          const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                          if (entityIndex === -1) return;
                          handlePropertyChange(
                            `entities[${entityIndex}].sprite.src`, 
                            e.target.value
                          );
                        }}
                        className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Width</label>
                      <input 
                        type="number" 
                        value={selectedEntity.sprite.width || 0} 
                        onChange={(e) => {
                          if (!editedData.entities) return;
                          const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                          if (entityIndex === -1) return;
                          handlePropertyChange(
                            `entities[${entityIndex}].sprite.width`, 
                            parseInt(e.target.value)
                          );
                        }}
                        className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Height</label>
                      <input 
                        type="number" 
                        value={selectedEntity.sprite.height || 0} 
                        onChange={(e) => {
                          if (!editedData.entities) return;
                          const entityIndex = editedData.entities.findIndex((e: any) => e.id === selectedEntityId);
                          if (entityIndex === -1) return;
                          handlePropertyChange(
                            `entities[${entityIndex}].sprite.height`,
                            parseInt(e.target.value)
                          );
                        }}
                        className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-zinc-400">
              Select an entity to edit
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Render physics editor
  const renderPhysicsEditor = () => {
    if (!editedData.physics) {
      return <div className="p-4 text-zinc-400">No physics settings found in game data.</div>;
    }
    
    return (
      <div className="p-4">
        <h3 className="font-medium text-white mb-4">Physics Settings</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Global Physics</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Gravity</label>
                <input 
                  type="number" 
                  value={editedData.physics.gravity || 0} 
                  onChange={(e) => handlePropertyChange('physics.gravity', parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Friction</label>
                <input 
                  type="number" 
                  value={editedData.physics.friction || 0} 
                  onChange={(e) => handlePropertyChange('physics.friction', parseFloat(e.target.value))}
                  step="0.01"
                  className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render level editor
  const renderLevelEditor = () => {
    if (!editedData.level) {
      return <div className="p-4 text-zinc-400">No level data found in game data.</div>;
    }
    
    return (
      <div className="p-4">
        <h3 className="font-medium text-white mb-4">Level Editor</h3>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-2">Level Properties</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Width</label>
                <input 
                  type="number" 
                  value={editedData.level.width || 0} 
                  onChange={(e) => handlePropertyChange('level.width', parseInt(e.target.value))}
                  className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Height</label>
                <input 
                  type="number" 
                  value={editedData.level.height || 0} 
                  onChange={(e) => handlePropertyChange('level.height', parseInt(e.target.value))}
                  className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Background Color</label>
                <input 
                  type="text" 
                  value={editedData.level.backgroundColor || '#000000'} 
                  onChange={(e) => handlePropertyChange('level.backgroundColor', e.target.value)}
                  className="w-full bg-zinc-700 text-white px-3 py-2 rounded border border-zinc-600 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render code editor
  const renderCodeEditor = () => {
    if (!editedData.code) {
      return <div className="p-4 text-zinc-400">No code found in game data.</div>;
    }
    
    return (
      <div className="p-4">
        <h3 className="font-medium text-white mb-4">Code Editor</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Game Logic</label>
            <textarea 
              value={editedData.code.gameLogic || ''} 
              onChange={(e) => handlePropertyChange('code.gameLogic', e.target.value)}
              className="w-full bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 focus:outline-none focus:border-purple-500 font-mono text-sm h-64"
              spellCheck="false"
            />
          </div>
          
          <div className="bg-zinc-800 rounded p-3 text-xs text-zinc-400">
            <p>Note: Direct code editing is for advanced users. Changes may affect game behavior in unexpected ways.</p>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg flex flex-col h-full ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-zinc-700">
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'entities' 
              ? 'bg-zinc-800 text-white border-b-2 border-purple-500' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          onClick={() => setActiveTab('entities')}
        >
          Entities
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'physics' 
              ? 'bg-zinc-800 text-white border-b-2 border-purple-500' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          onClick={() => setActiveTab('physics')}
        >
          Physics
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'level' 
              ? 'bg-zinc-800 text-white border-b-2 border-purple-500' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          onClick={() => setActiveTab('level')}
        >
          Level
        </button>
        <button
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'code' 
              ? 'bg-zinc-800 text-white border-b-2 border-purple-500' 
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'entities' && renderEntityEditor()}
        {activeTab === 'physics' && renderPhysicsEditor()}
        {activeTab === 'level' && renderLevelEditor()}
        {activeTab === 'code' && renderCodeEditor()}
      </div>
      
      {/* Action Buttons */}
      <div className="border-t border-zinc-700 p-4 flex justify-between">
        <button
          className="px-4 py-2 text-sm text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-2 text-sm text-white rounded ${
            hasChanges()
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-zinc-600 cursor-not-allowed'
          }`}
          onClick={handleSave}
          disabled={!hasChanges()}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
} 